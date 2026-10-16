import { executeDomainTool } from "../../domain-tools/execute.js";
import { defaultMemoryDomainToolStore } from "../../domain-tools/memory-store.js";
import type { DomainToolStore } from "../../domain-tools/store.js";
import type { ToolExecutionContext } from "../../tools/registry.js";
import { domainStoreWithEvidence } from "./evidence-store.js";
import type { ProgressAgentResult, ProgressEvidenceInput } from "./types.js";

function buildSummary(result: {
  criteriaSatisfied: string[];
  criteriaPending: string[];
  mayCloseItem: boolean;
  suggestedProgressPercent: number;
}): string {
  if (result.mayCloseItem) {
    return "All acceptance criteria satisfied; human confirmation still required before close (REQ-092).";
  }
  const pending = result.criteriaPending.join(", ");
  return `Cannot close item: pending criteria (${pending}). Suggested partial progress ${result.suggestedProgressPercent}% per package strategy.`;
}

export type RunProgressAgentInput = {
  ctx: ToolExecutionContext;
  evidence: readonly ProgressEvidenceInput[];
  store?: DomainToolStore;
};

/**
 * Progress agent (WBS-7.4): gather evidence → evaluate DoD → propose partial progress; never auto-accept.
 */
export async function runProgressAgent(input: RunProgressAgentInput): Promise<ProgressAgentResult> {
  const baseStore = input.store ?? defaultMemoryDomainToolStore;
  const store = domainStoreWithEvidence(baseStore, input.evidence);

  const completion = await executeDomainTool("complete_work_item", input.ctx, {}, store);
  const criteriaSatisfied = (completion.criteriaSatisfied as string[]) ?? [];
  const criteriaPending = (completion.criteriaPending as string[]) ?? [];
  const mayCloseItem = Boolean(completion.mayCloseItem);
  const suggestedProgressPercent = Number(completion.suggestedProgressPercent ?? 0);

  let progressProposal: ProgressAgentResult["progressProposal"];
  if (!mayCloseItem) {
    const prior = Number(
      (await store.findWorkItem(input.ctx, input.ctx.targetNodeId))?.progressPercent ?? 0,
    );
    const proposed = await executeDomainTool(
      "propose_progress_update",
      input.ctx,
      { priorPercentComplete: prior, percentComplete: suggestedProgressPercent },
      store,
    );
    progressProposal = {
      priorPercentComplete: Number(proposed.priorPercentComplete ?? prior),
      proposedPercentComplete: Number(proposed.proposedPercentComplete ?? suggestedProgressPercent),
    };
  }

  return {
    criteriaSatisfied,
    criteriaPending,
    mayCloseItem,
    autoAcceptForbidden: true,
    suggestedProgressPercent,
    citedEvidenceIds: input.evidence.map((e) => e.evidenceId),
    progressProposal,
    summary: buildSummary({
      criteriaSatisfied,
      criteriaPending,
      mayCloseItem,
      suggestedProgressPercent,
    }),
  };
}
