import { cached, fetchJson } from "../http";
import type { EnrichmentProvider, EnrichmentSignal, ProviderInput } from "../types";

/**
 * Census County/ZIP Business Patterns: establishment counts and employment
 * for the prospect's NAICS in their ZIP. Requires CENSUS_API_KEY. Results
 * are cached server-side for a day and presented as local context only.
 */
export const CENSUS_NOTE = "Local business-pattern context from the U.S. Census Bureau; describes the area, not this company.";

type CbpRow = string[];

export function parseCbp(rows: CbpRow[]): { naics: string; label: string; establishments: number; employment: number | null }[] {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const header = rows[0];
  const iEstab = header.indexOf("ESTAB");
  const iEmp = header.indexOf("EMP");
  const iLabel = header.indexOf("NAICS2017_LABEL");
  const iNaics = header.indexOf("NAICS2017");
  return rows.slice(1).map((r) => ({
    naics: iNaics >= 0 ? r[iNaics] : "",
    label: iLabel >= 0 ? r[iLabel] : "",
    establishments: Number(r[iEstab] ?? 0),
    employment: iEmp >= 0 && r[iEmp] !== null && r[iEmp] !== "" ? Number(r[iEmp]) : null,
  }));
}

export const censusProvider: EnrichmentProvider = {
  id: "census",
  label: "Census County Business Patterns",
  enabled: () => Boolean(process.env.CENSUS_API_KEY),
  applies: (i) => Boolean(i.zip && i.naics && i.naics.length),
  async run(input: ProviderInput): Promise<EnrichmentSignal[]> {
    const zip = (input.zip ?? "").slice(0, 5);
    // Use the broadest NAICS prefix available (3-digit sector/subsector) for a usable sample.
    const naics = (input.naics ?? []).map((n) => n.slice(0, 3)).find(Boolean);
    if (!naics) return [];
    const key = process.env.CENSUS_API_KEY!;
    const url = `https://api.census.gov/data/2022/cbp?get=ESTAB,EMP,NAICS2017_LABEL&for=zip%20code:${zip}&NAICS2017=${naics}&key=${encodeURIComponent(key)}`;
    const rows = await cached(`cbp:${zip}:${naics}`, 24 * 60 * 60 * 1000, () => fetchJson<CbpRow[]>(url, { timeoutMs: 5000 }));
    const parsed = parseCbp(rows);
    if (!parsed.length) return [];
    const p = parsed[0];
    return [
      {
        source: "census",
        label: `Establishments in ZIP ${zip}, NAICS ${p.naics}`,
        value: `${p.establishments} establishment${p.establishments === 1 ? "" : "s"}${p.employment !== null ? `, ${p.employment} employees` : ""} (${p.label})`,
        caveat: CENSUS_NOTE,
        sourceUrl: `https://www.census.gov/programs-surveys/cbp.html`,
      },
    ];
  },
};
