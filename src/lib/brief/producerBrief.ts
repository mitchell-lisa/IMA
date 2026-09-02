import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  EMPLOYEE_BAND_LABELS,
  INCUMBENT_TENURE_LABELS,
  MAJOR_LINE_LABELS,
  MONTH_LABELS,
  PREMIUM_BAND_LABELS,
  PRIMARY_CONCERN_LABELS,
  QUESTION_BY_ID,
  REVENUE_BAND_LABELS,
  ROLE_LABELS,
  getIndustry,
  nicheLabel,
} from "@/lib/diagnostic";
import type { CategoryId, Finding, MajorLine } from "@/lib/diagnostic";
import type { AssessmentRecord, LeadRecord } from "@/lib/server/repo/types";

/**
 * One-page Producer Brief. Deterministic; built entirely from stored
 * structured data. An optional AI summary can be attached by the caller.
 */
export interface ProducerBrief {
  generatedAt: string;
  snapshot: {
    company: string;
    website: string | null;
    industry: string;
    niche: string | null;
    naics: string[];
    territory: string | null;
    zip: string;
    employees: string;
    revenue: string;
    contact: { name: string | null; email: string; role: string | null; phone: string | null };
    partner: string | null;
    source: string | null;
    module: string;
  };
  whyItMatters: string[];
  opportunities: Finding[];
  statedPainPoints: string[];
  businessChangeSignals: string[];
  renewalContext: {
    renewalMonth: string | null;
    monthsUntilRenewal: number | null;
    incumbentTenure: string | null;
    premiumBand: string | null;
    majorLines: string[];
    message: string;
  };
  openingQuestions: string[];
  specialists: string[];
  agenda: Array<{ minutes: number; item: string }>;
  leadQuality: LeadRecord["leadScore"];
  /**
   * Maps diagnostic categories onto the six categories used in IMA's
   * Risk Workshop spreadsheet so results carry straight into the session.
   */
  workshopCrosswalk: WorkshopCrosswalkRow[];
  /** The seven-step workshop path from the IMA workshop deck. */
  workshopPath: Array<{ step: number; title: string; who: "IMA" | "IMA + client"; detail: string }>;
  /** Year-round service-plan themes suggested by the findings. */
  servicePlanThemes: string[];
  scores: {
    overall: number | null;
    confidence: number;
    categories: Array<{ category: CategoryId; label: string; score: number | null; band: string | null }>;
    criticalFlags: string[];
    consistencyNotes: string[];
  };
  reviewStatus: {
    disposition: string;
    followUpOwner: string | null;
    licensedReviewCompleted: boolean;
  };
  summary: string;
  aiSummary?: string | null;
}

export interface WorkshopCrosswalkRow {
  /** Workshop dimension name as used in the product plan. */
  workshopCategory: string;
  /** What the workshop evaluates in this dimension (from the plan's dimension table). */
  evaluates: string;
  /** Diagnostic questions that inform this dimension. */
  questionIds: string[];
  /** Weighted maturity (0-100) over the answered, non-unknown questions above, or null. */
  score: number | null;
  /** How many of the mapped questions were applicable and answered with a known value. */
  answered: number;
  applicable: number;
  /** Practices the workshop evaluates that the diagnostic deliberately leaves to licensed review. */
  reservedForWorkshop: string[];
}

/**
 * Question-level mapping onto the six workshop dimensions. A question may
 * inform more than one dimension (e.g. cyber controls are an operational
 * control and, in the workshop's framing, an emerging risk).
 */
const WORKSHOP_CROSSWALK: Array<Pick<WorkshopCrosswalkRow, "workshopCategory" | "evaluates" | "questionIds" | "reservedForWorkshop">> = [
  {
    workshopCategory: "Insurance-program design",
    evaluates: "Replacement-cost methodology, carrier-submission quality, named-insured completeness, policy exclusions, liability-limit rationale, underwriting narrative",
    questionIds: ["gov_renewal_lead_time", "gov_internal_owner", "gov_limit_rationale", "mkt_exposure_data", "mkt_business_changes", "mkt_submission_visibility", "br_property_valuation"],
    reservedForWorkshop: [
      "Replacement-cost methodology against actual schedules",
      "Policy exclusions and whether all legal entities are scheduled as named insureds",
      "Liability limit adequacy against contracts, balance sheet, and defensibility",
    ],
  },
  {
    workshopCategory: "Operational controls",
    evaluates: "Information security, wire-transfer procedures, technology systems, training, leasing/customer processes, third-party oversight",
    questionIds: ["ops_cyber_controls", "ops_payment_authorization", "ops_safety_training", "br_data_security", "br_fleet_controls", "br_workforce_programs"],
    reservedForWorkshop: ["Technology systems and third-party oversight in detail", "Customer-facing processes and employment-practices exposure"],
  },
  {
    workshopCategory: "Property/maintenance",
    evaluates: "Carrier recommendations, documented inspections, snow and ice, security, emerging equipment exposures",
    questionIds: ["br_property_valuation", "ops_safety_training"],
    reservedForWorkshop: [
      "Carrier recommendation history and responses",
      "Security, snow and ice procedures, and emerging equipment exposures (lithium batteries, EV charging)",
    ],
  },
  {
    workshopCategory: "Claims",
    evaluates: "Intake protocols, reporting, adjuster management, counsel strategy, broker advocacy, public-adjuster use",
    questionIds: ["clm_reporting_protocol", "clm_open_claim_review", "clm_root_cause"],
    reservedForWorkshop: ["Loss-run review and open-claim reserves", "Carrier-assigned counsel and public-adjuster experience", "Uncovered or disputed claims"],
  },
  {
    workshopCategory: "Emerging risk",
    evaluates: "Cyber/privacy, environmental issues, regulatory developments, frequency of formal risk assessments",
    questionIds: ["emr_annual_review", "emr_regulatory", "emr_new_activity_review", "ops_cyber_controls", "br_regulated_materials"],
    reservedForWorkshop: ["Environmental exposures and lender environmental conditions", "Cyber/privacy coverage alignment"],
  },
  {
    workshopCategory: "Contractual risk transfer",
    evaluates: "Signed contracts, indemnification, additional-insured requirements, COIs, vendor and management agreements",
    questionIds: ["crt_signed_contracts", "crt_insurance_requirements", "crt_coi_verification", "br_subcontractor_transfer"],
    reservedForWorkshop: ["Review of actual contracts, certificates, and endorsements", "Management, landlord, and lender agreement requirements"],
  },
];

const WORKSHOP_PATH: ProducerBrief["workshopPath"] = [
  { step: 1, title: "Introductory conversation", who: "IMA", detail: "Initial meeting with the primary contact; confirm what the diagnostic surfaced and what they want to learn." },
  { step: 2, title: "Stakeholder alignment", who: "IMA + client", detail: "Identify workshop participants (finance, operations, HR/safety, board where relevant)." },
  { step: 3, title: "Risk workshop", who: "IMA + client", detail: "Full session covering program, operations, claims, and contracts using the workshop question set." },
  { step: 4, title: "Program review", who: "IMA", detail: "Analyze policies, limits, exclusions, and carrier relationships (licensed review)." },
  { step: 5, title: "Story development", who: "IMA", detail: "Build the underwriting narrative from actual strengths and controls." },
  { step: 6, title: "Findings and opportunities", who: "IMA + client", detail: "Present gaps, positioning options, and a proposed year-round service plan." },
  { step: 7, title: "Next-step decision", who: "IMA + client", detail: "Determine the path forward together, with no obligation to proceed." },
];

const SERVICE_PLAN_BY_CATEGORY: Record<CategoryId, string> = {
  governance: "Pre-renewal strategy meeting 120+ days out, renewal calendar with named owners, and a documented limit and deductible rationale",
  market_readiness: "Exposure-data reconciliation and submission review before marketing; quarterly business-change check-ins",
  operational_controls: "Risk-control review (cyber controls, funds-transfer procedures, safety documentation) with carrier-creditable evidence",
  claims: "Claims advocacy: contact adjusters on open claims, scheduled claim reviews, reporting protocol, and loss-run reconciliation before renewal",
  contractual_risk_transfer: "Build a contractual risk transfer program: review contracts in force, requirement templates, and certificate tracking",
  emerging_risk: "Annual risk assessment outside the renewal cycle, regulatory calendar, and a new-activity review checkpoint",
};

const DECK_DIALOGUE_STARTERS = [
  "Who is involved in insurance decisions today: CFO, ownership, operations, a board, or outside advisors?",
  "Do you use one broker or several advisors across different lines?",
  "What do you value most about the current broker relationship, and what could be better?",
  "Is the current broker proactive throughout the year, or primarily engaged around renewal?",
];

const SPECIALIST_BY_CATEGORY: Record<CategoryId, string> = {
  governance: "Account executive / program lead",
  market_readiness: "Marketing & placement specialist",
  operational_controls: "Risk control consultant",
  claims: "Claims advocate",
  contractual_risk_transfer: "Contract review / certificate management specialist",
  emerging_risk: "Industry practice leader",
};

const SPECIALIST_BY_LINE: Partial<Record<MajorLine, string>> = {
  cyber: "Cyber practice specialist",
  environmental: "Environmental practice specialist",
  d_and_o: "Management liability specialist",
  commercial_auto: "Fleet / transportation specialist",
  workers_comp: "Workers' compensation & claims specialist",
  property: "Property valuation specialist",
};

const OPENING_QUESTION_BY_FINDING: Record<string, string> = {
  renewal_starts_late: "Walk me through what happened in the 90 days before your last renewal. Who was involved, and when did the first submission go out?",
  contracts_not_one_system: "For your largest customer contract, who checks that the certificate and endorsements actually match what the contract requires?",
  business_outpaced_governance: "What has changed in the business in the last 12 months, and how did each change reach your insurance program?",
  claims_reactive: "When was the last time you reviewed open claims and reserves with someone outside the carrier?",
  exposure_data_limits_markets: "How are the values on your current schedules validated, and have you seen the narrative that accompanied your last submission?",
  social_engineering_path: "If a vendor emailed new bank details tomorrow, what would happen before the next payment went out?",
  cyber_minimums: "Which cyber controls were attested on your last application, and who verified them?",
  no_program_owner: "If your broker called with a question today, who would answer it, and who would if that person were out?",
  limits_not_reasoned: "When were current limits last discussed against contracts and asset values, and what drove that conversation?",
  safety_undocumented: "What safety documentation could you hand a carrier tomorrow, and what exists only in practice?",
  property_values_stale: "When were replacement values last established, and what building updates have happened since?",
  fleet_controls: "How are drivers screened today, and what happens when an MVR comes back with an issue?",
  subcontractor_transfer_gap: "What happens when a subcontractor cannot produce the required endorsements?",
  workforce_programs_gap: "How is an injured employee brought back to work today, and who owns that process?",
  investor_governance_gap: "Has the board or investor group reviewed governance-related coverage since the last capital event?",
  environmental_gap: "Which permits apply to your operations, and who is responsible for keeping them current?",
  emerging_risk_unmanaged: "When you last added a location or product line, at what point did insurance come into the discussion?",
};

export function buildProducerBrief(lead: LeadRecord, assessment: AssessmentRecord): ProducerBrief {
  const p = assessment.profile;
  const r = assessment.result;
  const industry = getIndustry(p.industry);
  const findings = r?.findings ?? [];
  const scores = r?.scores;

  const whyItMatters: string[] = [];
  if (lead.leadScore.tier === "A") whyItMatters.push("High lead-quality score: strong fit, senior contact, and timely renewal.");
  if (lead.workshopRequested) whyItMatters.push("Prospect explicitly requested a workshop.");
  if (scores && scores.criticalFlags.length) whyItMatters.push(`${scores.criticalFlags.length} critical-control flag${scores.criticalFlags.length === 1 ? "" : "s"} surfaced regardless of overall score.`);
  if (r?.renewal.status === "inside_window" || r?.renewal.status === "approaching") whyItMatters.push("Renewal is inside or near the 120-day preparation window.");
  if (p.recentAcquisitionOrNewLocation) whyItMatters.push("Recent acquisition or new location reported.");
  if (p.willingToSharePolicies === "yes") whyItMatters.push("Willing to share policies or loss runs during a workshop.");
  if (p.incumbentTenure === "under_2") whyItMatters.push("Incumbent broker relationship is under two years old.");
  if (whyItMatters.length === 0) whyItMatters.push("Completed the full diagnostic and provided contact details; review for fit.");

  const statedPainPoints: string[] = [];
  if (p.primaryConcern) statedPainPoints.push(`Largest concern: ${PRIMARY_CONCERN_LABELS[p.primaryConcern]}`);
  if (lead.prospectNotes) statedPainPoints.push(`In their words: "${lead.prospectNotes}"`);
  for (const f of scores?.criticalFlags ?? []) statedPainPoints.push(f.message);

  const businessChangeSignals: string[] = [];
  if (p.recentAcquisitionOrNewLocation) businessChangeSignals.push("Recent acquisition or new location in the last 24 months.");
  const changes = assessment.answers["mkt_business_changes"];
  if (typeof changes === "number" && changes <= 1) businessChangeSignals.push("Operational changes reach the insurance program late or inconsistently.");
  const newActivity = assessment.answers["emr_new_activity_review"];
  if (typeof newActivity === "number" && newActivity <= 1) businessChangeSignals.push("New activities are not reviewed for insurance impact before launch.");
  if (p.employeesAboveThreshold) businessChangeSignals.push(`Workforce above ${industry.employeeThreshold} employees.`);
  if (businessChangeSignals.length === 0) businessChangeSignals.push("No business-change signals reported.");

  const openingQuestions = findings
    .map((f) => OPENING_QUESTION_BY_FINDING[f.id])
    .filter((q): q is string => Boolean(q));
  for (const note of scores?.consistencyNotes ?? []) openingQuestions.push(note.message.replace(/\.$/, "") + " — can you walk me through that?");
  for (const q of DECK_DIALOGUE_STARTERS) if (openingQuestions.length < 6) openingQuestions.push(q);
  openingQuestions.push("What would you want a carrier to know about the business that they probably do not know today?");

  const specialists = new Set<string>();
  for (const f of findings) if (f.category !== "overall") specialists.add(SPECIALIST_BY_CATEGORY[f.category]);
  for (const line of p.majorLines ?? []) {
    const s = SPECIALIST_BY_LINE[line];
    if (s) specialists.add(s);
  }
  if (specialists.size === 0) specialists.add(SPECIALIST_BY_CATEGORY.governance);

  const agenda = [
    { minutes: 5, item: "Introductions, confidentiality, and what the diagnostic can and cannot conclude" },
    { minutes: 10, item: `Business overview: operations, recent changes, and ${p.primaryConcern ? PRIMARY_CONCERN_LABELS[p.primaryConcern].toLowerCase() : "top concerns"}` },
    { minutes: 15, item: `Walk through the three investigation areas: ${findings.map((f) => CATEGORY_LABELS[f.category as CategoryId]?.short ?? "overall").join(", ")}` },
    { minutes: 10, item: "Renewal timeline, incumbent relationship, and what a documented submission would include" },
    { minutes: 5, item: "Agree on document requests and next steps (licensed review of policies and loss runs)" },
  ];

  const applicableIds = new Set(scores?.applicableQuestionIds ?? []);
  const workshopCrosswalk: WorkshopCrosswalkRow[] = WORKSHOP_CROSSWALK.map((row) => {
    let earned = 0;
    let available = 0;
    let answered = 0;
    let applicable = 0;
    for (const id of row.questionIds) {
      if (!applicableIds.has(id)) continue;
      applicable += 1;
      const v = assessment.answers[id];
      if (typeof v !== "number") continue;
      const weight = QUESTION_BY_ID[id]?.weights[industry.id] ?? 1;
      answered += 1;
      earned += v * weight;
      available += 3 * weight;
    }
    const score = available > 0 ? Math.round((earned / available) * 1000) / 10 : null;
    return { ...row, score, answered, applicable };
  });

  const servicePlanThemes = Array.from(
    new Set(
      [...findings.map((f) => f.category), ...(scores?.criticalFlags ?? []).map((f) => f.category)]
        .filter((c): c is CategoryId => c !== "overall")
        .map((c) => SERVICE_PLAN_BY_CATEGORY[c]),
    ),
  );
  servicePlanThemes.push("Quarterly stewardship meeting covering market developments, claims, and pre-renewal planning");

  const summary = [
    `${p.companyName} is a ${industry.label} company (${REVENUE_BAND_LABELS[p.revenueBand]} revenue, ${EMPLOYEE_BAND_LABELS[p.employeeBand]} employees)${assessment.enrichment?.territoryLabel ? ` in ${assessment.enrichment.territoryLabel}` : ""}.`,
    scores?.overall !== null && scores?.overall !== undefined
      ? `Overall readiness score is ${scores.overall} with ${scores.confidence}% confidence.`
      : "The diagnostic did not produce an overall score.",
    findings.length ? `Top investigation areas: ${findings.map((f) => f.title.replace(/\.$/, "")).join("; ")}.` : "",
    r?.renewal.message ?? "",
    "Every statement above derives from the prospect's own answers and requires licensed review before any coverage discussion.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    generatedAt: new Date().toISOString(),
    snapshot: {
      company: p.companyName,
      website: assessment.enrichment?.domain ?? p.website ?? null,
      industry: industry.label,
      niche: nicheLabel(p.niche),
      naics: industry.naics,
      territory: assessment.enrichment?.territoryLabel ?? null,
      zip: p.zip,
      employees: EMPLOYEE_BAND_LABELS[p.employeeBand],
      revenue: REVENUE_BAND_LABELS[p.revenueBand],
      contact: { name: lead.name, email: lead.email, role: lead.role ? ROLE_LABELS[lead.role] : null, phone: lead.phone },
      partner: assessment.attribution.partnerCode ?? null,
      source: assessment.attribution.source ?? null,
      module: assessment.attribution.module ?? "marketready",
    },
    whyItMatters,
    opportunities: findings,
    statedPainPoints,
    businessChangeSignals,
    renewalContext: {
      renewalMonth: p.renewalMonth ? MONTH_LABELS[p.renewalMonth - 1] : null,
      monthsUntilRenewal: r?.renewal.monthsUntilRenewal ?? null,
      incumbentTenure: p.incumbentTenure ? INCUMBENT_TENURE_LABELS[p.incumbentTenure] : null,
      premiumBand: p.premiumBand ? PREMIUM_BAND_LABELS[p.premiumBand] : null,
      majorLines: (p.majorLines ?? []).map((l) => MAJOR_LINE_LABELS[l]),
      message: r?.renewal.message ?? "Renewal month not provided.",
    },
    openingQuestions: openingQuestions.slice(0, 6),
    specialists: Array.from(specialists),
    agenda,
    leadQuality: lead.leadScore,
    workshopCrosswalk,
    workshopPath: WORKSHOP_PATH,
    servicePlanThemes,
    scores: {
      overall: scores?.overall ?? null,
      confidence: scores?.confidence ?? 0,
      categories: CATEGORY_IDS.map((c) => {
        const cs = scores?.categories.find((x) => x.category === c);
        return { category: c, label: CATEGORY_LABELS[c].label, score: cs?.score ?? null, band: cs?.band ?? null };
      }),
      criticalFlags: (scores?.criticalFlags ?? []).map((f) => `${QUESTION_BY_ID[f.questionId]?.topic ?? f.questionId}: ${f.message}`),
      consistencyNotes: (scores?.consistencyNotes ?? []).map((n) => n.message),
    },
    reviewStatus: {
      disposition: lead.disposition,
      followUpOwner: lead.followUpOwner,
      licensedReviewCompleted: lead.licensedReviewCompleted,
    },
    summary,
  };
}

export function briefToMarkdown(b: ProducerBrief): string {
  const lines: string[] = [];
  lines.push(`# Producer Brief: ${b.snapshot.company}`);
  lines.push(`_Generated ${b.generatedAt}. Internal use. Requires licensed review before any coverage discussion._`, "");
  lines.push(`## 1. Account snapshot`);
  lines.push(`- Industry: ${b.snapshot.industry}${b.snapshot.niche ? ` · ${b.snapshot.niche}` : ""}${b.snapshot.naics.length ? ` (NAICS ${b.snapshot.naics.join(", ")})` : ""}`);
  lines.push(`- Website: ${b.snapshot.website ?? "n/a"}`);
  lines.push(`- Location: ZIP ${b.snapshot.zip}${b.snapshot.territory ? `, ${b.snapshot.territory}` : ""}`);
  lines.push(`- Size: ${b.snapshot.employees} employees, ${b.snapshot.revenue} revenue`);
  lines.push(`- Contact: ${b.snapshot.contact.name ?? "n/a"}${b.snapshot.contact.role ? ` (${b.snapshot.contact.role})` : ""}, ${b.snapshot.contact.email}${b.snapshot.contact.phone ? `, ${b.snapshot.contact.phone}` : ""}`);
  lines.push(`- Source: ${b.snapshot.partner ? `Partner ${b.snapshot.partner}` : b.snapshot.source ?? "direct"} · Entry module: ${b.snapshot.module}`, "");
  lines.push(`## 2. Why this lead matters`, ...b.whyItMatters.map((w) => `- ${w}`), "");
  lines.push(`## 3. Top potential opportunities`);
  b.opportunities.forEach((f, i) => {
    lines.push(`${i + 1}. **${f.title}** ${f.body}${f.detail ? ` ${f.detail}` : ""}`);
  });
  lines.push("");
  lines.push(`## 4. Stated pain points`, ...(b.statedPainPoints.length ? b.statedPainPoints.map((s) => `- ${s}`) : ["- None stated"]), "");
  lines.push(`## 5. Business-change signals`, ...b.businessChangeSignals.map((s) => `- ${s}`), "");
  lines.push(`## 6. Renewal and incumbent context`);
  lines.push(`- Renewal month: ${b.renewalContext.renewalMonth ?? "n/a"}${b.renewalContext.monthsUntilRenewal !== null ? ` (${b.renewalContext.monthsUntilRenewal} months out)` : ""}`);
  lines.push(`- Incumbent tenure: ${b.renewalContext.incumbentTenure ?? "n/a"}`);
  lines.push(`- Premium band: ${b.renewalContext.premiumBand ?? "n/a"}`);
  lines.push(`- Major lines: ${b.renewalContext.majorLines.join(", ") || "n/a"}`);
  lines.push(`- ${b.renewalContext.message}`, "");
  lines.push(`## 7. Recommended opening questions`, ...b.openingQuestions.map((q) => `- ${q}`), "");
  lines.push(`## 8. Suggested specialist participants`, ...b.specialists.map((s) => `- ${s}`), "");
  lines.push(`## 9. Proposed 45-minute workshop agenda`, ...b.agenda.map((a) => `- ${a.minutes} min: ${a.item}`), "");
  lines.push(`### Workshop path`, ...b.workshopPath.map((p) => `${p.step}. **${p.title}** (${p.who}) — ${p.detail}`), "");
  lines.push(`### Service-plan themes suggested by the findings`, ...b.servicePlanThemes.map((t) => `- ${t}`), "");
  lines.push(`## 10. Lead quality score`);
  const q = b.leadQuality;
  lines.push(`**${q.total}/100 (Tier ${q.tier})** — company fit ${q.companyFit}/25, seniority ${q.seniority}/20, renewal timing ${q.renewalTiming}/20, demonstrated pain ${q.demonstratedPain}/20, engagement ${q.engagementIntent}/10, completeness ${q.dataCompleteness}/5.`);
  lines.push(`_Sales-prioritization score only; not an insurance-risk score._`, "");
  lines.push(`## Diagnostic scores`);
  lines.push(`- Overall: ${b.scores.overall ?? "n/a"} (confidence ${b.scores.confidence}%)`);
  for (const c of b.scores.categories) lines.push(`- ${c.label}: ${c.score ?? "insufficient data"}${c.band ? ` (${c.band})` : ""}`);
  lines.push("", `## Workshop crosswalk`, `| Workshop dimension | What the workshop evaluates | Diagnostic score (answered/applicable) | Reserved for licensed review |`, `|---|---|---|---|`);
  for (const row of b.workshopCrosswalk) lines.push(`| ${row.workshopCategory} | ${row.evaluates} | ${row.score ?? "n/a"} (${row.answered}/${row.applicable}) | ${row.reservedForWorkshop.join("; ")} |`);
  if (b.scores.criticalFlags.length) lines.push("", `**Critical flags**`, ...b.scores.criticalFlags.map((f) => `- ${f}`));
  if (b.scores.consistencyNotes.length) lines.push("", `**Consistency notes**`, ...b.scores.consistencyNotes.map((n) => `- ${n}`));
  lines.push("", `## Summary`, b.summary);
  if (b.aiSummary) lines.push("", `## AI-drafted summary (from structured findings only)`, b.aiSummary);
  return lines.join("\n");
}
