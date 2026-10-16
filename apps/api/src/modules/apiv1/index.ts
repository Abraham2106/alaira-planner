import type { FastifyInstance } from "fastify";
import { DomainError } from "@alaira/domain";
import { ZodError } from "zod";
import {
  buildOpenApiDocument,
  schemas,
} from "@alaira/contracts/apiv1";
import { assertWriteCsrf, resolveIamSession } from "../iam/session.js";
import {
  exportProjectsSampleCsvCommand,
  importProjectsSampleCsvCommand,
  searchEventLogCommand,
  searchProjectsCommand,
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
    if (error.code === "VALIDATION") {
      try {
        const payload = JSON.parse(error.message) as { errors?: unknown };
        return { status: 400, body: { error: "validation_error", ...payload } };
      } catch {
        return { status: 400, body: { error: "validation_error", message: error.message } };
      }
    }
    return { status: 400, body: { error: error.message } };
  }
  return { status: 500, body: { error: "internal_error" } };
}

export async function register(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/openapi.json", async (_request, reply) => {
    const doc = buildOpenApiDocument();
    schemas.OpenApiDocument.parse({
      openapi: doc.openapi,
      info: doc.info,
      paths: doc.paths,
    });
    return reply.send(doc);
  });

  app.get("/api/v1/search/projects", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const query = schemas.SearchProjectsQuery.parse(request.query);
      const result = await searchProjectsCommand(session, query);
      return reply.send(schemas.SearchProjectsResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/search/projects/:projectId/event-log", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const { projectId } = request.params as { projectId: string };
      const query = schemas.SearchEventLogQuery.parse(request.query);
      const result = await searchEventLogCommand(session, projectId, query);
      return reply.send(schemas.SearchEventLogResponse.parse(result));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.get("/api/v1/port/sample/projects.csv", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      const csv = await exportProjectsSampleCsvCommand(session);
      return reply
        .header("content-type", "text/csv; charset=utf-8")
        .header("content-disposition", 'attachment; filename="projects-sample.csv"')
        .send(csv);
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.post("/api/v1/port/sample/projects.csv", async (request, reply) => {
    try {
      const session = await resolveIamSession(request);
      assertWriteCsrf(request, session);
      const body =
        typeof request.body === "string"
          ? request.body
          : request.body instanceof Buffer
            ? request.body.toString("utf8")
            : String(request.body ?? "");
      const report = await importProjectsSampleCsvCommand(session, body);
      return reply.send(schemas.CsvImportReport.parse(report));
    } catch (e) {
      const mapped = mapError(e);
      return reply.status(mapped.status).send(mapped.body);
    }
  });

  app.addContentTypeParser(
    "text/csv",
    { parseAs: "string" },
    (_req, body, done) => {
      done(null, body);
    },
  );
}
