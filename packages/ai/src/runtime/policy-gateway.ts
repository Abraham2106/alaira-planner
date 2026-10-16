import type { ActorContext } from "@alaira/domain";
import {
  getToolDefinition,
  type AutonomyLevel,
  type PolicyDecisionDto,
  type TypedToolName,
} from "@alaira/contracts/ai";
import { PolicyGateError } from "./errors.js";

export type PolicyGatewayInput = {
  actor: ActorContext;
  tool: TypedToolName;
  approverUserId?: string;
};

function actorMayUseTools(actor: ActorContext): boolean {
  return actor.roles.includes("member") || actor.roles.includes("admin");
}

function actorHasElevation(actor: ActorContext): boolean {
  return actor.roles.includes("admin") || actor.roles.includes("pm_lead");
}

export function evaluatePolicy(input: PolicyGatewayInput): PolicyDecisionDto {
  const { actor, tool, approverUserId } = input;

  if (tool === "__direct_write__") {
    return {
      outcome: "deny",
      code: "direct_write_forbidden",
      detail: "Prompt-to-mutation direct writes are forbidden (ADR-0005).",
    };
  }

  const def = getToolDefinition(tool);
  if (!def) {
    return {
      outcome: "deny",
      code: "unknown_tool",
      detail: `Tool ${tool} is not registered.`,
    };
  }

  if (!actorMayUseTools(actor)) {
    return {
      outcome: "deny",
      code: "forbidden_actor",
      detail: "Actor lacks delegated identity to invoke AI tools.",
    };
  }

  if (def.requiresElevation && !actorHasElevation(actor)) {
    return {
      outcome: "deny",
      code: "elevation_required",
      detail: `${tool} requires an elevated role.`,
    };
  }

  if (def.autonomyLevel === "controlado" && !approverUserId) {
    return {
      outcome: "deny",
      code: "controlado_requires_approver",
      detail: `${tool} requires a human approver before execution.`,
    };
  }

  if (def.autonomyLevel === "informar" && !def.mutatesDomain) {
    return { outcome: "allow_execute", tool };
  }

  if (def.autonomyLevel === "informar" && def.mutatesDomain) {
    return { outcome: "allow_execute", tool };
  }

  if (def.autonomyLevel === "proponer" || def.autonomyLevel === "controlado") {
    return {
      outcome: "require_proposal",
      tool,
      autonomyLevel: def.autonomyLevel as AutonomyLevel,
    };
  }

  return {
    outcome: "deny",
    code: "policy_gate",
    detail: "Policy evaluation failed closed.",
  };
}

export function assertPolicyAllowsExecute(decision: PolicyDecisionDto): void {
  if (decision.outcome !== "allow_execute") {
    throw new PolicyGateError(
      decision.outcome === "deny" ? decision.code : "policy_gate",
      decision.outcome === "deny" ? decision.detail : "Execution not authorized",
    );
  }
}
