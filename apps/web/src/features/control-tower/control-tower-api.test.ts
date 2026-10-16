import { describe, expect, it, vi } from "vitest";
import { createControlTowerApi } from "./api.js";

describe("createControlTowerApi", () => {
  it("GET event-log uses canonical search path", async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({
        projectId: "prj_018f00000000700080000000000001",
        items: [],
        page: 1,
        pageSize: 25,
        total: 0,
        totalPages: 0,
      }),
    );
    const api = createControlTowerApi({ fetchFn, baseUrl: "http://test" });
    await api.searchEventLog("prj_018f00000000700080000000000001");
    expect(fetchFn).toHaveBeenCalledWith(
      "http://test/api/v1/search/projects/prj_018f00000000700080000000000001/event-log?page=1&pageSize=25",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
