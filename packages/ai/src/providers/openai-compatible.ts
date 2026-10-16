import type { TypedToolName } from "@alaira/contracts/ai";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type OpenAiToolSpec = {
  type: "function";
  function: {
    name: Exclude<TypedToolName, "__direct_write__">;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatCompletionRequest = {
  model: string;
  messages: ChatMessage[];
  tools?: OpenAiToolSpec[];
};

export type ChatCompletionToolCall = {
  id: string;
  type: "function";
  function: {
    name: TypedToolName;
    arguments: string;
  };
};

export type ChatCompletionResponse = {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: ChatCompletionToolCall[];
    };
    finish_reason: "stop" | "tool_calls";
  }>;
};

export interface OpenAiCompatibleProvider {
  createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}

export function parseToolCallArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* fall through */
  }
  return {};
}

export function extractFirstToolCall(
  response: ChatCompletionResponse,
): { name: TypedToolName; arguments: Record<string, unknown> } | null {
  const toolCalls = response.choices[0]?.message.tool_calls;
  if (!toolCalls?.length) return null;
  const call = toolCalls[0]!;
  return {
    name: call.function.name,
    arguments: parseToolCallArguments(call.function.arguments),
  };
}
