import Link from "next/link";
import { RESULTS_DISCLAIMER } from "@/lib/diagnostic/disclaimers";

/**
 * Branding is env-driven so IMA marks appear only once compliance/marketing
 * approve. Leave NEXT_PUBLIC_BRAND_NAME unset for the neutral default.
 */
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "";
export const BRAND_LOGO_URL = process.env.NEXT_PUBLIC_BRAND_LOGO_URL?.trim() || "";
export const PRODUCT_NAME = "MarketReady Risk Diagnostic";

export function SiteHeader() {
  return (
    <header className="no-print border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          {BRAND_LOGO_URL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={BRAND_LOGO_URL} alt={BRAND_NAME || PRODUCT_NAME} className="h-8 w-auto" />
          ) : (
            <span className="inline-block h-7 w-7 rounded-md bg-navy" aria-hidden="true" />
          )}
          <span className="text-base font-semibold tracking-tight text-navy">
            {BRAND_NAME ? <span className="text-muted font-medium">{BRAND_NAME} · </span> : null}
            {PRODUCT_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/#how-it-works" className="hover:text-navy">
            How it works
          </Link>
          <Link href="/privacy" className="hover:text-navy">
            Privacy
          </Link>
          <Link href="/assess" className="rounded-md bg-navy px-3 py-1.5 font-semibold text-white hover:bg-navy-deep">
            Start assessment
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-8 text-xs text-muted">
        <p className="max-w-3xl">{RESULTS_DISCLAIMER}</p>
        <p className="mt-3">
          {BRAND_NAME ? `${BRAND_NAME} · Confidential | For discussion purposes only.` : "Branding, licensing statements, and legal entity names are placeholders pending compliance and marketing approval."} ·{" "}
          <Link href="/privacy" className="underline hover:text-navy">
            Privacy &amp; data
          </Link>{" "}
          ·{" "}
          <Link href="/producer/login" className="underline hover:text-navy">
            Producer sign-in
          </Link>
        </p>
      </div>
    </footer>
  );
}

export function Disclaimer({ className = "" }: { className?: string }) {
  return <p className={`text-xs text-muted ${className}`}>{RESULTS_DISCLAIMER}</p>;
}
