import { v7 as uuidv7 } from "uuid";
import { DomainError } from "@alaira/domain";
import {
  assertNoHierarchyCycle,
  assertNonEmptyCriteria,
  assertValidWbsCode,
  buildCriterionSet,
  nextCriterionVersion,
  type AcceptanceCriterionItem,
  type PackageStatus,
  type ProjectionLinkKind,
} from "@alaira/domain/wbs";
import { parseExternalId, toExternalId } from "@alaira/domain/iam";
import {
  parseProjectExternalId,
  toProjectExternalId,
} from "@alaira/domain/project";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { assertPolicyAllowed, loadAuthzActor } from "../authz/repository.js";
import {
  findProjectById,
  findProjectRootNode,
  findWorkNode,
  insertHierarchyEdge,
} from "../project/repository.js";
import {
  bumpDeliverableVersion,
  insertCriterionVersion,
  insertProjectionLink,
  insertWbsDetail,
  insertWbsWorkNode,
  listHierarchyEdges,
  listWbsNodesForProject,
  maxCriterionVersion,
  updateHierarchyParent,
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

async function resolveParentId(
  client: Parameters<typeof findProjectRootNode>[0],
  tenantId: string,
  projectId: string,
  parentExternal: string | undefined,
): Promise<string> {
  if (parentExternal) {
    const parentId = parseWorkNodeId(parentExternal);
    const parent = await findWorkNode(client, tenantId, projectId, parentId);
    if (!parent) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return parentId;
  }
  const root = await findProjectRootNode(client, tenantId, projectId);
  if (!root) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return root.id;
}

function mapPgUnique(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}

export async function createPackageCommand(
  session: IamSession,
  projectExternalId: string,
  input: {
    wbsCode: string;
    title: string;
    description?: string;
    parentWorkNodeId?: string;
    responsibleUserId?: string | null;
    estimateHours?: number;
    status?: PackageStatus;
    criteria: AcceptanceCriterionItem[];
  },
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);
  const wbsCode = assertValidWbsCode(input.wbsCode);
  const criteria = assertNonEmptyCriteria(input.criteria);
  const status = input.status ?? "draft";

  const responsible =
    input.responsibleUserId === undefined || input.responsibleUserId === null
      ? null
      : parseExternalId(input.responsibleUserId, "user");
  if (input.responsibleUserId && !responsible) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }

  const nodeId = uuidv7();
  const criterionId = uuidv7();

  try {
    return await withTenantTx(session.tenantId, async (client) => {
      const project = await findProjectById(client, session.tenantId, projectId);
      if (!project) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }

      const parentId = await resolveParentId(
        client,
        session.tenantId,
        projectId,
        input.parentWorkNodeId,
      );
      const edges = await listHierarchyEdges(client, session.tenantId, projectId);
      assertNoHierarchyCycle(
        edges.map((e) => ({ parentId: e.parent_node_id, childId: e.child_node_id })),
        parentId,
        nodeId,
      );

      await insertWbsWorkNode(
        client,
        session.tenantId,
        nodeId,
        projectId,
        "work_package",
        input.title,
        responsible,
      );
      await insertWbsDetail(
        client,
        session.tenantId,
        projectId,
        nodeId,
        wbsCode,
        input.description ?? "",
        status,
        input.estimateHours ?? null,
        1,
        false,
      );
      await insertHierarchyEdge(client, session.tenantId, projectId, parentId, nodeId);
      const criteriaVersion = await insertCriterionVersion(
        client,
        session.tenantId,
        projectId,
        criterionId,
        nodeId,
        1,
        buildCriterionSet(1, criteria).criteria,
      );

      return {
        id: toProjectExternalId("workNode", nodeId),
        projectId: toProjectExternalId("project", projectId),
        nodeType: "work_package" as const,
        wbsCode,
        title: input.title,
        description: input.description ?? "",
        status,
        estimateHours: input.estimateHours ?? null,
        responsibleUserId: responsible ? toExternalId("user", responsible) : null,
        criteriaVersion,
      };
    });
  } catch (error) {
    if (mapPgUnique(error)) {
      throw new DomainError("CONFLICT", "WBS code already exists in project");
    }
    throw error;
  }
}

export async function createDeliverableCommand(
  session: IamSession,
  projectExternalId: string,
  input: {
    wbsCode: string;
    title: string;
    description?: string;
    parentWorkNodeId: string;
    criteria: AcceptanceCriterionItem[];
  },
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);
  const wbsCode = assertValidWbsCode(input.wbsCode);
  const criteria = assertNonEmptyCriteria(input.criteria);
  const parentId = parseWorkNodeId(input.parentWorkNodeId);

  const nodeId = uuidv7();
  const criterionId = uuidv7();

  try {
    return await withTenantTx(session.tenantId, async (client) => {
      const project = await findProjectById(client, session.tenantId, projectId);
      if (!project) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }
      const parent = await findWorkNode(client, session.tenantId, projectId, parentId);
      if (!parent || (parent.node_type as string) !== "work_package") {
        throw new DomainError("VALIDATION", "Deliverable parent must be a work package");
      }

      const edges = await listHierarchyEdges(client, session.tenantId, projectId);
      assertNoHierarchyCycle(
        edges.map((e) => ({ parentId: e.parent_node_id, childId: e.child_node_id })),
        parentId,
        nodeId,
      );

      await insertWbsWorkNode(
        client,
        session.tenantId,
        nodeId,
        projectId,
        "deliverable",
        input.title,
        null,
      );
      await insertWbsDetail(
        client,
        session.tenantId,
        projectId,
        nodeId,
        wbsCode,
        input.description ?? "",
        null,
        null,
        1,
        false,
      );
      await insertHierarchyEdge(client, session.tenantId, projectId, parentId, nodeId);
      const criteriaVersion = await insertCriterionVersion(
        client,
        session.tenantId,
        projectId,
        criterionId,
        nodeId,
        1,
        buildCriterionSet(1, criteria).criteria,
      );

      return {
        id: toProjectExternalId("workNode", nodeId),
        projectId: toProjectExternalId("project", projectId),
        nodeType: "deliverable" as const,
        wbsCode,
        title: input.title,
        description: input.description ?? "",
        deliverableVersion: 1,
        criteriaVersion,
        parentWorkNodeId: toProjectExternalId("workNode", parentId),
      };
    });
  } catch (error) {
    if (mapPgUnique(error)) {
      throw new DomainError("CONFLICT", "WBS code already exists in project");
    }
    throw error;
  }
}

export async function updateDeliverableCriteriaCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  criteriaInput: AcceptanceCriterionItem[],
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);
  const criteria = assertNonEmptyCriteria(criteriaInput);

  return withTenantTx(session.tenantId, async (client) => {
    const node = await findWorkNode(client, session.tenantId, projectId, workNodeId);
    if (!node || (node.node_type as string) !== "deliverable") {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const currentMax = await maxCriterionVersion(client, session.tenantId, workNodeId);
    const version = nextCriterionVersion(currentMax);
    await insertCriterionVersion(
      client,
      session.tenantId,
      projectId,
      uuidv7(),
      workNodeId,
      version,
      buildCriterionSet(version, criteria).criteria,
    );
    return {
      workNodeId: toProjectExternalId("workNode", workNodeId),
      criteriaVersion: version,
      criteria: buildCriterionSet(version, criteria).criteria,
    };
  });
}

export async function bumpDeliverableRevisionCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const node = await findWorkNode(client, session.tenantId, projectId, workNodeId);
    if (!node || (node.node_type as string) !== "deliverable") {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const version = await bumpDeliverableVersion(
      client,
      session.tenantId,
      projectId,
      workNodeId,
    );
    return {
      workNodeId: toProjectExternalId("workNode", workNodeId),
      deliverableVersion: version,
    };
  });
}

export async function createMilestoneCommand(
  session: IamSession,
  projectExternalId: string,
  input: {
    wbsCode: string;
    title: string;
    parentWorkNodeId?: string;
    approvalGateRequired?: boolean;
  },
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);
  const wbsCode = assertValidWbsCode(input.wbsCode);
  const nodeId = uuidv7();

  try {
    return await withTenantTx(session.tenantId, async (client) => {
      const project = await findProjectById(client, session.tenantId, projectId);
      if (!project) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }
      const parentId = await resolveParentId(
        client,
        session.tenantId,
        projectId,
        input.parentWorkNodeId,
      );
      const edges = await listHierarchyEdges(client, session.tenantId, projectId);
      assertNoHierarchyCycle(
        edges.map((e) => ({ parentId: e.parent_node_id, childId: e.child_node_id })),
        parentId,
        nodeId,
      );

      await insertWbsWorkNode(
        client,
        session.tenantId,
        nodeId,
        projectId,
        "milestone",
        input.title,
        null,
      );
      await insertWbsDetail(
        client,
        session.tenantId,
        projectId,
        nodeId,
        wbsCode,
        "",
        null,
        null,
        1,
        input.approvalGateRequired ?? false,
      );
      await insertHierarchyEdge(client, session.tenantId, projectId, parentId, nodeId);

      return {
        id: toProjectExternalId("workNode", nodeId),
        projectId: toProjectExternalId("project", projectId),
        nodeType: "milestone" as const,
        wbsCode,
        title: input.title,
        approvalGateRequired: input.approvalGateRequired ?? false,
        parentWorkNodeId: toProjectExternalId("workNode", parentId),
      };
    });
  } catch (error) {
    if (mapPgUnique(error)) {
      throw new DomainError("CONFLICT", "WBS code already exists in project");
    }
    throw error;
  }
}

export async function reparentWbsNodeCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  parentWorkNodeExternalId: string,
) {
  const projectId = parseProjectId(projectExternalId);
  const childId = parseWorkNodeId(workNodeExternalId);
  const newParentId = parseWorkNodeId(parentWorkNodeExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const child = await findWorkNode(client, session.tenantId, projectId, childId);
    if (!child || !["work_package", "deliverable", "milestone"].includes(child.node_type)) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const parent = await findWorkNode(client, session.tenantId, projectId, newParentId);
    if (!parent) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const edges = await listHierarchyEdges(client, session.tenantId, projectId);
    assertNoHierarchyCycle(
      edges.map((e) => ({ parentId: e.parent_node_id, childId: e.child_node_id })),
      newParentId,
      childId,
    );

    await updateHierarchyParent(client, session.tenantId, projectId, childId, newParentId);
    return {
      workNodeId: toProjectExternalId("workNode", childId),
      parentWorkNodeId: toProjectExternalId("workNode", newParentId),
    };
  });
}

export async function listWbsTreeCommand(session: IamSession, projectExternalId: string) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const nodes = await listWbsNodesForProject(client, session.tenantId, projectId);
    return {
      nodes: nodes.map((node) => ({
        id: toProjectExternalId("workNode", node.id),
        nodeType: node.node_type,
        wbsCode: node.wbs_code,
        title: node.title,
        parentWorkNodeId: node.parent_node_id
          ? toProjectExternalId("workNode", node.parent_node_id)
          : null,
      })),
    };
  });
}

export async function createProjectionLinkCommand(
  session: IamSession,
  projectExternalId: string,
  sourceExternalId: string,
  targetExternalId: string,
  linkKind: ProjectionLinkKind,
) {
  const projectId = parseProjectId(projectExternalId);
  const sourceId = parseWorkNodeId(sourceExternalId);
  const targetId = parseWorkNodeId(targetExternalId);
  await assertProjectWrite(session, projectId);

  if (sourceId === targetId) {
    throw new DomainError("VALIDATION", "Cannot link a node to itself");
  }

  return withTenantTx(session.tenantId, async (client) => {
    const source = await findWorkNode(client, session.tenantId, projectId, sourceId);
    const target = await findWorkNode(client, session.tenantId, projectId, targetId);
    if (!source || !target) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    await insertProjectionLink(
      client,
      session.tenantId,
      projectId,
      sourceId,
      targetId,
      linkKind,
    );
    return {
      sourceWorkNodeId: toProjectExternalId("workNode", sourceId),
      targetWorkNodeId: toProjectExternalId("workNode", targetId),
      linkKind,
    };
  });
}
