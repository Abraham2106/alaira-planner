import { describe, expect, it } from "vitest";
import { formatInstantForDisplay } from "./format.js";

describe("formatInstantForDisplay", () => {
  it("keeps ISO UTC alongside localized wall time", () => {
    const instant = new Date("2026-01-15T18:30:00.000Z");
    const parts = formatInstantForDisplay(instant, "America/Costa_Rica", "es-CR");
    expect(parts.isoUtc).toBe("2026-01-15T18:30:00.000Z");
    expect(parts.timeZoneId).toBe("America/Costa_Rica");
    expect(parts.localLabel).toMatch(/2026/);
  });
});
