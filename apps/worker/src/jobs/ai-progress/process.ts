import { runProgressAgent, type ProgressAgentResult } from "@alaira/ai/agents/progress";
import {
  isMemoryDomainToolStore,
  type DomainToolStore,
} from "@alaira/ai/domain-tools";
import type { ToolExecutionContext } from "@alaira/ai/tools";
import type { AiProgressJobRequest } from "./types.js";

export type ProcessAiProgressOptions = {
  store?: DomainToolStore;
  /**
   * Allows the in-memory domain store. Unit tests of the agent double set this.
   * The production tick must leave it unset.
   */
  allowMemoryStore?: boolean;
};

export async function processAiProgressJob(
  request: AiProgressJobRequest,
  options: ProcessAiProgressOptions = {},
): Promise<ProgressAgentResult> {
  const store = options.store;
  if (!store || (isMemoryDomainToolStore(store) && !options.allowMemoryStore)) {
    throw new Error(
      "ai-progress job requires a persistent domain store; in-memory fallback is refused",
    );
  }

  const ctx: ToolExecutionContext = {
    actor: request.actor,
    projectId: request.projectId,
    targetNodeId: request.targetNodeId,
  };
  return runProgressAgent({ ctx, evidence: request.evidence, store });
}
