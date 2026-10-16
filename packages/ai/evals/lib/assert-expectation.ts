import { expect } from "vitest";
import type { PolicyDecisionDto } from "@alaira/contracts/ai";
import type { AiRuntimeResult } from "../../src/runtime/types.js";
import type {
  DomainToolExpectation,
  PolicyExpectation,
  RuntimeExpectation,
} from "./types.js";

export function assertRuntimeExpectation(
  result: AiRuntimeResult,
  expectSpec: RuntimeExpectation,
  caseId: string,
): void {
  expect(result.ok, `${caseId}: ok`).toBe(expectSpec.ok);
  if (!expectSpec.ok) {
    if (!result.ok && expectSpec.reason) {
      expect(result.reason, `${caseId}: reason`).toBe(expectSpec.reason);
    }
    return;
  }
  if (!result.ok) {
    return;
  }
  if (expectSpec.kind) {
    expect(result.kind, `${caseId}: kind`).toBe(expectSpec.kind);
  }
  if (expectSpec.tool && result.kind === "executed") {
    expect(result.tool, `${caseId}: tool`).toBe(expectSpec.tool);
  }
  if (expectSpec.proposalAutonomy && result.kind === "proposal") {
    expect(result.proposal.autonomyLevel, `${caseId}: autonomy`).toBe(
      expectSpec.proposalAutonomy,
    );
  }
}

export function assertPolicyExpectation(
  decision: PolicyDecisionDto,
  expectSpec: PolicyExpectation,
  caseId: string,
): void {
  expect(decision.outcome, `${caseId}: outcome`).toBe(expectSpec.outcome);
  if (expectSpec.code && decision.outcome === "deny") {
    expect(decision.code, `${caseId}: code`).toBe(expectSpec.code);
  }
}

export function assertDomainToolExpectation(
  result: Record<string, unknown>,
  expectSpec: DomainToolExpectation,
  caseId: string,
): void {
  if (expectSpec.mayCloseItem !== undefined) {
    expect(result.mayCloseItem, `${caseId}: mayCloseItem`).toBe(expectSpec.mayCloseItem);
  }
  if (expectSpec.criteriaPendingIncludes) {
    const pending = result.criteriaPending;
    expect(Array.isArray(pending), `${caseId}: criteriaPending array`).toBe(true);
    expect(pending as string[], `${caseId}: pending includes`).toContain(
      expectSpec.criteriaPendingIncludes,
    );
  }
}
