import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ScheduleError } from "@alaira/domain/schedule";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/scheduling";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  createScheduleDependencyCommand,
  getScheduleConfigCommand,
  getScheduleForecastCommand,
  recalculateScheduleCommand,
  upsertScheduleConfigCommand,
  upsertScheduleTaskCommand,
} from "./service.js";

function mapError(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: { error: "validation_error", issues: error.issues },
    };
  }
  if (error instanceof ScheduleError) {
    if (error.code === "CYCLE") {
      return { status: 400, body: { error: "cycle", message: error.message } };
    }
    return { status: 400, body: { error: error.message } };
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
  app.put("/api/v1/projects/:projectId/schedule/config", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.UpsertScheduleConfigBody.parse(request.body);
      const result = await upsertScheduleConfigCommand(session, params.projectId, body);
      return reply.send(schemas.ScheduleConfigResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/schedule/config", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await getScheduleConfigCommand(session, params.projectId);
      return reply.send(schemas.ScheduleConfigResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.put("/api/v1/projects/:projectId/schedule/tasks/:workNodeId", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.WorkNodeParams.parse(request.params);
      const body = schemas.UpsertScheduleTaskBody.parse(request.body);
      const result = await upsertScheduleTaskCommand(
        session,
        params.projectId,
        params.workNodeId,
        body,
      );
      return reply.send(schemas.ScheduleTaskResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/schedule/dependencies", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreateScheduleDependencyBody.parse(request.body);
      const result = await createScheduleDependencyCommand(session, params.projectId, body);
      return reply.status(201).send(schemas.ScheduleDependencyResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/schedule/recalculate", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.RecalculateScheduleBody.parse(request.body);
      const result = await recalculateScheduleCommand(
        session,
        params.projectId,
        body.idempotencyKey,
      );
      return reply.send(schemas.ScheduleForecastResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/schedule/forecast", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await getScheduleForecastCommand(session, params.projectId);
      return reply.send(schemas.ScheduleForecastResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
