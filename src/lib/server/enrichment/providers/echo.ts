import { fetchJson } from "../http";
import { PUBLIC_RECORD_NOTE } from "@/lib/diagnostic";
import type { EnrichmentProvider, EnrichmentSignal, ProviderInput } from "../types";

/**
 * EPA ECHO: facilities matching the company name in the company's ZIP.
 * Two-step public service (facility search -> query id -> rows). No key.
 * Matching is by name + ZIP, shown transparently with the registry link and
 * the mandatory "verify identity and context" caveat. Never a risk grade.
 */
interface EchoSearch {
  Results?: { Message?: string; QueryID?: string; QueryRows?: string };
}
interface EchoFacility {
  FacName?: string;
  FacStreet?: string;
  FacCity?: string;
  FacState?: string;
  FacZip?: string;
  RegistryID?: string;
  FacNAICSCodes?: string | null;
  FacInspectionCount?: string | null;
  FacDateLastInspection?: string | null;
  FacPenaltyCount?: string | null;
  FacDateLastFormalAction?: string | null;
  FacSNCFlg?: string | null;
  FacComplianceStatus?: string | null;
}
interface EchoRows {
  Results?: { Facilities?: EchoFacility[] };
}

export function parseEchoFacilities(json: EchoRows, max = 3): EchoFacility[] {
  return (json.Results?.Facilities ?? []).slice(0, max);
}

export function echoFacilityToSignal(f: EchoFacility): EnrichmentSignal {
  const parts = [
    [f.FacStreet, f.FacCity, f.FacState].filter(Boolean).join(", "),
    f.FacNAICSCodes ? `NAICS ${f.FacNAICSCodes}` : null,
    `${f.FacInspectionCount ?? "0"} inspection(s) on record${f.FacDateLastInspection ? `, last ${f.FacDateLastInspection}` : ""}`,
    f.FacPenaltyCount && f.FacPenaltyCount !== "0" ? `${f.FacPenaltyCount} penalty record(s)` : null,
    f.FacDateLastFormalAction ? `last formal action ${f.FacDateLastFormalAction}` : null,
    f.FacComplianceStatus ? `status: ${f.FacComplianceStatus}` : null,
  ].filter(Boolean);
  return {
    source: "epa_echo",
    label: `EPA facility record: ${f.FacName ?? "unnamed"}`,
    value: parts.join(" · "),
    caveat: PUBLIC_RECORD_NOTE,
    sourceUrl: f.RegistryID ? `https://echo.epa.gov/detailed-facility-report?fid=${f.RegistryID}` : "https://echo.epa.gov/",
  };
}

/** Uses the first two distinctive words of the company name for a tolerant match. */
export function echoNameQuery(companyName: string): string {
  const stop = new Set(["inc", "llc", "corp", "co", "company", "the", "ltd", "lp", "group", "holdings"]);
  const words = companyName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !stop.has(w));
  return words.slice(0, 2).join(" ");
}

export const echoProvider: EnrichmentProvider = {
  id: "echo",
  label: "EPA ECHO facility records",
  enabled: () => true,
  applies: (i) => Boolean(i.companyName && i.zip),
  async run(input: ProviderInput): Promise<EnrichmentSignal[]> {
    const q = echoNameQuery(input.companyName ?? "");
    if (!q) return [];
    const zip = (input.zip ?? "").slice(0, 5);
    const search = await fetchJson<EchoSearch>(
      `https://echodata.epa.gov/echo/echo_rest_services.get_facilities?output=JSON&p_zip=${zip}&p_fn=${encodeURIComponent(q)}`,
      { timeoutMs: 5000 },
    );
    const qid = search.Results?.QueryID;
    const rows = Number(search.Results?.QueryRows ?? 0);
    if (!qid || !rows) return [];
    // Too many name hits means the name is generic for that ZIP; skip rather than mis-attribute.
    if (rows > 10) return [];
    const list = await fetchJson<EchoRows>(
      `https://echodata.epa.gov/echo/echo_rest_services.get_qid?output=JSON&qid=${encodeURIComponent(qid)}&pageno=1&responseset=3`,
      { timeoutMs: 5000 },
    );
    return parseEchoFacilities(list).map(echoFacilityToSignal);
  },
};
