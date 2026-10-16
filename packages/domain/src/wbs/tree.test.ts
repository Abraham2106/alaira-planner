import { describe, expect, it } from "vitest";
import {
  assertNoHierarchyCycle,
  assertValidWbsCode,
  wouldCreateCycle,
} from "./tree.js";

describe("WBS tree (TC-WBS-01)", () => {
  it("accepts valid dotted WBS codes", () => {
    expect(assertValidWbsCode("1")).toBe("1");
    expect(assertValidWbsCode("1.2.3")).toBe("1.2.3");
  });

  it("rejects invalid WBS codes", () => {
    expect(() => assertValidWbsCode("1.a")).toThrow(/Invalid WBS code/);
  });

  it("detects cycle when reparenting under a descendant", () => {
    const edges = [
      { parentId: "root", childId: "a" },
      { parentId: "a", childId: "b" },
    ];
    expect(wouldCreateCycle(edges, "b", "a")).toBe(true);
    expect(() => assertNoHierarchyCycle(edges, "b", "a")).toThrow(/cycle/);
  });

  it("allows sibling reparent", () => {
    const edges = [
      { parentId: "root", childId: "a" },
      { parentId: "root", childId: "b" },
    ];
    expect(wouldCreateCycle(edges, "a", "b")).toBe(false);
  });
});
