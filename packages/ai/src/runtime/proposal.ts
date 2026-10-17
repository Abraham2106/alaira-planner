import type { AiProposalDto, AutonomyLevel, TypedToolName } from "@alaira/contracts/ai";
import type { ActorContext } from "@alaira/domain";

export function buildAiProposal(input: {
  id: string;
  actor: ActorContext;
  tool: Exclude<TypedToolName, "__direct_write__">;
  autonomyLevel: AutonomyLevel;
  targetNodeId: string;
  priorState: Record<string, unknown>;
  proposedState: Record<string, unknown>;
  citedEvidenceIds: readonly string[];
  rationale: string;
  modelRef: string;
  limitedAvailability?: boolean;
}): AiProposalDto {
  return {
    id: input.id,
    tenantId: input.actor.tenantId,
    autonomyLevel: input.autonomyLevel,
    typedCommand: input.tool,
    targetNodeId: input.targetNodeId,
    priorState: input.priorState,
    proposedState: input.proposedState,
    citedEvidenceIds: [...input.citedEvidenceIds],
    resolution: input.autonomyLevel === "informar" ? "applied" : "pending",
    rationale: input.rationale,
    modelRef: input.modelRef,
    ...(input.limitedAvailability === undefined
      ? {}
      : { limitedAvailability: input.limitedAvailability }),
  };
}
