import { fetchJson } from "../http";
import { PUBLIC_RECORD_NOTE } from "@/lib/diagnostic";
import type { EnrichmentProvider, EnrichmentSignal, ProviderInput } from "../types";

/**
 * FMCSA QCMobile: carrier registration and safety data by legal name.
 * Requires FMCSA_WEB_KEY. Only runs for prospects who report vehicles.
 * Name matches are shown with the public-record caveat; never as a grade.
 */
interface QcCarrier {
  legalName?: string;
  dbaName?: string;
  dotNumber?: number | string;
  phyCity?: string;
  phyState?: string;
  phyZipcode?: string;
  safetyRating?: string | null;
  totalDrivers?: number | null;
  totalPowerUnits?: number | null;
  allowedToOperate?: string;
  statusCode?: string;
}
interface QcResponse {
  content?: Array<{ carrier?: QcCarrier }>;
}

export function parseFmcsa(json: QcResponse, zip: string | null | undefined): QcCarrier[] {
  const carriers = (json.content ?? []).map((c) => c.carrier).filter((c): c is QcCarrier => Boolean(c));
  const z = (zip ?? "").slice(0, 5);
  // Prefer carriers in the same ZIP; otherwise first three name matches.
  const sameZip = z ? carriers.filter((c) => String(c.phyZipcode ?? "").startsWith(z)) : [];
  return (sameZip.length ? sameZip : carriers).slice(0, 3);
}

export const fmcsaProvider: EnrichmentProvider = {
  id: "fmcsa",
  label: "FMCSA carrier registration",
  enabled: () => Boolean(process.env.FMCSA_WEB_KEY),
  applies: (i) => Boolean(i.companyName) && (i.hasVehicles === true || i.industry === "logistics_3pl"),
  async run(input: ProviderInput): Promise<EnrichmentSignal[]> {
    const name = encodeURIComponent((input.companyName ?? "").trim().slice(0, 80));
    const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/name/${name}?webKey=${encodeURIComponent(process.env.FMCSA_WEB_KEY!)}`;
    const json = await fetchJson<QcResponse>(url, { timeoutMs: 5000 });
    return parseFmcsa(json, input.zip).map((c) => ({
      source: "fmcsa",
      label: `USDOT ${c.dotNumber ?? "?"} · ${c.legalName ?? c.dbaName ?? "carrier"}`,
      value: [
        c.phyCity && c.phyState ? `${c.phyCity}, ${c.phyState}` : null,
        c.totalPowerUnits !== null && c.totalPowerUnits !== undefined ? `${c.totalPowerUnits} power units` : null,
        c.totalDrivers !== null && c.totalDrivers !== undefined ? `${c.totalDrivers} drivers` : null,
        c.safetyRating ? `safety rating: ${c.safetyRating}` : "no safety rating on file",
        c.allowedToOperate ? `allowed to operate: ${c.allowedToOperate}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      caveat: PUBLIC_RECORD_NOTE,
      sourceUrl: c.dotNumber ? `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${c.dotNumber}` : "https://safer.fmcsa.dot.gov/",
    }));
  },
};
