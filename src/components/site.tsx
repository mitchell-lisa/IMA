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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          {BRAND_LOGO_URL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={BRAND_LOGO_URL} alt={BRAND_NAME || PRODUCT_NAME} className="h-9 w-auto" />
          ) : (
            <span className="inline-block h-7 w-7 rounded-md bg-navy" aria-hidden="true" />
          )}
          <span className="flex flex-col leading-tight">
            {BRAND_NAME ? <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{BRAND_NAME}</span> : null}
            <span className="text-base font-semibold tracking-tight text-navy">{PRODUCT_NAME}</span>
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
