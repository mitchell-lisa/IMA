import { buildChecklist } from "./checklist";
import { generateFindings } from "./findings";
import { computeRenewalContext } from "./renewal";
import { scoreAssessment } from "./scoring";
import type { Answers, AssessmentProfile, DiagnosticResult, IndustryId } from "./types";

/**
 * Runs the complete deterministic pipeline: scores -> findings -> renewal
 * context -> checklist. No AI, no I/O.
 */
export function runDiagnostic(
  answers: Answers,
  profile: Partial<AssessmentProfile> & { industry: IndustryId },
  now: Date = new Date(),
): DiagnosticResult {
  const scores = scoreAssessment(answers, profile);
  const { findings, strengths } = generateFindings({ answers, profile, scores });
  const renewal = computeRenewalContext(profile.renewalMonth, now);
  const checklist = buildChecklist(profile, scores, findings);
  return { scores, findings, strengths, renewal, checklist };
}

export * from "./types";
export * from "./scoring";
export * from "./findings";
export * from "./renewal";
export * from "./checklist";
export * from "./leadScore";
export * from "./territory";
export * from "./questions";
export * from "./industries";
export * from "./labels";
export * from "./disclaimers";
export * from "./modules";
export * from "./niches";
