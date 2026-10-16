import type { OpenAiCompatibleProvider } from "../providers/openai-compatible.js";
import { extractFirstToolCall } from "../providers/openai-compatible.js";
import { interpretObservation } from "../providers/fake-deterministic.js";
import type { DomainToolStore } from "../domain-tools/store.js";
import { executeTypedTool } from "../tools/registry.js";
import { evaluatePolicy } from "./policy-gateway.js";
import { buildAiProposal } from "./proposal.js";
import type { AiRuntimeInput, AiRuntimeResult, RuntimeAuditEntry } from "./types.js";

const MODEL_REF = "fake-deterministic/v1";

function pushAudit(
  audit: RuntimeAuditEntry[],
  phase: RuntimeAuditEntry["phase"],
  detail: string,
): void {
  audit.push({ phase, detail: detail.slice(0, 500) });
}

export type RunAiRuntimeOptions = {
  provider?: OpenAiCompatibleProvider;
  proposalIdFactory?: () => string;
  domainStore?: DomainToolStore;
};

/** Observe → Retrieve → Interpret → Plan → Policy → Execute + verify (ADR-0005). */
export async function runAiRuntime(
  input: AiRuntimeInput,
  options: RunAiRuntimeOptions = {},
): Promise<AiRuntimeResult> {
  const audit: RuntimeAuditEntry[] = [];
  const targetNodeId =
    input.targetNodeId ?? "018f0000-0000-7000-8000-0000000000aa";
  const citedEvidenceIds = input.citedEvidenceIds ?? [];

  pushAudit(audit, "observe", input.observation.slice(0, 120));
  pushAudit(
    audit,
    "retrieve",
    `tenant:${input.actor.tenantId};project:${input.projectId};node:${targetNodeId}`,
  );

  let plannedTool: ReturnType<typeof interpretObservation>;
  if (options.provider) {
    const completion = await options.provider.createChatCompletion({
      model: MODEL_REF,
      messages: [
        {
          role: "system",
          content:
            "You are Alaira AI runtime. Only emit typed tool calls; never mutate domain directly.",
        },
        { role: "user", content: input.observation },
      ],
    });
    const toolCall = extractFirstToolCall(completion);
    if (!toolCall) {
      plannedTool = interpretObservation(input.observation);
    } else {
      plannedTool = {
        intent: toolCall.name,
        tool: toolCall.name,
        arguments: toolCall.arguments,
      };
    }
  } else {
    plannedTool = interpretObservation(input.observation);
  }

  pushAudit(audit, "interpret", plannedTool.intent);
  pushAudit(audit, "plan", `${plannedTool.tool}:${JSON.stringify(plannedTool.arguments)}`);

  const decision = evaluatePolicy({
    actor: input.actor,
    tool: plannedTool.tool,
    approverUserId: input.approverUserId,
  });

  if (decision.outcome === "deny") {
    pushAudit(audit, "policy", decision.detail);
    return {
      ok: false,
      reason: decision.code,
      audit,
    };
  }

  if (decision.outcome === "require_proposal") {
    pushAudit(audit, "policy", `proposal_required:${decision.autonomyLevel}`);
    const preview = await executeTypedTool(
      decision.tool,
      {
        actor: input.actor,
        projectId: input.projectId,
        targetNodeId,
      },
      plannedTool.arguments,
      options.domainStore,
    );

    const proposal = buildAiProposal({
      id: options.proposalIdFactory?.() ?? crypto.randomUUID(),
      actor: input.actor,
      tool: decision.tool,
      autonomyLevel: decision.autonomyLevel,
      targetNodeId,
      priorState:
        typeof preview.priorPercentComplete === "number"
          ? { percentComplete: preview.priorPercentComplete }
          : {},
      proposedState:
        typeof preview.proposedPercentComplete === "number"
          ? { percentComplete: preview.proposedPercentComplete }
          : { preview },
      citedEvidenceIds,
      rationale: input.observation.slice(0, 500),
      modelRef: MODEL_REF,
    });

    pushAudit(audit, "verify", `proposal:${proposal.id}:${proposal.resolution}`);
    return { ok: true, kind: "proposal", proposal, audit };
  }

  pushAudit(audit, "policy", "allow_execute");
  const result = await executeTypedTool(
    decision.tool,
    {
      actor: input.actor,
      projectId: input.projectId,
      targetNodeId,
    },
    plannedTool.arguments,
    options.domainStore,
  );

  pushAudit(audit, "execute", decision.tool);
  pushAudit(audit, "verify", "state_verified_stub");

  return {
    ok: true,
    kind: "executed",
    tool: decision.tool,
    result,
    audit,
  };
}
