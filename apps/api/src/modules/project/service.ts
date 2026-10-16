import { v7 as uuidv7 } from "uuid";
import { DomainError } from "@alaira/domain";
import { assertPolicyAllowed } from "../authz/repository.js";
import { loadAuthzActor } from "../authz/repository.js";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import {
  assertDeliveryProfile,
  parseProjectExternalId,
  resolveEffectiveExecutionMode,
  toProjectExternalId,
  type DeliveryProfile,
  type ExecutionMode,
} from "@alaira/domain/project";
import { parseExternalId, toExternalId } from "@alaira/domain/iam";
import {
  ensureProjectMembership,
  findProjectById,
  findProjectRootNode,
  findWorkNode,
  insertCustomFieldDef,
  insertHierarchyEdge,
  insertProject,
  insertWorkNode,
  listWorkNodesForProject,
  updateWorkNodeOwnership,
} from "./repository.js";

function parseProjectId(external: string): string {
  const id = parseProjectExternalId(external, "project");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

function parseWorkNodeId(external: string): string {
  const id = parseProjectExternalId(external, "workNode");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

async function assertProjectRead(session: IamSession, projectId: string): Promise<void> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:read", {
    type: "project",
    tenantId: session.tenantId,
    projectId,
  });
}

async function assertProjectWrite(session: IamSession, projectId: string): Promise<void> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:write", {
    type: "project",
    tenantId: session.tenantId,
    projectId,
  });
}

function mapDeliveryProfile(row: DeliveryProfile): DeliveryProfile {
  return assertDeliveryProfile(row);
}

export async function createProjectCommand(
  session: IamSession,
  name: string,
  deliveryProfileInput: DeliveryProfile,
): Promise<{
  id: string;
  tenantId: string;
  name: string;
  deliveryProfile: DeliveryProfile;
  version: number;
}> {
  const deliveryProfile = assertDeliveryProfile(deliveryProfileInput);
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:write", {
    type: "organization",
    tenantId: session.tenantId,
  });

  const projectId = uuidv7();
  const rootNodeId = uuidv7();

  return withTenantTx(session.tenantId, async (client) => {
    const project = await insertProject(
      client,
      session.tenantId,
      projectId,
      name,
      deliveryProfile,
    );
    await insertWorkNode(
      client,
      session.tenantId,
      rootNodeId,
      projectId,
      "project_root",
      name,
      null,
    );
    await ensureProjectMembership(client, session.tenantId, projectId, session.userId);

    return {
      id: toProjectExternalId("project", project.id),
      tenantId: toExternalId("tenant", project.tenant_id),
      name: project.name,
      deliveryProfile: mapDeliveryProfile(project.delivery_profile),
      version: project.version,
    };
  });
}

export async function getProjectCommand(
  session: IamSession,
  projectExternalId: string,
): Promise<{
  id: string;
  tenantId: string;
  name: string;
  deliveryProfile: DeliveryProfile;
  version: number;
}> {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return {
      id: toProjectExternalId("project", project.id),
      tenantId: toExternalId("tenant", project.tenant_id),
      name: project.name,
      deliveryProfile: mapDeliveryProfile(project.delivery_profile),
      version: project.version,
    };
  });
}

export async function createBranchCommand(
  session: IamSession,
  projectExternalId: string,
  title: string,
  executionModeOverride: ExecutionMode | undefined,
  parentWorkNodeExternalId: string | undefined,
): Promise<{
  id: string;
  projectId: string;
  title: string;
  nodeType: "branch";
  executionModeOverride: ExecutionMode | null;
  effectiveExecutionMode: ExecutionMode;
}> {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  const branchId = uuidv7();

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const profile = mapDeliveryProfile(project.delivery_profile);
    const override = executionModeOverride ?? null;
    const effective = resolveEffectiveExecutionMode(profile, override);

    let parentId: string;
    if (parentWorkNodeExternalId) {
      parentId = parseWorkNodeId(parentWorkNodeExternalId);
      const parent = await findWorkNode(client, session.tenantId, projectId, parentId);
      if (!parent) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }
    } else {
      const root = await findProjectRootNode(client, session.tenantId, projectId);
      if (!root) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }
      parentId = root.id;
    }

    const node = await insertWorkNode(
      client,
      session.tenantId,
      branchId,
      projectId,
      "branch",
      title,
      override,
    );
    await insertHierarchyEdge(client, session.tenantId, projectId, parentId, branchId);

    return {
      id: toProjectExternalId("workNode", node.id),
      projectId: toProjectExternalId("project", projectId),
      title: node.title,
      nodeType: "branch" as const,
      executionModeOverride: node.execution_mode_override,
      effectiveExecutionMode: effective,
    };
  });
}

export async function listBranchesCommand(
  session: IamSession,
  projectExternalId: string,
): Promise<{
  branches: Array<{
    id: string;
    title: string;
    nodeType: "project_root" | "branch";
    executionModeOverride: ExecutionMode | null;
    effectiveExecutionMode: ExecutionMode;
  }>;
}> {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const profile = mapDeliveryProfile(project.delivery_profile);
    const nodes = await listWorkNodesForProject(client, session.tenantId, projectId);

    return {
      branches: nodes
        .filter((node) => node.node_type === "branch")
        .map((node) => ({
          id: toProjectExternalId("workNode", node.id),
          title: node.title,
          nodeType: node.node_type,
          executionModeOverride: node.execution_mode_override,
          effectiveExecutionMode: resolveEffectiveExecutionMode(
            profile,
            node.execution_mode_override,
          ),
        })),
    };
  });
}

export async function defineCustomFieldCommand(
  session: IamSession,
  projectExternalId: string,
  fieldKey: string,
  fieldType: string,
  label: string,
): Promise<{ fieldKey: string; fieldType: string; label: string }> {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const row = await insertCustomFieldDef(
      client,
      session.tenantId,
      projectId,
      fieldKey,
      fieldType,
      label,
    );
    return {
      fieldKey: row.field_key,
      fieldType: row.field_type,
      label: row.label,
    };
  });
}

export async function setOwnershipCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  responsibleUserId: string | null | undefined,
  approverUserId: string | null | undefined,
): Promise<{
  workNodeId: string;
  responsibleUserId: string | null;
  approverUserId: string | null;
}> {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  const responsible =
    responsibleUserId === undefined
      ? undefined
      : responsibleUserId
        ? parseExternalId(responsibleUserId, "user")
        : null;
  const approver =
    approverUserId === undefined
      ? undefined
      : approverUserId
        ? parseExternalId(approverUserId, "user")
        : null;

  if (responsibleUserId && !responsible) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  if (approverUserId && !approver) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }

  return withTenantTx(session.tenantId, async (client) => {
    const existing = await findWorkNode(client, session.tenantId, projectId, workNodeId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const nextResponsible =
      responsible === undefined ? existing.responsible_user_id : responsible;
    const nextApprover = approver === undefined ? existing.approver_user_id : approver;
    const updated = await updateWorkNodeOwnership(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      nextResponsible,
      nextApprover,
    );
    return {
      workNodeId: toProjectExternalId("workNode", updated.id),
      responsibleUserId: updated.responsible_user_id
        ? toExternalId("user", updated.responsible_user_id)
        : null,
      approverUserId: updated.approver_user_id
        ? toExternalId("user", updated.approver_user_id)
        : null,
    };
  });
}
