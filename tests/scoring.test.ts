import { describe, expect, it } from "vitest";
import {
  BRANCH_QUESTIONS,
  CORE_QUESTIONS,
  QUESTIONS,
  bandForScore,
  categoryScoreOf,
  detectInconsistencies,
  getApplicableQuestions,
  scoreAssessment,
} from "@/lib/diagnostic";
import type { Answers, AnswerValue, IndustryId } from "@/lib/diagnostic";

function answerAll(value: AnswerValue, ids = CORE_QUESTIONS.map((q) => q.id)): Answers {
  return Object.fromEntries(ids.map((id) => [id, value]));
}

describe("question bank", () => {
  it("has 18 core questions, three per category", () => {
    expect(CORE_QUESTIONS).toHaveLength(18);
    const counts = new Map<string, number>();
    for (const q of CORE_QUESTIONS) counts.set(q.category, (counts.get(q.category) ?? 0) + 1);
    for (const n of counts.values()) expect(n).toBe(3);
  });
  it("has seven branched questions, one per trigger", () => {
    expect(BRANCH_QUESTIONS).toHaveLength(7);
    expect(new Set(BRANCH_QUESTIONS.map((q) => q.branch)).size).toBe(7);
  });
  it("has unique ids and four maturity options each", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) expect(q.options.map((o) => o.value)).toEqual([0, 1, 2, 3]);
  });
  it("only shows branch questions when the trigger is true", () => {
    expect(getApplicableQuestions({} as never)).toHaveLength(18);
    expect(getApplicableQuestions({ ownsBuildings: true, hasVehicles: true } as never)).toHaveLength(20);
  });
});

describe("scoreAssessment", () => {
  const industry: IndustryId = "logistics_3pl";

  it("scores 100 when every answer is 3 and 0 when every answer is 0", () => {
    const hi = scoreAssessment(answerAll(3), { industry });
    expect(hi.overall).toBe(100);
    expect(hi.overallBand).toBe("strong");
    expect(hi.confidence).toBe(100);
    const lo = scoreAssessment(answerAll(0), { industry });
    expect(lo.overall).toBe(0);
    expect(lo.overallBand).toBe("priority");
    expect(lo.criticalFlags.length).toBeGreaterThan(0);
  });

  it("excludes unknown answers from the score but reduces confidence", () => {
    const answers = answerAll(3);
    answers["gov_renewal_lead_time"] = "unknown";
    answers["clm_root_cause"] = "unknown";
    const r = scoreAssessment(answers, { industry });
    expect(r.overall).toBe(100);
    expect(r.unknownCount).toBe(2);
    expect(r.confidence).toBe(Math.round((16 / 18) * 100));
    expect(r.confidenceBand).toBe("high");
  });

  it("returns null category score when no known answers exist", () => {
    const answers = answerAll(2);
    for (const q of CORE_QUESTIONS.filter((q) => q.category === "claims")) answers[q.id] = "unknown";
    const r = scoreAssessment(answers, { industry });
    expect(categoryScoreOf(r, "claims").score).toBeNull();
    expect(categoryScoreOf(r, "claims").band).toBeNull();
    // Overall still computed from the other five categories.
    expect(r.overall).toBeCloseTo(66.7, 0);
  });

  it("uses question weights: a heavy question moves the category more than a light one", () => {
    // In logistics, gov_renewal_lead_time weight 3, gov_internal_owner weight 2.
    const base = answerAll(3);
    const a = { ...base, gov_renewal_lead_time: 0 as const };
    const b = { ...base, gov_internal_owner: 0 as const };
    const ra = categoryScoreOf(scoreAssessment(a, { industry }), "governance").score!;
    const rb = categoryScoreOf(scoreAssessment(b, { industry }), "governance").score!;
    expect(ra).toBeLessThan(rb);
  });

  it("includes branch questions only when the profile flag is set", () => {
    const answers = { ...answerAll(3), br_fleet_controls: 0 as const };
    const without = scoreAssessment(answers, { industry });
    expect(without.applicableQuestionIds).not.toContain("br_fleet_controls");
    expect(without.overall).toBe(100);
    const withFleet = scoreAssessment(answers, { industry, hasVehicles: true });
    expect(withFleet.applicableQuestionIds).toContain("br_fleet_controls");
    expect(withFleet.overall!).toBeLessThan(100);
    expect(withFleet.criticalFlags.map((f) => f.questionId)).toContain("br_fleet_controls");
  });

  it("is deterministic", () => {
    const answers = answerAll(1);
    const a = scoreAssessment(answers, { industry });
    const b = scoreAssessment({ ...answers }, { industry });
    expect(a).toEqual(b);
  });

  it("maps bands correctly", () => {
    expect(bandForScore(75)).toBe("strong");
    expect(bandForScore(74.9)).toBe("improve");
    expect(bandForScore(50)).toBe("improve");
    expect(bandForScore(49.9)).toBe("priority");
    expect(bandForScore(null)).toBeNull();
  });
});

describe("detectInconsistencies", () => {
  it("flags certificates verified without requirements defined", () => {
    const notes = detectInconsistencies({ crt_coi_verification: 3, crt_insurance_requirements: 0 });
    expect(notes.map((n) => n.id)).toContain("coi_without_requirements");
  });
  it("ignores unknown answers", () => {
    const notes = detectInconsistencies({ crt_coi_verification: 3, crt_insurance_requirements: "unknown" });
    expect(notes).toHaveLength(0);
  });
});
