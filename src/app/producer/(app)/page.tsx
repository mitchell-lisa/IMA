import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import {
  CATEGORY_LABELS,
  EMPLOYEE_BAND_LABELS,
  INCUMBENT_TENURE_LABELS,
  MAJOR_LINE_LABELS,
  PREMIUM_BAND_LABELS,
  PRIMARY_CONCERN_LABELS,
  REVENUE_BAND_LABELS,
  ROLE_LABELS,
} from "@/lib/diagnostic/labels";
import { CATEGORY_IDS } from "@/lib/diagnostic/types";
import type { EmployeeBand, IncumbentTenure, MajorLine, PremiumBand, PrimaryConcern, RevenueBand, Role } from "@/lib/diagnostic/types";
import { listDashboardRows } from "@/lib/server/dal";

export const dynamic = "force-dynamic";

const tierTone = { A: "good", B: "warn", C: "neutral" } as const;

export default async function ProducerDashboard() {
  const rows = await listDashboardRows();
  const counts = {
    total: rows.length,
    tierA: rows.filter((r) => r.leadTier === "A").length,
    workshop: rows.filter((r) => r.workshopRequested).length,
    unreviewed: rows.filter((r) => !r.licensedReviewCompleted).length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Qualified leads</h1>
          <p className="mt-1 text-sm text-muted">Completed diagnostics with email capture. Lead quality is a sales-prioritization score, not an insurance-risk score.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[
            ["Leads", counts.total],
            ["Tier A", counts.tierA],
            ["Workshop", counts.workshop],
            ["Awaiting review", counts.unreviewed],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-line bg-surface px-3 py-2">
              <div className="text-lg font-semibold tabular-nums">{value}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="mt-8">
          <p className="text-sm text-muted">No leads yet. Complete an assessment and enter an email on the results page to see it here.</p>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="min-w-[1600px] text-left text-xs">
            <thead className="bg-foreground/3 text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {[
                  "Company",
                  "Industry / NAICS",
                  "State",
                  "Size",
                  "Contact",
                  "Renewal",
                  "Incumbent",
                  "Lines",
                  "Premium",
                  "Overall",
                  ...CATEGORY_IDS.map((c) => CATEGORY_LABELS[c].short),
                  "Conf.",
                  "Flags",
                  "Pain points",
                  "Buying signals",
                  "Source",
                  "Consent",
                  "Lead score",
                  "Owner",
                  "Disposition",
                  "Review",
                  "Sync",
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.leadId} className="align-top hover:bg-navy/3">
                  <td className="px-3 py-2">
                    <Link href={`/producer/leads/${r.leadId}`} className="font-semibold text-navy hover:underline">
                      {r.company}
                    </Link>
                    <div className="text-muted">{r.website ?? ""}</div>
                    <div className="text-[10px] text-muted">{new Date(r.createdAt).toLocaleDateString("en-US")}</div>
                  </td>
                  <td className="px-3 py-2">
                    {r.industry}
                    {r.niche ? <div>{r.niche}</div> : null}
                    <div className="text-muted">{r.naics}</div>
                  </td>
                  <td className="px-3 py-2">
                    {r.territory}
                    <div className="text-muted">{r.zip}</div>
                  </td>
                  <td className="px-3 py-2">
                    {EMPLOYEE_BAND_LABELS[r.employeeBand as EmployeeBand]} emp.
                    <div className="text-muted">{REVENUE_BAND_LABELS[r.revenueBand as RevenueBand]}</div>
                  </td>
                  <td className="px-3 py-2">
                    {r.contactName ?? "—"}
                    <div className="text-muted">{r.role ? ROLE_LABELS[r.role as Role] : ""}</div>
                    <div className="text-muted">{r.contactEmail}</div>
                  </td>
                  <td className="px-3 py-2">
                    {r.renewalMonth ?? "—"}
                    {r.monthsUntilRenewal !== null ? <div className="text-muted">{r.monthsUntilRenewal} mo</div> : null}
                  </td>
                  <td className="px-3 py-2">{r.incumbentTenure ? INCUMBENT_TENURE_LABELS[r.incumbentTenure as IncumbentTenure] : "—"}</td>
                  <td className="px-3 py-2 max-w-[160px]">{r.majorLines.map((l) => MAJOR_LINE_LABELS[l as MajorLine]).join(", ") || "—"}</td>
                  <td className="px-3 py-2">{r.premiumBand ? PREMIUM_BAND_LABELS[r.premiumBand as PremiumBand] : "—"}</td>
                  <td className="px-3 py-2 font-semibold tabular-nums">{r.overall ?? "—"}</td>
                  {CATEGORY_IDS.map((c) => (
                    <td key={c} className="px-3 py-2 tabular-nums">
                      {r.categories[c] ?? "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2 tabular-nums">{r.confidence}%</td>
                  <td className="px-3 py-2">{r.criticalFlags ? <Badge tone="bad">{r.criticalFlags}</Badge> : "—"}</td>
                  <td className="px-3 py-2 max-w-[200px]">
                    {r.painPoints
                      .map((p) => (p in PRIMARY_CONCERN_LABELS ? PRIMARY_CONCERN_LABELS[p as PrimaryConcern] : p.replace(/_/g, " ")))
                      .join("; ") || "—"}
                  </td>
                  <td className="px-3 py-2 max-w-[160px]">{r.buyingSignals.join("; ") || "—"}</td>
                  <td className="px-3 py-2">
                    {r.partner ? `Partner: ${r.partner}` : r.source ?? "direct"}
                    {r.module !== "marketready" ? <div className="text-muted">{r.module}</div> : null}
                  </td>
                  <td className="px-3 py-2">
                    Report ✓{r.consentMarketing ? " · Marketing ✓" : ""}
                    {r.workshopRequested ? " · Workshop ✓" : ""}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={tierTone[r.leadTier as "A" | "B" | "C"]}>
                      {r.leadTier} · {r.leadScore}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{r.followUpOwner ?? "—"}</td>
                  <td className="px-3 py-2">{r.disposition.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{r.licensedReviewCompleted ? <Badge tone="good">Reviewed</Badge> : <Badge tone="warn">Pending</Badge>}</td>
                  <td className="px-3 py-2 text-muted">
                    CRM {r.crmSyncStatus}
                    <div>Email {r.emailStatus}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
