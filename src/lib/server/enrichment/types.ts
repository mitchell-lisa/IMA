import type { IndustryId } from "@/lib/diagnostic";
import type { EnrichmentSignal } from "../repo/types";

export interface ProviderInput {
  companyName?: string | null;
  website?: string | null;
  domain?: string | null;
  zip?: string | null;
  industry?: IndustryId | null;
  naics?: string[];
  hasVehicles?: boolean;
  /** Filled by the geocode step when available. */
  geo?: { lat: number; lon: number; city?: string; state?: string } | null;
}

export interface EnrichmentProvider {
  id: string;
  label: string;
  /** Whether the provider has what it needs (keys, flags) to run. */
  enabled(): boolean;
  /** Whether this input is worth querying (e.g. FMCSA only for fleets). */
  applies(input: ProviderInput): boolean;
  run(input: ProviderInput): Promise<EnrichmentSignal[]>;
}

export type { EnrichmentSignal };
