import type {
  CategoryId,
  EmployeeBand,
  IncumbentTenure,
  MajorLine,
  PremiumBand,
  PrimaryConcern,
  RevenueBand,
  Role,
  ScoreBand,
  ConfidenceBand,
} from "./types";

export const CATEGORY_LABELS: Record<CategoryId, { label: string; short: string; description: string }> = {
  governance: {
    label: "Program governance",
    short: "Governance",
    description: "Who owns the insurance program, when renewal work begins, and how limits are decided.",
  },
  market_readiness: {
    label: "Data & market readiness",
    short: "Market readiness",
    description: "How well exposure data and business changes are documented and presented to carriers.",
  },
  operational_controls: {
    label: "Operational controls",
    short: "Controls",
    description: "Cyber, payment authorization, safety, and training practices that underwriters ask about.",
  },
  claims: {
    label: "Claims discipline",
    short: "Claims",
    description: "How incidents are reported, open claims are reviewed, and root causes are tracked.",
  },
  contractual_risk_transfer: {
    label: "Contractual risk transfer",
    short: "Contracts",
    description: "Whether contracts, insurance requirements, and certificate verification work as one system.",
  },
  emerging_risk: {
    label: "Emerging risk",
    short: "Emerging risk",
    description: "How new locations, products, technology, and regulations are reviewed for risk impact.",
  },
};

export const REVENUE_BAND_LABELS: Record<RevenueBand, string> = {
  under_10m: "Under $10M",
  "10m_25m": "$10M – $25M",
  "25m_50m": "$25M – $50M",
  "50m_100m": "$50M – $100M",
  "100m_250m": "$100M – $250M",
  over_250m: "Over $250M",
};

export const EMPLOYEE_BAND_LABELS: Record<EmployeeBand, string> = {
  "1_24": "1 – 24",
  "25_49": "25 – 49",
  "50_99": "50 – 99",
  "100_249": "100 – 249",
  "250_499": "250 – 499",
  "500_plus": "500+",
};

export const PREMIUM_BAND_LABELS: Record<PremiumBand, string> = {
  under_50k: "Under $50K",
  "50k_150k": "$50K – $150K",
  "150k_500k": "$150K – $500K",
  "500k_1m": "$500K – $1M",
  over_1m: "Over $1M",
  prefer_not: "Prefer not to say",
};

export const INCUMBENT_TENURE_LABELS: Record<IncumbentTenure, string> = {
  under_2: "Less than 2 years",
  "2_5": "2 – 5 years",
  "6_10": "6 – 10 years",
  over_10: "More than 10 years",
  unknown: "Not sure",
};

export const ROLE_LABELS: Record<Role, string> = {
  owner_ceo: "Owner / CEO / President",
  cfo_finance: "CFO / VP Finance",
  coo_operations: "COO / VP Operations",
  risk_hr: "Risk, Safety, or HR leader",
  controller_manager: "Controller / Office Manager",
  other: "Other",
};

export const PRIMARY_CONCERN_LABELS: Record<PrimaryConcern, string> = {
  premium_increases: "Premium increases at renewal",
  coverage_gaps: "Not knowing where coverage gaps are",
  claims_handling: "How claims are being handled",
  contract_requirements: "Customer or landlord insurance requirements",
  cyber: "Cyber and payment-fraud exposure",
  growth_changes: "Keeping insurance aligned with growth or changes",
  broker_service: "Responsiveness of the current broker",
  not_sure: "Not sure yet",
};

export const MAJOR_LINE_LABELS: Record<MajorLine, string> = {
  property: "Property",
  general_liability: "General liability",
  umbrella: "Umbrella / excess",
  workers_comp: "Workers' compensation",
  commercial_auto: "Commercial auto",
  cyber: "Cyber",
  epli: "Employment practices (EPLI)",
  d_and_o: "Directors & officers",
  inland_marine: "Inland marine / cargo",
  environmental: "Environmental / pollution",
  professional: "Professional / E&O",
  crime: "Crime / social engineering",
};

export const SCORE_BAND_LABELS: Record<ScoreBand, { label: string; description: string }> = {
  strong: {
    label: "Stronger documented practices",
    description: "Practices in this area appear documented and, in many cases, monitored.",
  },
  improve: {
    label: "Opportunities to improve consistency",
    description: "Practices exist but may not be applied or documented consistently.",
  },
  priority: {
    label: "Priority areas to investigate",
    description: "Answers suggest practices are undocumented, reactive, or not yet in place.",
  },
};

export const CONFIDENCE_BAND_LABELS: Record<ConfidenceBand, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Low confidence",
};

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
