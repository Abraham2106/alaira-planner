import type pg from "pg";
import type { WorkCalendarDefinition } from "@alaira/domain/schedule";

export type ScheduleConfigRow = {
  project_id: string;
  project_start_epoch_ms: string;
  default_calendar: WorkCalendarDefinition;
  forecast_version: number;
  last_recalc_at: string | null;
};

export type ScheduleTaskRow = {
  work_node_id: string;
  duration_minutes: number;
  calendar_override: WorkCalendarDefinition | null;
};

export type ScheduleDependencyRow = {
  id: string;
  predecessor_work_node_id: string;
  successor_work_node_id: string;
  dependency_type: string;
  lag_minutes: number;
};

export type ScheduleForecastRow = {
  work_node_id: string;
  forecast_version: number;
  early_start_epoch_ms: string;
  early_finish_epoch_ms: string;
  late_start_epoch_ms: string;
  late_finish_epoch_ms: string;
  total_float_minutes: number;
  free_float_minutes: number;
  is_critical: boolean;
};

export async function findScheduleConfig(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<ScheduleConfigRow | null> {
  const res = await client.query<ScheduleConfigRow>(
    `SELECT project_id, project_start_epoch_ms::text, default_calendar, forecast_version, last_recalc_at
     FROM project_schedule_config
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return res.rows[0] ?? null;
}

export async function upsertScheduleConfig(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  projectStartEpochMs: number,
  defaultCalendar: WorkCalendarDefinition,
): Promise<ScheduleConfigRow> {
  const res = await client.query<ScheduleConfigRow>(
    `INSERT INTO project_schedule_config (
       tenant_id, project_id, project_start_epoch_ms, default_calendar
     ) VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (project_id) DO UPDATE SET
       project_start_epoch_ms = EXCLUDED.project_start_epoch_ms,
       default_calendar = EXCLUDED.default_calendar,
       updated_at = now()
     RETURNING project_id, project_start_epoch_ms::text, default_calendar, forecast_version, last_recalc_at`,
    [tenantId, projectId, projectStartEpochMs, JSON.stringify(defaultCalendar)],
  );
  return res.rows[0]!;
}

export async function upsertScheduleTask(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
  durationMinutes: number,
  calendarOverride: WorkCalendarDefinition | null,
): Promise<ScheduleTaskRow> {
  const res = await client.query<ScheduleTaskRow>(
    `INSERT INTO schedule_task (
       tenant_id, project_id, work_node_id, duration_minutes, calendar_override
     ) VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (work_node_id) DO UPDATE SET
       duration_minutes = EXCLUDED.duration_minutes,
       calendar_override = EXCLUDED.calendar_override,
       updated_at = now()
     RETURNING work_node_id, duration_minutes, calendar_override`,
    [
      tenantId,
      projectId,
      workNodeId,
      durationMinutes,
      calendarOverride ? JSON.stringify(calendarOverride) : null,
    ],
  );
  return res.rows[0]!;
}

export async function listScheduleTasks(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<ScheduleTaskRow[]> {
  const res = await client.query<ScheduleTaskRow>(
    `SELECT work_node_id, duration_minutes, calendar_override
     FROM schedule_task
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return res.rows;
}

export async function insertScheduleDependency(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  id: string,
  predecessorId: string,
  successorId: string,
  dependencyType: string,
  lagMinutes: number,
): Promise<ScheduleDependencyRow> {
  const res = await client.query<ScheduleDependencyRow>(
    `INSERT INTO schedule_dependency (
       id, tenant_id, project_id, predecessor_work_node_id, successor_work_node_id,
       dependency_type, lag_minutes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, predecessor_work_node_id, successor_work_node_id, dependency_type, lag_minutes`,
    [id, tenantId, projectId, predecessorId, successorId, dependencyType, lagMinutes],
  );
  return res.rows[0]!;
}

export async function listScheduleDependencies(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<ScheduleDependencyRow[]> {
  const res = await client.query<ScheduleDependencyRow>(
    `SELECT id, predecessor_work_node_id, successor_work_node_id, dependency_type, lag_minutes
     FROM schedule_dependency
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return res.rows;
}

export async function findIdempotentRecalcVersion(
  client: pg.PoolClient,
  tenantId: string,
  idempotencyKey: string,
): Promise<{ project_id: string; forecast_version: number } | null> {
  const res = await client.query<{ project_id: string; forecast_version: number }>(
    `SELECT project_id, forecast_version
     FROM schedule_recalc_idempotency
     WHERE tenant_id = $1 AND idempotency_key = $2`,
    [tenantId, idempotencyKey],
  );
  return res.rows[0] ?? null;
}

export async function recordRecalcIdempotency(
  client: pg.PoolClient,
  tenantId: string,
  idempotencyKey: string,
  projectId: string,
  forecastVersion: number,
): Promise<void> {
  await client.query(
    `INSERT INTO schedule_recalc_idempotency (tenant_id, idempotency_key, project_id, forecast_version)
     VALUES ($1, $2, $3, $4)`,
    [tenantId, idempotencyKey, projectId, forecastVersion],
  );
}

export async function bumpForecastVersion(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<number> {
  const res = await client.query<{ forecast_version: number }>(
    `UPDATE project_schedule_config
     SET forecast_version = forecast_version + 1,
         last_recalc_at = now(),
         updated_at = now()
     WHERE tenant_id = $1 AND project_id = $2
     RETURNING forecast_version`,
    [tenantId, projectId],
  );
  return res.rows[0]!.forecast_version;
}

export async function replaceForecastTasks(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  forecastVersion: number,
  rows: {
    workNodeId: string;
    earlyStartEpochMs: number;
    earlyFinishEpochMs: number;
    lateStartEpochMs: number;
    lateFinishEpochMs: number;
    totalFloatMinutes: number;
    freeFloatMinutes: number;
    isCritical: boolean;
  }[],
): Promise<void> {
  await client.query(
    `DELETE FROM schedule_forecast_task
     WHERE tenant_id = $1 AND project_id = $2 AND forecast_version = $3`,
    [tenantId, projectId, forecastVersion],
  );
  for (const row of rows) {
    await client.query(
      `INSERT INTO schedule_forecast_task (
         tenant_id, project_id, work_node_id, forecast_version,
         early_start_epoch_ms, early_finish_epoch_ms,
         late_start_epoch_ms, late_finish_epoch_ms,
         total_float_minutes, free_float_minutes, is_critical
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tenantId,
        projectId,
        row.workNodeId,
        forecastVersion,
        row.earlyStartEpochMs,
        row.earlyFinishEpochMs,
        row.lateStartEpochMs,
        row.lateFinishEpochMs,
        row.totalFloatMinutes,
        row.freeFloatMinutes,
        row.isCritical,
      ],
    );
  }
}

export async function listForecastTasksForVersion(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  forecastVersion: number,
): Promise<ScheduleForecastRow[]> {
  const res = await client.query<ScheduleForecastRow>(
    `SELECT work_node_id, forecast_version,
            early_start_epoch_ms::text, early_finish_epoch_ms::text,
            late_start_epoch_ms::text, late_finish_epoch_ms::text,
            total_float_minutes, free_float_minutes, is_critical
     FROM schedule_forecast_task
     WHERE tenant_id = $1 AND project_id = $2 AND forecast_version = $3`,
    [tenantId, projectId, forecastVersion],
  );
  return res.rows;
}
