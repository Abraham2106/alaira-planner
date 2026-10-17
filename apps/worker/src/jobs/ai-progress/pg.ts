import pg from "pg";
import type { ProgressEvidenceInput } from "@alaira/ai/agents/progress";
import type { DomainToolStore } from "@alaira/ai/domain-tools";
import type {
  ExistingProposal,
  PendingProgressProposal,
  ProgressTaskRow,
  ProposalResolution,
} from "./cycle.js";

type Sql = Pick<pg.Client, "query">;

const RESOLUTIONS = new Set<ProposalResolution>([
  "pending",
  "applied",
  "confirmed",
  "rejected",
  "expired",
]);

/**
 * App role (NOBYPASSRLS). The superuser `DATABASE_URL` is not a fallback:
 * a silent admin connection would ignore tenant isolation.
 */
export function aiProgressDatabaseUrl(): string {
  return (
    process.env.DATABASE_APP_URL ??
    "postgresql://alaira_app:alaira_app_dev@localhost:5432/alaira"
  );
}

const notYetProposed = `
  AND NOT EXISTS (
    SELECT 1 FROM ai_proposal p
    WHERE p.tenant_id = e.tenant_id
      AND (
        p.idempotency_key = 'ai-progress:' || e.id::text
        OR p.cited_evidence_ids @> jsonb_build_array(e.id::text)
      )
  )
`;

type TaskSqlRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  source: string;
  external_id: string;
  event_type: ProgressEvidenceInput["eventType"];
  effect: ProgressEvidenceInput["effect"];
  artifact: ProgressEvidenceInput["artifact"];
  normalized_payload: Record<string, unknown>;
  responsible_user_id: string;
  org_role: string | null;
  project_role: string | null;
};

function rowToTask(row: TaskSqlRow): ProgressTaskRow {
  return {
    tenantId: row.tenant_id,
    projectId: row.project_id,
    targetNodeId: "",
    responsibleUserId: row.responsible_user_id,
    orgRole: row.org_role,
    projectRole: row.project_role,
    evidence: {
      evidenceId: row.id,
      source: row.source,
      externalId: row.external_id,
      eventType: row.event_type,
      effect: row.effect,
      artifact: row.artifact,
      normalizedPayload: row.normalized_payload ?? {},
    },
  };
}

export async function loadProgressTasks(client: Sql, tenantId: string): Promise<ProgressTaskRow[]> {
  const { rows } = await client.query<TaskSqlRow & { work_item_candidate: string }>(
    `SELECT e.id::text, e.tenant_id::text, e.project_id::text, e.source, e.external_id,
            e.event_type, e.effect, e.artifact, e.normalized_payload,
            e.work_item_candidate::text,
            w.responsible_user_id::text AS responsible_user_id,
            u.org_role,
            m.project_role
     FROM evidence_event e
     JOIN work_node w
       ON w.tenant_id = e.tenant_id
      AND w.project_id = e.project_id
      AND w.id = e.work_item_candidate
     JOIN app_user u
       ON u.id = w.responsible_user_id
      AND u.tenant_id = e.tenant_id
      AND u.deactivated_at IS NULL
     LEFT JOIN authz_project_membership m
       ON m.tenant_id = e.tenant_id
      AND m.project_id = e.project_id
      AND m.user_id = w.responsible_user_id
     WHERE e.tenant_id = $1
       AND e.effect = 'may_propose_progress'
       AND e.work_item_candidate IS NOT NULL
       AND e.link_state IN ('confirmed', 'proposed')
       ${notYetProposed}
     ORDER BY e.recorded_at ASC
     LIMIT 10`,
    [tenantId],
  );

  return rows.map((row) => ({
    ...rowToTask(row),
    targetNodeId: row.work_item_candidate,
  }));
}

/** Evidence that could propose progress but has no live responsible user. */
export async function countTasksWithoutActor(client: Sql, tenantId: string): Promise<number> {
  const { rows } = await client.query<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM evidence_event e
     LEFT JOIN work_node w
       ON w.tenant_id = e.tenant_id
      AND w.project_id = e.project_id
      AND w.id = e.work_item_candidate
     WHERE e.tenant_id = $1
       AND e.effect = 'may_propose_progress'
       AND e.work_item_candidate IS NOT NULL
       AND e.link_state IN ('confirmed', 'proposed')
       AND (
         w.id IS NULL
         OR w.responsible_user_id IS NULL
         OR NOT EXISTS (
           SELECT 1 FROM app_user u
           WHERE u.id = w.responsible_user_id
             AND u.tenant_id = e.tenant_id
             AND u.deactivated_at IS NULL
         )
       )
       ${notYetProposed}`,
    [tenantId],
  );
  return rows[0]?.n ?? 0;
}

export async function findProgressProposal(
  client: Sql,
  tenantId: string,
  idempotencyKey: string,
): Promise<ExistingProposal | null> {
  const { rows } = await client.query<{
    id: string;
    resolution: string;
    actor_user_id: string;
  }>(
    `SELECT id::text, resolution, actor_user_id::text AS actor_user_id
     FROM ai_proposal
     WHERE tenant_id = $1 AND idempotency_key = $2`,
    [tenantId, idempotencyKey],
  );
  const row = rows[0];
  if (!row || !RESOLUTIONS.has(row.resolution as ProposalResolution)) return null;
  return {
    id: row.id,
    resolution: row.resolution as ProposalResolution,
    actorUserId: row.actor_user_id,
  };
}

/** Inserts a pending proposal. Conflict leaves the existing row untouched. */
export async function insertPendingProposal(
  client: Sql,
  proposal: PendingProgressProposal,
): Promise<"inserted" | "exists"> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO ai_proposal (
       id, tenant_id, project_id, actor_user_id, autonomy_level, typed_command,
       target_node_id, prior_state, proposed_state, cited_evidence_ids, resolution,
       rationale, model_ref, approver_user_id, idempotency_key, runtime_audit
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16::jsonb
     )
     ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
     RETURNING id::text`,
    [
      proposal.id,
      proposal.tenantId,
      proposal.projectId,
      proposal.actorUserId,
      proposal.autonomyLevel,
      proposal.typedCommand,
      proposal.targetNodeId,
      JSON.stringify(proposal.priorState),
      JSON.stringify(proposal.proposedState),
      JSON.stringify(proposal.citedEvidenceIds),
      proposal.resolution,
      proposal.rationale,
      proposal.modelRef,
      null,
      proposal.idempotencyKey,
      JSON.stringify(proposal.runtimeAudit),
    ],
  );
  return rows[0] ? "inserted" : "exists";
}

function planningModeOf(profile: unknown): string {
  if (profile && typeof profile === "object" && "planningMode" in profile) {
    const mode = (profile as { planningMode?: unknown }).planningMode;
    if (typeof mode === "string" && mode.trim()) return mode;
  }
  return "hybrid";
}

/**
 * Reads the same project tables as `apps/api/src/modules/ai-proposal/pg-domain-store.ts`.
 * This object is not the in-memory test double.
 */
export function createWorkerPgDomainStore(
  client: Sql,
  tenantId: string,
  projectId: string,
): DomainToolStore {
  return {
    async getProject(ctx) {
      const { rows } = await client.query<{ name: string; delivery_profile: unknown }>(
        `SELECT name, delivery_profile FROM project WHERE tenant_id = $1 AND id = $2`,
        [tenantId, projectId],
      );
      const row = rows[0];
      return {
        projectId: ctx.projectId,
        tenantId: ctx.actor.tenantId,
        title: row?.name ?? "Project",
        planningMode: planningModeOf(row?.delivery_profile),
        source: "typed_tool",
      };
    },
    async findWorkItem(_ctx, workItemId) {
      const { rows } = await client.query<{ node_type: string; title: string }>(
        `SELECT node_type, title FROM work_node
         WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
        [tenantId, projectId, workItemId],
      );
      const node = rows[0];
      if (!node) return null;
      const progress = await client.query<{ progress_percent: number }>(
        `SELECT progress_percent FROM work_node_progress
         WHERE tenant_id = $1 AND work_node_id = $2`,
        [tenantId, workItemId],
      );
      return {
        workItemId,
        nodeType: node.node_type,
        title: node.title,
        progressPercent: progress.rows[0]?.progress_percent ?? 0,
      };
    },
    async getAcceptanceCriteria(ctx) {
      const version = await client.query<{ criteria: unknown }>(
        `SELECT criteria FROM acceptance_criterion_version
         WHERE tenant_id = $1 AND work_node_id = $2
         ORDER BY version DESC
         LIMIT 1`,
        [tenantId, ctx.targetNodeId],
      );
      const raw = version.rows[0]?.criteria;
      const criteria =
        raw && typeof raw === "object"
          ? ((raw as { criteria?: { key: string; required: boolean; text: string }[] }).criteria ??
            [])
          : [];
      const checklist = await client.query<{ criterion_key: string; completed: boolean }>(
        `SELECT criterion_key, completed FROM work_node_checklist_progress
         WHERE tenant_id = $1 AND work_node_id = $2`,
        [tenantId, ctx.targetNodeId],
      );
      const satisfied = new Set(
        checklist.rows.filter((item) => item.completed).map((item) => item.criterion_key),
      );
      return {
        criteria: criteria.map((item) => ({
          key: item.key,
          required: item.required,
          label: item.text,
        })),
        satisfiedKeys: satisfied,
      };
    },
    async recordEvidenceLink(ctx, evidenceId) {
      return { evidenceId, workItemId: ctx.targetNodeId, linked: true as const };
    },
  };
}
