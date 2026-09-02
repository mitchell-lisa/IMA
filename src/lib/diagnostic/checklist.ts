import type { AssessmentProfile, Finding, ScoreResult } from "./types";

/**
 * Personalized preparation checklist, unlocked by email capture. Items are
 * documentation tasks a company can complete before a renewal or workshop.
 * None of them constitute coverage advice.
 */
export function buildChecklist(
  profile: Partial<AssessmentProfile>,
  scores: ScoreResult,
  findings: Finding[],
): string[] {
  const items = new Set<string>();
  const ids = new Set(findings.flatMap((f) => f.questionIds));
  const flagged = new Set(scores.criticalFlags.map((f) => f.questionId));
  const has = (id: string) => ids.has(id) || flagged.has(id);

  items.add("Confirm your renewal date and work back 120 days to set a preparation start date with named owners.");
  if (has("gov_internal_owner")) items.add("Name an internal owner and backup for the insurance program and list their responsibilities.");
  if (has("gov_limit_rationale")) items.add("Write one paragraph per major line explaining the basis for current limits and deductibles.");
  if (has("mkt_exposure_data")) items.add("Reconcile payroll, revenue, property values, and vehicle schedules against financials and asset registers.");
  if (has("mkt_business_changes") || profile.recentAcquisitionOrNewLocation)
    items.add("List every operational change in the last 12 months (locations, services, equipment, headcount, customers) and note whether each was reported.");
  if (has("mkt_submission_visibility")) items.add("Ask for a copy of last year's full submission and the list of carriers approached, including declinations.");
  if (has("ops_cyber_controls") || has("br_data_security")) items.add("Document MFA coverage, backup testing dates, endpoint protection, and the incident response plan.");
  if (has("ops_payment_authorization")) items.add("Write down the callback and dual-approval procedure for vendor bank changes and wires, and test it once.");
  if (has("ops_safety_training")) items.add("Assemble the safety program, training records, and inspection logs into one package.");
  if (has("clm_reporting_protocol")) items.add("Publish a one-page incident reporting protocol with a 24–48 hour reporting expectation.");
  if (has("clm_open_claim_review")) items.add("Request current loss runs for all lines and schedule an open-claim review before renewal.");
  if (has("clm_root_cause")) items.add("Create a simple corrective-action log and review it monthly.");
  if (has("crt_signed_contracts") || has("crt_insurance_requirements") || has("crt_coi_verification") || has("br_subcontractor_transfer"))
    items.add("Pull the contracts and certificates for your five largest customer and vendor relationships and compare requirements to endorsements.");
  if (has("br_property_valuation")) items.add("Gather the last valuation, BI worksheet, flood zone determination, and building update dates for each owned location.");
  if (has("br_fleet_controls")) items.add("Compile driver list, MVR dates, and the written fleet policy.");
  if (has("br_workforce_programs")) items.add("Locate the return-to-work program, current handbook, and manager training records.");
  if (has("br_governance_investors")) items.add("Collect bylaws, investor agreements, and indemnification agreements for governance review.");
  if (has("br_regulated_materials")) items.add("List applicable environmental permits and the storage and disposal documentation for each.");
  if (has("emr_annual_review") || has("emr_new_activity_review") || has("emr_regulatory"))
    items.add("Add a risk and insurance checkpoint to your process for new locations, products, and major customers.");
  if (scores.unknownCount > 0)
    items.add(`Confirm the ${scores.unknownCount} item${scores.unknownCount === 1 ? "" : "s"} you marked "not sure" with the person who owns that area.`);
  items.add("Decide which documents you are comfortable sharing in a workshop (policies, loss runs, contracts) so the conversation is specific.");
  return Array.from(items);
}
