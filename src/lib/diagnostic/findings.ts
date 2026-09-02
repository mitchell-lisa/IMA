import { CATEGORY_LABELS } from "./labels";
import { QUESTION_BY_ID } from "./questions";
import { categoryScoreOf } from "./scoring";
import type { Answers, AssessmentProfile, CategoryId, Finding, ScoreResult } from "./types";
import { CATEGORY_IDS } from "./types";

export interface FindingContext {
  answers: Answers;
  profile: Partial<AssessmentProfile>;
  scores: ScoreResult;
}

function val(ctx: FindingContext, id: string): number | null {
  const v = ctx.answers[id];
  return typeof v === "number" ? v : null;
}

function catScore(ctx: FindingContext, c: CategoryId): number | null {
  return categoryScoreOf(ctx.scores, c).score;
}

function lowest(ctx: FindingContext, ids: string[]): number | null {
  const vals = ids.map((id) => val(ctx, id)).filter((v): v is number => v !== null);
  return vals.length ? Math.min(...vals) : null;
}

function strengthsCount(ctx: FindingContext): number {
  return ctx.scores.applicableQuestionIds.filter((id) => val(ctx, id) === 3).length;
}

interface FindingRule {
  id: string;
  category: CategoryId | "overall";
  title: string;
  body: string;
  detail?: string;
  questionIds: string[];
  /** Base priority; rules add dynamic bumps. */
  priority: number;
  when: (ctx: FindingContext) => boolean;
}

/**
 * The approved findings library. Each rule is deterministic and references
 * the answers that triggered it, so producers can trace every statement.
 *
 * Wording rules: describe what the answers *suggest*, name what to *investigate*,
 * and never state that coverage is inadequate or pricing is wrong.
 */
export const FINDING_RULES: FindingRule[] = [
  {
    id: "renewal_starts_late",
    category: "governance",
    title: "Your renewal process may begin too late to fully document your risk controls.",
    body:
      "Renewal preparation appears to begin with limited runway. Controls that are not documented in time rarely make it into the submission carriers evaluate.",
    detail:
      "Benchmark indication: high-impact underwriting strengths were identified elsewhere in your answers, but they may not be incorporated consistently into carrier submissions.",
    questionIds: ["gov_renewal_lead_time", "mkt_submission_visibility"],
    priority: 90,
    when: (ctx) => {
      const lead = val(ctx, "gov_renewal_lead_time");
      return lead !== null && lead <= 1 && (strengthsCount(ctx) >= 2 || (val(ctx, "mkt_submission_visibility") ?? 3) <= 1);
    },
  },
  {
    id: "contracts_not_one_system",
    category: "contractual_risk_transfer",
    title: "Your contracts and insurance-verification process may not be operating as one control system.",
    body:
      "Answers about signed contracts, insurance requirements, and certificate verification are uneven. Risk transfer only works when all three align.",
    detail:
      "Potential opportunity: review whether contractual requirements, certificates of insurance, and policy endorsements align for your largest customer and vendor relationships.",
    questionIds: ["crt_signed_contracts", "crt_insurance_requirements", "crt_coi_verification"],
    priority: 85,
    when: (ctx) => {
      const vals = ["crt_signed_contracts", "crt_insurance_requirements", "crt_coi_verification"]
        .map((id) => val(ctx, id))
        .filter((v): v is number => v !== null);
      if (vals.length < 2) return false;
      return Math.max(...vals) - Math.min(...vals) >= 2 || Math.min(...vals) <= 0;
    },
  },
  {
    id: "business_outpaced_governance",
    category: "market_readiness",
    title: "Your business has changed faster than your insurance-governance process.",
    body:
      "You reported recent acquisitions or new locations, but operational changes reach the insurance program late or inconsistently.",
    detail:
      "Areas to investigate: new locations, increased payroll, new services, and updated property values, and whether each is reflected in current schedules.",
    questionIds: ["mkt_business_changes", "emr_new_activity_review"],
    priority: 88,
    when: (ctx) =>
      ctx.profile.recentAcquisitionOrNewLocation === true &&
      ((val(ctx, "mkt_business_changes") ?? 3) <= 1 || (val(ctx, "emr_new_activity_review") ?? 3) <= 1),
  },
  {
    id: "claims_reactive",
    category: "claims",
    title: "Your claims process appears reactive rather than managed to a defined cadence.",
    body:
      "Incident reporting, open-claim review, or corrective-action tracking appear informal. Claims that are not managed tend to cost more and stay open longer.",
    detail:
      "Potential opportunity: evaluate reporting timelines, reserve review, adjuster accountability, and how corrective actions are tracked to closure.",
    questionIds: ["clm_reporting_protocol", "clm_open_claim_review", "clm_root_cause"],
    priority: 84,
    when: (ctx) => {
      const s = catScore(ctx, "claims");
      return (s !== null && s < 50) || (lowest(ctx, ["clm_reporting_protocol", "clm_open_claim_review"]) ?? 3) <= 1;
    },
  },
  {
    id: "exposure_data_limits_markets",
    category: "market_readiness",
    title: "Incomplete exposure data or a weak underwriting narrative could limit your market options.",
    body:
      "Exposure values appear to be carried forward without reconciliation, or you have limited visibility into what carriers receive.",
    detail:
      "Pricing cannot be assessed from this questionnaire alone. However, carriers generally offer their best terms to accounts that present validated data and a clear narrative, subject to policy, loss, and underwriting review.",
    questionIds: ["mkt_exposure_data", "mkt_submission_visibility"],
    priority: 82,
    when: (ctx) => (lowest(ctx, ["mkt_exposure_data", "mkt_submission_visibility"]) ?? 3) <= 1,
  },
  {
    id: "social_engineering_path",
    category: "operational_controls",
    title: "Payment-change and wire controls may leave a path open for social-engineering losses.",
    body:
      "Vendor bank-detail changes or wires may be released without callback verification and dual approval. This is the most common route for funds-transfer fraud.",
    detail:
      "Potential opportunity: confirm callback procedures, approval thresholds, and whether crime or cyber coverage includes social-engineering terms, subject to policy review.",
    questionIds: ["ops_payment_authorization"],
    priority: 86,
    when: (ctx) => (val(ctx, "ops_payment_authorization") ?? 3) <= 1,
  },
  {
    id: "cyber_minimums",
    category: "operational_controls",
    title: "Cyber controls may not meet the minimums that most carriers now require.",
    body:
      "Multi-factor authentication, tested backups, and a written incident plan are the controls cyber underwriters ask about first.",
    detail:
      "Potential opportunity: document current controls, close gaps before the next cyber application, and confirm which controls are attested on existing applications.",
    questionIds: ["ops_cyber_controls", "br_data_security"],
    priority: 83,
    when: (ctx) => (lowest(ctx, ["ops_cyber_controls", "br_data_security"]) ?? 3) <= 1,
  },
  {
    id: "no_program_owner",
    category: "governance",
    title: "Insurance program ownership appears informal.",
    body:
      "Without a named owner and defined responsibilities, renewal tasks, certificate requests, and mid-term changes tend to fall through the cracks.",
    detail:
      "Potential opportunity: assign an owner and backup, and define the touchpoints with finance, operations, and HR/safety.",
    questionIds: ["gov_internal_owner"],
    priority: 70,
    when: (ctx) => (val(ctx, "gov_internal_owner") ?? 3) <= 1,
  },
  {
    id: "limits_not_reasoned",
    category: "governance",
    title: "Limits and deductibles appear to be renewed without a documented rationale.",
    body:
      "This diagnostic does not assess whether limits are adequate. It does note that limits which are never revisited may not track contract requirements or asset growth.",
    detail:
      "Potential opportunity: document the basis for each limit and deductible with a licensed advisor and revisit it when contracts or assets change.",
    questionIds: ["gov_limit_rationale"],
    priority: 68,
    when: (ctx) => (val(ctx, "gov_limit_rationale") ?? 3) <= 1,
  },
  {
    id: "safety_undocumented",
    category: "operational_controls",
    title: "Safety and training practices may exist but are not documented in a form underwriters can credit.",
    body:
      "Written programs, training records, and inspection logs are what carriers use to distinguish a well-run operation from an average one.",
    detail: "Potential opportunity: assemble a safety documentation package before the next submission.",
    questionIds: ["ops_safety_training"],
    priority: 72,
    when: (ctx) => (val(ctx, "ops_safety_training") ?? 3) <= 1,
  },
  {
    id: "property_values_stale",
    category: "market_readiness",
    title: "Owned-property values and building updates may be undocumented.",
    body:
      "Replacement cost, business-interruption values, flood exposure, and building-system updates drive both coverage terms and pricing conversations.",
    detail:
      "Areas to investigate: date of last valuation, BI worksheet, flood zone determination, and documented roof, sprinkler, and electrical updates.",
    questionIds: ["br_property_valuation"],
    priority: 78,
    when: (ctx) => (val(ctx, "br_property_valuation") ?? 3) <= 1,
  },
  {
    id: "fleet_controls",
    category: "operational_controls",
    title: "Fleet and driver controls may not be documented to the level auto underwriters expect.",
    body: "MVR practices, fleet policy, and hired/non-owned auto handling are primary controls for commercial auto.",
    detail: "Potential opportunity: adopt a written fleet policy with annual MVRs and disqualification criteria.",
    questionIds: ["br_fleet_controls"],
    priority: 76,
    when: (ctx) => (val(ctx, "br_fleet_controls") ?? 3) <= 1,
  },
  {
    id: "subcontractor_transfer_gap",
    category: "contractual_risk_transfer",
    title: "Subcontractor and vendor risk transfer may not be enforced.",
    body: "Indemnity terms and endorsements that are not confirmed before work begins may not respond when a loss occurs.",
    detail: "Potential opportunity: confirm additional-insured and waiver endorsements for active vendors.",
    questionIds: ["br_subcontractor_transfer"],
    priority: 77,
    when: (ctx) => (val(ctx, "br_subcontractor_transfer") ?? 3) <= 1,
  },
  {
    id: "workforce_programs_gap",
    category: "operational_controls",
    title: "Workforce programs (return-to-work, handbook, manager training) may be informal for a company of your size.",
    body: "These programs influence workers' compensation experience and employment-practices exposure.",
    detail: "Potential opportunity: document return-to-work procedures and update the employee handbook.",
    questionIds: ["br_workforce_programs"],
    priority: 71,
    when: (ctx) => (val(ctx, "br_workforce_programs") ?? 3) <= 1,
  },
  {
    id: "investor_governance_gap",
    category: "governance",
    title: "Board and investor-related exposures may not have been reviewed since the investment.",
    body: "Directors & officers, fiduciary, and indemnification arrangements are typically revisited as ownership and boards change.",
    detail: "Potential opportunity: review governance-related exposures with a licensed advisor against current bylaws and investor agreements.",
    questionIds: ["br_governance_investors"],
    priority: 69,
    when: (ctx) => (val(ctx, "br_governance_investors") ?? 3) <= 1,
  },
  {
    id: "environmental_gap",
    category: "emerging_risk",
    title: "Environmental compliance and pollution exposure may not be documented.",
    body: "Permits, storage practices, and disposal records are the starting point for any environmental conversation with carriers.",
    detail: "Areas to investigate: applicable permits, storage documentation, and whether pollution exposure has been reviewed.",
    questionIds: ["br_regulated_materials"],
    priority: 75,
    when: (ctx) => (val(ctx, "br_regulated_materials") ?? 3) <= 1,
  },
  {
    id: "emerging_risk_unmanaged",
    category: "emerging_risk",
    title: "New activities and regulatory changes may reach the insurance program after the fact.",
    body: "Without a pre-launch review step, new locations, products, and technology can create exposures that are not reflected until the next renewal.",
    detail: "Potential opportunity: add a risk and insurance checkpoint to your launch process.",
    questionIds: ["emr_new_activity_review", "emr_regulatory", "emr_annual_review"],
    priority: 65,
    when: (ctx) => {
      const s = catScore(ctx, "emerging_risk");
      return s !== null && s < 50;
    },
  },
];

const STRENGTH_TEMPLATES: Record<CategoryId, string> = {
  governance: "Program governance is documented and reviewed, which gives carriers confidence in how decisions are made.",
  market_readiness: "Exposure data and business changes are well documented, which supports a credible underwriting story.",
  operational_controls: "Operational controls are documented and monitored, which underwriters can credit directly.",
  claims: "Claims are managed to a defined cadence, which typically supports better loss outcomes and carrier relationships.",
  contractual_risk_transfer: "Contracts, requirements, and certificate verification appear to operate as one system.",
  emerging_risk: "New activities and regulatory changes are reviewed before they create unplanned exposure.",
};

function categoryFallbackFinding(ctx: FindingContext, c: CategoryId): Finding | null {
  const cs = categoryScoreOf(ctx.scores, c);
  if (cs.score === null || cs.score >= 75) return null;
  const weakest = ctx.scores.applicableQuestionIds
    .map((id) => QUESTION_BY_ID[id])
    .filter((q) => q.category === c)
    .map((q) => ({ q, v: val(ctx, q.id) }))
    .filter((x): x is { q: (typeof x)["q"]; v: number } => x.v !== null)
    .sort((a, b) => a.v - b.v)[0];
  if (!weakest) return null;
  return {
    id: `category_${c}`,
    category: c,
    kind: "investigate",
    title: `${CATEGORY_LABELS[c].label}: ${weakest.q.topic.toLowerCase()} is the practice most worth confirming.`,
    body: `Your answers in ${CATEGORY_LABELS[c].label.toLowerCase()} suggest ${cs.band === "priority" ? "practices that are undocumented or reactive" : "practices that exist but may not be applied consistently"}.`,
    detail: `Potential opportunity: review how "${weakest.q.topic.toLowerCase()}" is handled today and what documentation would demonstrate it.`,
    priority: 40 + (100 - cs.score) / 5,
    questionIds: [weakest.q.id],
  };
}

export interface FindingsOutput {
  findings: Finding[];
  strengths: Finding[];
}

/**
 * Evaluates the findings library and returns the top three investigation
 * areas plus up to three strengths. Deterministic: same input, same output.
 */
export function generateFindings(ctx: FindingContext, limit = 3): FindingsOutput {
  const triggered: Finding[] = FINDING_RULES.filter((r) => r.when(ctx)).map((r) => {
    const catScoreVal = r.category === "overall" ? null : catScore(ctx, r.category);
    const hasCritical = ctx.scores.criticalFlags.some((f) => r.questionIds.includes(f.questionId));
    const bump = (catScoreVal !== null ? (100 - catScoreVal) / 10 : 0) + (hasCritical ? 10 : 0);
    return {
      id: r.id,
      category: r.category,
      kind: "investigate",
      title: r.title,
      body: r.body,
      detail: r.detail,
      priority: r.priority + bump,
      questionIds: r.questionIds,
    };
  });

  // Ensure category coverage: at most one finding per category in the top list,
  // then fill remaining slots by priority.
  const sorted = [...triggered].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const chosen: Finding[] = [];
  const seenCats = new Set<string>();
  for (const f of sorted) {
    if (chosen.length >= limit) break;
    if (seenCats.has(f.category)) continue;
    seenCats.add(f.category);
    chosen.push(f);
  }
  for (const f of sorted) {
    if (chosen.length >= limit) break;
    if (!chosen.includes(f)) chosen.push(f);
  }
  if (chosen.length < limit) {
    const fallbacks = CATEGORY_IDS.map((c) => categoryFallbackFinding(ctx, c))
      .filter((f): f is Finding => f !== null && !seenCats.has(f.category))
      .sort((a, b) => b.priority - a.priority);
    for (const f of fallbacks) {
      if (chosen.length >= limit) break;
      chosen.push(f);
    }
  }

  const strengths: Finding[] = ctx.scores.categories
    .filter((c) => c.score !== null && c.score >= 75)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((c) => ({
      id: `strength_${c.category}`,
      category: c.category,
      kind: "strength",
      title: CATEGORY_LABELS[c.category].label,
      body: STRENGTH_TEMPLATES[c.category],
      priority: c.score ?? 0,
      questionIds: ctx.scores.applicableQuestionIds.filter(
        (id) => QUESTION_BY_ID[id].category === c.category && val(ctx, id) === 3,
      ),
    }));

  return { findings: chosen, strengths };
}
