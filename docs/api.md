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

## Webhooks

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/webhooks/crm` | `X-MarketReady-Signature` HMAC-SHA256 of raw body with `CRM_WEBHOOK_SECRET` | CRM pushes disposition/owner/external id |
| POST | `/api/webhooks/email` | `?secret=` or `X-Webhook-Secret` = `EMAIL_WEBHOOK_SECRET` | Delivery / bounce events |

## Entry modules and attribution

Any landing URL may carry `?module=renewal|contracts|claims` (default `marketready`), `?partner=<code>` and UTM parameters. The middleware stores them in a 30-day cookie; the start route copies them onto the assessment. The module changes landing-page framing and the results-page focus card only; scoring is identical. The CRM payload carries `entry_module` and `partner_code` so conversion can be compared by pitch and by referral partner.

Outbound CRM dispatch (`CRM_WEBHOOK_URL`) sends the flat payload in `src/lib/server/crm.ts`, signed with the same header.

## Analytics events

`assessment_started`, `assessment_progress`, `assessment_completed`, `lead_captured`, `lead_updated`, `prospect_email`, `crm_sync`, `pdf_downloaded`, `lead_reviewed`, `crm_inbound`, `email_event`. Stored in `events` with the assessment/lead id.
