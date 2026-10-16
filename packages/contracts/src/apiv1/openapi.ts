/** Paths that must appear in the published OpenAPI (TC-API-02 partial). */
export const OPENAPI_DOCUMENT_PATHS = [
  "/api/v1/openapi.json",
  "/api/v1/search/projects",
  "/api/v1/projects",
  "/api/v1/projects/{projectId}",
  "/api/v1/projects/{projectId}/event-log",
  "/api/v1/projects/{projectId}/event-log/entries",
  "/api/v1/port/sample/projects.csv",
] as const;

export function buildOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: "3.1.0",
    info: {
      title: "Alaira Planner API",
      version: "1.0.0",
      description:
        "Versioned HTTP API (M1). Session cookie + CSRF on writes. Tenant scope derived from session.",
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "meta", description: "Contract discovery" },
      { name: "search", description: "Paginated, tenant-scoped search" },
      { name: "project", description: "Project graph (TASK-0110)" },
      { name: "eventlog", description: "Project event log (TASK-0109)" },
      { name: "port", description: "Sample CSV import/export (REQ-010)" },
    ],
    paths: {
      "/api/v1/openapi.json": {
        get: {
          tags: ["meta"],
          summary: "OpenAPI document",
          responses: { "200": { description: "OpenAPI 3.1 JSON" } },
        },
      },
      "/api/v1/search/projects": {
        get: {
          tags: ["search"],
          summary: "Search projects (paginated)",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
            { name: "q", in: "query", schema: { type: "string" } },
            {
              name: "planningMode",
              in: "query",
              schema: {
                type: "string",
                enum: ["predictive", "scrum", "kanban", "hybrid"],
              },
            },
          ],
          responses: {
            "200": { description: "Paginated project summaries" },
            "403": { description: "Missing or invalid session" },
          },
        },
      },
      "/api/v1/search/projects/{projectId}/event-log": {
        get: {
          tags: ["search"],
          summary: "Search project event log entries (paginated)",
          parameters: [
            { name: "projectId", in: "path", required: true, schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
            { name: "eventType", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Paginated audit entries" },
            "404": { description: "Project not visible in tenant" },
          },
        },
      },
      "/api/v1/projects": {
        post: {
          tags: ["project"],
          summary: "Create project",
          responses: { "201": { description: "Created" } },
        },
      },
      "/api/v1/projects/{projectId}": {
        get: {
          tags: ["project"],
          summary: "Get project",
          parameters: [
            { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Project" },
            "404": { description: "Not found" },
          },
        },
      },
      "/api/v1/projects/{projectId}/event-log": {
        get: {
          tags: ["eventlog"],
          summary: "List event log (full list, TASK-0109)",
          parameters: [
            { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "200": { description: "Entries" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/projects/{projectId}/event-log/entries": {
        post: {
          tags: ["eventlog"],
          summary: "Append event log entry",
          parameters: [
            { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { "201": { description: "Appended" }, "404": { description: "Not found" } },
        },
      },
      "/api/v1/port/sample/projects.csv": {
        get: {
          tags: ["port"],
          summary: "Export projects sample CSV (REQ-010)",
          responses: {
            "200": {
              description: "text/csv",
              content: { "text/csv": { schema: { type: "string" } } },
            },
          },
        },
        post: {
          tags: ["port"],
          summary: "Import projects from sample CSV",
          description: "Requires session and x-alaira-csrf. Rejects batches over row limit.",
          responses: {
            "200": { description: "Import report" },
            "400": { description: "Validation or row limit" },
            "403": { description: "CSRF or session" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "alaira_session",
        },
        csrfHeader: {
          type: "apiKey",
          in: "header",
          name: "x-alaira-csrf",
        },
      },
    },
    security: [{ sessionCookie: [] }],
  };
}
