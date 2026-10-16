import { DomainError } from "@alaira/domain";
import { formatReadableAuditEntry } from "@alaira/domain/eventlog";
import { toExternalId } from "@alaira/domain/iam";
import { parseProjectExternalId, toProjectExternalId } from "@alaira/domain/project";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { policyEnforceCommand } from "../authz/service.js";
import { createProjectCommand } from "../project/service.js";
import { parseProjectsSampleCsv, serializeProjectsSampleCsv } from "./csv.js";
import {
  countAuditEventsFiltered,
  countSearchableProjects,
  findEventlogAnchor,
  findProjectGraphByExternalId,
  listProjectsForExport,
  searchAuditEvents,
  searchProjectsForUser,
} from "./repository.js";

function parseProjectIdParam(external: string): string {
  const id = parseProjectExternalId(external, "project");
  if (!id) {
    throw new DomainError("NOT_FOUND", "Resource not found");
  }
  return id;
}

function paginationMeta(total: number, page: number, pageSize: number) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return { page, pageSize, total, totalPages };
}

export async function searchProjectsCommand(
  session: IamSession,
  query: { page: number; pageSize: number; q?: string; planningMode?: string },
) {
  await policyEnforceCommand(session, "project:read", {
    type: "organization",
    tenantId: toExternalId("tenant", session.tenantId),
  });

  const offset = (query.page - 1) * query.pageSize;
  return withTenantTx(session.tenantId, async (client) => {
    const total = await countSearchableProjects(
      client,
      session.tenantId,
      session.userId,
      query.q,
      query.planningMode,
    );
    const rows = await searchProjectsForUser(
      client,
      session.tenantId,
      session.userId,
      query.q,
      query.planningMode,
      offset,
      query.pageSize,
    );
    return {
      items: rows.map((r) => ({
        id: toProjectExternalId("project", r.id),
        name: r.name,
        planningMode: r.delivery_profile.planningMode,
        version: r.version,
      })),
      ...paginationMeta(total, query.page, query.pageSize),
    };
  });
}

export async function searchEventLogCommand(
  session: IamSession,
  projectIdExternal: string,
  query: { page: number; pageSize: number; eventType?: string },
) {
  const projectUuid = parseProjectIdParam(projectIdExternal);
  await policyEnforceCommand(session, "project:read", {
    type: "project",
    tenantId: toExternalId("tenant", session.tenantId),
    projectId: projectIdExternal,
  });

  return withTenantTx(session.tenantId, async (client) => {
    const graph = await findProjectGraphByExternalId(client, session.tenantId, projectUuid);
    const anchor = await findEventlogAnchor(client, session.tenantId, projectUuid);
    if (!graph && !anchor) {
      throw new DomainError("NOT_FOUND", "Resource not found");
    }

    const total = await countAuditEventsFiltered(
      client,
      session.tenantId,
      projectUuid,
      query.eventType,
    );
    const offset = (query.page - 1) * query.pageSize;
    const rows = await searchAuditEvents(
      client,
      session.tenantId,
      projectUuid,
      query.eventType,
      offset,
      query.pageSize,
    );
    return {
      projectId: projectIdExternal,
      items: rows.map((row) => {
        const readable = formatReadableAuditEntry({
          id: row.id,
          tenantId: session.tenantId,
          projectId: row.project_id,
          sequenceNum: Number(row.sequence_num),
          eventType: row.event_type,
          schemaVersion: 1,
          occurredAt: row.occurred_at.toISOString(),
          actorUserId: row.actor_user_id,
          summary: row.summary,
          payload: row.payload ?? {},
        });
        return {
          id: row.id,
          sequenceNum: Number(row.sequence_num),
          eventType: row.event_type,
          summary: row.summary,
          occurredAt: row.occurred_at.toISOString(),
          readable,
        };
      }),
      ...paginationMeta(total, query.page, query.pageSize),
    };
  });
}

export async function exportProjectsSampleCsvCommand(session: IamSession): Promise<string> {
  await policyEnforceCommand(session, "project:read", {
    type: "organization",
    tenantId: toExternalId("tenant", session.tenantId),
  });
  const rows = await withTenantTx(session.tenantId, (client) =>
    listProjectsForExport(client, session.tenantId, session.userId),
  );
  return serializeProjectsSampleCsv(
    rows.map((r) => ({ name: r.name, deliveryProfile: r.delivery_profile })),
  );
}

export async function importProjectsSampleCsvCommand(
  session: IamSession,
  csvText: string,
): Promise<{ imported: number; skipped: number; errors: { row: number; message: string }[] }> {
  const parsed = parseProjectsSampleCsv(csvText);
  if (!parsed.ok) {
    throw new DomainError("VALIDATION", JSON.stringify({ errors: parsed.errors }));
  }
  let imported = 0;
  for (const row of parsed.rows) {
    await createProjectCommand(session, row.name, row.deliveryProfile);
    imported++;
  }
  return { imported, skipped: 0, errors: [] };
}
