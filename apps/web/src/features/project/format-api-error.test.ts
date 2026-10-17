import { afterEach, describe, expect, it } from "vitest";
import { CSRF_SESSION_KEY } from "../../lib/api-client/csrf.js";
import { ApiClientError } from "../../lib/api-client/errors.js";
import { formatApiError } from "./format-api-error.js";

afterEach(() => {
  sessionStorage.clear();
  document.cookie = "alaira_csrf=; Max-Age=0; path=/";
});

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
    expect(formatApiError(new ApiClientError(403, { error: "denied for tenant B" }))).not.toMatch(
      /tenant B/i,
    );
  });

  it("shows a missing session instead of a successful empty list", () => {
    expect(formatApiError(new ApiClientError(403, { error: "forbidden" }))).toMatch(/no hay sesión/i);
    expect(formatApiError(new ApiClientError(403, { error: "Missing session" }))).toMatch(
      /no hay sesión/i,
    );
  });

  it("shows an expired session when the body says so", () => {
    sessionStorage.setItem(CSRF_SESSION_KEY, "token-from-login");
    expect(formatApiError(new ApiClientError(403, { error: "Invalid session" }))).toMatch(/caduc/i);
  });

  it("shows a permission denial when a session credential exists", () => {
    sessionStorage.setItem(CSRF_SESSION_KEY, "token-from-login");
    expect(formatApiError(new ApiClientError(403, { error: "forbidden" }))).toMatch(/permiso/i);
  });
});
