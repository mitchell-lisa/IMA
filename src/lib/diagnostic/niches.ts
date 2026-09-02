import type { IndustryId } from "./types";

/**
 * Niches from the product plan's target-industry table. Only the first two
 * have dedicated question variants today; the rest are captured at intake so
 * the dashboard shows demand by niche before any module is built.
 */
export type NicheId =
  | "logistics_3pl"
  | "food_cold_storage"
  | "light_manufacturing"
  | "life_sciences"
  | "contractors"
  | "cre_owners"
  | "multifamily"
  | "healthcare"
  | "senior_living"
  | "professional_services"
  | "technology_msp"
  | "auto_dealers"
  | "hospitality_clubs"
  | "nonprofit"
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
  { id: "logistics_3pl", label: "3PL / warehousing / distribution", industry: "logistics_3pl", whyAttractive: "Fleet, property, cargo, labor, contracts", dynamicModule: "Cargo, auto, warehouse legal liability, fire protection", hasModule: true },
  { id: "food_cold_storage", label: "Food distribution / cold storage", industry: "logistics_3pl", whyAttractive: "Spoilage and temperature dependency", dynamicModule: "Refrigeration breakdown, recall, contamination", hasModule: false },
  { id: "light_manufacturing", label: "Light / advanced manufacturing", industry: "light_manufacturing", whyAttractive: "Property, machinery, products, WC", dynamicModule: "Business interruption, machine guarding, product liability", hasModule: true },
  { id: "life_sciences", label: "Life-sciences supplier", industry: "light_manufacturing", whyAttractive: "High-value inventory and regulated work", dynamicModule: "Clinical/product liability, cold chain, cyber, E&O", hasModule: false },
  { id: "contractors", label: "Contractor / trades", industry: "other", whyAttractive: "Subcontracting and contractual risk", dynamicModule: "Wrap-ups, fleet, jobsite safety, certificates", hasModule: false },
  { id: "cre_owners", label: "Commercial real estate owner", industry: "other", whyAttractive: "Property values and vendor dependence", dynamicModule: "SOV quality, flood, BI, leases, management agreements", hasModule: false },
  { id: "multifamily", label: "Multifamily / property manager", industry: "other", whyAttractive: "Tenant, premises, discrimination", dynamicModule: "Renters insurance, habitability, EPLI, vendor controls", hasModule: false },
  { id: "healthcare", label: "Healthcare practice / MSO", industry: "other", whyAttractive: "Professional, privacy, employment", dynamicModule: "Medical professional, cyber, regulatory, credentialing", hasModule: false },
  { id: "senior_living", label: "Senior living / home care", industry: "other", whyAttractive: "Severe liability and workforce exposure", dynamicModule: "Abuse controls, auto, professional liability, staffing", hasModule: false },
  { id: "professional_services", label: "Professional services", industry: "other", whyAttractive: "E&O, cyber, executive risk", dynamicModule: "Contract scope, client concentration, privacy", hasModule: false },
  { id: "technology_msp", label: "Technology / MSP", industry: "other", whyAttractive: "Contractual and cyber aggregation", dynamicModule: "Tech E&O, ransomware, dependent business interruption", hasModule: false },
  { id: "auto_dealers", label: "Auto dealer / fleet business", industry: "other", whyAttractive: "Inventory, garage, drivers", dynamicModule: "Garage liability, false pretense, cyber, weather", hasModule: false },
  { id: "hospitality_clubs", label: "Hospitality / country club", industry: "other", whyAttractive: "Property, liquor, events, seasonal labor", dynamicModule: "Liquor, golf carts, pools, events, D&O", hasModule: false },
  { id: "nonprofit", label: "Nonprofit / social services", industry: "other", whyAttractive: "Governance, volunteers, vulnerable clients", dynamicModule: "D&O, abuse/molestation controls, professional liability", hasModule: false },
  { id: "other", label: "Something else", industry: "other", whyAttractive: "", dynamicModule: "", hasModule: false },
];

export const NICHE_IDS = NICHES.map((n) => n.id) as [NicheId, ...NicheId[]];
export const NICHE_BY_ID: Record<NicheId, NicheDefinition> = Object.fromEntries(NICHES.map((n) => [n.id, n])) as Record<NicheId, NicheDefinition>;

export function nicheLabel(id: string | null | undefined): string | null {
  return id && id in NICHE_BY_ID ? NICHE_BY_ID[id as NicheId].label : null;
}
