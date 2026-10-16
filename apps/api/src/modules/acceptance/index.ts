import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/acceptance";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  acceptDeliverableCommand,
  getDeliverableLifecycleCommand,
  getPackageRollupCommand,
  rejectDeliverableCommand,
  requestCompletionCommand,
  revertAcceptanceCommand,
  setManualProgressCommand,
  setProgressStrategyCommand,
  updateChecklistProgressCommand,
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
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/v1/projects/:projectId/deliverables/:workNodeId/completion-requests",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.DeliverableParams.parse(request.params);
        const body = schemas.CompletionRequestBody.parse(request.body);
        const result = await requestCompletionCommand(
          session,
          params.projectId,
          params.workNodeId,
          body.idempotencyKey,
          body.note,
        );
        return reply.status(201).send(schemas.AcceptanceDecisionResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.post(
    "/api/v1/projects/:projectId/deliverables/:workNodeId/acceptance",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.DeliverableParams.parse(request.params);
        const body = schemas.AcceptDeliverableBody.parse(request.body);
        const result = await acceptDeliverableCommand(
          session,
          params.projectId,
          params.workNodeId,
          body.idempotencyKey,
          body.criterionEvaluations,
          body.reason,
          body.evidenceRefs,
        );
        return reply.status(201).send(schemas.AcceptanceDecisionResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.post(
    "/api/v1/projects/:projectId/deliverables/:workNodeId/rejection",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.DeliverableParams.parse(request.params);
        const body = schemas.RejectDeliverableBody.parse(request.body);
        const result = await rejectDeliverableCommand(
          session,
          params.projectId,
          params.workNodeId,
          body.idempotencyKey,
          body.reason,
          body.observations,
        );
        return reply.status(201).send(schemas.AcceptanceDecisionResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.post(
    "/api/v1/projects/:projectId/deliverables/:workNodeId/revert-acceptance",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.DeliverableParams.parse(request.params);
        const body = schemas.RevertAcceptanceBody.parse(request.body);
        const result = await revertAcceptanceCommand(
          session,
          params.projectId,
          params.workNodeId,
          body.idempotencyKey,
          body.reason,
        );
        return reply.status(201).send(schemas.AcceptanceDecisionResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.get(
    "/api/v1/projects/:projectId/deliverables/:workNodeId/acceptance-state",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        const params = schemas.DeliverableParams.parse(request.params);
        const result = await getDeliverableLifecycleCommand(
          session,
          params.projectId,
          params.workNodeId,
        );
        return reply.send(schemas.LifecycleResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.put(
    "/api/v1/projects/:projectId/work-nodes/:workNodeId/progress-strategy",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.WorkNodeParams.parse(request.params);
        const body = schemas.SetProgressStrategyBody.parse(request.body);
        const result = await setProgressStrategyCommand(
          session,
          params.projectId,
          params.workNodeId,
          body.strategyKind,
          body.checklistWeights,
        );
        return reply.send(schemas.ProgressStrategyResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.put(
    "/api/v1/projects/:projectId/work-nodes/:workNodeId/manual-progress",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.WorkNodeParams.parse(request.params);
        const body = schemas.SetManualProgressBody.parse(request.body);
        const result = await setManualProgressCommand(
          session,
          params.projectId,
          params.workNodeId,
          body.progressPercent,
        );
        return reply.send({
          workNodeId: result.workNodeId,
          progressPercent: result.progressPercent,
          lifecycle: result.lifecycle,
        });
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.patch(
    "/api/v1/projects/:projectId/work-nodes/:workNodeId/checklist-progress",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        assertWriteCsrf(request, session);
        const params = schemas.WorkNodeParams.parse(request.params);
        const body = schemas.UpdateChecklistBody.parse(request.body);
        const result = await updateChecklistProgressCommand(
          session,
          params.projectId,
          params.workNodeId,
          body.items,
        );
        return reply.send(result);
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );

  app.get(
    "/api/v1/projects/:projectId/work-nodes/:workNodeId/rollup-progress",
    async (request, reply) => {
      try {
        const session = await resolveIamSession(request);
        const params = schemas.WorkNodeParams.parse(request.params);
        const result = await getPackageRollupCommand(
          session,
          params.projectId,
          params.workNodeId,
        );
        return reply.send(schemas.PackageRollupResponse.parse(result));
      } catch (e) {
        const mapped = mapError(e);
        return reply.status(mapped.status).send(mapped.body);
      }
    },
  );
}
