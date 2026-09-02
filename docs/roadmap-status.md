# 30-day roadmap: status

Mapped to the plan's four-week roadmap. "Built" means it is in this repository and verified. "Needs IMA" means a person has to do it; the software cannot.

## Week 1: Product design

| Deliverable (plan) | Status | Where / what remains |
|---|---|---|
| Choose two adjacent industries | Built | 3PL/warehousing and light manufacturing (`src/lib/diagnostic/industries.ts`); 12 more niches captured at intake, roadmap in `docs/industry-roadmap.md` |
| Question matrix | Built | 18 core + 7 branched, industry variants; generated `docs/question-matrix.md` |
| Validate questions with IMA specialists | **Needs IMA** | Send `docs/question-matrix.md` and `docs/workshop-crosswalk.md` to the specialists who ran the example workshop; edits are wording changes in `questions.ts` |
| Scoring specification | Built | `docs/scoring-spec.md`; deterministic, unit-tested |
| Approved findings library | Built, **needs approval** | `src/lib/diagnostic/findings.ts`; every finding is traceable to question ids; compliance should read the 17 titles and detail lines |
| Approve disclaimers | **Needs IMA** | All compliance copy is in `src/lib/diagnostic/disclaimers.ts` and the consent checkboxes in `EmailCapture.tsx`; consent text is versioned |
| Privacy / data map | Built, **needs review** | `docs/privacy-data-map.md`; retention purge and deletion function in the migration |
| Two industry branches | Built | Variants and weights |
| Wireframes | Built as working pages | Landing, assessment, results, producer dashboard, lead brief |

## Week 2: Prototype

| Deliverable | Status | What remains |
|---|---|---|
| Responsive clickable flow | Built | Runs with zero configuration (`npm run dev`) |
| Five complete test personas | Partially built | Automated smoke test covers a 3PL, a manufacturer, a contractor, and a module-entry persona. **Needs IMA**: five friendly CFO/owner contacts running the real flow; log completion time to set the estimate the landing page is deliberately not publishing yet |
| Contradiction tests | Built | Consistency checks in `scoring.ts` with tests |
| Producer Brief mockup | Built as the real page | `/producer/leads/[id]`, plus JSON/Markdown via API |
| Referral-partner landing page | Built | Any URL with `?partner=<code>` attributes the lead; module entry points at `/?module=renewal|contracts|claims`. **Needs IMA**: partner codes and a co-branded page per partner if desired |
| Revise language | **Needs IMA** | After specialist and usability feedback |

## Week 3: MVP build

| Deliverable | Status |
|---|---|
| Production code | Built (Next.js 15, TypeScript) |
| Supabase schema / RLS | Built (`supabase/migrations/0001_init.sql`), **needs a Supabase project and the migration run** |
| Email notifications | Built (prospect result + PDF, producer alert), **needs `RESEND_API_KEY` or a swap to IMA's provider** |
| PDF report | Built |
| Source tracking | Built (partner, UTM, module, niche) |
| Analytics events | Built (`events` table); funnel view at `/producer/submissions` |
| Admin authentication | Built (Supabase magic link with domain allowlist; dev passcode locally), **needs producers added to the `producers` table** |
| Producer Brief | Built, with workshop crosswalk |
| CRM-ready lead payload | Built (signed webhook + CSV), **needs `CRM_WEBHOOK_URL` and IMA technology/compliance approval before production data flows** |
| Public-data enrichment | Built, opt-in (FEMA NRI and EPA ECHO need no keys) |

## Week 4: Controlled launch

| Deliverable | Status | What remains |
|---|---|---|
| Launch through warm relationships and referral partners | **Needs IMA** | 25–50 targeted invitations; two partner campaigns using partner codes |
| Inspect every submission manually | Built | `/producer/submissions` lists every assessment including anonymous completions, with funnel counts by module, partner, and industry |
| Personal follow-up on every qualified completion | Built for tracking | Dashboard shows "Awaiting review" until a licensed professional marks the lead reviewed; disposition and owner fields |
| Feedback interviews | **Needs IMA** | |
| Scoring revisions | Ready | Weights and thresholds are data in `questions.ts` and `industries.ts`; tests guard the invariants |

## Launch checklist

1. Create the Supabase project, run the migration, add producers, set `PRODUCER_ALLOWED_EMAIL_DOMAINS`.
2. Set `SESSION_SECRET`, `IP_HASH_SALT`, `NEXT_PUBLIC_APP_URL`.
3. Configure email (`RESEND_API_KEY`, `EMAIL_FROM`, `PRODUCER_ALERT_EMAIL`).
4. Decide on CRM: webhook now, or CSV export until Salesforce is approved.
5. Choose enrichment providers (`ENRICHMENT_PROVIDERS=nri,echo` needs no keys).
6. Compliance sign-off on disclaimers, consent text, findings library, and privacy notice. Then set branding variables.
7. Deploy to Vercel; run the smoke flow once against production; schedule the retention purge.
8. Create partner codes and send the first invitations.

## Success metrics (plan) and where to read them

| Metric | Where |
|---|---|
| Landing-to-start | `assessment_started` events vs. page analytics (add Vercel Analytics or similar) |
| Completion rate, email-capture rate | `/producer/submissions` funnel tiles |
| Qualified-completion rate, workshop-booking rate | Leads table: Tier A/B counts and "Workshop" tile |
| Show rate, accepted opportunity rate | Disposition field (`workshop_completed`, `opportunity`) |
| Partner-source conversion | `/producer/submissions` breakdown by partner |
| Time to human follow-up | `lead_reviewed` event timestamp minus `lead_captured` |
| Findings validated by specialists | Review notes on each lead |
