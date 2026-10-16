import { v7 as uuidv7 } from "uuid";
import { runAiRuntime } from "@alaira/ai/runtime";
import type { AiProposalDto, RuntimeAuditEntryDto } from "@alaira/contracts/ai";
import { getToolDefinition } from "@alaira/contracts/ai";
import type { AiProposalRecordDto } from "@alaira/contracts/ai-proposal";
import { DomainError, type ActorContext, type TenantId } from "@alaira/domain";
import {
  defaultStrategyForNodeType,
  progressFromManualPercent,
} from "@alaira/domain/acceptance";
import { toExternalId } from "@alaira/domain/iam";
import { parseProjectExternalId, toProjectExternalId } from "@alaira/domain/project";
import type { AuthzActor } from "@alaira/domain/authz";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { assertPolicyAllowed, loadAuthzActor } from "../authz/repository.js";
import { ensureEventlogProject } from "../baseline/repository.js";
import { findProjectById } from "../project/repository.js";
import { appendProjectEventLogCommand } from "../eventlog/service.js";
import {
  findWorkNode,
  getLatestStrategy,
  insertStrategyVersion,
  upsertProgress,
} from "../acceptance/repository.js";
import {
  findProject,
  findProposalById,
  findProposalByIdempotency,
  insertProposal,
  updateProposalResolution,
  type AiProposalRow,
} from "./repository.js";
import { createPgDomainToolStore } from "./pg-domain-store.js";

function parseProjectId(external: string): string {
  const id = parseProjectExternalId(external, "project");
  if (!id) throw new DomainError("NOT_FOUND", "Resource not found");
  return id;
}

function parseWorkNodeId(external: string): string {
  const id = parseProjectExternalId(external, "workNode");
  if (!id) throw new DomainError("NOT_FOUND", "Resource not found");
  return id;
}

function toRuntimeActor(authz: AuthzActor, projectId: string): ActorContext {
  const roles: string[] = ["member"];
  if (authz.orgRole === "owner" || authz.orgRole === "admin") roles.push("admin");
  const projectRole = authz.projectRoles[projectId];
  if (projectRole === "pm") roles.push("pm_lead");
  return {
    tenantId: authz.tenantId as TenantId,
    userId: authz.userId,
    roles,
  };
}

function buildAiTracePayload(
  proposal: AiProposalRecordDto,
  approverUserId?: string | null,
): Record<string, unknown> {
  return {
    who: proposal.actorUserId,
    what: proposal.typedCommand,
    when: proposal.createdAt,
    why: proposal.rationale,
    evidence: proposal.citedEvidenceIds,
    modelOrRule: proposal.modelRef,
    priorState: proposal.priorState,
    proposedState: proposal.proposedState,
    approver: approverUserId ?? proposal.approverUserId ?? null,
  };
}

function rowToDto(row: AiProposalRow, projectExternalId: string): AiProposalRecordDto {
  return {
    id: row.id,
    tenantId: toExternalId("tenant", row.tenant_id),
    projectId: projectExternalId,
    actorUserId: toExternalId("user", row.actor_user_id),
    autonomyLevel: row.autonomy_level as AiProposalDto["autonomyLevel"],
    typedCommand: row.typed_command as AiProposalDto["typedCommand"],
    targetNodeId: row.target_node_id,
    priorState: (row.prior_state as Record<string, unknown>) ?? {},
    proposedState: (row.proposed_state as Record<string, unknown>) ?? {},
    citedEvidenceIds: (row.cited_evidence_ids as string[]) ?? [],
    resolution: row.resolution as AiProposalDto["resolution"],
    rationale: row.rationale,
    modelRef: row.model_ref,
    approverUserId: row.approver_user_id
      ? toExternalId("user", row.approver_user_id)
      : undefined,
    idempotencyKey: row.idempotency_key,
    runtimeAudit: (row.runtime_audit as RuntimeAuditEntryDto[]) ?? [],
    createdAt: row.created_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString(),
  };
}

async function assertProjectWrite(session: IamSession, projectId: string): Promise<AuthzActor> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:write", {
    type: "project",
    tenantId: session.tenantId,
    projectId,
  });
  return actor;
}

async function assertProjectRead(session: IamSession, projectId: string): Promise<void> {
  const actor = await loadAuthzActor(session.tenantId, session.userId);
  assertPolicyAllowed(actor, "project:read", {
    type: "project",
    tenantId: session.tenantId,
    projectId,
  });
}

async function ensureDefaultStrategy(
  client: Parameters<typeof getLatestStrategy>[0],
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

async function applyProposeProgressUpdate(
  client: Parameters<typeof createPgDomainToolStore>[0],
  tenantId: string,
  projectId: string,
  workNodeId: string,
  proposedState: Record<string, unknown>,
): Promise<void> {
  const percent = progressFromManualPercent(
    Number(proposedState.proposedPercentComplete ?? proposedState.percentComplete ?? 0),
  );
  const node = await findWorkNode(client, tenantId, projectId, workNodeId);
  if (!node) throw new DomainError("NOT_FOUND", "Resource not found");
  const strategy = await ensureDefaultStrategy(
    client,
    tenantId,
    projectId,
    workNodeId,
    node.node_type,
  );
  if (strategy.strategy_kind !== "manual") {
    throw new DomainError("CONFLICT", "Node does not use manual progress strategy");
  }
  await upsertProgress(client, {
    tenantId,
    projectId,
    workNodeId,
    progressPercent: percent,
    strategyVersionId: strategy.id,
    manualPercent: percent,
    sourceDecisionId: null,
  });
}

export async function runObservationCommand(
  session: IamSession,
  projectExternalId: string,
  body: {
    observation: string;
    idempotencyKey: string;
    targetNodeId?: string;
    citedEvidenceIds?: string[];
    approverUserId?: string;
  },
) {
  const projectId = parseProjectId(projectExternalId);
  const authz = await assertProjectWrite(session, projectId);
  const targetNodeId = body.targetNodeId ? parseWorkNodeId(body.targetNodeId) : undefined;
  if (!targetNodeId && body.observation.toLowerCase().includes("propose progress")) {
    throw new DomainError("VALIDATION", "targetNodeId is required for progress proposals");
  }

  const existing = await withTenantTx(session.tenantId, (client) =>
    findProposalByIdempotency(client, session.tenantId, body.idempotencyKey),
  );
  if (existing) {
    const dto = rowToDto(existing, projectExternalId);
    if (existing.resolution === "pending") {
      return {
        ok: true as const,
        kind: "proposal" as const,
        proposal: dto,
        audit: dto.runtimeAudit,
      };
    }
    return {
      ok: true as const,
      kind: "proposal" as const,
      proposal: dto,
      audit: dto.runtimeAudit,
    };
  }

  const runtimeActor: ActorContext = {
    ...toRuntimeActor(authz, projectId),
    tenantId: session.tenantId,
  };
  const result = await withTenantTx(session.tenantId, async (client) => {
    const project = await findProject(client, session.tenantId, projectId);
    if (!project) throw new DomainError("NOT_FOUND", "Resource not found");
    const projectRow = await findProjectById(client, session.tenantId, projectId);
    if (projectRow) {
      await ensureEventlogProject(client, session.tenantId, projectId, projectRow.name);
    }

    const store = createPgDomainToolStore(client, session.tenantId, projectId);
    const runtimeResult = await runAiRuntime(
      {
        observation: body.observation,
        actor: runtimeActor,
        idempotencyKey: body.idempotencyKey,
        projectId,
        targetNodeId,
        citedEvidenceIds: body.citedEvidenceIds,
        approverUserId: body.approverUserId,
      },
      { proposalIdFactory: () => uuidv7(), domainStore: store },
    );

    if (!runtimeResult.ok) {
      return runtimeResult;
    }

    if (runtimeResult.kind === "executed") {
      const def = getToolDefinition(runtimeResult.tool);
      if (def?.mutatesDomain) {
        const proposalId = uuidv7();
        const proposal: AiProposalDto = {
          id: proposalId,
          tenantId: session.tenantId,
          autonomyLevel: def.autonomyLevel,
          typedCommand: runtimeResult.tool,
          targetNodeId: targetNodeId ?? projectId,
          priorState: {},
          proposedState: runtimeResult.result as Record<string, unknown>,
          citedEvidenceIds: body.citedEvidenceIds ?? [],
          resolution: "applied",
          rationale: body.observation.slice(0, 500),
          modelRef: "fake-deterministic/v1",
        };
        await insertProposal(client, {
          id: proposalId,
          tenantId: session.tenantId,
          projectId,
          actorUserId: session.userId,
          proposal,
          idempotencyKey: body.idempotencyKey,
          runtimeAudit: runtimeResult.audit,
          approverUserId: null,
        });
        const dto = rowToDto(
          (await findProposalById(client, session.tenantId, projectId, proposalId))!,
          projectExternalId,
        );
        await appendProjectEventLogCommand(session, projectId, `ai-run-${body.idempotencyKey}`, {
          eventType: "AIProposalCreated",
          summary: `AI applied ${runtimeResult.tool} (informar)`,
          aggregateId: proposalId,
          payload: { aiTrace: buildAiTracePayload(dto) },
        });
      }
      return runtimeResult;
    }

    const proposal = runtimeResult.proposal;
    await insertProposal(client, {
      id: proposal.id,
      tenantId: session.tenantId,
      projectId,
      actorUserId: session.userId,
      proposal,
      idempotencyKey: body.idempotencyKey,
      runtimeAudit: runtimeResult.audit,
      approverUserId: body.approverUserId ?? null,
    });

    const row = await findProposalById(client, session.tenantId, projectId, proposal.id);
    const dto = rowToDto(row!, projectExternalId);

    await appendProjectEventLogCommand(session, projectId, `ai-proposal-${body.idempotencyKey}`, {
      eventType: "AIProposalCreated",
      summary: `AI proposal ${proposal.typedCommand} (${proposal.autonomyLevel})`,
      aggregateId: proposal.id,
      payload: { aiTrace: buildAiTracePayload(dto) },
    });

    return {
      ok: true as const,
      kind: "proposal" as const,
      proposal: dto,
      audit: runtimeResult.audit,
    };
  });

  return result;
}

export async function getProposalCommand(
  session: IamSession,
  projectExternalId: string,
  proposalId: string,
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);
  const row = await withTenantTx(session.tenantId, (client) =>
    findProposalById(client, session.tenantId, projectId, proposalId),
  );
  if (!row) throw new DomainError("NOT_FOUND", "Resource not found");
  return { proposal: rowToDto(row, projectExternalId) };
}

export async function confirmProposalCommand(
  session: IamSession,
  projectExternalId: string,
  proposalId: string,
  idempotencyKey: string,
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const row = await findProposalById(client, session.tenantId, projectId, proposalId);
    if (!row) throw new DomainError("NOT_FOUND", "Resource not found");
    if (row.resolution !== "pending") {
      return { proposal: rowToDto(row, projectExternalId) };
    }
    if (row.autonomy_level !== "proponer") {
      throw new DomainError("CONFLICT", "Only proponer proposals accept confirmation");
    }

    if (row.typed_command === "propose_progress_update") {
      await applyProposeProgressUpdate(
        client,
        session.tenantId,
        projectId,
        row.target_node_id,
        row.proposed_state as Record<string, unknown>,
      );
    }

    await updateProposalResolution(
      client,
      session.tenantId,
      proposalId,
      "confirmed",
      session.userId,
    );
    const updated = await findProposalById(client, session.tenantId, projectId, proposalId);
    const dto = rowToDto(updated!, projectExternalId);

    const entry = await appendProjectEventLogCommand(
      session,
      projectId,
      `ai-confirm-${idempotencyKey}`,
      {
        eventType: "AIProposalResolved",
        summary: `AI proposal confirmed: ${row.typed_command}`,
        aggregateId: proposalId,
        payload: {
          aiTrace: buildAiTracePayload(dto, toExternalId("user", session.userId)),
          resolution: "confirmed",
        },
      },
    );

    return { proposal: dto, eventLogEntryId: entry.id };
  });
}

export async function rejectProposalCommand(
  session: IamSession,
  projectExternalId: string,
  proposalId: string,
  idempotencyKey: string,
  reason?: string,
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const row = await findProposalById(client, session.tenantId, projectId, proposalId);
    if (!row) throw new DomainError("NOT_FOUND", "Resource not found");
    if (row.resolution !== "pending") {
      return { proposal: rowToDto(row, projectExternalId) };
    }

    await updateProposalResolution(
      client,
      session.tenantId,
      proposalId,
      "rejected",
      session.userId,
    );
    const updated = await findProposalById(client, session.tenantId, projectId, proposalId);
    const dto = rowToDto(updated!, projectExternalId);

    const entry = await appendProjectEventLogCommand(
      session,
      projectId,
      `ai-reject-${idempotencyKey}`,
      {
        eventType: "AIProposalResolved",
        summary: reason?.trim() || `AI proposal rejected: ${row.typed_command}`,
        aggregateId: proposalId,
        payload: {
          aiTrace: buildAiTracePayload(dto, toExternalId("user", session.userId)),
          resolution: "rejected",
        },
      },
    );

    return { proposal: dto, eventLogEntryId: entry.id };
  });
}
