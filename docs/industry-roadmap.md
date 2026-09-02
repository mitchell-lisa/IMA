# Industry roadmap

The plan's rule: prove that one or two modules generate meetings before building more. The platform is built for the real estate vertical. Two industry variants exist today (commercial real estate owners; multifamily owners and managers). Every other real estate niche in the plan is captured at intake as a self-identified niche so the producer dashboard shows demand by niche before any further module is built.

## How an industry variant works

A variant does not add questions or change scoring. It changes wording on the questions where the niche's exposures matter, via `variants` on a question in `src/lib/diagnostic/questions.ts`, plus an industry entry in `src/lib/diagnostic/industries.ts` (label, NAICS, category weights, market note). The 18-core + 7-branch structure and the 0–3 ladder stay fixed.

Recipe for a new industry (about an hour):

1. Add the industry id to `IndustryId` in `types.ts` and an entry in `INDUSTRIES` with category weights that reflect what underwriters emphasize.
2. Add `variants.<industry>` on the questions listed for the niche below.
3. Point the niche's `industry` in `niches.ts` at the new id so intake pre-selects it.
4. Add a `w(...)` weight for the new industry on every question (the helper takes one weight per industry).
5. Regenerate `docs/question-matrix.md` and add a variant test in `tests/variants-brief.test.ts`.

## Branches available to every real estate profile

| Trigger | Branched question | What it covers |
|---|---|---|
| Owns buildings | `br_property_valuation` | Statement of values, replacement cost, flood zones, carrier recommendations |
| Uses a third-party manager | `br_management_agreement` (critical at 0) | Indemnity, insurance, and named-insured terms in the management agreement |
| Uses site vendors | `br_vendor_transfer` | Snow and ice, security, landscaping, renovation contracts and certificates |
| Has residential tenants | `br_residential_programs` | Renters insurance, fair housing, habitability, tenant screening |
| Employees above threshold | `br_workforce_programs` | Handbook, harassment training, wage and hour, EPLI |
| Outside investors or lenders | `br_governance_investors` | D&O, lender and investor reporting, entity structure |
| Environmental exposures | `br_environmental` | Mold, lead, asbestos, tanks, pollution coverage |

## Niche-to-variant map

| Niche (plan) | Dynamic module (plan) | Questions to adapt | Suggested weight emphasis | Status |
|---|---|---|---|---|
| Multifamily / apartment communities | Renters insurance, habitability, EPLI, vendor controls | exposure data, safety and inspections, insurance requirements, regulatory monitoring, residential and vendor branches | operational controls 1.5, claims 1.25, contractual risk transfer 1.25 | **Built** (`multifamily`) |
| Office | SOV quality, lease requirements, BI, life safety | exposure data, safety and inspections, insurance requirements, property branch | market readiness 1.5, contractual risk transfer 1.25 | **Built** (`cre_owner`) |
| Industrial / flex / warehouse | SOV quality, sprinkler and roof condition, tenant contracts, environmental | same as office plus environmental branch | market readiness 1.5, contractual risk transfer 1.25 | **Built** (`cre_owner`) |
| Retail / mixed-use | Snow and ice, security, lease requirements, liquor tenants | same as office plus vendor branch | market readiness 1.5, contractual risk transfer 1.25 | **Built** (`cre_owner`) |
| Net-lease / single-tenant | Tenant compliance tracking, lender requirements, named insureds | insurance requirements, certificate verification, investor branch | market readiness 1.5, contractual risk transfer 1.25 | **Built** (`cre_owner`) |
| Student housing | Renters insurance, security, event and alcohol exposure | multifamily wording plus security and event language | operational controls 1.5 | **Built** (`multifamily`) |
| Third-party property manager | Management agreements, E&O, tenant discrimination, funds handling | management-agreement branch, payment and wire, workforce branch | contractual risk transfer 1.5, operational controls 1.25 | **Built** (`multifamily`); a dedicated manager variant is the next candidate |
| Developer / owner-builder | Builders risk, wrap-ups, contractor certificates, lender requirements | new activity (projects), signed contracts, certificate verification, property branch | contractual risk transfer 1.5, market readiness 1.25 | **Built** (`cre_owner`); builders-risk wording is a later variant |
| Self-storage | Customer goods legal liability, security, tenant insurance programs | insurance requirements (rental agreements), safety (access control), new activity | operational controls 1.25 | Next candidate if demand shows |
| Hospitality / hotel assets | Liquor, pools, events, management agreements, D&O | safety (liquor, pools, events), management-agreement branch, investor branch | operational controls 1.5, governance 1.25 | Later; the Laurel Creek deck supplies the dialogue starters |
| Senior housing / assisted living | Abuse controls, professional liability, staffing, auto | safety (abuse prevention, training), workforce branch, incident reporting | claims 1.5, operational controls 1.5 | Later |
| Condo / HOA association | D&O, master policy allocation, vendor controls, reserves | governance (board), investor branch, vendor branch, exposure data (master policy) | governance 1.5, contractual risk transfer 1.25 | Later |
| Land / agricultural holdings | Environmental, premises, trespass | environmental branch, safety (premises), signed contracts (leases) | emerging risk 1.25 | Later |

## What to watch in the dashboard

- Niche column on the leads table and `niche` in the CRM payload and CSV export.
- The `assessment_started` event carries `industry` and `niche`, so start and completion rates can be compared per niche even for prospects who never leave an email.
- Build the next variant when a niche without a module shows up repeatedly with Tier A or B leads.
