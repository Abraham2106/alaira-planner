import { v7 as uuidv7 } from "uuid";
import { DomainError, type TenantId } from "@alaira/domain";
import {
  buildProjectAuditEvent,
  formatReadableAuditEntry,
  type AppendProjectAuditEventInput,
  type ProjectAuditEvent,
} from "@alaira/domain/eventlog";
import { toExternalId } from "@alaira/domain/iam";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { policyEnforceCommand } from "../authz/service.js";
import {
  countAuditEventsForProject,
  countOutboxForIdempotencyKey,
  findAuditEventById,
  findEventlogProject,
  findIdempotentAuditEventId,
  insertAuditEvent,
  insertEventlogOutbox,
  listAuditEventsForProject,
  recordEventlogIdempotency,
} from "./repository.js";

export type EventLogEntryDto = ProjectAuditEvent & { readable: string };

function toDto(event: ProjectAuditEvent): EventLogEntryDto {
  return {
    ...event,
    readable: formatReadableAuditEntry(event),
  };
}

export async function appendProjectEventLogCommand(
  session: IamSession,
  projectId: string,
  idempotencyKey: string,
  input: AppendProjectAuditEventInput,
): Promise<EventLogEntryDto> {
  await policyEnforceCommand(session, "project:write", {
    type: "project",
    tenantId: toExternalId("tenant", session.tenantId),
    projectId,
  });

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findEventlogProject(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const existingId = await findIdempotentAuditEventId(
      client,
      session.tenantId,
      idempotencyKey,
    );
    if (existingId) {
      const existing = await findAuditEventById(client, session.tenantId, existingId);
      if (!existing) {
        throw new DomainError("NOT_FOUND", "Resource not found");
      }
      return toDto(existing);
    }

    const eventId = uuidv7();
    const occurredAt = new Date().toISOString();
    const draft = buildProjectAuditEvent(
      {
        tenantId: session.tenantId,
        userId: session.userId,
        roles: [],
      },
      projectId,
      session.tenantId,
      input,
      eventId,
      occurredAt,
      0,
    );

    const persisted = await insertAuditEvent(client, draft);
    const outboxId = uuidv7();
    await insertEventlogOutbox(
      client,
      session.tenantId,
      outboxId,
      persisted.id,
      projectId,
      idempotencyKey,
      input.eventType,
    );
    await recordEventlogIdempotency(
      client,
      session.tenantId,
      idempotencyKey,
      persisted.id,
      outboxId,
    );

    return toDto(persisted);
  });
}

export async function listProjectEventLogCommand(
  session: IamSession,
  projectId: string,
): Promise<EventLogEntryDto[]> {
  await policyEnforceCommand(session, "project:read", {
    type: "project",
    tenantId: toExternalId("tenant", session.tenantId),
    projectId,
  });

  return withTenantTx(session.tenantId, async (client) => {
    const project = await findEventlogProject(client, session.tenantId, projectId);
    if (!project) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }
    const events = await listAuditEventsForProject(client, session.tenantId, projectId);
    return events.map(toDto);
  });
}

export async function countProjectAuditEvents(
  tenantId: TenantId,
  projectId: string,
): Promise<number> {
  return withTenantTx(tenantId, async (client) =>
    countAuditEventsForProject(client, tenantId, projectId),
  );
}

export async function countEventlogOutboxForKey(
  tenantId: TenantId,
  idempotencyKey: string,
): Promise<number> {
  return withTenantTx(tenantId, async (client) =>
    countOutboxForIdempotencyKey(client, tenantId, idempotencyKey),
  );
}
