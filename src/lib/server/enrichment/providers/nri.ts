import { cached, fetchJson } from "../http";
import type { EnrichmentProvider, EnrichmentSignal, ProviderInput } from "../types";

/**
 * FEMA National Risk Index, county level, via the public ArcGIS feature
 * service. Displayed as location context only, never as an insurability
 * conclusion (plan requirement). No key required; cached per county.
 */
export const NRI_NOTE =
  "Community hazard context for the county from FEMA's National Risk Index. Describes the area, not this company's insurability or coverage.";

const SERVICE = "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query";

const HAZARDS: Array<[field: string, label: string]> = [
  ["CFLD_RISKR", "Coastal flooding"],
  ["IFLD_RISKR", "Inland flooding"],
  ["HRCN_RISKR", "Hurricane"],
  ["WNTW_RISKR", "Winter weather"],
  ["ISTM_RISKR", "Ice storm"],
  ["TRND_RISKR", "Tornado"],
  ["SWND_RISKR", "Strong wind"],
  ["HAIL_RISKR", "Hail"],
  ["LTNG_RISKR", "Lightning"],
  ["ERQK_RISKR", "Earthquake"],
];

export const NRI_FIELDS = ["STATEABBRV", "COUNTY", "STCOFIPS", "RISK_SCORE", "RISK_RATNG", "EAL_RATNG", "SOVI_RATNG", "RESL_RATNG", ...HAZARDS.map(([f]) => f)];

interface NriResponse {
  features?: Array<{ attributes: Record<string, string | number | null> }>;
  error?: { message?: string };
}

export interface NriSummary {
  county: string;
  state: string;
  fips: string;
  compositeRating: string | null;
  compositeScore: number | null;
  expectedAnnualLossRating: string | null;
  socialVulnerabilityRating: string | null;
  resilienceRating: string | null;
  notableHazards: Array<{ hazard: string; rating: string }>;
}

const NOTABLE = new Set(["Relatively High", "Very High", "Relatively Moderate"]);

export function parseNri(json: NriResponse): NriSummary | null {
  const a = json.features?.[0]?.attributes;
  if (!a) return null;
  const str = (k: string) => (a[k] === null || a[k] === undefined ? null : String(a[k]));
  const notable = HAZARDS.map(([f, label]) => ({ hazard: label, rating: str(f) ?? "" })).filter((h) => NOTABLE.has(h.rating));
  return {
    county: str("COUNTY") ?? "",
    state: str("STATEABBRV") ?? "",
    fips: str("STCOFIPS") ?? "",
    compositeRating: str("RISK_RATNG"),
    compositeScore: a["RISK_SCORE"] === null || a["RISK_SCORE"] === undefined ? null : Number(a["RISK_SCORE"]),
    expectedAnnualLossRating: str("EAL_RATNG"),
    socialVulnerabilityRating: str("SOVI_RATNG"),
    resilienceRating: str("RESL_RATNG"),
    notableHazards: notable,
  };
}

export function nriToSignals(s: NriSummary): EnrichmentSignal[] {
  const hazards = s.notableHazards.length ? s.notableHazards.map((h) => `${h.hazard}: ${h.rating.toLowerCase()}`).join("; ") : "no hazards rated relatively moderate or higher";
  return [
    {
      source: "fema_nri",
      label: `County hazard context: ${s.county} County, ${s.state}`,
      value: `Composite rating ${s.compositeRating ?? "n/a"}${s.compositeScore !== null ? ` (score ${Math.round(s.compositeScore)})` : ""}; expected annual loss ${s.expectedAnnualLossRating ?? "n/a"}; community resilience ${s.resilienceRating ?? "n/a"}. Notable hazards: ${hazards}.`,
      caveat: NRI_NOTE,
      sourceUrl: `https://hazards.fema.gov/nri/map#${s.fips}`,
    },
  ];
}

export const nriProvider: EnrichmentProvider = {
  id: "nri",
  label: "FEMA National Risk Index",
  enabled: () => true,
  applies: (i) => Boolean(i.geo),
  async run(input: ProviderInput): Promise<EnrichmentSignal[]> {
    const { lat, lon } = input.geo!;
    const key = `nri:${lat.toFixed(2)},${lon.toFixed(2)}`;
    const url = `${SERVICE}?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=${NRI_FIELDS.join(",")}&returnGeometry=false&f=json`;
    const json = await cached(key, 7 * 24 * 60 * 60 * 1000, () => fetchJson<NriResponse>(url, { timeoutMs: 5000 }));
    if (json.error) throw new Error(json.error.message ?? "NRI error");
    const summary = parseNri(json);
    return summary ? nriToSignals(summary) : [];
  },
};
