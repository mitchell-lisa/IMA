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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/producer" className="whitespace-nowrap text-sm font-semibold tracking-tight">
              <span className="sm:hidden">IMA · Producer</span>
              <span className="hidden sm:inline">IMA · MarketReady Producer dashboard</span>
            </Link>
            <nav className="-mx-1 flex max-w-full gap-4 overflow-x-auto whitespace-nowrap px-1 text-sm text-white/80 [scrollbar-width:none]">
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
            <span className="hidden max-w-[16rem] truncate md:inline">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-5 sm:py-8">{children}</main>
      <footer className="border-t border-line px-5 py-4 text-center text-xs text-muted">
        Internal use only. Every qualified lead requires manual review by a licensed professional before any coverage discussion.
      </footer>
    </>
  );
}
