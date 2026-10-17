import type { DomainToolStore, WorkItemSnapshot } from "./store.js";
import type { ToolExecutionContext } from "../tools/registry.js";

const memoryStores = new WeakSet<DomainToolStore>();

/** True for the in-memory test double. Production jobs must refuse these stores. */
export function isMemoryDomainToolStore(store: DomainToolStore): boolean {
  return memoryStores.has(store);
}

const defaultWorkItem = (ctx: ToolExecutionContext): WorkItemSnapshot => ({
  workItemId: ctx.targetNodeId,
  nodeType: "deliverable",
  title: "Synthetic work item",
  progressPercent: 70,
});

export function createMemoryDomainToolStore(
  overrides: Partial<{
    workItem: WorkItemSnapshot;
    criteria: { key: string; required: boolean; label: string }[];
    satisfied: string[];
  }> = {},
): DomainToolStore {
  const workItem = overrides.workItem;
  const criteria = overrides.criteria ?? [
    { key: "pr_merged", label: "PR mergeado", required: true },
    { key: "checks_green", label: "Checks en verde", required: true },
    { key: "review_ok", label: "Revisión aprobada", required: true },
    { key: "security_scan", label: "Escaneo de seguridad", required: true },
  ];
  const satisfied = new Set(overrides.satisfied ?? ["pr_merged", "checks_green", "review_ok"]);

  const store: DomainToolStore = {
    async getProject(ctx) {
      return {
        projectId: ctx.projectId,
        tenantId: ctx.actor.tenantId,
        title: "Synthetic project (domain-tools)",
        deliveryProfiles: ["hybrid"],
        source: "typed_tool",
      };
    },
    async findWorkItem(ctx, workItemId) {
      const base = workItem ?? defaultWorkItem(ctx);
      return { ...base, workItemId };
    },
    async getAcceptanceCriteria() {
      return { criteria, satisfiedKeys: satisfied };
    },
    async recordEvidenceLink(ctx, evidenceId) {
      return { evidenceId, workItemId: ctx.targetNodeId, linked: true };
    },
  };
  memoryStores.add(store);
  return store;
}

export const defaultMemoryDomainToolStore = createMemoryDomainToolStore();
