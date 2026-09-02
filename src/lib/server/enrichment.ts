import "server-only";
import { classifyZip, getIndustry, normalizeDomain, TERRITORY_LABELS } from "@/lib/diagnostic";
import type { IndustryId } from "@/lib/diagnostic";
import type { EnrichmentRecord, EnrichmentSignal } from "./repo/types";

export interface EnrichmentInput {
  website?: string | null;
  zip?: string | null;
  industry?: IndustryId | null;
  companyName?: string | null;
}

/**
 * Version-one enrichment is deliberately limited to deterministic, local
 * signals: domain normalization, territory classification, and NAICS
 * mapping. Public-data sources (FEMA flood, EPA ECHO, FMCSA SAFER, Census)
 * are "build later" and plug in through `externalSignals()`.
 *
 * Any public-record match must carry the verification caveat and must never
 * be turned into a risk grade.
 */
export async function enrichCompany(input: EnrichmentInput): Promise<EnrichmentRecord> {
  const domain = normalizeDomain(input.website);
  const territory = classifyZip(input.zip);
  const industry = input.industry ? getIndustry(input.industry) : null;
  const signals: EnrichmentSignal[] = [];

  if (domain) signals.push({ source: "website", label: "Normalized domain", value: domain });
  signals.push({ source: "zip", label: "Territory", value: TERRITORY_LABELS[territory] });
  if (industry && industry.naics.length) {
    signals.push({ source: "industry", label: "Likely NAICS", value: industry.naics.join(", ") });
  }
  signals.push(...(await externalSignals(input)));

  return {
    domain,
    territory,
    territoryLabel: TERRITORY_LABELS[territory],
    naics: industry?.naics ?? [],
    signals,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Placeholder for public-data enrichment. Returns no signals in version one.
 * When enabled, each signal must include `caveat: PUBLIC_RECORD_NOTE`.
 */
async function externalSignals(_input: EnrichmentInput): Promise<EnrichmentSignal[]> {
  void _input;
  return [];
}
