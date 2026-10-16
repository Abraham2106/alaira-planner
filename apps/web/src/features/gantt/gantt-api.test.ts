import { afterEach, describe, expect, it, vi } from "vitest";
import { createGanttApi } from "./api.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createGanttApi", () => {
  it("GET variance uses canonical baseline path (read-only)", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          projectId: "prj_018f00000000700080000000000001",
          baselineVersion: 1,
          forecastVersion: 1,
          tasks: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    await createGanttApi({ fetchFn }).getBaselineVariance(
      "prj_018f00000000700080000000000001",
    );

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/v1/projects/prj_018f00000000700080000000000001/baseline/variance",
      ),
      expect.objectContaining({ method: "GET", credentials: "same-origin" }),
    );
  });
});
