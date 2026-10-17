import { schemas as aiSchemas } from "@alaira/contracts/ai-proposal";
import { schemas as apiv1Schemas } from "@alaira/contracts/apiv1";
import { schemas as baselineSchemas } from "@alaira/contracts/baseline";
import {
  createApiClient,
  type ApiClientOptions,
} from "../../lib/api-client/http-client.js";

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
      return client.post(
        `projects/${encodeURIComponent(projectId)}/ai-proposals/run`,
        aiSchemas.RunObservationResponse,
        body,
      );
    },
    confirmProposal(
      projectId: string,
      proposalId: string,
      idempotencyKey: string,
    ) {
      return client.post(
        `projects/${encodeURIComponent(projectId)}/ai-proposals/${encodeURIComponent(proposalId)}/confirm`,
        aiSchemas.ResolveProposalResponse,
        { idempotencyKey },
      );
    },
    rejectProposal(
      projectId: string,
      proposalId: string,
      body: { idempotencyKey: string; reason?: string },
    ) {
      return client.post(
        `projects/${encodeURIComponent(projectId)}/ai-proposals/${encodeURIComponent(proposalId)}/reject`,
        aiSchemas.ResolveProposalResponse,
        body,
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
