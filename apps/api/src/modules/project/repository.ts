import type pg from "pg";
import type { DeliveryProfile, ExecutionMode } from "@alaira/domain/project";

export type ProjectRow = {
  id: string;
  tenant_id: string;
  name: string;
  delivery_profile: DeliveryProfile;
  version: number;
};

export type WorkNodeRow = {
  id: string;
  project_id: string;
  node_type: "project_root" | "branch";
  title: string;
  execution_mode_override: ExecutionMode | null;
  responsible_user_id: string | null;
  approver_user_id: string | null;
};

export async function insertProject(
  client: pg.PoolClient,
  tenantId: string,
  id: string,
  name: string,
  deliveryProfile: DeliveryProfile,
): Promise<ProjectRow> {
  const { rows } = await client.query<ProjectRow>(
    `INSERT INTO project (id, tenant_id, name, delivery_profile)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, tenant_id, name, delivery_profile, version`,
    [id, tenantId, name, JSON.stringify(deliveryProfile)],
  );
  return rows[0]!;
}

export async function findProjectById(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<ProjectRow | null> {
  const { rows } = await client.query<ProjectRow>(
    `SELECT id, tenant_id, name, delivery_profile, version
     FROM project WHERE tenant_id = $1 AND id = $2`,
    [tenantId, projectId],
  );
  return rows[0] ?? null;
}

export async function insertWorkNode(
  client: pg.PoolClient,
  tenantId: string,
  id: string,
  projectId: string,
  nodeType: WorkNodeRow["node_type"],
  title: string,
  executionModeOverride: ExecutionMode | null,
): Promise<WorkNodeRow> {
  const { rows } = await client.query<WorkNodeRow>(
    `INSERT INTO work_node (id, tenant_id, project_id, node_type, title, execution_mode_override)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, project_id, node_type, title, execution_mode_override,
               responsible_user_id, approver_user_id`,
    [id, tenantId, projectId, nodeType, title, executionModeOverride],
  );
  return rows[0]!;
}

export async function insertHierarchyEdge(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  parentNodeId: string,
  childNodeId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO hierarchy_edge (tenant_id, project_id, parent_node_id, child_node_id)
     VALUES ($1, $2, $3, $4)`,
    [tenantId, projectId, parentNodeId, childNodeId],
  );
}

export async function listWorkNodesForProject(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<WorkNodeRow[]> {
  const { rows } = await client.query<WorkNodeRow>(
    `SELECT id, project_id, node_type, title, execution_mode_override,
            responsible_user_id, approver_user_id
     FROM work_node
     WHERE tenant_id = $1 AND project_id = $2
     ORDER BY created_at ASC`,
    [tenantId, projectId],
  );
  return rows;
}

export async function findWorkNode(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
): Promise<WorkNodeRow | null> {
  const { rows } = await client.query<WorkNodeRow>(
    `SELECT id, project_id, node_type, title, execution_mode_override,
            responsible_user_id, approver_user_id
     FROM work_node
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3`,
    [tenantId, projectId, workNodeId],
  );
  return rows[0] ?? null;
}

export async function findProjectRootNode(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<WorkNodeRow | null> {
  const { rows } = await client.query<WorkNodeRow>(
    `SELECT id, project_id, node_type, title, execution_mode_override,
            responsible_user_id, approver_user_id
     FROM work_node
     WHERE tenant_id = $1 AND project_id = $2 AND node_type = 'project_root'
     LIMIT 1`,
    [tenantId, projectId],
  );
  return rows[0] ?? null;
}

export async function insertCustomFieldDef(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  fieldKey: string,
  fieldType: string,
  label: string,
): Promise<{ field_key: string; field_type: string; label: string }> {
  const { rows } = await client.query<{ field_key: string; field_type: string; label: string }>(
    `INSERT INTO project_custom_field_def (tenant_id, project_id, field_key, field_type, label)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING field_key, field_type, label`,
    [tenantId, projectId, fieldKey, fieldType, label],
  );
  return rows[0]!;
}

export async function updateWorkNodeOwnership(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
  responsibleUserId: string | null,
  approverUserId: string | null,
): Promise<WorkNodeRow> {
  const { rows } = await client.query<WorkNodeRow>(
    `UPDATE work_node
     SET responsible_user_id = $4, approver_user_id = $5, version = version + 1
     WHERE tenant_id = $1 AND project_id = $2 AND id = $3
     RETURNING id, project_id, node_type, title, execution_mode_override,
               responsible_user_id, approver_user_id`,
    [tenantId, projectId, workNodeId, responsibleUserId, approverUserId],
  );
  return rows[0]!;
}

export async function ensureProjectMembership(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  userId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO authz_project_membership (tenant_id, project_id, user_id, project_role)
     VALUES ($1, $2, $3, 'pm')
     ON CONFLICT (tenant_id, project_id, user_id) DO NOTHING`,
    [tenantId, projectId, userId],
  );
}
