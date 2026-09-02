import "server-only";
import { cookies, headers } from "next/headers";
import {
  CATEGORY_LABELS,
  MONTH_LABELS,
  computeLeadScore,
  computeRenewalContext,
  getIndustry,
  runDiagnostic,
} from "@/lib/diagnostic";
import type { Answers, AssessmentProfile, DiagnosticResult } from "@/lib/diagnostic";
import { buildProducerBrief, briefToMarkdown, type ProducerBrief } from "@/lib/brief/producerBrief";
import type { LeadCaptureInput, LeadUpdateInput, ProfileUpdateInput, StartProfileInput } from "@/lib/validation/schemas";
import { ATTRIBUTION_COOKIE } from "@/middleware";
import { aiSummariesAvailable, generateAiSummary } from "./ai";
import { buildCrmPayload, dispatchToCrm, payloadsToCsv } from "./crm";
import { hashIp, randomToken } from "./crypto";
import { prospectResultEmail, producerAlertEmail, sendEmail } from "./email";
import { enrichCompany } from "./enrichment";
import { env } from "./env";
import { renderResultsPdf } from "./pdf";
import { getRepository } from "./repo";
import type { AssessmentRecord, Attribution, LeadListItem, LeadRecord } from "./repo/types";

export const CONSENT_TEXT_VERSION = "2026-09-v1";

// ---------------------------------------------------------------- DTOs
// Public DTOs deliberately omit answers, IP hashes, and attribution so the
// results page cannot leak more than the prospect already knows.

export interface PublicResultDto {
  token: string;
  companyName: string;
  industryLabel: string;
  industryNote: string;
  completedAt: string | null;
  result: DiagnosticResult;
  emailCaptured: boolean;
  workshopRequested: boolean;
}

export interface AssessmentSessionDto {
  assessmentId: string;
  resultsToken: string;
  status: AssessmentRecord["status"];
  profile: AssessmentProfile;
  answers: Answers;
}

export class NotFoundError extends Error {
  constructor(what = "Not found") {
    super(what);
    this.name = "NotFoundError";
  }
}

// ---------------------------------------------------------------- helpers

async function readAttribution(): Promise<Attribution> {
  try {
    const store = await cookies();
    const raw = store.get(ATTRIBUTION_COOKIE)?.value;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Attribution;
    return {
      partnerCode: parsed.partnerCode ?? null,
      source: parsed.source ?? null,
      campaign: parsed.campaign ?? null,
      medium: parsed.medium ?? null,
      referrer: parsed.referrer ?? null,
      landingPath: parsed.landingPath ?? null,
    };
  } catch {
    return {};
  }
}

async function requestMeta(): Promise<{ ipHash: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
    return { ipHash: hashIp(ip), userAgent: h.get("user-agent")?.slice(0, 200) ?? null };
  } catch {
    return { ipHash: null, userAgent: null };
  }
}

export async function track(name: string, props: Record<string, unknown> = {}, ids: { assessmentId?: string | null; leadId?: string | null } = {}) {
  await getRepository().recordEvent({
    assessmentId: ids.assessmentId ?? null,
    leadId: ids.leadId ?? null,
    name,
    properties: props,
  });
}

function toSession(a: AssessmentRecord): AssessmentSessionDto {
  return { assessmentId: a.id, resultsToken: a.resultsToken, status: a.status, profile: a.profile, answers: a.answers };
}

function resultsUrl(token: string): string {
  return `${env.appUrl}/results/${token}`;
}

function briefUrl(leadId: string): string {
  return `${env.appUrl}/producer/leads/${leadId}`;
}

// ---------------------------------------------------------------- prospect flow

export async function startAssessment(input: StartProfileInput): Promise<AssessmentSessionDto> {
  const repo = getRepository();
  const attribution = await readAttribution();
  const meta = await requestMeta();
  const profile: AssessmentProfile = {
    companyName: input.companyName,
    website: input.website || undefined,
    zip: input.zip,
    industry: input.industry,
    employeeBand: input.employeeBand,
    revenueBand: input.revenueBand,
    employeesAboveThreshold: employeesAbove(input.employeeBand, getIndustry(input.industry).employeeThreshold),
  };
  const enrichment = await enrichCompany({ website: input.website, zip: input.zip, industry: input.industry, companyName: input.companyName });
  const rec = await repo.createAssessment({
    resultsToken: randomToken(24),
    status: "in_progress",
    profile,
    answers: {},
    result: null,
    enrichment,
    attribution,
    ipHash: meta.ipHash,
    userAgent: meta.userAgent,
    completedAt: null,
  });
  await track("assessment_started", { industry: input.industry, partner: attribution.partnerCode ?? null }, { assessmentId: rec.id });
  return toSession(rec);
}

function employeesAbove(band: AssessmentProfile["employeeBand"], threshold: number): boolean {
  const lower: Record<AssessmentProfile["employeeBand"], number> = { "1_24": 1, "25_49": 25, "50_99": 50, "100_249": 100, "250_499": 250, "500_plus": 500 };
  return lower[band] >= threshold;
}

export async function saveAnswers(assessmentId: string, answers?: Answers, profile?: ProfileUpdateInput): Promise<AssessmentSessionDto> {
  const repo = getRepository();
  const rec = await repo.getAssessment(assessmentId);
  if (!rec) throw new NotFoundError("Assessment not found");
  if (rec.status === "completed") throw new Error("Assessment already completed");
  const nextProfile = { ...rec.profile, ...(profile ?? {}) };
  const nextAnswers = { ...rec.answers, ...(answers ?? {}) };
  const updated = await repo.updateAssessment(assessmentId, { profile: nextProfile, answers: nextAnswers });
  await track("assessment_progress", { answered: Object.keys(nextAnswers).length }, { assessmentId });
  return toSession(updated);
}

export async function completeAssessment(assessmentId: string, answers?: Answers, profile?: ProfileUpdateInput): Promise<{ token: string }> {
  const repo = getRepository();
  const rec = await repo.getAssessment(assessmentId);
  if (!rec) throw new NotFoundError("Assessment not found");
  const finalProfile = { ...rec.profile, ...(profile ?? {}) };
  const finalAnswers = { ...rec.answers, ...(answers ?? {}) };
  if (rec.status === "completed") return { token: rec.resultsToken };
  const result = runDiagnostic(finalAnswers, finalProfile);
  await repo.updateAssessment(assessmentId, {
    profile: finalProfile,
    answers: finalAnswers,
    result,
    status: "completed",
    completedAt: new Date().toISOString(),
  });
  await track(
    "assessment_completed",
    { overall: result.scores.overall, confidence: result.scores.confidence, criticalFlags: result.scores.criticalFlags.length, findings: result.findings.map((f) => f.id) },
    { assessmentId },
  );
  return { token: rec.resultsToken };
}

export async function getPublicResult(token: string): Promise<PublicResultDto | null> {
  const repo = getRepository();
  const rec = await repo.getAssessmentByToken(token);
  if (!rec || rec.status !== "completed" || !rec.result) return null;
  const lead = await repo.getLeadByAssessment(rec.id);
  const industry = getIndustry(rec.profile.industry);
  return {
    token,
    companyName: rec.profile.companyName,
    industryLabel: industry.label,
    industryNote: industry.marketNote,
    completedAt: rec.completedAt,
    result: rec.result,
    emailCaptured: Boolean(lead),
    workshopRequested: lead?.workshopRequested ?? false,
  };
}

export async function getSession(assessmentId: string): Promise<AssessmentSessionDto | null> {
  const rec = await getRepository().getAssessment(assessmentId);
  return rec ? toSession(rec) : null;
}

// ---------------------------------------------------------------- lead capture

export async function captureLead(input: LeadCaptureInput): Promise<{ leadId: string; tier: string }> {
  const repo = getRepository();
  const rec = await repo.getAssessmentByToken(input.token);
  if (!rec || rec.status !== "completed" || !rec.result) throw new NotFoundError("Results not found");

  const existing = await repo.getLeadByAssessment(rec.id);
  const renewal = computeRenewalContext(rec.profile.renewalMonth);
  const leadScore = computeLeadScore({
    profile: rec.profile,
    scores: rec.result.scores,
    role: input.role ?? existing?.role ?? null,
    emailCaptured: true,
    workshopRequested: input.workshopRequested || (existing?.workshopRequested ?? false),
    monthsUntilRenewal: renewal.monthsUntilRenewal,
  });

  let lead: LeadRecord;
  if (existing) {
    lead = await repo.updateLead(existing.id, {
      email: input.email,
      name: input.name ?? existing.name,
      role: input.role ?? existing.role,
      phone: input.phone || existing.phone,
      consentMarketing: existing.consentMarketing || input.consentMarketing,
      workshopRequested: existing.workshopRequested || input.workshopRequested,
      preferredContact: input.preferredContact ?? existing.preferredContact,
      prospectNotes: input.notes ?? existing.prospectNotes,
      leadScore,
    });
  } else {
    lead = await repo.createLead({
      assessmentId: rec.id,
      email: input.email,
      name: input.name ?? null,
      role: input.role ?? null,
      phone: input.phone || null,
      consentReport: true,
      consentMarketing: input.consentMarketing,
      consentAt: new Date().toISOString(),
      consentTextVersion: CONSENT_TEXT_VERSION,
      workshopRequested: input.workshopRequested,
      preferredContact: input.preferredContact ?? null,
      prospectNotes: input.notes ?? null,
      leadScore,
      disposition: "new",
      followUpOwner: null,
      reviewNotes: null,
      licensedReviewCompleted: false,
      crmSyncStatus: "pending",
      crmExternalId: null,
      emailStatus: "pending",
    });
  }

  await track(existing ? "lead_updated" : "lead_captured", { tier: leadScore.tier, workshop: lead.workshopRequested, consentMarketing: lead.consentMarketing }, { assessmentId: rec.id, leadId: lead.id });

  // Side effects: prospect email with PDF, producer alert, CRM dispatch.
  // Failures are recorded but never block the prospect.
  await Promise.all([sendProspectResult(lead, rec), notifyProducer(lead, rec), syncToCrm(lead, rec)]);

  return { leadId: lead.id, tier: leadScore.tier };
}

async function sendProspectResult(lead: LeadRecord, rec: AssessmentRecord) {
  const repo = getRepository();
  const result = rec.result!;
  try {
    const pdf = await renderResultsPdf(rec, { resultsUrl: resultsUrl(rec.resultsToken) });
    const msg = prospectResultEmail({
      companyName: rec.profile.companyName,
      resultsUrl: resultsUrl(rec.resultsToken),
      overall: result.scores.overall,
      findings: result.findings.map((f) => f.title),
      checklist: result.checklist,
    });
    const sent = await sendEmail({
      to: lead.email,
      ...msg,
      attachments: [{ filename: `MarketReady-${safeFilename(rec.profile.companyName)}.pdf`, content: Buffer.from(pdf) }],
    });
    await repo.updateLead(lead.id, { emailStatus: sent.status });
    await track("prospect_email", { status: sent.status }, { assessmentId: rec.id, leadId: lead.id });
  } catch (err) {
    console.error("[dal] prospect email failed", err);
    await repo.updateLead(lead.id, { emailStatus: "failed" });
  }
}

async function notifyProducer(lead: LeadRecord, rec: AssessmentRecord) {
  if (!env.producerAlertEmail) return;
  const result = rec.result!;
  const msg = producerAlertEmail({
    companyName: rec.profile.companyName,
    leadTier: lead.leadScore.tier,
    leadScore: lead.leadScore.total,
    overall: result.scores.overall,
    renewalLabel: rec.profile.renewalMonth ? `${MONTH_LABELS[rec.profile.renewalMonth - 1]} (${result.renewal.monthsUntilRenewal} months out)` : "not provided",
    briefUrl: briefUrl(lead.id),
    workshopRequested: lead.workshopRequested,
  });
  await sendEmail({ to: env.producerAlertEmail, ...msg });
}

async function syncToCrm(lead: LeadRecord, rec: AssessmentRecord) {
  const repo = getRepository();
  const payload = buildCrmPayload(lead, rec, briefUrl(lead.id));
  const status = await dispatchToCrm(payload);
  await repo.updateLead(lead.id, { crmSyncStatus: status });
  await track("crm_sync", { status }, { assessmentId: rec.id, leadId: lead.id });
}

function safeFilename(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "report";
}

/** PDF download: only available once an email has been captured. */
export async function getResultsPdf(token: string): Promise<{ bytes: Uint8Array; filename: string } | null> {
  const repo = getRepository();
  const rec = await repo.getAssessmentByToken(token);
  if (!rec || rec.status !== "completed" || !rec.result) return null;
  const lead = await repo.getLeadByAssessment(rec.id);
  if (!lead) return null;
  const bytes = await renderResultsPdf(rec, { resultsUrl: resultsUrl(token) });
  await track("pdf_downloaded", {}, { assessmentId: rec.id, leadId: lead.id });
  return { bytes, filename: `MarketReady-${safeFilename(rec.profile.companyName)}.pdf` };
}

// ---------------------------------------------------------------- producer (authorization is enforced by callers via requireProducer)

export interface DashboardRow {
  leadId: string;
  assessmentId: string;
  createdAt: string;
  company: string;
  website: string | null;
  industry: string;
  naics: string;
  territory: string | null;
  zip: string;
  employeeBand: string;
  revenueBand: string;
  contactName: string | null;
  contactEmail: string;
  role: string | null;
  renewalMonth: string | null;
  monthsUntilRenewal: number | null;
  incumbentTenure: string | null;
  majorLines: string[];
  premiumBand: string | null;
  overall: number | null;
  categories: Record<string, number | null>;
  confidence: number;
  criticalFlags: number;
  criticalFlagLabels: string[];
  painPoints: string[];
  buyingSignals: string[];
  partner: string | null;
  source: string | null;
  consentMarketing: boolean;
  consentReport: boolean;
  workshopRequested: boolean;
  leadScore: number;
  leadTier: string;
  followUpOwner: string | null;
  disposition: string;
  licensedReviewCompleted: boolean;
  crmSyncStatus: string;
  emailStatus: string;
}

export async function listDashboardRows(): Promise<DashboardRow[]> {
  const items = await getRepository().listLeads({ limit: 500 });
  return items.map(toDashboardRow);
}

function toDashboardRow({ lead, assessment }: LeadListItem): DashboardRow {
  const p = assessment.profile;
  const r = assessment.result;
  const industry = getIndustry(p.industry);
  const buying: string[] = [];
  if (lead.workshopRequested) buying.push("Workshop requested");
  if (p.willingToSharePolicies === "yes") buying.push("Will share documents");
  if (p.incumbentTenure === "under_2") buying.push("New incumbent");
  if (r?.renewal.status === "inside_window" || r?.renewal.status === "approaching") buying.push("Renewal near");
  if (p.recentAcquisitionOrNewLocation) buying.push("Recent change");
  const pain: string[] = [];
  if (p.primaryConcern) pain.push(p.primaryConcern);
  for (const f of r?.findings ?? []) pain.push(f.id);
  return {
    leadId: lead.id,
    assessmentId: assessment.id,
    createdAt: lead.createdAt,
    company: p.companyName,
    website: assessment.enrichment?.domain ?? p.website ?? null,
    industry: industry.shortLabel,
    naics: industry.naics.join(", "),
    territory: assessment.enrichment?.territoryLabel ?? null,
    zip: p.zip,
    employeeBand: p.employeeBand,
    revenueBand: p.revenueBand,
    contactName: lead.name,
    contactEmail: lead.email,
    role: lead.role,
    renewalMonth: p.renewalMonth ? MONTH_LABELS[p.renewalMonth - 1] : null,
    monthsUntilRenewal: r?.renewal.monthsUntilRenewal ?? null,
    incumbentTenure: p.incumbentTenure ?? null,
    majorLines: p.majorLines ?? [],
    premiumBand: p.premiumBand ?? null,
    overall: r?.scores.overall ?? null,
    categories: Object.fromEntries((r?.scores.categories ?? []).map((c) => [c.category, c.score])),
    confidence: r?.scores.confidence ?? 0,
    criticalFlags: r?.scores.criticalFlags.length ?? 0,
    criticalFlagLabels: (r?.scores.criticalFlags ?? []).map((f) => CATEGORY_LABELS[f.category].short),
    painPoints: pain,
    buyingSignals: buying,
    partner: assessment.attribution.partnerCode ?? null,
    source: assessment.attribution.source ?? null,
    consentMarketing: lead.consentMarketing,
    consentReport: lead.consentReport,
    workshopRequested: lead.workshopRequested,
    leadScore: lead.leadScore.total,
    leadTier: lead.leadScore.tier,
    followUpOwner: lead.followUpOwner,
    disposition: lead.disposition,
    licensedReviewCompleted: lead.licensedReviewCompleted,
    crmSyncStatus: lead.crmSyncStatus,
    emailStatus: lead.emailStatus,
  };
}

export interface LeadDetail {
  lead: LeadRecord;
  assessment: AssessmentRecord;
  brief: ProducerBrief;
}

export async function getLeadDetail(leadId: string, opts: { useAi?: boolean } = {}): Promise<LeadDetail | null> {
  const repo = getRepository();
  const lead = await repo.getLead(leadId);
  if (!lead) return null;
  const assessment = await repo.getAssessment(lead.assessmentId);
  if (!assessment) return null;
  const brief = buildProducerBrief(lead, assessment);
  if (opts.useAi && aiSummariesAvailable()) {
    brief.aiSummary = await generateAiSummary({
      companyName: brief.snapshot.company,
      industryLabel: brief.snapshot.industry,
      overall: brief.scores.overall,
      confidence: brief.scores.confidence,
      findings: brief.opportunities.map((f) => ({ title: f.title, body: f.body })),
      strengths: (assessment.result?.strengths ?? []).map((s) => s.title),
      criticalFlags: brief.scores.criticalFlags,
      renewalMessage: brief.renewalContext.message,
      primaryConcern: brief.statedPainPoints[0] ?? null,
    });
  }
  return { lead, assessment, brief };
}

export async function getLeadDetailByAssessment(assessmentId: string, opts: { useAi?: boolean } = {}): Promise<LeadDetail | null> {
  const lead = await getRepository().getLeadByAssessment(assessmentId);
  return lead ? getLeadDetail(lead.id, opts) : null;
}

export { briefToMarkdown };

export async function updateLeadReview(leadId: string, patch: LeadUpdateInput, reviewer: string): Promise<LeadRecord> {
  const repo = getRepository();
  const lead = await repo.getLead(leadId);
  if (!lead) throw new NotFoundError("Lead not found");
  const updated = await repo.updateLead(leadId, patch);
  await track("lead_reviewed", { ...patch, reviewer }, { assessmentId: lead.assessmentId, leadId });
  return updated;
}

export async function exportLeadsCsv(): Promise<string> {
  const items = await getRepository().listLeads({ limit: 1000 });
  return payloadsToCsv(items.map(({ lead, assessment }) => buildCrmPayload(lead, assessment, briefUrl(lead.id))));
}

export async function retryCrmSync(leadId: string): Promise<string> {
  const repo = getRepository();
  const lead = await repo.getLead(leadId);
  if (!lead) throw new NotFoundError("Lead not found");
  const assessment = await repo.getAssessment(lead.assessmentId);
  if (!assessment) throw new NotFoundError("Assessment not found");
  await syncToCrm(lead, assessment);
  return (await repo.getLead(leadId))!.crmSyncStatus;
}

/** Inbound CRM webhook: update disposition/owner/external id for a lead. */
export async function applyCrmUpdate(input: { leadId?: string; externalId?: string; disposition?: LeadRecord["disposition"]; followUpOwner?: string }): Promise<boolean> {
  const repo = getRepository();
  if (!input.leadId) return false;
  const lead = await repo.getLead(input.leadId);
  if (!lead) return false;
  await repo.updateLead(lead.id, {
    ...(input.disposition ? { disposition: input.disposition } : {}),
    ...(input.followUpOwner ? { followUpOwner: input.followUpOwner } : {}),
    ...(input.externalId ? { crmExternalId: input.externalId } : {}),
  });
  await track("crm_inbound", input, { assessmentId: lead.assessmentId, leadId: lead.id });
  return true;
}

/** Inbound email-provider events (delivered / bounced). */
export async function applyEmailEvent(type: string, to: string | undefined): Promise<void> {
  if (!to) return;
  const items = await getRepository().listLeads({ limit: 1000 });
  const match = items.find((i) => i.lead.email.toLowerCase() === to.toLowerCase());
  if (!match) return;
  const status = type.includes("bounce") ? "bounced" : type.includes("delivered") ? "delivered" : null;
  if (status) await getRepository().updateLead(match.lead.id, { emailStatus: status });
  await track("email_event", { type }, { assessmentId: match.assessment.id, leadId: match.lead.id });
}
