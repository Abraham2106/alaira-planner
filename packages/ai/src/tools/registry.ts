import type { ActorContext } from "@alaira/domain";
import type { TypedToolName } from "@alaira/contracts/ai";
import { getToolDefinition } from "@alaira/contracts/ai";
import { executeDomainTool } from "../domain-tools/execute.js";
import type { DomainToolStore } from "../domain-tools/store.js";

export type ToolExecutionContext = {
  actor: ActorContext;
  projectId: string;
  targetNodeId: string;
};

export type ToolExecutionResult = Record<string, unknown>;

export async function executeTypedTool(
  tool: Exclude<TypedToolName, "__direct_write__">,
  ctx: ToolExecutionContext,
  args: Record<string, unknown>,
  store?: DomainToolStore,
): Promise<ToolExecutionResult> {
  const def = getToolDefinition(tool);
  if (!def) {
    throw new Error(`Unknown tool: ${tool}`);
  }
  return executeDomainTool(tool, ctx, args, store);
}
