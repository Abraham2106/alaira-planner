import { describe, expect, it } from "vitest";
import { ScheduleError } from "../schedule/errors.js";
import { assertScheduleAcyclic } from "./acyclic.js";

describe("assertScheduleAcyclic", () => {
  it("detects a two-node cycle", () => {
    expect(() =>
      assertScheduleAcyclic(["a", "b"], [
        { id: "1", predecessorId: "a", successorId: "b", type: "FS", lagMinutes: 0 },
        { id: "2", predecessorId: "b", successorId: "a", type: "FS", lagMinutes: 0 },
      ]),
    ).toThrow(ScheduleError);
  });
});
