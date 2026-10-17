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

/** Discloses which model produced the outcome. The deterministic stub is not a production model. */
export type ModelDisclosure = {
  modelRef: string;
  limitedAvailability: boolean;
};

export type AiRuntimeSuccess =
  | ({
      ok: true;
      kind: "executed";
      tool: Exclude<TypedToolName, "__direct_write__">;
      result: unknown;
      audit: RuntimeAuditEntry[];
    } & ModelDisclosure)
  | ({
      ok: true;
      kind: "proposal";
      proposal: AiProposalDto;
      audit: RuntimeAuditEntry[];
    } & ModelDisclosure);

export type AiRuntimeFailure = {
  ok: false;
  reason: string;
  audit: RuntimeAuditEntry[];
} & ModelDisclosure;

export type AiRuntimeResult = AiRuntimeSuccess | AiRuntimeFailure;
