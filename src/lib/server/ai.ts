import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";

/**
 * Optional plain-English summary for the Producer Brief.
 *
 * Guardrails (from the product spec):
 * - Input is the structured, already-computed findings only.
 * - The model must not compute scores, interpret policy wording, estimate
 *   premium, or invent benchmarks. The system prompt says so and the caller
 *   only passes structured data.
 * - Disabled unless AI_SUMMARIES_ENABLED=true and an API key is present; the
 *   deterministic template summary is always the fallback.
 */
const SYSTEM_PROMPT = `You write short internal summaries for a commercial insurance producer at a brokerage.
You receive structured findings from a deterministic self-assessment that a prospect completed online.
Write 3 to 5 plain-English sentences a producer can read in 20 seconds before a call.

Rules you must follow:
- Use only the facts in the structured input. Do not add benchmarks, percentiles, statistics, or industry claims.
- Do not compute or restate numeric scores beyond what is given.
- Do not interpret policy wording, assess coverage adequacy, recommend limits or carriers, or estimate premium or savings.
- Describe what the answers suggest and what is worth confirming in a conversation.
- No headings, no bullet points, no preamble. Plain sentences only.`;

export interface AiSummaryInput {
  companyName: string;
  industryLabel: string;
  overall: number | null;
  confidence: number;
  findings: Array<{ title: string; body: string }>;
  strengths: string[];
  criticalFlags: string[];
  renewalMessage: string;
  primaryConcern: string | null;
}

export function aiSummariesAvailable(): boolean {
  return env.aiSummariesEnabled && Boolean(env.anthropicApiKey);
}

export async function generateAiSummary(input: AiSummaryInput): Promise<string | null> {
  if (!aiSummariesAvailable()) return null;
  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024, // deliberately short output: a 3-5 sentence summary
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Structured findings (JSON):\n${JSON.stringify(input, null, 2)}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || null;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.warn("[ai] rate limited; using template summary");
    else if (err instanceof Anthropic.APIError) console.error(`[ai] API error ${err.status}: ${err.message}`);
    else console.error("[ai] unexpected error", err);
    return null;
  }
}
