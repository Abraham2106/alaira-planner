import type { ActorContext, PocItem } from "@alaira/domain";
import { acceptPocItem, DomainError } from "@alaira/domain";
import { computeAcceptanceCostCents, computeScheduleSnapshot } from "@alaira/engine";

export type AiAuditEntry = {
  phase: string;
  detail: string;
};

export type PolicyGateway = {
  authorizeTool(actor: ActorContext, toolName: string): void;
  executeAcceptPocItem(
    actor: ActorContext,
    item: PocItem,
    idempotencyKey: string,
  ): { item: PocItem; domainEvent: { type: string; itemId: string } };
};

export class DirectDomainWriteForbiddenError extends Error {
  constructor() {
    super("Direct domain persistence from AI is forbidden");
    this.name = "DirectDomainWriteForbiddenError";
  }
}

export function createPocPolicyGateway(deps: {
  executeAccept: (
    actor: ActorContext,
    item: PocItem,
  ) => ReturnType<typeof acceptPocItem>;
}): PolicyGateway {
  return {
    authorizeTool(actor, toolName) {
      if (!actor.roles.includes("member") && !actor.roles.includes("admin")) {
        throw new DomainError("FORBIDDEN", "Tool not authorized");
      }
      if (!toolName.startsWith("poc_")) {
        throw new DomainError("FORBIDDEN", "Unknown tool");
      }
    },
    executeAcceptPocItem(actor, item, _idempotencyKey) {
      return deps.executeAccept(actor, item);
    },
  };
}

/** Proveedor LLM falso determinista (sin red). */
export function fakeLlmInterpret(input: string): { intent: string; tool: string } {
  if (input.includes("IGNORE POLICY")) {
    return { intent: "direct_write", tool: "__direct_write__" };
  }
  if (input.toLowerCase().includes("accept")) {
    return { intent: "accept_poc_item", tool: "poc_propose_accept" };
  }
  return { intent: "unknown", tool: "none" };
}

export type AiRuntimeResult =
  | { ok: true; schedule: ReturnType<typeof computeScheduleSnapshot>; costCents: number }
  | { ok: false; reason: string; audit: AiAuditEntry[] };

/** Observe → Retrieve → Interpret → Plan → Policy → Execute (ADR-0005 POC). */
export function runPocAiRuntime(input: {
  observation: string;
  actor: ActorContext;
  item: PocItem;
  idempotencyKey: string;
  gateway: PolicyGateway;
  directWrite?: { savePocItem(item: PocItem): Promise<void> };
}): AiRuntimeResult {
  const audit: AiAuditEntry[] = [];
  audit.push({ phase: "observe", detail: input.observation.slice(0, 64) });
  audit.push({ phase: "retrieve", detail: `item:${input.item.id}` });

  const interpreted = fakeLlmInterpret(input.observation);
  audit.push({ phase: "interpret", detail: interpreted.intent });

  if (interpreted.tool === "__direct_write__" && input.directWrite) {
    audit.push({ phase: "plan", detail: "blocked direct write" });
    return { ok: false, reason: "direct_write_rejected", audit };
  }

  if (interpreted.tool !== "poc_propose_accept") {
    return { ok: false, reason: "no_action", audit };
  }

  audit.push({ phase: "plan", detail: interpreted.tool });

  try {
    input.gateway.authorizeTool(input.actor, interpreted.tool);
  } catch (e) {
    audit.push({ phase: "policy", detail: e instanceof Error ? e.message : "denied" });
    return { ok: false, reason: "policy_denied", audit };
  }

  audit.push({ phase: "policy", detail: "allowed" });

  const schedule = computeScheduleSnapshot("2026-06-01T00:00:00.000Z", 14);
  const costCents = computeAcceptanceCostCents(1000);

  input.gateway.executeAcceptPocItem(input.actor, input.item, input.idempotencyKey);
  audit.push({ phase: "execute", detail: "accept via typed tool" });

  return { ok: true, schedule, costCents };
}
