import { SiteFooter, SiteHeader } from "@/components/site";
import { Button, Card } from "@/components/ui";

export default function ResultsNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-16">
        <Card>
          <h1 className="text-xl font-semibold text-navy">We could not find those results</h1>
          <p className="mt-2 text-sm text-muted">The link may be incomplete, or the assessment was not finished. Results links are private and unguessable, so check the address you were sent.</p>
          <div className="mt-5">
            <Button href="/assess">Start a new assessment</Button>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
