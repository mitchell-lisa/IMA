# Privacy and data map

Working document for compliance review. Describes every data element the MVP stores, where, why, and for how long.

## Data elements

| Element | Table / field | Purpose | Sensitive? | Retention |
|---|---|---|---|---|
| Company name, website, ZIP | `assessments.profile` | Scoring context, enrichment, dashboard | Business | 90 days if no lead; else per records policy |
| Industry, employee band, revenue band | `assessments.profile` | Weighting, lead fit | Business | Same |
| Renewal month, incumbent tenure, major lines, premium band, concern, willingness to share | `assessments.profile` | Timing guidance, producer brief | Business (premium band is a band only) | Same |
| Branch flags (buildings, vehicles, subcontractors, data, investors, regulated materials) | `assessments.profile` | Question branching | Business | Same |
| Answers (0–3 / unknown) | `assessments.answers` | Scoring | Business | Same |
| Computed result (scores, findings, checklist) | `assessments.result` | Display, PDF, brief | Derived | Same |
| Enrichment (domain, territory, NAICS) | `assessments.enrichment` | Dashboard, CRM payload | Derived | Same |
| External enrichment (opt-in): ZIP centroid, FEMA county hazard context, EPA facility matches by name + ZIP, Census business patterns for the ZIP/NAICS, FMCSA carrier registration by name, AI website summary | `assessments.enrichment.signals` | Producer Brief context only; never shown to the prospect; never a risk grade | Public record / derived | Same |
| Attribution (partner code, UTM, referrer, landing path) | `assessments.attribution` | Partner attribution | Low | Same |
| Hashed IP, user agent | `assessments.ip_hash`, `user_agent` | Abuse prevention, audit | Pseudonymous | Same |
| Contact email, name, role, phone | `leads.*` | Deliver report, follow-up | Personal | Per records policy |
| Consent flags, timestamp, consent text version | `leads.consent_*` | Evidence of consent | Personal | Per records policy |
| Workshop request, prospect notes | `leads.*` | Follow-up | Personal | Per records policy |
| Lead score, disposition, owner, review notes, licensed-review flag | `leads.*` | Internal sales workflow | Internal | Per records policy |
| CRM sync / email status | `leads.*` | Operational | Internal | Per records policy |
| Analytics events | `events` | Funnel metrics | Pseudonymous | 12 months (recommended) |

## Explicitly not collected in v1

- Policy documents, loss runs, contracts (no upload capability).
- Exact premium or revenue figures.
- Raw IP addresses.
- Prospect passwords or accounts.

## Storage and access

- Postgres (Supabase) with encryption at rest; TLS in transit.
- Row-level security: anonymous role has no access. Prospect traffic is server-mediated using the service-role key inside Next.js route handlers only.
- Producers authenticate with Supabase magic link (email-domain allowlist) and must exist in `producers`. They can read leads/assessments and update review fields only; a trigger prevents changes to prospect-supplied columns.
- Secrets live in server environment variables. Nothing sensitive is exposed to the browser.

## Consent

- Report consent (required to unlock the PDF): "Send my PDF report and checklist to this email."
- Marketing consent (optional, separate checkbox): educational content, unsubscribe any time.
- Workshop request (optional, separate checkbox).
- Each capture stores `consent_text_version` (`2026-09-v1`) and a timestamp.

## Retention and deletion

- `purge_anonymous_assessments(90)` removes assessments with no lead after 90 days (schedule via Supabase cron).
- `delete_prospect_data(email)` removes assessment, answers, and lead for a deletion request.
- Reminder emails are only sent with marketing consent.

## Disclaimers displayed

- Results page, PDF, and email: "Educational self-assessment; not a coverage opinion, audit, quotation, binder, or recommendation."
- Pricing note: pricing cannot be assessed from the questionnaire.
- No percentile or benchmark language until a defensible dataset exists.
- Public-record enrichment is opt-in per source (`ENRICHMENT_PROVIDERS`), runs after completion, is shown to producers only, links to the public source, and carries the "verify identity and context" caveat. It is never turned into a risk grade or shown to the prospect.
