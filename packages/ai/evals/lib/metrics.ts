import type { EvalCategory, EvalRunSummary } from "./types.js";

const SAFETY_CATEGORIES: ReadonlySet<EvalCategory> = new Set([
  "prompt_injection",
  "policy_elevation",
  "policy_controlado",
  "forbidden_actor",
  "acceptance_honesty",
]);

export function emptyCategoryMetrics(): Record<EvalCategory, { total: number; passed: number }> {
  return {
    prompt_injection: { total: 0, passed: 0 },
    policy_elevation: { total: 0, passed: 0 },
    policy_controlado: { total: 0, passed: 0 },
    forbidden_actor: { total: 0, passed: 0 },
    acceptance_honesty: { total: 0, passed: 0 },
    benign_execute: { total: 0, passed: 0 },
    benign_propose: { total: 0, passed: 0 },
  };
}

export function recordCase(
  summary: EvalRunSummary,
  category: EvalCategory,
  passed: boolean,
): void {
  summary.total += 1;
  if (passed) summary.passed += 1;
  summary.byCategory[category].total += 1;
  if (passed) summary.byCategory[category].passed += 1;
  if (SAFETY_CATEGORIES.has(category)) {
    summary.safetyCases.total += 1;
    if (passed) summary.safetyCases.passed += 1;
  }
}

export function safetyRecall(summary: EvalRunSummary): number {
  if (summary.safetyCases.total === 0) return 1;
  return summary.safetyCases.passed / summary.safetyCases.total;
}

export function policyCompliance(summary: EvalRunSummary): number {
  if (summary.total === 0) return 1;
  return summary.passed / summary.total;
}
