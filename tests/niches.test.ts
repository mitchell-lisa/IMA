import { describe, expect, it } from "vitest";
import { NICHES, NICHE_BY_ID, nicheLabel } from "@/lib/diagnostic/niches";
import { INDUSTRY_IDS } from "@/lib/diagnostic/industries";
import { startProfileSchema } from "@/lib/validation/schemas";

describe("niches", () => {
  it("covers the real estate niches plus other, each mapped to a valid industry", () => {
    expect(NICHES).toHaveLength(14);
    for (const n of NICHES) expect(INDUSTRY_IDS).toContain(n.industry);
    // Every niche with a dynamic module maps to one of the two built industries.
    for (const n of NICHES.filter((n) => n.hasModule)) expect(["cre_owner", "multifamily"]).toContain(n.industry);
    for (const n of NICHES.filter((n) => !n.hasModule)) expect(n.industry).toBe("other");
    expect(NICHE_BY_ID.office.industry).toBe("cre_owner");
    expect(NICHE_BY_ID.multifamily.industry).toBe("multifamily");
    expect(NICHE_BY_ID.self_storage.industry).toBe("other");
    expect(nicheLabel("multifamily")).toMatch(/multifamily/i);
    expect(nicheLabel("nope")).toBeNull();
  });
  it("is accepted but optional at intake", () => {
    const base = { companyName: "X", zip: "08034", industry: "other" as const, employeeBand: "1_24" as const, revenueBand: "under_10m" as const };
    expect(startProfileSchema.parse(base).niche).toBeUndefined();
    expect(startProfileSchema.parse({ ...base, niche: "self_storage" }).niche).toBe("self_storage");
    expect(() => startProfileSchema.parse({ ...base, niche: "banks" })).toThrow();
  });
});
