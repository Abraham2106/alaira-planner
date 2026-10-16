import { v7 as uuidv7 } from "uuid";
import { DomainError } from "@alaira/domain";
import { ScheduleError } from "@alaira/domain/schedule";
import {
  assertScheduleAcyclic,
  buildCpmScheduleRequest,
  resolveLagMinutes,
  toScheduleDependencyExternalId,
  type PersistedScheduleDependency,
} from "@alaira/domain/scheduling";
import { parseProjectExternalId, toProjectExternalId } from "@alaira/domain/project";
import { computeCpmSchedule } from "@alaira/engine/schedule";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { assertPolicyAllowed, loadAuthzActor } from "../authz/repository.js";
import { findProjectById, findWorkNode } from "../project/repository.js";
import {
  bumpForecastVersion,
  findIdempotentRecalcVersion,
  findScheduleConfig,
  insertScheduleDependency,
  listForecastTasksForVersion,
  listScheduleDependencies,
  listScheduleTasks,
  recordRecalcIdempotency,
  replaceForecastTasks,
  upsertScheduleConfig,
  upsertScheduleTask,
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

function mapScheduleEngineError(error: unknown): never {
  if (error instanceof ScheduleError) {
    throw error;
  }
  throw error;
}

function mapForecastResponse(
  projectExternalId: string,
  forecastVersion: number,
  result: ReturnType<typeof computeCpmSchedule>,
) {
  return {
    projectId: projectExternalId,
    forecastVersion,
    projectEarlyFinishEpochMs: result.projectEarlyFinishEpochMs,
    projectLateFinishEpochMs: result.projectLateFinishEpochMs,
    criticalWorkNodeIds: result.criticalTaskIds.map((id) =>
      toProjectExternalId("workNode", id),
    ),
    assumptions: [...result.assumptions],
    tasks: result.tasks.map((t) => ({
      workNodeId: toProjectExternalId("workNode", t.taskId),
      earlyStartEpochMs: t.earlyStartEpochMs,
      earlyFinishEpochMs: t.earlyFinishEpochMs,
      lateStartEpochMs: t.lateStartEpochMs,
      lateFinishEpochMs: t.lateFinishEpochMs,
      totalFloatMinutes: t.totalFloatMinutes,
      freeFloatMinutes: t.freeFloatMinutes,
      isCritical: t.isCritical,
    })),
  };
}

async function loadForecastDto(
  client: Parameters<typeof findScheduleConfig>[0],
  tenantId: string,
  projectId: string,
  projectExternalId: string,
  forecastVersion: number,
) {
  const rows = await listForecastTasksForVersion(client, tenantId, projectId, forecastVersion);
  if (rows.length === 0) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  const criticalWorkNodeIds = rows
    .filter((r) => r.is_critical)
    .map((r) => toProjectExternalId("workNode", r.work_node_id));
  const projectEarlyFinishEpochMs = Math.max(
    ...rows.map((r) => Number(r.early_finish_epoch_ms)),
  );
  const projectLateFinishEpochMs = Math.max(
    ...rows.map((r) => Number(r.late_finish_epoch_ms)),
  );
  return {
    projectId: projectExternalId,
    forecastVersion,
    projectEarlyFinishEpochMs,
    projectLateFinishEpochMs,
    criticalWorkNodeIds,
    assumptions: [] as string[],
    tasks: rows.map((r) => ({
      workNodeId: toProjectExternalId("workNode", r.work_node_id),
      earlyStartEpochMs: Number(r.early_start_epoch_ms),
      earlyFinishEpochMs: Number(r.early_finish_epoch_ms),
      lateStartEpochMs: Number(r.late_start_epoch_ms),
      lateFinishEpochMs: Number(r.late_finish_epoch_ms),
      totalFloatMinutes: r.total_float_minutes,
      freeFloatMinutes: r.free_float_minutes,
      isCritical: r.is_critical,
    })),
  };
}

export async function upsertScheduleConfigCommand(
  session: IamSession,
  projectExternalId: string,
  input: { projectStartEpochMs: number; defaultCalendar: import("@alaira/domain/schedule").WorkCalendarDefinition },
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const row = await upsertScheduleConfig(
      client,
      session.tenantId,
      projectId,
      input.projectStartEpochMs,
      input.defaultCalendar,
    );
    return {
      projectId: projectExternalId,
      projectStartEpochMs: Number(row.project_start_epoch_ms),
      defaultCalendar: row.default_calendar,
      forecastVersion: row.forecast_version,
      lastRecalcAt: row.last_recalc_at
        ? new Date(row.last_recalc_at).toISOString()
        : null,
    };
  });
}

export async function getScheduleConfigCommand(session: IamSession, projectExternalId: string) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const row = await findScheduleConfig(client, session.tenantId, projectId);
    if (!row) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return {
      projectId: projectExternalId,
      projectStartEpochMs: Number(row.project_start_epoch_ms),
      defaultCalendar: row.default_calendar,
      forecastVersion: row.forecast_version,
      lastRecalcAt: row.last_recalc_at
        ? new Date(row.last_recalc_at).toISOString()
        : null,
    };
  });
}

export async function upsertScheduleTaskCommand(
  session: IamSession,
  projectExternalId: string,
  workNodeExternalId: string,
  input: {
    durationMinutes: number;
    calendarOverride?: import("@alaira/domain/schedule").WorkCalendarDefinition;
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
    const row = await upsertScheduleTask(
      client,
      session.tenantId,
      projectId,
      workNodeId,
      input.durationMinutes,
      input.calendarOverride ?? null,
    );
    return {
      workNodeId: workNodeExternalId,
      durationMinutes: row.duration_minutes,
      calendarOverride: row.calendar_override,
    };
  });
}

export async function createScheduleDependencyCommand(
  session: IamSession,
  projectExternalId: string,
  input: {
    predecessorWorkNodeId: string;
    successorWorkNodeId: string;
    type: PersistedScheduleDependency["type"];
    lagMinutes?: number;
    lagAmount?: number;
    lagUnit?: import("@alaira/domain/schedule").LagUnit;
  },
) {
  const projectId = parseProjectId(projectExternalId);
  const predecessorId = parseWorkNodeId(input.predecessorWorkNodeId);
  const successorId = parseWorkNodeId(input.successorWorkNodeId);
  await assertProjectWrite(session, projectId);

  if (predecessorId === successorId) {
    throw new DomainError("VALIDATION", "Dependency cannot link a node to itself");
  }

  return withTenantTx(session.tenantId, async (client) => {
    const config = await findScheduleConfig(client, session.tenantId, projectId);
    if (!config) {
      throw new DomainError("VALIDATION", "Schedule config required before dependencies");
    }
    const pred = await findWorkNode(client, session.tenantId, projectId, predecessorId);
    const succ = await findWorkNode(client, session.tenantId, projectId, successorId);
    if (!pred || !succ) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const lagMinutes = resolveLagMinutes(
      input.lagMinutes,
      input.lagAmount,
      input.lagUnit,
      config.default_calendar.workMinutesPerDay,
    );

    const existing = await listScheduleDependencies(client, session.tenantId, projectId);
    const tasks = await listScheduleTasks(client, session.tenantId, projectId);
    const taskIds = new Set(tasks.map((t) => t.work_node_id));
    taskIds.add(predecessorId);
    taskIds.add(successorId);

    const depId = uuidv7();
    const draftDeps: PersistedScheduleDependency[] = [
      ...existing.map((d) => ({
        id: d.id,
        predecessorWorkNodeId: d.predecessor_work_node_id,
        successorWorkNodeId: d.successor_work_node_id,
        type: d.dependency_type as PersistedScheduleDependency["type"],
        lagMinutes: d.lag_minutes,
      })),
      {
        id: depId,
        predecessorWorkNodeId: predecessorId,
        successorWorkNodeId: successorId,
        type: input.type,
        lagMinutes,
      },
    ];

    try {
      assertScheduleAcyclic([...taskIds], draftDeps.map((d) => ({
        id: d.id,
        predecessorId: d.predecessorWorkNodeId,
        successorId: d.successorWorkNodeId,
        type: d.type,
        lagMinutes: d.lagMinutes,
      })));
    } catch (e) {
      mapScheduleEngineError(e);
    }

    const row = await insertScheduleDependency(
      client,
      session.tenantId,
      projectId,
      depId,
      predecessorId,
      successorId,
      input.type,
      lagMinutes,
    );

    return {
      id: toScheduleDependencyExternalId(row.id),
      predecessorWorkNodeId: input.predecessorWorkNodeId,
      successorWorkNodeId: input.successorWorkNodeId,
      type: input.type,
      lagMinutes: row.lag_minutes,
    };
  });
}

export async function recalculateScheduleCommand(
  session: IamSession,
  projectExternalId: string,
  idempotencyKey: string,
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const prior = await findIdempotentRecalcVersion(client, session.tenantId, idempotencyKey);
    if (prior) {
      if (prior.project_id !== projectId) {
        throw new DomainError("CONFLICT", "Idempotency key used for another project");
      }
      return loadForecastDto(
        client,
        session.tenantId,
        projectId,
        projectExternalId,
        prior.forecast_version,
      );
    }

    const config = await findScheduleConfig(client, session.tenantId, projectId);
    if (!config) {
      throw new DomainError("VALIDATION", "Schedule config required before recalculate");
    }
    const tasks = await listScheduleTasks(client, session.tenantId, projectId);
    if (tasks.length === 0) {
      throw new DomainError("VALIDATION", "At least one schedule task required");
    }
    const deps = await listScheduleDependencies(client, session.tenantId, projectId);

    const request = buildCpmScheduleRequest(
      {
        projectStartEpochMs: Number(config.project_start_epoch_ms),
        defaultCalendar: config.default_calendar,
      },
      tasks.map((t) => ({
        workNodeId: t.work_node_id,
        durationMinutes: t.duration_minutes,
        calendarOverride: t.calendar_override,
      })),
      deps.map((d) => ({
        id: d.id,
        predecessorWorkNodeId: d.predecessor_work_node_id,
        successorWorkNodeId: d.successor_work_node_id,
        type: d.dependency_type as PersistedScheduleDependency["type"],
        lagMinutes: d.lag_minutes,
      })),
    );

    let result: ReturnType<typeof computeCpmSchedule>;
    try {
      result = computeCpmSchedule(request);
    } catch (e) {
      mapScheduleEngineError(e);
    }

    const forecastVersion = await bumpForecastVersion(client, session.tenantId, projectId);
    await replaceForecastTasks(
      client,
      session.tenantId,
      projectId,
      forecastVersion,
      result.tasks.map((t) => ({
        workNodeId: t.taskId,
        earlyStartEpochMs: t.earlyStartEpochMs,
        earlyFinishEpochMs: t.earlyFinishEpochMs,
        lateStartEpochMs: t.lateStartEpochMs,
        lateFinishEpochMs: t.lateFinishEpochMs,
        totalFloatMinutes: t.totalFloatMinutes,
        freeFloatMinutes: t.freeFloatMinutes,
        isCritical: t.isCritical,
      })),
    );
    await recordRecalcIdempotency(
      client,
      session.tenantId,
      idempotencyKey,
      projectId,
      forecastVersion,
    );

    return mapForecastResponse(projectExternalId, forecastVersion, result);
  });
}

export async function getScheduleForecastCommand(session: IamSession, projectExternalId: string) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const config = await findScheduleConfig(client, session.tenantId, projectId);
    if (!config || config.forecast_version < 1) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    return loadForecastDto(
      client,
      session.tenantId,
      projectId,
      projectExternalId,
      config.forecast_version,
    );
  });
}
