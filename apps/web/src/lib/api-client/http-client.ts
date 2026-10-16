import type { ZodType } from "zod";
import { ApiClientError } from "./errors.js";
import { toApiV1Path } from "./paths.js";

export type ApiClientOptions = {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  credentials?: RequestCredentials;
};

export type ApiClient = {
  get: <T>(path: string, schema: ZodType<T>) => Promise<T>;
  post: <T>(path: string, schema: ZodType<T>, body?: unknown) => Promise<T>;
};

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const fetchFn = options.fetchFn ?? fetch;
  const baseUrl = options.baseUrl ?? "";
  const credentials = options.credentials ?? "same-origin";

  async function request<T>(
    method: "GET" | "POST",
    path: string,
    schema: ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    const url = `${baseUrl}${toApiV1Path(path)}`;
    const init: RequestInit = {
      method,
      credentials,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    const response = await fetchFn(url, init);
    let payload: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      throw new ApiClientError(response.status, payload);
    }

    return schema.parse(payload);
  }

  return {
    get: (path, schema) => request("GET", path, schema),
    post: (path, schema, body) => request("POST", path, schema, body),
  };
}
