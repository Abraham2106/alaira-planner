import { DomainError } from "@alaira/domain";
import { computeTaskScheduleVariance } from "@alaira/domain/baseline";
import { toExternalId } from "@alaira/domain/iam";
import { parseProjectExternalId, toProjectExternalId } from "@alaira/domain/project";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { assertPolicyAllowed, loadAuthzActor } from "../authz/repository.js";
import { findProjectById, findWorkNode } from "../project/repository.js";
import { appendProjectEventLogCommand } from "../eventlog/service.js";
import {
  findScheduleConfig,
  listForecastTasksForVersion,
} from "../scheduling/repository.js";
import {
  findBaselineByVersion,
  ensureEventlogProject,
  findIdempotentBaselineVersion,
  findLatestBaseline,
  insertBaselineTasks,
  insertProjectBaseline,
  listActualTasksForProject,
  listBaselineTasks,
  nextBaselineVersion,
  recordBaselineApproveIdempotency,
  upsertActualTask,
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

function mapBaselineTaskRow(
  projectExternalId: string,
  row: {
    work_node_id: string;
    early_start_epoch_ms: string;
    early_finish_epoch_ms: string;
    planned_cost_minor: string | null;
  },
) {
  return {
    workNodeId: toProjectExternalId("workNode", row.work_node_id),
    earlyStartEpochMs: Number(row.early_start_epoch_ms),
    earlyFinishEpochMs: Number(row.early_finish_epoch_ms),
    plannedCostMinor: row.planned_cost_minor != null ? Number(row.planned_cost_minor) : null,
  };
}

async function loadBaselineDto(
  client: Parameters<typeof findLatestBaseline>[0],
  tenantId: string,
  projectId: string,
  projectExternalId: string,
  baselineVersion: number,
) {
  const header = await findBaselineByVersion(client, tenantId, projectId, baselineVersion);
  if (!header) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  const tasks = await listBaselineTasks(client, tenantId, projectId, baselineVersion);
  return {
    projectId: projectExternalId,
    baselineVersion: header.baseline_version,
    sourceForecastVersion: header.source_forecast_version,
    approvedAt: new Date(header.approved_at).toISOString(),
    approvedByUserId: toExternalId("user", header.approved_by_user_id),
    approvedReason: header.approved_reason,
    projectEarlyFinishEpochMs: Number(header.project_early_finish_epoch_ms),
    tasks: tasks.map((t) => mapBaselineTaskRow(projectExternalId, t)),
  };
}

export async function approveBaselineCommand(
  session: IamSession,
  projectExternalId: string,
  idempotencyKey: string,
  reason: string | undefined,
  plannedCosts: { workNodeId: string; plannedCostMinor: number }[] | undefined,
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  const costByWorkNode = new Map<string, number>();
  for (const entry of plannedCosts ?? []) {
    costByWorkNode.set(parseWorkNodeId(entry.workNodeId), entry.plannedCostMinor);
  }

  const dto = await withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const existing = await findIdempotentBaselineVersion(client, session.tenantId, idempotencyKey);
    if (existing) {
      if (existing.project_id !== projectId) {
        throw new DomainError("CONFLICT", "Idempotency key used for another project");
      }
      return loadBaselineDto(
        client,
        session.tenantId,
        projectId,
        projectExternalId,
        existing.baseline_version,
      );
    }

    const config = await findScheduleConfig(client, session.tenantId, projectId);
    if (!config || config.forecast_version < 1) {
      throw new DomainError("CONFLICT", "Forecast required before baseline approval");
    }

    const forecastVersion = config.forecast_version;
    const forecastRows = await listForecastTasksForVersion(
      client,
      session.tenantId,
      projectId,
      forecastVersion,
    );
    if (forecastRows.length === 0) {
      throw new DomainError("CONFLICT", "Forecast required before baseline approval");
    }

    const baselineVersion = await nextBaselineVersion(client, session.tenantId, projectId);
    const projectEarlyFinishEpochMs = Math.max(
      ...forecastRows.map((r) => Number(r.early_finish_epoch_ms)),
    );

    await insertProjectBaseline(
      client,
      session.tenantId,
      projectId,
      baselineVersion,
      forecastVersion,
      session.userId,
      reason ?? null,
      projectEarlyFinishEpochMs,
    );

    await insertBaselineTasks(
      client,
      session.tenantId,
      projectId,
      baselineVersion,
      forecastRows.map((r) => ({
        workNodeId: r.work_node_id,
        earlyStartEpochMs: Number(r.early_start_epoch_ms),
        earlyFinishEpochMs: Number(r.early_finish_epoch_ms),
        plannedCostMinor: costByWorkNode.get(r.work_node_id) ?? null,
      })),
    );

    await recordBaselineApproveIdempotency(
      client,
      session.tenantId,
      idempotencyKey,
      projectId,
      baselineVersion,
    );

    return loadBaselineDto(
      client,
      session.tenantId,
      projectId,
      projectExternalId,
      baselineVersion,
    );
  });

  await withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (project) {
      await ensureEventlogProject(client, session.tenantId, projectId, project.name);
    }
  });

  await appendProjectEventLogCommand(session, projectId, `baseline-approve-${idempotencyKey}`, {
    eventType: "baseline.approved",
    summary: `Baseline v${dto.baselineVersion} approved from forecast v${dto.sourceForecastVersion}`,
    aggregateId: projectId,
    payload: {
      baselineVersion: dto.baselineVersion,
      sourceForecastVersion: dto.sourceForecastVersion,
      taskCount: dto.tasks.length,
    },
    effect: "baseline_frozen",
  });

  return dto;
}

export async function getLatestBaselineCommand(session: IamSession, projectExternalId: string) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const latest = await findLatestBaseline(client, session.tenantId, projectId);
    if (!latest) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return loadBaselineDto(
      client,
      session.tenantId,
      projectId,
      projectExternalId,
      latest.baseline_version,
    );
  });
}

export async function upsertActualTaskCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  body: {
    actualStartEpochMs?: number | null;
    actualFinishEpochMs?: number | null;
    actualCostMinor?: number | null;
  },
) {
  const projectId = parseProjectId(projectExternalId);
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const node = await findWorkNode(client, session.tenantId, projectId, workNodeId);
    if (!node) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const row = await upsertActualTask(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      body.actualStartEpochMs ?? null,
      body.actualFinishEpochMs ?? null,
      body.actualCostMinor ?? null,
    );

    return {
      workNodeId: workNodeExternalId,
      actualStartEpochMs:
        row.actual_start_epoch_ms != null ? Number(row.actual_start_epoch_ms) : null,
      actualFinishEpochMs:
        row.actual_finish_epoch_ms != null ? Number(row.actual_finish_epoch_ms) : null,
      actualCostMinor: row.actual_cost_minor != null ? Number(row.actual_cost_minor) : null,
    };
  });
}

export async function getBaselineVarianceCommand(session: IamSession, projectExternalId: string) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const latest = await findLatestBaseline(client, session.tenantId, projectId);
    if (!latest) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const config = await findScheduleConfig(client, session.tenantId, projectId);
    const forecastVersion = config?.forecast_version ?? 0;
    if (forecastVersion < 1) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const baselineTasks = await listBaselineTasks(
      client,
      session.tenantId,
      projectId,
      latest.baseline_version,
    );
    const forecastTasks = await listForecastTasksForVersion(
      client,
      session.tenantId,
      projectId,
      forecastVersion,
    );
    const actualTasks = await listActualTasksForProject(client, session.tenantId, projectId);

    const baselineByNode = new Map(baselineTasks.map((t) => [t.work_node_id, t]));
    const forecastByNode = new Map(forecastTasks.map((t) => [t.work_node_id, t]));
    const actualByNode = new Map(actualTasks.map((t) => [t.work_node_id, t]));

    const workNodeIds = new Set<string>([
      ...baselineByNode.keys(),
      ...forecastByNode.keys(),
      ...actualByNode.keys(),
    ]);

    const tasks = [...workNodeIds].map((workNodeId) => {
      const baselineRow = baselineByNode.get(workNodeId);
      const forecastRow = forecastByNode.get(workNodeId);
      const actualRow = actualByNode.get(workNodeId);
      const workNodeExternalId = toProjectExternalId("workNode", workNodeId);

      const baseline = baselineRow
        ? mapBaselineTaskRow(projectExternalId, baselineRow)
        : null;
      const forecast = forecastRow
        ? {
            workNodeId: workNodeExternalId,
            earlyStartEpochMs: Number(forecastRow.early_start_epoch_ms),
            earlyFinishEpochMs: Number(forecastRow.early_finish_epoch_ms),
          }
        : null;
      const actual = actualRow
        ? {
            workNodeId: workNodeExternalId,
            actualStartEpochMs:
              actualRow.actual_start_epoch_ms != null
                ? Number(actualRow.actual_start_epoch_ms)
                : null,
            actualFinishEpochMs:
              actualRow.actual_finish_epoch_ms != null
                ? Number(actualRow.actual_finish_epoch_ms)
                : null,
            actualCostMinor:
              actualRow.actual_cost_minor != null ? Number(actualRow.actual_cost_minor) : null,
          }
        : null;

      const variance = computeTaskScheduleVariance({
        workNodeId: workNodeExternalId,
        baselineEarlyFinishEpochMs: baseline?.earlyFinishEpochMs ?? null,
        forecastEarlyFinishEpochMs: forecast?.earlyFinishEpochMs ?? null,
        actualFinishEpochMs: actual?.actualFinishEpochMs ?? null,
        baselinePlannedCostMinor: baseline?.plannedCostMinor ?? null,
        actualCostMinor: actual?.actualCostMinor ?? null,
      });

      return { workNodeId: workNodeExternalId, baseline, forecast, actual, variance };
    });

    return {
      projectId: projectExternalId,
      baselineVersion: latest.baseline_version,
      forecastVersion,
      tasks,
    };
  });
}
