import { QUESTIONS } from "../src/lib/diagnostic/questions";
import { CATEGORY_LABELS } from "../src/lib/diagnostic/labels";
const lines: string[] = [];
lines.push("# Question matrix", "", "Generated from `src/lib/diagnostic/questions.ts`. Regenerate with `npm run docs:matrix`.", "");
lines.push("| # | ID | Category | Topic | Branch | Weight 3PL | Weight Mfg | Weight Other | Critical flag |");
lines.push("|---|---|---|---|---|---|---|---|---|");
QUESTIONS.forEach((q, i) => {
  lines.push(`| ${i + 1} | \`${q.id}\` | ${CATEGORY_LABELS[q.category].label} | ${q.topic} | ${q.branch ?? ""} | ${q.weights.logistics_3pl} | ${q.weights.light_manufacturing} | ${q.weights.other} | ${q.critical ? "yes (≤" + q.critical.atOrBelow + ")" : ""} |`);
});
lines.push("", "## Prompts and maturity ladders", "");
for (const q of QUESTIONS) {
  lines.push(`### ${q.topic} (\`${q.id}\`)`, "", q.prompt, "");
  if (q.help) lines.push(`_${q.help}_`, "");
  for (const o of q.options) lines.push(`- **${o.value}** — ${o.label}`);
  lines.push(`- **unknown** — Not sure / someone else owns this`, "");
  if (q.variants) {
    for (const [industry, v] of Object.entries(q.variants)) {
      lines.push(`**${industry} variant**`, "");
      if (v.prompt) lines.push(`Prompt: ${v.prompt}`, "");
      if (v.help) lines.push(`_${v.help}_`, "");
      if (v.options) for (const o of v.options) lines.push(`- **${o.value}** — ${o.label}`);
      lines.push("");
    }
  }
}
process.stdout.write(lines.join("\n") + "\n");
