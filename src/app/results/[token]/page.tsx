import { notFound } from "next/navigation";
import { EmailCapture } from "@/components/EmailCapture";
import { SiteFooter, SiteHeader } from "@/components/site";
import { BandPill, Button, Card, ScoreMeter } from "@/components/ui";
import { CATEGORY_LABELS, CONFIDENCE_BAND_LABELS, SCORE_BAND_LABELS } from "@/lib/diagnostic/labels";
import { NO_BENCHMARK_NOTE, PRICING_NOTE, RESULTS_DISCLAIMER } from "@/lib/diagnostic/disclaimers";
import { QUESTION_BY_ID } from "@/lib/diagnostic/questions";
import { getModule } from "@/lib/diagnostic/modules";
import { getPublicResult } from "@/lib/server/dal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your results", robots: { index: false, follow: false } };

export default async function ResultsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPublicResult(token);
  if (!data) notFound();
  const { result } = data;
  const { scores } = result;
  const mod = getModule(data.module);
  const focusGaps = mod.focusCategories.length
    ? (scores.lowPracticeIds ?? [])
        .map((id) => QUESTION_BY_ID[id])
        .filter((q) => q && mod.focusCategories.includes(q.category))
    : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">Preliminary results · {data.industryLabel}</p>
        <h1 className="mt-1 text-3xl font-semibold text-navy">{data.companyName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Based solely on your answers. {NO_BENCHMARK_NOTE}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <Card>
            <h2 className="text-sm font-semibold text-muted">Overall readiness</h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tabular-nums text-navy">{scores.overall === null ? "—" : Math.round(scores.overall)}</span>
              <span className="text-sm text-muted">/ 100</span>
            </div>
            <div className="mt-3">
              <BandPill band={scores.overallBand} />
            </div>
            {scores.overallBand ? <p className="mt-2 text-sm text-muted">{SCORE_BAND_LABELS[scores.overallBand].description}</p> : null}
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Confidence</span>
                <span className="tabular-nums">{scores.confidence}%</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {CONFIDENCE_BAND_LABELS[scores.confidenceBand]}. {scores.unknownCount > 0 ? `${scores.unknownCount} answer${scores.unknownCount === 1 ? "" : "s"} marked "not sure" reduce confidence but do not lower the score.` : "Every applicable question was answered."}
              </p>
            </div>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-muted">Category scores</h2>
            <div className="divide-y divide-line">
              {scores.categories.map((c) => (
                <ScoreMeter key={c.category} label={CATEGORY_LABELS[c.category].label} score={c.score} band={c.band} />
              ))}
            </div>
          </Card>
        </div>

        {mod.focusCategories.length ? (
          <Card className="mt-6 border-teal/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">{mod.name}</p>
            <h2 className="mt-1 text-lg font-semibold text-navy">{mod.focusTitle}</h2>
            <p className="mt-1 text-sm text-muted">{mod.focusIntro}</p>
            <div className="mt-3 divide-y divide-line">
              {scores.categories
                .filter((c) => mod.focusCategories.includes(c.category))
                .map((c) => (
                  <ScoreMeter key={c.category} label={CATEGORY_LABELS[c.category].label} score={c.score} band={c.band} />
                ))}
            </div>
            <h3 className="mt-4 text-sm font-semibold">Practices in this area worth confirming first</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {focusGaps.length ? (
                focusGaps.map((q) => <li key={q.id}>{q.topic}</li>)
              ) : (
                <li className="text-muted">No practices in this area were flagged.</li>
              )}
            </ul>
          </Card>
        ) : null}

        {scores.criticalFlags.length ? (
          <Card className="mt-6 border-bad/30">
            <h2 className="flex items-center gap-2 text-base font-semibold text-bad">
              <span aria-hidden="true">!</span> Critical control flags
            </h2>
            <p className="mt-1 text-xs text-muted">Surfaced regardless of overall score because carriers treat these as threshold controls.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {scores.criticalFlags.map((f) => (
                <li key={f.questionId} className="flex gap-2">
                  <span className="font-semibold text-muted">{QUESTION_BY_ID[f.questionId]?.topic}:</span>
                  <span>{f.message}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-navy">Three areas to investigate</h2>
          <div className="mt-4 grid gap-4">
            {result.findings.map((f, i) => (
              <Card key={f.id} as="article">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                  {i + 1} · {f.category === "overall" ? "Overall" : CATEGORY_LABELS[f.category].short}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm">{f.body}</p>
                {f.detail ? <p className="mt-2 text-sm text-muted">{f.detail}</p> : null}
              </Card>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-base font-semibold text-navy">Underwriting-story strengths</h2>
            {result.strengths.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {result.strengths.map((s) => (
                  <li key={s.id}>
                    <span className="font-semibold">{s.title}.</span> {s.body}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No category scored in the strongest band yet. Documenting existing practices is often the fastest way to change that.</p>
            )}
          </Card>
          <Card>
            <h2 className="text-base font-semibold text-navy">Renewal timing</h2>
            <p className="mt-3 text-sm">{result.renewal.message}</p>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">{PRICING_NOTE}</p>
          </Card>
        </div>

        {scores.consistencyNotes.length ? (
          <Card className="mt-6">
            <h2 className="text-base font-semibold text-navy">Answers worth reconciling</h2>
            <p className="mt-1 text-xs text-muted">These pairs of answers point in different directions. They do not change your score.</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {scores.consistencyNotes.map((n) => (
                <li key={n.id}>{n.message}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card className="mt-6 bg-sand/50">
          <h2 className="text-base font-semibold text-navy">What the market sees in {data.industryLabel.toLowerCase()}</h2>
          <p className="mt-2 text-sm">{data.industryNote}</p>
        </Card>

        <section id="report" className="mt-10">
          <EmailCapture token={token} emailCaptured={data.emailCaptured} workshopRequested={data.workshopRequested} checklist={result.checklist} />
        </section>

        <div className="no-print mt-8 flex flex-wrap items-center gap-3">
          <Button href="/assess" variant="secondary">
            Run another assessment
          </Button>
        </div>

        <p className="mt-10 text-xs text-muted">{RESULTS_DISCLAIMER}</p>
      </main>
      <SiteFooter />
    </>
  );
}
