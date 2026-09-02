/**
 * Location classification from ZIP code. Resolves a five-digit US ZIP to its
 * state using the three-digit prefix ranges published by USPS. The diagnostic
 * is not limited to any region; the state is used for the producer dashboard,
 * the CRM payload, and a small data-quality credit in lead fit scoring.
 */
export type Territory = string; // two-letter state or district code, or "unknown"

export const UNKNOWN_TERRITORY: Territory = "unknown";

export const TERRITORY_LABELS: Record<string, string> = {
  unknown: "Unknown",
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  PR: "Puerto Rico", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VT: "Vermont", VI: "U.S. Virgin Islands", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming",
};

/** Inclusive three-digit ZIP prefix ranges by state. */
const RANGES: Array<[number, number, string]> = [
  [5, 5, "NY"], [6, 7, "PR"], [8, 8, "VI"], [9, 9, "PR"],
  [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"], [50, 59, "VT"], [60, 69, "CT"],
  [70, 89, "NJ"], [100, 149, "NY"], [150, 196, "PA"], [197, 199, "DE"], [200, 205, "DC"], [206, 219, "MD"],
  [220, 246, "VA"], [247, 268, "WV"], [270, 289, "NC"], [290, 299, "SC"], [300, 319, "GA"], [320, 349, "FL"],
  [350, 369, "AL"], [370, 385, "TN"], [386, 397, "MS"], [398, 399, "GA"], [400, 427, "KY"], [430, 459, "OH"],
  [460, 479, "IN"], [480, 499, "MI"], [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"], [570, 577, "SD"],
  [580, 588, "ND"], [590, 599, "MT"], [600, 629, "IL"], [630, 658, "MO"], [660, 679, "KS"], [680, 693, "NE"],
  [700, 714, "LA"], [716, 729, "AR"], [730, 749, "OK"], [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"],
  [832, 838, "ID"], [840, 847, "UT"], [850, 865, "AZ"], [870, 884, "NM"], [885, 885, "TX"], [889, 898, "NV"],
  [900, 961, "CA"], [967, 968, "HI"], [970, 979, "OR"], [980, 994, "WA"], [995, 999, "AK"],
];

export function classifyZip(zip: string | undefined | null): Territory {
  if (!zip) return UNKNOWN_TERRITORY;
  const clean = zip.replace(/[^0-9]/g, "").slice(0, 5);
  if (clean.length < 3) return UNKNOWN_TERRITORY;
  const prefix = Number(clean.slice(0, 3));
  for (const [lo, hi, state] of RANGES) if (prefix >= lo && prefix <= hi) return state;
  return UNKNOWN_TERRITORY;
}

export function territoryLabel(t: Territory | null | undefined): string {
  return (t && TERRITORY_LABELS[t]) || TERRITORY_LABELS.unknown;
}

export function isKnownTerritory(t: Territory): boolean {
  return t !== UNKNOWN_TERRITORY && t in TERRITORY_LABELS;
}

/** Normalizes a user-entered website into a bare domain, or null. */
export function normalizeDomain(input: string | undefined | null): string | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (!s) return null;
  if (!/^https?:\/\//.test(s)) s = `https://${s}`;
  try {
    const host = new URL(s).hostname.replace(/^www\./, "");
    if (!host.includes(".")) return null;
    return host;
  } catch {
    return null;
  }
}
