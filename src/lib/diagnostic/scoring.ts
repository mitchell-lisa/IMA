import { getIndustry } from "./industries";
import { QUESTIONS } from "./questions";
import type {
  Answers,
  AssessmentProfile,
  CategoryId,
  CategoryScore,
  ConfidenceBand,
  ConsistencyNote,
  CriticalFlag,
  IndustryId,
  Question,
  ScoreBand,
  ScoreResult,
} from "./types";
import { CATEGORY_IDS } from "./types";

export const MAX_MATURITY = 3;

export function bandForScore(score: number | null): ScoreBand | null {
  if (score === null) return null;
  if (score >= 75) return "strong";
  if (score >= 50) return "improve";
  return "priority";
}

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 85) return "high";
  if (confidence >= 60) return "moderate";
  return "low";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Deterministic scoring.
 *
 * - Each answered question contributes value × weight to its category.
 * - "unknown" and unanswered questions are excluded from both numerator and
 *   denominator. They reduce the Confidence Score instead of implying bad risk.
 * - Category score = earned ÷ available × 100 over known answers.
 * - Overall = category scores weighted by industry category weights.
 */
export function scoreAssessment(
  answers: Answers,
  profile: Partial<AssessmentProfile> & { industry: IndustryId },
  questions: Question[] = QUESTIONS,
): ScoreResult {
  const industry = getIndustry(profile.industry);
  const applicable = questions.filter((q) => !q.branch || profile[q.branch] === true);

  const perCategory = new Map<CategoryId, CategoryScore>();
  for (const c of CATEGORY_IDS) {
    perCategory.set(c, {
      category: c,
      score: null,
      band: null,
      earned: 0,
      available: 0,
      answeredKnown: 0,
      applicable: 0,
      unknown: 0,
      unanswered: 0,
    });
  }

  const criticalFlags: CriticalFlag[] = [];
  let answeredCount = 0;
  let unknownCount = 0;
  let unansweredCount = 0;

  for (const q of applicable) {
    const cat = perCategory.get(q.category)!;
    cat.applicable += 1;
    const weight = q.weights[industry.id];
    const value = answers[q.id];

    if (value === undefined) {
      cat.unanswered += 1;
      unansweredCount += 1;
      continue;
    }
    if (value === "unknown") {
      cat.unknown += 1;
      unknownCount += 1;
      continue;
    }
    answeredCount += 1;
    cat.answeredKnown += 1;
    cat.earned += value * weight;
    cat.available += MAX_MATURITY * weight;

    if (q.critical && value <= q.critical.atOrBelow) {
      criticalFlags.push({ questionId: q.id, category: q.category, message: q.critical.message });
    }
  }

  const categories: CategoryScore[] = [];
  let weightedSum = 0;
  let weightTotal = 0;
  for (const c of CATEGORY_IDS) {
    const cat = perCategory.get(c)!;
    if (cat.available > 0) {
      cat.score = round1((cat.earned / cat.available) * 100);
      cat.band = bandForScore(cat.score);
      const cw = industry.categoryWeights[c];
      weightedSum += cat.score * cw;
      weightTotal += cw;
    }
    categories.push(cat);
  }

  const overall = weightTotal > 0 ? round1(weightedSum / weightTotal) : null;
  const confidence =
    applicable.length > 0 ? Math.round((answeredCount / applicable.length) * 100) : 0;

  return {
    overall,
    overallBand: bandForScore(overall),
    categories,
    confidence,
    confidenceBand: confidenceBand(confidence),
    criticalFlags,
    consistencyNotes: detectInconsistencies(answers),
    applicableQuestionIds: applicable.map((q) => q.id),
    answeredCount,
    unknownCount,
    unansweredCount,
  };
}

function known(answers: Answers, id: string): number | null {
  const v = answers[id];
  return typeof v === "number" ? v : null;
}

/**
 * Cross-answer consistency checks. These never change the score; they are
 * surfaced to the prospect as items worth confirming and to the producer as
 * conversation openers.
 */
export function detectInconsistencies(answers: Answers): ConsistencyNote[] {
  const notes: ConsistencyNote[] = [];
  const pairs: Array<{
    id: string;
    a: string;
    b: string;
    test: (a: number, b: number) => boolean;
    message: string;
  }> = [
    {
      id: "limits_without_lead_time",
      a: "gov_limit_rationale",
      b: "gov_renewal_lead_time",
      test: (a, b) => a >= 2 && b <= 0,
      message:
        "Limits are described as reviewed annually, but renewal preparation begins inside 30 days. Confirm when the limit review actually happens.",
    },
    {
      id: "coi_without_requirements",
      a: "crt_coi_verification",
      b: "crt_insurance_requirements",
      test: (a, b) => a >= 2 && b <= 0,
      message:
        "Certificates are verified, but insurance requirements are not defined. Confirm what the certificates are being verified against.",
    },
    {
      id: "requirements_without_coi",
      a: "crt_insurance_requirements",
      b: "crt_coi_verification",
      test: (a, b) => a >= 2 && b <= 0,
      message:
        "Insurance requirements are defined, but certificates are not reviewed. Requirements that are never verified may not transfer risk.",
    },
    {
      id: "root_cause_without_reporting",
      a: "clm_root_cause",
      b: "clm_reporting_protocol",
      test: (a, b) => a >= 2 && b <= 0,
      message:
        "Root-cause reviews are described as documented, but incident reporting is informal. Confirm which incidents actually reach the review process.",
    },
    {
      id: "submission_without_exposure_data",
      a: "mkt_submission_visibility",
      b: "mkt_exposure_data",
      test: (a, b) => a >= 3 && b <= 0,
      message:
        "You co-author the underwriting narrative, but exposure values are carried forward without validation. Confirm the data behind the narrative.",
    },
    {
      id: "risk_review_without_change_capture",
      a: "emr_annual_review",
      b: "mkt_business_changes",
      test: (a, b) => a >= 2 && b <= 0,
      message:
        "A structured risk review exists, but operational changes reach the insurance program only at renewal. Confirm whether review outputs feed the program.",
    },
  ];

  for (const p of pairs) {
    const a = known(answers, p.a);
    const b = known(answers, p.b);
    if (a !== null && b !== null && p.test(a, b)) {
      notes.push({ id: p.id, message: p.message, questionIds: [p.a, p.b] });
    }
  }
  return notes;
}

export function categoryScoreOf(result: ScoreResult, category: CategoryId): CategoryScore {
  return result.categories.find((c) => c.category === category)!;
}
