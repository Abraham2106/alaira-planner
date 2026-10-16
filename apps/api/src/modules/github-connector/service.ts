import { v7 as uuidv7 } from "uuid";
import { DomainError } from "@alaira/domain";
import { buildEvidenceEvent } from "@alaira/domain/evidence";
import {
  extractLinkedIssueNumber,
  GITHUB_PROVIDER,
  normalizeGithubWebhook,
  SYNTHETIC_GITHUB_LOGIN,
} from "@alaira/connectors/github";
import { parseProjectExternalId } from "@alaira/domain/project";
import { toExternalId } from "@alaira/domain/iam";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { policyEnforceCommand } from "../authz/service.js";
import {
  findEvidenceEventByDedupeKey,
  insertEvidenceEvent,
} from "../evidence/repository.js";
import {
  findConnectionProvider,
  findGithubConnectionConfig,
  findIssueWorkItemLink,
  insertGithubEvidenceIngest,
  insertIssueWorkItemLink,
  listPendingGithubDispatches,
  upsertGithubConnectionConfig,
} from "./repository.js";

function parseWorkNodeId(external: string): string {
  const id = parseProjectExternalId(external, "workNode");
  if (!id) throw new DomainError("NOT_FOUND", "Resource not found");
  return id;
}

function parseProjectId(external: string): string {
  const id = parseProjectExternalId(external, "project");
  if (!id) throw new DomainError("NOT_FOUND", "Resource not found");
  return id;
}

export async function configureGithubConnectionCommand(
  session: IamSession,
  connectionId: string,
  projectExternalId: string,
  repositoryFullName: string,
): Promise<void> {
  await policyEnforceCommand(session, "org:manage_members", {
    type: "organization",
    tenantId: toExternalId("tenant", session.tenantId),
  });
  const projectId = parseProjectId(projectExternalId);
  const repo = repositoryFullName.trim();
  if (!repo.includes("/")) {
    throw new DomainError("VALIDATION", "repositoryFullName must be owner/repo");
  }

  await withTenantTx(session.tenantId, async (client) => {
    const provider = await findConnectionProvider(client, session.tenantId, connectionId);
    if (!provider) throw new DomainError("NOT_FOUND", "Resource not found");
    if (provider !== GITHUB_PROVIDER) {
      throw new DomainError("VALIDATION", "Connection is not a GitHub provider");
    }
    await upsertGithubConnectionConfig(
      client,
      session.tenantId,
      connectionId,
      projectId,
      repo,
    );
  });
}

export async function linkGithubIssueWorkItemCommand(
  session: IamSession,
  connectionId: string,
  projectExternalId: string,
  repositoryFullName: string,
  issueNumber: number,
  workNodeExternalId: string,
): Promise<void> {
  const projectId = parseProjectId(projectExternalId);
  await policyEnforceCommand(session, "project:write", {
    type: "project",
    tenantId: toExternalId("tenant", session.tenantId),
    projectId,
  });
  const workNodeId = parseWorkNodeId(workNodeExternalId);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new DomainError("VALIDATION", "issueNumber must be positive");
  }

  await withTenantTx(session.tenantId, async (client) => {
    const provider = await findConnectionProvider(client, session.tenantId, connectionId);
    if (!provider) throw new DomainError("NOT_FOUND", "Resource not found");
    if (provider !== GITHUB_PROVIDER) {
      throw new DomainError("VALIDATION", "Connection is not a GitHub provider");
    }
    await insertIssueWorkItemLink(
      client,
      session.tenantId,
      uuidv7(),
      connectionId,
      projectId,
      repositoryFullName.trim(),
      issueNumber,
      workNodeId,
    );
  });
}

export type ProcessGithubDispatchesResult = {
  processed: number;
  evidenceEventIds: string[];
  skipped: number;
};

/** Consume despachos fabric (0119) → EvidenceEvent (0118). No actualiza % de avance. */
export async function processGithubDispatchesCommand(
  session: IamSession,
  connectionId: string,
): Promise<ProcessGithubDispatchesResult> {
  await policyEnforceCommand(session, "org:read", {
    type: "organization",
    tenantId: toExternalId("tenant", session.tenantId),
  });

  const evidenceEventIds: string[] = [];
  let processed = 0;
  let skipped = 0;

  await withTenantTx(session.tenantId, async (client) => {
    const config = await findGithubConnectionConfig(client, session.tenantId, connectionId);
    if (!config) {
      throw new DomainError("NOT_FOUND", "GitHub connection not configured");
    }

    const pending = await listPendingGithubDispatches(client, session.tenantId, connectionId);
    for (const row of pending) {
      const envelope = row.payload.normalized ?? {};
      const issueNumber = extractLinkedIssueNumber(envelope);
      const repo = config.repository_full_name;
      const link =
        issueNumber !== null
          ? await findIssueWorkItemLink(
              client,
              session.tenantId,
              connectionId,
              repo,
              issueNumber,
            )
          : null;

      const workNodeId = link?.work_node_id ?? null;
      const projectId = link?.project_id ?? config.project_id;
      const confidence = workNodeId ? 0.92 : 0.15;

      const raw = {
        provider: GITHUB_PROVIDER,
        deliveryId: row.payload.deliveryId,
        eventId: row.payload.eventId,
        resourceId: row.payload.resourceId,
        receivedAt: new Date().toISOString(),
        payload: envelope,
      };

      const prUser =
        typeof envelope.pull_request === "object" && envelope.pull_request !== null
          ? (envelope.pull_request as Record<string, unknown>).user
          : null;
      const actorLogin =
        typeof prUser === "object" &&
        prUser !== null &&
        typeof (prUser as Record<string, unknown>).login === "string"
          ? String((prUser as Record<string, unknown>).login)
          : SYNTHETIC_GITHUB_LOGIN;

      const normalized = normalizeGithubWebhook(
        raw,
        {
          externalId: actorLogin,
          displayName: `[SYNTHETIC GH] ${actorLogin}`,
          resolvedUserId: null,
        },
        {
          workNodeId,
          projectId,
          confidence,
          linkMethod: workNodeId ? "rule" : "none",
        },
      );

      if (normalized.skipped || !normalized.ingest) {
        skipped += 1;
        await insertGithubEvidenceIngest(
          client,
          session.tenantId,
          row.outbox_id,
          row.receipt_id,
          null,
          `github:skipped:${row.outbox_id}`,
          "skipped",
        );
        continue;
      }

      const ing = normalized.ingest;
      const existing = await findEvidenceEventByDedupeKey(
        client,
        session.tenantId,
        ing.dedupeKey,
      );
      if (existing) {
        await insertGithubEvidenceIngest(
          client,
          session.tenantId,
          row.outbox_id,
          row.receipt_id,
          existing.id,
          ing.dedupeKey,
        );
        evidenceEventIds.push(existing.id);
        processed += 1;
        continue;
      }

      const eventId = uuidv7();
      const recordedAt = new Date().toISOString();
      const draft = buildEvidenceEvent(session.tenantId, projectId, ing, eventId, recordedAt);
      const persisted = await insertEvidenceEvent(client, draft);
      await insertGithubEvidenceIngest(
        client,
        session.tenantId,
        row.outbox_id,
        row.receipt_id,
        persisted.id,
        ing.dedupeKey,
      );
      evidenceEventIds.push(persisted.id);
      processed += 1;
    }
  });

  return { processed, evidenceEventIds, skipped };
}
