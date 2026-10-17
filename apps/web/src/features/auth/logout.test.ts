import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_PROJECT_STORAGE_KEY } from "../../lib/session/active-project.js";
import { CSRF_SESSION_KEY, logoutRequest } from "./api.js";

afterEach(() => {
  sessionStorage.clear();
  document.cookie = "alaira_csrf=; Max-Age=0; path=/";
  window.location.hash = "#/";
  vi.unstubAllGlobals();
});

describe("logoutRequest", () => {
  it("sends the stored csrf, clears it, and returns to #/entrar", async () => {
    sessionStorage.setItem(CSRF_SESSION_KEY, "token-from-login");
    sessionStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "prj_1");
    window.location.hash = "#/projects";
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchFn);

    await logoutRequest();

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/v1/iam/auth/logout",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({ "x-alaira-csrf": "token-from-login" }),
      }),
    );
    expect(sessionStorage.getItem(CSRF_SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBeNull();
    expect(window.location.hash).toBe("#/entrar");
  });

  it("sends the csrf cookie when sessionStorage is empty", async () => {
    document.cookie = "alaira_csrf=cookie-token";
    window.location.hash = "#/projects";
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchFn);

    await logoutRequest();

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/v1/iam/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-alaira-csrf": "cookie-token" }),
      }),
    );
    expect(window.location.hash).toBe("#/entrar");
  });

  it("keeps the token and stays put when the logout POST fails", async () => {
    sessionStorage.setItem(CSRF_SESSION_KEY, "token-from-login");
    sessionStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "prj_1");
    window.location.hash = "#/projects";
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "No se pudo revocar." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchFn);

    await expect(logoutRequest()).rejects.toThrow("No se pudo revocar.");

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/v1/iam/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-alaira-csrf": "token-from-login" }),
      }),
    );
    expect(sessionStorage.getItem(CSRF_SESSION_KEY)).toBe("token-from-login");
    expect(sessionStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBe("prj_1");
    expect(window.location.hash).toBe("#/projects");
  });
});
