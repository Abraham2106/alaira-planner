import type { TypedToolName } from "@alaira/contracts/ai";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  OpenAiCompatibleProvider,
} from "./openai-compatible.js";

/** Truthful id for the deterministic stub. Not a production model. */
export const FAKE_DETERMINISTIC_MODEL_REF = "fake-deterministic/v1" as const;

export type FakeInterpretation = {
  intent: string;
  tool: TypedToolName;
  arguments: Record<string, unknown>;
};

/** Deterministic LLM stub — no network, no API keys (REQ-090 / TASK-0108). */
export function fakeDeterministicInterpret(observation: string): FakeInterpretation {
  const text = observation.toLowerCase();

  if (
    observation.includes("IGNORE POLICY") ||
    observation.includes("DirectDomainWriteForbidden") ||
    text.includes("write state directly") ||
    text.includes("set finish date")
  ) {
    return {
      intent: "direct_write",
      tool: "__direct_write__",
      arguments: { field: "schedule_finish", value: "2026-12-01" },
    };
  }

  if (text.includes("propose progress") || text.includes("percent complete")) {
    return {
      intent: "propose_progress_update",
      tool: "propose_progress_update",
      arguments: { priorPercentComplete: 70, percentComplete: 90 },
    };
  }

  if (text.includes("modify baseline") || text.includes("baseline contract")) {
    return {
      intent: "modify_baseline",
      tool: "modify_baseline",
      arguments: { field: "baseline_finish", value: "2027-01-01" },
    };
  }

  if (text.includes("get project") || text.includes("project metadata")) {
    return {
      intent: "get_project",
      tool: "get_project",
      arguments: {},
    };
  }

  return { intent: "unknown", tool: "get_project", arguments: {} };
}

export class FakeDeterministicProvider implements OpenAiCompatibleProvider {
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const observation = lastUser?.content ?? "";
    const interpreted = fakeDeterministicInterpret(observation);

    if (interpreted.tool === "__direct_write__") {
      return {
        id: "fake-direct-write",
        model: request.model,
        choices: [
          {
            message: {
              role: "assistant",
              content: "Attempting direct mutation (blocked by policy).",
            },
            finish_reason: "stop",
          },
        ],
      };
    }

    return {
      id: "fake-tool-call",
      model: request.model,
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_fake_1",
                type: "function",
                function: {
                  name: interpreted.tool,
                  arguments: JSON.stringify(interpreted.arguments),
                },
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
    };
  }
}

export function interpretObservation(observation: string): FakeInterpretation {
  return fakeDeterministicInterpret(observation);
}
