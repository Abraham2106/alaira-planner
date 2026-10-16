import type { TypedToolName } from "@alaira/contracts/ai";
import { getToolDefinition } from "@alaira/contracts/ai";
import { progressFromWeightedChecklist } from "@alaira/domain/acceptance";
import type { ToolExecutionContext, ToolExecutionResult } from "../tools/registry.js";
import { defaultMemoryDomainToolStore } from "./memory-store.js";
import type { DomainToolStore } from "./store.js";

function criteriaRollup(snapshot: Awaited<ReturnType<DomainToolStore["getAcceptanceCriteria"]>>) {
  const satisfied: string[] = [];
  const pending: string[] = [];
  for (const item of snapshot.criteria) {
    if (snapshot.satisfiedKeys.has(item.key)) satisfied.push(item.key);
    else pending.push(item.key);
  }
  return { satisfied, pending };
}

export async function executeDomainTool(
  tool: Exclude<TypedToolName, "__direct_write__">,
  ctx: ToolExecutionContext,
  args: Record<string, unknown>,
  store: DomainToolStore = defaultMemoryDomainToolStore,
): Promise<ToolExecutionResult> {
  const def = getToolDefinition(tool);
  if (!def) {
    throw new Error(`Unknown tool: ${tool}`);
  }

  switch (tool) {
    case "get_project":
      return { ...(await store.getProject(ctx)), tool };
    case "find_work_item": {
      const workItemId = String(args.workItemId ?? ctx.targetNodeId);
      const item = await store.findWorkItem(ctx, workItemId);
      return { found: Boolean(item), workItem: item, tool };
    }
    case "calculate_schedule_impact":
      return {
        tool,
        targetNodeId: ctx.targetNodeId,
        scheduleDeltaDays: 0,
        source: "deterministic_engine_stub",
        note: "No dates mutated by AI (NFR-021).",
      };
    case "get_budget_status":
      return {
        tool,
        projectId: ctx.projectId,
        budgetStatus: "within_tolerance",
        spent: 0,
        committed: 0,
        source: "deterministic_ledger_stub",
      };
    case "link_evidence_to_work_item": {
      const evidenceId = String(args.evidenceId ?? "00000000-0000-4000-8000-000000000001");
      const link = await store.recordEvidenceLink(ctx, evidenceId);
      return { tool, ...link, autonomyApplied: "informar" };
    }
    case "propose_progress_update": {
      const item = await store.findWorkItem(ctx, ctx.targetNodeId);
      const prior = Number(args.priorPercentComplete ?? item?.progressPercent ?? 0);
      const proposed = Number(args.percentComplete ?? 90);
      return {
        tool,
        targetNodeId: ctx.targetNodeId,
        priorPercentComplete: prior,
        proposedPercentComplete: proposed,
      };
    }
    case "create_change_request":
      return {
        tool,
        changeRequestId: crypto.randomUUID(),
        status: "draft",
        projectId: ctx.projectId,
        summary: String(args.summary ?? "AI-suggested change"),
      };
    case "complete_work_item": {
      const snapshot = await store.getAcceptanceCriteria(ctx);
      const { satisfied, pending } = criteriaRollup(snapshot);
      const partialPercent =
        snapshot.criteria.length > 0
          ? progressFromWeightedChecklist(
              {
                items: snapshot.criteria.map((c) => ({
                  key: c.key,
                  weight: 1,
                  label: c.label,
                })),
              },
              snapshot.satisfiedKeys,
            )
          : 0;
      const mayClose = pending.length === 0;
      return {
        tool,
        targetNodeId: ctx.targetNodeId,
        criteriaSatisfied: satisfied,
        criteriaPending: pending,
        mayCloseItem: mayClose,
        suggestedProgressPercent: partialPercent,
        blockedReason: mayClose
          ? undefined
          : "Acceptance criteria incomplete (REQ-092); item cannot close.",
      };
    }
    case "modify_baseline":
    case "approve_change":
    case "modify_budget":
    case "delete_project":
    case "change_permissions":
      return {
        tool,
        status: "preview_only_until_human_approval",
        targetNodeId: ctx.targetNodeId,
        elevationRequired: true,
      };
    default:
      return { tool, status: "not_implemented" };
  }
}
