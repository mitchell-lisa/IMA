/**
 * Bundles the approved question logic, findings language, scoring rules,
 * workshop methodology, and AI prompt text into one Markdown file. This is
 * the grounding document for an internal "Producer Brief Agent" (Copilot
 * custom agent) and for Prompt Coach review. Generated; do not edit by hand.
 */
import { readFileSync } from "node:fs";
import { QUESTIONS } from "../src/lib/diagnostic/questions";
import { FINDING_RULES } from "../src/lib/diagnostic/findings";
import { INDUSTRIES } from "../src/lib/diagnostic/industries";
import { CATEGORY_LABELS } from "../src/lib/diagnostic/labels";
import { CATEGORY_IDS } from "../src/lib/diagnostic/types";
import { DATA_STORAGE_NOTE, NO_BENCHMARK_NOTE, PRICING_NOTE, PUBLIC_RECORD_NOTE, RESULTS_DISCLAIMER } from "../src/lib/diagnostic/disclaimers";

const L: string[] = [];
const h = (s: string) => L.push("", s, "");

L.push("# MarketReady Risk Diagnostic — agent knowledge pack", "", `Generated ${new Date().toISOString().slice(0, 10)} from the code. Regenerate with \`npm run docs:pack\`. Source of truth: \`src/lib/diagnostic\`.`);

h("## 1. Purpose and boundaries");
L.push("The diagnostic is an educational self-assessment of insurance-program governance and readiness. It is not a coverage opinion, audit, quotation, binder, or recommendation.");
L.push("", "An agent grounded in this pack may: summarize structured findings in plain English, draft outreach that references the prospect's own answers, prepare a workshop agenda, and answer questions about how scores are computed.");
L.push("", "An agent grounded in this pack must not: interpret policy wording or exclusions, state whether coverage is adequate, recommend limits, deductibles, retentions, carriers, or program structure, assess whether a claim is covered, compare premium to alternatives, or make representations about insurability or savings. Those are licensed-professional tasks.");
L.push("", "Required disclaimers:", `- ${RESULTS_DISCLAIMER}`, `- ${PRICING_NOTE}`, `- ${NO_BENCHMARK_NOTE}`, `- Public records: ${PUBLIC_RECORD_NOTE}`, `- Data: ${DATA_STORAGE_NOTE}`);

h("## 2. Categories and industries");
for (const c of CATEGORY_IDS) L.push(`- **${CATEGORY_LABELS[c].label}** (${c}): ${CATEGORY_LABELS[c].description}`);
L.push("");
for (const i of Object.values(INDUSTRIES)) L.push(`- **${i.label}** (${i.id}): ${i.description} NAICS ${i.naics.join(", ") || "n/a"}. Category weights: ${CATEGORY_IDS.map((c) => `${CATEGORY_LABELS[c].short} ${i.categoryWeights[c]}`).join(", ")}. Market note: ${i.marketNote}`);

h("## 3. Scoring rules");
L.push(readFileSync("docs/scoring-spec.md", "utf8").replace(/^# Scoring specification\s*/m, "").replace(/^## /gm, "### "));

h("## 4. Question bank (approved wording)");
for (const q of QUESTIONS) {
  L.push(`### ${q.topic} — \`${q.id}\``, `Category: ${CATEGORY_LABELS[q.category].label}${q.branch ? ` · Branch: ${q.branch}` : ""} · Weights (3PL/Mfg/Other): ${q.weights.logistics_3pl}/${q.weights.light_manufacturing}/${q.weights.other}${q.critical ? ` · Critical flag at ≤${q.critical.atOrBelow}` : ""}`, "", q.prompt);
  if (q.help) L.push("", `_${q.help}_`);
  L.push("");
  for (const o of q.options) L.push(`- ${o.value}: ${o.label}`);
  if (q.critical) L.push("", `Critical flag message: ${q.critical.message}`);
  for (const [ind, v] of Object.entries(q.variants ?? {})) {
    L.push("", `Variant (${ind}):${v.prompt ? ` ${v.prompt}` : ""}${v.help ? ` _${v.help}_` : ""}`);
  }
  L.push("");
}

h("## 5. Findings library (approved language)");
L.push("Each finding is triggered deterministically by the answers listed. Use the wording as written; do not add benchmarks or statistics.");
for (const f of FINDING_RULES) {
  L.push("", `### ${f.title}`, `Id \`${f.id}\` · Category ${f.category === "overall" ? "overall" : CATEGORY_LABELS[f.category].label} · Base priority ${f.priority} · Based on: ${f.questionIds.join(", ")}`, "", f.body);
  if (f.detail) L.push("", f.detail);
}

h("## 6. Workshop methodology");
L.push(readFileSync("docs/workshop-crosswalk.md", "utf8").replace(/^# Workshop crosswalk\s*/m, "").replace(/^## /gm, "### "));

h("## 7. Producer Brief structure");
L.push("1. Account snapshot · 2. Why this lead matters · 3. Top three potential opportunities · 4. Stated pain points · 5. Business-change signals · 6. Renewal and incumbent context · 7. Recommended opening questions · 8. Suggested specialist participants · 9. Proposed 45-minute workshop agenda (+ seven-step workshop path, service-plan themes) · 10. Lead quality score (sales prioritization only) · Workshop crosswalk · Diagnostic scores · Summary.");
L.push("", "Lead quality weights: company fit 25, seniority 20, renewal timing 20, demonstrated pain 20, engagement intent 10, data completeness 5. Tiers: A ≥ 70, B ≥ 50, C otherwise.");

h("## 8. Standard prompts used at runtime (for Prompt Coach review)");
L.push("**Brief summary prompt** (src/lib/server/ai.ts):", "", "```", readFileSync("src/lib/server/ai.ts", "utf8").match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/)?.[1] ?? "", "```");
L.push("", "**Website summary prompt** (src/lib/server/enrichment/providers/website.ts):", "", "```", readFileSync("src/lib/server/enrichment/providers/website.ts", "utf8").match(/const SYSTEM = `([\s\S]*?)`;/)?.[1] ?? "", "```");
L.push("", "Both prompts receive structured or public input only, are limited to a few sentences, and never see policy documents.");

process.stdout.write(L.join("\n") + "\n");
