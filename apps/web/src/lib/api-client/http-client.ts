import type { ZodType } from "zod";
import { CSRF_HEADER_NAME, readWriteCsrfToken } from "./csrf.js";
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
  patch: <T>(path: string, schema: ZodType<T>, body?: unknown) => Promise<T>;
};

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const fetchFn = options.fetchFn ?? fetch;
  const baseUrl = options.baseUrl ?? "";
  const credentials = options.credentials ?? "same-origin";

  async function request<T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    schema: ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    const url = `${baseUrl}${toApiV1Path(path)}`;
    const headers: Record<string, string> = {};
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (method !== "GET") {
      const csrf = readWriteCsrfToken();
      if (csrf) headers[CSRF_HEADER_NAME] = csrf;
    }
    const init: RequestInit = {
      method,
      credentials,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };
    if (Object.keys(headers).length > 0) {
      init.headers = headers;
    }

    const response = await fetchFn(url, init);
    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();
    const payload: unknown = contentType.includes("application/json")
      ? JSON.parse(raw)
      : raw;

    if (!response.ok) {
      throw new ApiClientError(response.status, payload);
    }

    return schema.parse(payload);
  }

  return {
    get: (path, schema) => request("GET", path, schema),
    post: (path, schema, body) => request("POST", path, schema, body),
    patch: (path, schema, body) => request("PATCH", path, schema, body),
  };
}
