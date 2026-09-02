import { redirect } from "next/navigation";
import { ProducerLoginForm } from "@/components/ProducerLoginForm";
import { SiteFooter, SiteHeader } from "@/components/site";
import { Card } from "@/components/ui";
import { getProducerSession, producerAuthMode } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Producer sign-in", robots: { index: false } };

export default async function ProducerLoginPage() {
  const session = await getProducerSession();
  if (session) redirect("/producer");
  const mode = producerAuthMode();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <Card>
          <h1 className="text-xl font-semibold text-navy">Producer sign-in</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "supabase"
              ? "Enter your work email to receive a sign-in link."
              : mode === "passcode"
                ? "Development mode: enter your email and the shared passcode."
                : "Sign-in is not configured. Set Supabase Auth or PRODUCER_DEV_PASSCODE."}
          </p>
          <div className="mt-5">
            <ProducerLoginForm mode={mode} />
          </div>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
