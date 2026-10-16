import { describe, expect, it } from "vitest";
import { DomainError } from "../index.js";
import { assertRequiredCriteriaSatisfied } from "./criteria-eval.js";

describe("criteria evaluation", () => {
  it("blocks when required criterion missing", () => {
    expect(() =>
      assertRequiredCriteriaSatisfied(
        { version: 1, criteria: [{ key: "a", text: "A", required: true }] },
        [],
      ),
    ).toThrow(DomainError);
  });
});
