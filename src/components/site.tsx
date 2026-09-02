import Link from "next/link";
import { RESULTS_DISCLAIMER } from "@/lib/diagnostic/disclaimers";

/**
 * Branding defaults to IMA Financial Group (approved 2026-09-02). Override
 * with NEXT_PUBLIC_BRAND_NAME / NEXT_PUBLIC_BRAND_LOGO_URL; set
 * NEXT_PUBLIC_BRAND_NAME="none" for a neutral, unbranded build.
 */
const rawBrand = process.env.NEXT_PUBLIC_BRAND_NAME?.trim();
export const BRAND_NAME = rawBrand === "none" ? "" : rawBrand || "IMA Financial Group";
export const BRAND_LOGO_URL = rawBrand === "none" ? "" : process.env.NEXT_PUBLIC_BRAND_LOGO_URL?.trim() || "/brand/ima-mark.svg";
export const PRODUCT_NAME = "MarketReady Risk Diagnostic";

export function SiteHeader() {
  return (
    <header className="no-print border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {BRAND_LOGO_URL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={BRAND_LOGO_URL} alt={BRAND_NAME || PRODUCT_NAME} className="h-8 w-auto flex-none sm:h-9" />
          ) : (
            <span className="inline-block h-7 w-7 rounded-md bg-navy" aria-hidden="true" />
          )}
          <span className="flex min-w-0 flex-col leading-tight">
            {BRAND_NAME ? <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{BRAND_NAME}</span> : null}
            <span className="truncate text-sm font-semibold tracking-tight text-navy sm:text-base">{PRODUCT_NAME}</span>
          </span>
        </Link>
        <nav className="flex flex-none items-center gap-3 text-sm text-muted sm:gap-5">
          <Link href="/#how-it-works" className="hidden hover:text-navy sm:inline">
            How it works
          </Link>
          <Link href="/privacy" className="hidden hover:text-navy sm:inline">
            Privacy
          </Link>
          <Link href="/assess" className="whitespace-nowrap rounded-md bg-navy px-3 py-1.5 font-semibold text-white hover:bg-navy-deep">
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start assessment</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted sm:px-5">
        <p className="max-w-3xl">{RESULTS_DISCLAIMER}</p>
        <p className="mt-3">
          {BRAND_NAME ? `© ${new Date().getFullYear()} ${BRAND_NAME}. Confidential | For discussion purposes only.` : "Unbranded build."} ·{" "}
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
