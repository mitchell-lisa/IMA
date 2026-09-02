# API routes

All routes validate input with zod, run server-side only, and apply per-IP rate limits. Errors return `{ error, details? }`.

## Prospect

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/assessment/start` | company name, website, zip, industry, employeeBand, revenueBand, `startedAt`, honeypot `website_confirm` | `{ assessmentId, resultsToken, status, profile, answers }` |
| POST | `/api/assessment/answer` | `assessmentId`, partial `answers`, partial `profile` | updated session |
| POST | `/api/assessment/complete` | `assessmentId`, final `answers`/`profile` | `{ token, resultsPath }` |
| POST | `/api/enrichment/company` | website, zip, industry | domain, territory, NAICS, signals |
| GET | `/api/results/[token]` | – | public result DTO (no answers, no attribution) |
| GET | `/api/results/[token]/pdf` | – | PDF; 403 until an email has been captured |
| POST | `/api/lead/capture` | token, email, name, role, phone, `consentReport: true`, consentMarketing, workshopRequested, notes | `{ leadId, tier, pdfPath }`; triggers prospect email + PDF, producer alert, CRM dispatch |

## Producer (requires producer session)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/producer/auth` | Magic link (Supabase) or dev passcode sign-in |
| DELETE | `/api/producer/auth` | Sign out |
| POST | `/api/producer/brief` | `{ leadId | assessmentId, format: json|markdown, useAi }` |
| PATCH | `/api/producer/leads/[id]` | disposition, followUpOwner, reviewNotes, licensedReviewCompleted |
| POST | `/api/producer/leads/[id]` | Re-send CRM payload |
| GET | `/api/producer/leads/export` | CSV of CRM-ready payloads |
| GET | `/api/producer/export/answers` | Anonymized per-question CSV (no names, contacts, or free text) for scoring-distribution and cohort analysis |

## Outbound notifications

On lead capture, in parallel and never blocking the prospect: prospect email with PDF (Resend), producer alert email (`PRODUCER_ALERT_EMAIL`), CRM webhook (`CRM_WEBHOOK_URL`), and a Microsoft Teams Adaptive Card (`TEAMS_WEBHOOK_URL`). Each records an event with its status.

## Webhooks

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/webhooks/crm` | `X-MarketReady-Signature` HMAC-SHA256 of raw body with `CRM_WEBHOOK_SECRET` | CRM pushes disposition/owner/external id |
| POST | `/api/webhooks/email` | `?secret=` or `X-Webhook-Secret` = `EMAIL_WEBHOOK_SECRET` | Delivery / bounce events |

## Entry modules and attribution

Any landing URL may carry `?module=renewal|contracts|claims` (default `marketready`), `?partner=<code>` and UTM parameters. The middleware stores them in a 30-day cookie; the start route copies them onto the assessment. The module changes landing-page framing and the results-page focus card only; scoring is identical. The CRM payload carries `entry_module` and `partner_code` so conversion can be compared by pitch and by referral partner.

Outbound CRM dispatch (`CRM_WEBHOOK_URL`) sends the flat payload in `src/lib/server/crm.ts`, signed with the same header.

## Public-data enrichment

Runs once after `/api/assessment/complete` stores the result, so a slow or failing source never delays the results page. Providers are opt-in via `ENRICHMENT_PROVIDERS` and isolated with a 4–6 second timeout each.

| Provider id | Source | Key | Applies when | Output |
|---|---|---|---|---|
| `nri` | FEMA National Risk Index (county, ArcGIS feature service) | none | ZIP geocodes | Composite rating, expected annual loss, resilience, hazards rated relatively moderate or higher. Location context only. |
| `echo` | EPA ECHO facility search (`get_facilities` → `get_qid`) | none | company name + ZIP | Up to 3 facilities matched by name in the ZIP with inspection/penalty counts and a registry link; skipped when the name is generic (>10 hits). |
| `census` | Census County Business Patterns (ZIP × 3-digit NAICS) | `CENSUS_API_KEY` | NAICS known | Establishment and employment counts, cached 24h. |
| `fmcsa` | FMCSA QCMobile carrier search by legal name | `FMCSA_WEB_KEY` | fleet reported or 3PL | Up to 3 carriers (same ZIP preferred) with power units, drivers, safety rating, and a SAFER link. |
| `website` | Company homepage + Claude summary | AI settings | domain known | 2–4 factual sentences labeled with URL and fetch date. |

Every external signal carries `sourceUrl` and a caveat. Signals appear only in the producer lead page and brief. `enrichment_completed` is emitted with the provider list.

## Analytics events

`assessment_started`, `assessment_progress`, `assessment_completed`, `lead_captured`, `lead_updated`, `prospect_email`, `crm_sync`, `pdf_downloaded`, `lead_reviewed`, `crm_inbound`, `email_event`. Stored in `events` with the assessment/lead id.
