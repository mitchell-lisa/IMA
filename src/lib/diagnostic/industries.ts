import type { CategoryId, IndustryId } from "./types";

export interface IndustryDefinition {
  id: IndustryId;
  label: string;
  shortLabel: string;
  description: string;
  /** NAICS codes commonly associated with the industry (for enrichment/CRM). */
  naics: string[];
  /** Relative weight of each category in the overall score. */
  categoryWeights: Record<CategoryId, number>;
  /** Employee count at which the "employeesAboveThreshold" branch unlocks. */
  employeeThreshold: number;
  /** Industry-specific framing used in the results copy. */
  marketNote: string;
}

export const INDUSTRIES: Record<IndustryId, IndustryDefinition> = {
  logistics_3pl: {
    id: "logistics_3pl",
    label: "3PL, warehousing & distribution",
    shortLabel: "3PL / Warehousing",
    description:
      "Third-party logistics, public and contract warehousing, cold chain, fulfillment, and regional distribution.",
    naics: ["493110", "493120", "484110", "484121", "488510"],
    categoryWeights: {
      governance: 1,
      market_readiness: 1.25,
      operational_controls: 1.25,
      claims: 1.25,
      contractual_risk_transfer: 1.5,
      emerging_risk: 0.75,
    },
    employeeThreshold: 50,
    marketNote:
      "Carriers evaluating warehousing and 3PL accounts look closely at warehouse legal liability, cargo and customer contracts, fleet controls, fire protection, and how consistently incidents are reported.",
  },
  light_manufacturing: {
    id: "light_manufacturing",
    label: "Light manufacturing",
    shortLabel: "Manufacturing",
    description:
      "Fabrication, assembly, food and beverage, plastics, packaging, electronics, and other light industrial operations.",
    naics: ["332", "333", "335", "311", "326", "339"],
    categoryWeights: {
      governance: 1,
      market_readiness: 1.25,
      operational_controls: 1.5,
      claims: 1.25,
      contractual_risk_transfer: 1,
      emerging_risk: 1,
    },
    employeeThreshold: 50,
    marketNote:
      "Underwriters reviewing manufacturers focus on product liability and recall exposure, machine guarding and workers' compensation history, property valuation, business interruption, and supplier and customer contract terms.",
  },
  other: {
    id: "other",
    label: "Other middle-market business",
    shortLabel: "Other",
    description: "Any other commercial operation. Uses generic weighting.",
    naics: [],
    categoryWeights: {
      governance: 1,
      market_readiness: 1,
      operational_controls: 1,
      claims: 1,
      contractual_risk_transfer: 1,
      emerging_risk: 1,
    },
    employeeThreshold: 50,
    marketNote:
      "Carriers evaluate every account on the quality of its exposure data, controls, claims history, and the clarity of the story that accompanies the submission.",
  },
};

export const INDUSTRY_IDS: IndustryId[] = ["logistics_3pl", "light_manufacturing", "other"];

export function getIndustry(id: IndustryId): IndustryDefinition {
  return INDUSTRIES[id] ?? INDUSTRIES.other;
}
