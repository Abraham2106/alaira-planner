import { afterEach, describe, expect, it, vi } from "vitest";
import { CSRF_HEADER_NAME } from "./csrf.js";
import { createWbsApi } from "./api.js";

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "alaira_csrf=; Max-Age=0; path=/";
});

describe("createWbsApi CSRF", () => {
  it("sends x-alaira-csrf on PATCH reparent when session cookie is present", async () => {
    document.cookie = "alaira_csrf=synth-csrf-token-0123456789ab";
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          workNodeId: "wkn_018f00000000700080000000000001",
          parentWorkNodeId: "wkn_018f00000000700080000000000002",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchFn);

    await createWbsApi().reparentNode(
      "prj_018f00000000700080000000000001",
      "wkn_018f00000000700080000000000003",
      "wkn_018f00000000700080000000000002",
    );

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/projects/prj_018f00000000700080000000000001/wbs/nodes/"),
      expect.objectContaining({
        method: "PATCH",
        credentials: "same-origin",
        headers: expect.objectContaining({
          [CSRF_HEADER_NAME]: "synth-csrf-token-0123456789ab",
        }),
      }),
    );
  });
});
