import "server-only";
import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  EMPLOYEE_BAND_LABELS,
  INCUMBENT_TENURE_LABELS,
  MAJOR_LINE_LABELS,
  MONTH_LABELS,
  PREMIUM_BAND_LABELS,
  PRIMARY_CONCERN_LABELS,
  REVENUE_BAND_LABELS,
  ROLE_LABELS,
  getIndustry,
} from "@/lib/diagnostic";
import { env } from "./env";
import { hmacSign } from "./crypto";
import type { AssessmentRecord, LeadRecord } from "./repo/types";

/**
 * CRM-ready lead payload. Flat, snake_case keys so it maps cleanly to
 * Salesforce/HubSpot field mappings or a CSV import without transformation.
 */
export function buildCrmPayload(lead: LeadRecord, assessment: AssessmentRecord, briefUrl: string) {
  const p = assessment.profile;
  const r = assessment.result;
  const industry = getIndustry(p.industry);
  const categoryScores = Object.fromEntries(
    CATEGORY_IDS.map((c) => [
      `score_${c}`,
      r?.scores.categories.find((x) => x.category === c)?.score ?? null,
    ]),
  );
  return {
    event: "lead.captured",
    lead_id: lead.id,
    assessment_id: assessment.id,
    captured_at: lead.createdAt,
    company_name: p.companyName,
    website: assessment.enrichment?.domain ?? p.website ?? null,
    industry: industry.label,
    industry_code: industry.id,
    naics_candidates: industry.naics.join(";"),
    zip: p.zip,
    territory: assessment.enrichment?.territoryLabel ?? null,
    employee_band: EMPLOYEE_BAND_LABELS[p.employeeBand],
    revenue_band: REVENUE_BAND_LABELS[p.revenueBand],
    contact_name: lead.name,
    contact_email: lead.email,
    contact_phone: lead.phone,
    contact_role: lead.role ? ROLE_LABELS[lead.role] : null,
    preferred_contact: lead.preferredContact,
    renewal_month: p.renewalMonth ? MONTH_LABELS[p.renewalMonth - 1] : null,
    months_until_renewal: r?.renewal.monthsUntilRenewal ?? null,
    incumbent_tenure: p.incumbentTenure ? INCUMBENT_TENURE_LABELS[p.incumbentTenure] : null,
    major_lines: (p.majorLines ?? []).map((l) => MAJOR_LINE_LABELS[l]).join(";"),
    premium_band: p.premiumBand ? PREMIUM_BAND_LABELS[p.premiumBand] : null,
    recent_change: p.recentAcquisitionOrNewLocation ?? null,
    primary_concern: p.primaryConcern ? PRIMARY_CONCERN_LABELS[p.primaryConcern] : null,
    willing_to_share_documents: p.willingToSharePolicies ?? null,
    overall_score: r?.scores.overall ?? null,
    overall_band: r?.scores.overallBand ?? null,
    confidence_score: r?.scores.confidence ?? null,
    ...categoryScores,
    critical_flags: (r?.scores.criticalFlags ?? []).map((f) => CATEGORY_LABELS[f.category].short).join(";"),
    critical_flag_count: r?.scores.criticalFlags.length ?? 0,
    top_findings: (r?.findings ?? []).map((f) => f.title).join(" | "),
    lead_quality_score: lead.leadScore.total,
    lead_quality_tier: lead.leadScore.tier,
    workshop_requested: lead.workshopRequested,
    consent_report: lead.consentReport,
    consent_marketing: lead.consentMarketing,
    consent_at: lead.consentAt,
    consent_text_version: lead.consentTextVersion,
    partner_code: assessment.attribution.partnerCode ?? null,
    entry_module: assessment.attribution.module ?? "marketready",
    utm_source: assessment.attribution.source ?? null,
    utm_campaign: assessment.attribution.campaign ?? null,
    utm_medium: assessment.attribution.medium ?? null,
    disposition: lead.disposition,
    follow_up_owner: lead.followUpOwner,
    licensed_review_completed: lead.licensedReviewCompleted,
    producer_brief_url: briefUrl,
  };
}

export type CrmPayload = ReturnType<typeof buildCrmPayload>;

/** Posts the payload to the configured CRM webhook with an HMAC signature. */
export async function dispatchToCrm(payload: CrmPayload): Promise<"sent" | "failed" | "skipped"> {
  if (!env.crmWebhookUrl) {
    console.info(`[crm:skipped] lead=${payload.lead_id} company="${payload.company_name}"`);
    return "skipped";
  }
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.crmWebhookSecret) headers["X-MarketReady-Signature"] = hmacSign(body, env.crmWebhookSecret);
  try {
    const res = await fetch(env.crmWebhookUrl, { method: "POST", headers, body });
    if (!res.ok) {
      console.error(`[crm:failed] ${res.status}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[crm:failed]", err);
    return "failed";
  }
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV fallback export for manual CRM import. */
export function payloadsToCsv(payloads: CrmPayload[]): string {
  if (payloads.length === 0) return "";
  const keys = Object.keys(payloads[0]);
  const lines = [keys.join(",")];
  for (const p of payloads) lines.push(keys.map((k) => csvCell((p as Record<string, unknown>)[k])).join(","));
  return lines.join("\n");
}
