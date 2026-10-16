import { schemas as baselineSchemas } from "@alaira/contracts/baseline";
import {
  createApiClient,
  type ApiClientOptions,
} from "../../lib/api-client/http-client.js";

export function createGanttApi(options?: ApiClientOptions) {
  const client = createApiClient(options);
  return {
    getBaselineVariance(projectId: string) {
      return client.get(
        `projects/${encodeURIComponent(projectId)}/baseline/variance`,
        baselineSchemas.BaselineVarianceResponse,
      );
    },
    getBaselineSummary(projectId: string) {
      return client.get(
        `projects/${encodeURIComponent(projectId)}/baseline`,
        baselineSchemas.BaselineSummaryResponse,
      );
    },
  };
}

export type GanttApi = ReturnType<typeof createGanttApi>;
