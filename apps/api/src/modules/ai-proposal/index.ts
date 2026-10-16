import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/ai-proposal";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  confirmProposalCommand,
  getProposalCommand,
  rejectProposalCommand,
  runObservationCommand,
} from "./service.js";

function mapError(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: { error: "validation_error", issues: error.issues },
    };
  }
  if (error instanceof DomainError) {
    if (error.code === "NOT_FOUND") return { status: 404, body: { error: "not_found" } };
    if (error.code === "FORBIDDEN") return { status: 403, body: { error: "forbidden" } };
    if (error.code === "CONFLICT") {
      return { status: 409, body: { error: "conflict", message: error.message } };
    }
    if (error.code === "VALIDATION") {
      return { status: 400, body: { error: "validation_error", message: error.message } };
    }
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/projects/:projectId/ai-proposals/run", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.RunObservationBody.parse(request.body);
      const result = await runObservationCommand(session, params.projectId, body);
      if (!result.ok) {
        return reply.status(403).send(
          schemas.RunObservationDenied.parse({
            ok: false,
            reason: result.reason,
            audit: result.audit,
          }),
        );
      }
      if (result.kind === "executed") {
        return reply.send(schemas.RunObservationExecuted.parse(result));
      }
      return reply.status(201).send(schemas.RunObservationProposal.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/ai-proposals/:proposalId", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProposalParams.parse(request.params);
      const result = await getProposalCommand(session, params.projectId, params.proposalId);
      return reply.send(schemas.ProposalResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post(
    "/api/v1/projects/:projectId/ai-proposals/:proposalId/confirm",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.ProposalParams.parse(request.params);
        const body = schemas.ConfirmProposalBody.parse(request.body);
        const result = await confirmProposalCommand(
          session,
          params.projectId,
          params.proposalId,
          body.idempotencyKey,
        );
        return reply.send(schemas.ResolveProposalResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.post(
    "/api/v1/projects/:projectId/ai-proposals/:proposalId/reject",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.ProposalParams.parse(request.params);
        const body = schemas.RejectProposalBody.parse(request.body);
        const result = await rejectProposalCommand(
          session,
          params.projectId,
          params.proposalId,
          body.idempotencyKey,
          body.reason,
        );
        return reply.send(schemas.ResolveProposalResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );
}
