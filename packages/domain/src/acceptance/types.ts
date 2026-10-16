export const EXECUTION_STATUSES = ["in_progress", "execution_complete"] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const COMPLETION_REQUEST_STATUSES = ["none", "pending", "withdrawn"] as const;
export type CompletionRequestStatus = (typeof COMPLETION_REQUEST_STATUSES)[number];

export const ACCEPTANCE_STATUSES = ["not_accepted", "accepted", "rejected"] as const;
export type AcceptanceStatus = (typeof ACCEPTANCE_STATUSES)[number];

export const PROGRESS_STRATEGY_KINDS = [
  "manual",
  "deliverable_acceptance",
  "weighted_checklist",
  "external_evidence",
] as const;
export type ProgressStrategyKind = (typeof PROGRESS_STRATEGY_KINDS)[number];

export const ACCEPTANCE_DECISION_TYPES = [
  "completion_request",
  "accept",
  "reject",
  "revert_acceptance",
] as const;
export type AcceptanceDecisionType = (typeof ACCEPTANCE_DECISION_TYPES)[number];

export type LifecycleState = {
  executionStatus: ExecutionStatus;
  completionRequestStatus: CompletionRequestStatus;
  acceptanceStatus: AcceptanceStatus;
};

export type CriterionEvaluation = {
  key: string;
  satisfied: boolean;
};

export type WeightedChecklistConfig = {
  items: { key: string; weight: number }[];
};

export type RollupLeafInput = {
  workNodeId: string;
  weight: number;
  progressPercent: number;
};
