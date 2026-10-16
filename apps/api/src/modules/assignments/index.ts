import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/assignments";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  analyzeCapacityCommand,
  createAssignmentCommand,
  createPersonCommand,
  listAssignmentsCommand,
  listPeopleCommand,
  updateAssignmentCommand,
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
  app.post("/api/v1/projects/:projectId/assignments/people", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreatePersonBody.parse(request.body);
      const result = await createPersonCommand(session, params.projectId, body);
      return reply.status(201).send(schemas.PersonResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/assignments/people", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await listPeopleCommand(session, params.projectId);
      return reply.send(schemas.PersonListResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/assignments", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreateAssignmentBody.parse(request.body);
      const result = await createAssignmentCommand(session, params.projectId, body);
      return reply.status(201).send(schemas.AssignmentResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/assignments", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await listAssignmentsCommand(session, params.projectId);
      return reply.send(schemas.AssignmentListResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.patch("/api/v1/projects/:projectId/assignments/:assignmentId", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.AssignmentParams.parse(request.params);
      const body = schemas.UpdateAssignmentBody.parse(request.body);
      const result = await updateAssignmentCommand(
        session,
        params.projectId,
        params.assignmentId,
        body,
      );
      return reply.send(schemas.AssignmentResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/assignments/capacity", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await analyzeCapacityCommand(session, params.projectId);
      return reply.send(schemas.CapacityAnalysisResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
