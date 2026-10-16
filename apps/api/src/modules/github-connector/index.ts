import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { resolveIamSession, assertWriteCsrf } from "../iam/session.js";
import {
  configureGithubConnectionCommand,
  linkGithubIssueWorkItemCommand,
  processGithubDispatchesCommand,
} from "./service.js";

const connectionParams = z.object({ connectionId: z.string().uuid() });

function mapError(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof ZodError) {
    return { status: 400, body: { error: "validation_error", issues: error.issues } };
  }
  if (error instanceof DomainError) {
    if (error.code === "NOT_FOUND") return { status: 404, body: { error: "not_found" } };
    if (error.code === "FORBIDDEN") return { status: 403, body: { error: "forbidden" } };
    return { status: 400, body: { error: error.message } };
  }
  const message = error instanceof Error ? error.message : "internal_error";
  return { status: 500, body: { error: "internal_error", message } };
}

const configureBody = z.object({
  projectId: z.string().min(4),
  repositoryFullName: z.string().min(3).max(256),
});

const issueLinkBody = z.object({
  projectId: z.string().min(4),
  repositoryFullName: z.string().min(3).max(256),
  issueNumber: z.number().int().positive(),
  workNodeId: z.string().min(4),
});

export async function register(app: FastifyInstance): Promise<void> {
  app.put("/api/v1/github-connector/connections/:connectionId/config", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = connectionParams.parse(request.params);
      const body = configureBody.parse(request.body);
      await configureGithubConnectionCommand(
        session,
        params.connectionId,
        body.projectId,
        body.repositoryFullName,
      );
      return reply.status(204).send();
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post(
    "/api/v1/github-connector/connections/:connectionId/issue-links",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = connectionParams.parse(request.params);
        const body = issueLinkBody.parse(request.body);
        await linkGithubIssueWorkItemCommand(
          session,
          params.connectionId,
          body.projectId,
          body.repositoryFullName,
          body.issueNumber,
          body.workNodeId,
        );
        return reply.status(204).send();
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.post(
    "/api/v1/github-connector/connections/:connectionId/process-dispatches",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = connectionParams.parse(request.params);
        const result = await processGithubDispatchesCommand(session, params.connectionId);
        return reply.status(200).send(result);
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );
}
