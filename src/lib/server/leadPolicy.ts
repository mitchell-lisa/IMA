import type { LeadCaptureInput } from "@/lib/validation/schemas";
import type { LeadRecord } from "./repo/types";

/**
 * Who may update an existing lead through the public results token.
 *
 * The results URL is shareable, so a token alone must not be able to
 * replace the prospect's identity or grant consent on their behalf. Updates
 * are allowed only when the submitted email matches the existing lead's
 * email (case-insensitive), and even then flags only move from false to
 * true; identity fields may be refined, never swapped.
 */
export type LeadUpdateDecision =
  | { kind: "create" }
  | { kind: "update"; patch: Partial<LeadRecord> }
  | { kind: "reject"; reason: string };

export function decideLeadUpdate(existing: LeadRecord | null, input: LeadCaptureInput): LeadUpdateDecision {
  if (!existing) return { kind: "create" };
  if (existing.email.trim().toLowerCase() !== input.email.trim().toLowerCase()) {
    return {
      kind: "reject",
      reason: "A report has already been sent for this assessment to a different email address. Reply to that email to update contact details.",
    };
  }
  return {
    kind: "update",
    patch: {
      name: input.name ?? existing.name,
      role: input.role ?? existing.role,
      phone: input.phone || existing.phone,
      consentMarketing: existing.consentMarketing || input.consentMarketing,
      workshopRequested: existing.workshopRequested || input.workshopRequested,
      preferredContact: input.preferredContact ?? existing.preferredContact,
      prospectNotes: input.notes ?? existing.prospectNotes,
    },
  };
}
