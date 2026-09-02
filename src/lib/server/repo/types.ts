import type { Answers, AssessmentProfile, DiagnosticResult, LeadScoreBreakdown, Role } from "@/lib/diagnostic";
import type { Disposition } from "@/lib/validation/schemas";

export type AssessmentStatus = "in_progress" | "completed";

export interface Attribution {
  partnerCode?: string | null;
  /** Entry module (marketready | renewal | contracts | claims). */
  module?: string | null;
  source?: string | null;
  campaign?: string | null;
  medium?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
}

export interface AssessmentRecord {
  id: string;
  /** Unguessable token used in the public results URL. */
  resultsToken: string;
  status: AssessmentStatus;
  profile: AssessmentProfile;
  answers: Answers;
  result: DiagnosticResult | null;
  enrichment: EnrichmentRecord | null;
  attribution: Attribution;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface EnrichmentRecord {
  domain: string | null;
  territory: string;
  territoryLabel: string;
  naics: string[];
  signals: EnrichmentSignal[];
  /** ZIP centroid used for location-context lookups. */
  geo?: { lat: number; lon: number; city: string | null; state: string | null } | null;
  /** External providers that ran successfully at completion. */
  providersRun?: string[];
  computedAt: string;
}

export interface EnrichmentSignal {
  source: string;
  label: string;
  value: string;
  /** Always shown next to public-record matches. */
  caveat?: string;
  /** Link to the public source so matches are transparent and verifiable. */
  sourceUrl?: string;
}

export interface LeadRecord {
  id: string;
  assessmentId: string;
  email: string;
  name: string | null;
  role: Role | null;
  phone: string | null;
  consentReport: boolean;
  consentMarketing: boolean;
  consentAt: string;
  consentTextVersion: string;
  workshopRequested: boolean;
  preferredContact: "email" | "phone" | null;
  prospectNotes: string | null;
  leadScore: LeadScoreBreakdown;
  disposition: Disposition;
  followUpOwner: string | null;
  reviewNotes: string | null;
  licensedReviewCompleted: boolean;
  crmSyncStatus: "pending" | "sent" | "failed" | "skipped";
  crmExternalId: string | null;
  emailStatus: "pending" | "sent" | "delivered" | "bounced" | "failed" | "skipped";
  createdAt: string;
  updatedAt: string;
}

export interface EventRecord {
  id: string;
  assessmentId: string | null;
  leadId: string | null;
  name: string;
  properties: Record<string, unknown>;
  createdAt: string;
}

export interface LeadListItem {
  lead: LeadRecord;
  assessment: AssessmentRecord;
}

export interface Repository {
  createAssessment(input: Omit<AssessmentRecord, "id" | "createdAt" | "updatedAt">): Promise<AssessmentRecord>;
  getAssessment(id: string): Promise<AssessmentRecord | null>;
  getAssessmentByToken(token: string): Promise<AssessmentRecord | null>;
  updateAssessment(id: string, patch: Partial<AssessmentRecord>): Promise<AssessmentRecord>;
  listAssessments(opts?: { limit?: number }): Promise<AssessmentRecord[]>;

  createLead(input: Omit<LeadRecord, "id" | "createdAt" | "updatedAt">): Promise<LeadRecord>;
  getLead(id: string): Promise<LeadRecord | null>;
  getLeadByAssessment(assessmentId: string): Promise<LeadRecord | null>;
  updateLead(id: string, patch: Partial<LeadRecord>): Promise<LeadRecord>;
  listLeads(opts?: { limit?: number }): Promise<LeadListItem[]>;

  recordEvent(input: Omit<EventRecord, "id" | "createdAt">): Promise<void>;
  listEvents(assessmentId: string): Promise<EventRecord[]>;
}
