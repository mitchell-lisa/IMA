/**
 * Core domain types for the MarketReady Risk Diagnostic.
 *
 * Everything in `src/lib/diagnostic` is pure, deterministic, and framework-free
 * so that scoring can be unit-tested and reused server-side.
 */

export type IndustryId = "logistics_3pl" | "light_manufacturing" | "other";

export type CategoryId =
  | "governance"
  | "market_readiness"
  | "operational_controls"
  | "claims"
  | "contractual_risk_transfer"
  | "emerging_risk";

export const CATEGORY_IDS: CategoryId[] = [
  "governance",
  "market_readiness",
  "operational_controls",
  "claims",
  "contractual_risk_transfer",
  "emerging_risk",
];

/** Maturity levels for a single practice. */
export type MaturityValue = 0 | 1 | 2 | 3;

/** What a prospect can submit for a question. */
export type AnswerValue = MaturityValue | "unknown";

export type QuestionWeight = 1 | 2 | 3;

/** Boolean profile flags that unlock branched questions. */
export type BranchTrigger =
  | "ownsBuildings"
  | "hasVehicles"
  | "usesSubcontractors"
  | "storesSensitiveData"
  | "employeesAboveThreshold"
  | "hasOutsideInvestors"
  | "regulatedMaterials";

export const BRANCH_TRIGGERS: BranchTrigger[] = [
  "ownsBuildings",
  "hasVehicles",
  "usesSubcontractors",
  "storesSensitiveData",
  "employeesAboveThreshold",
  "hasOutsideInvestors",
  "regulatedMaterials",
];

export type RevenueBand =
  | "under_10m"
  | "10m_25m"
  | "25m_50m"
  | "50m_100m"
  | "100m_250m"
  | "over_250m";

export type EmployeeBand = "1_24" | "25_49" | "50_99" | "100_249" | "250_499" | "500_plus";

export type PremiumBand =
  | "under_50k"
  | "50k_150k"
  | "150k_500k"
  | "500k_1m"
  | "over_1m"
  | "prefer_not";

export type IncumbentTenure = "under_2" | "2_5" | "6_10" | "over_10" | "unknown";

export type Role =
  | "owner_ceo"
  | "cfo_finance"
  | "coo_operations"
  | "risk_hr"
  | "controller_manager"
  | "other";

export type PrimaryConcern =
  | "premium_increases"
  | "coverage_gaps"
  | "claims_handling"
  | "contract_requirements"
  | "cyber"
  | "growth_changes"
  | "broker_service"
  | "not_sure";

export type MajorLine =
  | "property"
  | "general_liability"
  | "umbrella"
  | "workers_comp"
  | "commercial_auto"
  | "cyber"
  | "epli"
  | "d_and_o"
  | "inland_marine"
  | "environmental"
  | "professional"
  | "crime";

/** The company / profile questions captured up front and during the flow. */
export interface AssessmentProfile {
  companyName: string;
  website?: string;
  zip: string;
  industry: IndustryId;
  employeeBand: EmployeeBand;
  revenueBand: RevenueBand;
  /** 1-12 */
  renewalMonth?: number;
  incumbentTenure?: IncumbentTenure;
  majorLines?: MajorLine[];
  premiumBand?: PremiumBand;
  recentAcquisitionOrNewLocation?: boolean;
  primaryConcern?: PrimaryConcern;
  willingToSharePolicies?: "yes" | "maybe" | "no";
  /** Branch triggers */
  ownsBuildings?: boolean;
  hasVehicles?: boolean;
  usesSubcontractors?: boolean;
  storesSensitiveData?: boolean;
  employeesAboveThreshold?: boolean;
  hasOutsideInvestors?: boolean;
  regulatedMaterials?: boolean;
}

export interface QuestionOption {
  value: MaturityValue;
  label: string;
}

/** Industry-specific overrides for a question's wording. */
export interface QuestionVariant {
  prompt?: string;
  help?: string;
  options?: QuestionOption[];
}

export interface Question {
  id: string;
  category: CategoryId;
  /** Short heading shown above the prompt. */
  topic: string;
  prompt: string;
  help?: string;
  options: QuestionOption[];
  /** Weight by industry, 1-3. */
  weights: Record<IndustryId, QuestionWeight>;
  /**
   * Optional industry-specific wording. Scoring is unaffected; only the
   * prompt, help, or option labels change so the question speaks to the
   * exposures that matter in that industry (the "dynamic module").
   */
  variants?: Partial<Record<IndustryId, QuestionVariant>>;
  /** When present, the question is only shown if the profile flag is true. */
  branch?: BranchTrigger;
  /**
   * When present, answering at or below `atOrBelow` raises a critical control
   * flag that is surfaced regardless of overall score.
   */
  critical?: { atOrBelow: MaturityValue; message: string };
}

export type Answers = Record<string, AnswerValue>;

export type ScoreBand = "strong" | "improve" | "priority";

export interface CategoryScore {
  category: CategoryId;
  /** 0-100, or null when no known answers exist for the category. */
  score: number | null;
  band: ScoreBand | null;
  earned: number;
  available: number;
  answeredKnown: number;
  applicable: number;
  unknown: number;
  unanswered: number;
}

export type ConfidenceBand = "high" | "moderate" | "low";

export interface CriticalFlag {
  questionId: string;
  category: CategoryId;
  message: string;
}

export interface ConsistencyNote {
  id: string;
  message: string;
  questionIds: string[];
}

export interface Finding {
  id: string;
  category: CategoryId | "overall";
  kind: "investigate" | "strength";
  title: string;
  body: string;
  /** Optional second paragraph, e.g. "Potential opportunity: ..." */
  detail?: string;
  /** Higher sorts first. */
  priority: number;
  questionIds: string[];
}

export interface RenewalContext {
  renewalMonth: number | null;
  monthsUntilRenewal: number | null;
  /** Recommended date to begin renewal preparation (120 days ahead). */
  recommendedStartMonth: number | null;
  status: "unknown" | "inside_window" | "approaching" | "ample_time";
  message: string;
}

export interface ScoreResult {
  overall: number | null;
  overallBand: ScoreBand | null;
  categories: CategoryScore[];
  confidence: number;
  confidenceBand: ConfidenceBand;
  criticalFlags: CriticalFlag[];
  consistencyNotes: ConsistencyNote[];
  applicableQuestionIds: string[];
  answeredCount: number;
  unknownCount: number;
  unansweredCount: number;
}

export interface DiagnosticResult {
  scores: ScoreResult;
  findings: Finding[];
  strengths: Finding[];
  renewal: RenewalContext;
  /** Preparation checklist items unlocked with email capture. */
  checklist: string[];
}
