# Question matrix

Generated from `src/lib/diagnostic/questions.ts`. Regenerate with `npm run docs:matrix`.

| # | ID | Category | Topic | Branch | Weight 3PL | Weight Mfg | Weight Other | Critical flag |
|---|---|---|---|---|---|---|---|---|
| 1 | `gov_renewal_lead_time` | Program governance | Renewal lead time |  | 3 | 3 | 3 | yes (≤0) |
| 2 | `gov_internal_owner` | Program governance | Program ownership |  | 2 | 2 | 2 |  |
| 3 | `gov_limit_rationale` | Program governance | Limit rationale |  | 2 | 2 | 2 |  |
| 4 | `mkt_exposure_data` | Data & market readiness | Exposure data |  | 3 | 3 | 3 |  |
| 5 | `mkt_business_changes` | Data & market readiness | Business change documentation |  | 3 | 2 | 2 |  |
| 6 | `mkt_submission_visibility` | Data & market readiness | Submission visibility |  | 2 | 2 | 2 |  |
| 7 | `ops_cyber_controls` | Operational controls | Cyber controls |  | 3 | 2 | 2 | yes (≤0) |
| 8 | `ops_payment_authorization` | Operational controls | Payment & wire controls |  | 3 | 3 | 3 | yes (≤0) |
| 9 | `ops_safety_training` | Operational controls | Safety & training |  | 3 | 3 | 2 |  |
| 10 | `clm_reporting_protocol` | Claims discipline | Incident reporting |  | 3 | 3 | 3 | yes (≤0) |
| 11 | `clm_open_claim_review` | Claims discipline | Open claim review |  | 2 | 3 | 2 |  |
| 12 | `clm_root_cause` | Claims discipline | Root cause & corrective action |  | 2 | 3 | 2 |  |
| 13 | `crt_signed_contracts` | Contractual risk transfer | Signed contracts |  | 3 | 2 | 2 |  |
| 14 | `crt_insurance_requirements` | Contractual risk transfer | Insurance requirements |  | 3 | 2 | 2 |  |
| 15 | `crt_coi_verification` | Contractual risk transfer | Certificate verification |  | 3 | 2 | 2 | yes (≤0) |
| 16 | `emr_annual_review` | Emerging risk | Annual risk review |  | 2 | 2 | 2 |  |
| 17 | `emr_regulatory` | Emerging risk | Regulatory monitoring |  | 2 | 3 | 2 |  |
| 18 | `emr_new_activity_review` | Emerging risk | New activity review |  | 2 | 2 | 2 |  |
| 19 | `br_property_valuation` | Data & market readiness | Property valuation & building updates | ownsBuildings | 3 | 3 | 2 |  |
| 20 | `br_fleet_controls` | Operational controls | Fleet & driver controls | hasVehicles | 3 | 2 | 2 | yes (≤0) |
| 21 | `br_subcontractor_transfer` | Contractual risk transfer | Subcontractor & vendor risk transfer | usesSubcontractors | 3 | 2 | 2 |  |
| 22 | `br_data_security` | Operational controls | Sensitive data handling | storesSensitiveData | 2 | 2 | 2 |  |
| 23 | `br_workforce_programs` | Operational controls | Workforce programs | employeesAboveThreshold | 3 | 3 | 2 |  |
| 24 | `br_governance_investors` | Program governance | Board & investor governance | hasOutsideInvestors | 2 | 2 | 2 |  |
| 25 | `br_regulated_materials` | Emerging risk | Regulated materials & environmental | regulatedMaterials | 2 | 3 | 2 |  |

## Prompts and maturity ladders

### Renewal lead time (`gov_renewal_lead_time`)

When does renewal preparation typically begin relative to your policy expiration?

_Carriers reward complete submissions delivered early. Late starts compress negotiation time._

- **0** — Within 30 days of expiration, or when the broker reaches out
- **1** — About 60 days out, but it varies year to year
- **2** — 90+ days out with a written timeline
- **3** — 120+ days out with a documented calendar, owners, and a pre-renewal strategy meeting
- **unknown** — Not sure / someone else owns this

### Program ownership (`gov_internal_owner`)

Who owns the insurance program internally, and how is that responsibility defined?

- **0** — No single owner; whoever the broker contacts handles it
- **1** — One person handles it informally alongside other duties
- **2** — A named owner with defined responsibilities
- **3** — A named owner, a backup, and a cross-functional review (finance, operations, HR/safety)
- **unknown** — Not sure / someone else owns this

### Limit rationale (`gov_limit_rationale`)

How are policy limits and deductibles decided each year?

_This question asks about your decision process, not whether the limits are adequate._

- **0** — We renew the same limits without discussion
- **1** — The broker recommends and we generally accept
- **2** — We review limits against contracts, assets, and revenue annually
- **3** — We document the rationale for each limit and deductible and revisit it when the business changes
- **unknown** — Not sure / someone else owns this

### Exposure data (`mkt_exposure_data`)

How are exposure values (payroll, revenue, property values, vehicle schedules, inventory) validated before submission?

- **0** — We use last year's numbers unless someone flags a change
- **1** — We update the big items but rarely reconcile schedules
- **2** — Finance validates values annually against records
- **3** — Values are reconciled against financials, fixed-asset registers, and schedules, with sign-off before submission
- **unknown** — Not sure / someone else owns this

### Business change documentation (`mkt_business_changes`)

How are operational changes (new services, locations, equipment, customers, headcount) communicated to your insurance program during the year?

- **0** — They surface at renewal, if at all
- **1** — We mention major changes when we remember
- **2** — A defined process captures changes and shares them with the broker
- **3** — Changes are logged, reviewed quarterly for insurance impact, and reflected in mid-term endorsements when needed
- **unknown** — Not sure / someone else owns this

### Submission visibility (`mkt_submission_visibility`)

How much visibility do you have into what is actually sent to carriers about your company?

_The underwriting story is the narrative and evidence that accompanies applications and loss runs._

- **0** — None; we sign applications and the broker handles the rest
- **1** — We see the applications but not the narrative or which markets were approached
- **2** — We review the submission and know which carriers quoted or declined
- **3** — We co-author the underwriting narrative, review the full submission, and receive a market summary with reasons for declinations
- **unknown** — Not sure / someone else owns this

### Cyber controls (`ops_cyber_controls`)

Which of the following best describes your cyber controls (MFA, backups, endpoint protection, incident response)?

- **0** — Basic antivirus; MFA and tested backups are not consistently in place
- **1** — MFA on email; backups exist but are not tested regularly
- **2** — MFA on email and remote access, tested offline backups, endpoint detection, and a written incident plan
- **3** — All of the prior plus annual testing, vendor security review, and executive reporting
- **unknown** — Not sure / someone else owns this

### Payment & wire controls (`ops_payment_authorization`)

How are changes to vendor bank details and outgoing wire requests verified?

- **0** — Email or phone request is usually sufficient
- **1** — A second approval is required for large amounts only
- **2** — Callback verification to a known number plus dual approval for all bank changes and wires
- **3** — Callback verification, dual approval, documented thresholds, and periodic testing of the process
- **unknown** — Not sure / someone else owns this

### Safety & training (`ops_safety_training`)

How are safety programs, training, and inspections documented?

- **0** — Training happens on the job; little is written down
- **1** — Some written procedures; training records are incomplete
- **2** — Written safety program, documented training, and periodic inspections
- **3** — Written program with documented training, inspections, near-miss reporting, and management review of results
- **unknown** — Not sure / someone else owns this

### Incident reporting (`clm_reporting_protocol`)

What happens when an incident or potential claim occurs?

- **0** — It is reported when someone thinks of it, sometimes weeks later
- **1** — Supervisors know to report, but timing and format vary
- **2** — A written protocol defines who reports, how, and within what timeframe
- **3** — Written protocol, reporting within 24–48 hours, an incident form, and tracking of every report
- **unknown** — Not sure / someone else owns this

### Open claim review (`clm_open_claim_review`)

How often are open claims and reserves reviewed with your broker or carrier?

- **0** — We do not review open claims
- **1** — Only when the carrier or broker raises something
- **2** — Scheduled reviews at least twice a year
- **3** — Quarterly claim reviews with reserve challenges, adjuster accountability, and pre-renewal loss-run reconciliation
- **unknown** — Not sure / someone else owns this

### Root cause & corrective action (`clm_root_cause`)

After an incident, how are root causes identified and corrective actions tracked?

- **0** — We fix what is obvious and move on
- **1** — Supervisors discuss causes; actions are not tracked
- **2** — Root-cause review for significant incidents with documented corrective actions
- **3** — Every incident gets a root-cause review, corrective actions are tracked to closure, and trends are reported to leadership
- **unknown** — Not sure / someone else owns this

### Signed contracts (`crt_signed_contracts`)

Before work begins with customers, vendors, or subcontractors, how consistently are written contracts in place?

- **0** — Often work starts on a handshake or PO alone
- **1** — Contracts exist for major relationships; smaller ones vary
- **2** — Signed contracts are required before work begins
- **3** — Signed contracts required, with standard indemnity and insurance language reviewed by counsel and tracked centrally
- **unknown** — Not sure / someone else owns this

### Insurance requirements (`crt_insurance_requirements`)

How do you determine what insurance to require from the parties you work with, and what they require from you?

- **0** — We do not set requirements; we accept whatever the other party proposes
- **1** — We use a generic requirement list without reviewing it
- **2** — Requirements are defined by relationship type and reviewed by broker or counsel
- **3** — Requirements are defined, reviewed annually, and cross-checked against our own policies and customer demands
- **unknown** — Not sure / someone else owns this

### Certificate verification (`crt_coi_verification`)

How are certificates of insurance and endorsements (additional insured, waiver of subrogation) verified?

- **0** — We collect certificates when asked but do not review them
- **1** — Someone checks that a certificate exists; endorsements are rarely verified
- **2** — Certificates and required endorsements are verified before work and on expiration
- **3** — Verification is tracked in a system, endorsements are matched to contract terms, and non-compliance is escalated
- **unknown** — Not sure / someone else owns this

### Annual risk review (`emr_annual_review`)

Does leadership conduct a structured risk review outside of the insurance renewal?

- **0** — No formal risk review
- **1** — Risks are discussed informally when something happens
- **2** — An annual risk review with a documented risk list
- **3** — Annual review with owners, action plans, and quarterly progress updates to leadership
- **unknown** — Not sure / someone else owns this

### Regulatory monitoring (`emr_regulatory`)

How are regulatory and compliance changes affecting your operations monitored?

- **0** — We learn about changes when we are notified of a violation or audit
- **1** — Individual managers watch their own areas informally
- **2** — A defined owner monitors regulations and briefs leadership
- **3** — Defined owner, documented compliance calendar, and periodic compliance audits
- **unknown** — Not sure / someone else owns this

### New activity review (`emr_new_activity_review`)

When you add a new location, product, service, technology, or major customer, is risk and insurance impact reviewed beforehand?

- **0** — Not usually; insurance catches up later
- **1** — Sometimes, for very large changes
- **2** — A review step is included in the launch process
- **3** — Documented pre-launch review with operations, finance, broker input, and follow-up after launch
- **unknown** — Not sure / someone else owns this

### Property valuation & building updates (`br_property_valuation`)

For the buildings you own, how are replacement values, business-interruption values, flood exposure, and building updates (roof, sprinklers, electrical) documented?

- **0** — Values are carried forward; we have not documented building updates
- **1** — Values were reviewed a few years ago; updates are partially documented
- **2** — Replacement and BI values are reviewed annually; update history is documented
- **3** — Professional valuation within three years, BI worksheet, flood zone determination, and documented update history with dates
- **unknown** — Not sure / someone else owns this

### Fleet & driver controls (`br_fleet_controls`)

How are drivers screened and vehicles managed (MVRs, telematics, hired and non-owned auto)?

- **0** — We do not run MVRs consistently; personal vehicle use is not addressed
- **1** — MVRs at hire only; no written fleet policy
- **2** — Written fleet policy, annual MVRs, and a defined hired/non-owned auto approach
- **3** — Written policy, annual MVRs with disqualification criteria, telematics or cameras, and driver training records
- **unknown** — Not sure / someone else owns this

### Subcontractor & vendor risk transfer (`br_subcontractor_transfer`)

For subcontractors and vendors, how consistently are indemnity terms, additional-insured status, and waivers of subrogation obtained and enforced?

- **0** — We rely on the vendor's own paperwork
- **1** — Our agreement includes the terms, but we rarely confirm the endorsements
- **2** — Terms are standard and endorsements are confirmed before work
- **3** — Terms are standard, endorsements confirmed, non-compliant vendors are stopped from working, and exceptions are approved in writing
- **unknown** — Not sure / someone else owns this

### Sensitive data handling (`br_data_security`)

For the sensitive customer, employee, or payment data you hold, how are access, vendor security, and incident response managed?

- **0** — Access is broad; we have not reviewed vendor security or an incident plan
- **1** — Access is limited informally; incident response is undocumented
- **2** — Role-based access, vendor security review, and a written incident response plan
- **3** — All of the prior plus annual tabletop exercises, data inventory, and breach-notification readiness
- **unknown** — Not sure / someone else owns this

### Workforce programs (`br_workforce_programs`)

With a workforce of this size, how are workers' compensation return-to-work, employment practices (handbook, training, documentation), and benefits data protection handled?

- **0** — No return-to-work program; handbook is outdated or missing
- **1** — Handbook exists; return-to-work and manager training are informal
- **2** — Written return-to-work program, current handbook, and documented manager training
- **3** — All of the prior plus experience-mod review, claims-trend analysis, and annual employment-practices training
- **unknown** — Not sure / someone else owns this

### Board & investor governance (`br_governance_investors`)

With outside investors or a board, how are directors & officers, fiduciary, and governance-related exposures reviewed?

- **0** — They have not been reviewed
- **1** — Coverage was placed at the time of investment and not revisited
- **2** — Reviewed annually with the broker against bylaws, investor agreements, and benefit plans
- **3** — Annual review plus board reporting on limits, indemnification agreements, and fiduciary controls
- **unknown** — Not sure / someone else owns this

### Regulated materials & environmental (`br_regulated_materials`)

For regulated materials or processes, how are environmental permits, storage practices, and pollution exposure managed?

- **0** — We are not sure what permits apply; storage practices are informal
- **1** — Permits are in place; documentation of storage and disposal is inconsistent
- **2** — Permits, storage, and disposal are documented with a compliance owner
- **3** — Documented compliance program, periodic environmental audits, and pollution exposure reviewed with the broker
- **unknown** — Not sure / someone else owns this

