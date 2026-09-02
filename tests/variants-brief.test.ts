import { describe, expect, it } from "vitest";
import { CORE_QUESTIONS, QUESTION_BY_ID, resolveQuestion, runDiagnostic, scoreAssessment } from "@/lib/diagnostic";
import { buildProducerBrief, briefToMarkdown } from "@/lib/brief/producerBrief";
import type { AssessmentRecord, LeadRecord } from "@/lib/server/repo/types";

const all = (v: 0 | 1 | 2 | 3) => Object.fromEntries(CORE_QUESTIONS.map((q) => [q.id, v]));

describe("resolveQuestion", () => {
  it("applies industry wording without touching scoring metadata", () => {
    const base = QUESTION_BY_ID["ops_safety_training"];
    const mf = resolveQuestion(base, "multifamily");
    expect(mf.prompt).toMatch(/unit and common-area inspections/i);
    expect(mf.weights).toEqual(base.weights);
    expect(mf.options).toEqual(base.options);
    expect(mf.id).toBe(base.id);
    const cre = resolveQuestion(base, "cre_owner");
    expect(cre.prompt).toMatch(/roof, sprinkler/i);
    const other = resolveQuestion(base, "other");
    expect(other.prompt).toBe(base.prompt);
  });

  it("scores identically regardless of variant wording", () => {
    const answers = all(2);
    const a = scoreAssessment(answers, { industry: "cre_owner" });
    const b = scoreAssessment(answers, { industry: "cre_owner" });
    expect(a).toEqual(b);
  });
});

function fixture(): { lead: LeadRecord; assessment: AssessmentRecord } {
  const profile = {
    companyName: "Keystone Residential Partners",
    zip: "19380",
    industry: "multifamily" as const,
    employeeBand: "50_99" as const,
    revenueBand: "10m_25m" as const,
    renewalMonth: 3,
    primaryConcern: "coverage_gaps" as const,
  };
  const answers = { ...all(1), clm_reporting_protocol: 0 as const };
  const result = runDiagnostic(answers, profile, new Date("2026-01-10"));
  const now = "2026-01-10T00:00:00.000Z";
  const assessment: AssessmentRecord = {
    id: "a1",
    resultsToken: "tok",
    status: "completed",
    profile,
    answers,
    result,
    enrichment: null,
    attribution: { partnerCode: "cpa-smith" },
    ipHash: null,
    userAgent: null,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
  };
  const lead: LeadRecord = {
    id: "l1",
    assessmentId: "a1",
    email: "cfo@example.com",
    name: "Sam",
    role: "cfo_finance",
    phone: null,
    consentReport: true,
    consentMarketing: false,
    consentAt: now,
    consentTextVersion: "v",
    workshopRequested: true,
    preferredContact: null,
    prospectNotes: null,
    leadScore: { total: 72, companyFit: 25, seniority: 18, renewalTiming: 14, demonstratedPain: 10, engagementIntent: 4, dataCompleteness: 1, tier: "A" },
    disposition: "new",
    followUpOwner: null,
    reviewNotes: null,
    licensedReviewCompleted: false,
    crmSyncStatus: "skipped",
    crmExternalId: null,
    emailStatus: "skipped",
    createdAt: now,
    updatedAt: now,
  };
  return { lead, assessment };
}

describe("buildProducerBrief", () => {
  it("produces all ten sections plus the workshop crosswalk", () => {
    const { lead, assessment } = fixture();
    const brief = buildProducerBrief(lead, assessment);
    expect(brief.opportunities).toHaveLength(3);
    expect(brief.workshopCrosswalk).toHaveLength(6);
    expect(brief.workshopCrosswalk.map((r) => r.workshopCategory)).toContain("Contractual risk transfer");
    // Every core answer is 1/3 -> 33.3 on any dimension made of core questions only.
    const ins = brief.workshopCrosswalk.find((r) => r.workshopCategory === "Insurance-program design")!;
    expect(ins.score).toBeCloseTo(33.3, 1);
    expect(ins.applicable).toBe(6); // br_property_valuation not applicable (no owned buildings)
    // Claims has one answer at 0 (reporting protocol, weight 3 of 9 total) -> (0+3+3)/27 = 22.2
    const claims = brief.workshopCrosswalk.find((r) => r.workshopCategory === "Claims")!;
    expect(claims.score).toBeCloseTo(22.2, 1);
    expect(claims.answered).toBe(3);
    // Property/maintenance falls back to the safety question when no buildings are owned.
    const maint = brief.workshopCrosswalk.find((r) => r.workshopCategory === "Property/maintenance")!;
    expect(maint.applicable).toBe(1);
    expect(maint.score).toBeCloseTo(33.3, 1);
    expect(brief.workshopPath).toHaveLength(7);
    expect(brief.servicePlanThemes.length).toBeGreaterThan(1);
    expect(brief.openingQuestions.length).toBeGreaterThanOrEqual(3);
    expect(brief.openingQuestions.some((q) => /one broker or several/i.test(q))).toBe(true);
    expect(brief.snapshot.partner).toBe("cpa-smith");
    expect(brief.agenda.reduce((a, b) => a + b.minutes, 0)).toBe(45);
  });

  it("renders markdown with every numbered section", () => {
    const { lead, assessment } = fixture();
    const md = briefToMarkdown(buildProducerBrief(lead, assessment));
    for (let i = 1; i <= 10; i++) expect(md).toMatch(new RegExp(`^## ${i}\\. `, "m"));
    expect(md).toMatch(/## Workshop crosswalk/);
    expect(md).not.toMatch(/undefined/);
  });
});
