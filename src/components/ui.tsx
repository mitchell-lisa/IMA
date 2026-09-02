import Link from "next/link";
import type { ReactNode } from "react";
import { SCORE_BAND_LABELS } from "@/lib/diagnostic/labels";
import type { ScoreBand } from "@/lib/diagnostic/types";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-navy-deep focus-visible:outline-navy",
  secondary: "bg-white text-navy border border-navy/30 hover:border-navy focus-visible:outline-navy",
  ghost: "text-navy hover:bg-navy/5 focus-visible:outline-navy",
};

export function Button({
  children,
  href,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variantClass[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function Card({ children, className = "", as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <Tag className={`rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>{children}</Tag>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "navy" }) {
  const tones = {
    neutral: "bg-foreground/5 text-foreground",
    good: "bg-good/10 text-good",
    warn: "bg-warn/10 text-warn",
    bad: "bg-bad/10 text-bad",
    navy: "bg-navy/10 text-navy",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-foreground">
        {label}
        {required ? <span className="text-bad"> *</span> : null}
      </span>
      {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted/70 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20";

const bandTone: Record<ScoreBand, "good" | "warn" | "bad"> = { strong: "good", improve: "warn", priority: "bad" };

const bandIcon: Record<ScoreBand, string> = { strong: "✓", improve: "→", priority: "!" };

export function BandPill({ band }: { band: ScoreBand | null }) {
  if (!band) return <Badge>Insufficient data</Badge>;
  return (
    <Badge tone={bandTone[band]}>
      <span aria-hidden="true" className="mr-1">
        {bandIcon[band]}
      </span>
      {SCORE_BAND_LABELS[band].label}
    </Badge>
  );
}

/**
 * Single-series horizontal meter. One hue (navy), value in text tokens, band
 * label carried by text + icon so identity is never color alone.
 */
export function ScoreMeter({ label, score, band, description }: { label: string; score: number | null; band: ScoreBand | null; description?: string }) {
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          {description ? <div className="text-xs text-muted">{description}</div> : null}
        </div>
        <div className="text-right">
          <span className="text-lg font-semibold tabular-nums">{score === null ? "—" : Math.round(score)}</span>
          <span className="text-xs text-muted"> / 100</span>
        </div>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score ?? undefined}
        aria-label={`${label} score`}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/8"
      >
        <div className="h-full rounded-full bg-navy transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2">
        <BandPill band={band} />
      </div>
    </div>
  );
}
