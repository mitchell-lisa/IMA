/**
 * Exports the question bank, findings library, industries, modules, and
 * niches as JSON so the Excel workbook (and any Copilot agent) is always
 * generated from the code, never maintained by hand.
 */
import { writeFileSync } from "node:fs";
import { QUESTIONS } from "../src/lib/diagnostic/questions";
import { FINDING_RULES } from "../src/lib/diagnostic/findings";
import { INDUSTRIES } from "../src/lib/diagnostic/industries";
import { CATEGORY_LABELS } from "../src/lib/diagnostic/labels";
import { MODULES } from "../src/lib/diagnostic/modules";
import { NICHES } from "../src/lib/diagnostic/niches";
import { CATEGORY_IDS } from "../src/lib/diagnostic/types";

const out = {
  generatedAt: new Date().toISOString(),
  categories: CATEGORY_IDS.map((id) => ({ id, ...CATEGORY_LABELS[id] })),
  industries: Object.values(INDUSTRIES),
  questions: QUESTIONS,
  findings: FINDING_RULES.map((rule) => {
    const { when, ...rest } = rule;
    void when; // trigger logic stays in code; only data is exported
    return rest;
  }),
  modules: Object.values(MODULES),
  niches: NICHES,
};
const path = process.argv[2] ?? "docs/question-bank.json";
writeFileSync(path, JSON.stringify(out, null, 2));
console.log(`wrote ${path}`);
