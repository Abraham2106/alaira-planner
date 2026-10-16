import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/evidence";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  createManualEvidenceCommand,
  getEvidenceBlobCommand,
  getEvidenceEventCommand,
  getEvidenceRecordCommand,
  ingestEvidenceEventCommand,
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
  app.post("/api/v1/projects/:projectId/evidence", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.CreateManualEvidenceBody.parse(request.body);
      const record = await createManualEvidenceCommand(
        session,
        params.projectId,
        {
          kind: body.kind,
          title: body.title,
          description: body.description,
          url: body.url,
          workNodeId: body.workNodeId,
          metadata: body.metadata,
        },
        body.contentBase64,
        body.contentType,
      );
      return reply.status(201).send(schemas.EvidenceRecordResponse.parse({ record }));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/evidence/:evidenceId", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.EvidenceParams.parse(request.params);
      const record = await getEvidenceRecordCommand(
        session,
        params.projectId,
        params.evidenceId,
      );
      return reply.send(schemas.EvidenceRecordResponse.parse({ record }));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/evidence/:evidenceId/blob", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.EvidenceParams.parse(request.params);
      const blob = await getEvidenceBlobCommand(
        session,
        params.projectId,
        params.evidenceId,
      );
      return reply
        .header("content-type", blob.contentType)
        .send(blob.bytes);
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/evidence-events", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.IngestEvidenceEventBody.parse(request.body);
      const { event, created } = await ingestEvidenceEventCommand(
        session,
        params.projectId,
        body,
      );
      return reply
        .status(created ? 201 : 200)
        .send(schemas.EvidenceEventResponse.parse({ event }));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/evidence-events/:eventId", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.EvidenceEventParams.parse(request.params);
      const event = await getEvidenceEventCommand(
        session,
        params.projectId,
        params.eventId,
      );
      return reply.send(schemas.EvidenceEventResponse.parse({ event }));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
