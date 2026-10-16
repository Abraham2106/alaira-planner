import type { ProgressEvidenceInput } from "@alaira/ai/agents/progress";
import type { ActorContext } from "@alaira/domain";

export type AiProgressJobRequest = {
  tenantId: string;
  projectId: string;
  targetNodeId: string;
  actor: ActorContext;
  evidence: ProgressEvidenceInput[];
};
