import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { schemas } from "@alaira/contracts/eventlog";
import { resolveIamSession } from "../iam/session.js";
import { appendProjectEventLogCommand, listProjectEventLogCommand } from "./service.js";

function mapError(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof DomainError) {
    if (error.code === "NOT_FOUND") return { status: 404, body: { error: "not_found" } };
    if (error.code === "FORBIDDEN") return { status: 403, body: { error: "forbidden" } };
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/projects/:projectId/event-log/entries", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const { projectId } = request.params as { projectId: string };
      const body = schemas.AppendEventLogBody.parse(request.body);
      const entry = await appendProjectEventLogCommand(
        session,
        projectId,
        body.idempotencyKey,
        body,
      );
      return reply.status(201).send(
        schemas.AppendEventLogResponse.parse({
          entry,
        }),
      );
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/event-log", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const { projectId } = request.params as { projectId: string };
      const entries = await listProjectEventLogCommand(session, projectId);
      return reply.send(schemas.ListEventLogResponse.parse({ entries }));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
