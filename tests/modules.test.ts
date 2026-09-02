import { describe, expect, it } from "vitest";
import { MODULES, MODULE_IDS, getModule, isModuleId } from "@/lib/diagnostic/modules";
import { CATEGORY_IDS } from "@/lib/diagnostic/types";

describe("entry modules", () => {
  it("defines four modules with valid focus categories", () => {
    expect(MODULE_IDS).toHaveLength(4);
    for (const id of MODULE_IDS) {
      const m = MODULES[id];
      expect(m.headline.length).toBeGreaterThan(10);
      for (const c of m.focusCategories) expect(CATEGORY_IDS).toContain(c);
    }
    expect(MODULES.marketready.focusCategories).toEqual([]);
    expect(MODULES.contracts.focusCategories).toEqual(["contractual_risk_transfer"]);
  });
  it("falls back to marketready for unknown values", () => {
    expect(getModule("nope").id).toBe("marketready");
    expect(getModule(undefined).id).toBe("marketready");
    expect(getModule("renewal").id).toBe("renewal");
    expect(isModuleId("claims")).toBe(true);
    expect(isModuleId("x")).toBe(false);
  });
});
