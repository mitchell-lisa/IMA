# Industry roadmap

The plan's rule: prove that one or two modules generate meetings before building more. Two industry variants exist today (3PL/warehousing, light manufacturing). Everything else in the plan's niche table is captured at intake as a self-identified niche so the producer dashboard shows demand by niche before any module is built.

## How an industry variant works

A variant does not add questions or change scoring. It changes wording on the questions where the niche's exposures matter, via `variants` on a question in `src/lib/diagnostic/questions.ts`, plus an industry entry in `src/lib/diagnostic/industries.ts` (label, NAICS, category weights, market note). The 18-core + 7-branch structure and the 0–3 ladder stay fixed.

Recipe for a new industry (about an hour):

1. Add the industry id to `IndustryId` in `types.ts` and an entry in `INDUSTRIES` with category weights that reflect what underwriters emphasize.
2. Add `variants.<industry>` on the questions listed for the niche below.
3. Point the niche's `industry` in `niches.ts` at the new id so intake pre-selects it.
4. Add a `w(...)` weight for the new industry on every question (the helper takes one weight per industry).
5. Regenerate `docs/question-matrix.md` and add a variant test in `tests/variants-brief.test.ts`.

## Niche-to-variant map

| Niche (plan) | Dynamic module (plan) | Questions to adapt | Suggested weight emphasis | Status |
|---|---|---|---|---|
| 3PL / warehousing | Cargo, auto, warehouse legal liability, fire protection | exposure data, safety, contracts, insurance requirements, new activity, fleet branch | contractual risk transfer 1.5, market readiness 1.25 | **Built** |
| Light / advanced manufacturing | BI, machine guarding, product liability | exposure data, safety, contracts, insurance requirements, new activity | operational controls 1.5, market readiness 1.25 | **Built** |
| Food distribution / cold storage | Refrigeration breakdown, recall, contamination | exposure data (spoilage values), safety (temperature monitoring, equipment maintenance), new activity (recall readiness), property branch (refrigeration equipment) | operational controls 1.5, emerging risk 1.25 | Next candidate if demand shows; reuses 3PL as base |
| Life-sciences supplier | Clinical/product liability, cold chain, cyber, E&O | exposure data, cyber, contracts (clinical/supply terms), regulated materials branch | operational controls 1.5, emerging risk 1.25 | Later |
| Contractors / trades | Wrap-ups, fleet, jobsite safety, certificates | signed contracts, insurance requirements, certificate verification, subcontractor branch, fleet branch, safety | contractual risk transfer 1.75, operational controls 1.25 | Planned second wave (plan: "then add contractors") |
| Commercial real estate owner | SOV quality, flood, BI, leases, management agreements | exposure data (SOV), property branch (valuation, flood, carrier recs), contracts (leases, management agreements), certificate verification | market readiness 1.5, contractual risk transfer 1.25 | Planned second wave (plan: "then add real estate"); the example workshop workbook is a real estate case and supplies most of the wording |
| Multifamily / property manager | Renters insurance, habitability, EPLI, vendor controls | contracts (leases), certificate verification (vendors, renters), workforce branch (EPLI), safety (habitability inspections) | contractual risk transfer 1.5, operational controls 1.25 | Later |
| Healthcare practice / MSO | Medical professional, cyber, regulatory, credentialing | cyber, sensitive-data branch, regulatory monitoring, workforce branch | operational controls 1.5, emerging risk 1.25 | Later |
| Senior living / home care | Abuse controls, auto, professional liability, staffing | safety (abuse prevention, training), fleet branch, workforce branch, incident reporting | claims 1.5, operational controls 1.5 | Later |
| Professional services | Contract scope, client concentration, privacy | signed contracts (scope, limitation of liability), insurance requirements, sensitive-data branch | contractual risk transfer 1.5 | Later |
| Technology / MSP | Tech E&O, ransomware, dependent BI | cyber, sensitive-data branch, contracts (SLAs), new activity (dependent BI) | operational controls 1.75 | Later |
| Auto dealer / fleet business | Garage liability, false pretense, cyber, weather | fleet branch, payment & wire (false pretense), property branch (weather), cyber | operational controls 1.5 | Later |
| Hospitality / country club | Liquor, golf carts, pools, events, D&O | safety (liquor service, pools, carts), contracts (events, vendors), investor/board branch | operational controls 1.5, governance 1.25 | Later; the Laurel Creek deck supplies the dialogue starters |
| Nonprofit / social services | D&O, abuse/molestation controls, professional liability | safety (abuse prevention, volunteer screening), investor/board branch (governance), workforce branch | governance 1.5, operational controls 1.5 | Later |

## What to watch in the dashboard

- Niche column on the leads table and `niche` in the CRM payload and CSV export.
- The `assessment_started` event carries `industry` and `niche`, so start and completion rates can be compared per niche even for prospects who never leave an email.
- Build the next variant when a niche without a module shows up repeatedly with Tier A or B leads.
