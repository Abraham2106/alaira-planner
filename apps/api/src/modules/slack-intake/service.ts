import { v7 as uuidv7 } from "uuid";
import { DomainError, type TenantId } from "@alaira/domain";
import { evaluatePolicy } from "@alaira/domain/authz";
import type { WebhookIngestBody } from "@alaira/contracts/connector-fabric";
import { normalizeSlackMention } from "@alaira/connectors/slack";
import { ingestWebhookCommand } from "../connector-fabric/service.js";
import { loadAuthzActor } from "../authz/repository.js";
import { withTenantTx } from "../../db/pool.js";
import type { IamSession } from "../iam/session.js";
import { policyEnforceCommand } from "../authz/service.js";
import { toExternalId } from "@alaira/domain/iam";
import {
  findIdentityLink,
  findPendingByDedup,
  findProjectByNameHint,
  insertPendingRequest,
  upsertIdentityLink,
} from "./repository.js";

export type MentionIntakeResult = {
  receiptId: string;
  webhookStatus: "accepted" | "duplicate";
  outcome:
    | "pending_created"
    | "duplicate_no_state_change"
    | "needs_link"
    | "needs_disambiguation"
    | "rejected_permission"
    | "ignored_unknown";
  pendingRequestId?: string;
  message: string;
};

export async function linkSlackIdentityCommand(
  session: IamSession,
  connectionId: string,
  slackUserId: string,
  appUserId: string,
): Promise<void> {
  await policyEnforceCommand(session, "org:manage_members", {
    type: "organization",
    tenantId: toExternalId("tenant", session.tenantId),
  });
  await withTenantTx(session.tenantId, async (client) => {
    const { rows } = await client.query(
      `SELECT id FROM connector_connection WHERE tenant_id = $1 AND id = $2 AND provider = 'slack'`,
      [session.tenantId, connectionId],
    );
    if (!rows[0]) throw new DomainError("NOT_FOUND", "Resource not found");
    await upsertIdentityLink(client, session.tenantId, connectionId, slackUserId, appUserId);
  });
}

export async function ingestSlackMentionCommand(
  connectionId: string,
  rawBody: string,
  headers: { timestamp?: string; signature?: string; deliveryId?: string },
  body: WebhookIngestBody,
): Promise<MentionIntakeResult> {
  if (body.provider !== "slack") {
    throw new DomainError("VALIDATION", "provider must be slack");
  }

  const webhook = await ingestWebhookCommand(connectionId, rawBody, headers, body);
  const normalized = normalizeSlackMention(body.eventId, body.deliveryId, body.payload);

  const meta = await resolveConnectionTenant(connectionId);
  const tenantId = meta.tenant_id as TenantId;

  const existing = await withTenantTx(tenantId, (client) =>
    findPendingByDedup(client, tenantId, connectionId, normalized.dedupKey),
  );
  if (existing) {
    return {
      receiptId: webhook.receiptId,
      webhookStatus: webhook.status,
      outcome: "duplicate_no_state_change",
      pendingRequestId: existing.id,
      message: existing.response_message,
    };
  }

  if (webhook.status === "duplicate") {
    return {
      receiptId: webhook.receiptId,
      webhookStatus: "duplicate",
      outcome: "duplicate_no_state_change",
      message: "Solicitud ya registrada; no se aplicó ningún cambio de estado.",
    };
  }

  if (normalized.intent.kind === "unknown") {
    return {
      receiptId: webhook.receiptId,
      webhookStatus: webhook.status,
      outcome: "ignored_unknown",
      message: "No reconocí una intención soportada. Usa @Alaira con un proyecto y tarea claros.",
    };
  }

  if (normalized.intent.kind === "ambiguous") {
    const pendingId = uuidv7();
    const message =
      "Necesito más contexto: indica el proyecto y la tarea con nombres únicos. No se modificó el avance.";
    await withTenantTx(tenantId, (client) =>
      insertPendingRequest(client, {
        id: pendingId,
        tenantId,
        connectionId,
        fabricReceiptId: webhook.receiptId,
        dedupKey: normalized.dedupKey,
        slackUserId: normalized.slackUserId,
        appUserId: null,
        intent: "ambiguous",
        status: "needs_disambiguation",
        projectId: null,
        workItemHint: null,
        projectHint: null,
        userMessage: normalized.text,
        responseMessage: message,
      }),
    );
    return {
      receiptId: webhook.receiptId,
      webhookStatus: webhook.status,
      outcome: "needs_disambiguation",
      pendingRequestId: pendingId,
      message,
    };
  }

  const link = await withTenantTx(tenantId, (client) =>
    findIdentityLink(client, tenantId, connectionId, normalized.slackUserId),
  );
  if (normalized.intent.kind !== "complete_work_item") {
    throw new DomainError("VALIDATION", "Unexpected intent state");
  }
  const completeIntent = normalized.intent;

  if (!link) {
    const pendingId = uuidv7();
    const message =
      "Tu identidad de Slack no está vinculada. Pide a un administrador que complete el enlace seguro antes de actuar.";
    await withTenantTx(tenantId, (client) =>
      insertPendingRequest(client, {
        id: pendingId,
        tenantId,
        connectionId,
        fabricReceiptId: webhook.receiptId,
        dedupKey: normalized.dedupKey,
        slackUserId: normalized.slackUserId,
        appUserId: null,
        intent: completeIntent.kind,
        status: "needs_link",
        projectId: null,
        workItemHint: completeIntent.workItemHint,
        projectHint: completeIntent.projectHint,
        userMessage: normalized.text,
        responseMessage: message,
      }),
    );
    return {
      receiptId: webhook.receiptId,
      webhookStatus: webhook.status,
      outcome: "needs_link",
      pendingRequestId: pendingId,
      message,
    };
  }

  const intent = completeIntent;

  const appUserId = link.app_user_id;
  const actor = await loadAuthzActor(tenantId, appUserId);

  const project = await withTenantTx(tenantId, (client) =>
    findProjectByNameHint(client, tenantId, intent.projectHint),
  );
  if (!project) {
    const pendingId = uuidv7();
    const message =
      "No encontré un único proyecto con ese nombre. Ajusta el mensaje; el avance no cambió.";
    await withTenantTx(tenantId, (client) =>
      insertPendingRequest(client, {
        id: pendingId,
        tenantId,
        connectionId,
        fabricReceiptId: webhook.receiptId,
        dedupKey: normalized.dedupKey,
        slackUserId: normalized.slackUserId,
        appUserId,
        intent: intent.kind,
        status: "needs_disambiguation",
        projectId: null,
        workItemHint: intent.workItemHint,
        projectHint: intent.projectHint,
        userMessage: normalized.text,
        responseMessage: message,
      }),
    );
    return {
      receiptId: webhook.receiptId,
      webhookStatus: webhook.status,
      outcome: "needs_disambiguation",
      pendingRequestId: pendingId,
      message,
    };
  }

  const allowed = evaluatePolicy(actor, "project:write", {
    type: "project",
    tenantId: actor.tenantId,
    projectId: project.id,
  });

  if (!allowed) {
    const pendingId = uuidv7();
    const message =
      "No tienes permiso para registrar esa solicitud en este proyecto. El avance del proyecto no cambió.";
    await withTenantTx(tenantId, (client) =>
      insertPendingRequest(client, {
        id: pendingId,
        tenantId,
        connectionId,
        fabricReceiptId: webhook.receiptId,
        dedupKey: normalized.dedupKey,
        slackUserId: normalized.slackUserId,
        appUserId,
        intent: intent.kind,
        status: "rejected",
        projectId: project.id,
        workItemHint: intent.workItemHint,
        projectHint: intent.projectHint,
        userMessage: normalized.text,
        responseMessage: message,
      }),
    );
    return {
      receiptId: webhook.receiptId,
      webhookStatus: webhook.status,
      outcome: "rejected_permission",
      pendingRequestId: pendingId,
      message,
    };
  }

  const pendingId = uuidv7();
  const message = `Solicitud de finalización registrada como pendiente (ID ${pendingId.slice(0, 8)}…). «${intent.workItemHint}» en «${project.name}». El avance aceptado no cambió.`;
  await withTenantTx(tenantId, (client) =>
    insertPendingRequest(client, {
      id: pendingId,
      tenantId,
      connectionId,
      fabricReceiptId: webhook.receiptId,
      dedupKey: normalized.dedupKey,
      slackUserId: normalized.slackUserId,
      appUserId,
      intent: intent.kind,
      status: "pending",
      projectId: project.id,
      workItemHint: intent.workItemHint,
      projectHint: intent.projectHint,
      userMessage: normalized.text,
      responseMessage: message,
    }),
  );

  return {
    receiptId: webhook.receiptId,
    webhookStatus: webhook.status,
    outcome: "pending_created",
    pendingRequestId: pendingId,
    message,
  };
}

async function resolveConnectionTenant(
  connectionId: string,
): Promise<{ tenant_id: string }> {
  const pg = await import("pg");
  const { loadDbConfig } = await import("../../db/config.js");
  const { adminUrl } = loadDbConfig();
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const { rows } = await client.query<{ tenant_id: string }>(
      `SELECT tenant_id FROM connector_connection WHERE id = $1`,
      [connectionId],
    );
    if (!rows[0]) throw new DomainError("NOT_FOUND", "Resource not found");
    return rows[0];
  } finally {
    await client.end();
  }
}

export async function countPendingForDedup(
  tenantId: TenantId,
  connectionId: string,
  dedupKey: string,
): Promise<number> {
  return withTenantTx(tenantId, async (client) => {
    const { rows } = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM slack_intake_pending_request
       WHERE tenant_id = $1 AND connection_id = $2 AND dedup_key = $3`,
      [tenantId, connectionId, dedupKey],
    );
    return Number(rows[0]?.count ?? "0");
  });
}
