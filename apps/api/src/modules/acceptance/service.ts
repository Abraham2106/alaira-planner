import { v7 as uuidv7 } from "uuid";
import { DomainError } from "@alaira/domain";
import { assertAcceptanceCriteriaConfigured } from "@alaira/domain/wbs";
import type { AcceptanceCriterionSet } from "@alaira/domain/wbs";
import {
  applyAcceptanceDecision,
  applyCompletionRequest,
  applyRejectionDecision,
  applyRevertAcceptance,
  assertRequiredCriteriaSatisfied,
  computeWeightedRollup,
  defaultStrategyForNodeType,
  pickRollupLeaves,
  progressFromDeliverableAcceptance,
  progressFromManualPercent,
  progressFromWeightedChecklist,
  toAcceptanceExternalId,
  type CriterionEvaluation,
  type LifecycleState,
  type ProgressStrategyKind,
  type WeightedChecklistConfig,
} from "@alaira/domain/acceptance";
import { buildCompensatingAuditEventInput as buildCompEvent } from "@alaira/domain/eventlog";
import { toExternalId } from "@alaira/domain/iam";
import { parseProjectExternalId, toProjectExternalId } from "@alaira/domain/project";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { assertPolicyAllowed, loadAuthzActor } from "../authz/repository.js";
import { ensureEventlogProject } from "../baseline/repository.js";
import { findProjectById } from "../project/repository.js";
import { appendProjectEventLogCommand } from "../eventlog/service.js";
import {
  ensureLifecycleRow,
  findDecisionById,
  findDecisionByIdempotency,
  findDeliverableNode,
  findProject,
  findWorkNode,
  getLatestCriterionVersion,
  getLatestStrategy,
  getLifecycle,
  getProgress,
  insertDecision,
  insertStrategyVersion,
  listChecklistProgress,
  listDescendantWorkNodes,
  listHierarchyEdges,
  maxStrategyVersion,
  updateLifecycle,
  upsertChecklistItem,
  upsertProgress,
  type LifecycleRow,
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

function mapLifecycleRow(row: LifecycleRow): LifecycleState {
  return {
    executionStatus: row.execution_status,
    completionRequestStatus: row.completion_request_status,
    acceptanceStatus: row.acceptance_status,
  };
}

function parseCriterionSet(criteria: unknown, version: number): AcceptanceCriterionSet {
  if (Array.isArray(criteria)) {
    return { version, criteria: criteria as AcceptanceCriterionSet["criteria"] };
  }
  const raw = criteria as AcceptanceCriterionSet;
  if (!raw || !Array.isArray(raw.criteria)) {
    throw new DomainError("CONFLICT", "Acceptance criteria malformed");
  }
  return { ...raw, version: raw.version ?? version };
}

async function ensureProjectEventLog(
  session: IamSession,
  projectId: string,
): Promise<void> {
  await withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (project) {
      await ensureEventlogProject(client, session.tenantId, projectId, project.name);
    }
  });
}

async function ensureDefaultStrategy(
  client: Parameters<typeof maxStrategyVersion>[0],
  tenantId: string,
  projectId: string,
  workNodeId: string,
  nodeType: string,
) {
  const existing = await getLatestStrategy(client, tenantId, workNodeId);
  if (existing) return existing;
  const id = uuidv7();
  const kind = defaultStrategyForNodeType(nodeType);
  await insertStrategyVersion(client, {
    id,
    tenantId,
    projectId,
    workNodeId,
    version: 1,
    strategyKind: kind,
    config: {},
  });
  return {
    id,
    version: 1,
    strategy_kind: kind,
    config: {},
  };
}

async function recomputeProgressForNode(
  client: Parameters<typeof getLatestStrategy>[0],
  tenantId: string,
  projectId: string,
  workNodeId: string,
  lifecycle: LifecycleState,
  sourceDecisionId: string | null,
): Promise<number> {
  const node = await findWorkNode(client, tenantId, projectId, workNodeId);
  if (!node) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  const strategy = await ensureDefaultStrategy(
    client,
    tenantId,
    projectId,
    workNodeId,
    node.node_type,
  );
  let percent = 0;
  let manualPercent: number | null = null;
  const kind = strategy.strategy_kind as ProgressStrategyKind;
  if (kind === "deliverable_acceptance") {
    percent = progressFromDeliverableAcceptance(lifecycle.acceptanceStatus);
  } else if (kind === "manual") {
    const current = await getProgress(client, tenantId, workNodeId);
    manualPercent = current?.progress_percent ?? 0;
    percent = progressFromManualPercent(manualPercent);
  } else if (kind === "weighted_checklist") {
    const config = strategy.config as WeightedChecklistConfig;
    const rows = await listChecklistProgress(client, tenantId, workNodeId);
    const completed = new Set(rows.filter((r) => r.completed).map((r) => r.criterion_key));
    percent = progressFromWeightedChecklist(config, completed);
  } else {
    percent = 0;
  }
  await upsertProgress(client, {
    tenantId,
    projectId,
    workNodeId,
    progressPercent: percent,
    strategyVersionId: strategy.id,
    manualPercent,
    sourceDecisionId,
  });
  return percent;
}

function mapDecisionDto(
  projectExternalId: string,
  decision: {
    id: string;
    work_node_id: string;
    decision_type: string;
    criterion_version_id: string | null;
    criterion_evaluations: unknown;
    reason: string | null;
    actor_user_id: string;
    created_at: Date;
  },
  lifecycle: LifecycleState,
  progressPercent: number,
  criterionVersion: number | null,
) {
  return {
    id: toAcceptanceExternalId("acceptanceDecision", decision.id),
    decisionType: decision.decision_type as
      | "completion_request"
      | "accept"
      | "reject"
      | "revert_acceptance",
    workNodeId: toProjectExternalId("workNode", decision.work_node_id),
    criterionVersion,
    criterionEvaluations: decision.criterion_evaluations as CriterionEvaluation[],
    reason: decision.reason,
    actorUserId: toExternalId("user", decision.actor_user_id),
    createdAt: new Date(decision.created_at).toISOString(),
    lifecycle,
    progressPercent,
  };
}

async function loadDecisionDto(
  client: Parameters<typeof findDecisionById>[0],
  tenantId: string,
  projectId: string,
  projectExternalId: string,
  decisionId: string,
) {
  const decision = await findDecisionById(client, tenantId, decisionId);
  if (!decision) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  const lifecycleRow = await getLifecycle(client, tenantId, decision.work_node_id);
  const lifecycle: LifecycleState = lifecycleRow
    ? mapLifecycleRow(lifecycleRow)
    : {
        executionStatus: "in_progress",
        completionRequestStatus: "none",
        acceptanceStatus: "not_accepted",
      };
  const progress = await getProgress(client, tenantId, decision.work_node_id);
  let criterionVersion: number | null = null;
  if (decision.criterion_version_id) {
    const cv = await getLatestCriterionVersion(client, tenantId, decision.work_node_id);
    criterionVersion = cv?.version ?? null;
  }
  return mapDecisionDto(
    projectExternalId,
    decision,
    lifecycle,
    progress?.progress_percent ?? 0,
    criterionVersion,
  );
}

export async function requestCompletionCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  idempotencyKey: string,
  _note?: string,
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  const dto = await withTenantTx(session.tenantId, async (client) => {
    const project = await findProject(client, session.tenantId, projectId);
    if (!project) throw new DomainError("NOT_FOUND", "Resource not found");
    const deliverable = await findDeliverableNode(client, session.tenantId, projectId, workNodeId);
    if (!deliverable) throw new DomainError("NOT_FOUND", "Resource not found");

    const existing = await findDecisionByIdempotency(client, session.tenantId, idempotencyKey);
    if (existing) {
      if (existing.work_node_id !== workNodeId) {
        throw new DomainError("CONFLICT", "Idempotency key used for another deliverable");
      }
      return {
        result: await loadDecisionDto(
          client,
          session.tenantId,
          projectId,
          projectExternalId,
          existing.id,
        ),
        audit: null as { title: string } | null,
      };
    }

    const row = await ensureLifecycleRow(client, session.tenantId, projectId, workNodeId);
    const next = applyCompletionRequest(mapLifecycleRow(row));
    await updateLifecycle(client, session.tenantId, workNodeId, {
      execution_status: next.executionStatus,
      completion_request_status: next.completionRequestStatus,
      acceptance_status: next.acceptanceStatus,
    });

    const decisionId = uuidv7();
    await insertDecision(client, {
      id: decisionId,
      tenantId: session.tenantId,
      projectId,
      workNodeId,
      decisionType: "completion_request",
      criterionVersionId: null,
      criterionEvaluations: [],
      reason: _note ?? "Completion requested",
      actorUserId: session.userId,
      idempotencyKey,
      evidenceRefs: [],
    });

    const percent = await recomputeProgressForNode(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      next,
      null,
    );

    const decision = await findDecisionById(client, session.tenantId, decisionId);
    return {
      result: mapDecisionDto(projectExternalId, decision!, next, percent, null),
      audit: { title: deliverable.title },
    };
  });

  if (dto.audit) {
    await ensureProjectEventLog(session, projectId);
    await appendProjectEventLogCommand(session, projectId, `acc-req-${idempotencyKey}`, {
      eventType: "deliverable.completion_requested",
      summary: `Completion requested for ${dto.audit.title}`,
      aggregateId: workNodeId,
      payload: { workNodeId },
    });
  }
  return dto.result;
}

export async function acceptDeliverableCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  idempotencyKey: string,
  evaluations: CriterionEvaluation[],
  reason?: string,
  evidenceRefs?: string[],
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  const dto = await withTenantTx(session.tenantId, async (client) => {
    const project = await findProject(client, session.tenantId, projectId);
    if (!project) throw new DomainError("NOT_FOUND", "Resource not found");
    const deliverable = await findDeliverableNode(client, session.tenantId, projectId, workNodeId);
    if (!deliverable) throw new DomainError("NOT_FOUND", "Resource not found");

    const existing = await findDecisionByIdempotency(client, session.tenantId, idempotencyKey);
    if (existing) {
      if (existing.work_node_id !== workNodeId) {
        throw new DomainError("CONFLICT", "Idempotency key used for another deliverable");
      }
      return {
        result: await loadDecisionDto(
          client,
          session.tenantId,
          projectId,
          projectExternalId,
          existing.id,
        ),
        audit: null,
      };
    }

    const criterionRow = await getLatestCriterionVersion(client, session.tenantId, workNodeId);
    const criterionSet = criterionRow
      ? parseCriterionSet(criterionRow.criteria, criterionRow.version)
      : null;
    assertAcceptanceCriteriaConfigured(criterionSet);
    assertRequiredCriteriaSatisfied(criterionSet!, evaluations);

    const row = await ensureLifecycleRow(client, session.tenantId, projectId, workNodeId);
    const next = applyAcceptanceDecision(mapLifecycleRow(row));
    await updateLifecycle(client, session.tenantId, workNodeId, {
      execution_status: next.executionStatus,
      completion_request_status: next.completionRequestStatus,
      acceptance_status: next.acceptanceStatus,
    });

    const decisionId = uuidv7();
    await insertDecision(client, {
      id: decisionId,
      tenantId: session.tenantId,
      projectId,
      workNodeId,
      decisionType: "accept",
      criterionVersionId: criterionRow?.id ?? null,
      criterionEvaluations: evaluations,
      reason: reason ?? null,
      actorUserId: session.userId,
      idempotencyKey,
      evidenceRefs: evidenceRefs ?? [],
    });

    const percent = await recomputeProgressForNode(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      next,
      decisionId,
    );

    const decision = await findDecisionById(client, session.tenantId, decisionId);
    return {
      result: mapDecisionDto(
        projectExternalId,
        decision!,
        next,
        percent,
        criterionRow?.version ?? null,
      ),
      audit: { title: deliverable.title, criterionVersion: criterionRow?.version },
    };
  });

  if (dto.audit) {
    await ensureProjectEventLog(session, projectId);
    await appendProjectEventLogCommand(session, projectId, `acc-accept-${idempotencyKey}`, {
      eventType: "deliverable.accepted",
      summary: `Deliverable accepted: ${dto.audit.title}`,
      aggregateId: workNodeId,
      payload: { workNodeId, criterionVersion: dto.audit.criterionVersion },
      effect: "progress_updated",
    });
  }
  return dto.result;
}

export async function rejectDeliverableCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  idempotencyKey: string,
  reason: string,
  observations?: string,
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  const dto = await withTenantTx(session.tenantId, async (client) => {
    const deliverable = await findDeliverableNode(client, session.tenantId, projectId, workNodeId);
    if (!deliverable) throw new DomainError("NOT_FOUND", "Resource not found");

    const existing = await findDecisionByIdempotency(client, session.tenantId, idempotencyKey);
    if (existing) {
      return {
        result: await loadDecisionDto(
          client,
          session.tenantId,
          projectId,
          projectExternalId,
          existing.id,
        ),
        audit: null,
      };
    }

    const row = await ensureLifecycleRow(client, session.tenantId, projectId, workNodeId);
    const next = applyRejectionDecision(mapLifecycleRow(row), reason);
    await updateLifecycle(client, session.tenantId, workNodeId, {
      execution_status: next.executionStatus,
      completion_request_status: next.completionRequestStatus,
      acceptance_status: next.acceptanceStatus,
    });

    const decisionId = uuidv7();
    const fullReason = observations ? `${reason} — ${observations}` : reason;
    await insertDecision(client, {
      id: decisionId,
      tenantId: session.tenantId,
      projectId,
      workNodeId,
      decisionType: "reject",
      criterionVersionId: null,
      criterionEvaluations: [],
      reason: fullReason,
      actorUserId: session.userId,
      idempotencyKey,
      evidenceRefs: [],
    });

    const percent = await recomputeProgressForNode(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      next,
      decisionId,
    );

    const decision = await findDecisionById(client, session.tenantId, decisionId);
    return {
      result: mapDecisionDto(projectExternalId, decision!, next, percent, null),
      audit: { reason },
    };
  });

  if (dto.audit) {
    await ensureProjectEventLog(session, projectId);
    await appendProjectEventLogCommand(session, projectId, `acc-reject-${idempotencyKey}`, {
      eventType: "deliverable.rejected",
      summary: `Deliverable rejected: ${dto.audit.reason}`,
      aggregateId: workNodeId,
      payload: { workNodeId },
    });
  }
  return dto.result;
}

export async function revertAcceptanceCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  idempotencyKey: string,
  reason: string,
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  const dto = await withTenantTx(session.tenantId, async (client) => {
    const deliverable = await findDeliverableNode(client, session.tenantId, projectId, workNodeId);
    if (!deliverable) throw new DomainError("NOT_FOUND", "Resource not found");

    const existing = await findDecisionByIdempotency(client, session.tenantId, idempotencyKey);
    if (existing) {
      return {
        result: await loadDecisionDto(
          client,
          session.tenantId,
          projectId,
          projectExternalId,
          existing.id,
        ),
        audit: null,
      };
    }

    const row = await ensureLifecycleRow(client, session.tenantId, projectId, workNodeId);
    const next = applyRevertAcceptance(mapLifecycleRow(row), reason);
    await updateLifecycle(client, session.tenantId, workNodeId, {
      execution_status: next.executionStatus,
      completion_request_status: next.completionRequestStatus,
      acceptance_status: next.acceptanceStatus,
    });

    const decisionId = uuidv7();
    await insertDecision(client, {
      id: decisionId,
      tenantId: session.tenantId,
      projectId,
      workNodeId,
      decisionType: "revert_acceptance",
      criterionVersionId: null,
      criterionEvaluations: [],
      reason,
      actorUserId: session.userId,
      idempotencyKey,
      evidenceRefs: [],
    });

    const percent = await recomputeProgressForNode(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      next,
      decisionId,
    );

    const decision = await findDecisionById(client, session.tenantId, decisionId);
    return {
      result: mapDecisionDto(projectExternalId, decision!, next, percent, null),
      audit: { reason, decisionId },
    };
  });

  if (dto.audit) {
    await ensureProjectEventLog(session, projectId);
    const compensating = buildCompEvent("deliverable.accepted", dto.audit.reason, dto.audit.decisionId);
    await appendProjectEventLogCommand(session, projectId, `acc-revert-${idempotencyKey}`, {
      ...compensating,
      aggregateId: workNodeId,
      payload: { workNodeId, reversedDecisionId: dto.audit.decisionId },
      effect: "progress_updated",
    });
  }
  return dto.result;
}

export async function getDeliverableLifecycleCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const deliverable = await findDeliverableNode(client, session.tenantId, projectId, workNodeId);
    if (!deliverable) throw new DomainError("NOT_FOUND", "Resource not found");
    const row = await ensureLifecycleRow(client, session.tenantId, projectId, workNodeId);
    const lifecycle = mapLifecycleRow(row);
    const progress = await getProgress(client, session.tenantId, workNodeId);
    const latestDecisionId = progress?.source_decision_id
      ? toAcceptanceExternalId("acceptanceDecision", progress.source_decision_id)
      : null;
    return {
      workNodeId: workNodeExternalId,
      lifecycle,
      progressPercent: progress?.progress_percent ?? 0,
      latestDecisionId,
    };
  });
}

export async function setProgressStrategyCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  strategyKind: ProgressStrategyKind,
  checklistWeights?: { key: string; weight: number }[],
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const node = await findWorkNode(client, session.tenantId, projectId, workNodeId);
    if (!node) throw new DomainError("NOT_FOUND", "Resource not found");

    const nextVersion = (await maxStrategyVersion(client, session.tenantId, workNodeId)) + 1;
    const config: WeightedChecklistConfig | Record<string, never> =
      strategyKind === "weighted_checklist"
        ? { items: checklistWeights ?? [] }
        : {};
    if (strategyKind === "weighted_checklist" && (checklistWeights?.length ?? 0) === 0) {
      throw new DomainError("VALIDATION", "Checklist weights required for weighted_checklist");
    }

    const id = uuidv7();
    await insertStrategyVersion(client, {
      id,
      tenantId: session.tenantId,
      projectId,
      workNodeId,
      version: nextVersion,
      strategyKind,
      config,
    });

    const lifecycleRow = await ensureLifecycleRow(client, session.tenantId, projectId, workNodeId);
    const lifecycle = mapLifecycleRow(lifecycleRow);
    const percent = await recomputeProgressForNode(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      lifecycle,
      null,
    );
    void percent;

    return {
      workNodeId: workNodeExternalId,
      version: nextVersion,
      strategyKind,
      config,
    };
  });
}

export async function setManualProgressCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  progressPercent: number,
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const node = await findWorkNode(client, session.tenantId, projectId, workNodeId);
    if (!node) throw new DomainError("NOT_FOUND", "Resource not found");
    const strategy = await ensureDefaultStrategy(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      node.node_type,
    );
    if (strategy.strategy_kind !== "manual") {
      throw new DomainError("CONFLICT", "Node does not use manual progress strategy");
    }
    const percent = progressFromManualPercent(progressPercent);
    const lifecycleRow = await ensureLifecycleRow(client, session.tenantId, projectId, workNodeId);
    await upsertProgress(client, {
      tenantId: session.tenantId,
      projectId,
      workNodeId,
      progressPercent: percent,
      strategyVersionId: strategy.id,
      manualPercent: percent,
      sourceDecisionId: null,
    });
    return {
      workNodeId: workNodeExternalId,
      progressPercent: percent,
      lifecycle: mapLifecycleRow(lifecycleRow),
    };
  });
}

export async function updateChecklistProgressCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  items: { key: string; completed: boolean }[],
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const strategy = await getLatestStrategy(client, session.tenantId, workNodeId);
    if (!strategy || strategy.strategy_kind !== "weighted_checklist") {
      throw new DomainError("CONFLICT", "Weighted checklist strategy not configured");
    }
    for (const item of items) {
      await upsertChecklistItem(
        client,
        session.tenantId,
        projectId,
        workNodeId,
        item.key,
        item.completed,
      );
    }
    const lifecycleRow = await ensureLifecycleRow(client, session.tenantId, projectId, workNodeId);
    const lifecycle = mapLifecycleRow(lifecycleRow);
    const percent = await recomputeProgressForNode(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      lifecycle,
      null,
    );
    return { workNodeId: workNodeExternalId, progressPercent: percent };
  });
}

export async function getPackageRollupCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const node = await findWorkNode(client, session.tenantId, projectId, workNodeId);
    if (!node) throw new DomainError("NOT_FOUND", "Resource not found");

    const descendants = await listDescendantWorkNodes(
      client,
      session.tenantId,
      projectId,
      workNodeId,
    );
    const edges = await listHierarchyEdges(client, session.tenantId, projectId);
    const progressByNode = new Map(
      descendants.map((d) => [d.id, d.progress_percent ?? 0]),
    );
    const weightByNode = new Map(descendants.map((d) => [d.id, d.rollup_weight]));
    const leaves = pickRollupLeaves(
      descendants.map((d) => d.id),
      edges.map((e) => ({ parentId: e.parent_node_id, childId: e.child_node_id })),
      progressByNode,
      weightByNode,
    );
    const rollup = computeWeightedRollup(leaves);
    return {
      workNodeId: workNodeExternalId,
      progressPercent: rollup,
      leaves: leaves.map((leaf) => ({
        workNodeId: toProjectExternalId("workNode", leaf.workNodeId),
        weight: leaf.weight,
        progressPercent: leaf.progressPercent,
      })),
    };
  });
}
