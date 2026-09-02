import type { EnrichmentProvider } from "../types";
import { censusProvider } from "./census";
import { echoProvider } from "./echo";
import { fmcsaProvider } from "./fmcsa";
import { nriProvider } from "./nri";
import { websiteProvider } from "./website";

/**
 * Registry. A provider runs only when it is listed in ENRICHMENT_PROVIDERS
 * (comma-separated ids, or "all") and reports enabled() (keys present).
 * Order is display order.
 */
export const PROVIDERS: EnrichmentProvider[] = [nriProvider, censusProvider, echoProvider, fmcsaProvider, websiteProvider];

export function activeProviders(): EnrichmentProvider[] {
  const wanted = (process.env.ENRICHMENT_PROVIDERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (wanted.length === 0) return [];
  return PROVIDERS.filter((p) => (wanted.includes("all") || wanted.includes(p.id)) && p.enabled());
}
