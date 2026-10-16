import { runProgressAgent, type ProgressAgentResult } from "@alaira/ai/agents/progress";
import type { ToolExecutionContext } from "@alaira/ai/tools";
import type { AiProgressJobRequest } from "./types.js";

export async function processAiProgressJob(
  request: AiProgressJobRequest,
): Promise<ProgressAgentResult> {
  const ctx: ToolExecutionContext = {
    actor: request.actor,
    projectId: request.projectId,
    targetNodeId: request.targetNodeId,
  };
  return runProgressAgent({ ctx, evidence: request.evidence });
}
