import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AssessmentRecord, EventRecord, LeadListItem, LeadRecord, Repository } from "./types";

/**
 * Supabase Postgres repository. Uses the service-role key server-side only;
 * prospects never talk to Supabase directly. Row-level security (see
 * supabase/migrations) blocks anonymous access entirely and limits
 * authenticated producers to read/update.
 */

type AssessmentRow = {
  id: string;
  results_token: string;
  status: AssessmentRecord["status"];
  profile: AssessmentRecord["profile"];
  answers: AssessmentRecord["answers"];
  result: AssessmentRecord["result"];
  enrichment: AssessmentRecord["enrichment"];
  attribution: AssessmentRecord["attribution"];
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type LeadRow = {
  id: string;
  assessment_id: string;
  email: string;
  name: string | null;
  role: LeadRecord["role"];
  phone: string | null;
  consent_report: boolean;
  consent_marketing: boolean;
  consent_at: string;
  consent_text_version: string;
  workshop_requested: boolean;
  preferred_contact: LeadRecord["preferredContact"];
  prospect_notes: string | null;
  lead_score: LeadRecord["leadScore"];
  disposition: LeadRecord["disposition"];
  follow_up_owner: string | null;
  review_notes: string | null;
  licensed_review_completed: boolean;
  crm_sync_status: LeadRecord["crmSyncStatus"];
  crm_external_id: string | null;
  email_status: LeadRecord["emailStatus"];
  created_at: string;
  updated_at: string;
};

function assessmentFromRow(r: AssessmentRow): AssessmentRecord {
  return {
    id: r.id,
    resultsToken: r.results_token,
    status: r.status,
    profile: r.profile,
    answers: r.answers ?? {},
    result: r.result,
    enrichment: r.enrichment,
    attribution: r.attribution ?? {},
    ipHash: r.ip_hash,
    userAgent: r.user_agent,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at,
  };
}

function assessmentToRow(a: Partial<AssessmentRecord>): Partial<AssessmentRow> {
  const row: Partial<AssessmentRow> = {};
  if (a.resultsToken !== undefined) row.results_token = a.resultsToken;
  if (a.status !== undefined) row.status = a.status;
  if (a.profile !== undefined) row.profile = a.profile;
  if (a.answers !== undefined) row.answers = a.answers;
  if (a.result !== undefined) row.result = a.result;
  if (a.enrichment !== undefined) row.enrichment = a.enrichment;
  if (a.attribution !== undefined) row.attribution = a.attribution;
  if (a.ipHash !== undefined) row.ip_hash = a.ipHash;
  if (a.userAgent !== undefined) row.user_agent = a.userAgent;
  if (a.completedAt !== undefined) row.completed_at = a.completedAt;
  return row;
}

function leadFromRow(r: LeadRow): LeadRecord {
  return {
    id: r.id,
    assessmentId: r.assessment_id,
    email: r.email,
    name: r.name,
    role: r.role,
    phone: r.phone,
    consentReport: r.consent_report,
    consentMarketing: r.consent_marketing,
    consentAt: r.consent_at,
    consentTextVersion: r.consent_text_version,
    workshopRequested: r.workshop_requested,
    preferredContact: r.preferred_contact,
    prospectNotes: r.prospect_notes,
    leadScore: r.lead_score,
    disposition: r.disposition,
    followUpOwner: r.follow_up_owner,
    reviewNotes: r.review_notes,
    licensedReviewCompleted: r.licensed_review_completed,
    crmSyncStatus: r.crm_sync_status,
    crmExternalId: r.crm_external_id,
    emailStatus: r.email_status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function leadToRow(l: Partial<LeadRecord>): Partial<LeadRow> {
  const row: Partial<LeadRow> = {};
  if (l.assessmentId !== undefined) row.assessment_id = l.assessmentId;
  if (l.email !== undefined) row.email = l.email;
  if (l.name !== undefined) row.name = l.name;
  if (l.role !== undefined) row.role = l.role;
  if (l.phone !== undefined) row.phone = l.phone;
  if (l.consentReport !== undefined) row.consent_report = l.consentReport;
  if (l.consentMarketing !== undefined) row.consent_marketing = l.consentMarketing;
  if (l.consentAt !== undefined) row.consent_at = l.consentAt;
  if (l.consentTextVersion !== undefined) row.consent_text_version = l.consentTextVersion;
  if (l.workshopRequested !== undefined) row.workshop_requested = l.workshopRequested;
  if (l.preferredContact !== undefined) row.preferred_contact = l.preferredContact;
  if (l.prospectNotes !== undefined) row.prospect_notes = l.prospectNotes;
  if (l.leadScore !== undefined) row.lead_score = l.leadScore;
  if (l.disposition !== undefined) row.disposition = l.disposition;
  if (l.followUpOwner !== undefined) row.follow_up_owner = l.followUpOwner;
  if (l.reviewNotes !== undefined) row.review_notes = l.reviewNotes;
  if (l.licensedReviewCompleted !== undefined) row.licensed_review_completed = l.licensedReviewCompleted;
  if (l.crmSyncStatus !== undefined) row.crm_sync_status = l.crmSyncStatus;
  if (l.crmExternalId !== undefined) row.crm_external_id = l.crmExternalId;
  if (l.emailStatus !== undefined) row.email_status = l.emailStatus;
  return row;
}

export class SupabaseRepository implements Repository {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private fail(context: string, error: { message: string } | null): never {
    throw new Error(`[supabase] ${context}: ${error?.message ?? "unknown error"}`);
  }

  async createAssessment(input: Omit<AssessmentRecord, "id" | "createdAt" | "updatedAt">) {
    const { data, error } = await this.client
      .from("assessments")
      .insert(assessmentToRow(input))
      .select("*")
      .single<AssessmentRow>();
    if (error || !data) this.fail("createAssessment", error);
    return assessmentFromRow(data);
  }
  async getAssessment(id: string) {
    const { data, error } = await this.client.from("assessments").select("*").eq("id", id).maybeSingle<AssessmentRow>();
    if (error) this.fail("getAssessment", error);
    return data ? assessmentFromRow(data) : null;
  }
  async getAssessmentByToken(token: string) {
    const { data, error } = await this.client
      .from("assessments")
      .select("*")
      .eq("results_token", token)
      .maybeSingle<AssessmentRow>();
    if (error) this.fail("getAssessmentByToken", error);
    return data ? assessmentFromRow(data) : null;
  }
  async updateAssessment(id: string, patch: Partial<AssessmentRecord>) {
    const { data, error } = await this.client
      .from("assessments")
      .update({ ...assessmentToRow(patch), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single<AssessmentRow>();
    if (error || !data) this.fail("updateAssessment", error);
    return assessmentFromRow(data);
  }

  async createLead(input: Omit<LeadRecord, "id" | "createdAt" | "updatedAt">) {
    const { data, error } = await this.client.from("leads").insert(leadToRow(input)).select("*").single<LeadRow>();
    if (error || !data) this.fail("createLead", error);
    return leadFromRow(data);
  }
  async getLead(id: string) {
    const { data, error } = await this.client.from("leads").select("*").eq("id", id).maybeSingle<LeadRow>();
    if (error) this.fail("getLead", error);
    return data ? leadFromRow(data) : null;
  }
  async getLeadByAssessment(assessmentId: string) {
    const { data, error } = await this.client
      .from("leads")
      .select("*")
      .eq("assessment_id", assessmentId)
      .maybeSingle<LeadRow>();
    if (error) this.fail("getLeadByAssessment", error);
    return data ? leadFromRow(data) : null;
  }
  async updateLead(id: string, patch: Partial<LeadRecord>) {
    const { data, error } = await this.client
      .from("leads")
      .update({ ...leadToRow(patch), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single<LeadRow>();
    if (error || !data) this.fail("updateLead", error);
    return leadFromRow(data);
  }
  async listLeads(opts?: { limit?: number }): Promise<LeadListItem[]> {
    const { data, error } = await this.client
      .from("leads")
      .select("*, assessments(*)")
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 200);
    if (error) this.fail("listLeads", error);
    const rows = (data ?? []) as Array<LeadRow & { assessments: AssessmentRow | null }>;
    return rows
      .filter((r) => r.assessments)
      .map((r) => ({ lead: leadFromRow(r), assessment: assessmentFromRow(r.assessments!) }));
  }

  async recordEvent(input: Omit<EventRecord, "id" | "createdAt">) {
    const { error } = await this.client.from("events").insert({
      assessment_id: input.assessmentId,
      lead_id: input.leadId,
      name: input.name,
      properties: input.properties,
    });
    if (error) console.error("[supabase] recordEvent failed", error.message);
  }
  async listEvents(assessmentId: string) {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: true });
    if (error) this.fail("listEvents", error);
    return (data ?? []).map((e) => ({
      id: e.id,
      assessmentId: e.assessment_id,
      leadId: e.lead_id,
      name: e.name,
      properties: e.properties ?? {},
      createdAt: e.created_at,
    }));
  }
}
