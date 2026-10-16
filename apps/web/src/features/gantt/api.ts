import { schemas as baselineSchemas } from "@alaira/contracts/baseline";
import { createApiClient } from "../../lib/api-client/http-client.js";

const client = createApiClient();

export function createGanttApi() {
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
