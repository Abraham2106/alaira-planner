import { DomainError } from "../index.js";
import type { LifecycleState } from "./types.js";

export function initialLifecycleState(): LifecycleState {
  return {
    executionStatus: "in_progress",
    completionRequestStatus: "none",
    acceptanceStatus: "not_accepted",
  };
}

export function applyCompletionRequest(state: LifecycleState): LifecycleState {
  if (state.acceptanceStatus === "accepted") {
    throw new DomainError("CONFLICT", "Deliverable already accepted");
  }
  if (state.completionRequestStatus === "pending") {
    throw new DomainError("CONFLICT", "Completion request already pending");
  }
  return { ...state, completionRequestStatus: "pending" };
}

export function applyAcceptanceDecision(state: LifecycleState): LifecycleState {
  if (state.acceptanceStatus === "accepted") {
    throw new DomainError("CONFLICT", "Deliverable already accepted");
  }
  return {
    executionStatus: "execution_complete",
    completionRequestStatus: "none",
    acceptanceStatus: "accepted",
  };
}

export function applyRejectionDecision(state: LifecycleState, _reason: string): LifecycleState {
  if (state.acceptanceStatus === "accepted") {
    throw new DomainError("CONFLICT", "Cannot reject an accepted deliverable");
  }
  return { ...state, completionRequestStatus: "none", acceptanceStatus: "rejected" };
}

export function applyRevertAcceptance(state: LifecycleState, reason: string): LifecycleState {
  if (!reason.trim()) {
    throw new DomainError("VALIDATION", "Revert reason is required");
  }
  if (state.acceptanceStatus !== "accepted") {
    throw new DomainError("CONFLICT", "Nothing to revert");
  }
  return {
    executionStatus: "execution_complete",
    completionRequestStatus: "none",
    acceptanceStatus: "not_accepted",
  };
}
