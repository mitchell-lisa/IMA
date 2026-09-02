import Anthropic from "@anthropic-ai/sdk";
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

export function safePublicUrl(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const host = domain.toLowerCase().trim();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
  if (PRIVATE_HOST.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  return `https://${host}/`;
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
    const url = safePublicUrl(input.domain);
    if (!url) return [];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let text: string;
    try {
      const res = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "User-Agent": `MarketReadyDiagnostic/0.1 (+${env.appUrl})` } });
      if (!res.ok) return [];
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("text/html")) return [];
      const raw = (await res.text()).slice(0, 400_000);
      text = htmlToText(raw);
    } finally {
      clearTimeout(timer);
    }
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
