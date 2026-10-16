import { describe, expect, it } from "vitest";
import { DomainError } from "../index.js";
import {
  applyAcceptanceDecision,
  applyCompletionRequest,
  applyRevertAcceptance,
  initialLifecycleState,
} from "./lifecycle.js";

describe("acceptance lifecycle", () => {
  it("separates completion request from acceptance", () => {
    const next = applyCompletionRequest(initialLifecycleState());
    expect(next.completionRequestStatus).toBe("pending");
    expect(next.acceptanceStatus).toBe("not_accepted");
  });

  it("accept clears pending request", () => {
    const accepted = applyAcceptanceDecision(applyCompletionRequest(initialLifecycleState()));
    expect(accepted.acceptanceStatus).toBe("accepted");
  });

  it("revert requires prior acceptance", () => {
    const accepted = applyAcceptanceDecision(applyCompletionRequest(initialLifecycleState()));
    expect(applyRevertAcceptance(accepted, "ok").acceptanceStatus).toBe("not_accepted");
    expect(() => applyRevertAcceptance(initialLifecycleState(), "nope")).toThrow(DomainError);
  });
});
