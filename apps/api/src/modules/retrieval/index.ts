import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import { schemas } from "@alaira/contracts/retrieval";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  getRetrievalCitationCommand,
  indexRetrievalChunkCommand,
  searchRetrievalCommand,
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
  app.post("/api/v1/projects/:projectId/retrieval/chunks", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.IndexChunkBody.parse(request.body);
      const chunk = await indexRetrievalChunkCommand(session, params.projectId, body);
      return reply.status(201).send(schemas.ChunkResponse.parse({ chunk }));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/projects/:projectId/retrieval/search", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ProjectParams.parse(request.params);
      const body = schemas.SearchBody.parse(request.body);
      const citations = await searchRetrievalCommand(session, params.projectId, body);
      return reply.send(schemas.SearchResponse.parse({ citations }));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/projects/:projectId/retrieval/citations/:chunkId", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const params = schemas.ChunkParams.parse(request.params);
      const citation = await getRetrievalCitationCommand(
        session,
        params.projectId,
        params.chunkId,
      );
      return reply.send(schemas.CitationResponse.parse({ citation }));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });
}
