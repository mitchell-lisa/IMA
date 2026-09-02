import type { IndustryId } from "./types";

/**
 * Real estate sub-niches. Those mapped to cre_owner or multifamily use the
 * dedicated question variants; the rest fall back to generic weighting and
 * are captured at intake so the dashboard shows demand before a module is
 * built.
 */
export type NicheId =
  | "multifamily"
  | "office"
  | "industrial_flex"
  | "retail_mixed_use"
  | "net_lease"
  | "self_storage"
  | "hospitality"
  | "senior_housing"
  | "student_housing"
  | "association"
  | "third_party_manager"
  | "developer"
  | "land"
  | "other";

export interface NicheDefinition {
  id: NicheId;
  label: string;
  /** Industry variant that best fits today. */
  industry: IndustryId;
  whyAttractive: string;
  /** Exposures a dedicated module would add, per the plan. */
  dynamicModule: string;
  hasModule: boolean;
}

export const NICHES: NicheDefinition[] = [
  { id: "multifamily", label: "Multifamily / apartment communities", industry: "multifamily", whyAttractive: "Tenant, premises, discrimination", dynamicModule: "Renters insurance, habitability, EPLI, vendor controls", hasModule: true },
  { id: "office", label: "Office", industry: "cre_owner", whyAttractive: "Property values and tenant improvements", dynamicModule: "SOV quality, lease requirements, BI, life safety", hasModule: true },
  { id: "industrial_flex", label: "Industrial / flex / warehouse", industry: "cre_owner", whyAttractive: "Large replacement values and tenant operations", dynamicModule: "SOV quality, sprinkler and roof condition, tenant contracts, environmental", hasModule: true },
  { id: "retail_mixed_use", label: "Retail / mixed-use", industry: "cre_owner", whyAttractive: "Premises liability and vendor dependence", dynamicModule: "Snow and ice, security, lease requirements, liquor tenants", hasModule: true },
  { id: "net_lease", label: "Net-lease / single-tenant", industry: "cre_owner", whyAttractive: "Lease-driven insurance obligations", dynamicModule: "Tenant compliance tracking, lender requirements, named insureds", hasModule: true },
  { id: "self_storage", label: "Self-storage", industry: "other", whyAttractive: "Property, customer goods, access control", dynamicModule: "Customer goods legal liability, security, tenant insurance programs", hasModule: false },
  { id: "hospitality", label: "Hospitality / hotel assets", industry: "other", whyAttractive: "Property, liquor, events, seasonal labor", dynamicModule: "Liquor, pools, events, management agreements, D&O", hasModule: false },
  { id: "senior_housing", label: "Senior housing / assisted living", industry: "other", whyAttractive: "Severe liability and workforce exposure", dynamicModule: "Abuse controls, professional liability, staffing, auto", hasModule: false },
  { id: "student_housing", label: "Student housing", industry: "multifamily", whyAttractive: "Turnover, premises, parental guarantees", dynamicModule: "Renters insurance, security, event and alcohol exposure", hasModule: true },
  { id: "association", label: "Condo / HOA association", industry: "other", whyAttractive: "Governance, common areas, D&O", dynamicModule: "D&O, master policy allocation, vendor controls, reserves", hasModule: false },
  { id: "third_party_manager", label: "Third-party property manager", industry: "multifamily", whyAttractive: "Management-agreement exposure across many owners", dynamicModule: "Management agreements, E&O, tenant discrimination, funds handling", hasModule: true },
  { id: "developer", label: "Developer / owner-builder", industry: "cre_owner", whyAttractive: "Construction and lease-up risk", dynamicModule: "Builders risk, wrap-ups, contractor certificates, lender requirements", hasModule: true },
  { id: "land", label: "Land / agricultural holdings", industry: "other", whyAttractive: "Premises and environmental", dynamicModule: "Environmental, premises, trespass", hasModule: false },
  { id: "other", label: "Something else", industry: "other", whyAttractive: "", dynamicModule: "", hasModule: false },
];

export const NICHE_IDS = NICHES.map((n) => n.id) as [NicheId, ...NicheId[]];
export const NICHE_BY_ID: Record<NicheId, NicheDefinition> = Object.fromEntries(NICHES.map((n) => [n.id, n])) as Record<NicheId, NicheDefinition>;

export function nicheLabel(id: string | null | undefined): string | null {
  return id && id in NICHE_BY_ID ? NICHE_BY_ID[id as NicheId].label : null;
}
