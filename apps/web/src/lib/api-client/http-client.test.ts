import { afterEach, describe, expect, it, vi } from "vitest";
import { schemas } from "@alaira/contracts/poc";
import { z } from "zod";
import { CSRF_SESSION_KEY } from "./csrf.js";
import { createApiClient } from "./http-client.js";

const ack = z.object({ ok: z.boolean() });

afterEach(() => {
  sessionStorage.clear();
  document.cookie = "alaira_csrf=; Max-Age=0; path=/";
});

describe("createApiClient", () => {
  it("GETs /api/v1 paths and validates responses with contract schemas", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "018f0000-0000-7000-8000-000000000001",
          title: "Demo",
          status: "draft",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const client = createApiClient({ fetchFn });
    const item = await client.get(
      "poc/items/018f0000-0000-7000-8000-000000000001",
      schemas.PocItemResponse,
    );
    expect(item).toMatchObject({ title: "Demo", status: "draft" });
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/v1/poc/items/018f0000-0000-7000-8000-000000000001",
      expect.objectContaining({ method: "GET", credentials: "same-origin" }),
    );
  });

  it("sends x-alaira-csrf from sessionStorage on POST and omits it on GET", async () => {
    sessionStorage.setItem(CSRF_SESSION_KEY, "token-from-login");
    const fetchFn = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const client = createApiClient({ fetchFn });
    await client.post("projects", ack, { name: "Norte" });
    await client.get("projects/prj_1", ack);

    const postInit = fetchFn.mock.calls[0]?.[1];
    const getInit = fetchFn.mock.calls[1]?.[1];
    if (!postInit || !getInit) {
      throw new Error("fetch was not called with RequestInit");
    }
    expect(postInit.method).toBe("POST");
    expect(postInit.credentials).toBe("same-origin");
    expect(postInit.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-alaira-csrf": "token-from-login",
    });
    expect(getInit.method).toBe("GET");
    expect(getInit.headers).toBeUndefined();
  });

  it("falls back to the readable csrf cookie when sessionStorage is empty", async () => {
    document.cookie = "alaira_csrf=cookie-token";
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await createApiClient({ fetchFn }).patch("projects/prj_1", ack, { title: "Rama" });
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("PATCH");
    expect(init.headers).toMatchObject({ "x-alaira-csrf": "cookie-token" });
  });
});
