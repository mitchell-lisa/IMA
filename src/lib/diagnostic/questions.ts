import type { AssessmentProfile, IndustryId, Question, QuestionWeight } from "./types";

type W = [logistics: QuestionWeight, manufacturing: QuestionWeight, other: QuestionWeight];

function w(...[l, m, o]: W): Record<IndustryId, QuestionWeight> {
  return { logistics_3pl: l, light_manufacturing: m, other: o };
}

/**
 * Standard maturity ladder. Every question uses the same four levels so that
 * scoring stays deterministic and comparable across categories:
 *   0 = undocumented / reactive
 *   1 = partial / inconsistent
 *   2 = documented
 *   3 = documented, monitored, and reviewed
 */
function ladder(l0: string, l1: string, l2: string, l3: string): Question["options"] {
  return [
    { value: 0, label: l0 },
    { value: 1, label: l1 },
    { value: 2, label: l2 },
    { value: 3, label: l3 },
  ];
}

/**
 * The 18 core questions (three per category) followed by seven branched
 * questions, each unlocked by one profile flag.
 */
export const QUESTIONS: Question[] = [
  // ---------------------------------------------------------------- Governance
  {
    id: "gov_renewal_lead_time",
    category: "governance",
    topic: "Renewal lead time",
    prompt: "When does renewal preparation typically begin relative to your policy expiration?",
    help: "Carriers reward complete submissions delivered early. Late starts compress negotiation time.",
    options: ladder(
      "Within 30 days of expiration, or when the broker reaches out",
      "About 60 days out, but it varies year to year",
      "90+ days out with a written timeline",
      "120+ days out with a documented calendar, owners, and a pre-renewal strategy meeting",
    ),
    weights: w(3, 3, 3),
    critical: {
      atOrBelow: 0,
      message: "Renewal preparation appears to begin inside 30 days of expiration, which limits the ability to document controls and approach alternative markets.",
    },
  },
  {
    id: "gov_internal_owner",
    category: "governance",
    topic: "Program ownership",
    prompt: "Who owns the insurance program internally, and how is that responsibility defined?",
    options: ladder(
      "No single owner; whoever the broker contacts handles it",
      "One person handles it informally alongside other duties",
      "A named owner with defined responsibilities",
      "A named owner, a backup, and a cross-functional review (finance, operations, HR/safety)",
    ),
    weights: w(2, 2, 2),
  },
  {
    id: "gov_limit_rationale",
    category: "governance",
    topic: "Limit rationale",
    prompt: "How are policy limits and deductibles decided each year?",
    help: "This question asks about your decision process, not whether the limits are adequate.",
    options: ladder(
      "We renew the same limits without discussion",
      "The broker recommends and we generally accept",
      "We review limits against contracts, assets, and revenue annually",
      "We document the rationale for each limit and deductible and revisit it when the business changes",
    ),
    weights: w(2, 2, 2),
  },

  // ---------------------------------------------------------- Market readiness
  {
    id: "mkt_exposure_data",
    category: "market_readiness",
    topic: "Exposure data",
    prompt: "How are exposure values (payroll, revenue, property values, vehicle schedules, inventory) validated before submission?",
    options: ladder(
      "We use last year's numbers unless someone flags a change",
      "We update the big items but rarely reconcile schedules",
      "Finance validates values annually against records",
      "Values are reconciled against financials, fixed-asset registers, and schedules, with sign-off before submission",
    ),
    weights: w(3, 3, 3),
    variants: {
      logistics_3pl: {
        help: "For a 3PL this includes the value of customers' goods in your care, custody, and control, vehicle and trailer schedules, and square footage by location.",
      },
      light_manufacturing: {
        help: "For a manufacturer this includes machinery and equipment values, a business-interruption worksheet, and any dependence on a single supplier or customer.",
      },
    },
  },
  {
    id: "mkt_business_changes",
    category: "market_readiness",
    topic: "Business change documentation",
    prompt: "How are operational changes (new services, locations, equipment, customers, headcount) communicated to your insurance program during the year?",
    options: ladder(
      "They surface at renewal, if at all",
      "We mention major changes when we remember",
      "A defined process captures changes and shares them with the broker",
      "Changes are logged, reviewed quarterly for insurance impact, and reflected in mid-term endorsements when needed",
    ),
    weights: w(3, 2, 2),
  },
  {
    id: "mkt_submission_visibility",
    category: "market_readiness",
    topic: "Submission visibility",
    prompt: "How much visibility do you have into what is actually sent to carriers about your company?",
    help: "The underwriting story is the narrative and evidence that accompanies applications and loss runs.",
    options: ladder(
      "None; we sign applications and the broker handles the rest",
      "We submit updated information annually but have not seen how our story is told to carriers",
      "We review the submission and know which carriers quoted or declined",
      "We collaborate with our broker on how best to portray the company in the marketplace, review the full submission, and receive a market summary with reasons for declinations",
    ),
    weights: w(2, 2, 2),
  },

  // ------------------------------------------------------ Operational controls
  {
    id: "ops_cyber_controls",
    category: "operational_controls",
    topic: "Cyber controls",
    prompt: "Which of the following best describes your cyber controls (MFA, backups, endpoint protection, incident response)?",
    options: ladder(
      "Basic antivirus; MFA and tested backups are not consistently in place",
      "MFA on email; backups exist but are not tested regularly",
      "MFA on email and remote access, tested offline backups, endpoint detection, and a written incident plan",
      "All of the prior plus annual testing, vendor security review, and executive reporting",
    ),
    weights: w(3, 2, 2),
    critical: {
      atOrBelow: 0,
      message: "Multi-factor authentication and tested backups do not appear to be consistently in place. Most cyber carriers now treat these as minimum requirements.",
    },
  },
  {
    id: "ops_payment_authorization",
    category: "operational_controls",
    topic: "Payment & wire controls",
    prompt: "How are changes to vendor bank details and outgoing wire requests verified?",
    options: ladder(
      "No formal protocol; an email or phone request is usually sufficient",
      "Some combination of dual authorization and written procedures, applied inconsistently",
      "Written procedure with callback verification to a known number and dual approval for all bank changes and wires",
      "Formal written program with regular training: dual authorization, callback verification, destination confirmation, and receipt confirmation",
    ),
    weights: w(3, 3, 3),
    critical: {
      atOrBelow: 0,
      message: "Vendor bank-detail changes and wires may be released on an email or phone request alone, which is the most common path for social-engineering losses.",
    },
  },
  {
    id: "ops_safety_training",
    category: "operational_controls",
    topic: "Safety & training",
    prompt: "How are safety programs, training, and inspections documented?",
    options: ladder(
      "Training happens on the job; little is written down",
      "Some written procedures; training records are incomplete",
      "Written safety program, documented training, and periodic inspections",
      "Written program with documented training, inspections, near-miss reporting, and management review of results",
    ),
    weights: w(3, 3, 2),
    variants: {
      logistics_3pl: {
        prompt: "How are warehouse and dock safety (forklift certification, racking, housekeeping), fire protection (sprinkler inspections, impairment procedures, commodity storage), and driver training documented?",
        help: "Warehouse underwriters look first at fire protection and forklift and dock injury controls.",
      },
      light_manufacturing: {
        prompt: "How are machine guarding, lockout/tagout, hearing and respiratory protection, and safety training documented?",
        help: "Machine guarding and lockout/tagout drive both workers' compensation experience and product-safety credibility with underwriters.",
      },
    },
  },

  // ------------------------------------------------------------------- Claims
  {
    id: "clm_reporting_protocol",
    category: "claims",
    topic: "Incident reporting",
    prompt: "What happens when an incident or potential claim occurs?",
    options: ladder(
      "It is reported when someone thinks of it, sometimes weeks later",
      "Supervisors know to report, but timing and format vary",
      "A written protocol defines who reports, how, and within what timeframe",
      "Written protocol, reporting within 24–48 hours, an incident form, and tracking of every report",
    ),
    weights: w(3, 3, 3),
    critical: {
      atOrBelow: 0,
      message: "Incidents appear to be reported inconsistently or late. Late reporting is a frequent driver of higher claim costs and coverage disputes.",
    },
  },
  {
    id: "clm_open_claim_review",
    category: "claims",
    topic: "Open claim review",
    prompt: "How often are open claims and reserves reviewed with your broker or carrier?",
    options: ladder(
      "We do not review open claims",
      "Only when the carrier or broker raises something",
      "Scheduled reviews at least twice a year",
      "Quarterly claim reviews with reserve challenges, adjuster accountability, and pre-renewal loss-run reconciliation",
    ),
    weights: w(2, 3, 2),
  },
  {
    id: "clm_root_cause",
    category: "claims",
    topic: "Root cause & corrective action",
    prompt: "After an incident, how are root causes identified and corrective actions tracked?",
    options: ladder(
      "We fix what is obvious and move on",
      "Supervisors discuss causes; actions are not tracked",
      "Root-cause review for significant incidents with documented corrective actions",
      "Every incident gets a root-cause review, corrective actions are tracked to closure, and trends are reported to leadership",
    ),
    weights: w(2, 3, 2),
  },

  // ---------------------------------------------------- Contractual risk transfer
  {
    id: "crt_signed_contracts",
    category: "contractual_risk_transfer",
    topic: "Signed contracts",
    prompt: "Before work begins with customers, vendors, or subcontractors, how consistently are written contracts in place?",
    variants: {
      logistics_3pl: {
        prompt: "Before goods are received or work begins, how consistently are written warehousing agreements, customer contracts, and carrier/vendor agreements in place?",
        help: "Warehouse receipts and customer contracts define your legal liability for goods in your care. Unsigned or inconsistent terms are a common gap.",
      },
      light_manufacturing: {
        prompt: "How consistently are written supply agreements, customer purchase terms, and vendor contracts in place before production or shipment begins?",
        help: "Customer terms often carry product warranty, recall, and indemnity obligations that shape your liability program.",
      },
    },
    options: ladder(
      "Often work starts on a handshake or PO alone",
      "Contracts exist for major relationships; smaller ones vary",
      "Signed contracts are required before work begins",
      "Signed contracts required, with standard indemnity and insurance language reviewed by counsel and tracked centrally",
    ),
    weights: w(3, 2, 2),
  },
  {
    id: "crt_insurance_requirements",
    category: "contractual_risk_transfer",
    topic: "Insurance requirements",
    prompt: "How do you determine what insurance to require from the parties you work with, and what they require from you?",
    variants: {
      logistics_3pl: {
        help: "Customers commonly require warehouse legal liability, cargo, and auto limits. Carriers and subcontracted haulers should be held to defined requirements in return.",
      },
      light_manufacturing: {
        help: "Large customers often specify product liability limits and vendor endorsements; suppliers should be held to defined requirements for the components they provide.",
      },
    },
    options: ladder(
      "We do not set requirements; we accept whatever the other party proposes",
      "We use a generic requirement list without reviewing it",
      "Requirements are defined by relationship type and reviewed by broker or counsel",
      "Requirements are defined, reviewed annually, and cross-checked against our own policies and customer demands",
    ),
    weights: w(3, 2, 2),
  },
  {
    id: "crt_coi_verification",
    category: "contractual_risk_transfer",
    topic: "Certificate verification",
    prompt: "How are certificates of insurance and endorsements (additional insured, waiver of subrogation) verified?",
    options: ladder(
      "We collect certificates when asked but do not review them",
      "Someone checks that a certificate exists; endorsements are rarely verified",
      "Certificates and required endorsements are verified before work and on expiration",
      "Verification is tracked in a system, endorsements are matched to contract terms, and non-compliance is escalated",
    ),
    weights: w(3, 2, 2),
    critical: {
      atOrBelow: 0,
      message: "Certificates of insurance are collected but not reviewed, so contractual risk transfer may not be operating when a loss occurs.",
    },
  },

  // ------------------------------------------------------------ Emerging risk
  {
    id: "emr_annual_review",
    category: "emerging_risk",
    topic: "Annual risk review",
    prompt: "Does leadership conduct a structured risk review outside of the insurance renewal?",
    help: "A risk review looks at operations, contracts, and controls, not just the policies being renewed.",
    options: ladder(
      "Never, or more than five years ago",
      "More than 18 months ago, or only when a new broker or agent first came on board",
      "An annual risk review with a documented risk list",
      "Annual review with owners, action plans, and quarterly progress updates to leadership",
    ),
    weights: w(2, 2, 2),
  },
  {
    id: "emr_regulatory",
    category: "emerging_risk",
    topic: "Regulatory monitoring",
    prompt: "How are regulatory and compliance changes affecting your operations monitored?",
    options: ladder(
      "We learn about changes when we are notified of a violation or audit",
      "Individual managers watch their own areas informally",
      "A defined owner monitors regulations and briefs leadership",
      "Defined owner, documented compliance calendar, and periodic compliance audits",
    ),
    weights: w(2, 3, 2),
  },
  {
    id: "emr_new_activity_review",
    category: "emerging_risk",
    topic: "New activity review",
    prompt: "When you add a new location, product, service, technology, or major customer, is risk and insurance impact reviewed beforehand?",
    variants: {
      logistics_3pl: {
        prompt: "When you take on a new commodity, temperature-controlled or hazardous storage, a new customer contract, or a new facility, is risk and insurance impact reviewed beforehand?",
      },
      light_manufacturing: {
        prompt: "When you launch a new product, add a production line or process, or enter a new market, is product liability, recall, and business-interruption impact reviewed beforehand?",
      },
    },
    options: ladder(
      "Not usually; insurance catches up later",
      "Sometimes, for very large changes",
      "A review step is included in the launch process",
      "Documented pre-launch review with operations, finance, broker input, and follow-up after launch",
    ),
    weights: w(2, 2, 2),
  },

  // ---------------------------------------------------------- Branched (7)
  {
    id: "br_property_valuation",
    category: "market_readiness",
    branch: "ownsBuildings",
    topic: "Property valuation & building updates",
    prompt: "For the buildings you own, how are replacement values, business-interruption values, flood exposure, building updates (roof, sprinklers, electrical), and carrier loss-control recommendations documented and tracked?",
    help: "Carriers issue recommendations after inspections. How you respond to them is part of the underwriting story.",
    options: ladder(
      "Values are carried forward; building updates and carrier recommendations are not tracked",
      "Values were reviewed a few years ago; we do the minimum needed to stay compliant with carrier recommendations",
      "Replacement and BI values are reviewed annually; update history and recommendation responses are documented",
      "Professional valuation within three years, BI worksheet, flood zone determination, documented inspections and update history, and an active protocol for responding to and tracking every carrier recommendation",
    ),
    weights: w(3, 3, 2),
  },
  {
    id: "br_fleet_controls",
    category: "operational_controls",
    branch: "hasVehicles",
    topic: "Fleet & driver controls",
    prompt: "How are drivers screened and vehicles managed (MVRs, telematics, hired and non-owned auto)?",
    options: ladder(
      "We do not run MVRs consistently; personal vehicle use is not addressed",
      "MVRs at hire only; no written fleet policy",
      "Written fleet policy, annual MVRs, and a defined hired/non-owned auto approach",
      "Written policy, annual MVRs with disqualification criteria, telematics or cameras, and driver training records",
    ),
    weights: w(3, 2, 2),
    critical: {
      atOrBelow: 0,
      message: "Motor vehicle records do not appear to be run consistently, which commercial auto underwriters treat as a primary control.",
    },
  },
  {
    id: "br_subcontractor_transfer",
    category: "contractual_risk_transfer",
    branch: "usesSubcontractors",
    topic: "Subcontractor & vendor risk transfer",
    prompt: "For subcontractors and vendors, how consistently are indemnity terms, additional-insured status, and waivers of subrogation obtained and enforced?",
    options: ladder(
      "We rely on the vendor's own paperwork",
      "Our agreement includes the terms, but we rarely confirm the endorsements",
      "Terms are standard and endorsements are confirmed before work",
      "Terms are standard, endorsements confirmed, non-compliant vendors are stopped from working, and exceptions are approved in writing",
    ),
    weights: w(3, 2, 2),
  },
  {
    id: "br_data_security",
    category: "operational_controls",
    branch: "storesSensitiveData",
    topic: "Sensitive data handling",
    prompt: "For the sensitive customer, employee, or payment data you hold, how are access, vendor security, and incident response managed?",
    options: ladder(
      "Access is broad; we have not reviewed vendor security or an incident plan",
      "Access is limited informally; incident response is undocumented",
      "Role-based access, vendor security review, and a written incident response plan",
      "All of the prior plus annual tabletop exercises, data inventory, and breach-notification readiness",
    ),
    weights: w(2, 2, 2),
  },
  {
    id: "br_workforce_programs",
    category: "operational_controls",
    branch: "employeesAboveThreshold",
    topic: "Workforce programs",
    prompt: "With a workforce of this size, how are workers' compensation return-to-work, employment practices (handbook, training, documentation), and benefits data protection handled?",
    options: ladder(
      "No return-to-work program; handbook is outdated or missing",
      "Handbook exists; return-to-work and manager training are informal",
      "Written return-to-work program, current handbook, and documented manager training",
      "All of the prior plus experience-mod review, claims-trend analysis, and annual employment-practices training",
    ),
    weights: w(3, 3, 2),
  },
  {
    id: "br_governance_investors",
    category: "governance",
    branch: "hasOutsideInvestors",
    topic: "Board & investor governance",
    prompt: "With outside investors or a board, how are directors & officers, fiduciary, and governance-related exposures reviewed?",
    options: ladder(
      "They have not been reviewed",
      "Coverage was placed at the time of investment and not revisited",
      "Reviewed annually with the broker against bylaws, investor agreements, and benefit plans",
      "Annual review plus board reporting on limits, indemnification agreements, and fiduciary controls",
    ),
    weights: w(2, 2, 2),
  },
  {
    id: "br_regulated_materials",
    category: "emerging_risk",
    branch: "regulatedMaterials",
    topic: "Regulated materials & environmental",
    prompt: "For regulated materials or processes, how are environmental permits, storage practices, and pollution exposure managed?",
    options: ladder(
      "We are not sure what permits apply; storage practices are informal",
      "Permits are in place; documentation of storage and disposal is inconsistent",
      "Permits, storage, and disposal are documented with a compliance owner",
      "Documented compliance program, periodic environmental audits, and pollution exposure reviewed with the broker",
    ),
    weights: w(2, 3, 2),
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
