import { MONTH_LABELS } from "./labels";
import type { RenewalContext } from "./types";

export const RECOMMENDED_LEAD_MONTHS = 4; // ~120 days

/**
 * Computes renewal timing relative to `now`. Deterministic given `now` so the
 * function can be tested.
 */
export function computeRenewalContext(renewalMonth: number | undefined | null, now: Date = new Date()): RenewalContext {
  if (!renewalMonth || renewalMonth < 1 || renewalMonth > 12) {
    return {
      renewalMonth: null,
      monthsUntilRenewal: null,
      recommendedStartMonth: null,
      status: "unknown",
      message: "Renewal month not provided. Add it to see how your preparation timeline compares to a 120-day runway.",
    };
  }
  const current = now.getMonth() + 1;
  let months = renewalMonth - current;
  if (months < 0) months += 12;
  // Treat "this month" as 12 months out if we're already past the first of the month? No -
  // a renewal this month is effectively upon the prospect. Keep 0.
  const recommendedStartMonth = ((renewalMonth - 1 - RECOMMENDED_LEAD_MONTHS + 24) % 12) + 1;
  const label = MONTH_LABELS[renewalMonth - 1];
  const startLabel = MONTH_LABELS[recommendedStartMonth - 1];

  if (months <= RECOMMENDED_LEAD_MONTHS) {
    return {
      renewalMonth,
      monthsUntilRenewal: months,
      recommendedStartMonth,
      status: "inside_window",
      message:
        months === 0
          ? `Your ${label} renewal is this month. Any documentation gaps identified here are unlikely to be fixed before carriers evaluate the account, but they can be planned for next year.`
          : `Your ${label} renewal is about ${months} month${months === 1 ? "" : "s"} away, inside the 120-day window when submissions are typically prepared. Preparation work should already be underway.`,
    };
  }
  if (months <= RECOMMENDED_LEAD_MONTHS + 2) {
    return {
      renewalMonth,
      monthsUntilRenewal: months,
      recommendedStartMonth,
      status: "approaching",
      message: `Your ${label} renewal is about ${months} months away. A 120-day runway means preparation should begin around ${startLabel}.`,
    };
  }
  return {
    renewalMonth,
    monthsUntilRenewal: months,
    recommendedStartMonth,
    status: "ample_time",
    message: `Your ${label} renewal is about ${months} months away. There is time to document controls before preparation begins around ${startLabel}.`,
  };
}
