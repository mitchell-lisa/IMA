import { SiteFooter, SiteHeader } from "@/components/site";
import { Button, Card } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/diagnostic/labels";
import { DATA_STORAGE_NOTE } from "@/lib/diagnostic/disclaimers";
import { CATEGORY_IDS } from "@/lib/diagnostic/types";
import { INDUSTRY_IDS, INDUSTRIES } from "@/lib/diagnostic/industries";
import { MODULES, MODULE_IDS, getModule } from "@/lib/diagnostic/modules";

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const sp = await searchParams;
  const mod = getModule(sp.module);
  const assessHref = mod.id === "marketready" ? "/assess" : `/assess?module=${mod.id}`;
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal">
                South Jersey · Greater Philadelphia{mod.id !== "marketready" ? ` · ${mod.name}` : ""}
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-navy md:text-5xl">{mod.headline}</h1>
              <p className="mt-5 max-w-xl text-lg text-muted">{mod.subhead}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href={assessHref}>Start the assessment</Button>
                <Button href="#how-it-works" variant="ghost">
                  See what it covers
                </Button>
              </div>
              <ul className="mt-8 grid gap-2 text-sm text-foreground sm:grid-cols-2">
                {["No quote request.", "No obligation.", "Preliminary findings shown immediately.", "Built for 3PL, warehousing, and light manufacturing."].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-0.5 text-good">
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Card className="self-center bg-sand/60">
              <h2 className="text-base font-semibold text-navy">What you get right away</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>An overall readiness score with a confidence indicator.</li>
                <li>Scores across six categories that underwriters actually evaluate.</li>
                <li>Three specific areas worth investigating before your next renewal.</li>
                <li>Your strengths, and whether they are making it into carrier submissions.</li>
              </ul>
              <p className="mt-4 text-xs text-muted">
                Optional: enter a work email afterwards to receive the detailed PDF report and a personalized preparation checklist.
              </p>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-lg font-semibold text-navy">Start with the question that is top of mind</h2>
          <p className="mt-1 text-sm text-muted">Every entry point runs the same assessment. The framing and the first findings you see change.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {MODULE_IDS.filter((id) => id !== "marketready").map((id) => (
              <a
                key={id}
                href={`/?module=${id}`}
                className={`rounded-lg border p-4 text-sm transition hover:border-navy ${mod.id === id ? "border-navy bg-navy/5" : "border-line bg-surface"}`}
              >
                <div className="font-semibold text-navy">{MODULES[id].name}</div>
                <div className="mt-1 text-muted">{MODULES[id].audience}</div>
              </a>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold text-navy">Six things the market looks at</h2>
          <p className="mt-2 max-w-2xl text-muted">
            The diagnostic asks three core questions in each category, plus a handful of follow-ups based on how your business operates.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_IDS.map((c) => (
              <Card key={c} as="div">
                <h3 className="font-semibold">{CATEGORY_LABELS[c].label}</h3>
                <p className="mt-1 text-sm text-muted">{CATEGORY_LABELS[c].description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-2xl font-semibold text-navy">Industry-specific by design</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {INDUSTRY_IDS.filter((id) => id !== "other").map((id) => (
                <Card key={id} as="div">
                  <h3 className="font-semibold">{INDUSTRIES[id].label}</h3>
                  <p className="mt-1 text-sm text-muted">{INDUSTRIES[id].description}</p>
                  <p className="mt-3 text-sm">{INDUSTRIES[id].marketNote}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-navy">What this is, and what it is not</h2>
              <p className="mt-3 text-sm text-muted">
                This is an educational self-assessment of your insurance-program governance and readiness. It is not a coverage opinion, audit,
                quotation, binder, or recommendation, and it cannot tell you whether you are overpaying. Pricing depends on policies, exposures,
                loss history, and carrier appetite that only a licensed review can evaluate.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-navy">Exactly what we store</h2>
              <p className="mt-3 text-sm text-muted">{DATA_STORAGE_NOTE}</p>
            </div>
          </div>
          <div className="mt-10">
            <Button href={assessHref}>Start the assessment</Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
