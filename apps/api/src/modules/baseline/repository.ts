import type pg from "pg";

export type ProjectBaselineRow = {
  baseline_version: number;
  source_forecast_version: number;
  approved_at: string;
  approved_by_user_id: string;
  approved_reason: string | null;
  project_early_finish_epoch_ms: string;
};

export type BaselineTaskRow = {
  work_node_id: string;
  early_start_epoch_ms: string;
  early_finish_epoch_ms: string;
  planned_cost_minor: string | null;
};

export type ActualTaskRow = {
  work_node_id: string;
  actual_start_epoch_ms: string | null;
  actual_finish_epoch_ms: string | null;
  actual_cost_minor: string | null;
};

export async function findLatestBaseline(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<ProjectBaselineRow | null> {
  const res = await client.query<ProjectBaselineRow>(
    `SELECT baseline_version, source_forecast_version, approved_at,
            approved_by_user_id::text, approved_reason,
            project_early_finish_epoch_ms::text
     FROM project_baseline
     WHERE tenant_id = $1 AND project_id = $2
     ORDER BY baseline_version DESC
     LIMIT 1`,
    [tenantId, projectId],
  );
  return res.rows[0] ?? null;
}

export async function findBaselineByVersion(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  baselineVersion: number,
): Promise<ProjectBaselineRow | null> {
  const res = await client.query<ProjectBaselineRow>(
    `SELECT baseline_version, source_forecast_version, approved_at,
            approved_by_user_id::text, approved_reason,
            project_early_finish_epoch_ms::text
     FROM project_baseline
     WHERE tenant_id = $1 AND project_id = $2 AND baseline_version = $3`,
    [tenantId, projectId, baselineVersion],
  );
  return res.rows[0] ?? null;
}

export async function listBaselineTasks(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  baselineVersion: number,
): Promise<BaselineTaskRow[]> {
  const res = await client.query<BaselineTaskRow>(
    `SELECT work_node_id::text, early_start_epoch_ms::text, early_finish_epoch_ms::text,
            planned_cost_minor::text
     FROM baseline_schedule_task
     WHERE tenant_id = $1 AND project_id = $2 AND baseline_version = $3`,
    [tenantId, projectId, baselineVersion],
  );
  return res.rows;
}

export async function findIdempotentBaselineVersion(
  client: pg.PoolClient,
  tenantId: string,
  idempotencyKey: string,
): Promise<{ project_id: string; baseline_version: number } | null> {
  const res = await client.query<{ project_id: string; baseline_version: number }>(
    `SELECT project_id::text, baseline_version
     FROM baseline_approve_idempotency
     WHERE tenant_id = $1 AND idempotency_key = $2`,
    [tenantId, idempotencyKey],
  );
  return res.rows[0] ?? null;
}

export async function recordBaselineApproveIdempotency(
  client: pg.PoolClient,
  tenantId: string,
  idempotencyKey: string,
  projectId: string,
  baselineVersion: number,
): Promise<void> {
  await client.query(
    `INSERT INTO baseline_approve_idempotency (tenant_id, idempotency_key, project_id, baseline_version)
     VALUES ($1, $2, $3, $4)`,
    [tenantId, idempotencyKey, projectId, baselineVersion],
  );
}

export async function nextBaselineVersion(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<number> {
  const res = await client.query<{ next_version: number }>(
    `SELECT COALESCE(MAX(baseline_version), 0) + 1 AS next_version
     FROM project_baseline
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return res.rows[0]!.next_version;
}

export async function insertProjectBaseline(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  baselineVersion: number,
  sourceForecastVersion: number,
  approvedByUserId: string,
  approvedReason: string | null,
  projectEarlyFinishEpochMs: number,
): Promise<ProjectBaselineRow> {
  const res = await client.query<ProjectBaselineRow>(
    `INSERT INTO project_baseline (
       tenant_id, project_id, baseline_version, source_forecast_version,
       approved_by_user_id, approved_reason, project_early_finish_epoch_ms
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING baseline_version, source_forecast_version, approved_at,
               approved_by_user_id::text, approved_reason,
               project_early_finish_epoch_ms::text`,
    [
      tenantId,
      projectId,
      baselineVersion,
      sourceForecastVersion,
      approvedByUserId,
      approvedReason,
      projectEarlyFinishEpochMs,
    ],
  );
  return res.rows[0]!;
}

export async function insertBaselineTasks(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  baselineVersion: number,
  rows: {
    workNodeId: string;
    earlyStartEpochMs: number;
    earlyFinishEpochMs: number;
    plannedCostMinor: number | null;
  }[],
): Promise<void> {
  for (const row of rows) {
    await client.query(
      `INSERT INTO baseline_schedule_task (
         tenant_id, project_id, baseline_version, work_node_id,
         early_start_epoch_ms, early_finish_epoch_ms, planned_cost_minor
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tenantId,
        projectId,
        baselineVersion,
        row.workNodeId,
        row.earlyStartEpochMs,
        row.earlyFinishEpochMs,
        row.plannedCostMinor,
      ],
    );
  }
}

export async function upsertActualTask(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
  actualStartEpochMs: number | null,
  actualFinishEpochMs: number | null,
  actualCostMinor: number | null,
): Promise<ActualTaskRow> {
  const res = await client.query<ActualTaskRow>(
    `INSERT INTO schedule_actual_task (
       tenant_id, project_id, work_node_id,
       actual_start_epoch_ms, actual_finish_epoch_ms, actual_cost_minor
     ) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (work_node_id) DO UPDATE SET
       actual_start_epoch_ms = COALESCE(EXCLUDED.actual_start_epoch_ms, schedule_actual_task.actual_start_epoch_ms),
       actual_finish_epoch_ms = COALESCE(EXCLUDED.actual_finish_epoch_ms, schedule_actual_task.actual_finish_epoch_ms),
       actual_cost_minor = COALESCE(EXCLUDED.actual_cost_minor, schedule_actual_task.actual_cost_minor),
       updated_at = now()
     RETURNING work_node_id::text,
               actual_start_epoch_ms::text,
               actual_finish_epoch_ms::text,
               actual_cost_minor::text`,
    [tenantId, projectId, workNodeId, actualStartEpochMs, actualFinishEpochMs, actualCostMinor],
  );
  return res.rows[0]!;
}

export async function ensureEventlogProject(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  name: string,
): Promise<void> {
  await client.query(
    `INSERT INTO eventlog_project (tenant_id, project_id, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, project_id) DO NOTHING`,
    [tenantId, projectId, name],
  );
}

export async function listActualTasksForProject(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<ActualTaskRow[]> {
  const res = await client.query<ActualTaskRow>(
    `SELECT work_node_id::text,
            actual_start_epoch_ms::text,
            actual_finish_epoch_ms::text,
            actual_cost_minor::text
     FROM schedule_actual_task
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return res.rows;
}
