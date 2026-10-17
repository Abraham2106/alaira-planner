import { describe, expect, it } from "vitest";
import type { ProgressEvidenceInput } from "@alaira/ai/agents/progress";
import {
  createMemoryDomainToolStore,
  type DomainToolStore,
} from "@alaira/ai/domain-tools";
import type { TenantId } from "@alaira/domain";
import {
  actorForTask,
  progressIdempotencyKey,
  runAiProgressCycle,
  type AiProgressCyclePorts,
  type PendingProgressProposal,
  type ProgressTaskRow,
  type ProposalResolution,
} from "./cycle.js";
import { aiProgressDatabaseUrl } from "./pg.js";
import { processAiProgressJob } from "./process.js";

const tenantA = "018f0000-0000-7000-8000-000000000001" as TenantId;
const projectId = "018f0000-0000-7000-8000-000000000010";
const targetNodeId = "018f0000-0000-7000-8000-0000000000aa";
const responsibleUserId = "018f0000-0000-7000-8000-0000000000bb";
const evidenceId = "00000000-0000-4000-8000-000000000099";

const evidence: ProgressEvidenceInput = {
  evidenceId,
  source: "github",
  externalId: "pr-42-merged",
  eventType: "artifact.lifecycle.changed",
  effect: "may_propose_progress",
  artifact: {
    externalId: "synth-org/demo/pull/42",
    kind: "pull_request_merged",
  },
  normalizedPayload: {
    check_run: { conclusion: "success" },
    review: { state: "approved" },
  },
};

function task(overrides: Partial<ProgressTaskRow> = {}): ProgressTaskRow {
  return {
    tenantId: tenantA,
    projectId,
    targetNodeId,
    responsibleUserId,
    orgRole: "member",
    projectRole: "executor",
    evidence,
    ...overrides,
  };
}

function persistentStore(satisfied: string[]): DomainToolStore {
  return {
    async getProject(ctx) {
      return {
        projectId: ctx.projectId,
        tenantId: ctx.actor.tenantId,
        title: "Persisted project",
      };
    },
    async findWorkItem(_ctx, workItemId) {
      return {
        workItemId,
        nodeType: "deliverable",
        title: "Task",
        progressPercent: 40,
      };
    },
    async getAcceptanceCriteria() {
      return {
        criteria: [
          { key: "pr_merged", required: true, label: "PR mergeado" },
          { key: "checks_green", required: true, label: "Checks en verde" },
          { key: "review_ok", required: true, label: "Revisión aprobada" },
          { key: "security_scan", required: true, label: "Escaneo de seguridad" },
        ],
        satisfiedKeys: new Set(satisfied),
      };
    },
    async recordEvidenceLink(ctx, id) {
      return { evidenceId: id, workItemId: ctx.targetNodeId, linked: true };
    },
  };
}

function harness(tasks: ProgressTaskRow[], store: DomainToolStore = persistentStore([])) {
  const rows = new Map<
    string,
    Omit<PendingProgressProposal, "resolution"> & { resolution: ProposalResolution }
  >();
  let inserts = 0;
  const ports: AiProgressCyclePorts = {
    loadTasks: async () => tasks,
    findProposal: async (tenantId, idempotencyKey) => {
      const row = rows.get(`${tenantId}:${idempotencyKey}`);
      if (!row) return null;
      return { id: row.id, resolution: row.resolution, actorUserId: row.actorUserId };
    },
    insertPending: async (proposal) => {
      const key = `${proposal.tenantId}:${proposal.idempotencyKey}`;
      if (rows.has(key)) return "exists";
      inserts += 1;
      rows.set(key, { ...proposal });
      return "inserted";
    },
    storeFor: () => store,
  };
  return {
    ports,
    rows,
    insertCount: () => inserts,
  };
}

describe("TASK-0126 ai-progress worker job", () => {
  it("processAiProgressJob returns partial progress proposal (TC-AI-07)", async () => {
    const result = await processAiProgressJob(
      {
        tenantId: tenantA,
        projectId,
        targetNodeId,
        actor: {
          tenantId: tenantA,
          userId: "usr_worker_test",
          roles: ["member"],
        },
        evidence: [evidence],
      },
      { store: createMemoryDomainToolStore(), allowMemoryStore: true },
    );

    expect(result.autoAcceptForbidden).toBe(true);
    expect(result.mayCloseItem).toBe(false);
    expect(result.criteriaPending).toContain("security_scan");
    expect(result.progressProposal).toBeDefined();
    expect(result.modelRef).toBe("fake-deterministic/v1");
    expect(result.limitedAvailability).toBe(true);
  });

  it("refuses to run without a persistent domain store", async () => {
    const request = {
      tenantId: tenantA,
      projectId,
      targetNodeId,
      actor: { tenantId: tenantA, userId: responsibleUserId, roles: ["member"] },
      evidence: [evidence],
    };
    await expect(processAiProgressJob(request)).rejects.toThrow(/in-memory fallback is refused/);
    await expect(
      processAiProgressJob(request, { store: createMemoryDomainToolStore() }),
    ).rejects.toThrow(/in-memory fallback is refused/);
  });

  it("uses the task tenant and responsible user, and keeps the proposal pending", async () => {
    const box = harness([task()]);
    const [result] = await runAiProgressCycle(box.ports);

    expect(result).toMatchObject({
      action: "inserted",
      tenantId: tenantA,
      actorUserId: responsibleUserId,
      resolution: "pending",
      modelRef: "fake-deterministic/v1",
      limitedAvailability: true,
      evidenceId,
    });
    expect(box.insertCount()).toBe(1);
    const stored = box.rows.get(`${tenantA}:${progressIdempotencyKey(evidenceId)}`);
    expect(stored?.resolution).toBe("pending");
    expect(stored?.proposedState.mayCloseItem).toBe(false);
    expect(stored?.actorUserId).toBe(responsibleUserId);
    expect(stored?.tenantId).toBe(tenantA);
  });

  it("is idempotent on retry and does not close an existing proposal", async () => {
    const box = harness([task()]);
    await runAiProgressCycle(box.ports);
    const again = await runAiProgressCycle(box.ports);

    expect(box.insertCount()).toBe(1);
    expect(again[0]).toMatchObject({ action: "kept", resolution: "pending" });
    const stored = [...box.rows.values()][0];
    expect(stored?.resolution).toBe("pending");
  });

  it("does not close the item when every criterion is already satisfied", async () => {
    const store = persistentStore(["pr_merged", "checks_green", "review_ok", "security_scan"]);
    const box = harness([task()], store);
    const [result] = await runAiProgressCycle(box.ports);
    const stored = [...box.rows.values()][0];

    expect(result).toMatchObject({ action: "inserted", resolution: "pending" });
    expect(stored?.resolution).toBe("pending");
    expect(stored?.proposedState.mayCloseItem).toBe(false);
    expect(stored?.autonomyLevel).toBe("proponer");
  });

  it("skips a task with no responsible user instead of inventing an actor", async () => {
    const box = harness([task({ responsibleUserId: null })]);
    const [result] = await runAiProgressCycle(box.ports);

    expect(result).toEqual({
      action: "skipped",
      reason: "missing_task_actor",
      evidenceId,
      tenantId: tenantA,
    });
    expect(box.insertCount()).toBe(0);
  });

  it("refuses the in-memory domain store on the production cycle", async () => {
    const box = harness([task()], createMemoryDomainToolStore());
    await expect(runAiProgressCycle(box.ports)).rejects.toThrow(/in-memory domain store/);
    expect(box.insertCount()).toBe(0);
  });

  it("keeps a raced or restarted proposal unchanged", async () => {
    const box = harness([task()]);
    const key = `${tenantA}:${progressIdempotencyKey(evidenceId)}`;
    box.rows.set(key, {
      id: "018f0000-0000-7000-8000-0000000000cc",
      tenantId: tenantA,
      projectId,
      actorUserId: responsibleUserId,
      idempotencyKey: progressIdempotencyKey(evidenceId),
      autonomyLevel: "proponer",
      typedCommand: "propose_progress_update",
      targetNodeId,
      priorState: {},
      proposedState: { mayCloseItem: false },
      citedEvidenceIds: [evidenceId],
      resolution: "confirmed",
      rationale: "already resolved",
      modelRef: "fake-deterministic/v1",
      limitedAvailability: true,
      runtimeAudit: [],
    });

    const [result] = await runAiProgressCycle(box.ports);
    expect(result).toMatchObject({
      action: "kept",
      resolution: "confirmed",
      proposalId: "018f0000-0000-7000-8000-0000000000cc",
    });
    expect(box.insertCount()).toBe(0);
    expect(box.rows.get(key)?.resolution).toBe("confirmed");
  });

  it("does not promote a member to admin", () => {
    expect(actorForTask(task({ orgRole: "member", projectRole: "executor" })).roles).toEqual([
      "member",
    ]);
    const admin = actorForTask(task({ orgRole: "admin", projectRole: "pm" }));
    expect(admin.userId).toBe(responsibleUserId);
    expect(admin.tenantId).toBe(tenantA);
    expect(admin.roles).toEqual(["member", "admin", "pm_lead"]);
  });

  it("does not fall back to the superuser database url", () => {
    const previousApp = process.env.DATABASE_APP_URL;
    const previousAdmin = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/alaira";
    delete process.env.DATABASE_APP_URL;
    try {
      const url = aiProgressDatabaseUrl();
      expect(url).toContain("alaira_app");
      expect(url).not.toContain("postgres:postgres");
    } finally {
      if (previousApp === undefined) delete process.env.DATABASE_APP_URL;
      else process.env.DATABASE_APP_URL = previousApp;
      if (previousAdmin === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousAdmin;
    }
  });
});
