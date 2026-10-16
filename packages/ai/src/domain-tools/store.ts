import type { ToolExecutionContext } from "../tools/registry.js";

export type WorkItemSnapshot = {
  workItemId: string;
  nodeType: string;
  title: string;
  progressPercent: number;
};

export type AcceptanceCriteriaSnapshot = {
  criteria: readonly { key: string; required: boolean; label: string }[];
  satisfiedKeys: ReadonlySet<string>;
};

export type DomainToolStore = {
  getProject(ctx: ToolExecutionContext): Promise<Record<string, unknown>>;
  findWorkItem(ctx: ToolExecutionContext, workItemId: string): Promise<WorkItemSnapshot | null>;
  getAcceptanceCriteria(ctx: ToolExecutionContext): Promise<AcceptanceCriteriaSnapshot>;
  recordEvidenceLink(
    ctx: ToolExecutionContext,
    evidenceId: string,
  ): Promise<{ evidenceId: string; workItemId: string; linked: true }>;
};
