import { describe, expect, it } from "vitest";
import { ApiClientError } from "../../lib/api-client/errors.js";
import { formatApiError } from "./format-api-error.js";

describe("formatApiError", () => {
  it("maps 404 to tenant-safe copy without raw payload", () => {
    const message = formatApiError(
      new ApiClientError(404, { tenantId: "org_secret", projectId: "prj_other" }),
    );
    expect(message).toMatch(/no encontrado|espacio de trabajo/i);
    expect(message).not.toMatch(/org_secret|prj_other/);
  });

  it("maps 403 without leaking other-tenant hints", () => {
    expect(formatApiError(new ApiClientError(403, { error: "denied for tenant B" }))).toMatch(
      /permiso/i,
    );
  });
});
