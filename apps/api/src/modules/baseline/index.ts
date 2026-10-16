import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/baseline";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  approveBaselineCommand,
  getBaselineVarianceCommand,
  getLatestBaselineCommand,
  upsertActualTaskCommand,
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
    if (error.code === "CONFLICT") return { status: 409, body: { error: "conflict", message: error.message } };
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/projects/:projectId/baseline/approve", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.ApproveBaselineBody.parse(request.body);
      const result = await approveBaselineCommand(
        session,
        params.projectId,
        body.idempotencyKey,
        body.reason,
        body.plannedCosts,
      );
      return reply.status(201).send(schemas.BaselineSummaryResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/baseline", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await getLatestBaselineCommand(session, params.projectId);
      return reply.send(schemas.BaselineSummaryResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/baseline/variance", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await getBaselineVarianceCommand(session, params.projectId);
      return reply.send(schemas.BaselineVarianceResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.put("/api/v1/projects/:projectId/baseline/actuals/:workNodeId", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.WorkNodeParams.parse(request.params);
      const body = schemas.UpsertActualTaskBody.parse(request.body);
      const result = await upsertActualTaskCommand(session, params.projectId, params.workNodeId, body);
      return reply.send(schemas.ActualTaskResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
