import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadReviewForm } from "@/components/LeadReviewForm";
import { Badge, Card, ScoreMeter } from "@/components/ui";
import { QUESTION_BY_ID, resolveQuestion } from "@/lib/diagnostic/questions";
import { CATEGORY_LABELS } from "@/lib/diagnostic/labels";
import type { ScoreBand } from "@/lib/diagnostic/types";
import { aiSummariesAvailable } from "@/lib/server/ai";
import { getLeadDetail } from "@/lib/server/dal";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ai?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const detail = await getLeadDetail(id, { useAi: sp.ai === "1" });
  if (!detail) notFound();
  const { brief, lead, assessment } = detail;
  const q = brief.leadQuality;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <div>
          <Link href="/producer" className="text-xs text-muted hover:text-navy">
            ← All leads
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-navy">Producer Brief: {brief.snapshot.company}</h1>
            <Badge tone={q.tier === "A" ? "good" : q.tier === "B" ? "warn" : "neutral"}>
              Tier {q.tier} · {q.total}/100
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            Generated {new Date(brief.generatedAt).toLocaleString("en-US")} ·{" "}
            <span>JSON and Markdown available via POST /api/producer/brief</span>
            {aiSummariesAvailable() && !brief.aiSummary ? (
              <>
                {" "}
                ·{" "}
                <Link className="underline" href={`/producer/leads/${id}?ai=1`}>
                  Add AI-drafted summary
                </Link>
              </>
            ) : null}
          </p>
        </div>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">1. Account snapshot</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Row k="Industry" v={`${brief.snapshot.industry}${brief.snapshot.naics.length ? ` (NAICS ${brief.snapshot.naics.join(", ")})` : ""}`} />
            <Row k="Website" v={brief.snapshot.website ?? "n/a"} />
            <Row k="Location" v={`ZIP ${brief.snapshot.zip}${brief.snapshot.territory ? ` · ${brief.snapshot.territory}` : ""}`} />
            <Row k="Size" v={`${brief.snapshot.employees} employees · ${brief.snapshot.revenue}`} />
            <Row k="Contact" v={`${brief.snapshot.contact.name ?? "n/a"}${brief.snapshot.contact.role ? ` (${brief.snapshot.contact.role})` : ""}`} />
            <Row k="Email / phone" v={`${brief.snapshot.contact.email}${brief.snapshot.contact.phone ? ` · ${brief.snapshot.contact.phone}` : ""}`} />
            <Row k="Source" v={brief.snapshot.partner ? `Partner ${brief.snapshot.partner}` : brief.snapshot.source ?? "direct"} />
            <Row k="Preferred contact" v={lead.preferredContact ?? "n/a"} />
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">2. Why this lead matters</h2>
          <List items={brief.whyItMatters} />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">3. Top potential opportunities</h2>
          <ol className="mt-3 space-y-3 text-sm">
            {brief.opportunities.map((f, i) => (
              <li key={f.id}>
                <span className="font-semibold">
                  {i + 1}. {f.title}
                </span>{" "}
                {f.body}
                {f.detail ? <span className="text-muted"> {f.detail}</span> : null}
                <div className="mt-1 text-xs text-muted">Based on: {f.questionIds.map((id) => QUESTION_BY_ID[id]?.topic ?? id).join(", ")}</div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">4. Stated pain points</h2>
            <List items={brief.statedPainPoints.length ? brief.statedPainPoints : ["None stated"]} />
          </Card>
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">5. Business-change signals</h2>
            <List items={brief.businessChangeSignals} />
          </Card>
        </div>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">6. Renewal and incumbent context</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Row k="Renewal month" v={`${brief.renewalContext.renewalMonth ?? "n/a"}${brief.renewalContext.monthsUntilRenewal !== null ? ` (${brief.renewalContext.monthsUntilRenewal} months out)` : ""}`} />
            <Row k="Incumbent tenure" v={brief.renewalContext.incumbentTenure ?? "n/a"} />
            <Row k="Premium band" v={brief.renewalContext.premiumBand ?? "n/a"} />
            <Row k="Major lines" v={brief.renewalContext.majorLines.join(", ") || "n/a"} />
          </dl>
          <p className="mt-3 text-sm">{brief.renewalContext.message}</p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">7. Recommended opening questions</h2>
          <List items={brief.openingQuestions} />
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">8. Suggested specialists</h2>
            <List items={brief.specialists} />
          </Card>
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">9. Proposed 45-minute agenda</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {brief.agenda.map((a) => (
                <li key={a.item} className="flex gap-3">
                  <span className="w-12 flex-none tabular-nums text-muted">{a.minutes} min</span>
                  <span>{a.item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Workshop crosswalk</h2>
          <p className="mt-1 text-xs text-muted">Diagnostic answers mapped question-by-question onto the six Risk Workshop dimensions. The right column is what the workshop still has to cover with licensed review.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-1 pr-3">Workshop dimension</th>
                  <th className="py-1 pr-3">Score</th>
                  <th className="py-1">Reserved for the workshop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {brief.workshopCrosswalk.map((row) => (
                  <tr key={row.workshopCategory}>
                    <td className="py-2 pr-3">
                      <div className="font-semibold">{row.workshopCategory}</div>
                      <div className="text-xs text-muted">{row.evaluates}</div>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {row.score ?? "n/a"}
                      <div className="text-xs text-muted">
                        {row.answered}/{row.applicable}
                      </div>
                    </td>
                    <td className="py-2 text-muted">{row.reservedForWorkshop.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Workshop path</h3>
          <ol className="mt-2 space-y-1 text-sm">
            {brief.workshopPath.map((p) => (
              <li key={p.step} className="flex gap-2">
                <span className="w-5 flex-none tabular-nums text-muted">{p.step}.</span>
                <span>
                  <span className="font-semibold">{p.title}</span> <span className="text-xs text-muted">({p.who})</span> — {p.detail}
                </span>
              </li>
            ))}
          </ol>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Service-plan themes suggested by the findings</h3>
          <List items={brief.servicePlanThemes} />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">10. Lead quality score</h2>
          <p className="mt-2 text-sm">
            <span className="font-semibold">
              {q.total}/100 (Tier {q.tier})
            </span>{" "}
            · company fit {q.companyFit}/25 · seniority {q.seniority}/20 · renewal timing {q.renewalTiming}/20 · demonstrated pain {q.demonstratedPain}/20 · engagement {q.engagementIntent}/10 ·
            completeness {q.dataCompleteness}/5
          </p>
          <p className="mt-1 text-xs text-muted">Sales-prioritization score only. Not an insurance-risk score.</p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Summary</h2>
          <p className="mt-2 text-sm">{brief.summary}</p>
          {brief.aiSummary ? (
            <div className="mt-4 rounded-md bg-sand/60 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">AI-drafted from structured findings only</p>
              <p className="mt-1">{brief.aiSummary}</p>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Licensed review</h2>
          <p className="mt-1 text-xs text-muted">Record disposition and notes. Prospect-supplied fields are read-only.</p>
          <div className="mt-4">
            <LeadReviewForm
              leadId={lead.id}
              initial={{ disposition: lead.disposition, followUpOwner: lead.followUpOwner ?? "", reviewNotes: lead.reviewNotes ?? "", licensedReviewCompleted: lead.licensedReviewCompleted }}
              crmSyncStatus={lead.crmSyncStatus}
              emailStatus={lead.emailStatus}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Diagnostic scores</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-navy">{brief.scores.overall ?? "—"}</span>
            <span className="text-xs text-muted">overall · {brief.scores.confidence}% confidence</span>
          </div>
          <div className="mt-2 divide-y divide-line">
            {brief.scores.categories.map((c) => (
              <ScoreMeter key={c.category} label={c.label} score={c.score} band={c.band as ScoreBand | null} />
            ))}
          </div>
          {brief.scores.criticalFlags.length ? (
            <>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-bad">Critical flags</h3>
              <List items={brief.scores.criticalFlags} />
            </>
          ) : null}
          {brief.scores.consistencyNotes.length ? (
            <>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Consistency notes</h3>
              <List items={brief.scores.consistencyNotes} />
            </>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">All answers</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {assessment.result?.scores.applicableQuestionIds.map((qid) => {
              const question = resolveQuestion(QUESTION_BY_ID[qid], assessment.profile.industry);
              const v = assessment.answers[qid];
              const label = v === undefined ? "Unanswered" : v === "unknown" ? "Not sure" : question.options.find((o) => o.value === v)?.label;
              return (
                <li key={qid}>
                  <span className="font-semibold">{question.topic}</span> <span className="text-muted">({CATEGORY_LABELS[question.category].short})</span>
                  <div className={typeof v === "number" && v <= 1 ? "text-bad" : ""}>
                    {typeof v === "number" ? `${v}/3 · ` : ""}
                    {label}
                  </div>
                </li>
              );
            })}
          </ul>
          {assessment.enrichment?.signals.length ? (
            <>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Enrichment signals</h3>
              <ul className="mt-2 space-y-1 text-xs">
                {assessment.enrichment.signals.map((s) => (
                  <li key={`${s.source}-${s.label}`}>
                    <span className="font-semibold">{s.label}:</span> {s.value}
                    {s.caveat ? <span className="block text-muted">{s.caveat}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}
