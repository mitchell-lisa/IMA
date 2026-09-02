import { SiteFooter, SiteHeader } from "@/components/site";
import { AssessmentFlow } from "@/components/AssessmentFlow";

export const metadata = { title: "Assessment" };

export default function AssessPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <AssessmentFlow />
      </main>
      <SiteFooter />
    </>
  );
}
