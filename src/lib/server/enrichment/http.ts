import "server-only";
import { env } from "../env";

const USER_AGENT = process.env.ENRICHMENT_USER_AGENT?.trim() || `MarketReadyDiagnostic/0.1 (+${env.appUrl})`;

/** JSON fetch with timeout and a descriptive user agent (SEC and others require one). */
export async function fetchJson<T = unknown>(url: string, opts: { timeoutMs?: number; headers?: Record<string, string> } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 4000);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": USER_AGENT, ...(opts.headers ?? {}) }, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------- tiny TTL cache
interface Entry<T> {
  value: T;
  expires: number;
}
const store = new Map<string, Entry<unknown>>();
const MAX = 2000;

/** Server-side cache for benchmark-style lookups (Census, NRI). */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) return hit.value;
  const value = await fn();
  if (store.size >= MAX) store.clear();
  store.set(key, { value, expires: now + ttlMs });
  return value;
}

export function clearEnrichmentCache() {
  store.clear();
}
