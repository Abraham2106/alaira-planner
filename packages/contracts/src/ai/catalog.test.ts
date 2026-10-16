import { describe, expect, it } from "vitest";
import { TOOL_CATALOG, getToolDefinition } from "./catalog.js";

describe("ai tool catalog", () => {
  it("registers ADR-0005 tools with elevation flags", () => {
    expect(TOOL_CATALOG.size).toBeGreaterThanOrEqual(12);
    const baseline = getToolDefinition("modify_baseline");
    expect(baseline?.autonomyLevel).toBe("controlado");
    expect(baseline?.requiresElevation).toBe(true);
    const read = getToolDefinition("get_project");
    expect(read?.mutatesDomain).toBe(false);
  });
});
