export const WBS_NODE_TYPES = [
  "work_package",
  "deliverable",
  "milestone",
] as const;
export type WbsNodeType = (typeof WBS_NODE_TYPES)[number];

export const PACKAGE_STATUSES = ["draft", "active", "complete"] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export const PROJECTION_LINK_KINDS = ["backlog_projection", "goal"] as const;
export type ProjectionLinkKind = (typeof PROJECTION_LINK_KINDS)[number];

export type AcceptanceCriterionItem = {
  key: string;
  text: string;
  required: boolean;
};

export type AcceptanceCriterionSet = {
  version: number;
  criteria: AcceptanceCriterionItem[];
};
