import type {
  AiProposalDto,
  RuntimeAuditEntryDto,
  TypedToolName,
} from "@alaira/contracts/ai";
import type { ActorContext } from "@alaira/domain";

export type RuntimeAuditEntry = RuntimeAuditEntryDto;

export type PlannedToolCall = {
  name: TypedToolName;
  arguments: Record<string, unknown>;
};

export type AiRuntimeInput = {
  observation: string;
  actor: ActorContext;
  idempotencyKey: string;
  projectId: string;
  targetNodeId?: string;
  citedEvidenceIds?: readonly string[];
  /** Simulated human approver for controlado tools (TASK-0124 persists approvals). */
  approverUserId?: string;
};

export type AiRuntimeSuccess =
  | {
      ok: true;
      kind: "executed";
      tool: Exclude<TypedToolName, "__direct_write__">;
      result: unknown;
      audit: RuntimeAuditEntry[];
    }
  | {
      ok: true;
      kind: "proposal";
      proposal: AiProposalDto;
      audit: RuntimeAuditEntry[];
    };

export type AiRuntimeFailure = {
  ok: false;
  reason: string;
  audit: RuntimeAuditEntry[];
};

export type AiRuntimeResult = AiRuntimeSuccess | AiRuntimeFailure;
