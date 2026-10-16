import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/project";
import { requireActor } from "../../bootstrap/auth-contract.js";
import {
  assertWriteCsrf,
  resolveIamSession,
} from "../iam/session.js";
import {
  createBranchCommand,
  createProjectCommand,
  defineCustomFieldCommand,
  getProjectCommand,
  listBranchesCommand,
  setOwnershipCommand,
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
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/projects", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const body = schemas.CreateProjectBody.parse(request.body);
      const result = await createProjectCommand(session, body.name, body.deliveryProfile);
      return reply.status(201).send(schemas.ProjectResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await getProjectCommand(session, params.projectId);
      return reply.send(schemas.ProjectResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/branches", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreateBranchBody.parse(request.body);
      const result = await createBranchCommand(
        session,
        params.projectId,
        body.title,
        body.executionModeOverride,
        body.parentWorkNodeId,
      );
      return reply.status(201).send(schemas.BranchResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/branches", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await listBranchesCommand(session, params.projectId);
      return reply.send(schemas.ListBranchesResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/custom-fields", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.DefineCustomFieldBody.parse(request.body);
      const result = await defineCustomFieldCommand(
        session,
        params.projectId,
        body.fieldKey,
        body.fieldType,
        body.label,
      );
      return reply.status(201).send(schemas.CustomFieldDefResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.patch("/api/v1/projects/:projectId/work-nodes/:workNodeId/ownership", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.WorkNodeParams.parse(request.params);
      const body = schemas.SetOwnershipBody.parse(request.body);
      const result = await setOwnershipCommand(
        session,
        params.projectId,
        params.workNodeId,
        body.responsibleUserId,
        body.approverUserId,
      );
      return reply.send(schemas.OwnershipResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
