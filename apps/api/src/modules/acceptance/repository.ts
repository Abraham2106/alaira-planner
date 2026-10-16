import type pg from "pg";
import type {
  AcceptanceStatus,
  CompletionRequestStatus,
  ExecutionStatus,
  ProgressStrategyKind,
} from "@alaira/domain/acceptance";

export type LifecycleRow = {
  execution_status: ExecutionStatus;
  completion_request_status: CompletionRequestStatus;
  acceptance_status: AcceptanceStatus;
};

export async function findDeliverableNode(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
): Promise<{ id: string; node_type: string; title: string } | null> {
  const { rows } = await client.query<{ id: string; node_type: string; title: string }>(
    `SELECT wn.id, wn.node_type, wn.title
     FROM work_node wn
     WHERE wn.tenant_id = $1 AND wn.project_id = $2 AND wn.id = $3
       AND wn.node_type = 'deliverable'`,
    [tenantId, projectId, workNodeId],
  );
  return rows[0] ?? null;
}

export async function findWorkNode(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
): Promise<{ id: string; node_type: string } | null> {
  const { rows } = await client.query<{ id: string; node_type: string }>(
    `SELECT id, node_type FROM work_node
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
    [tenantId, projectId, workNodeId],
  );
  return rows[0] ?? null;
}

export async function ensureLifecycleRow(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
): Promise<LifecycleRow> {
  await client.query(
    `INSERT INTO work_node_lifecycle (tenant_id, project_id, work_node_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (work_node_id) DO NOTHING`,
    [tenantId, projectId, workNodeId],
  );
  const row = await getLifecycle(client, tenantId, workNodeId);
  return row!;
}

export async function getLifecycle(
  client: pg.PoolClient,
  tenantId: string,
  workNodeId: string,
): Promise<LifecycleRow | null> {
  const { rows } = await client.query<LifecycleRow>(
    `SELECT execution_status, completion_request_status, acceptance_status
     FROM work_node_lifecycle
     WHERE tenant_id = $1 AND work_node_id = $2`,
    [tenantId, workNodeId],
  );
  return rows[0] ?? null;
}

export async function updateLifecycle(
  client: pg.PoolClient,
  tenantId: string,
  workNodeId: string,
  lifecycle: LifecycleRow,
): Promise<void> {
  await client.query(
    `UPDATE work_node_lifecycle
     SET execution_status = $3,
         completion_request_status = $4,
         acceptance_status = $5,
         updated_at = now()
     WHERE tenant_id = $1 AND work_node_id = $2`,
    [
      tenantId,
      workNodeId,
      lifecycle.execution_status,
      lifecycle.completion_request_status,
      lifecycle.acceptance_status,
    ],
  );
}

export async function getLatestCriterionVersion(
  client: pg.PoolClient,
  tenantId: string,
  workNodeId: string,
): Promise<{ id: string; version: number; criteria: unknown } | null> {
  const { rows } = await client.query<{ id: string; version: number; criteria: unknown }>(
    `SELECT id, version, criteria
     FROM acceptance_criterion_version
     WHERE tenant_id = $1 AND work_node_id = $2
     ORDER BY version DESC
     LIMIT 1`,
    [tenantId, workNodeId],
  );
  return rows[0] ?? null;
}

export async function findDecisionByIdempotency(
  client: pg.PoolClient,
  tenantId: string,
  idempotencyKey: string,
): Promise<{ id: string; work_node_id: string } | null> {
  const { rows } = await client.query<{ id: string; work_node_id: string }>(
    `SELECT id, work_node_id FROM acceptance_decision
     WHERE tenant_id = $1 AND idempotency_key = $2`,
    [tenantId, idempotencyKey],
  );
  return rows[0] ?? null;
}

export async function findDecisionById(
  client: pg.PoolClient,
  tenantId: string,
  decisionId: string,
): Promise<{
  id: string;
  work_node_id: string;
  decision_type: string;
  criterion_version_id: string | null;
  criterion_evaluations: unknown;
  reason: string | null;
  actor_user_id: string;
  created_at: Date;
} | null> {
  const { rows } = await client.query(
    `SELECT id, work_node_id, decision_type, criterion_version_id,
            criterion_evaluations, reason, actor_user_id, created_at
     FROM acceptance_decision
     WHERE tenant_id = $1 AND id = $2`,
    [tenantId, decisionId],
  );
  return rows[0] ?? null;
}

export async function insertDecision(
  client: pg.PoolClient,
  row: {
    id: string;
    tenantId: string;
    projectId: string;
    workNodeId: string;
    decisionType: string;
    criterionVersionId: string | null;
    criterionEvaluations: unknown;
    reason: string | null;
    actorUserId: string;
    idempotencyKey: string;
    evidenceRefs: unknown;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO acceptance_decision (
       id, tenant_id, project_id, work_node_id, decision_type,
       criterion_version_id, criterion_evaluations, reason,
       actor_user_id, idempotency_key, evidence_refs
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      row.id,
      row.tenantId,
      row.projectId,
      row.workNodeId,
      row.decisionType,
      row.criterionVersionId,
      JSON.stringify(row.criterionEvaluations),
      row.reason,
      row.actorUserId,
      row.idempotencyKey,
      JSON.stringify(row.evidenceRefs),
    ],
  );
}

export async function maxStrategyVersion(
  client: pg.PoolClient,
  tenantId: string,
  workNodeId: string,
): Promise<number> {
  const { rows } = await client.query<{ max: string | null }>(
    `SELECT MAX(version)::text AS max FROM progress_strategy_version
     WHERE tenant_id = $1 AND work_node_id = $2`,
    [tenantId, workNodeId],
  );
  return rows[0]?.max ? Number(rows[0].max) : 0;
}

export async function insertStrategyVersion(
  client: pg.PoolClient,
  row: {
    id: string;
    tenantId: string;
    projectId: string;
    workNodeId: string;
    version: number;
    strategyKind: ProgressStrategyKind;
    config: unknown;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO progress_strategy_version (
       id, tenant_id, project_id, work_node_id, version, strategy_kind, config
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      row.id,
      row.tenantId,
      row.projectId,
      row.workNodeId,
      row.version,
      row.strategyKind,
      JSON.stringify(row.config),
    ],
  );
}

export async function getLatestStrategy(
  client: pg.PoolClient,
  tenantId: string,
  workNodeId: string,
): Promise<{
  id: string;
  version: number;
  strategy_kind: ProgressStrategyKind;
  config: unknown;
} | null> {
  const { rows } = await client.query(
    `SELECT id, version, strategy_kind, config
     FROM progress_strategy_version
     WHERE tenant_id = $1 AND work_node_id = $2
     ORDER BY version DESC LIMIT 1`,
    [tenantId, workNodeId],
  );
  return rows[0] ?? null;
}

export async function upsertProgress(
  client: pg.PoolClient,
  row: {
    tenantId: string;
    projectId: string;
    workNodeId: string;
    progressPercent: number;
    strategyVersionId: string | null;
    manualPercent: number | null;
    sourceDecisionId: string | null;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO work_node_progress (
       tenant_id, project_id, work_node_id, progress_percent,
       strategy_version_id, manual_percent, source_decision_id, computed_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7, now())
     ON CONFLICT (work_node_id) DO UPDATE SET
       progress_percent = EXCLUDED.progress_percent,
       strategy_version_id = EXCLUDED.strategy_version_id,
       manual_percent = EXCLUDED.manual_percent,
       source_decision_id = EXCLUDED.source_decision_id,
       computed_at = now()`,
    [
      row.tenantId,
      row.projectId,
      row.workNodeId,
      row.progressPercent,
      row.strategyVersionId,
      row.manualPercent,
      row.sourceDecisionId,
    ],
  );
}

export async function getProgress(
  client: pg.PoolClient,
  tenantId: string,
  workNodeId: string,
): Promise<{ progress_percent: number; source_decision_id: string | null } | null> {
  const { rows } = await client.query(
    `SELECT progress_percent, source_decision_id FROM work_node_progress
     WHERE tenant_id = $1 AND work_node_id = $2`,
    [tenantId, workNodeId],
  );
  return rows[0] ?? null;
}

export async function listChecklistProgress(
  client: pg.PoolClient,
  tenantId: string,
  workNodeId: string,
): Promise<{ criterion_key: string; completed: boolean }[]> {
  const { rows } = await client.query(
    `SELECT criterion_key, completed FROM work_node_checklist_progress
     WHERE tenant_id = $1 AND work_node_id = $2`,
    [tenantId, workNodeId],
  );
  return rows;
}

export async function upsertChecklistItem(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
  key: string,
  completed: boolean,
): Promise<void> {
  await client.query(
    `INSERT INTO work_node_checklist_progress (
       tenant_id, project_id, work_node_id, criterion_key, completed, updated_at
     ) VALUES ($1,$2,$3,$4,$5, now())
     ON CONFLICT (tenant_id, work_node_id, criterion_key) DO UPDATE SET
       completed = EXCLUDED.completed,
       updated_at = now()`,
    [tenantId, projectId, workNodeId, key, completed],
  );
}

export async function listHierarchyEdges(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<{ parent_node_id: string; child_node_id: string }[]> {
  const { rows } = await client.query(
    `SELECT parent_node_id, child_node_id FROM hierarchy_edge
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return rows;
}

export async function listDescendantWorkNodes(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  rootId: string,
): Promise<{ id: string; rollup_weight: number; progress_percent: number | null }[]> {
  const { rows } = await client.query(
    `WITH RECURSIVE subtree AS (
       SELECT wn.id
       FROM work_node wn
       WHERE wn.tenant_id = $1 AND wn.project_id = $2 AND wn.id = $3
       UNION ALL
       SELECT c.id
       FROM hierarchy_edge h
       JOIN work_node c ON c.id = h.child_node_id AND c.tenant_id = h.tenant_id
       JOIN subtree s ON h.parent_node_id = s.id
       WHERE h.tenant_id = $1 AND h.project_id = $2
     )
     SELECT s.id,
            COALESCE(d.rollup_weight, 1) AS rollup_weight,
            p.progress_percent
     FROM subtree s
     LEFT JOIN wbs_node_detail d ON d.work_node_id = s.id AND d.tenant_id = $1
     LEFT JOIN work_node_progress p ON p.work_node_id = s.id AND p.tenant_id = $1`,
    [tenantId, projectId, rootId],
  );
  return rows.map((r) => ({
    id: r.id,
    rollup_weight: Number(r.rollup_weight),
    progress_percent: r.progress_percent != null ? Number(r.progress_percent) : null,
  }));
}

export async function findProject(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<{ id: string } | null> {
  const { rows } = await client.query(
    `SELECT id FROM project WHERE tenant_id = $1 AND id = $2`,
    [tenantId, projectId],
  );
  return rows[0] ?? null;
}
