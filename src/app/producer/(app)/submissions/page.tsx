import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { listSubmissions } from "@/lib/server/dal";

export const dynamic = "force-dynamic";

function Breakdown({ title, data }: { title: string; data: Record<string, { started: number; completed: number; captured: number }> }) {
  const entries = Object.entries(data).sort((a, b) => b[1].started - a[1].started);
  return (
    <Card as="div">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <table className="mt-2 w-full text-xs">
        <thead className="text-left text-muted">
          <tr>
            <th className="py-1 font-medium">Key</th>
            <th className="py-1 text-right font-medium">Started</th>
            <th className="py-1 text-right font-medium">Completed</th>
            <th className="py-1 text-right font-medium">Captured</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {entries.length ? (
            entries.map(([k, v]) => (
              <tr key={k}>
                <td className="py-1">{k}</td>
                <td className="py-1 text-right tabular-nums">{v.started}</td>
                <td className="py-1 text-right tabular-nums">{v.completed}</td>
                <td className="py-1 text-right tabular-nums">{v.captured}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="py-1 text-muted" colSpan={4}>
                No data yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

export default async function SubmissionsPage() {
  const { rows, funnel } = await listSubmissions();
  const tiles: Array<[string, string | number]> = [
    ["Started", funnel.started],
    ["Completed", funnel.completed],
    ["Completion rate", funnel.completionRate === null ? "—" : `${funnel.completionRate}%`],
    ["Email captured", funnel.captured],
    ["Capture rate", funnel.captureRate === null ? "—" : `${funnel.captureRate}%`],
    ["Workshop requested", funnel.workshopRequested],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">All submissions</h1>
          <p className="mt-1 text-sm text-muted">Every assessment started, including anonymous completions. Use this during the controlled launch to inspect each submission and to read the funnel.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
          {tiles.map(([label, value]) => (
            <div key={label} className="rounded-md border border-line bg-surface px-3 py-2">
              <div className="text-lg font-semibold tabular-nums">{value}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Breakdown title="By entry module" data={funnel.byModule} />
        <Breakdown title="By partner / source" data={funnel.byPartner} />
        <Breakdown title="By industry" data={funnel.byIndustry} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="min-w-[1100px] text-left text-xs">
          <thead className="bg-foreground/3 text-[11px] uppercase tracking-wide text-muted">
            <tr>
              {["Started", "Company", "Industry / niche", "State", "Module", "Source", "Progress", "Overall", "Conf.", "Flags", "Top findings", "Lead"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={12}>
                  No submissions yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.assessmentId} className="align-top hover:bg-navy/3">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-3 py-2 font-semibold">{r.company}</td>
                  <td className="px-3 py-2">
                    {r.industry}
                    {r.niche ? <div className="text-muted">{r.niche}</div> : null}
                  </td>
                  <td className="px-3 py-2">
                    {r.territory ?? "—"}
                    <div className="text-muted">{r.zip}</div>
                  </td>
                  <td className="px-3 py-2">{r.module}</td>
                  <td className="px-3 py-2">{r.partner ? `Partner: ${r.partner}` : r.source ?? "direct"}</td>
                  <td className="px-3 py-2">
                    {r.status === "completed" ? <Badge tone="good">Completed</Badge> : <Badge tone="warn">In progress</Badge>}
                    <div className="text-muted">
                      {r.answered}/{r.applicable} answered
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold tabular-nums">{r.overall ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{r.confidence !== null ? `${r.confidence}%` : "—"}</td>
                  <td className="px-3 py-2">{r.criticalFlags ? <Badge tone="bad">{r.criticalFlags}</Badge> : "—"}</td>
                  <td className="px-3 py-2 max-w-[360px]">{r.findings.join(" · ") || "—"}</td>
                  <td className="px-3 py-2">
                    {r.leadId ? (
                      <Link href={`/producer/leads/${r.leadId}`} className="font-semibold text-navy hover:underline">
                        Tier {r.leadTier}
                      </Link>
                    ) : (
                      <span className="text-muted">anonymous</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
