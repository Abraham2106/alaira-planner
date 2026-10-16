import { describe, expect, it, vi } from "vitest";
import { schemas } from "@alaira/contracts/poc";
import { createApiClient } from "./http-client.js";

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
});
