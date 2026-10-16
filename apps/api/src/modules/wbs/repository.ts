import type pg from "pg";
import type {
  AcceptanceCriterionItem,
  PackageStatus,
  ProjectionLinkKind,
  WbsNodeType,
} from "@alaira/domain/wbs";

export type WbsDetailRow = {
  work_node_id: string;
  wbs_code: string;
  description: string;
  package_status: PackageStatus | null;
  estimate_hours: string | null;
  deliverable_version: number;
  approval_gate_required: boolean;
};

export type HierarchyEdgeRow = {
  parent_node_id: string;
  child_node_id: string;
};

export async function insertWbsWorkNode(
  client: pg.PoolClient,
  tenantId: string,
  id: string,
  projectId: string,
  nodeType: WbsNodeType,
  title: string,
  responsibleUserId: string | null,
): Promise<{ id: string; title: string; node_type: WbsNodeType }> {
  const { rows } = await client.query<{ id: string; title: string; node_type: WbsNodeType }>(
    `INSERT INTO work_node (id, tenant_id, project_id, node_type, title, execution_mode_override,
                            responsible_user_id)
     VALUES ($1, $2, $3, $4, $5, NULL, $6)
     RETURNING id, title, node_type`,
    [id, tenantId, projectId, nodeType, title, responsibleUserId],
  );
  return rows[0]!;
}

export async function insertWbsDetail(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
  wbsCode: string,
  description: string,
  packageStatus: PackageStatus | null,
  estimateHours: number | null,
  deliverableVersion: number,
  approvalGateRequired: boolean,
): Promise<WbsDetailRow> {
  const { rows } = await client.query<WbsDetailRow>(
    `INSERT INTO wbs_node_detail (
       tenant_id, project_id, work_node_id, wbs_code, description,
       package_status, estimate_hours, deliverable_version, approval_gate_required
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING work_node_id, wbs_code, description, package_status, estimate_hours,
               deliverable_version, approval_gate_required`,
    [
      tenantId,
      projectId,
      workNodeId,
      wbsCode,
      description,
      packageStatus,
      estimateHours,
      deliverableVersion,
      approvalGateRequired,
    ],
  );
  return rows[0]!;
}

export async function insertCriterionVersion(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  id: string,
  workNodeId: string,
  version: number,
  criteria: AcceptanceCriterionItem[],
): Promise<number> {
  const { rows } = await client.query<{ version: number }>(
    `INSERT INTO acceptance_criterion_version (
       id, tenant_id, project_id, work_node_id, version, criteria
     )
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING version`,
    [id, tenantId, projectId, workNodeId, version, JSON.stringify(criteria)],
  );
  return rows[0]!.version;
}

export async function maxCriterionVersion(
  client: pg.PoolClient,
  tenantId: string,
  workNodeId: string,
): Promise<number> {
  const { rows } = await client.query<{ max: number | null }>(
    `SELECT MAX(version) AS max
     FROM acceptance_criterion_version
     WHERE tenant_id = $1 AND work_node_id = $2`,
    [tenantId, workNodeId],
  );
  return rows[0]?.max ?? 0;
}

export async function listHierarchyEdges(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<HierarchyEdgeRow[]> {
  const { rows } = await client.query<HierarchyEdgeRow>(
    `SELECT parent_node_id, child_node_id
     FROM hierarchy_edge
     WHERE tenant_id = $1 AND project_id = $2`,
    [tenantId, projectId],
  );
  return rows;
}

export async function findParentWorkNodeId(
  client: pg.PoolClient,
  tenantId: string,
  childNodeId: string,
): Promise<string | null> {
  const { rows } = await client.query<{ parent_node_id: string }>(
    `SELECT parent_node_id
     FROM hierarchy_edge
     WHERE tenant_id = $1 AND child_node_id = $2`,
    [tenantId, childNodeId],
  );
  return rows[0]?.parent_node_id ?? null;
}

export async function updateHierarchyParent(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  childNodeId: string,
  newParentId: string,
): Promise<void> {
  await client.query(
    `UPDATE hierarchy_edge
     SET parent_node_id = $4
     WHERE tenant_id = $1 AND project_id = $2 AND child_node_id = $3`,
    [tenantId, projectId, childNodeId, newParentId],
  );
}

export async function listWbsNodesForProject(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
): Promise<
  Array<{
    id: string;
    node_type: WbsNodeType;
    title: string;
    wbs_code: string;
    parent_node_id: string | null;
  }>
> {
  const { rows } = await client.query<{
    id: string;
    node_type: WbsNodeType;
    title: string;
    wbs_code: string;
    parent_node_id: string | null;
  }>(
    `SELECT wn.id, wn.node_type, wn.title, d.wbs_code, e.parent_node_id
     FROM work_node wn
     INNER JOIN wbs_node_detail d
       ON d.tenant_id = wn.tenant_id AND d.work_node_id = wn.id
     LEFT JOIN hierarchy_edge e
       ON e.tenant_id = wn.tenant_id AND e.child_node_id = wn.id
     WHERE wn.tenant_id = $1 AND wn.project_id = $2
       AND wn.node_type IN ('work_package', 'deliverable', 'milestone')
     ORDER BY d.wbs_code ASC`,
    [tenantId, projectId],
  );
  return rows;
}

export async function findWbsDetail(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
): Promise<WbsDetailRow | null> {
  const { rows } = await client.query<WbsDetailRow>(
    `SELECT work_node_id, wbs_code, description, package_status, estimate_hours,
            deliverable_version, approval_gate_required
     FROM wbs_node_detail
     WHERE tenant_id = $1 AND project_id = $2 AND work_node_id = $3`,
    [tenantId, projectId, workNodeId],
  );
  return rows[0] ?? null;
}

export async function bumpDeliverableVersion(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  workNodeId: string,
): Promise<number> {
  const { rows } = await client.query<{ deliverable_version: number }>(
    `UPDATE wbs_node_detail
     SET deliverable_version = deliverable_version + 1, updated_at = now()
     WHERE tenant_id = $1 AND project_id = $2 AND work_node_id = $3
     RETURNING deliverable_version`,
    [tenantId, projectId, workNodeId],
  );
  return rows[0]!.deliverable_version;
}

export async function insertProjectionLink(
  client: pg.PoolClient,
  tenantId: string,
  projectId: string,
  sourceWorkNodeId: string,
  targetWorkNodeId: string,
  linkKind: ProjectionLinkKind,
): Promise<void> {
  await client.query(
    `INSERT INTO work_node_projection_link (
       tenant_id, project_id, source_work_node_id, target_work_node_id, link_kind
     )
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, projectId, sourceWorkNodeId, targetWorkNodeId, linkKind],
  );
}
