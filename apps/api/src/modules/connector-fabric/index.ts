import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { schemas } from "@alaira/contracts/connector-fabric";
import { ZodError } from "zod";
import {
  FABRIC_DELIVERY_ID_HEADER,
  FABRIC_SIGNATURE_HEADER,
  FABRIC_TIMESTAMP_HEADER,
} from "@alaira/connectors/fabric";
import { resolveIamSession, assertWriteCsrf } from "../iam/session.js";
import {
  getConnectionHealthCommand,
  ingestWebhookCommand,
  safeWebhookLogContext,
  storeSyntheticTokenCommand,
  WebhookRejectedError,
} from "./service.js";

function mapError(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof ZodError) {
    return { status: 400, body: { error: "validation_error", issues: error.issues } };
  }
  if (error instanceof WebhookRejectedError) {
    if (error.code === "not_found") return { status: 404, body: { error: "not_found" } };
    return { status: 401, body: { error: error.code } };
  }
  if (error instanceof DomainError) {
    if (error.code === "NOT_FOUND") return { status: 404, body: { error: "not_found" } };
    if (error.code === "FORBIDDEN") return { status: 403, body: { error: "forbidden" } };
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/connector-fabric/webhooks/:connectionId", async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string };
      const rawBody =
        typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {});
      const parsed =
        typeof request.body === "object" && request.body !== null
          ? request.body
          : JSON.parse(rawBody);
      const body = schemas.WebhookIngestBody.parse(parsed);
      const headers = request.headers;
      const result = await ingestWebhookCommand(
        connectionId,
        rawBody,
        {
          timestamp: headers[FABRIC_TIMESTAMP_HEADER] as string | undefined,
          signature: headers[FABRIC_SIGNATURE_HEADER] as string | undefined,
          deliveryId: headers[FABRIC_DELIVERY_ID_HEADER] as string | undefined,
        },
        body,
      );
      return reply
        .status(result.status === "accepted" ? 202 : 200)
        .send(schemas.WebhookIngestResponse.parse(result));
    } catch (e) {
      request.log.warn(safeWebhookLogContext({ err: String(e) }), "webhook ingest failed");
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/connector-fabric/connections/:connectionId/health", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const { connectionId } = request.params as { connectionId: string };
      const result = await getConnectionHealthCommand(session, connectionId);
      return reply.send(schemas.ConnectionHealthResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/connector-fabric/connections/:connectionId/tokens", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const { connectionId } = request.params as { connectionId: string };
      const body = schemas.StoreSyntheticTokenBody.parse(request.body);
      await storeSyntheticTokenCommand(session, connectionId, body.kind, body.plaintext);
      return reply.status(204).send();
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
