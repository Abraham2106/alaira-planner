import { schemas as aiSchemas } from "@alaira/contracts/ai-proposal";
import { schemas as apiv1Schemas } from "@alaira/contracts/apiv1";
import { schemas as baselineSchemas } from "@alaira/contracts/baseline";
import type { ZodType } from "zod";
import { ApiClientError } from "../../lib/api-client/errors.js";
import {
  createApiClient,
  type ApiClientOptions,
} from "../../lib/api-client/http-client.js";
import { toApiV1Path } from "../../lib/api-client/paths.js";
import { jsonWriteHeaders } from "../wbs/csrf.js";

async function writeJson<T>(
  method: "POST",
  path: string,
  schema: ZodType<T>,
  body: unknown,
  options?: ApiClientOptions,
): Promise<T> {
  const baseUrl = options?.baseUrl ?? "";
  const fetchFn = options?.fetchFn ?? fetch;
  const url = `${baseUrl}${toApiV1Path(path)}`;
  const response = await fetchFn(url, {
    method,
    credentials: options?.credentials ?? "same-origin",
    headers: jsonWriteHeaders(),
    body: JSON.stringify(body),
  });
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

export function createControlTowerApi(options?: ApiClientOptions) {
  const client = createApiClient(options);

  return {
    getBaselineVariance(projectId: string) {
      return client.get(
        `projects/${encodeURIComponent(projectId)}/baseline/variance`,
        baselineSchemas.BaselineVarianceResponse,
      );
    },
    searchEventLog(
      projectId: string,
      query?: { page?: number; pageSize?: number; eventType?: string },
    ) {
      const params = new URLSearchParams();
      params.set("page", String(query?.page ?? 1));
      params.set("pageSize", String(query?.pageSize ?? 25));
      if (query?.eventType) params.set("eventType", query.eventType);
      return client.get(
        `search/projects/${encodeURIComponent(projectId)}/event-log?${params.toString()}`,
        apiv1Schemas.SearchEventLogResponse,
      );
    },
    runObservation(
      projectId: string,
      body: { observation: string; idempotencyKey: string; targetNodeId?: string },
    ) {
      return writeJson(
        "POST",
        `projects/${encodeURIComponent(projectId)}/ai-proposals/run`,
        aiSchemas.RunObservationResponse,
        body,
        options,
      );
    },
    confirmProposal(
      projectId: string,
      proposalId: string,
      idempotencyKey: string,
    ) {
      return writeJson(
        "POST",
        `projects/${encodeURIComponent(projectId)}/ai-proposals/${encodeURIComponent(proposalId)}/confirm`,
        aiSchemas.ResolveProposalResponse,
        { idempotencyKey },
        options,
      );
    },
    rejectProposal(
      projectId: string,
      proposalId: string,
      body: { idempotencyKey: string; reason?: string },
    ) {
      return writeJson(
        "POST",
        `projects/${encodeURIComponent(projectId)}/ai-proposals/${encodeURIComponent(proposalId)}/reject`,
        aiSchemas.ResolveProposalResponse,
        body,
        options,
      );
    },
  };
}

export type ControlTowerApi = ReturnType<typeof createControlTowerApi>;

export function newIdempotencyKey(prefix = "ct"): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`.slice(0, 128);
}
