import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { schemas as fabricSchemas } from "@alaira/contracts/connector-fabric";
import { ZodError } from "zod";
import {
  FABRIC_DELIVERY_ID_HEADER,
  FABRIC_SIGNATURE_HEADER,
  FABRIC_TIMESTAMP_HEADER,
} from "@alaira/connectors/fabric";
import { WebhookRejectedError } from "../connector-fabric/service.js";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import { ingestSlackMentionCommand, linkSlackIdentityCommand } from "./service.js";
import { schemas } from "./schemas.js";

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
  app.post("/api/v1/slack-intake/connections/:connectionId/mentions", async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string };
      const rawBody =
        typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {});
      const parsed =
        typeof request.body === "object" && request.body !== null
          ? request.body
          : JSON.parse(rawBody);
      const body = fabricSchemas.WebhookIngestBody.parse(parsed);
      const headers = request.headers;
      const result = await ingestSlackMentionCommand(
        connectionId,
        rawBody,
        {
          timestamp: headers[FABRIC_TIMESTAMP_HEADER] as string | undefined,
          signature: headers[FABRIC_SIGNATURE_HEADER] as string | undefined,
          deliveryId: headers[FABRIC_DELIVERY_ID_HEADER] as string | undefined,
        },
        body,
      );
      const status = result.webhookStatus === "accepted" ? 202 : 200;
      return reply.status(status).send(schemas.MentionIngestResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/slack-intake/connections/:connectionId/identity-links", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const { connectionId } = request.params as { connectionId: string };
      const body = schemas.LinkIdentityBody.parse(request.body);
      await linkSlackIdentityCommand(
        session,
        connectionId,
        body.slackUserId,
        body.appUserId,
      );
      return reply.status(204).send();
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
