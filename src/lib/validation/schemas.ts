import { z } from "zod";
import { QUESTION_BY_ID } from "@/lib/diagnostic/questions";
import { NICHE_IDS } from "@/lib/diagnostic/niches";

export const industrySchema = z.enum(["cre_owner", "multifamily", "other"]);
export const unitsBandSchema = z.enum(["1_5", "6_25", "26_100", "101_500", "over_500"]);
export const revenueBandSchema = z.enum(["under_10m", "10m_25m", "25m_50m", "50m_100m", "100m_250m", "over_250m"]);
export const employeeBandSchema = z.enum(["1_24", "25_49", "50_99", "100_249", "250_499", "500_plus"]);
export const premiumBandSchema = z.enum(["under_50k", "50k_150k", "150k_500k", "500k_1m", "over_1m", "prefer_not"]);
export const incumbentTenureSchema = z.enum(["under_2", "2_5", "6_10", "over_10", "unknown"]);
export const roleSchema = z.enum(["owner_ceo", "cfo_finance", "coo_operations", "risk_hr", "controller_manager", "other"]);
export const primaryConcernSchema = z.enum([
  "premium_increases",
  "property_valuation",
  "coverage_gaps",
  "claims_handling",
  "vendor_tenant_requirements",
  "cyber",
  "growth_changes",
  "broker_service",
  "not_sure",
]);
export const majorLineSchema = z.enum([
  "property",
  "flood",
  "general_liability",
  "umbrella",
  "workers_comp",
  "commercial_auto",
  "cyber",
  "epli",
  "d_and_o",
  "environmental",
  "professional",
  "crime",
  "builders_risk",
]);

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const startProfileSchema = z.object({
  companyName: trimmed(120),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code"),
  industry: industrySchema,
  niche: z.enum(NICHE_IDS).optional(),
  unitsBand: unitsBandSchema.optional(),
  employeeBand: employeeBandSchema,
  revenueBand: revenueBandSchema,
  // Anti-bot: honeypot must be empty; form must have been open for a minimum time.
  website_confirm: z.string().max(0).optional(),
  startedAt: z.number().int().optional(),
});

export const profileUpdateSchema = z
  .object({
    renewalMonth: z.number().int().min(1).max(12).optional(),
    incumbentTenure: incumbentTenureSchema.optional(),
    majorLines: z.array(majorLineSchema).max(12).optional(),
    premiumBand: premiumBandSchema.optional(),
    recentAcquisitionOrNewLocation: z.boolean().optional(),
    primaryConcern: primaryConcernSchema.optional(),
    willingToSharePolicies: z.enum(["yes", "maybe", "no"]).optional(),
    ownsBuildings: z.boolean().optional(),
    usesThirdPartyManager: z.boolean().optional(),
    usesSubcontractors: z.boolean().optional(),
    hasResidentialTenants: z.boolean().optional(),
    employeesAboveThreshold: z.boolean().optional(),
    hasOutsideInvestors: z.boolean().optional(),
    environmentalExposures: z.boolean().optional(),
  })
  .strict();

export const answerValueSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal("unknown")]);

export const answersSchema = z
  .record(z.string(), answerValueSchema)
  .refine((rec) => Object.keys(rec).every((id) => id in QUESTION_BY_ID), { message: "Unknown question id" });

export const answerRequestSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: answersSchema.optional(),
  profile: profileUpdateSchema.optional(),
});

export const completeRequestSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: answersSchema.optional(),
  profile: profileUpdateSchema.optional(),
});

export const leadCaptureSchema = z.object({
  token: z.string().min(16).max(64),
  email: z.string().trim().email().max(200),
  name: trimmed(120).optional(),
  role: roleSchema.optional(),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  consentReport: z.literal(true),
  consentMarketing: z.boolean().default(false),
  workshopRequested: z.boolean().default(false),
  preferredContact: z.enum(["email", "phone"]).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const enrichmentRequestSchema = z.object({
  website: z.string().trim().max(200).optional(),
  zip: z.string().trim().max(10).optional(),
  industry: industrySchema.optional(),
  companyName: z.string().trim().max(120).optional(),
});

export const producerBriefRequestSchema = z.object({
  leadId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  format: z.enum(["json", "markdown"]).default("json"),
  useAi: z.boolean().default(false),
});

export const dispositionSchema = z.enum([
  "new",
  "reviewing",
  "contacted",
  "workshop_scheduled",
  "workshop_completed",
  "opportunity",
  "not_a_fit",
  "unresponsive",
  "do_not_contact",
]);

export const leadUpdateSchema = z
  .object({
    disposition: dispositionSchema.optional(),
    followUpOwner: z.string().trim().max(120).optional(),
    reviewNotes: z.string().trim().max(4000).optional(),
    licensedReviewCompleted: z.boolean().optional(),
  })
  .strict();

export const crmWebhookSchema = z.object({
  event: z.enum(["lead.updated", "lead.disposition", "ping"]),
  leadId: z.string().uuid().optional(),
  externalId: z.string().max(120).optional(),
  disposition: dispositionSchema.optional(),
  followUpOwner: z.string().max(120).optional(),
});

export const emailWebhookSchema = z.object({
  type: z.string().max(80),
  data: z
    .object({
      email_id: z.string().optional(),
      to: z.union([z.string(), z.array(z.string())]).optional(),
      created_at: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export type StartProfileInput = z.infer<typeof startProfileSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type Disposition = z.infer<typeof dispositionSchema>;
