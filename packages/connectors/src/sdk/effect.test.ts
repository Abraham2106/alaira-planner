import { describe, expect, it } from "vitest";
import { evidenceEffectForEventType } from "./effect.js";

describe("evidenceEffectForEventType", () => {
  it("allows progress proposals only for lifecycle and intent", () => {
    expect(evidenceEffectForEventType("artifact.lifecycle.changed")).toBe(
      "may_propose_progress",
    );
    expect(evidenceEffectForEventType("user.intent.received")).toBe(
      "may_propose_progress",
    );
    expect(evidenceEffectForEventType("artifact.activity.detected")).toBe(
      "context_only",
    );
  });
});
