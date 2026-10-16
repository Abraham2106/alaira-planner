import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/wbs";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  bumpDeliverableRevisionCommand,
  createDeliverableCommand,
  createMilestoneCommand,
  createPackageCommand,
  createProjectionLinkCommand,
  listWbsTreeCommand,
  reparentWbsNodeCommand,
  updateDeliverableCriteriaCommand,
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
  app.get("/api/v1/projects/:projectId/wbs/tree", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const result = await listWbsTreeCommand(session, params.projectId);
      return reply.send(schemas.WbsTreeResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/wbs/packages", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreatePackageBody.parse(request.body);
      const result = await createPackageCommand(session, params.projectId, body);
      return reply.status(201).send(schemas.PackageResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/wbs/deliverables", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreateDeliverableBody.parse(request.body);
      const result = await createDeliverableCommand(session, params.projectId, body);
      return reply.status(201).send(schemas.DeliverableResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.patch(
    "/api/v1/projects/:projectId/wbs/deliverables/:workNodeId/criteria",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.WorkNodeParams.parse(request.params);
        const body = schemas.UpdateDeliverableCriteriaBody.parse(request.body);
        const result = await updateDeliverableCriteriaCommand(
          session,
          params.projectId,
          params.workNodeId,
          body.criteria,
        );
        return reply.send(schemas.CriteriaVersionResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.post(
    "/api/v1/projects/:projectId/wbs/deliverables/:workNodeId/revisions",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.WorkNodeParams.parse(request.params);
        const result = await bumpDeliverableRevisionCommand(
          session,
          params.projectId,
          params.workNodeId,
        );
        return reply.status(201).send(result);
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.post("/api/v1/projects/:projectId/wbs/milestones", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreateMilestoneBody.parse(request.body);
      const result = await createMilestoneCommand(session, params.projectId, body);
      return reply.status(201).send(schemas.MilestoneResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.patch("/api/v1/projects/:projectId/wbs/nodes/:workNodeId/parent", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.WorkNodeParams.parse(request.params);
      const body = schemas.ReparentNodeBody.parse(request.body);
      const result = await reparentWbsNodeCommand(
        session,
        params.projectId,
        params.workNodeId,
        body.parentWorkNodeId,
      );
      return reply.send(result);
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/wbs/projection-links", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreateProjectionLinkBody.parse(request.body);
      const result = await createProjectionLinkCommand(
        session,
        params.projectId,
        body.sourceWorkNodeId,
        body.targetWorkNodeId,
        body.linkKind,
      );
      return reply.status(201).send(schemas.ProjectionLinkResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
