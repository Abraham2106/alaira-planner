export const PLANNING_MODES = ["predictive", "scrum", "kanban", "hybrid"] as const;
export type PlanningMode = (typeof PLANNING_MODES)[number];

export const EXECUTION_MODES = ["predictive", "scrum", "kanban"] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const FINANCIAL_CONTROL_LEVELS = ["none", "basic", "full"] as const;
export type FinancialControlLevel = (typeof FINANCIAL_CONTROL_LEVELS)[number];

export type DeliveryProfile = {
  planningMode: PlanningMode;
  scheduleEngine: boolean;
  agileExecution: boolean;
  financialControl: FinancialControlLevel;
  resourcePlanning: boolean;
  baselineRequired: boolean;
};

export const WORK_NODE_TYPES = ["project_root", "branch"] as const;
export type WorkNodeType = (typeof WORK_NODE_TYPES)[number];

export const CUSTOM_FIELD_TYPES = ["text", "number", "boolean", "date"] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export type WorkNodeOwnership = {
  responsibleUserId: string | null;
  approverUserId: string | null;
};
