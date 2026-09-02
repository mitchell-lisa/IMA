import { SiteFooter, SiteHeader } from "@/components/site";
import { Card } from "@/components/ui";
import { DATA_STORAGE_NOTE, RESULTS_DISCLAIMER } from "@/lib/diagnostic/disclaimers";

export const metadata = { title: "Privacy & data" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-5 py-12">
        <h1 className="text-3xl font-semibold text-navy">Privacy &amp; data</h1>
        <p className="mt-3 text-muted">Placeholder notice pending compliance review. It describes how the diagnostic handles information today.</p>
        <div className="mt-8 space-y-6">
          <Card>
            <h2 className="font-semibold">What we collect</h2>
            <p className="mt-2 text-sm text-muted">{DATA_STORAGE_NOTE}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>Company profile: name, website, ZIP code, industry, employee and revenue bands.</li>
              <li>Your answers to the assessment questions, including &ldquo;not sure&rdquo; selections.</li>
              <li>Optional profile details: renewal month, incumbent broker tenure, major lines, premium band, largest concern.</li>
              <li>If you request the report: your work email, name, role, phone (optional), and your consent choices with a timestamp.</li>
              <li>Technical: a hashed (not raw) IP address, browser user-agent, referral partner code, and campaign parameters.</li>
            </ul>
          </Card>
          <Card>
            <h2 className="font-semibold">What we do not collect</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>Policy documents, loss runs, or contracts. Document upload is not offered in this version.</li>
              <li>Exact premium figures. Only a band is requested and it is optional.</li>
              <li>Payment details or credentials of any kind.</li>
            </ul>
          </Card>
          <Card>
            <h2 className="font-semibold">How it is used</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>To calculate your results deterministically and display them to you.</li>
              <li>To send your PDF report and preparation checklist when you request them.</li>
              <li>With your separate opt-in, to contact you about a complimentary workshop or educational content.</li>
              <li>Every qualified lead is reviewed manually by a licensed professional before any coverage conversation.</li>
            </ul>
          </Card>
          <Card>
            <h2 className="font-semibold">Retention and deletion</h2>
            <p className="mt-2 text-sm text-muted">
              Assessments without an email address are purged after 90 days. Records associated with an email are retained under the
              brokerage&rsquo;s records policy. To request deletion, reply to your report email; the request is fulfilled by removing the
              assessment, answers, and contact record.
            </p>
          </Card>
          <Card>
            <h2 className="font-semibold">Security</h2>
            <p className="mt-2 text-sm text-muted">
              Data is encrypted in transit and at rest. Prospects never access the database directly; all reads and writes pass through server-side
              validation. Producer access requires authentication and is limited by row-level security.
            </p>
          </Card>
          <p className="text-xs text-muted">{RESULTS_DISCLAIMER}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
