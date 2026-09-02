# Scoring specification

All scoring is deterministic and implemented in `src/lib/diagnostic/scoring.ts`. No AI is involved in any score, band, flag, or finding.

## Answer values

| Value | Meaning |
|---|---|
| 0 | Undocumented / reactive |
| 1 | Partial / inconsistent |
| 2 | Documented |
| 3 | Documented, monitored, and reviewed |
| `unknown` | "Not sure / someone else owns this" |

Every question uses the same four-level ladder so scores are comparable across categories.

## Question weights

Each question carries a weight of 1–3 per industry (`weights` in `src/lib/diagnostic/questions.ts`). Example: renewal lead time is weight 3 in every industry; regulatory monitoring is weight 3 for manufacturing and 2 elsewhere.

## Category score

```
earned    = Σ (answer value × weight)          over answered, non-unknown questions
available = Σ (3 × weight)                     over the same questions
category  = earned / available × 100           (rounded to 0.1)
```

`unknown` and unanswered questions are excluded from both numerator and denominator. They reduce confidence; they never imply bad risk. A category with no known answers has a `null` score and is displayed as "Insufficient data".

## Overall score

Weighted mean of category scores using the industry's `categoryWeights` (`src/lib/diagnostic/industries.ts`). Categories with `null` scores are excluded.

| Category | 3PL / Warehousing | Light manufacturing | Other |
|---|---|---|---|
| Governance | 1.00 | 1.00 | 1 |
| Data & market readiness | 1.25 | 1.25 | 1 |
| Operational controls | 1.25 | 1.50 | 1 |
| Claims | 1.25 | 1.25 | 1 |
| Contractual risk transfer | 1.50 | 1.00 | 1 |
| Emerging risk | 0.75 | 1.00 | 1 |

## Confidence score

```
confidence = answered known / applicable questions × 100
```

Bands: high ≥ 85, moderate 60–84, low < 60.

## Score bands

| Band | Range | Label |
|---|---|---|
| strong | 75–100 | Stronger documented practices |
| improve | 50–74 | Opportunities to improve consistency |
| priority | 0–49 | Priority areas to investigate |

No percentiles or "below market" labels are displayed. See `NO_BENCHMARK_NOTE`.

## Critical control flags

Questions marked `critical` raise a flag when the answer is at or below the threshold (always 0 in v1), regardless of overall score:

- Renewal lead time inside 30 days
- MFA / tested backups not in place
- Wire and vendor bank changes released on email/phone request
- Incident reporting informal or late
- Certificates collected but not reviewed
- MVRs not run consistently (branch: vehicles)

## Consistency checks

`detectInconsistencies()` compares pairs of answers that should move together (for example, certificates verified but no insurance requirements defined). Notes never change the score; they are surfaced to the prospect as "answers worth reconciling" and to the producer as conversation openers.

## Findings

`src/lib/diagnostic/findings.ts` holds the approved findings library. Each rule has a deterministic trigger, a base priority, and the question ids it derives from. Selection:

1. Evaluate every rule; add a bump for low category score and for a critical flag on the same question.
2. Sort by priority; take at most one finding per category until three are chosen, then fill by priority.
3. If fewer than three rules fire, fall back to a per-category finding naming the weakest practice in any category under 75.

Strengths are the up-to-three categories scoring ≥ 75.

## Renewal timeline

`computeRenewalContext()` measures months until the stated renewal month and compares to a 120-day (4-month) runway: `inside_window` (≤ 4 months), `approaching` (5–6 months), `ample_time` (> 6 months).

## Lead-quality score (sales prioritization, not risk)

| Component | Max | Basis |
|---|---|---|
| Company fit | 25 | Target industry (10), $10M–$250M revenue (10), core territory by ZIP (5) |
| Seniority | 20 | Role of the contact |
| Renewal timing | 20 | 2–6 months out scores full marks |
| Demonstrated pain | 20 | Stated concern, low overall score, critical flags |
| Engagement intent | 10 | Email captured, workshop requested, willing to share documents |
| Data completeness | 5 | Confidence score |

Tiers: A ≥ 70, B ≥ 50, C otherwise.
