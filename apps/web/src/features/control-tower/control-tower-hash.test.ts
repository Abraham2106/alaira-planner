import { describe, expect, it } from "vitest";
import {
  isGlobalAskRoute,
  isMyWorkRoute,
  isProjectControlRoute,
  viewFromHash,
} from "./use-control-tower-hash.js";

describe("control-tower hash routes", () => {
  it("detects my-work and project control", () => {
    expect(isMyWorkRoute("#/my-work")).toBe(true);
    expect(isProjectControlRoute("#/projects/control")).toBe(true);
    expect(viewFromHash("#/my-work")).toBe("my-work");
    expect(viewFromHash("#/projects/control")).toBe("project-control");
  });

  it("exposes global ask on home and projects overview only", () => {
    expect(isGlobalAskRoute("#/")).toBe(true);
    expect(isGlobalAskRoute("#/projects")).toBe(true);
    expect(isGlobalAskRoute("#/projects/wbs")).toBe(false);
    expect(isGlobalAskRoute("#/projects/gantt")).toBe(false);
    expect(viewFromHash("#/")).toBe("global-ask");
  });
});
