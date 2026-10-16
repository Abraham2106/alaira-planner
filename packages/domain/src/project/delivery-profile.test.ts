import { describe, expect, it } from "vitest";
import { DomainError } from "../index.js";
import { resolveEffectiveExecutionMode } from "./delivery-profile.js";
import type { DeliveryProfile } from "./types.js";

const hybrid: DeliveryProfile = {
  planningMode: "hybrid",
  scheduleEngine: true,
  agileExecution: true,
  financialControl: "full",
  resourcePlanning: true,
  baselineRequired: true,
};

describe("resolveEffectiveExecutionMode (TC-HYB-02)", () => {
  it("uses branch override on hybrid project", () => {
    expect(resolveEffectiveExecutionMode(hybrid, "predictive")).toBe("predictive");
    expect(resolveEffectiveExecutionMode(hybrid, "scrum")).toBe("scrum");
  });

  it("inherits non-hybrid project mode when no override", () => {
    const predictive: DeliveryProfile = { ...hybrid, planningMode: "predictive" };
    expect(resolveEffectiveExecutionMode(predictive, null)).toBe("predictive");
  });

  it("requires override for hybrid branches without override", () => {
    expect(() => resolveEffectiveExecutionMode(hybrid, null)).toThrow(DomainError);
  });
});
