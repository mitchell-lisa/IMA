# Question matrix

Generated from `src/lib/diagnostic/questions.ts`. Regenerate with `npm run docs:matrix`.

| # | ID | Category | Topic | Branch | Weight CRE owner | Weight Multifamily | Weight Other | Critical flag |
|---|---|---|---|---|---|---|---|---|
| 1 | `gov_renewal_lead_time` | Program governance | Renewal lead time |  | 3 | 3 | 3 | yes (≤0) |
| 2 | `gov_internal_owner` | Program governance | Program ownership |  | 2 | 2 | 2 |  |
| 3 | `gov_limit_rationale` | Program governance | Limit and deductible rationale |  | 2 | 2 | 2 |  |
| 4 | `mkt_exposure_data` | Property data & market readiness | Statement of values |  | 3 | 3 | 3 |  |
| 5 | `mkt_business_changes` | Property data & market readiness | Portfolio changes |  | 3 | 2 | 2 |  |
| 6 | `mkt_submission_visibility` | Property data & market readiness | Your risk profile in the market |  | 2 | 2 | 2 |  |
| 7 | `ops_cyber_controls` | Operational controls | Data security |  | 2 | 3 | 2 | yes (≤0) |
| 8 | `ops_payment_authorization` | Operational controls | Funds transfer security |  | 3 | 3 | 3 | yes (≤0) |
| 9 | `ops_safety_training` | Operational controls | Inspections, life safety & maintenance |  | 3 | 3 | 2 |  |
| 10 | `clm_reporting_protocol` | Claims discipline | Claim intake & reporting |  | 3 | 3 | 3 | yes (≤0) |
| 11 | `clm_open_claim_review` | Claims discipline | Claims management & advocacy |  | 2 | 3 | 2 |  |
| 12 | `clm_root_cause` | Claims discipline | Root cause & corrective action |  | 2 | 3 | 2 |  |
| 13 | `crt_signed_contracts` | Contractual risk transfer | Vendor & contractor contracts |  | 2 | 3 | 2 |  |
| 14 | `crt_insurance_requirements` | Contractual risk transfer | Insurance requirements in leases & contracts |  | 3 | 2 | 2 |  |
| 15 | `crt_coi_verification` | Contractual risk transfer | Certificate tracking |  | 3 | 3 | 2 | yes (≤0) |
| 16 | `emr_annual_review` | Emerging risk | Frequent risk assessment |  | 2 | 2 | 2 |  |
| 17 | `emr_regulatory` | Emerging risk | Regulatory & compliance monitoring |  | 2 | 3 | 2 |  |
| 18 | `emr_new_activity_review` | Emerging risk | New exposure review |  | 2 | 2 | 2 |  |
| 19 | `br_property_valuation` | Property data & market readiness | Carrier recommendations & building updates | ownsBuildings | 3 | 3 | 2 |  |
| 20 | `br_management_agreement` | Contractual risk transfer | Management agreements | usesThirdPartyManager | 3 | 3 | 2 | yes (≤0) |
| 21 | `br_vendor_transfer` | Operational controls | Snow & ice, security, and site vendors | usesSubcontractors | 2 | 3 | 2 |  |
| 22 | `br_residential_programs` | Operational controls | Leasing, renters insurance & fair housing | hasResidentialTenants | 1 | 3 | 2 |  |
| 23 | `br_workforce_programs` | Operational controls | Workforce programs | employeesAboveThreshold | 2 | 3 | 2 |  |
| 24 | `br_governance_investors` | Program governance | Investors, funds & lenders | hasOutsideInvestors | 3 | 2 | 2 |  |
| 25 | `br_environmental` | Emerging risk | Environmental risks | environmentalExposures | 3 | 3 | 2 |  |

## Prompts and maturity ladders

### Renewal lead time (`gov_renewal_lead_time`)

When does renewal preparation for the portfolio typically begin relative to policy expiration?

_Property markets reward complete, early submissions. A late start means values and building updates never make it into the story carriers see._

- **0** — Within 30 days of expiration, or when the broker reaches out
- **1** — About 60 days out; we ask brokers to market and follow up 30 days out
- **2** — 90+ days out with a written timeline and an updated statement of values
- **3** — 120+ days out with a documented calendar, owners, a pre-renewal strategy meeting, and a reconciled statement of values
- **unknown** — Not sure / someone else owns this

### Program ownership (`gov_internal_owner`)

Who owns the insurance program for the portfolio, and how is that responsibility defined?

_In many real estate organizations this sits between ownership, an asset manager, a controller, and the property manager._

- **0** — No single owner; whoever the broker contacts handles it, or the property manager decides
- **1** — One person handles it informally alongside other duties
- **2** — A named owner with defined responsibilities, including certificates and mid-term changes
- **3** — A named owner, a backup, and a defined split of duties with the property manager, asset management, and finance
- **unknown** — Not sure / someone else owns this

### Limit and deductible rationale (`gov_limit_rationale`)

How are liability limits, property deductibles, and umbrella limits decided each year?

_This asks about your decision process, not whether the limits are adequate._

- **0** — We trust the agent or go with past numbers; limits follow the premium budget
- **1** — We have discussed limits with the agent but never worked through examples or lender requirements in detail
- **2** — We review limits annually against lender and lease requirements, asset values, and revenue
- **3** — A formal annual process considers industry trends, risk tolerance, balance sheet, defensibility, lender covenants, and documents the rationale for each limit and deductible
- **unknown** — Not sure / someone else owns this

### Statement of values (`mkt_exposure_data`)

How is the statement of values (replacement cost, construction and protection details, occupancy, square footage, year built, updates) maintained and validated before submission?

_Replacement cost that is dictated by the insurer, or carried forward, is the most common reason a property submission is discounted._

- **0** — We don't analyze replacement cost; the insurer dictates it and values are carried forward
- **1** — We reviewed values a few years ago but do not update often and are not confident in the process
- **2** — Values and building details are updated annually and checked against recent construction costs
- **3** — Values are updated annually, reconciled against rebuilds, appraisals, and recent claims, with construction, protection, and update history documented per building
- **unknown** — Not sure / someone else owns this

**multifamily variant**

_Include unit counts, rent roll and business-income values, and any building improvements since the last valuation._


### Portfolio changes (`mkt_business_changes`)

How are acquisitions, dispositions, renovations, new leases, and occupancy changes communicated to your insurance program during the year?

- **0** — They surface at renewal, if at all
- **1** — We mention major acquisitions or sales when we remember
- **2** — A defined process reports each acquisition, disposition, and major renovation to the broker with values and lender requirements
- **3** — Changes are logged, reviewed quarterly for insurance impact, and reflected in schedules and endorsements when they happen
- **unknown** — Not sure / someone else owns this

### Your risk profile in the market (`mkt_submission_visibility`)

Do you know how your story is being told in the marketplace, and do you see what is sent to insurance companies about the portfolio?

_Brokers who never saw your environmental consultant's report, your capital plan, or your maintenance program cannot present them._

- **0** — I don't know; we have never seen what brokers present to market
- **1** — We submit updated information annually and confirm the broker understands changes to the portfolio
- **2** — We review the submission and know which carriers quoted or declined and why
- **3** — We collaborate with our broker to determine how best to portray the portfolio, review the full submission and narrative, and receive a market summary with reasons for declinations
- **unknown** — Not sure / someone else owns this

### Data security (`ops_cyber_controls`)

What data do you hold on tenants, applicants, and investors, how is it stored and shared, and how is it protected?

_Applications, background checks, banking details, and investor reporting are all sensitive. Property-management software vendors should be part of the answer._

- **0** — No data security program or process; information is stored locally and not encrypted
- **1** — Some form of data security, such as limited access, encryption, or occasional employee education
- **2** — A formal data security program: MFA, encryption, limited access, regular training, and a written incident plan
- **3** — Formal program plus vendor security review of property-management and payment platforms, tested backups, and annual review with the broker
- **unknown** — Not sure / someone else owns this

### Funds transfer security (`ops_payment_authorization`)

How is the flow of funds controlled: rent collection, security deposits, vendor payments, wires, and changes to vendor bank details?

- **0** — No formal protocols; an email or phone request is usually sufficient
- **1** — Some combination of dual authorization and written procedures, applied inconsistently
- **2** — Written procedures with callback verification to a known number and dual approval for wires and bank-detail changes
- **3** — Formal written program with regular training: dual authorization, calls to verify, destination-detail confirmation, receipt confirmation, and periodic consultation with the bank on best practices
- **unknown** — Not sure / someone else owns this

### Inspections, life safety & maintenance (`ops_safety_training`)

How are property inspections, life-safety systems, lighting, and preventive maintenance documented across the portfolio?

_Documented inspections and maintenance logs are what carriers credit; practices that exist only in the property manager's head do not count._

- **0** — Inspections happen when something breaks; little is written down
- **1** — Some written procedures; inspection and maintenance records are incomplete or live only with the manager
- **2** — Written inspection schedule, life-safety testing records, and a preventive maintenance plan per property
- **3** — Written program with documented inspections, life-safety testing, lighting and security logs, preventive maintenance plans, and ownership review of results
- **unknown** — Not sure / someone else owns this

**multifamily variant**

Prompt: How are unit and common-area inspections, life-safety systems (smoke and CO detectors, sprinklers, egress), lighting, and preventive maintenance documented across the communities?

_Habitability claims turn on documentation: inspection logs, work-order completion, and life-safety testing records._


**cre_owner variant**

Prompt: How are roof, sprinkler, electrical, and boiler inspections, life-safety systems, and preventive maintenance documented across the buildings?

_Roof age, sprinkler impairments, aluminum wiring, and boiler condition are the recommendations carriers issue most often._


### Claim intake & reporting (`clm_reporting_protocol`)

What policies and procedures make sure incidents at the properties (injuries, fires, water losses, tenant claims) are reported and managed properly?

- **0** — No policies or protocols; the property manager reports claims directly to the carrier when they think of it
- **1** — Supervisors and managers know to report, but timing and format vary; we check in with the broker when we need an update
- **2** — A written protocol defines who reports, how, and within what timeframe, with an incident form for every event
- **3** — Written protocol, reporting within 24–48 hours, incident forms, and formal meetings with broker and adjusters on a predetermined timeline
- **unknown** — Not sure / someone else owns this

### Claims management & advocacy (`clm_open_claim_review`)

How are open claims, reserves, carrier-assigned counsel, and public adjusters managed?

_The workshop asks whether your broker has a systematic process: frequency of updates, claims positioning, policy review, legal guidance, and advocacy._

- **0** — We work directly with the carrier and adjuster; we do not focus on the liability claims process or communicate with assigned counsel
- **1** — We engage the broker if we are not satisfied; the broker primarily deals with counsel while we monitor open claims
- **2** — Scheduled claim reviews at least twice a year with reserve discussion; we consider a public adjuster case by case
- **3** — A systematic process: quarterly reviews with reserve challenges, pre-assigned preferred defense counsel where possible, public-adjuster decisions made with the broker against policy wording, and pre-renewal loss-run reconciliation
- **unknown** — Not sure / someone else owns this

### Root cause & corrective action (`clm_root_cause`)

After an incident at a property, how are root causes identified and corrective actions tracked?

- **0** — We fix what is obvious and move on
- **1** — The property manager discusses causes; actions are not tracked
- **2** — Root-cause review for significant incidents with documented corrective actions and work orders
- **3** — Every incident gets a root-cause review, corrective actions are tracked to closure across the portfolio, and trends are reported to ownership
- **unknown** — Not sure / someone else owns this

### Vendor & contractor contracts (`crt_signed_contracts`)

Tell us about the contracts you use with vendors and contractors at the properties (snow and ice, landscaping, security, renovations). Are master agreements in place with key vendors?

- **0** — We don't always get contracts signed; work often starts on a proposal or a call
- **1** — An attorney reviews or writes contracts and we make sure they are signed
- **2** — Attorney-reviewed contracts plus broker review for insurance and risk-transfer terms; signed before work starts
- **3** — Attorney and broker review, signed before work starts, master agreements with key vendors, and payment blocked when contract or insurance terms are missing
- **unknown** — Not sure / someone else owns this

### Insurance requirements in leases & contracts (`crt_insurance_requirements`)

How are insurance requirements set for tenants in leases and for vendors in contracts, and how are lender and management-agreement requirements on you tracked?

- **0** — We do not set requirements; we accept whatever the tenant, vendor, or lender proposes
- **1** — We use generic lease and contract language without reviewing it
- **2** — Requirements are defined by relationship type (tenant, vendor, contractor) and reviewed by broker or counsel
- **3** — Requirements are defined, reviewed annually, cross-checked against our own policies and every lender and management-agreement obligation, and enforced
- **unknown** — Not sure / someone else owns this

**cre_owner variant**

_Commercial leases typically require tenant liability and property coverage with the owner as additional insured; lenders require specific limits, mortgagee clauses, and flood where applicable._


**multifamily variant**

_Vendor requirements matter most here: snow and ice, security, and renovation contractors should indemnify and name the owner and manager as additional insureds._


### Certificate tracking (`crt_coi_verification`)

What is your process for vetting vendors and contractors who work at the properties, and how are certificates of insurance and endorsements tracked?

- **0** — We don't; certificates are collected when asked and not reviewed
- **1** — We obtain certificates with additional-insured status and check coverage and limit adequacy, but tracking is manual and infrequent
- **2** — Certificates and required endorsements are verified before work and on expiration, in a tracking system
- **3** — Software tracks every vendor's insurance in real time, the broker reviews complete policies for key contractors, endorsements are matched to contract terms, and non-compliant vendors are stopped from working
- **unknown** — Not sure / someone else owns this

### Frequent risk assessment (`emr_annual_review`)

How often is a thorough risk assessment of the portfolio performed outside of an insurance policy renewal?

_A risk review looks at operations, contracts, properties, and controls, not just the policies being renewed._

- **0** — Never, or more than five years ago
- **1** — More than 18 months ago, or only when a new agent first came on board
- **2** — Annually, with a documented list of risks by property
- **3** — Annually with owners and action plans, reviewed with the broker so prevention, mitigation, and insurance stay aligned
- **unknown** — Not sure / someone else owns this

### Regulatory & compliance monitoring (`emr_regulatory`)

How are regulatory and compliance changes affecting the properties monitored (fair housing, ADA, local habitability and safety ordinances, energy and benchmarking rules)?

- **0** — We learn about changes when we are notified of a violation, complaint, or audit
- **1** — Individual managers watch their own areas informally
- **2** — A defined owner monitors regulations, and required training and postings are documented
- **3** — Defined owner, documented compliance calendar, annual training with records, and periodic compliance audits with counsel
- **unknown** — Not sure / someone else owns this

**multifamily variant**

_Fair-housing training records, required postings, and consistent screening criteria are the first things asked about in a discrimination claim._


### New exposure review (`emr_new_activity_review`)

When you acquire a property, add a new property type, allow short-term rentals, or add EV charging or lithium-battery storage, is the risk and insurance impact reviewed beforehand?

_The workshop found owners who had never heard of the lithium-battery exposure and were about to add car chargers._

- **0** — Not usually; insurance catches up later
- **1** — Sometimes, for very large acquisitions
- **2** — A review step with the broker is part of acquisition due diligence and major operational changes
- **3** — Documented pre-acquisition and pre-launch review (environmental due diligence, valuation, lender requirements, new exposures) with follow-up after closing
- **unknown** — Not sure / someone else owns this

### Carrier recommendations & building updates (`br_property_valuation`)

What is your procedure for dealing with insurance company recommendations (sprinklers, wiring, boilers, roofs), and how are building updates and flood exposure documented?

_Carriers issue recommendations after inspections. Owners who track and close them, and show the carrier, negotiate from strength._

- **0** — We do as little as possible; updates and flood zones are not documented
- **1** — We do the bare minimum to stay compliant with the insurer; updates are partially documented
- **2** — An active protocol responds to and tracks recommendations; roof, sprinkler, electrical, and boiler updates are documented with dates
- **3** — Active protocol for every recommendation with completion shown to the carrier, documented update history per building, flood zone determinations, and a professional valuation within three years
- **unknown** — Not sure / someone else owns this

### Management agreements (`br_management_agreement`)

How do your management agreements address insurance and indemnification obligations between you and the third-party property manager?

- **0** — We do not review these requirements in agreements with our property managers
- **1** — We accept the terms and conditions in the manager's boilerplate agreement
- **2** — Counsel reviewed the agreement; we know who insures what and hold the manager's certificate
- **3** — We actively review and dictate the insurance and indemnity terms, require adequate limits and coverages from the manager, and regularly request updated certificates to confirm they are in place
- **unknown** — Not sure / someone else owns this

### Snow & ice, security, and site vendors (`br_vendor_transfer`)

For snow and ice removal, security patrols, and other on-site vendors, how consistently are procedures documented and risk transferred (logs, cameras, indemnity, additional-insured status)?

- **0** — Employees or vendors handle it informally; no logs and contracts have not been reviewed
- **1** — Employees are trained or contractors are hired, but snow logs, security procedures, and contract terms are inconsistent
- **2** — Every snow removal and patrol is documented, and vendors indemnify and name us as additional insured
- **3** — Documented logs visible on cameras, written security and snow procedures, contracts reviewed for indemnity and additional-insured terms, and vendor insurance tracked in a compliance system
- **unknown** — Not sure / someone else owns this

### Leasing, renters insurance & fair housing (`br_residential_programs`)

For residential tenants, how are leasing and screening, renters-insurance verification, anti-discrimination training, and short-term-rental monitoring handled?

- **0** — No formal process; renters insurance is not tracked and fair-housing training is informal
- **1** — Application with employment verification and some screening; renters insurance tracked manually and updated infrequently; handbook statement only
- **2** — Attorney-vetted application and lease, background checks, renters insurance required and tracked, annual fair-housing training, lease prohibits short-term rentals
- **3** — All of the prior plus software that monitors renters insurance in real time and force-places when missing, documented annual training with counsel consultation, and active monitoring for short-term rental use
- **unknown** — Not sure / someone else owns this

### Workforce programs (`br_workforce_programs`)

With on-site and corporate staff of this size, how are workers' compensation return-to-work, employment practices (handbook, training, documentation), and manager training handled?

- **0** — No return-to-work program; handbook is outdated or missing
- **1** — Handbook exists; return-to-work and manager training are informal
- **2** — Written return-to-work program, current handbook, and documented manager training
- **3** — All of the prior plus experience-mod review, claims-trend analysis, and annual employment-practices training with records
- **unknown** — Not sure / someone else owns this

### Investors, funds & lenders (`br_governance_investors`)

With outside investors, funds, or lenders, how are investor reporting, fund and entity E&O and D&O exposures, and lender insurance requirements managed?

- **0** — Updates are provided on demand; entity coverages and lender requirements have not been reviewed
- **1** — Annual performance updates; coverage was placed at the time of the raise and not revisited
- **2** — Quarterly reporting on performance and key metrics; E&O and D&O reviewed annually with the broker against fund documents; lender requirements tracked
- **3** — Quarterly reporting with online access, annual review of entity coverages, every legal entity confirmed as a named insured, and lender requirements reconciled at each closing
- **unknown** — Not sure / someone else owns this

### Environmental risks (`br_environmental`)

What are your practices for environmental risks at the properties (lead, mold, asbestos, oil tanks, legionella, soil contamination), including due diligence on acquisitions?

- **0** — I don't know; we have not looked at it
- **1** — We depend on what we read and hear from industry groups; we may purchase environmental insurance
- **2** — An environmental specialist has reviewed the portfolio and surveys; environmental due diligence is part of acquisitions
- **3** — Specialist reviews the portfolio routinely, moisture and mold procedures are written, lender environmental conditions are tracked, and environmental insurance is reviewed with the broker
- **unknown** — Not sure / someone else owns this

