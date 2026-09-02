import "server-only";
import { classifyZip, getIndustry, normalizeDomain, territoryLabel } from "@/lib/diagnostic";
import type { IndustryId } from "@/lib/diagnostic";
import type { EnrichmentRecord, EnrichmentSignal } from "../repo/types";
import { cached, fetchJson } from "./http";
import { activeProviders } from "./providers";
import type { ProviderInput } from "./types";

/** Provider id -> the `source` tag its signals carry. */
const SIGNAL_SOURCE: Record<string, string> = { nri: "fema_nri", echo: "epa_echo", census: "census", website: "website" };

export interface EnrichmentInput {
  website?: string | null;
  zip?: string | null;
  industry?: IndustryId | null;
  companyName?: string | null;
}

/**
 * Local, deterministic enrichment used at assessment start: domain
 * normalization, territory classification, NAICS candidates.
 */
export async function enrichCompany(input: EnrichmentInput): Promise<EnrichmentRecord> {
  const domain = normalizeDomain(input.website);
  const territory = classifyZip(input.zip);
  const industry = input.industry ? getIndustry(input.industry) : null;
  const signals: EnrichmentSignal[] = [];

  if (domain) signals.push({ source: "website", label: "Normalized domain", value: domain });
  signals.push({ source: "zip", label: "State", value: territoryLabel(territory) });
  if (industry && industry.naics.length) signals.push({ source: "industry", label: "Likely NAICS", value: industry.naics.join(", ") });

  return {
    domain,
    territory,
    territoryLabel: territoryLabel(territory),
    naics: industry?.naics ?? [],
    signals,
    providersRun: [],
    computedAt: new Date().toISOString(),
  };
}

interface ZipGeo {
  places?: Array<{ latitude: string; longitude: string; "place name": string; "state abbreviation": string }>;
}

/** ZIP -> centroid via the free Zippopotam service (cached 30 days). */
async function geocodeZip(zip: string | null | undefined): Promise<ProviderInput["geo"]> {
  const z = (zip ?? "").slice(0, 5);
  if (!/^\d{5}$/.test(z)) return null;
  try {
    const json = await cached(`zip:${z}`, 30 * 24 * 60 * 60 * 1000, () => fetchJson<ZipGeo>(`https://api.zippopotam.us/us/${z}`, { timeoutMs: 4000 }));
    const p = json.places?.[0];
    if (!p) return null;
    return { lat: Number(p.latitude), lon: Number(p.longitude), city: p["place name"], state: p["state abbreviation"] };
  } catch {
    return null;
  }
}

/**
 * External public-data enrichment, run once at completion. Each provider is
 * opt-in via ENRICHMENT_PROVIDERS, time-boxed, and isolated: a failure in one
 * never blocks results. Public-record matches always carry a caveat and are
 * shown to producers only.
 */
export async function enrichExternal(base: EnrichmentRecord, input: EnrichmentInput): Promise<EnrichmentRecord> {
  const providers = activeProviders();
  if (providers.length === 0) return base;
  const geo = await geocodeZip(input.zip);
  const pInput: ProviderInput = {
    companyName: input.companyName,
    website: input.website,
    domain: base.domain,
    zip: input.zip,
    industry: input.industry ?? null,
    naics: base.naics,
    geo,
  };
  const applicable = providers.filter((p) => p.applies(pInput));
  const results = await Promise.allSettled(applicable.map((p) => p.run(pInput)));
  // Drop any prior signals from providers that are re-running, keep local ones.
  const rerunSources = new Set(applicable.map((p) => SIGNAL_SOURCE[p.id] ?? p.id));
  const signals: EnrichmentSignal[] = base.signals.filter((s) => !rerunSources.has(s.source));
  const providersRun: string[] = [];
  results.forEach((r, i) => {
    const p = applicable[i];
    if (r.status === "fulfilled") {
      providersRun.push(p.id);
      signals.push(...r.value);
    } else {
      console.warn(`[enrichment:${p.id}] ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
    }
  });
  return {
    ...base,
    geo: geo ? { lat: geo.lat, lon: geo.lon, city: geo.city ?? null, state: geo.state ?? null } : (base.geo ?? null),
    signals,
    providersRun,
    computedAt: new Date().toISOString(),
  };
}
