/**
 * Territory classification from ZIP code. This is a coarse prefix map for the
 * South Jersey / Greater Philadelphia launch footprint and is used for lead
 * fit scoring and dashboard filtering only.
 */
export type Territory =
  | "south_jersey"
  | "philadelphia"
  | "pa_suburbs"
  | "central_north_jersey"
  | "delaware"
  | "outside";

export const TERRITORY_LABELS: Record<Territory, string> = {
  south_jersey: "South Jersey",
  philadelphia: "Philadelphia",
  pa_suburbs: "Greater Philadelphia suburbs (PA)",
  central_north_jersey: "Central / North Jersey",
  delaware: "Delaware",
  outside: "Outside core territory",
};

const PREFIX_MAP: Array<{ prefixes: string[]; territory: Territory }> = [
  { prefixes: ["080", "081", "082", "083", "084"], territory: "south_jersey" },
  { prefixes: ["190", "191"], territory: "philadelphia" },
  { prefixes: ["189", "193", "194"], territory: "pa_suburbs" },
  { prefixes: ["070", "071", "072", "073", "074", "075", "076", "077", "078", "079", "085", "086", "087", "088", "089"], territory: "central_north_jersey" },
  { prefixes: ["197", "198", "199"], territory: "delaware" },
];

export function classifyZip(zip: string | undefined | null): Territory {
  if (!zip) return "outside";
  const clean = zip.replace(/[^0-9]/g, "").slice(0, 5);
  if (clean.length < 3) return "outside";
  const prefix = clean.slice(0, 3);
  for (const entry of PREFIX_MAP) {
    if (entry.prefixes.includes(prefix)) return entry.territory;
  }
  return "outside";
}

export function isCoreTerritory(t: Territory): boolean {
  return t === "south_jersey" || t === "philadelphia" || t === "pa_suburbs";
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
