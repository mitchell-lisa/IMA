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

  items.add("Confirm the portfolio's renewal date and work back 120 days to set a preparation start date with named owners.");
  if (has("gov_internal_owner")) items.add("Name an internal owner and backup for the insurance program and define the split of duties with the property manager.");
  if (has("gov_limit_rationale")) items.add("Write one paragraph per major line explaining the basis for current limits and deductibles, including lender and lease requirements.");
  if (has("mkt_exposure_data")) items.add("Rebuild the statement of values: replacement cost per building, construction and protection details, year built, square footage or units, and update history.");
  if (has("mkt_business_changes") || profile.recentAcquisitionOrNewLocation)
    items.add("List every acquisition, disposition, and major renovation in the last 12 months and note whether each was reported with values and lender requirements.");
  if (has("mkt_submission_visibility")) items.add("Ask for a copy of last year's full submission and the list of carriers approached, including declinations and reasons.");
  if (has("ops_cyber_controls")) items.add("Document MFA coverage, encryption, backup testing dates, the incident response plan, and the security posture of your property-management platform.");
  if (has("ops_payment_authorization")) items.add("Write down the callback and dual-approval procedure for wires, vendor bank changes, and deposit returns, and test it once with the property manager.");
  if (has("ops_safety_training")) items.add("Assemble inspection schedules, life-safety testing records, lighting logs, and preventive maintenance plans per property into one package.");
  if (has("clm_reporting_protocol")) items.add("Publish a one-page incident reporting protocol for property managers with a 24–48 hour reporting expectation.");
  if (has("clm_open_claim_review")) items.add("Request current loss runs for all lines and schedule an open-claim review covering reserves, assigned counsel, and any public adjusters.");
  if (has("clm_root_cause")) items.add("Create a simple corrective-action log tied to work orders and review it monthly.");
  if (has("crt_signed_contracts") || has("crt_insurance_requirements") || has("crt_coi_verification") || has("br_vendor_transfer"))
    items.add("Pull the leases for your five largest tenants and the contracts and certificates for snow, security, and renovation vendors, and compare requirements to endorsements.");
  if (has("br_property_valuation")) items.add("List open carrier recommendations by property with completion evidence, plus roof, sprinkler, electrical, and boiler update dates, flood zone determinations, and the last valuation date.");
  if (has("br_management_agreement")) items.add("Send the property-management agreement to counsel and the broker for a review of insurance and indemnity terms, and request the manager's current certificate.");
  if (has("br_residential_programs")) items.add("Confirm renters-insurance tracking coverage, the current lease and screening criteria, and fair-housing training records for every community.");
  if (has("br_workforce_programs")) items.add("Locate the return-to-work program, current handbook, and manager training records.");
  if (has("br_governance_investors")) items.add("Collect fund documents, investor agreements, lender requirements, and a list of every legal entity to confirm named-insured status.");
  if (has("br_environmental")) items.add("Gather environmental surveys, acquisition due-diligence reports, moisture and mold procedures, and any lender environmental conditions.");
  if (has("emr_annual_review") || has("emr_new_activity_review") || has("emr_regulatory"))
    items.add("Add a risk and insurance checkpoint to acquisition due diligence and to operational changes such as short-term rentals or EV charging.");
  if (scores.unknownCount > 0)
    items.add(`Confirm the ${scores.unknownCount} item${scores.unknownCount === 1 ? "" : "s"} you marked "not sure" with the person who owns that area, often the property manager.`);
  items.add("Decide which documents you are comfortable sharing in a workshop (policies, loss runs, statement of values, leases, management agreement) so the conversation is specific.");
  return Array.from(items);
}
