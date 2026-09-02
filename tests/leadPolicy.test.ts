import { describe, expect, it } from "vitest";
import { decideLeadUpdate } from "@/lib/server/leadPolicy";
import type { LeadRecord } from "@/lib/server/repo/types";

const existing: LeadRecord = {
  id: "l1",
  assessmentId: "a1",
  email: "CFO@Example.com",
  name: "Sam",
  role: "cfo_finance",
  phone: null,
  consentReport: true,
  consentMarketing: false,
  consentAt: "2026-09-02T00:00:00Z",
  consentTextVersion: "v",
  workshopRequested: false,
  preferredContact: null,
  prospectNotes: null,
  leadScore: { total: 50, companyFit: 10, seniority: 10, renewalTiming: 10, demonstratedPain: 10, engagementIntent: 5, dataCompleteness: 5, tier: "B" },
  disposition: "new",
  followUpOwner: null,
  reviewNotes: null,
  licensedReviewCompleted: false,
  crmSyncStatus: "skipped",
  crmExternalId: null,
  emailStatus: "skipped",
  createdAt: "2026-09-02T00:00:00Z",
  updatedAt: "2026-09-02T00:00:00Z",
};

const base = { token: "t".repeat(20), consentReport: true as const, consentMarketing: false, workshopRequested: false };

describe("decideLeadUpdate", () => {
  it("creates when no lead exists", () => {
    expect(decideLeadUpdate(null, { ...base, email: "x@example.com" }).kind).toBe("create");
  });
  it("rejects a different email from a token holder", () => {
    const d = decideLeadUpdate(existing, { ...base, email: "attacker@evil.com", consentMarketing: true });
    expect(d.kind).toBe("reject");
  });
  it("lets the same person add a workshop request but never revoke or swap identity", () => {
    const d = decideLeadUpdate(existing, { ...base, email: "cfo@example.com", workshopRequested: true, name: "Sam Lee" });
    expect(d.kind).toBe("update");
    if (d.kind === "update") {
      expect(d.patch.workshopRequested).toBe(true);
      expect(d.patch.name).toBe("Sam Lee");
      expect(d.patch.consentMarketing).toBe(false);
      expect("email" in d.patch).toBe(false);
    }
    const revoke = decideLeadUpdate({ ...existing, consentMarketing: true, workshopRequested: true }, { ...base, email: "cfo@example.com" });
    if (revoke.kind === "update") {
      expect(revoke.patch.consentMarketing).toBe(true);
      expect(revoke.patch.workshopRequested).toBe(true);
    }
  });
});
