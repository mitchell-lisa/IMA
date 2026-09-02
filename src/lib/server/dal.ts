import "server-only";
import { cookies, headers } from "next/headers";
import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  MONTH_LABELS,
  QUESTIONS,
  computeLeadScore,
  computeRenewalContext,
  getIndustry,
  nicheLabel,
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
import { enrichCompany, enrichExternal } from "./enrichment";
import { env } from "./env";
import { renderResultsPdf } from "./pdf";
import { getRepository } from "./repo";
import { postTeamsLeadAlert } from "./teams";
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
  /** Entry module the prospect came through; drives results-page emphasis. */
  module: string;
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
      module: parsed.module ?? null,
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
    niche: input.niche,
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
  await track("assessment_started", { industry: input.industry, niche: input.niche ?? null, partner: attribution.partnerCode ?? null, module: attribution.module ?? "marketready" }, { assessmentId: rec.id });
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
  // External public-data enrichment runs after the result is stored so a slow
  // or failing source never delays the prospect's results page.
  void enrichAfterCompletion(assessmentId, rec.enrichment, finalProfile);
  await track(
    "assessment_completed",
    { overall: result.scores.overall, confidence: result.scores.confidence, criticalFlags: result.scores.criticalFlags.length, findings: result.findings.map((f) => f.id) },
    { assessmentId },
  );
  return { token: rec.resultsToken };
}

async function enrichAfterCompletion(assessmentId: string, base: AssessmentRecord["enrichment"], profile: AssessmentProfile) {
  try {
    const start = base ?? (await enrichCompany({ website: profile.website, zip: profile.zip, industry: profile.industry, companyName: profile.companyName }));
    const enriched = await enrichExternal(start, {
      website: profile.website,
      zip: profile.zip,
      industry: profile.industry,
      companyName: profile.companyName,
      hasVehicles: profile.hasVehicles,
    });
    if (enriched !== start) {
      await getRepository().updateAssessment(assessmentId, { enrichment: enriched });
      await track("enrichment_completed", { providers: enriched.providersRun ?? [], signals: enriched.signals.length }, { assessmentId });
    }
  } catch (err) {
    console.error("[dal] external enrichment failed", err);
  }
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
    module: rec.attribution.module ?? "marketready",
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
  await Promise.all([sendProspectResult(lead, rec), notifyProducer(lead, rec), syncToCrm(lead, rec), notifyTeams(lead, rec)]);

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

async function notifyTeams(lead: LeadRecord, rec: AssessmentRecord) {
  const result = rec.result!;
  const status = await postTeamsLeadAlert({
    companyName: rec.profile.companyName,
    industry: getIndustry(rec.profile.industry).shortLabel,
    leadTier: lead.leadScore.tier,
    leadScore: lead.leadScore.total,
    overall: result.scores.overall,
    criticalFlags: result.scores.criticalFlags.length,
    renewal: rec.profile.renewalMonth ? `${MONTH_LABELS[rec.profile.renewalMonth - 1]} (${result.renewal.monthsUntilRenewal} months out)` : "not provided",
    workshopRequested: lead.workshopRequested,
    partner: rec.attribution.partnerCode ?? null,
    module: rec.attribution.module ?? "marketready",
    briefUrl: briefUrl(lead.id),
  });
  if (status !== "skipped") await track("teams_alert", { status }, { assessmentId: rec.id, leadId: lead.id });
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
  niche: string | null;
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
  module: string;
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
    niche: nicheLabel(p.niche),
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
    module: assessment.attribution.module ?? "marketready",
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

// ---------------------------------------------------------------- all submissions + funnel (week 4: inspect every submission)

export interface SubmissionRow {
  assessmentId: string;
  createdAt: string;
  completedAt: string | null;
  status: AssessmentRecord["status"];
  company: string;
  industry: string;
  niche: string | null;
  territory: string | null;
  zip: string;
  module: string;
  partner: string | null;
  source: string | null;
  answered: number;
  applicable: number;
  overall: number | null;
  confidence: number | null;
  criticalFlags: number;
  findings: string[];
  hasLead: boolean;
  leadId: string | null;
  leadTier: string | null;
}

export interface FunnelMetrics {
  started: number;
  completed: number;
  captured: number;
  workshopRequested: number;
  completionRate: number | null;
  captureRate: number | null;
  byModule: Record<string, { started: number; completed: number; captured: number }>;
  byPartner: Record<string, { started: number; completed: number; captured: number }>;
  byIndustry: Record<string, { started: number; completed: number; captured: number }>;
}

export async function listSubmissions(): Promise<{ rows: SubmissionRow[]; funnel: FunnelMetrics }> {
  const repo = getRepository();
  const [assessments, leads] = await Promise.all([repo.listAssessments({ limit: 1000 }), repo.listLeads({ limit: 1000 })]);
  const leadByAssessment = new Map(leads.map((l) => [l.assessment.id, l.lead]));
  const rows: SubmissionRow[] = assessments.map((a) => {
    const lead = leadByAssessment.get(a.id) ?? null;
    const applicable = a.result?.scores.applicableQuestionIds.length ?? Object.keys(a.answers).length;
    return {
      assessmentId: a.id,
      createdAt: a.createdAt,
      completedAt: a.completedAt,
      status: a.status,
      company: a.profile.companyName,
      industry: getIndustry(a.profile.industry).shortLabel,
      niche: nicheLabel(a.profile.niche),
      territory: a.enrichment?.territoryLabel ?? null,
      zip: a.profile.zip,
      module: a.attribution.module ?? "marketready",
      partner: a.attribution.partnerCode ?? null,
      source: a.attribution.source ?? null,
      answered: Object.keys(a.answers).length,
      applicable,
      overall: a.result?.scores.overall ?? null,
      confidence: a.result?.scores.confidence ?? null,
      criticalFlags: a.result?.scores.criticalFlags.length ?? 0,
      findings: (a.result?.findings ?? []).map((f) => f.title),
      hasLead: Boolean(lead),
      leadId: lead?.id ?? null,
      leadTier: lead?.leadScore.tier ?? null,
    };
  });

  const bump = (rec: Record<string, { started: number; completed: number; captured: number }>, key: string, r: SubmissionRow) => {
    rec[key] ??= { started: 0, completed: 0, captured: 0 };
    rec[key].started += 1;
    if (r.status === "completed") rec[key].completed += 1;
    if (r.hasLead) rec[key].captured += 1;
  };
  const funnel: FunnelMetrics = {
    started: rows.length,
    completed: rows.filter((r) => r.status === "completed").length,
    captured: rows.filter((r) => r.hasLead).length,
    workshopRequested: leads.filter((l) => l.lead.workshopRequested).length,
    completionRate: null,
    captureRate: null,
    byModule: {},
    byPartner: {},
    byIndustry: {},
  };
  funnel.completionRate = funnel.started ? Math.round((funnel.completed / funnel.started) * 100) : null;
  funnel.captureRate = funnel.completed ? Math.round((funnel.captured / funnel.completed) * 100) : null;
  for (const r of rows) {
    bump(funnel.byModule, r.module, r);
    bump(funnel.byPartner, r.partner ?? "direct", r);
    bump(funnel.byIndustry, r.industry, r);
  }
  return { rows, funnel };
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

/**
 * Anonymized per-question export for scoring-distribution analysis (Analyst
 * agent). No company names, contacts, or free text; one row per assessment.
 */
export async function exportAnswersCsv(): Promise<string> {
  const assessments = await getRepository().listAssessments({ limit: 5000 });
  const leads = await getRepository().listLeads({ limit: 5000 });
  const captured = new Set(leads.map((l) => l.assessment.id));
  const questionIds = QUESTIONS.map((q) => q.id);
  const header = [
    "assessment_id",
    "created_at",
    "status",
    "industry",
    "niche",
    "employee_band",
    "revenue_band",
    "territory",
    "module",
    "partner",
    "captured",
    "workshop_requested",
    "overall",
    "confidence",
    "critical_flags",
    ...CATEGORY_IDS.map((c) => `score_${c}`),
    ...questionIds,
  ];
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const a of assessments) {
    const lead = leads.find((l) => l.assessment.id === a.id)?.lead;
    const row = [
      a.id,
      a.createdAt,
      a.status,
      a.profile.industry,
      a.profile.niche ?? "",
      a.profile.employeeBand,
      a.profile.revenueBand,
      a.enrichment?.territory ?? "",
      a.attribution.module ?? "marketready",
      a.attribution.partnerCode ?? "",
      captured.has(a.id) ? 1 : 0,
      lead?.workshopRequested ? 1 : 0,
      a.result?.scores.overall ?? "",
      a.result?.scores.confidence ?? "",
      a.result?.scores.criticalFlags.length ?? "",
      ...CATEGORY_IDS.map((c) => a.result?.scores.categories.find((x) => x.category === c)?.score ?? ""),
      ...questionIds.map((id) => (id in a.answers ? a.answers[id] : "")),
    ];
    lines.push(row.map(cell).join(","));
  }
  return lines.join("\n");
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
