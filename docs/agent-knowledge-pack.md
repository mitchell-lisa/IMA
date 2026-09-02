# MarketReady Risk Diagnostic — agent knowledge pack

Generated 2026-09-02 from the code. Regenerate with `npm run docs:pack`. Source of truth: `src/lib/diagnostic`.

## 1. Purpose and boundaries

The diagnostic is an educational self-assessment of insurance-program governance and readiness. It is not a coverage opinion, audit, quotation, binder, or recommendation.

An agent grounded in this pack may: summarize structured findings in plain English, draft outreach that references the prospect's own answers, prepare a workshop agenda, and answer questions about how scores are computed.

An agent grounded in this pack must not: interpret policy wording or exclusions, state whether coverage is adequate, recommend limits, deductibles, retentions, carriers, or program structure, assess whether a claim is covered, compare premium to alternatives, or make representations about insurability or savings. Those are licensed-professional tasks.

Required disclaimers:
- Educational self-assessment; not a coverage opinion, audit, quotation, binder, or recommendation. Results are based solely on the answers provided and have not been reviewed against policies, exposures, loss history, or carrier appetite. Any insurance advice must come from a licensed professional after review of your actual program.
- Pricing cannot be assessed from this questionnaire alone. However, incomplete exposure data or a weak underwriting narrative can limit market options, subject to policy, loss, and underwriting review.
- Scores are not percentiles and are not compared against other companies. A comparison dataset will only be published once a defensible sample exists.
- Public records: Public record potentially associated with this facility; verify identity and context before drawing any conclusion.
- Data: We store your answers, the company profile you enter, and the timestamp of your session. We do not store policy documents, loss runs, or exact premium figures. If you enter an email address we store it with your consent choices so we can send your report and, only if you opt in, follow-up communication.

## 2. Categories and industries

- **Program governance** (governance): Who owns the insurance program across the portfolio, when renewal work begins, and how limits and deductibles are decided.
- **Property data & market readiness** (market_readiness): How well the statement of values, acquisitions and dispositions, and building updates are documented and presented to carriers.
- **Operational controls** (operational_controls): Tenant and applicant data, rent and vendor payment controls, and property inspection and life-safety practices.
- **Claims discipline** (claims): How incidents at the properties are reported, open claims are reviewed, and corrective actions are tracked.
- **Contractual risk transfer** (contractual_risk_transfer): Whether leases, vendor agreements, insurance requirements, and certificate verification work as one system.
- **Emerging risk** (emerging_risk): How acquisitions, new property types, regulations, and new exposures like EV charging are reviewed for risk impact.

- **Commercial real estate owner / investor** (cre_owner): Office, industrial and flex, retail, mixed-use, and net-lease portfolios, whether self-managed or with a third-party manager. NAICS 531110, 531120, 531190, 531390. Category weights: Governance 1, Market readiness 1.5, Controls 1, Claims 1, Contracts 1.25, Emerging risk 1. Market note: Property underwriters price commercial portfolios on the quality of the statement of values, construction and protection data, roof and building-system updates, how carrier recommendations were handled, and how lease and vendor requirements transfer risk.
- **Multifamily owner / property manager** (multifamily): Apartment communities, student and workforce housing, and third-party residential management. NAICS 531110, 531311, 531390. Category weights: Governance 1, Market readiness 1.25, Controls 1.5, Claims 1.25, Contracts 1.25, Emerging risk 1. Market note: Multifamily carriers look closely at habitability and life-safety practices, renters insurance enforcement, fair-housing training, vendor certificates for snow and ice and contractors, claim frequency, and how quickly incidents are reported.
- **Other real estate operator** (other): Self-storage, hospitality assets, senior housing, associations, land, or a mixed portfolio. Uses generic weighting. NAICS 531. Category weights: Governance 1, Market readiness 1, Controls 1, Claims 1, Contracts 1, Emerging risk 1. Market note: Carriers evaluate every real estate account on the quality of its property data, the controls at each location, claims history, and the clarity of the story that accompanies the submission.

## 3. Scoring rules

All scoring is deterministic and implemented in `src/lib/diagnostic/scoring.ts`. No AI is involved in any score, band, flag, or finding.

### Answer values

| Value | Meaning |
|---|---|
| 0 | Undocumented / reactive |
| 1 | Partial / inconsistent |
| 2 | Documented |
| 3 | Documented, monitored, and reviewed |
| `unknown` | "Not sure / someone else owns this" |

Every question uses the same four-level ladder so scores are comparable across categories.

### Question weights

Each question carries a weight of 1–3 per industry (`weights` in `src/lib/diagnostic/questions.ts`). Example: renewal lead time is weight 3 in every industry; regulatory monitoring (fair housing, habitability, lead and mold, short-term rental rules) is weight 3 for multifamily and 2 elsewhere.

### Category score

```
earned    = Σ (answer value × weight)          over answered, non-unknown questions
available = Σ (3 × weight)                     over the same questions
category  = earned / available × 100           (rounded to 0.1)
```

`unknown` and unanswered questions are excluded from both numerator and denominator. They reduce confidence; they never imply bad risk. A category with no known answers has a `null` score and is displayed as "Insufficient data".

### Overall score

Weighted mean of category scores using the industry's `categoryWeights` (`src/lib/diagnostic/industries.ts`). Categories with `null` scores are excluded.

| Category | Commercial real estate owner | Multifamily owner / manager | Other |
|---|---|---|---|
| Governance | 1.00 | 1.00 | 1 |
| Data & market readiness | 1.50 | 1.25 | 1 |
| Operational controls | 1.00 | 1.50 | 1 |
| Claims | 1.00 | 1.25 | 1 |
| Contractual risk transfer | 1.25 | 1.25 | 1 |
| Emerging risk | 1.00 | 1.00 | 1 |

### Confidence score

```
confidence = answered known / applicable questions × 100
```

Bands: high ≥ 85, moderate 60–84, low < 60.

### Score bands

| Band | Range | Label |
|---|---|---|
| strong | 75–100 | Stronger documented practices |
| improve | 50–74 | Opportunities to improve consistency |
| priority | 0–49 | Priority areas to investigate |

No percentiles or "below market" labels are displayed. See `NO_BENCHMARK_NOTE`.

### Critical control flags

Questions marked `critical` raise a flag when the answer is at or below the threshold (always 0 in v1), regardless of overall score:

- Renewal lead time inside 30 days
- MFA / tested backups not in place
- Wire and vendor bank changes released on email/phone request
- Incident reporting informal or late
- Certificates collected but not reviewed
- MVRs not run consistently (branch: vehicles)

### Consistency checks

`detectInconsistencies()` compares pairs of answers that should move together (for example, certificates verified but no insurance requirements defined). Notes never change the score; they are surfaced to the prospect as "answers worth reconciling" and to the producer as conversation openers.

### Findings

`src/lib/diagnostic/findings.ts` holds the approved findings library. Each rule has a deterministic trigger, a base priority, and the question ids it derives from. Selection:

1. Evaluate every rule; add a bump for low category score and for a critical flag on the same question.
2. Sort by priority; take at most one finding per category until three are chosen, then fill by priority.
3. If fewer than three rules fire, fall back to a per-category finding naming the weakest practice in any category under 75.

Strengths are the up-to-three categories scoring ≥ 75.

### Renewal timeline

`computeRenewalContext()` measures months until the stated renewal month and compares to a 120-day (4-month) runway: `inside_window` (≤ 4 months), `approaching` (5–6 months), `ample_time` (> 6 months).

### Lead-quality score (sales prioritization, not risk)

| Component | Max | Basis |
|---|---|---|
| Company fit | 25 | Target industry (10), $10M–$250M revenue (10), core territory by ZIP (5) |
| Seniority | 20 | Role of the contact |
| Renewal timing | 20 | 2–6 months out scores full marks |
| Demonstrated pain | 20 | Stated concern, low overall score, critical flags |
| Engagement intent | 10 | Email captured, workshop requested, willing to share documents |
| Data completeness | 5 | Confidence score |

Tiers: A ≥ 70, B ≥ 50, C otherwise.


## 4. Question bank (approved wording)

### Renewal lead time — `gov_renewal_lead_time`
Category: Program governance · Weights (CRE owner/Multifamily/Other): 3/3/3 · Critical flag at ≤0

When does renewal preparation for the portfolio typically begin relative to policy expiration?

_Property markets reward complete, early submissions. A late start means values and building updates never make it into the story carriers see._

- 0: Within 30 days of expiration, or when the broker reaches out
- 1: About 60 days out; we ask brokers to market and follow up 30 days out
- 2: 90+ days out with a written timeline and an updated statement of values
- 3: 120+ days out with a documented calendar, owners, a pre-renewal strategy meeting, and a reconciled statement of values

Critical flag message: Renewal preparation appears to begin inside 30 days of expiration, which limits the ability to update values, document building improvements, and approach alternative markets.

### Program ownership — `gov_internal_owner`
Category: Program governance · Weights (CRE owner/Multifamily/Other): 2/2/2

Who owns the insurance program for the portfolio, and how is that responsibility defined?

_In many real estate organizations this sits between ownership, an asset manager, a controller, and the property manager._

- 0: No single owner; whoever the broker contacts handles it, or the property manager decides
- 1: One person handles it informally alongside other duties
- 2: A named owner with defined responsibilities, including certificates and mid-term changes
- 3: A named owner, a backup, and a defined split of duties with the property manager, asset management, and finance

### Limit and deductible rationale — `gov_limit_rationale`
Category: Program governance · Weights (CRE owner/Multifamily/Other): 2/2/2

How are liability limits, property deductibles, and umbrella limits decided each year?

_This asks about your decision process, not whether the limits are adequate._

- 0: We trust the agent or go with past numbers; limits follow the premium budget
- 1: We have discussed limits with the agent but never worked through examples or lender requirements in detail
- 2: We review limits annually against lender and lease requirements, asset values, and revenue
- 3: A formal annual process considers industry trends, risk tolerance, balance sheet, defensibility, lender covenants, and documents the rationale for each limit and deductible

### Statement of values — `mkt_exposure_data`
Category: Property data & market readiness · Weights (CRE owner/Multifamily/Other): 3/3/3

How is the statement of values (replacement cost, construction and protection details, occupancy, square footage, year built, updates) maintained and validated before submission?

_Replacement cost that is dictated by the insurer, or carried forward, is the most common reason a property submission is discounted._

- 0: We don't analyze replacement cost; the insurer dictates it and values are carried forward
- 1: We reviewed values a few years ago but do not update often and are not confident in the process
- 2: Values and building details are updated annually and checked against recent construction costs
- 3: Values are updated annually, reconciled against rebuilds, appraisals, and recent claims, with construction, protection, and update history documented per building

Variant (multifamily): _Include unit counts, rent roll and business-income values, and any building improvements since the last valuation._

### Portfolio changes — `mkt_business_changes`
Category: Property data & market readiness · Weights (CRE owner/Multifamily/Other): 3/2/2

How are acquisitions, dispositions, renovations, new leases, and occupancy changes communicated to your insurance program during the year?

- 0: They surface at renewal, if at all
- 1: We mention major acquisitions or sales when we remember
- 2: A defined process reports each acquisition, disposition, and major renovation to the broker with values and lender requirements
- 3: Changes are logged, reviewed quarterly for insurance impact, and reflected in schedules and endorsements when they happen

### Your risk profile in the market — `mkt_submission_visibility`
Category: Property data & market readiness · Weights (CRE owner/Multifamily/Other): 2/2/2

Do you know how your story is being told in the marketplace, and do you see what is sent to insurance companies about the portfolio?

_Brokers who never saw your environmental consultant's report, your capital plan, or your maintenance program cannot present them._

- 0: I don't know; we have never seen what brokers present to market
- 1: We submit updated information annually and confirm the broker understands changes to the portfolio
- 2: We review the submission and know which carriers quoted or declined and why
- 3: We collaborate with our broker to determine how best to portray the portfolio, review the full submission and narrative, and receive a market summary with reasons for declinations

### Data security — `ops_cyber_controls`
Category: Operational controls · Weights (CRE owner/Multifamily/Other): 2/3/2 · Critical flag at ≤0

What data do you hold on tenants, applicants, and investors, how is it stored and shared, and how is it protected?

_Applications, background checks, banking details, and investor reporting are all sensitive. Property-management software vendors should be part of the answer._

- 0: No data security program or process; information is stored locally and not encrypted
- 1: Some form of data security, such as limited access, encryption, or occasional employee education
- 2: A formal data security program: MFA, encryption, limited access, regular training, and a written incident plan
- 3: Formal program plus vendor security review of property-management and payment platforms, tested backups, and annual review with the broker

Critical flag message: Tenant, applicant, or investor data appears to be held without a data security program. Cyber carriers treat MFA and encryption as minimum requirements.

### Funds transfer security — `ops_payment_authorization`
Category: Operational controls · Weights (CRE owner/Multifamily/Other): 3/3/3 · Critical flag at ≤0

How is the flow of funds controlled: rent collection, security deposits, vendor payments, wires, and changes to vendor bank details?

- 0: No formal protocols; an email or phone request is usually sufficient
- 1: Some combination of dual authorization and written procedures, applied inconsistently
- 2: Written procedures with callback verification to a known number and dual approval for wires and bank-detail changes
- 3: Formal written program with regular training: dual authorization, calls to verify, destination-detail confirmation, receipt confirmation, and periodic consultation with the bank on best practices

Critical flag message: Wires and vendor bank-detail changes may be released on an email or phone request alone, which is the most common path for social-engineering losses in property operations.

### Inspections, life safety & maintenance — `ops_safety_training`
Category: Operational controls · Weights (CRE owner/Multifamily/Other): 3/3/2

How are property inspections, life-safety systems, lighting, and preventive maintenance documented across the portfolio?

_Documented inspections and maintenance logs are what carriers credit; practices that exist only in the property manager's head do not count._

- 0: Inspections happen when something breaks; little is written down
- 1: Some written procedures; inspection and maintenance records are incomplete or live only with the manager
- 2: Written inspection schedule, life-safety testing records, and a preventive maintenance plan per property
- 3: Written program with documented inspections, life-safety testing, lighting and security logs, preventive maintenance plans, and ownership review of results

Variant (multifamily): How are unit and common-area inspections, life-safety systems (smoke and CO detectors, sprinklers, egress), lighting, and preventive maintenance documented across the communities? _Habitability claims turn on documentation: inspection logs, work-order completion, and life-safety testing records._

Variant (cre_owner): How are roof, sprinkler, electrical, and boiler inspections, life-safety systems, and preventive maintenance documented across the buildings? _Roof age, sprinkler impairments, aluminum wiring, and boiler condition are the recommendations carriers issue most often._

### Claim intake & reporting — `clm_reporting_protocol`
Category: Claims discipline · Weights (CRE owner/Multifamily/Other): 3/3/3 · Critical flag at ≤0

What policies and procedures make sure incidents at the properties (injuries, fires, water losses, tenant claims) are reported and managed properly?

- 0: No policies or protocols; the property manager reports claims directly to the carrier when they think of it
- 1: Supervisors and managers know to report, but timing and format vary; we check in with the broker when we need an update
- 2: A written protocol defines who reports, how, and within what timeframe, with an incident form for every event
- 3: Written protocol, reporting within 24–48 hours, incident forms, and formal meetings with broker and adjusters on a predetermined timeline

Critical flag message: Incidents appear to be reported inconsistently or late. Late reporting is a frequent driver of higher claim costs and coverage disputes, especially on liability claims.

### Claims management & advocacy — `clm_open_claim_review`
Category: Claims discipline · Weights (CRE owner/Multifamily/Other): 2/3/2

How are open claims, reserves, carrier-assigned counsel, and public adjusters managed?

_The workshop asks whether your broker has a systematic process: frequency of updates, claims positioning, policy review, legal guidance, and advocacy._

- 0: We work directly with the carrier and adjuster; we do not focus on the liability claims process or communicate with assigned counsel
- 1: We engage the broker if we are not satisfied; the broker primarily deals with counsel while we monitor open claims
- 2: Scheduled claim reviews at least twice a year with reserve discussion; we consider a public adjuster case by case
- 3: A systematic process: quarterly reviews with reserve challenges, pre-assigned preferred defense counsel where possible, public-adjuster decisions made with the broker against policy wording, and pre-renewal loss-run reconciliation

### Root cause & corrective action — `clm_root_cause`
Category: Claims discipline · Weights (CRE owner/Multifamily/Other): 2/3/2

After an incident at a property, how are root causes identified and corrective actions tracked?

- 0: We fix what is obvious and move on
- 1: The property manager discusses causes; actions are not tracked
- 2: Root-cause review for significant incidents with documented corrective actions and work orders
- 3: Every incident gets a root-cause review, corrective actions are tracked to closure across the portfolio, and trends are reported to ownership

### Vendor & contractor contracts — `crt_signed_contracts`
Category: Contractual risk transfer · Weights (CRE owner/Multifamily/Other): 2/3/2

Tell us about the contracts you use with vendors and contractors at the properties (snow and ice, landscaping, security, renovations). Are master agreements in place with key vendors?

- 0: We don't always get contracts signed; work often starts on a proposal or a call
- 1: An attorney reviews or writes contracts and we make sure they are signed
- 2: Attorney-reviewed contracts plus broker review for insurance and risk-transfer terms; signed before work starts
- 3: Attorney and broker review, signed before work starts, master agreements with key vendors, and payment blocked when contract or insurance terms are missing

### Insurance requirements in leases & contracts — `crt_insurance_requirements`
Category: Contractual risk transfer · Weights (CRE owner/Multifamily/Other): 3/2/2

How are insurance requirements set for tenants in leases and for vendors in contracts, and how are lender and management-agreement requirements on you tracked?

- 0: We do not set requirements; we accept whatever the tenant, vendor, or lender proposes
- 1: We use generic lease and contract language without reviewing it
- 2: Requirements are defined by relationship type (tenant, vendor, contractor) and reviewed by broker or counsel
- 3: Requirements are defined, reviewed annually, cross-checked against our own policies and every lender and management-agreement obligation, and enforced

Variant (cre_owner): _Commercial leases typically require tenant liability and property coverage with the owner as additional insured; lenders require specific limits, mortgagee clauses, and flood where applicable._

Variant (multifamily): _Vendor requirements matter most here: snow and ice, security, and renovation contractors should indemnify and name the owner and manager as additional insureds._

### Certificate tracking — `crt_coi_verification`
Category: Contractual risk transfer · Weights (CRE owner/Multifamily/Other): 3/3/2 · Critical flag at ≤0

What is your process for vetting vendors and contractors who work at the properties, and how are certificates of insurance and endorsements tracked?

- 0: We don't; certificates are collected when asked and not reviewed
- 1: We obtain certificates with additional-insured status and check coverage and limit adequacy, but tracking is manual and infrequent
- 2: Certificates and required endorsements are verified before work and on expiration, in a tracking system
- 3: Software tracks every vendor's insurance in real time, the broker reviews complete policies for key contractors, endorsements are matched to contract terms, and non-compliant vendors are stopped from working

Critical flag message: Vendor certificates of insurance are collected but not reviewed, so the indemnity and additional-insured protection in your contracts may not be operating when a loss occurs.

### Frequent risk assessment — `emr_annual_review`
Category: Emerging risk · Weights (CRE owner/Multifamily/Other): 2/2/2

How often is a thorough risk assessment of the portfolio performed outside of an insurance policy renewal?

_A risk review looks at operations, contracts, properties, and controls, not just the policies being renewed._

- 0: Never, or more than five years ago
- 1: More than 18 months ago, or only when a new agent first came on board
- 2: Annually, with a documented list of risks by property
- 3: Annually with owners and action plans, reviewed with the broker so prevention, mitigation, and insurance stay aligned

### Regulatory & compliance monitoring — `emr_regulatory`
Category: Emerging risk · Weights (CRE owner/Multifamily/Other): 2/3/2

How are regulatory and compliance changes affecting the properties monitored (fair housing, ADA, local habitability and safety ordinances, energy and benchmarking rules)?

- 0: We learn about changes when we are notified of a violation, complaint, or audit
- 1: Individual managers watch their own areas informally
- 2: A defined owner monitors regulations, and required training and postings are documented
- 3: Defined owner, documented compliance calendar, annual training with records, and periodic compliance audits with counsel

Variant (multifamily): _Fair-housing training records, required postings, and consistent screening criteria are the first things asked about in a discrimination claim._

### New exposure review — `emr_new_activity_review`
Category: Emerging risk · Weights (CRE owner/Multifamily/Other): 2/2/2

When you acquire a property, add a new property type, allow short-term rentals, or add EV charging or lithium-battery storage, is the risk and insurance impact reviewed beforehand?

_The workshop found owners who had never heard of the lithium-battery exposure and were about to add car chargers._

- 0: Not usually; insurance catches up later
- 1: Sometimes, for very large acquisitions
- 2: A review step with the broker is part of acquisition due diligence and major operational changes
- 3: Documented pre-acquisition and pre-launch review (environmental due diligence, valuation, lender requirements, new exposures) with follow-up after closing

### Carrier recommendations & building updates — `br_property_valuation`
Category: Property data & market readiness · Branch: ownsBuildings · Weights (CRE owner/Multifamily/Other): 3/3/2

What is your procedure for dealing with insurance company recommendations (sprinklers, wiring, boilers, roofs), and how are building updates and flood exposure documented?

_Carriers issue recommendations after inspections. Owners who track and close them, and show the carrier, negotiate from strength._

- 0: We do as little as possible; updates and flood zones are not documented
- 1: We do the bare minimum to stay compliant with the insurer; updates are partially documented
- 2: An active protocol responds to and tracks recommendations; roof, sprinkler, electrical, and boiler updates are documented with dates
- 3: Active protocol for every recommendation with completion shown to the carrier, documented update history per building, flood zone determinations, and a professional valuation within three years

### Management agreements — `br_management_agreement`
Category: Contractual risk transfer · Branch: usesThirdPartyManager · Weights (CRE owner/Multifamily/Other): 3/3/2 · Critical flag at ≤0

How do your management agreements address insurance and indemnification obligations between you and the third-party property manager?

- 0: We do not review these requirements in agreements with our property managers
- 1: We accept the terms and conditions in the manager's boilerplate agreement
- 2: Counsel reviewed the agreement; we know who insures what and hold the manager's certificate
- 3: We actively review and dictate the insurance and indemnity terms, require adequate limits and coverages from the manager, and regularly request updated certificates to confirm they are in place

Critical flag message: Insurance and indemnification terms in the property-management agreement have not been reviewed, so it is unclear who is covered for a loss at a managed property.

### Snow & ice, security, and site vendors — `br_vendor_transfer`
Category: Operational controls · Branch: usesSubcontractors · Weights (CRE owner/Multifamily/Other): 2/3/2

For snow and ice removal, security patrols, and other on-site vendors, how consistently are procedures documented and risk transferred (logs, cameras, indemnity, additional-insured status)?

- 0: Employees or vendors handle it informally; no logs and contracts have not been reviewed
- 1: Employees are trained or contractors are hired, but snow logs, security procedures, and contract terms are inconsistent
- 2: Every snow removal and patrol is documented, and vendors indemnify and name us as additional insured
- 3: Documented logs visible on cameras, written security and snow procedures, contracts reviewed for indemnity and additional-insured terms, and vendor insurance tracked in a compliance system

### Leasing, renters insurance & fair housing — `br_residential_programs`
Category: Operational controls · Branch: hasResidentialTenants · Weights (CRE owner/Multifamily/Other): 1/3/2

For residential tenants, how are leasing and screening, renters-insurance verification, anti-discrimination training, and short-term-rental monitoring handled?

- 0: No formal process; renters insurance is not tracked and fair-housing training is informal
- 1: Application with employment verification and some screening; renters insurance tracked manually and updated infrequently; handbook statement only
- 2: Attorney-vetted application and lease, background checks, renters insurance required and tracked, annual fair-housing training, lease prohibits short-term rentals
- 3: All of the prior plus software that monitors renters insurance in real time and force-places when missing, documented annual training with counsel consultation, and active monitoring for short-term rental use

### Workforce programs — `br_workforce_programs`
Category: Operational controls · Branch: employeesAboveThreshold · Weights (CRE owner/Multifamily/Other): 2/3/2

With on-site and corporate staff of this size, how are workers' compensation return-to-work, employment practices (handbook, training, documentation), and manager training handled?

- 0: No return-to-work program; handbook is outdated or missing
- 1: Handbook exists; return-to-work and manager training are informal
- 2: Written return-to-work program, current handbook, and documented manager training
- 3: All of the prior plus experience-mod review, claims-trend analysis, and annual employment-practices training with records

### Investors, funds & lenders — `br_governance_investors`
Category: Program governance · Branch: hasOutsideInvestors · Weights (CRE owner/Multifamily/Other): 3/2/2

With outside investors, funds, or lenders, how are investor reporting, fund and entity E&O and D&O exposures, and lender insurance requirements managed?

- 0: Updates are provided on demand; entity coverages and lender requirements have not been reviewed
- 1: Annual performance updates; coverage was placed at the time of the raise and not revisited
- 2: Quarterly reporting on performance and key metrics; E&O and D&O reviewed annually with the broker against fund documents; lender requirements tracked
- 3: Quarterly reporting with online access, annual review of entity coverages, every legal entity confirmed as a named insured, and lender requirements reconciled at each closing

### Environmental risks — `br_environmental`
Category: Emerging risk · Branch: environmentalExposures · Weights (CRE owner/Multifamily/Other): 3/3/2

What are your practices for environmental risks at the properties (lead, mold, asbestos, oil tanks, legionella, soil contamination), including due diligence on acquisitions?

- 0: I don't know; we have not looked at it
- 1: We depend on what we read and hear from industry groups; we may purchase environmental insurance
- 2: An environmental specialist has reviewed the portfolio and surveys; environmental due diligence is part of acquisitions
- 3: Specialist reviews the portfolio routinely, moisture and mold procedures are written, lender environmental conditions are tracked, and environmental insurance is reviewed with the broker


## 5. Findings library (approved language)

Each finding is triggered deterministically by the answers listed. Use the wording as written; do not add benchmarks or statistics.

### Your renewal process may begin too late to fully document the portfolio.
Id `renewal_starts_late` · Category Program governance · Base priority 90 · Based on: gov_renewal_lead_time, mkt_submission_visibility

Renewal preparation appears to begin with limited runway. Updated values, building improvements, and closed carrier recommendations that are not documented in time rarely make it into the submission carriers evaluate.

Benchmark indication: strengths were identified elsewhere in your answers, but they may not be incorporated consistently into what carriers see.

### Your leases, vendor contracts, and certificate tracking may not be operating as one control system.
Id `contracts_not_one_system` · Category Contractual risk transfer · Base priority 85 · Based on: crt_signed_contracts, crt_insurance_requirements, crt_coi_verification

Answers about signed vendor contracts, insurance requirements, and certificate verification are uneven. Risk transfer only works when the requirement, the contract, and the certificate line up.

Potential opportunity: review whether lease and contract requirements, certificates of insurance, and endorsements align for your largest tenants and your snow, security, and renovation vendors.

### Your portfolio has changed faster than your insurance-governance process.
Id `business_outpaced_governance` · Category Property data & market readiness · Base priority 88 · Based on: mkt_business_changes, emr_new_activity_review

You reported recent acquisitions, dispositions, or major renovations, but portfolio changes reach the insurance program late or inconsistently.

Areas to investigate: newly acquired properties, updated replacement values, lender requirements at each closing, and whether renovations are reflected in schedules.

### Your claims process appears reactive rather than managed to a defined cadence.
Id `claims_reactive` · Category Claims discipline · Base priority 84 · Based on: clm_reporting_protocol, clm_open_claim_review, clm_root_cause

Incident reporting, open-claim review, or corrective-action tracking appear informal, and there is no systematic broker process for advocacy, counsel, or public adjusters.

Potential opportunity: evaluate reporting timelines, reserve review, carrier-assigned counsel, public-adjuster decisions, and how corrective actions are tracked across properties.

### A statement of values that carriers do not trust, or a story they never hear, could limit your market options.
Id `exposure_data_limits_markets` · Category Property data & market readiness · Base priority 82 · Based on: mkt_exposure_data, mkt_submission_visibility

Replacement costs appear to be dictated by the insurer or carried forward, or you have limited visibility into what carriers receive about the portfolio.

Pricing cannot be assessed from this questionnaire alone. However, carriers generally offer their best terms to portfolios that present validated values, documented building updates, and a clear narrative, subject to policy, loss, and underwriting review.

### Funds-transfer controls may leave a path open for social-engineering losses.
Id `social_engineering_path` · Category Operational controls · Base priority 86 · Based on: ops_payment_authorization

Wires, vendor bank-detail changes, or security-deposit returns may be released without callback verification and dual approval. This is the most common route for funds-transfer fraud in property operations.

Potential opportunity: confirm callback procedures, approval thresholds, controls at the property-management company, and whether crime or cyber coverage includes social-engineering terms, subject to policy review.

### Protection of tenant, applicant, and investor data may not meet the minimums cyber carriers now require.
Id `cyber_minimums` · Category Operational controls · Base priority 83 · Based on: ops_cyber_controls

Multi-factor authentication, encryption, tested backups, and a written incident plan are the controls cyber underwriters ask about first, along with the security of your property-management platform.

Potential opportunity: document current controls, review the property-management and payment vendors' security, and confirm which controls are attested on existing applications.

### Insurance program ownership appears informal or split with the property manager.
Id `no_program_owner` · Category Program governance · Base priority 70 · Based on: gov_internal_owner

Without a named owner and a defined split of duties, certificate requests, mid-term acquisitions, and lender requirements tend to fall through the cracks.

Potential opportunity: assign an owner and backup, and define who handles certificates, closings, and claims between ownership and the manager.

### Limits and deductibles appear to follow the budget rather than a documented rationale.
Id `limits_not_reasoned` · Category Program governance · Base priority 68 · Based on: gov_limit_rationale

This diagnostic does not assess whether limits are adequate. It does note that limits which are never revisited may not track lender covenants, lease requirements, or portfolio growth.

Potential opportunity: document the basis for each limit and deductible with a licensed advisor, including key liability cases and lender requirements, and revisit it as the portfolio changes.

### Inspection, life-safety, and maintenance practices may exist but are not documented in a form underwriters can credit.
Id `safety_undocumented` · Category Operational controls · Base priority 72 · Based on: ops_safety_training

Inspection schedules, life-safety testing records, lighting logs, and preventive maintenance plans are what carriers use to distinguish a well-run portfolio from an average one.

Potential opportunity: assemble an inspection and maintenance documentation package per property before the next submission.

### Carrier recommendations and building updates may not be tracked or shown to the market.
Id `property_values_stale` · Category Property data & market readiness · Base priority 80 · Based on: br_property_valuation

How you respond to sprinkler, wiring, boiler, and roof recommendations, and whether updates and flood exposure are documented, drives both coverage terms and pricing conversations.

Areas to investigate: open recommendations by property, completion evidence, roof and system update dates, flood zone determinations, and the date of the last professional valuation.

### The insurance and indemnity terms in your property-management agreement may not have been reviewed.
Id `management_agreement_gap` · Category Contractual risk transfer · Base priority 79 · Based on: br_management_agreement

Boilerplate management agreements often leave it unclear who insures what and who indemnifies whom when a loss occurs at a managed property.

Potential opportunity: have counsel and the broker review the agreement, dictate required limits and coverages, and hold current certificates from the manager.

### Snow and ice, security, and site-vendor procedures may not be documented or transferring risk.
Id `site_vendor_gap` · Category Operational controls · Base priority 77 · Based on: br_vendor_transfer

Slip-and-fall and premises claims turn on logs, cameras, and whether the vendor's contract indemnifies and insures you.

Potential opportunity: require documented snow logs and patrol procedures, and confirm indemnity and additional-insured terms for every site vendor.

### Leasing, renters-insurance, and fair-housing practices may be informal for the size of the residential portfolio.
Id `residential_programs_gap` · Category Operational controls · Base priority 78 · Based on: br_residential_programs

Renters insurance that is not tracked, screening that is not consistent, and training that is not documented all show up in liability and discrimination claims.

Potential opportunity: evaluate real-time renters-insurance monitoring, attorney-vetted lease and screening criteria, and documented annual fair-housing training.

### Workforce programs (return-to-work, handbook, manager training) may be informal for a staff of your size.
Id `workforce_programs_gap` · Category Operational controls · Base priority 71 · Based on: br_workforce_programs

These programs influence workers' compensation experience and employment-practices exposure across on-site teams.

Potential opportunity: document return-to-work procedures and update the employee handbook.

### Investor, fund, and lender-related exposures may not have been reviewed since the last capital event.
Id `investor_governance_gap` · Category Program governance · Base priority 74 · Based on: br_governance_investors

Fund and entity E&O and D&O, named-insured completeness across every LLC, and lender requirements are typically revisited as deals close and boards change.

Potential opportunity: review entity coverages with a licensed advisor against fund documents and confirm every legal entity is scheduled as a named insured.

### Environmental exposures at the properties may not have been reviewed.
Id `environmental_gap` · Category Emerging risk · Base priority 76 · Based on: br_environmental

Lead, mold, asbestos, oil tanks, legionella, and soil conditions are the starting point for any environmental conversation with carriers and lenders.

Areas to investigate: environmental surveys on file, acquisition due diligence, moisture and mold procedures, lender environmental conditions, and whether pollution exposure has been reviewed.

### Acquisitions, regulatory changes, and new exposures may reach the insurance program after the fact.
Id `emerging_risk_unmanaged` · Category Emerging risk · Base priority 65 · Based on: emr_new_activity_review, emr_regulatory, emr_annual_review

Without a pre-acquisition and pre-launch review step, new properties, short-term rentals, EV charging, and lithium-battery storage can create exposures that are not reflected until the next renewal.

Potential opportunity: add a risk and insurance checkpoint to acquisition due diligence and to operational changes at the properties.

## 6. Workshop methodology

How the digital diagnostic relates to IMA's in-person Risk Workshop, based on the example workshop workbook and the Golf & Country Club workshop deck.

### What the workshop does

- Scores each practice on a **three-level maturity scale** (1 = reactive, 2 = partial, 3 = systematic), with half-points used in practice. Category averages are shown on a pie chart labeled Excellent / Opportunity for Improvement / Area of Concern.
- Records interview notes from several IMA participants per practice, plus "items to request / future questions to ask".
- Covers six categories: **Insurance, Operational Risk, Maintenance, Claims, Evolving Risk, Contractual Risk Transfer**.
- Produces a findings presentation and a **month-by-month service plan** (broker-of-record letters, contractual risk transfer program, cyber review, claims contact, pre-renewal meetings, marketplace negotiations, policy checking, quarterly stewardship).
- The deck frames it as a seven-step path: introductory conversation → stakeholder alignment → risk workshop → program review → story development → findings and opportunities → next-step decision, with "no obligation to proceed".

### How the diagnostic maps

The mapping is question-level, following the plan's dimension table ("what is evaluated"). A question can inform more than one dimension.

| Workshop dimension | What the workshop evaluates | Diagnostic questions that inform it | Reserved for the workshop (licensed review) |
|---|---|---|---|
| Insurance-program design | Replacement-cost methodology, carrier-submission quality, named-insured completeness, policy exclusions, liability-limit rationale, underwriting narrative | Renewal lead time, program owner, limit rationale, exposure data, business changes, submission visibility, owned-property valuation (branch) | Replacement-cost methodology, policy exclusions, named-insured completeness, limit adequacy |
| Operational controls | Information security, wire-transfer procedures, technology systems, training, leasing/customer processes, third-party oversight | Cyber controls, payment & wire controls, safety & training, sensitive data (branch), fleet (branch), workforce programs (branch) | Technology systems, third-party oversight, customer-facing processes, EPLI detail |
| Property/maintenance | Carrier recommendations, documented inspections, snow and ice, security, emerging equipment exposures | Owned-property valuation & carrier recommendations (branch), safety & training (documented inspections) | Recommendation history, security, snow and ice, emerging equipment exposures |
| Claims | Intake protocols, reporting, adjuster management, counsel strategy, broker advocacy, public-adjuster use | Incident reporting, open-claim review, root cause | Loss runs and reserves, assigned counsel, public adjusters, uncovered claims |
| Emerging risk | Cyber/privacy, environmental issues, regulatory developments, frequency of formal risk assessments | Annual risk review, regulatory monitoring, new-activity review, cyber controls, regulated materials (branch) | Environmental exposures, lender conditions, cyber coverage alignment |
| Contractual risk transfer | Signed contracts, indemnification, additional-insured requirements, COIs, vendor and management agreements | Signed contracts, insurance requirements, certificate verification, subcontractor transfer (branch) | Review of actual contracts, certificates, endorsements; management/landlord/lender agreements |

Each dimension's score is the weighted maturity (0–100) over the mapped questions that were applicable and answered, with the answered/applicable count shown beside it. The Producer Brief renders this so the producer can pre-fill expectations before the session and focus the workshop on the reserved items.

### Scale differences, on purpose

The diagnostic uses a four-level 0–3 ladder (undocumented / partial / documented / documented-monitored-reviewed) rather than the workshop's 1–3. The extra level separates "documented" from "documented and reviewed", which is the distinction underwriters credit. Scores are shown as 0–100 per category, never as the workshop's 1–3 averages, so nobody mistakes a self-assessment for a workshop result.

### Industry adaptation ("dynamic modules")

Question wording adapts by industry without changing scoring:

| Industry | Adapted questions |
|---|---|
| Commercial real estate owner | Exposure data (statement of values, roof and sprinkler ages, tenant improvements, rental income for BI), property programs (roof, sprinkler, electrical, boiler inspections), insurance requirements (lease insurance clauses, lender requirements, vendor certificates), regulatory monitoring (fire code, ADA, environmental) |
| Multifamily owner / manager | Exposure data (unit counts, occupancy, renters insurance participation), property programs (unit and common-area inspections, smoke and CO detectors, pools, playgrounds), insurance requirements (lease and renters insurance clauses, vendor certificates), regulatory monitoring (fair housing, habitability, lead and mold, short-term rental rules) |

### Workshop language carried into the diagnostic

- Funds-transfer ladder mirrors the workshop's "formal written program with dual authentication, calls to verify, destination details and receipt confirmation".
- Submission-visibility ladder mirrors "we collaborate with our broker to determine how best to portray our company in the marketplace".
- Risk-review ladder mirrors "more than 18 months ago, or my agent did it when they first started".
- Owned-buildings ladder includes the workshop's carrier-recommendation practice ("active protocol for responding to, complying with and tracking all recommendations").
- The deck's dialogue starters (who decides, one broker or several, what could be better, proactive year-round or only at renewal) are included as opening questions in every brief.


## 7. Producer Brief structure

1. Account snapshot · 2. Why this lead matters · 3. Top three potential opportunities · 4. Stated pain points · 5. Business-change signals · 6. Renewal and incumbent context · 7. Recommended opening questions · 8. Suggested specialist participants · 9. Proposed 45-minute workshop agenda (+ seven-step workshop path, service-plan themes) · 10. Lead quality score (sales prioritization only) · Workshop crosswalk · Diagnostic scores · Summary.

Lead quality weights: company fit 25, seniority 20, renewal timing 20, demonstrated pain 20, engagement intent 10, data completeness 5. Tiers: A ≥ 70, B ≥ 50, C otherwise.

## 8. Standard prompts used at runtime (for Prompt Coach review)

**Brief summary prompt** (src/lib/server/ai.ts):

```
You write short internal summaries for a commercial insurance producer at a brokerage.
You receive structured findings from a deterministic self-assessment that a prospect completed online.
Write 3 to 5 plain-English sentences a producer can read in 20 seconds before a call.

Rules you must follow:
- Use only the facts in the structured input. Do not add benchmarks, percentiles, statistics, or industry claims.
- Do not compute or restate numeric scores beyond what is given.
- Do not interpret policy wording, assess coverage adequacy, recommend limits or carriers, or estimate premium or savings.
- Describe what the answers suggest and what is worth confirming in a conversation.
- No headings, no bullet points, no preamble. Plain sentences only.
```

**Website summary prompt** (src/lib/server/enrichment/providers/website.ts):

```
You summarize a company's public website for an insurance producer preparing for a first conversation.
Report only what the page states: locations, services or products, customers or industries served, acquisitions, hiring, new facilities, certifications.
Write 2 to 4 plain sentences. No speculation, no risk judgments, no coverage or pricing commentary. If the page says little, say so in one sentence.
```

Both prompts receive structured or public input only, are limited to a few sentences, and never see policy documents.
