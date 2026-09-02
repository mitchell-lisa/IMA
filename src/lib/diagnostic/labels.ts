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
    description: "Who owns the insurance program across the portfolio, when renewal work begins, and how limits and deductibles are decided.",
  },
  market_readiness: {
    label: "Property data & market readiness",
    short: "Market readiness",
    description: "How well the statement of values, acquisitions and dispositions, and building updates are documented and presented to carriers.",
  },
  operational_controls: {
    label: "Operational controls",
    short: "Controls",
    description: "Tenant and applicant data, rent and vendor payment controls, and property inspection and life-safety practices.",
  },
  claims: {
    label: "Claims discipline",
    short: "Claims",
    description: "How incidents at the properties are reported, open claims are reviewed, and corrective actions are tracked.",
  },
  contractual_risk_transfer: {
    label: "Contractual risk transfer",
    short: "Contracts",
    description: "Whether leases, vendor agreements, insurance requirements, and certificate verification work as one system.",
  },
  emerging_risk: {
    label: "Emerging risk",
    short: "Emerging risk",
    description: "How acquisitions, new property types, regulations, and new exposures like EV charging are reviewed for risk impact.",
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

export const UNITS_BAND_LABELS: Record<import("./types").UnitsBand, string> = {
  "1_5": "1 – 5 properties",
  "6_25": "6 – 25 properties",
  "26_100": "26 – 100 properties or units",
  "101_500": "101 – 500 units",
  over_500: "500+ units",
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
  premium_increases: "Property premium increases at renewal",
  property_valuation: "Replacement-cost values and how they are set",
  coverage_gaps: "Not knowing where coverage gaps are",
  claims_handling: "How claims are being handled",
  vendor_tenant_requirements: "Vendor, tenant, or lender insurance requirements",
  cyber: "Cyber, tenant data, and payment-fraud exposure",
  growth_changes: "Keeping insurance aligned with acquisitions and renovations",
  broker_service: "Responsiveness of the current broker",
  not_sure: "Not sure yet",
};

export const MAJOR_LINE_LABELS: Record<MajorLine, string> = {
  property: "Property",
  flood: "Flood",
  general_liability: "General liability",
  umbrella: "Umbrella / excess",
  workers_comp: "Workers' compensation",
  commercial_auto: "Commercial auto",
  cyber: "Cyber",
  epli: "Employment practices (EPLI)",
  d_and_o: "Directors & officers",
  environmental: "Environmental / pollution",
  professional: "Professional / E&O",
  crime: "Crime / social engineering",
  builders_risk: "Builders risk",
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
