import { describe, expect, it } from "vitest";
import { buildOpenApiDocument, OPENAPI_DOCUMENT_PATHS } from "./openapi.js";
import { schemas } from "./index.js";

describe("apiv1 OpenAPI (TC-API-02 partial)", () => {
  it("parses as contract and includes project + event log paths", () => {
    const doc = buildOpenApiDocument();
    const parsed = schemas.OpenApiDocument.parse({
      openapi: doc.openapi,
      info: doc.info,
      paths: doc.paths,
    });
    expect(parsed.info.title).toBe("Alaira Planner API");
    const paths = Object.keys(doc.paths as Record<string, unknown>);
    for (const required of OPENAPI_DOCUMENT_PATHS) {
      expect(paths).toContain(required);
    }
    expect(paths.some((p) => p.includes("event-log"))).toBe(true);
    expect(paths.some((p) => p.includes("projects"))).toBe(true);
  });
});
