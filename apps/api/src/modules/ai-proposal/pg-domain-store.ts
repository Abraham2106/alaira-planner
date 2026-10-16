import type pg from "pg";
import type { DomainToolStore } from "@alaira/ai/domain-tools";
import type { ToolExecutionContext } from "@alaira/ai/tools";
import {
  findWorkNode,
  getLatestCriterionVersion,
  getProgress,
  listChecklistProgress,
} from "../acceptance/repository.js";

export function createPgDomainToolStore(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): DomainToolStore {
  return {
    async getProject(ctx) {
      const { rows } = await client.query<{ name: string; planning_mode: string }>(
        `SELECT name, planning_mode FROM project WHERE tenant_id = $1 AND id = $2`,
        [tenantId, projectId],
      );
      const row = rows[0];
      return {
        projectId: ctx.projectId,
        tenantId: ctx.actor.tenantId,
        title: row?.name ?? "Project",
        planningMode: row?.planning_mode ?? "hybrid",
        source: "typed_tool",
      };
    },
    async findWorkItem(ctx, workItemId) {
      const node = await findWorkNode(client, tenantId, projectId, workItemId);
      if (!node) return null;
      const progress = await getProgress(client, tenantId, workItemId);
      const { rows } = await client.query<{ title: string }>(
        `SELECT title FROM work_node WHERE tenant_id = $1 AND id = $2`,
        [tenantId, workItemId],
      );
      return {
        workItemId,
        nodeType: node.node_type,
        title: rows[0]?.title ?? "Work node",
        progressPercent: progress?.progress_percent ?? 0,
      };
    },
    async getAcceptanceCriteria(ctx) {
      const version = await getLatestCriterionVersion(client, tenantId, ctx.targetNodeId);
      const criteria =
        version?.criteria && typeof version.criteria === "object"
          ? (version.criteria as { criteria?: { key: string; required: boolean; text: string }[] })
              .criteria ?? []
          : [];
      const checklist = await listChecklistProgress(client, tenantId, ctx.targetNodeId);
      const satisfied = new Set(
        checklist.filter((c) => c.completed).map((c) => c.criterion_key),
      );
      return {
        criteria: criteria.map((c) => ({
          key: c.key,
          required: c.required,
          label: c.text,
        })),
        satisfiedKeys: satisfied,
      };
    },
    async recordEvidenceLink(ctx, evidenceId) {
      return { evidenceId, workItemId: ctx.targetNodeId, linked: true };
    },
  };
}
