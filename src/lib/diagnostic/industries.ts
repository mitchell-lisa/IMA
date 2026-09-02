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
  cre_owner: {
    id: "cre_owner",
    label: "Commercial real estate owner / investor",
    shortLabel: "Commercial RE",
    description:
      "Office, industrial and flex, retail, mixed-use, and net-lease portfolios, whether self-managed or with a third-party manager.",
    naics: ["531110", "531120", "531190", "531390"],
    categoryWeights: {
      governance: 1,
      market_readiness: 1.5,
      operational_controls: 1,
      claims: 1,
      contractual_risk_transfer: 1.25,
      emerging_risk: 1,
    },
    employeeThreshold: 25,
    marketNote:
      "Property underwriters price commercial portfolios on the quality of the statement of values, construction and protection data, roof and building-system updates, how carrier recommendations were handled, and how lease and vendor requirements transfer risk.",
  },
  multifamily: {
    id: "multifamily",
    label: "Multifamily owner / property manager",
    shortLabel: "Multifamily",
    description:
      "Apartment communities, student and workforce housing, and third-party residential management.",
    naics: ["531110", "531311", "531390"],
    categoryWeights: {
      governance: 1,
      market_readiness: 1.25,
      operational_controls: 1.5,
      claims: 1.25,
      contractual_risk_transfer: 1.25,
      emerging_risk: 1,
    },
    employeeThreshold: 25,
    marketNote:
      "Multifamily carriers look closely at habitability and life-safety practices, renters insurance enforcement, fair-housing training, vendor certificates for snow and ice and contractors, claim frequency, and how quickly incidents are reported.",
  },
  other: {
    id: "other",
    label: "Other real estate operator",
    shortLabel: "Other RE",
    description: "Self-storage, hospitality assets, senior housing, associations, land, or a mixed portfolio. Uses generic weighting.",
    naics: ["531"],
    categoryWeights: {
      governance: 1,
      market_readiness: 1,
      operational_controls: 1,
      claims: 1,
      contractual_risk_transfer: 1,
      emerging_risk: 1,
    },
    employeeThreshold: 25,
    marketNote:
      "Carriers evaluate every real estate account on the quality of its property data, the controls at each location, claims history, and the clarity of the story that accompanies the submission.",
  },
};

export const INDUSTRY_IDS: IndustryId[] = ["cre_owner", "multifamily", "other"];

export function getIndustry(id: IndustryId): IndustryDefinition {
  return INDUSTRIES[id] ?? INDUSTRIES.other;
}
