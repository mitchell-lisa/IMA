import type { AssessmentProfile, IndustryId, Question, QuestionWeight } from "./types";

type W = [cre: QuestionWeight, multifamily: QuestionWeight, other: QuestionWeight];

function w(...[c, m, o]: W): Record<IndustryId, QuestionWeight> {
  return { cre_owner: c, multifamily: m, other: o };
}

/**
 * Standard maturity ladder. Every question uses the same four levels so that
 * scoring stays deterministic and comparable across categories:
 *   0 = undocumented / reactive
 *   1 = partial / inconsistent
 *   2 = documented
 *   3 = documented, monitored, and reviewed
 *
 * Wording follows IMA's Real Estate Risk Workshop workbook (property
 * valuation, submission standards, liability limit analysis, risk profile,
 * leasing and renters insurance, funds transfer, data security, carrier
 * recommendations, claims management, contracts and certificates,
 * management agreements, environmental and emerging risk).
 */
function ladder(l0: string, l1: string, l2: string, l3: string): Question["options"] {
  return [
    { value: 0, label: l0 },
    { value: 1, label: l1 },
    { value: 2, label: l2 },
    { value: 3, label: l3 },
  ];
}

export const QUESTIONS: Question[] = [
  // ---------------------------------------------------------------- Governance
  {
    id: "gov_renewal_lead_time",
    category: "governance",
    topic: "Renewal lead time",
    prompt: "When does renewal preparation for the portfolio typically begin relative to policy expiration?",
    help: "Property markets reward complete, early submissions. A late start means values and building updates never make it into the story carriers see.",
    options: ladder(
      "Within 30 days of expiration, or when the broker reaches out",
      "About 60 days out; we ask brokers to market and follow up 30 days out",
      "90+ days out with a written timeline and an updated statement of values",
      "120+ days out with a documented calendar, owners, a pre-renewal strategy meeting, and a reconciled statement of values",
    ),
    weights: w(3, 3, 3),
    critical: {
      atOrBelow: 0,
      message: "Renewal preparation appears to begin inside 30 days of expiration, which limits the ability to update values, document building improvements, and approach alternative markets.",
    },
  },
  {
    id: "gov_internal_owner",
    category: "governance",
    topic: "Program ownership",
    prompt: "Who owns the insurance program for the portfolio, and how is that responsibility defined?",
    help: "In many real estate organizations this sits between ownership, an asset manager, a controller, and the property manager.",
    options: ladder(
      "No single owner; whoever the broker contacts handles it, or the property manager decides",
      "One person handles it informally alongside other duties",
      "A named owner with defined responsibilities, including certificates and mid-term changes",
      "A named owner, a backup, and a defined split of duties with the property manager, asset management, and finance",
    ),
    weights: w(2, 2, 2),
  },
  {
    id: "gov_limit_rationale",
    category: "governance",
    topic: "Limit and deductible rationale",
    prompt: "How are liability limits, property deductibles, and umbrella limits decided each year?",
    help: "This asks about your decision process, not whether the limits are adequate.",
    options: ladder(
      "We trust the agent or go with past numbers; limits follow the premium budget",
      "We have discussed limits with the agent but never worked through examples or lender requirements in detail",
      "We review limits annually against lender and lease requirements, asset values, and revenue",
      "A formal annual process considers industry trends, risk tolerance, balance sheet, defensibility, lender covenants, and documents the rationale for each limit and deductible",
    ),
    weights: w(2, 2, 2),
  },

  // ---------------------------------------------------------- Market readiness
  {
    id: "mkt_exposure_data",
    category: "market_readiness",
    topic: "Statement of values",
    prompt: "How is the statement of values (replacement cost, construction and protection details, occupancy, square footage, year built, updates) maintained and validated before submission?",
    help: "Replacement cost that is dictated by the insurer, or carried forward, is the most common reason a property submission is discounted.",
    options: ladder(
      "We don't analyze replacement cost; the insurer dictates it and values are carried forward",
      "We reviewed values a few years ago but do not update often and are not confident in the process",
      "Values and building details are updated annually and checked against recent construction costs",
      "Values are updated annually, reconciled against rebuilds, appraisals, and recent claims, with construction, protection, and update history documented per building",
    ),
    weights: w(3, 3, 3),
    variants: {
      multifamily: {
        help: "Include unit counts, rent roll and business-income values, and any building improvements since the last valuation.",
      },
    },
  },
  {
    id: "mkt_business_changes",
    category: "market_readiness",
    topic: "Portfolio changes",
    prompt: "How are acquisitions, dispositions, renovations, new leases, and occupancy changes communicated to your insurance program during the year?",
    options: ladder(
      "They surface at renewal, if at all",
      "We mention major acquisitions or sales when we remember",
      "A defined process reports each acquisition, disposition, and major renovation to the broker with values and lender requirements",
      "Changes are logged, reviewed quarterly for insurance impact, and reflected in schedules and endorsements when they happen",
    ),
    weights: w(3, 2, 2),
  },
  {
    id: "mkt_submission_visibility",
    category: "market_readiness",
    topic: "Your risk profile in the market",
    prompt: "Do you know how your story is being told in the marketplace, and do you see what is sent to insurance companies about the portfolio?",
    help: "Brokers who never saw your environmental consultant's report, your capital plan, or your maintenance program cannot present them.",
    options: ladder(
      "I don't know; we have never seen what brokers present to market",
      "We submit updated information annually and confirm the broker understands changes to the portfolio",
      "We review the submission and know which carriers quoted or declined and why",
      "We collaborate with our broker to determine how best to portray the portfolio, review the full submission and narrative, and receive a market summary with reasons for declinations",
    ),
    weights: w(2, 2, 2),
  },

  // ------------------------------------------------------ Operational controls
  {
    id: "ops_cyber_controls",
    category: "operational_controls",
    topic: "Data security",
    prompt: "What data do you hold on tenants, applicants, and investors, how is it stored and shared, and how is it protected?",
    help: "Applications, background checks, banking details, and investor reporting are all sensitive. Property-management software vendors should be part of the answer.",
    options: ladder(
      "No data security program or process; information is stored locally and not encrypted",
      "Some form of data security, such as limited access, encryption, or occasional employee education",
      "A formal data security program: MFA, encryption, limited access, regular training, and a written incident plan",
      "Formal program plus vendor security review of property-management and payment platforms, tested backups, and annual review with the broker",
    ),
    weights: w(2, 3, 2),
    critical: {
      atOrBelow: 0,
      message: "Tenant, applicant, or investor data appears to be held without a data security program. Cyber carriers treat MFA and encryption as minimum requirements.",
    },
  },
  {
    id: "ops_payment_authorization",
    category: "operational_controls",
    topic: "Funds transfer security",
    prompt: "How is the flow of funds controlled: rent collection, security deposits, vendor payments, wires, and changes to vendor bank details?",
    options: ladder(
      "No formal protocols; an email or phone request is usually sufficient",
      "Some combination of dual authorization and written procedures, applied inconsistently",
      "Written procedures with callback verification to a known number and dual approval for wires and bank-detail changes",
      "Formal written program with regular training: dual authorization, calls to verify, destination-detail confirmation, receipt confirmation, and periodic consultation with the bank on best practices",
    ),
    weights: w(3, 3, 3),
    critical: {
      atOrBelow: 0,
      message: "Wires and vendor bank-detail changes may be released on an email or phone request alone, which is the most common path for social-engineering losses in property operations.",
    },
  },
  {
    id: "ops_safety_training",
    category: "operational_controls",
    topic: "Inspections, life safety & maintenance",
    prompt: "How are property inspections, life-safety systems, lighting, and preventive maintenance documented across the portfolio?",
    help: "Documented inspections and maintenance logs are what carriers credit; practices that exist only in the property manager's head do not count.",
    options: ladder(
      "Inspections happen when something breaks; little is written down",
      "Some written procedures; inspection and maintenance records are incomplete or live only with the manager",
      "Written inspection schedule, life-safety testing records, and a preventive maintenance plan per property",
      "Written program with documented inspections, life-safety testing, lighting and security logs, preventive maintenance plans, and ownership review of results",
    ),
    weights: w(3, 3, 2),
    variants: {
      multifamily: {
        prompt: "How are unit and common-area inspections, life-safety systems (smoke and CO detectors, sprinklers, egress), lighting, and preventive maintenance documented across the communities?",
        help: "Habitability claims turn on documentation: inspection logs, work-order completion, and life-safety testing records.",
      },
      cre_owner: {
        prompt: "How are roof, sprinkler, electrical, and boiler inspections, life-safety systems, and preventive maintenance documented across the buildings?",
        help: "Roof age, sprinkler impairments, aluminum wiring, and boiler condition are the recommendations carriers issue most often.",
      },
    },
  },

  // ------------------------------------------------------------------- Claims
  {
    id: "clm_reporting_protocol",
    category: "claims",
    topic: "Claim intake & reporting",
    prompt: "What policies and procedures make sure incidents at the properties (injuries, fires, water losses, tenant claims) are reported and managed properly?",
    options: ladder(
      "No policies or protocols; the property manager reports claims directly to the carrier when they think of it",
      "Supervisors and managers know to report, but timing and format vary; we check in with the broker when we need an update",
      "A written protocol defines who reports, how, and within what timeframe, with an incident form for every event",
      "Written protocol, reporting within 24–48 hours, incident forms, and formal meetings with broker and adjusters on a predetermined timeline",
    ),
    weights: w(3, 3, 3),
    critical: {
      atOrBelow: 0,
      message: "Incidents appear to be reported inconsistently or late. Late reporting is a frequent driver of higher claim costs and coverage disputes, especially on liability claims.",
    },
  },
  {
    id: "clm_open_claim_review",
    category: "claims",
    topic: "Claims management & advocacy",
    prompt: "How are open claims, reserves, carrier-assigned counsel, and public adjusters managed?",
    help: "The workshop asks whether your broker has a systematic process: frequency of updates, claims positioning, policy review, legal guidance, and advocacy.",
    options: ladder(
      "We work directly with the carrier and adjuster; we do not focus on the liability claims process or communicate with assigned counsel",
      "We engage the broker if we are not satisfied; the broker primarily deals with counsel while we monitor open claims",
      "Scheduled claim reviews at least twice a year with reserve discussion; we consider a public adjuster case by case",
      "A systematic process: quarterly reviews with reserve challenges, pre-assigned preferred defense counsel where possible, public-adjuster decisions made with the broker against policy wording, and pre-renewal loss-run reconciliation",
    ),
    weights: w(2, 3, 2),
  },
  {
    id: "clm_root_cause",
    category: "claims",
    topic: "Root cause & corrective action",
    prompt: "After an incident at a property, how are root causes identified and corrective actions tracked?",
    options: ladder(
      "We fix what is obvious and move on",
      "The property manager discusses causes; actions are not tracked",
      "Root-cause review for significant incidents with documented corrective actions and work orders",
      "Every incident gets a root-cause review, corrective actions are tracked to closure across the portfolio, and trends are reported to ownership",
    ),
    weights: w(2, 3, 2),
  },

  // ---------------------------------------------------- Contractual risk transfer
  {
    id: "crt_signed_contracts",
    category: "contractual_risk_transfer",
    topic: "Vendor & contractor contracts",
    prompt: "Tell us about the contracts you use with vendors and contractors at the properties (snow and ice, landscaping, security, renovations). Are master agreements in place with key vendors?",
    options: ladder(
      "We don't always get contracts signed; work often starts on a proposal or a call",
      "An attorney reviews or writes contracts and we make sure they are signed",
      "Attorney-reviewed contracts plus broker review for insurance and risk-transfer terms; signed before work starts",
      "Attorney and broker review, signed before work starts, master agreements with key vendors, and payment blocked when contract or insurance terms are missing",
    ),
    weights: w(2, 3, 2),
  },
  {
    id: "crt_insurance_requirements",
    category: "contractual_risk_transfer",
    topic: "Insurance requirements in leases & contracts",
    prompt: "How are insurance requirements set for tenants in leases and for vendors in contracts, and how are lender and management-agreement requirements on you tracked?",
    options: ladder(
      "We do not set requirements; we accept whatever the tenant, vendor, or lender proposes",
      "We use generic lease and contract language without reviewing it",
      "Requirements are defined by relationship type (tenant, vendor, contractor) and reviewed by broker or counsel",
      "Requirements are defined, reviewed annually, cross-checked against our own policies and every lender and management-agreement obligation, and enforced",
    ),
    weights: w(3, 2, 2),
    variants: {
      cre_owner: {
        help: "Commercial leases typically require tenant liability and property coverage with the owner as additional insured; lenders require specific limits, mortgagee clauses, and flood where applicable.",
      },
      multifamily: {
        help: "Vendor requirements matter most here: snow and ice, security, and renovation contractors should indemnify and name the owner and manager as additional insureds.",
      },
    },
  },
  {
    id: "crt_coi_verification",
    category: "contractual_risk_transfer",
    topic: "Certificate tracking",
    prompt: "What is your process for vetting vendors and contractors who work at the properties, and how are certificates of insurance and endorsements tracked?",
    options: ladder(
      "We don't; certificates are collected when asked and not reviewed",
      "We obtain certificates with additional-insured status and check coverage and limit adequacy, but tracking is manual and infrequent",
      "Certificates and required endorsements are verified before work and on expiration, in a tracking system",
      "Software tracks every vendor's insurance in real time, the broker reviews complete policies for key contractors, endorsements are matched to contract terms, and non-compliant vendors are stopped from working",
    ),
    weights: w(3, 3, 2),
    critical: {
      atOrBelow: 0,
      message: "Vendor certificates of insurance are collected but not reviewed, so the indemnity and additional-insured protection in your contracts may not be operating when a loss occurs.",
    },
  },

  // ------------------------------------------------------------ Emerging risk
  {
    id: "emr_annual_review",
    category: "emerging_risk",
    topic: "Frequent risk assessment",
    prompt: "How often is a thorough risk assessment of the portfolio performed outside of an insurance policy renewal?",
    help: "A risk review looks at operations, contracts, properties, and controls, not just the policies being renewed.",
    options: ladder(
      "Never, or more than five years ago",
      "More than 18 months ago, or only when a new agent first came on board",
      "Annually, with a documented list of risks by property",
      "Annually with owners and action plans, reviewed with the broker so prevention, mitigation, and insurance stay aligned",
    ),
    weights: w(2, 2, 2),
  },
  {
    id: "emr_regulatory",
    category: "emerging_risk",
    topic: "Regulatory & compliance monitoring",
    prompt: "How are regulatory and compliance changes affecting the properties monitored (fair housing, ADA, local habitability and safety ordinances, energy and benchmarking rules)?",
    options: ladder(
      "We learn about changes when we are notified of a violation, complaint, or audit",
      "Individual managers watch their own areas informally",
      "A defined owner monitors regulations, and required training and postings are documented",
      "Defined owner, documented compliance calendar, annual training with records, and periodic compliance audits with counsel",
    ),
    weights: w(2, 3, 2),
    variants: {
      multifamily: {
        help: "Fair-housing training records, required postings, and consistent screening criteria are the first things asked about in a discrimination claim.",
      },
    },
  },
  {
    id: "emr_new_activity_review",
    category: "emerging_risk",
    topic: "New exposure review",
    prompt: "When you acquire a property, add a new property type, allow short-term rentals, or add EV charging or lithium-battery storage, is the risk and insurance impact reviewed beforehand?",
    help: "The workshop found owners who had never heard of the lithium-battery exposure and were about to add car chargers.",
    options: ladder(
      "Not usually; insurance catches up later",
      "Sometimes, for very large acquisitions",
      "A review step with the broker is part of acquisition due diligence and major operational changes",
      "Documented pre-acquisition and pre-launch review (environmental due diligence, valuation, lender requirements, new exposures) with follow-up after closing",
    ),
    weights: w(2, 2, 2),
  },

  // ---------------------------------------------------------- Branched (7)
  {
    id: "br_property_valuation",
    category: "market_readiness",
    branch: "ownsBuildings",
    topic: "Carrier recommendations & building updates",
    prompt: "What is your procedure for dealing with insurance company recommendations (sprinklers, wiring, boilers, roofs), and how are building updates and flood exposure documented?",
    help: "Carriers issue recommendations after inspections. Owners who track and close them, and show the carrier, negotiate from strength.",
    options: ladder(
      "We do as little as possible; updates and flood zones are not documented",
      "We do the bare minimum to stay compliant with the insurer; updates are partially documented",
      "An active protocol responds to and tracks recommendations; roof, sprinkler, electrical, and boiler updates are documented with dates",
      "Active protocol for every recommendation with completion shown to the carrier, documented update history per building, flood zone determinations, and a professional valuation within three years",
    ),
    weights: w(3, 3, 2),
  },
  {
    id: "br_management_agreement",
    category: "contractual_risk_transfer",
    branch: "usesThirdPartyManager",
    topic: "Management agreements",
    prompt: "How do your management agreements address insurance and indemnification obligations between you and the third-party property manager?",
    options: ladder(
      "We do not review these requirements in agreements with our property managers",
      "We accept the terms and conditions in the manager's boilerplate agreement",
      "Counsel reviewed the agreement; we know who insures what and hold the manager's certificate",
      "We actively review and dictate the insurance and indemnity terms, require adequate limits and coverages from the manager, and regularly request updated certificates to confirm they are in place",
    ),
    weights: w(3, 3, 2),
    critical: {
      atOrBelow: 0,
      message: "Insurance and indemnification terms in the property-management agreement have not been reviewed, so it is unclear who is covered for a loss at a managed property.",
    },
  },
  {
    id: "br_vendor_transfer",
    category: "operational_controls",
    branch: "usesSubcontractors",
    topic: "Snow & ice, security, and site vendors",
    prompt: "For snow and ice removal, security patrols, and other on-site vendors, how consistently are procedures documented and risk transferred (logs, cameras, indemnity, additional-insured status)?",
    options: ladder(
      "Employees or vendors handle it informally; no logs and contracts have not been reviewed",
      "Employees are trained or contractors are hired, but snow logs, security procedures, and contract terms are inconsistent",
      "Every snow removal and patrol is documented, and vendors indemnify and name us as additional insured",
      "Documented logs visible on cameras, written security and snow procedures, contracts reviewed for indemnity and additional-insured terms, and vendor insurance tracked in a compliance system",
    ),
    weights: w(2, 3, 2),
  },
  {
    id: "br_residential_programs",
    category: "operational_controls",
    branch: "hasResidentialTenants",
    topic: "Leasing, renters insurance & fair housing",
    prompt: "For residential tenants, how are leasing and screening, renters-insurance verification, anti-discrimination training, and short-term-rental monitoring handled?",
    options: ladder(
      "No formal process; renters insurance is not tracked and fair-housing training is informal",
      "Application with employment verification and some screening; renters insurance tracked manually and updated infrequently; handbook statement only",
      "Attorney-vetted application and lease, background checks, renters insurance required and tracked, annual fair-housing training, lease prohibits short-term rentals",
      "All of the prior plus software that monitors renters insurance in real time and force-places when missing, documented annual training with counsel consultation, and active monitoring for short-term rental use",
    ),
    weights: w(1, 3, 2),
  },
  {
    id: "br_workforce_programs",
    category: "operational_controls",
    branch: "employeesAboveThreshold",
    topic: "Workforce programs",
    prompt: "With on-site and corporate staff of this size, how are workers' compensation return-to-work, employment practices (handbook, training, documentation), and manager training handled?",
    options: ladder(
      "No return-to-work program; handbook is outdated or missing",
      "Handbook exists; return-to-work and manager training are informal",
      "Written return-to-work program, current handbook, and documented manager training",
      "All of the prior plus experience-mod review, claims-trend analysis, and annual employment-practices training with records",
    ),
    weights: w(2, 3, 2),
  },
  {
    id: "br_governance_investors",
    category: "governance",
    branch: "hasOutsideInvestors",
    topic: "Investors, funds & lenders",
    prompt: "With outside investors, funds, or lenders, how are investor reporting, fund and entity E&O and D&O exposures, and lender insurance requirements managed?",
    options: ladder(
      "Updates are provided on demand; entity coverages and lender requirements have not been reviewed",
      "Annual performance updates; coverage was placed at the time of the raise and not revisited",
      "Quarterly reporting on performance and key metrics; E&O and D&O reviewed annually with the broker against fund documents; lender requirements tracked",
      "Quarterly reporting with online access, annual review of entity coverages, every legal entity confirmed as a named insured, and lender requirements reconciled at each closing",
    ),
    weights: w(3, 2, 2),
  },
  {
    id: "br_environmental",
    category: "emerging_risk",
    branch: "environmentalExposures",
    topic: "Environmental risks",
    prompt: "What are your practices for environmental risks at the properties (lead, mold, asbestos, oil tanks, legionella, soil contamination), including due diligence on acquisitions?",
    options: ladder(
      "I don't know; we have not looked at it",
      "We depend on what we read and hear from industry groups; we may purchase environmental insurance",
      "An environmental specialist has reviewed the portfolio and surveys; environmental due diligence is part of acquisitions",
      "Specialist reviews the portfolio routinely, moisture and mold procedures are written, lender environmental conditions are tracked, and environmental insurance is reviewed with the broker",
    ),
    weights: w(3, 3, 2),
  },
];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export const CORE_QUESTIONS = QUESTIONS.filter((q) => !q.branch);
export const BRANCH_QUESTIONS = QUESTIONS.filter((q) => !!q.branch);

/** Returns the questions that apply to a given profile, in display order. */
export function getApplicableQuestions(profile: Pick<AssessmentProfile, import("./types").BranchTrigger>): Question[] {
  return QUESTIONS.filter((q) => !q.branch || profile[q.branch] === true);
}

/** Applies industry-specific wording, if any. Scoring metadata is untouched. */
export function resolveQuestion(question: Question, industry: IndustryId): Question {
  const v = question.variants?.[industry];
  if (!v) return question;
  return {
    ...question,
    prompt: v.prompt ?? question.prompt,
    help: v.help ?? question.help,
    options: v.options ?? question.options,
  };
}

export function isQuestionApplicable(question: Question, profile: Partial<AssessmentProfile>): boolean {
  return !question.branch || profile[question.branch] === true;
}
