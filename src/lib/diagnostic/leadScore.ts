import { classifyZip, isCoreTerritory } from "./territory";
import type { AssessmentProfile, Role, ScoreResult } from "./types";

export interface LeadInputs {
  profile: Partial<AssessmentProfile>;
  scores: ScoreResult | null;
  role?: Role | null;
  emailCaptured: boolean;
  workshopRequested: boolean;
  monthsUntilRenewal: number | null;
}

export interface LeadScoreBreakdown {
  total: number;
  companyFit: number; // of 25
  seniority: number; // of 20
  renewalTiming: number; // of 20
  demonstratedPain: number; // of 20
  engagementIntent: number; // of 10
  dataCompleteness: number; // of 5
  tier: "A" | "B" | "C";
}

const ROLE_SCORE: Record<Role, number> = {
  owner_ceo: 20,
  cfo_finance: 18,
  coo_operations: 16,
  risk_hr: 12,
  controller_manager: 8,
  other: 4,
};

/**
 * Sales-prioritization score. This is NOT an insurance-risk score; it ranks
 * how worthwhile a human follow-up is.
 *
 * Weights: company fit 25, seniority 20, renewal timing 20, demonstrated
 * pain 20, engagement intent 10, data completeness 5.
 */
export function computeLeadScore(input: LeadInputs): LeadScoreBreakdown {
  const { profile, scores } = input;

  // Company fit (25): industry focus 10, revenue band 10, territory 5.
  let companyFit = 0;
  if (profile.industry === "cre_owner" || profile.industry === "multifamily") companyFit += 10;
  else if (profile.industry) companyFit += 4;
  switch (profile.revenueBand) {
    case "10m_25m":
    case "25m_50m":
    case "50m_100m":
    case "100m_250m":
      companyFit += 10;
      break;
    case "over_250m":
      companyFit += 6;
      break;
    case "under_10m":
      companyFit += 3;
      break;
  }
  const territory = classifyZip(profile.zip);
  if (isCoreTerritory(territory)) companyFit += 5;
  else if (territory === "central_north_jersey" || territory === "delaware") companyFit += 2;

  // Seniority (20)
  const seniority = input.role ? ROLE_SCORE[input.role] : 0;

  // Renewal timing (20): 2-6 months out is ideal; too close = 8; far = scaled.
  let renewalTiming = 0;
  const m = input.monthsUntilRenewal;
  if (m === null) renewalTiming = 6;
  else if (m >= 2 && m <= 6) renewalTiming = 20;
  else if (m === 1 || m === 7 || m === 8) renewalTiming = 14;
  else if (m === 0) renewalTiming = 8;
  else renewalTiming = 10;

  // Demonstrated pain (20): stated concern 6, low overall 8, critical flags 6.
  let demonstratedPain = 0;
  if (profile.primaryConcern && profile.primaryConcern !== "not_sure") demonstratedPain += 6;
  if (scores?.overall !== null && scores?.overall !== undefined) {
    if (scores.overall < 50) demonstratedPain += 8;
    else if (scores.overall < 75) demonstratedPain += 5;
    else demonstratedPain += 2;
  }
  if (scores && scores.criticalFlags.length > 0) demonstratedPain += Math.min(6, 3 * scores.criticalFlags.length);

  // Engagement intent (10)
  let engagementIntent = 0;
  if (input.emailCaptured) engagementIntent += 4;
  if (input.workshopRequested) engagementIntent += 4;
  if (profile.willingToSharePolicies === "yes") engagementIntent += 2;
  else if (profile.willingToSharePolicies === "maybe") engagementIntent += 1;
  engagementIntent = Math.min(10, engagementIntent);

  // Data completeness (5)
  const dataCompleteness = scores ? Math.round((scores.confidence / 100) * 5) : 0;

  const total = companyFit + seniority + renewalTiming + demonstratedPain + engagementIntent + dataCompleteness;
  const tier: LeadScoreBreakdown["tier"] = total >= 70 ? "A" : total >= 50 ? "B" : "C";

  return { total, companyFit, seniority, renewalTiming, demonstratedPain, engagementIntent, dataCompleteness, tier };
}
