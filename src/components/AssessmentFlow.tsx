"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { INDUSTRIES, INDUSTRY_IDS } from "@/lib/diagnostic/industries";
import {
  CATEGORY_LABELS,
  EMPLOYEE_BAND_LABELS,
  INCUMBENT_TENURE_LABELS,
  MAJOR_LINE_LABELS,
  MONTH_LABELS,
  PREMIUM_BAND_LABELS,
  PRIMARY_CONCERN_LABELS,
  REVENUE_BAND_LABELS,
} from "@/lib/diagnostic/labels";
import { QUESTIONS } from "@/lib/diagnostic/questions";
import { CATEGORY_IDS, BRANCH_TRIGGERS } from "@/lib/diagnostic/types";
import type {
  AnswerValue,
  Answers,
  AssessmentProfile,
  BranchTrigger,
  CategoryId,
  EmployeeBand,
  IncumbentTenure,
  IndustryId,
  MajorLine,
  PremiumBand,
  PrimaryConcern,
  RevenueBand,
} from "@/lib/diagnostic/types";

const STORAGE_KEY = "mr_assessment_v1";

interface StartForm {
  companyName: string;
  website: string;
  zip: string;
  industry: IndustryId;
  employeeBand: EmployeeBand | "";
  revenueBand: RevenueBand | "";
  website_confirm: string;
}

interface Session {
  assessmentId: string;
  resultsToken: string;
}

type ProfileExtras = Pick<
  AssessmentProfile,
  | "renewalMonth"
  | "incumbentTenure"
  | "majorLines"
  | "premiumBand"
  | "recentAcquisitionOrNewLocation"
  | "primaryConcern"
  | "willingToSharePolicies"
  | BranchTrigger
>;

const BRANCH_PROMPTS: Record<BranchTrigger, string> = {
  ownsBuildings: "Do you own any of the buildings you operate from?",
  hasVehicles: "Do employees drive company vehicles, or their own vehicles for work?",
  usesSubcontractors: "Do you use subcontractors or outside vendors on site or for customer work?",
  storesSensitiveData: "Do you store sensitive customer, employee, or payment data?",
  employeesAboveThreshold: "", // computed from employee band; not asked
  hasOutsideInvestors: "Do you have outside investors or a board of directors?",
  regulatedMaterials: "Do you handle regulated materials or processes (chemicals, hazardous waste, food safety, environmental permits)?",
};

type StepId = "start" | "operations" | CategoryId | "profile";

export function AssessmentFlow() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState<StepId>("start");
  const [answers, setAnswers] = useState<Answers>({});
  const [extras, setExtras] = useState<ProfileExtras>({ majorLines: [] });
  const [start, setStart] = useState<StartForm>({
    companyName: "",
    website: "",
    zip: "",
    industry: "logistics_3pl",
    employeeBand: "",
    revenueBand: "",
    website_confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedAt = useRef<number>(Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  // Restore an in-progress session from local storage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { session: Session; step: StepId; answers: Answers; extras: ProfileExtras; start: StartForm };
      if (saved.session?.assessmentId) {
        setSession(saved.session);
        setStep(saved.step ?? "operations");
        setAnswers(saved.answers ?? {});
        setExtras(saved.extras ?? { majorLines: [] });
        setStart(saved.start ?? start);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ session, step, answers, extras, start }));
    } catch {
      /* ignore */
    }
  }, [session, step, answers, extras, start]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const steps: StepId[] = useMemo(() => ["start", "operations", ...CATEGORY_IDS, "profile"], []);
  const stepIndex = steps.indexOf(step);

  const applicableQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.branch || extras[q.branch] === true),
    [extras],
  );

  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = Array.isArray(json.details) && json.details[0]?.message ? `: ${json.details[0].message}` : "";
      throw new Error((json.error ?? "Request failed") + detail);
    }
    return json as T;
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!start.employeeBand || !start.revenueBand) {
      setError("Please select employee and revenue bands.");
      return;
    }
    setBusy(true);
    try {
      const s = await post<Session & { profile: AssessmentProfile }>("/api/assessment/start", {
        ...start,
        startedAt: openedAt.current,
      });
      setSession({ assessmentId: s.assessmentId, resultsToken: s.resultsToken });
      setExtras((x) => ({ ...x, employeesAboveThreshold: s.profile.employeesAboveThreshold }));
      setStep("operations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the assessment.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProgress(nextStep: StepId) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await post("/api/assessment/answer", { assessmentId: session.assessmentId, answers, profile: cleanExtras(extras) });
      setStep(nextStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your progress.");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const out = await post<{ token: string; resultsPath: string }>("/api/assessment/complete", {
        assessmentId: session.assessmentId,
        answers,
        profile: cleanExtras(extras),
      });
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      router.push(out.resultsPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete the assessment.");
      setBusy(false);
    }
  }

  function restart() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSession(null);
    setAnswers({});
    setExtras({ majorLines: [] });
    setStep("start");
  }

  const categoryQuestions = (c: CategoryId) => applicableQuestions.filter((q) => q.category === c);
  const categoryComplete = (c: CategoryId) => categoryQuestions(c).every((q) => answers[q.id] !== undefined);

  return (
    <div ref={topRef}>
      <Progress steps={steps} current={stepIndex} />
      {error ? (
        <div role="alert" className="mb-4 rounded-md border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
        </div>
      ) : null}

      {step === "start" ? (
        <Card>
          <h1 className="text-2xl font-semibold text-navy">Tell us about your company</h1>
          <p className="mt-1 text-sm text-muted">Bands only. We never ask for exact premium or revenue figures.</p>
          <form onSubmit={handleStart} className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Company name" required>
                <input className={inputClass} required maxLength={120} value={start.companyName} onChange={(e) => setStart({ ...start, companyName: e.target.value })} />
              </Field>
            </div>
            <Field label="Website" hint="Optional">
              <input className={inputClass} placeholder="example.com" maxLength={200} value={start.website} onChange={(e) => setStart({ ...start, website: e.target.value })} />
            </Field>
            <Field label="Headquarters ZIP code" required>
              <input className={inputClass} required inputMode="numeric" pattern="\d{5}(-\d{4})?" placeholder="08034" value={start.zip} onChange={(e) => setStart({ ...start, zip: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Industry" required>
                <div className="grid gap-2 sm:grid-cols-3">
                  {INDUSTRY_IDS.map((id) => (
                    <label key={id} className={`cursor-pointer rounded-md border px-3 py-2.5 text-sm ${start.industry === id ? "border-navy bg-navy/5" : "border-line hover:border-navy/40"}`}>
                      <input type="radio" name="industry" className="sr-only" checked={start.industry === id} onChange={() => setStart({ ...start, industry: id })} />
                      <span className="font-semibold">{INDUSTRIES[id].label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{INDUSTRIES[id].description}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Employees" required>
              <select className={inputClass} required value={start.employeeBand} onChange={(e) => setStart({ ...start, employeeBand: e.target.value as EmployeeBand })}>
                <option value="">Select…</option>
                {(Object.keys(EMPLOYEE_BAND_LABELS) as EmployeeBand[]).map((k) => (
                  <option key={k} value={k}>
                    {EMPLOYEE_BAND_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Annual revenue" required>
              <select className={inputClass} required value={start.revenueBand} onChange={(e) => setStart({ ...start, revenueBand: e.target.value as RevenueBand })}>
                <option value="">Select…</option>
                {(Object.keys(REVENUE_BAND_LABELS) as RevenueBand[]).map((k) => (
                  <option key={k} value={k}>
                    {REVENUE_BAND_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            {/* Honeypot: hidden from humans, filled by bots. */}
            <div className="hidden" aria-hidden="true">
              <label>
                Confirm website
                <input tabIndex={-1} autoComplete="off" value={start.website_confirm} onChange={(e) => setStart({ ...start, website_confirm: e.target.value })} />
              </label>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-muted">Your answers are stored so you can return to your results. See what we store on the privacy page.</p>
              <Button type="submit" disabled={busy}>
                {busy ? "Starting…" : "Continue"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {step === "operations" ? (
        <Card>
          <h1 className="text-2xl font-semibold text-navy">How your business operates</h1>
          <p className="mt-1 text-sm text-muted">These answers add a few follow-up questions where they apply.</p>
          <div className="mt-6 space-y-4">
            {BRANCH_TRIGGERS.filter((t) => t !== "employeesAboveThreshold").map((t) => (
              <YesNo key={t} label={BRANCH_PROMPTS[t]} value={extras[t]} onChange={(v) => setExtras({ ...extras, [t]: v })} />
            ))}
            <YesNo
              label="Have you acquired a business, opened a new location, or added a major new service in the last 24 months?"
              value={extras.recentAcquisitionOrNewLocation}
              onChange={(v) => setExtras({ ...extras, recentAcquisitionOrNewLocation: v })}
            />
          </div>
          <NavButtons
            busy={busy}
            onBack={restart}
            backLabel="Start over"
            onNext={() => saveProgress(CATEGORY_IDS[0])}
            nextDisabled={BRANCH_TRIGGERS.filter((t) => t !== "employeesAboveThreshold").some((t) => extras[t] === undefined) || extras.recentAcquisitionOrNewLocation === undefined}
          />
        </Card>
      ) : null}

      {CATEGORY_IDS.includes(step as CategoryId) ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            Section {CATEGORY_IDS.indexOf(step as CategoryId) + 1} of {CATEGORY_IDS.length}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-navy">{CATEGORY_LABELS[step as CategoryId].label}</h1>
          <p className="mt-1 text-sm text-muted">{CATEGORY_LABELS[step as CategoryId].description}</p>
          <div className="mt-6 space-y-8">
            {categoryQuestions(step as CategoryId).map((q, i) => (
              <fieldset key={q.id}>
                <legend className="text-sm font-semibold text-muted">
                  {i + 1}. {q.topic}
                  {q.branch ? <span className="ml-2 rounded bg-sand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">Follow-up</span> : null}
                </legend>
                <p className="mt-1 text-base font-medium">{q.prompt}</p>
                {q.help ? <p className="mt-1 text-xs text-muted">{q.help}</p> : null}
                <div className="mt-3 grid gap-2">
                  {q.options.map((o) => (
                    <OptionRow key={o.value} name={q.id} checked={answers[q.id] === o.value} label={o.label} onSelect={() => setAnswers({ ...answers, [q.id]: o.value })} />
                  ))}
                  <OptionRow name={q.id} checked={answers[q.id] === "unknown"} label="Not sure / someone else owns this" muted onSelect={() => setAnswers({ ...answers, [q.id]: "unknown" as AnswerValue })} />
                </div>
              </fieldset>
            ))}
          </div>
          <NavButtons
            busy={busy}
            onBack={() => setStep(steps[stepIndex - 1])}
            onNext={() => saveProgress(steps[stepIndex + 1])}
            nextDisabled={!categoryComplete(step as CategoryId)}
            nextLabel={stepIndex === steps.length - 2 ? "Almost done" : "Continue"}
          />
        </Card>
      ) : null}

      {step === "profile" ? (
        <Card>
          <h1 className="text-2xl font-semibold text-navy">A few details that shape your results</h1>
          <p className="mt-1 text-sm text-muted">All optional, but renewal month makes the timing guidance specific to you.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Policy renewal month" hint="The month most of your program renews">
              <select className={inputClass} value={extras.renewalMonth ?? ""} onChange={(e) => setExtras({ ...extras, renewalMonth: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">Select…</option>
                {MONTH_LABELS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="How long with your current broker?">
              <select className={inputClass} value={extras.incumbentTenure ?? ""} onChange={(e) => setExtras({ ...extras, incumbentTenure: (e.target.value || undefined) as IncumbentTenure | undefined })}>
                <option value="">Select…</option>
                {(Object.keys(INCUMBENT_TENURE_LABELS) as IncumbentTenure[]).map((k) => (
                  <option key={k} value={k}>
                    {INCUMBENT_TENURE_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Major lines of coverage" hint="Select all that apply">
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(MAJOR_LINE_LABELS) as MajorLine[]).map((k) => {
                    const checked = extras.majorLines?.includes(k) ?? false;
                    return (
                      <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${checked ? "border-navy bg-navy/5" : "border-line"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const set = new Set(extras.majorLines ?? []);
                            if (checked) set.delete(k);
                            else set.add(k);
                            setExtras({ ...extras, majorLines: Array.from(set) });
                          }}
                        />
                        {MAJOR_LINE_LABELS[k]}
                      </label>
                    );
                  })}
                </div>
              </Field>
            </div>
            <Field label="Total annual premium band" hint="A band, not a figure">
              <select className={inputClass} value={extras.premiumBand ?? ""} onChange={(e) => setExtras({ ...extras, premiumBand: (e.target.value || undefined) as PremiumBand | undefined })}>
                <option value="">Select…</option>
                {(Object.keys(PREMIUM_BAND_LABELS) as PremiumBand[]).map((k) => (
                  <option key={k} value={k}>
                    {PREMIUM_BAND_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Your largest concern right now">
              <select className={inputClass} value={extras.primaryConcern ?? ""} onChange={(e) => setExtras({ ...extras, primaryConcern: (e.target.value || undefined) as PrimaryConcern | undefined })}>
                <option value="">Select…</option>
                {(Object.keys(PRIMARY_CONCERN_LABELS) as PrimaryConcern[]).map((k) => (
                  <option key={k} value={k}>
                    {PRIMARY_CONCERN_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="If you chose to meet with an advisor, would you be willing to share policies or loss runs during a workshop?">
                <div className="flex flex-wrap gap-2">
                  {(["yes", "maybe", "no"] as const).map((v) => (
                    <label key={v} className={`cursor-pointer rounded-md border px-4 py-2 text-sm capitalize ${extras.willingToSharePolicies === v ? "border-navy bg-navy/5" : "border-line"}`}>
                      <input type="radio" name="share" className="sr-only" checked={extras.willingToSharePolicies === v} onChange={() => setExtras({ ...extras, willingToSharePolicies: v })} />
                      {v}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </div>
          <NavButtons busy={busy} onBack={() => setStep(steps[stepIndex - 1])} onNext={complete} nextLabel={busy ? "Calculating…" : "See my results"} />
        </Card>
      ) : null}
    </div>
  );
}

function cleanExtras(extras: ProfileExtras): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(extras)) if (v !== undefined) out[k] = v;
  return out;
}

function Progress({ steps, current }: { steps: StepId[]; current: number }) {
  const pct = Math.round((current / (steps.length - 1)) * 100);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Step {current + 1} of {steps.length}
        </span>
        <span>{pct}% complete</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/8" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-md border px-4 py-1.5 text-sm ${value === v ? "border-navy bg-navy text-white" : "border-line hover:border-navy/40"}`}
            aria-pressed={value === v}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionRow({ name, checked, label, onSelect, muted }: { name: string; checked: boolean; label: string; onSelect: () => void; muted?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm ${checked ? "border-navy bg-navy/5" : "border-line hover:border-navy/40"} ${muted ? "text-muted" : ""}`}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}

function NavButtons({
  busy,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
  backLabel = "Back",
}: {
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
      <Button variant="ghost" onClick={onBack} disabled={busy}>
        {backLabel}
      </Button>
      <Button onClick={onNext} disabled={busy || nextDisabled}>
        {nextLabel}
      </Button>
    </div>
  );
}
