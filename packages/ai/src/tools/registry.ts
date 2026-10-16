import type { ActorContext } from "@alaira/domain";
import type { TypedToolName } from "@alaira/contracts/ai";
import { getToolDefinition } from "@alaira/contracts/ai";

export type ToolExecutionContext = {
  actor: ActorContext;
  projectId: string;
  targetNodeId: string;
};

export type ToolExecutionResult = Record<string, unknown>;

const stubExecutors: Partial<
  Record<
    Exclude<TypedToolName, "__direct_write__">,
    (ctx: ToolExecutionContext, args: Record<string, unknown>) => ToolExecutionResult
  >
> = {
  get_project(ctx) {
    return {
      projectId: ctx.projectId,
      tenantId: ctx.actor.tenantId,
      title: "Synthetic project (runtime stub)",
      deliveryProfiles: ["predictive", "agile"],
      source: "typed_tool",
    };
  },
  find_work_item(ctx, args) {
    const workItemId = String(args.workItemId ?? ctx.targetNodeId);
    return { workItemId, tenantId: ctx.actor.tenantId, found: true };
  },
  propose_progress_update(ctx, args) {
    const percentComplete = Number(args.percentComplete ?? 90);
    return {
      targetNodeId: ctx.targetNodeId,
      priorPercentComplete: Number(args.priorPercentComplete ?? 70),
      proposedPercentComplete: percentComplete,
    };
  },
};

export function executeTypedTool(
  tool: Exclude<TypedToolName, "__direct_write__">,
  ctx: ToolExecutionContext,
  args: Record<string, unknown>,
): ToolExecutionResult {
  const def = getToolDefinition(tool);
  if (!def) {
    throw new Error(`Unknown tool: ${tool}`);
  }
  const handler = stubExecutors[tool];
  if (!handler) {
    return {
      tool,
      status: "not_implemented_in_runtime_core",
      message: "Domain executor arrives in TASK-0124",
    };
  }
  return handler(ctx, args);
}
