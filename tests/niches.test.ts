import { describe, expect, it } from "vitest";
import { NICHES, NICHE_BY_ID, nicheLabel } from "@/lib/diagnostic/niches";
import { INDUSTRY_IDS } from "@/lib/diagnostic/industries";
import { startProfileSchema } from "@/lib/validation/schemas";

describe("niches", () => {
  it("covers the plan's fourteen niches plus other, each mapped to a valid industry", () => {
    expect(NICHES).toHaveLength(15);
    for (const n of NICHES) expect(INDUSTRY_IDS).toContain(n.industry);
    expect(NICHES.filter((n) => n.hasModule).map((n) => n.id)).toEqual(["logistics_3pl", "light_manufacturing"]);
    expect(NICHE_BY_ID.contractors.industry).toBe("other");
    expect(nicheLabel("cre_owners")).toMatch(/real estate/i);
    expect(nicheLabel("nope")).toBeNull();
  });
  it("is accepted but optional at intake", () => {
    const base = { companyName: "X", zip: "08034", industry: "other" as const, employeeBand: "1_24" as const, revenueBand: "under_10m" as const };
    expect(startProfileSchema.parse(base).niche).toBeUndefined();
    expect(startProfileSchema.parse({ ...base, niche: "contractors" }).niche).toBe("contractors");
    expect(() => startProfileSchema.parse({ ...base, niche: "banks" })).toThrow();
  });
});
