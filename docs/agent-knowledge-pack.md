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

- **Program governance** (governance): Who owns the insurance program, when renewal work begins, and how limits are decided.
- **Data & market readiness** (market_readiness): How well exposure data and business changes are documented and presented to carriers.
- **Operational controls** (operational_controls): Cyber, payment authorization, safety, and training practices that underwriters ask about.
- **Claims discipline** (claims): How incidents are reported, open claims are reviewed, and root causes are tracked.
- **Contractual risk transfer** (contractual_risk_transfer): Whether contracts, insurance requirements, and certificate verification work as one system.
- **Emerging risk** (emerging_risk): How new locations, products, technology, and regulations are reviewed for risk impact.

- **3PL, warehousing & distribution** (logistics_3pl): Third-party logistics, public and contract warehousing, cold chain, fulfillment, and regional distribution. NAICS 493110, 493120, 484110, 484121, 488510. Category weights: Governance 1, Market readiness 1.25, Controls 1.25, Claims 1.25, Contracts 1.5, Emerging risk 0.75. Market note: Carriers evaluating warehousing and 3PL accounts look closely at warehouse legal liability, cargo and customer contracts, fleet controls, fire protection, and how consistently incidents are reported.
- **Light manufacturing** (light_manufacturing): Fabrication, assembly, food and beverage, plastics, packaging, electronics, and other light industrial operations. NAICS 332, 333, 335, 311, 326, 339. Category weights: Governance 1, Market readiness 1.25, Controls 1.5, Claims 1.25, Contracts 1, Emerging risk 1. Market note: Underwriters reviewing manufacturers focus on product liability and recall exposure, machine guarding and workers' compensation history, property valuation, business interruption, and supplier and customer contract terms.
- **Other middle-market business** (other): Any other commercial operation. Uses generic weighting. NAICS n/a. Category weights: Governance 1, Market readiness 1, Controls 1, Claims 1, Contracts 1, Emerging risk 1. Market note: Carriers evaluate every account on the quality of its exposure data, controls, claims history, and the clarity of the story that accompanies the submission.

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

Each question carries a weight of 1–3 per industry (`weights` in `src/lib/diagnostic/questions.ts`). Example: renewal lead time is weight 3 in every industry; regulatory monitoring is weight 3 for manufacturing and 2 elsewhere.

### Category score

```
earned    = Σ (answer value × weight)          over answered, non-unknown questions
available = Σ (3 × weight)                     over the same questions
category  = earned / available × 100           (rounded to 0.1)
```

`unknown` and unanswered questions are excluded from both numerator and denominator. They reduce confidence; they never imply bad risk. A category with no known answers has a `null` score and is displayed as "Insufficient data".

### Overall score

Weighted mean of category scores using the industry's `categoryWeights` (`src/lib/diagnostic/industries.ts`). Categories with `null` scores are excluded.

| Category | 3PL / Warehousing | Light manufacturing | Other |
|---|---|---|---|
| Governance | 1.00 | 1.00 | 1 |
| Data & market readiness | 1.25 | 1.25 | 1 |
| Operational controls | 1.25 | 1.50 | 1 |
| Claims | 1.25 | 1.25 | 1 |
| Contractual risk transfer | 1.50 | 1.00 | 1 |
| Emerging risk | 0.75 | 1.00 | 1 |

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
Category: Program governance · Weights (3PL/Mfg/Other): 3/3/3 · Critical flag at ≤0

When does renewal preparation typically begin relative to your policy expiration?

_Carriers reward complete submissions delivered early. Late starts compress negotiation time._

- 0: Within 30 days of expiration, or when the broker reaches out
- 1: About 60 days out, but it varies year to year
- 2: 90+ days out with a written timeline
- 3: 120+ days out with a documented calendar, owners, and a pre-renewal strategy meeting

Critical flag message: Renewal preparation appears to begin inside 30 days of expiration, which limits the ability to document controls and approach alternative markets.

### Program ownership — `gov_internal_owner`
Category: Program governance · Weights (3PL/Mfg/Other): 2/2/2

Who owns the insurance program internally, and how is that responsibility defined?

- 0: No single owner; whoever the broker contacts handles it
- 1: One person handles it informally alongside other duties
- 2: A named owner with defined responsibilities
- 3: A named owner, a backup, and a cross-functional review (finance, operations, HR/safety)

### Limit rationale — `gov_limit_rationale`
Category: Program governance · Weights (3PL/Mfg/Other): 2/2/2

How are policy limits and deductibles decided each year?

_This question asks about your decision process, not whether the limits are adequate._

- 0: We renew the same limits without discussion
- 1: The broker recommends and we generally accept
- 2: We review limits against contracts, assets, and revenue annually
- 3: We document the rationale for each limit and deductible and revisit it when the business changes

### Exposure data — `mkt_exposure_data`
Category: Data & market readiness · Weights (3PL/Mfg/Other): 3/3/3

How are exposure values (payroll, revenue, property values, vehicle schedules, inventory) validated before submission?

- 0: We use last year's numbers unless someone flags a change
- 1: We update the big items but rarely reconcile schedules
- 2: Finance validates values annually against records
- 3: Values are reconciled against financials, fixed-asset registers, and schedules, with sign-off before submission

Variant (logistics_3pl): _For a 3PL this includes the value of customers' goods in your care, custody, and control, vehicle and trailer schedules, and square footage by location._

Variant (light_manufacturing): _For a manufacturer this includes machinery and equipment values, a business-interruption worksheet, and any dependence on a single supplier or customer._

### Business change documentation — `mkt_business_changes`
Category: Data & market readiness · Weights (3PL/Mfg/Other): 3/2/2

How are operational changes (new services, locations, equipment, customers, headcount) communicated to your insurance program during the year?

- 0: They surface at renewal, if at all
- 1: We mention major changes when we remember
- 2: A defined process captures changes and shares them with the broker
- 3: Changes are logged, reviewed quarterly for insurance impact, and reflected in mid-term endorsements when needed

### Submission visibility — `mkt_submission_visibility`
Category: Data & market readiness · Weights (3PL/Mfg/Other): 2/2/2

How much visibility do you have into what is actually sent to carriers about your company?

_The underwriting story is the narrative and evidence that accompanies applications and loss runs._

- 0: None; we sign applications and the broker handles the rest
- 1: We submit updated information annually but have not seen how our story is told to carriers
- 2: We review the submission and know which carriers quoted or declined
- 3: We collaborate with our broker on how best to portray the company in the marketplace, review the full submission, and receive a market summary with reasons for declinations

### Cyber controls — `ops_cyber_controls`
Category: Operational controls · Weights (3PL/Mfg/Other): 3/2/2 · Critical flag at ≤0

Which of the following best describes your cyber controls (MFA, backups, endpoint protection, incident response)?

- 0: Basic antivirus; MFA and tested backups are not consistently in place
- 1: MFA on email; backups exist but are not tested regularly
- 2: MFA on email and remote access, tested offline backups, endpoint detection, and a written incident plan
- 3: All of the prior plus annual testing, vendor security review, and executive reporting

Critical flag message: Multi-factor authentication and tested backups do not appear to be consistently in place. Most cyber carriers now treat these as minimum requirements.

### Payment & wire controls — `ops_payment_authorization`
Category: Operational controls · Weights (3PL/Mfg/Other): 3/3/3 · Critical flag at ≤0

How are changes to vendor bank details and outgoing wire requests verified?

- 0: No formal protocol; an email or phone request is usually sufficient
- 1: Some combination of dual authorization and written procedures, applied inconsistently
- 2: Written procedure with callback verification to a known number and dual approval for all bank changes and wires
- 3: Formal written program with regular training: dual authorization, callback verification, destination confirmation, and receipt confirmation

Critical flag message: Vendor bank-detail changes and wires may be released on an email or phone request alone, which is the most common path for social-engineering losses.

### Safety & training — `ops_safety_training`
Category: Operational controls · Weights (3PL/Mfg/Other): 3/3/2

How are safety programs, training, and inspections documented?

- 0: Training happens on the job; little is written down
- 1: Some written procedures; training records are incomplete
- 2: Written safety program, documented training, and periodic inspections
- 3: Written program with documented training, inspections, near-miss reporting, and management review of results

Variant (logistics_3pl): How are warehouse and dock safety (forklift certification, racking, housekeeping), fire protection (sprinkler inspections, impairment procedures, commodity storage), and driver training documented? _Warehouse underwriters look first at fire protection and forklift and dock injury controls._

Variant (light_manufacturing): How are machine guarding, lockout/tagout, hearing and respiratory protection, and safety training documented? _Machine guarding and lockout/tagout drive both workers' compensation experience and product-safety credibility with underwriters._

### Incident reporting — `clm_reporting_protocol`
Category: Claims discipline · Weights (3PL/Mfg/Other): 3/3/3 · Critical flag at ≤0

What happens when an incident or potential claim occurs?

- 0: It is reported when someone thinks of it, sometimes weeks later
- 1: Supervisors know to report, but timing and format vary
- 2: A written protocol defines who reports, how, and within what timeframe
- 3: Written protocol, reporting within 24–48 hours, an incident form, and tracking of every report

Critical flag message: Incidents appear to be reported inconsistently or late. Late reporting is a frequent driver of higher claim costs and coverage disputes.

### Open claim review — `clm_open_claim_review`
Category: Claims discipline · Weights (3PL/Mfg/Other): 2/3/2

How often are open claims and reserves reviewed with your broker or carrier?

- 0: We do not review open claims
- 1: Only when the carrier or broker raises something
- 2: Scheduled reviews at least twice a year
- 3: Quarterly claim reviews with reserve challenges, adjuster accountability, and pre-renewal loss-run reconciliation

### Root cause & corrective action — `clm_root_cause`
Category: Claims discipline · Weights (3PL/Mfg/Other): 2/3/2

After an incident, how are root causes identified and corrective actions tracked?

- 0: We fix what is obvious and move on
- 1: Supervisors discuss causes; actions are not tracked
- 2: Root-cause review for significant incidents with documented corrective actions
- 3: Every incident gets a root-cause review, corrective actions are tracked to closure, and trends are reported to leadership

### Signed contracts — `crt_signed_contracts`
Category: Contractual risk transfer · Weights (3PL/Mfg/Other): 3/2/2

Before work begins with customers, vendors, or subcontractors, how consistently are written contracts in place?

- 0: Often work starts on a handshake or PO alone
- 1: Contracts exist for major relationships; smaller ones vary
- 2: Signed contracts are required before work begins
- 3: Signed contracts required, with standard indemnity and insurance language reviewed by counsel and tracked centrally

Variant (logistics_3pl): Before goods are received or work begins, how consistently are written warehousing agreements, customer contracts, and carrier/vendor agreements in place? _Warehouse receipts and customer contracts define your legal liability for goods in your care. Unsigned or inconsistent terms are a common gap._

Variant (light_manufacturing): How consistently are written supply agreements, customer purchase terms, and vendor contracts in place before production or shipment begins? _Customer terms often carry product warranty, recall, and indemnity obligations that shape your liability program._

### Insurance requirements — `crt_insurance_requirements`
Category: Contractual risk transfer · Weights (3PL/Mfg/Other): 3/2/2

How do you determine what insurance to require from the parties you work with, and what they require from you?

- 0: We do not set requirements; we accept whatever the other party proposes
- 1: We use a generic requirement list without reviewing it
- 2: Requirements are defined by relationship type and reviewed by broker or counsel
- 3: Requirements are defined, reviewed annually, and cross-checked against our own policies and customer demands

Variant (logistics_3pl): _Customers commonly require warehouse legal liability, cargo, and auto limits. Carriers and subcontracted haulers should be held to defined requirements in return._

Variant (light_manufacturing): _Large customers often specify product liability limits and vendor endorsements; suppliers should be held to defined requirements for the components they provide._

### Certificate verification — `crt_coi_verification`
Category: Contractual risk transfer · Weights (3PL/Mfg/Other): 3/2/2 · Critical flag at ≤0

How are certificates of insurance and endorsements (additional insured, waiver of subrogation) verified?

- 0: We collect certificates when asked but do not review them
- 1: Someone checks that a certificate exists; endorsements are rarely verified
- 2: Certificates and required endorsements are verified before work and on expiration
- 3: Verification is tracked in a system, endorsements are matched to contract terms, and non-compliance is escalated

Critical flag message: Certificates of insurance are collected but not reviewed, so contractual risk transfer may not be operating when a loss occurs.

### Annual risk review — `emr_annual_review`
Category: Emerging risk · Weights (3PL/Mfg/Other): 2/2/2

Does leadership conduct a structured risk review outside of the insurance renewal?

_A risk review looks at operations, contracts, and controls, not just the policies being renewed._

- 0: Never, or more than five years ago
- 1: More than 18 months ago, or only when a new broker or agent first came on board
- 2: An annual risk review with a documented risk list
- 3: Annual review with owners, action plans, and quarterly progress updates to leadership

### Regulatory monitoring — `emr_regulatory`
Category: Emerging risk · Weights (3PL/Mfg/Other): 2/3/2

How are regulatory and compliance changes affecting your operations monitored?

- 0: We learn about changes when we are notified of a violation or audit
- 1: Individual managers watch their own areas informally
- 2: A defined owner monitors regulations and briefs leadership
- 3: Defined owner, documented compliance calendar, and periodic compliance audits

### New activity review — `emr_new_activity_review`
Category: Emerging risk · Weights (3PL/Mfg/Other): 2/2/2

When you add a new location, product, service, technology, or major customer, is risk and insurance impact reviewed beforehand?

- 0: Not usually; insurance catches up later
- 1: Sometimes, for very large changes
- 2: A review step is included in the launch process
- 3: Documented pre-launch review with operations, finance, broker input, and follow-up after launch

Variant (logistics_3pl): When you take on a new commodity, temperature-controlled or hazardous storage, a new customer contract, or a new facility, is risk and insurance impact reviewed beforehand?

Variant (light_manufacturing): When you launch a new product, add a production line or process, or enter a new market, is product liability, recall, and business-interruption impact reviewed beforehand?

### Property valuation & building updates — `br_property_valuation`
Category: Data & market readiness · Branch: ownsBuildings · Weights (3PL/Mfg/Other): 3/3/2

For the buildings you own, how are replacement values, business-interruption values, flood exposure, building updates (roof, sprinklers, electrical), and carrier loss-control recommendations documented and tracked?

_Carriers issue recommendations after inspections. How you respond to them is part of the underwriting story._

- 0: Values are carried forward; building updates and carrier recommendations are not tracked
- 1: Values were reviewed a few years ago; we do the minimum needed to stay compliant with carrier recommendations
- 2: Replacement and BI values are reviewed annually; update history and recommendation responses are documented
- 3: Professional valuation within three years, BI worksheet, flood zone determination, documented inspections and update history, and an active protocol for responding to and tracking every carrier recommendation

### Fleet & driver controls — `br_fleet_controls`
Category: Operational controls · Branch: hasVehicles · Weights (3PL/Mfg/Other): 3/2/2 · Critical flag at ≤0

How are drivers screened and vehicles managed (MVRs, telematics, hired and non-owned auto)?

- 0: We do not run MVRs consistently; personal vehicle use is not addressed
- 1: MVRs at hire only; no written fleet policy
- 2: Written fleet policy, annual MVRs, and a defined hired/non-owned auto approach
- 3: Written policy, annual MVRs with disqualification criteria, telematics or cameras, and driver training records

Critical flag message: Motor vehicle records do not appear to be run consistently, which commercial auto underwriters treat as a primary control.

### Subcontractor & vendor risk transfer — `br_subcontractor_transfer`
Category: Contractual risk transfer · Branch: usesSubcontractors · Weights (3PL/Mfg/Other): 3/2/2

For subcontractors and vendors, how consistently are indemnity terms, additional-insured status, and waivers of subrogation obtained and enforced?

- 0: We rely on the vendor's own paperwork
- 1: Our agreement includes the terms, but we rarely confirm the endorsements
- 2: Terms are standard and endorsements are confirmed before work
- 3: Terms are standard, endorsements confirmed, non-compliant vendors are stopped from working, and exceptions are approved in writing

### Sensitive data handling — `br_data_security`
Category: Operational controls · Branch: storesSensitiveData · Weights (3PL/Mfg/Other): 2/2/2

For the sensitive customer, employee, or payment data you hold, how are access, vendor security, and incident response managed?

- 0: Access is broad; we have not reviewed vendor security or an incident plan
- 1: Access is limited informally; incident response is undocumented
- 2: Role-based access, vendor security review, and a written incident response plan
- 3: All of the prior plus annual tabletop exercises, data inventory, and breach-notification readiness

### Workforce programs — `br_workforce_programs`
Category: Operational controls · Branch: employeesAboveThreshold · Weights (3PL/Mfg/Other): 3/3/2

With a workforce of this size, how are workers' compensation return-to-work, employment practices (handbook, training, documentation), and benefits data protection handled?

- 0: No return-to-work program; handbook is outdated or missing
- 1: Handbook exists; return-to-work and manager training are informal
- 2: Written return-to-work program, current handbook, and documented manager training
- 3: All of the prior plus experience-mod review, claims-trend analysis, and annual employment-practices training

### Board & investor governance — `br_governance_investors`
Category: Program governance · Branch: hasOutsideInvestors · Weights (3PL/Mfg/Other): 2/2/2

With outside investors or a board, how are directors & officers, fiduciary, and governance-related exposures reviewed?

- 0: They have not been reviewed
- 1: Coverage was placed at the time of investment and not revisited
- 2: Reviewed annually with the broker against bylaws, investor agreements, and benefit plans
- 3: Annual review plus board reporting on limits, indemnification agreements, and fiduciary controls

### Regulated materials & environmental — `br_regulated_materials`
Category: Emerging risk · Branch: regulatedMaterials · Weights (3PL/Mfg/Other): 2/3/2

For regulated materials or processes, how are environmental permits, storage practices, and pollution exposure managed?

- 0: We are not sure what permits apply; storage practices are informal
- 1: Permits are in place; documentation of storage and disposal is inconsistent
- 2: Permits, storage, and disposal are documented with a compliance owner
- 3: Documented compliance program, periodic environmental audits, and pollution exposure reviewed with the broker


## 5. Findings library (approved language)

Each finding is triggered deterministically by the answers listed. Use the wording as written; do not add benchmarks or statistics.

### Your renewal process may begin too late to fully document your risk controls.
Id `renewal_starts_late` · Category Program governance · Base priority 90 · Based on: gov_renewal_lead_time, mkt_submission_visibility

Renewal preparation appears to begin with limited runway. Controls that are not documented in time rarely make it into the submission carriers evaluate.

Benchmark indication: high-impact underwriting strengths were identified elsewhere in your answers, but they may not be incorporated consistently into carrier submissions.

### Your contracts and insurance-verification process may not be operating as one control system.
Id `contracts_not_one_system` · Category Contractual risk transfer · Base priority 85 · Based on: crt_signed_contracts, crt_insurance_requirements, crt_coi_verification

Answers about signed contracts, insurance requirements, and certificate verification are uneven. Risk transfer only works when all three align.

Potential opportunity: review whether contractual requirements, certificates of insurance, and policy endorsements align for your largest customer and vendor relationships.

### Your business has changed faster than your insurance-governance process.
Id `business_outpaced_governance` · Category Data & market readiness · Base priority 88 · Based on: mkt_business_changes, emr_new_activity_review

You reported recent acquisitions or new locations, but operational changes reach the insurance program late or inconsistently.

Areas to investigate: new locations, increased payroll, new services, and updated property values, and whether each is reflected in current schedules.

### Your claims process appears reactive rather than managed to a defined cadence.
Id `claims_reactive` · Category Claims discipline · Base priority 84 · Based on: clm_reporting_protocol, clm_open_claim_review, clm_root_cause

Incident reporting, open-claim review, or corrective-action tracking appear informal. Claims that are not managed tend to cost more and stay open longer.

Potential opportunity: evaluate reporting timelines, reserve review, adjuster accountability, and how corrective actions are tracked to closure.

### Incomplete exposure data or a weak underwriting narrative could limit your market options.
Id `exposure_data_limits_markets` · Category Data & market readiness · Base priority 82 · Based on: mkt_exposure_data, mkt_submission_visibility

Exposure values appear to be carried forward without reconciliation, or you have limited visibility into what carriers receive.

Pricing cannot be assessed from this questionnaire alone. However, carriers generally offer their best terms to accounts that present validated data and a clear narrative, subject to policy, loss, and underwriting review.

### Payment-change and wire controls may leave a path open for social-engineering losses.
Id `social_engineering_path` · Category Operational controls · Base priority 86 · Based on: ops_payment_authorization

Vendor bank-detail changes or wires may be released without callback verification and dual approval. This is the most common route for funds-transfer fraud.

Potential opportunity: confirm callback procedures, approval thresholds, and whether crime or cyber coverage includes social-engineering terms, subject to policy review.

### Cyber controls may not meet the minimums that most carriers now require.
Id `cyber_minimums` · Category Operational controls · Base priority 83 · Based on: ops_cyber_controls, br_data_security

Multi-factor authentication, tested backups, and a written incident plan are the controls cyber underwriters ask about first.

Potential opportunity: document current controls, close gaps before the next cyber application, and confirm which controls are attested on existing applications.

### Insurance program ownership appears informal.
Id `no_program_owner` · Category Program governance · Base priority 70 · Based on: gov_internal_owner

Without a named owner and defined responsibilities, renewal tasks, certificate requests, and mid-term changes tend to fall through the cracks.

Potential opportunity: assign an owner and backup, and define the touchpoints with finance, operations, and HR/safety.

### Limits and deductibles appear to be renewed without a documented rationale.
Id `limits_not_reasoned` · Category Program governance · Base priority 68 · Based on: gov_limit_rationale

This diagnostic does not assess whether limits are adequate. It does note that limits which are never revisited may not track contract requirements or asset growth.

Potential opportunity: document the basis for each limit and deductible with a licensed advisor and revisit it when contracts or assets change.

### Safety and training practices may exist but are not documented in a form underwriters can credit.
Id `safety_undocumented` · Category Operational controls · Base priority 72 · Based on: ops_safety_training

Written programs, training records, and inspection logs are what carriers use to distinguish a well-run operation from an average one.

Potential opportunity: assemble a safety documentation package before the next submission.

### Owned-property values and building updates may be undocumented.
Id `property_values_stale` · Category Data & market readiness · Base priority 78 · Based on: br_property_valuation

Replacement cost, business-interruption values, flood exposure, and building-system updates drive both coverage terms and pricing conversations.

Areas to investigate: date of last valuation, BI worksheet, flood zone determination, and documented roof, sprinkler, and electrical updates.

### Fleet and driver controls may not be documented to the level auto underwriters expect.
Id `fleet_controls` · Category Operational controls · Base priority 76 · Based on: br_fleet_controls

MVR practices, fleet policy, and hired/non-owned auto handling are primary controls for commercial auto.

Potential opportunity: adopt a written fleet policy with annual MVRs and disqualification criteria.

### Subcontractor and vendor risk transfer may not be enforced.
Id `subcontractor_transfer_gap` · Category Contractual risk transfer · Base priority 77 · Based on: br_subcontractor_transfer

Indemnity terms and endorsements that are not confirmed before work begins may not respond when a loss occurs.

Potential opportunity: confirm additional-insured and waiver endorsements for active vendors.

### Workforce programs (return-to-work, handbook, manager training) may be informal for a company of your size.
Id `workforce_programs_gap` · Category Operational controls · Base priority 71 · Based on: br_workforce_programs

These programs influence workers' compensation experience and employment-practices exposure.

Potential opportunity: document return-to-work procedures and update the employee handbook.

### Board and investor-related exposures may not have been reviewed since the investment.
Id `investor_governance_gap` · Category Program governance · Base priority 69 · Based on: br_governance_investors

Directors & officers, fiduciary, and indemnification arrangements are typically revisited as ownership and boards change.

Potential opportunity: review governance-related exposures with a licensed advisor against current bylaws and investor agreements.

### Environmental compliance and pollution exposure may not be documented.
Id `environmental_gap` · Category Emerging risk · Base priority 75 · Based on: br_regulated_materials

Permits, storage practices, and disposal records are the starting point for any environmental conversation with carriers.

Areas to investigate: applicable permits, storage documentation, and whether pollution exposure has been reviewed.

### New activities and regulatory changes may reach the insurance program after the fact.
Id `emerging_risk_unmanaged` · Category Emerging risk · Base priority 65 · Based on: emr_new_activity_review, emr_regulatory, emr_annual_review

Without a pre-launch review step, new locations, products, and technology can create exposures that are not reflected until the next renewal.

Potential opportunity: add a risk and insurance checkpoint to your launch process.

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
| 3PL / warehousing | Exposure data (goods in care, custody, control), safety (forklift, dock, fire protection, sprinkler impairment), contracts (warehousing agreements, warehouse receipts), insurance requirements (warehouse legal liability, cargo, auto), new activity (commodities, temperature-controlled storage, new facilities) |
| Light manufacturing | Exposure data (machinery values, BI worksheet, supplier dependence), safety (machine guarding, lockout/tagout), contracts (supply agreements, warranty and recall terms), insurance requirements (product liability, vendor endorsements), new activity (new products, lines, markets) |

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
