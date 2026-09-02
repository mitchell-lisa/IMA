import { describe, expect, it } from "vitest";
import { CORE_QUESTIONS, computeRenewalContext, generateFindings, runDiagnostic, scoreAssessment } from "@/lib/diagnostic";
import type { Answers } from "@/lib/diagnostic";

const all = (v: 0 | 1 | 2 | 3): Answers => Object.fromEntries(CORE_QUESTIONS.map((q) => [q.id, v]));

describe("generateFindings", () => {
  it("always returns three investigation areas for a weak profile", () => {
    const answers = all(0);
    const scores = scoreAssessment(answers, { industry: "multifamily" });
    const { findings } = generateFindings({ answers, profile: { industry: "multifamily" }, scores });
    expect(findings).toHaveLength(3);
    // Category diversity in the top three.
    expect(new Set(findings.map((f) => f.category)).size).toBe(3);
  });

  it("surfaces the late-renewal finding when lead time is short and strengths exist", () => {
    const answers = { ...all(3), gov_renewal_lead_time: 0 as const };
    const scores = scoreAssessment(answers, { industry: "cre_owner" });
    const { findings, strengths } = generateFindings({ answers, profile: { industry: "cre_owner" }, scores });
    expect(findings.map((f) => f.id)).toContain("renewal_starts_late");
    expect(strengths.length).toBeGreaterThan(0);
  });

  it("surfaces the business-change finding only when the profile reports change", () => {
    const answers = { ...all(3), mkt_business_changes: 0 as const };
    const scores = scoreAssessment(answers, { industry: "cre_owner" });
    const without = generateFindings({ answers, profile: { industry: "cre_owner" }, scores });
    expect(without.findings.map((f) => f.id)).not.toContain("business_outpaced_governance");
    const withChange = generateFindings({
      answers,
      profile: { industry: "cre_owner", recentAcquisitionOrNewLocation: true },
      scores,
    });
    expect(withChange.findings.map((f) => f.id)).toContain("business_outpaced_governance");
  });

  it("falls back to category findings when few rules trigger", () => {
    const answers = all(2); // mostly "documented" - most rules need <=1
    const scores = scoreAssessment(answers, { industry: "other" });
    const { findings } = generateFindings({ answers, profile: { industry: "other" }, scores });
    expect(findings).toHaveLength(3);
    expect(findings.every((f) => f.id.startsWith("category_"))).toBe(true);
  });
});

describe("runDiagnostic", () => {
  it("produces a checklist and renewal context", () => {
    const result = runDiagnostic(all(1), { industry: "cre_owner", renewalMonth: 6 }, new Date("2026-01-15"));
    expect(result.checklist.length).toBeGreaterThan(3);
    expect(result.renewal.monthsUntilRenewal).toBe(5);
    expect(result.renewal.status).toBe("approaching");
  });
});

describe("computeRenewalContext", () => {
  it("handles wraparound and windows", () => {
    const now = new Date("2026-11-10");
    expect(computeRenewalContext(2, now).monthsUntilRenewal).toBe(3);
    expect(computeRenewalContext(2, now).status).toBe("inside_window");
    expect(computeRenewalContext(11, now).monthsUntilRenewal).toBe(0);
    expect(computeRenewalContext(8, now).status).toBe("ample_time");
    expect(computeRenewalContext(undefined, now).status).toBe("unknown");
  });
});
