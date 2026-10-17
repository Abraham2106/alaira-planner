import { randomUUID } from "node:crypto";
import type { ProgressEvidenceInput } from "@alaira/ai/agents/progress";
import { isMemoryDomainToolStore, type DomainToolStore } from "@alaira/ai/domain-tools";
import { FAKE_DETERMINISTIC_MODEL_REF } from "@alaira/ai/providers";
import type { ActorContext, TenantId } from "@alaira/domain";
import { processAiProgressJob } from "./process.js";

export type ProposalResolution = "pending" | "applied" | "confirmed" | "rejected" | "expired";

/** One evidence row joined to the work node it proposes against. */
export type ProgressTaskRow = {
  tenantId: string;
  projectId: string;
  targetNodeId: string;
  /** `work_node.responsible_user_id`. Null means the task has no actor. */
  responsibleUserId: string | null;
  orgRole: string | null;
  projectRole: string | null;
  evidence: ProgressEvidenceInput;
};

export type PendingProgressProposal = {
  id: string;
  tenantId: string;
  projectId: string;
  actorUserId: string;
  idempotencyKey: string;
  autonomyLevel: "proponer";
  typedCommand: "propose_progress_update";
  targetNodeId: string;
  priorState: Record<string, unknown>;
  proposedState: Record<string, unknown>;
  citedEvidenceIds: string[];
  resolution: "pending";
  rationale: string;
  modelRef: typeof FAKE_DETERMINISTIC_MODEL_REF;
  limitedAvailability: true;
  runtimeAudit: { phase: "verify"; detail: string }[];
};

export type ExistingProposal = {
  id: string;
  resolution: ProposalResolution;
  actorUserId: string;
};

export type AiProgressCyclePorts = {
  loadTasks: () => Promise<ProgressTaskRow[]>;
  findProposal: (tenantId: string, idempotencyKey: string) => Promise<ExistingProposal | null>;
  /** Insert a pending row. `exists` means the unique key won the race; do not update it. */
  insertPending: (proposal: PendingProgressProposal) => Promise<"inserted" | "exists">;
  storeFor: (task: ProgressTaskRow) => DomainToolStore;
};

export type CycleItemResult =
  | {
      action: "skipped";
      reason: "missing_task_actor";
      evidenceId: string;
      tenantId: string;
    }
  | {
      action: "inserted" | "kept";
      proposalId: string;
      resolution: ProposalResolution;
      tenantId: string;
      actorUserId: string;
      evidenceId: string;
      modelRef: typeof FAKE_DETERMINISTIC_MODEL_REF;
      limitedAvailability: true;
    };

export function progressIdempotencyKey(evidenceId: string): string {
  return `ai-progress:${evidenceId}`;
}

/** Actor of the work node. Does not invent a global admin. */
export function actorForTask(task: ProgressTaskRow): ActorContext {
  if (!task.responsibleUserId) {
    throw new Error("missing task actor");
  }
  const roles: string[] = ["member"];
  if (task.orgRole === "owner" || task.orgRole === "admin") {
    roles.push("admin");
  }
  if (task.projectRole === "pm") {
    roles.push("pm_lead");
  }
  return {
    tenantId: task.tenantId as TenantId,
    userId: task.responsibleUserId,
    roles,
  };
}

export async function runAiProgressCycle(
  ports: AiProgressCyclePorts,
): Promise<CycleItemResult[]> {
  const tasks = await ports.loadTasks();
  const results: CycleItemResult[] = [];

  for (const task of tasks) {
    const evidenceId = task.evidence.evidenceId;
    if (!task.responsibleUserId) {
      results.push({
        action: "skipped",
        reason: "missing_task_actor",
        evidenceId,
        tenantId: task.tenantId,
      });
      continue;
    }

    const store = ports.storeFor(task);
    if (isMemoryDomainToolStore(store)) {
      throw new Error("ai-progress production cycle refused an in-memory domain store");
    }

    const idempotencyKey = progressIdempotencyKey(evidenceId);
    const existing = await ports.findProposal(task.tenantId, idempotencyKey);
    if (existing) {
      results.push({
        action: "kept",
        proposalId: existing.id,
        resolution: existing.resolution,
        tenantId: task.tenantId,
        actorUserId: existing.actorUserId,
        evidenceId,
        modelRef: FAKE_DETERMINISTIC_MODEL_REF,
        limitedAvailability: true,
      });
      continue;
    }

    const actor = actorForTask(task);
    const agentResult = await processAiProgressJob(
      {
        tenantId: task.tenantId,
        projectId: task.projectId,
        targetNodeId: task.targetNodeId,
        actor,
        evidence: [task.evidence],
      },
      { store },
    );

    if (
      agentResult.modelRef !== FAKE_DETERMINISTIC_MODEL_REF ||
      agentResult.limitedAvailability !== true
    ) {
      throw new Error(
        "ai-progress refused a result that does not declare the deterministic fallback",
      );
    }

    const prior = agentResult.progressProposal?.priorPercentComplete ?? 0;
    const proposed =
      agentResult.progressProposal?.proposedPercentComplete ??
      agentResult.suggestedProgressPercent;

    const proposal: PendingProgressProposal = {
      id: randomUUID(),
      tenantId: task.tenantId,
      projectId: task.projectId,
      actorUserId: actor.userId,
      idempotencyKey,
      autonomyLevel: "proponer",
      typedCommand: "propose_progress_update",
      targetNodeId: task.targetNodeId,
      priorState: { percentComplete: prior },
      proposedState: {
        percentComplete: proposed,
        mayCloseItem: false,
      },
      citedEvidenceIds: [evidenceId],
      resolution: "pending",
      rationale: agentResult.summary.slice(0, 4000),
      modelRef: FAKE_DETERMINISTIC_MODEL_REF,
      limitedAvailability: true,
      runtimeAudit: [
        {
          phase: "verify",
          detail: `modelRef=${FAKE_DETERMINISTIC_MODEL_REF};limitedAvailability=true;closeForbidden=true`,
        },
      ],
    };

    const inserted = await ports.insertPending(proposal);
    if (inserted === "exists") {
      const raced = await ports.findProposal(task.tenantId, idempotencyKey);
      results.push({
        action: "kept",
        proposalId: raced?.id ?? proposal.id,
        resolution: raced?.resolution ?? "pending",
        tenantId: task.tenantId,
        actorUserId: raced?.actorUserId ?? actor.userId,
        evidenceId,
        modelRef: FAKE_DETERMINISTIC_MODEL_REF,
        limitedAvailability: true,
      });
      continue;
    }

    results.push({
      action: "inserted",
      proposalId: proposal.id,
      resolution: "pending",
      tenantId: task.tenantId,
      actorUserId: actor.userId,
      evidenceId,
      modelRef: FAKE_DETERMINISTIC_MODEL_REF,
      limitedAvailability: true,
    });
  }

  return results;
}
