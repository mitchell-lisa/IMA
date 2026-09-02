import Anthropic from "@anthropic-ai/sdk";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { env } from "../../env";
import type { EnrichmentProvider, EnrichmentSignal, ProviderInput } from "../types";

/**
 * Company website summary. Fetches the homepage server-side (with SSRF
 * guards, size and time limits) and asks Claude for a factual summary of
 * locations, services, acquisitions, hiring, and new facilities. Output is
 * labeled with the URL and fetch date, per the plan. Requires
 * AI_SUMMARIES_ENABLED=true and an API key.
 */
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?|172\.(1[6-9]|2\d|3[01])\.)/i;

/** True for loopback, link-local, private, multicast, or unspecified addresses (v4 and v6). */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (v === 6) {
    const x = ip.toLowerCase();
    if (x === "::" || x === "::1") return true;
    if (x.startsWith("fe80:") || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("ff")) return true;
    if (x.startsWith("::ffff:")) return isPrivateIp(x.slice(7));
    return false;
  }
  return true; // not an IP at all: treat as unsafe
}

/** Hostname-level check for a user-supplied domain (no DNS). */
export function safePublicUrl(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const host = domain.toLowerCase().trim();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
  if (PRIVATE_HOST.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  return `https://${host}/`;
}

/** Resolves a URL's host and rejects anything that is not a public address. */
export async function assertPublicDestination(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (PRIVATE_HOST.test(host)) return false;
  if (isIP(host)) return !isPrivateIp(host);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return false;
  try {
    const addrs = await lookup(host, { all: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

/**
 * Fetches with redirects handled manually so every hop is validated against
 * the public-address check (blind-SSRF guard). Returns null when any hop is
 * unsafe, non-HTML, or too slow.
 */
export async function fetchPublicHtml(startUrl: string, opts: { timeoutMs?: number; maxHops?: number; maxBytes?: number } = {}): Promise<{ url: string; html: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 6000);
  try {
    let current = new URL(startUrl);
    for (let hop = 0; hop <= (opts.maxHops ?? 3); hop++) {
      if (!(await assertPublicDestination(current))) return null;
      const res = await fetch(current, { signal: controller.signal, redirect: "manual", headers: { "User-Agent": `MarketReadyDiagnostic/0.1 (+${env.appUrl})` } });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return null;
        current = new URL(loc, current);
        continue;
      }
      if (!res.ok) return null;
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("text/html")) return null;
      const html = (await res.text()).slice(0, opts.maxBytes ?? 400_000);
      return { url: current.toString(), html };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function htmlToText(html: string, max = 12000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const SYSTEM = `You summarize a company's public website for an insurance producer preparing for a first conversation.
Report only what the page states: locations, services or products, customers or industries served, acquisitions, hiring, new facilities, certifications.
Write 2 to 4 plain sentences. No speculation, no risk judgments, no coverage or pricing commentary. If the page says little, say so in one sentence.`;

export const websiteProvider: EnrichmentProvider = {
  id: "website",
  label: "Company website summary",
  enabled: () => env.aiSummariesEnabled && Boolean(env.anthropicApiKey),
  applies: (i) => Boolean(i.domain),
  async run(input: ProviderInput): Promise<EnrichmentSignal[]> {
    const start = safePublicUrl(input.domain);
    if (!start) return [];
    const page = await fetchPublicHtml(start);
    if (!page) return [];
    const url = page.url;
    const text = htmlToText(page.html);
    if (text.length < 200) return [];
    const client = new Anthropic({ apiKey: env.anthropicApiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024, // short factual summary
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: `Website: ${url}\n\nPage text:\n${text}` }],
    });
    if (response.stop_reason === "refusal") return [];
    const summary = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();
    if (!summary) return [];
    const date = new Date().toISOString().slice(0, 10);
    return [
      {
        source: "website",
        label: `Website summary (${url}, fetched ${date})`,
        value: summary,
        caveat: "AI-drafted from the public homepage only; verify before relying on it.",
        sourceUrl: url,
      },
    ];
  },
};
