import { v7 as uuidv7 } from "uuid";
import { DomainError } from "@alaira/domain";
import {
  buildCapacityAnalysisRequest,
  parseAssignmentExternalId,
  toAssignmentExternalId,
  type ProjectPersonRecord,
  type WorkNodeAssignmentRecord,
} from "@alaira/domain/assignments";
import {
  CapacityError,
  recalculateAssignmentTriangle,
  type AssignmentRecalcMode,
  type AssignmentTriangleField,
} from "@alaira/domain/capacity";
import {
  parseProjectExternalId,
  toProjectExternalId,
} from "@alaira/domain/project";
import { computeCapacityAnalysis } from "@alaira/engine/capacity";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { assertPolicyAllowed, loadAuthzActor } from "../authz/repository.js";
import { findProjectById, findWorkNode } from "../project/repository.js";
import {
  findAssignment,
  findPerson,
  insertAssignment,
  insertPerson,
  listAssignmentsForProject,
  listPeopleForProject,
  updateAssignmentMetrics,
  type AssignmentRow,
  type PersonRow,
} from "./repository.js";

function parseProjectId(external: string): string {
  const id = parseProjectExternalId(external, "project");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

function parsePersonId(external: string): string {
  const id = parseAssignmentExternalId(external, "person");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

function parseAssignmentId(external: string): string {
  const id = parseAssignmentExternalId(external, "assignment");
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

function mapPersonRow(row: PersonRow): ProjectPersonRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    displayName: row.display_name,
    teamName: row.team_name,
    maxUnits: Number(row.max_units),
    calendar: row.calendar,
  };
}

function mapAssignmentRow(row: AssignmentRow): WorkNodeAssignmentRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    personId: row.person_id,
    workNodeId: row.work_node_id,
    units: Number(row.units),
    workMinutes: Number(row.work_minutes),
    durationMinutes: Number(row.duration_minutes),
    scheduledStartEpochMs: Number(row.scheduled_start_epoch_ms),
    scheduledFinishEpochMs: Number(row.scheduled_finish_epoch_ms),
  };
}

function mapPgUnique(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}

function toPersonResponse(row: PersonRow) {
  return {
    id: toAssignmentExternalId("person", row.id),
    projectId: toProjectExternalId("project", row.project_id),
    displayName: row.display_name,
    teamName: row.team_name,
    maxUnits: Number(row.max_units),
    calendar: row.calendar,
  };
}

function toAssignmentResponse(row: AssignmentRow) {
  return {
    id: toAssignmentExternalId("assignment", row.id),
    projectId: toProjectExternalId("project", row.project_id),
    personId: toAssignmentExternalId("person", row.person_id),
    workNodeId: toProjectExternalId("workNode", row.work_node_id),
    units: Number(row.units),
    workMinutes: Number(row.work_minutes),
    durationMinutes: Number(row.duration_minutes),
    scheduledStartEpochMs: Number(row.scheduled_start_epoch_ms),
    scheduledFinishEpochMs: Number(row.scheduled_finish_epoch_ms),
  };
}

export async function createPersonCommand(
  session: IamSession,
  projectExternalId: string,
  input: {
    displayName: string;
    teamName?: string;
    maxUnits?: number;
    calendar: ProjectPersonRecord["calendar"];
  },
) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectWrite(session, projectId);
  const personId = uuidv7();

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const row = await insertPerson(
      client,
      session.tenantId,
      personId,
      projectId,
      input.displayName,
      input.teamName ?? null,
      input.maxUnits ?? 1,
      input.calendar,
    );
    return toPersonResponse(row);
  });
}

export async function listPeopleCommand(session: IamSession, projectExternalId: string) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const rows = await listPeopleForProject(client, session.tenantId, projectId);
    return {
      people: rows.map((row) => ({
        id: toAssignmentExternalId("person", row.id),
        displayName: row.display_name,
        teamName: row.team_name,
        maxUnits: Number(row.max_units),
      })),
    };
  });
}

export async function createAssignmentCommand(
  session: IamSession,
  projectExternalId: string,
  input: {
    personId: string;
    workNodeId: string;
    units: number;
    workMinutes: number;
    durationMinutes: number;
    scheduledStartEpochMs: number;
    scheduledFinishEpochMs: number;
  },
) {
  const projectId = parseProjectId(projectExternalId);
  const personId = parsePersonId(input.personId);
  const workNodeId = parseWorkNodeId(input.workNodeId);
  await assertProjectWrite(session, projectId);

  if (input.scheduledFinishEpochMs < input.scheduledStartEpochMs) {
    throw new DomainError("VALIDATION", "Schedule finish must be on or after start");
  }

  const assignmentId = uuidv7();

  try {
    return await withTenantTx(session.tenantId, async (client) => {
      const project = await findProjectById(client, session.tenantId, projectId);
      if (!project) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }
      const person = await findPerson(client, session.tenantId, projectId, personId);
      if (!person) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }
      const node = await findWorkNode(client, session.tenantId, projectId, workNodeId);
      if (!node) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }

      const row = await insertAssignment(
        client,
        session.tenantId,
        assignmentId,
        projectId,
        personId,
        workNodeId,
        input.units,
        input.workMinutes,
        input.durationMinutes,
        input.scheduledStartEpochMs,
        input.scheduledFinishEpochMs,
      );
      return toAssignmentResponse(row);
    });
  } catch (error) {
    if (mapPgUnique(error)) {
      throw new DomainError("CONFLICT", "Person already assigned to this work item");
    }
    throw error;
  }
}

export async function listAssignmentsCommand(session: IamSession, projectExternalId: string) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const rows = await listAssignmentsForProject(client, session.tenantId, projectId);
    return {
      assignments: rows.map((row) => ({
        id: toAssignmentExternalId("assignment", row.id),
        personId: toAssignmentExternalId("person", row.person_id),
        workNodeId: toProjectExternalId("workNode", row.work_node_id),
        units: Number(row.units),
        workMinutes: Number(row.work_minutes),
        durationMinutes: Number(row.duration_minutes),
        scheduledStartEpochMs: Number(row.scheduled_start_epoch_ms),
        scheduledFinishEpochMs: Number(row.scheduled_finish_epoch_ms),
      })),
    };
  });
}

function resolveTrianglePatch(
  current: { units: number; workMinutes: number; durationMinutes: number },
  input: {
    units?: number;
    workMinutes?: number;
    durationMinutes?: number;
    recalcMode?: AssignmentRecalcMode;
    changedField?: AssignmentTriangleField;
  },
): { units: number; workMinutes: number; durationMinutes: number } {
  const mode = input.recalcMode ?? "fixed_work";
  const changed = input.changedField;
  if (!changed) {
    return {
      units: input.units ?? current.units,
      workMinutes: input.workMinutes ?? current.workMinutes,
      durationMinutes: input.durationMinutes ?? current.durationMinutes,
    };
  }
  const nextField =
    changed === "work"
      ? (input.workMinutes ?? current.workMinutes)
      : changed === "duration"
        ? (input.durationMinutes ?? current.durationMinutes)
        : (input.units ?? current.units);

  const draft = {
    workMinutes: changed === "work" ? nextField : (input.workMinutes ?? current.workMinutes),
    durationMinutes:
      changed === "duration" ? nextField : (input.durationMinutes ?? current.durationMinutes),
    units: changed === "units" ? nextField : (input.units ?? current.units),
  };

  try {
    return recalculateAssignmentTriangle(draft, mode, changed);
  } catch (error) {
    if (error instanceof CapacityError) {
      throw new DomainError("VALIDATION", error.message);
    }
    throw error;
  }
}

export async function updateAssignmentCommand(
  session: IamSession,
  projectExternalId: string,
  assignmentExternalId: string,
  input: {
    units?: number;
    workMinutes?: number;
    durationMinutes?: number;
    scheduledStartEpochMs?: number;
    scheduledFinishEpochMs?: number;
    recalcMode?: AssignmentRecalcMode;
    changedField?: AssignmentTriangleField;
  },
) {
  const projectId = parseProjectId(projectExternalId);
  const assignmentId = parseAssignmentId(assignmentExternalId);
  await assertProjectWrite(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const existing = await findAssignment(client, session.tenantId, projectId, assignmentId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const current = mapAssignmentRow(existing);
    const start = input.scheduledStartEpochMs ?? current.scheduledStartEpochMs;
    const finish = input.scheduledFinishEpochMs ?? current.scheduledFinishEpochMs;
    if (finish < start) {
      throw new DomainError("VALIDATION", "Schedule finish must be on or after start");
    }

    const triangle = resolveTrianglePatch(current, input);
    const row = await updateAssignmentMetrics(client, session.tenantId, projectId, assignmentId, {
      ...triangle,
      scheduledStartEpochMs: input.scheduledStartEpochMs,
      scheduledFinishEpochMs: input.scheduledFinishEpochMs,
    });
    return toAssignmentResponse(row);
  });
}

export async function analyzeCapacityCommand(session: IamSession, projectExternalId: string) {
  const projectId = parseProjectId(projectExternalId);
  await assertProjectRead(session, projectId);

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findProjectById(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const peopleRows = await listPeopleForProject(client, session.tenantId, projectId);
    const assignmentRows = await listAssignmentsForProject(client, session.tenantId, projectId);

    if (peopleRows.length === 0) {
      return {
        conflicts: [],
        assignments: [],
        assumptions: [
          "No project people defined; add synthetic persons before capacity analysis.",
        ],
      };
    }

    const people = peopleRows.map(mapPersonRow);
    const assignments = assignmentRows.map(mapAssignmentRow);
    const request = buildCapacityAnalysisRequest(people, assignments);

    try {
      const result = computeCapacityAnalysis(request);
      const personExternalById = new Map(
        peopleRows.map((p) => [p.id, toAssignmentExternalId("person", p.id)]),
      );
      return {
        ...result,
        conflicts: result.conflicts.map((c) => ({
          ...c,
          personExternalId: personExternalById.get(c.personId),
        })),
      };
    } catch (error) {
      if (error instanceof CapacityError) {
        throw new DomainError("VALIDATION", error.message);
      }
      throw error;
    }
  });
}
