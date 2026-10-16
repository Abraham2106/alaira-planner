import type pg from "pg";
import type { WorkCalendarDefinition } from "@alaira/domain/schedule";

export type PersonRow = {
  id: string;
  project_id: string;
  display_name: string;
  team_name: string | null;
  max_units: string;
  calendar: WorkCalendarDefinition;
};

export type AssignmentRow = {
  id: string;
  project_id: string;
  person_id: string;
  work_node_id: string;
  units: string;
  work_minutes: string;
  duration_minutes: string;
  scheduled_start_epoch_ms: string;
  scheduled_finish_epoch_ms: string;
};

export async function insertPerson(
  client: pg.PoolClient,
  tenantId: string,
  id: string,
  projectId: string,
  displayName: string,
  teamName: string | null,
  maxUnits: number,
  calendar: WorkCalendarDefinition,
): Promise<PersonRow> {
  const { rows } = await client.query<PersonRow>(
    `INSERT INTO project_person_resource (
       id, tenant_id, project_id, display_name, team_name, max_units, calendar
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING id, project_id, display_name, team_name, max_units, calendar`,
    [id, tenantId, projectId, displayName, teamName, maxUnits, JSON.stringify(calendar)],
  );
  return rows[0]!;
}

export async function listPeopleForProject(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<PersonRow[]> {
  const { rows } = await client.query<PersonRow>(
    `SELECT id, project_id, display_name, team_name, max_units, calendar
     FROM project_person_resource
     WHERE tenant_id = $1 AND project_id = $2
     ORDER BY display_name ASC`,
    [tenantId, projectId],
  );
  return rows;
}

export async function findPerson(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  personId: string,
): Promise<PersonRow | null> {
  const { rows } = await client.query<PersonRow>(
    `SELECT id, project_id, display_name, team_name, max_units, calendar
     FROM project_person_resource
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
    [tenantId, projectId, personId],
  );
  return rows[0] ?? null;
}

export async function insertAssignment(
  client: pg.PoolClient,
  tenantId: string,
  id: string,
  projectId: string,
  personId: string,
  workNodeId: string,
  units: number,
  workMinutes: number,
  durationMinutes: number,
  scheduledStartEpochMs: number,
  scheduledFinishEpochMs: number,
): Promise<AssignmentRow> {
  const { rows } = await client.query<AssignmentRow>(
    `INSERT INTO work_node_resource_assignment (
       id, tenant_id, project_id, person_id, work_node_id,
       units, work_minutes, duration_minutes,
       scheduled_start_epoch_ms, scheduled_finish_epoch_ms
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, project_id, person_id, work_node_id, units, work_minutes, duration_minutes,
               scheduled_start_epoch_ms, scheduled_finish_epoch_ms`,
    [
      id,
      tenantId,
      projectId,
      personId,
      workNodeId,
      units,
      workMinutes,
      durationMinutes,
      scheduledStartEpochMs,
      scheduledFinishEpochMs,
    ],
  );
  return rows[0]!;
}

export async function listAssignmentsForProject(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<AssignmentRow[]> {
  const { rows } = await client.query<AssignmentRow>(
    `SELECT id, project_id, person_id, work_node_id, units, work_minutes, duration_minutes,
            scheduled_start_epoch_ms, scheduled_finish_epoch_ms
     FROM work_node_resource_assignment
     WHERE tenant_id = $1 AND project_id = $2
     ORDER BY created_at ASC`,
    [tenantId, projectId],
  );
  return rows;
}

export async function findAssignment(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  assignmentId: string,
): Promise<AssignmentRow | null> {
  const { rows } = await client.query<AssignmentRow>(
    `SELECT id, project_id, person_id, work_node_id, units, work_minutes, duration_minutes,
            scheduled_start_epoch_ms, scheduled_finish_epoch_ms
     FROM work_node_resource_assignment
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
    [tenantId, projectId, assignmentId],
  );
  return rows[0] ?? null;
}

export async function updateAssignmentMetrics(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  assignmentId: string,
  patch: {
    units: number;
    workMinutes: number;
    durationMinutes: number;
    scheduledStartEpochMs?: number;
    scheduledFinishEpochMs?: number;
  },
): Promise<AssignmentRow> {
  const { rows } = await client.query<AssignmentRow>(
    `UPDATE work_node_resource_assignment
     SET units = $4,
         work_minutes = $5,
         duration_minutes = $6,
         scheduled_start_epoch_ms = COALESCE($7, scheduled_start_epoch_ms),
         scheduled_finish_epoch_ms = COALESCE($8, scheduled_finish_epoch_ms),
         updated_at = now()
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3
     RETURNING id, project_id, person_id, work_node_id, units, work_minutes, duration_minutes,
               scheduled_start_epoch_ms, scheduled_finish_epoch_ms`,
    [
      tenantId,
      projectId,
      assignmentId,
      patch.units,
      patch.workMinutes,
      patch.durationMinutes,
      patch.scheduledStartEpochMs ?? null,
      patch.scheduledFinishEpochMs ?? null,
    ],
  );
  return rows[0]!;
}
