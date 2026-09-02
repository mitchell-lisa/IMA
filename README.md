# MarketReady Risk Diagnostic

An 18–25 question, industry-adaptive self-assessment that measures how ready a middle-market company is to be evaluated by the commercial insurance market: program governance, data and market readiness, operational controls, claims discipline, contractual risk transfer, and emerging risk.

It is the MVP lead-generation system described in the product plan for South Jersey and Greater Philadelphia, launching with **3PL / warehousing** and **light manufacturing**.

> Educational self-assessment; not a coverage opinion, audit, quotation, binder, or recommendation.

## What is built

| Area | Status |
|---|---|
| Landing page with trust elements and "exactly what we store" | ✅ `src/app/page.tsx` |
| Company profile intake with bot protection (honeypot + dwell time + rate limits) | ✅ `src/components/AssessmentFlow.tsx` |
| Two industry variants plus a generic fallback | ✅ `src/lib/diagnostic/industries.ts` |
| 18 core questions (3 per category) + 7 branched questions | ✅ `src/lib/diagnostic/questions.ts` |
| Deterministic scoring, bands, confidence, critical flags, consistency checks | ✅ `src/lib/diagnostic/scoring.ts` |
| Approved findings library (top three investigation areas + strengths) | ✅ `src/lib/diagnostic/findings.ts` |
| Renewal timeline vs. 120-day runway, incumbent context | ✅ `src/lib/diagnostic/renewal.ts` |
| Results page with immediate findings, email gate for PDF + checklist | ✅ `src/app/results/[token]` |
| PDF report and prospect email | ✅ `src/lib/server/pdf.ts`, `email.ts` |
| Producer alert email, Producer Brief (JSON / Markdown / page) | ✅ `src/lib/brief/producerBrief.ts` |
| Producer dashboard with all specified columns, CSV export, licensed-review workflow | ✅ `src/app/producer` |
| Lead-quality score (sales prioritization, not risk) | ✅ `src/lib/diagnostic/leadScore.ts` |
| CRM-ready payload via signed webhook, CSV fallback, inbound CRM + email webhooks | ✅ `src/lib/server/crm.ts`, `src/app/api/webhooks` |
| Partner attribution and UTM capture | ✅ `src/middleware.ts` |
| Entry modules (Renewal Control Tower, Hidden Risk Transfer Scan, Claims Friction Index) reusing the same engine with different framing, recorded per lead | ✅ `src/lib/diagnostic/modules.ts`, `/?module=renewal|contracts|claims` |
| Supabase schema with RLS, retention purge, deletion function | ✅ `supabase/migrations/0001_init.sql` |
| Reporting schema matching the plan's data model (organizations, contacts, assessments, answers, questions, scores, findings, enrichments, leads, events) as views over the operational tables, plus a generated `questions` seed | ✅ `supabase/migrations/0002_reporting_schema.sql`, `supabase/seed/questions.sql` |
| IMA branding: name, mark, favicon, IMA blue, wordmark on the PDF | ✅ default on; `NEXT_PUBLIC_BRAND_NAME=none` for an unbranded build |
| Analytics events for every funnel step | ✅ `events` table |
| Optional AI plain-English summary for the brief (structured findings only) | ✅ off by default, `src/lib/server/ai.ts` |
| Public-data enrichment, opt-in per source: FEMA NRI, EPA ECHO (no keys), Census CBP, FMCSA (keyed), website summary | ✅ `src/lib/server/enrichment/`, producer-facing only |
| Microsoft Teams alert on qualified lead (incoming webhook) | ✅ optional, `src/lib/server/teams.ts` |
| Anonymized per-question CSV export for scoring-distribution analysis | ✅ `/api/producer/export/answers` |
| Excel workbook and JSON export of the question bank, findings, modules, niches (for the Copilot Excel agent) | ✅ `npm run docs:bank` → `docs/marketready-question-bank.xlsx` |
| Agent knowledge pack: approved question logic, findings language, scoring, workshop methodology, runtime prompts | ✅ `npm run docs:pack` → `docs/agent-knowledge-pack.md` |
| Unit tests for scoring, findings, lead score, territory, brief, enrichment parsers | ✅ `tests/` |

Not built, by design (see the plan's "Do not build" list): quotes, "you are overpaying" conclusions, carrier comparisons, AI policy interpretation, coverage recommendations, public enforcement risk grades, prospect accounts, document upload, chatbot.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional; the app runs with zero configuration
npm run dev
```

With no environment variables the app uses an in-memory store, logs emails to the console, and skips CRM dispatch. A production build (`next start`, or a Vercel production deployment) refuses to start on the in-memory store unless `ALLOW_MEMORY_STORE=true` is set, because serverless instances would lose assessments between requests. To open the producer dashboard locally set `PRODUCER_DEV_PASSCODE=anything` and sign in at `/producer/login` with any email plus that passcode.

```bash
npm run check     # typecheck + lint + unit tests
npm run build
npm run docs:all  # regenerate question matrix, Excel workbook + JSON, agent knowledge pack (workbook step needs python3 + openpyxl)
```

## Architecture

- **Next.js 15 App Router + TypeScript + Tailwind v4** on Vercel.
- **Browser**: question rendering, branching, progress, local draft state, accessible results.
- **Server** (`src/lib/server`, all `server-only`): zod validation, deterministic scoring, enrichment, consent logging, database writes, email, PDF generation, CRM dispatch, rate limiting, producer authorization. Public DTOs never include raw answers, IP hashes, or attribution.
- **Data**: Supabase Postgres via a `Repository` interface (`src/lib/server/repo`). `SupabaseRepository` is used when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set; otherwise `MemoryRepository`.
- **Auth**: no prospect accounts. Producers sign in with Supabase magic link; the email-domain allowlist is a coarse filter and active membership in the `producers` table is the actual authorization (producer pages read through the service-role client, so RLS is not a second check there). A signed passcode cookie exists for local development and demos only.
- **Post-response work**: prospect email with PDF, CRM dispatch, Teams alert, and public-data enrichment run in Next.js `after()` with bounded timeouts, so the prospect's response never waits on a third party.
- **Lead updates**: the results URL is shareable, so a token alone cannot replace a lead's email or grant consent. Updates are accepted only for the same email and only move flags from off to on.
- **AI**: optional and off by default. It only writes a 3–5 sentence summary from already-computed findings. It never scores, interprets policies, or estimates premium.

Architecture diagram and box-to-code map: [`docs/architecture.md`](docs/architecture.md). Route map and payloads: [`docs/api.md`](docs/api.md). Scoring rules: [`docs/scoring-spec.md`](docs/scoring-spec.md). Question bank: [`docs/question-matrix.md`](docs/question-matrix.md). Data inventory: [`docs/privacy-data-map.md`](docs/privacy-data-map.md). Relationship to the in-person workshop: [`docs/workshop-crosswalk.md`](docs/workshop-crosswalk.md). Adding industries: [`docs/industry-roadmap.md`](docs/industry-roadmap.md). 30-day roadmap status and launch checklist: [`docs/roadmap-status.md`](docs/roadmap-status.md).

## Configuration

See `.env.example`. Production requires `SESSION_SECRET`, the Supabase settings, and `PRODUCER_ALLOWED_EMAIL_DOMAINS`. Email (Resend), CRM webhook, producer alert address, and AI summaries are each optional and degrade gracefully.

## Deploying

1. Create a Supabase project and run `supabase/migrations/0001_init.sql`, then `0002_reporting_schema.sql` and `supabase/seed/questions.sql`.
2. Insert producers into `public.producers` (user id from Supabase Auth after their first magic-link sign-in) and partner codes into `public.partners`.
3. Schedule `select public.purge_anonymous_assessments(90);` (Supabase cron) for retention.
4. Deploy to Vercel with the environment variables from `.env.example`.
5. Point the CRM integration at `CRM_WEBHOOK_URL` (outbound) and `/api/webhooks/crm` (inbound), both signed with `CRM_WEBHOOK_SECRET`.

## Compliance notes

- Copy that requires approval is centralized in `src/lib/diagnostic/disclaimers.ts` and the findings library.
- IMA branding is on by default (approved 2026-09-02). Set `NEXT_PUBLIC_BRAND_NAME=none` for an unbranded build.
- Every qualified lead is flagged "Awaiting review" until a licensed professional marks it reviewed in the dashboard.
- Consent text is versioned (`CONSENT_TEXT_VERSION`) and stored with each lead.
