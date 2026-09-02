import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { getProducerSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Producer dashboard", robots: { index: false, follow: false } };

export default async function ProducerLayout({ children }: { children: React.ReactNode }) {
  const session = await getProducerSession();
  if (!session) redirect("/producer/login");
  return (
    <>
      <header className="border-b border-line bg-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-6">
            <Link href="/producer" className="text-sm font-semibold tracking-tight">
              IMA · MarketReady Producer dashboard
            </Link>
            <nav className="flex gap-4 text-sm text-white/80">
              <Link href="/producer" className="hover:text-white">
                Leads
              </Link>
              <Link href="/producer/submissions" className="hover:text-white">
                All submissions
              </Link>
              <Link href="/api/producer/leads/export" prefetch={false} className="hover:text-white">
                Export leads CSV
              </Link>
              <Link href="/api/producer/export/answers" prefetch={false} className="hover:text-white">
                Export answers CSV
              </Link>
              <Link href="/" className="hover:text-white">
                Public site
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/80">
            <span>{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
      <footer className="border-t border-line px-5 py-4 text-center text-xs text-muted">
        Internal use only. Every qualified lead requires manual review by a licensed professional before any coverage discussion.
      </footer>
    </>
  );
}
