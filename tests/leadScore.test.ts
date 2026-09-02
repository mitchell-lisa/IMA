import { describe, expect, it } from "vitest";
import { CORE_QUESTIONS, classifyZip, computeLeadScore, normalizeDomain, scoreAssessment } from "@/lib/diagnostic";

const all = (v: 0 | 1 | 2 | 3) => Object.fromEntries(CORE_QUESTIONS.map((q) => [q.id, v]));

describe("computeLeadScore", () => {
  it("ranks a well-fit, senior, renewal-timed lead as tier A", () => {
    const profile = {
      industry: "cre_owner" as const,
      revenueBand: "25m_50m" as const,
      zip: "08034",
      primaryConcern: "premium_increases" as const,
      willingToSharePolicies: "yes" as const,
    };
    const scores = scoreAssessment(all(0), profile);
    const s = computeLeadScore({
      profile,
      scores,
      role: "cfo_finance",
      emailCaptured: true,
      workshopRequested: true,
      monthsUntilRenewal: 4,
    });
    expect(s.total).toBeGreaterThanOrEqual(70);
    expect(s.tier).toBe("A");
    expect(s.companyFit).toBe(25);
    expect(s.engagementIntent).toBe(10);
  });

  it("ranks a poorly fitting, anonymous lead low", () => {
    const profile = { industry: "other" as const, revenueBand: "under_10m" as const, zip: "90210" };
    const scores = scoreAssessment(all(3), profile);
    const s = computeLeadScore({ profile, scores, role: null, emailCaptured: false, workshopRequested: false, monthsUntilRenewal: null });
    expect(s.tier).toBe("C");
    expect(s.total).toBeLessThan(50);
  });
});

describe("classifyZip", () => {
  it("resolves any US ZIP to its state", () => {
    expect(classifyZip("08034")).toBe("NJ");
    expect(classifyZip("19103")).toBe("PA");
    expect(classifyZip("10001")).toBe("NY");
    expect(classifyZip("90210")).toBe("CA");
    expect(classifyZip("60601")).toBe("IL");
    expect(classifyZip("75201")).toBe("TX");
    expect(classifyZip("33101")).toBe("FL");
    expect(classifyZip("99501")).toBe("AK");
    expect(classifyZip("00901")).toBe("PR");
    expect(classifyZip("")).toBe("unknown");
    expect(classifyZip("12")).toBe("unknown");
  });
});

describe("normalizeDomain", () => {
  it("strips protocol and www", () => {
    expect(normalizeDomain("https://www.Example.com/about")).toBe("example.com");
    expect(normalizeDomain("example.com")).toBe("example.com");
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("")).toBeNull();
  });
});
