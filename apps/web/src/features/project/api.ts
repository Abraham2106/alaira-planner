import { schemas as apiv1Schemas } from "@alaira/contracts/apiv1";
import { schemas as projectSchemas } from "@alaira/contracts/project";
import { createApiClient } from "../../lib/api-client/http-client.js";

export const defaultDeliveryProfile = {
  planningMode: "predictive" as const,
  scheduleEngine: true,
  agileExecution: false,
  financialControl: "none" as const,
  resourcePlanning: false,
  baselineRequired: false,
};

const client = createApiClient();

export function createProjectApi() {
  return {
    searchProjects(query?: { page?: number; pageSize?: number; q?: string }) {
      const params = new URLSearchParams();
      params.set("page", String(query?.page ?? 1));
      params.set("pageSize", String(query?.pageSize ?? 20));
      if (query?.q) params.set("q", query.q);
      return client.get(`search/projects?${params.toString()}`, apiv1Schemas.SearchProjectsResponse);
    },
    createProject(body: { name: string }) {
      return client.post("projects", projectSchemas.ProjectResponse, {
        name: body.name,
        deliveryProfile: defaultDeliveryProfile,
      });
    },
    getProject(projectId: string) {
      return client.get(
        `projects/${encodeURIComponent(projectId)}`,
        projectSchemas.ProjectResponse,
      );
    },
    createBranch(projectId: string, body: { title: string; executionModeOverride?: string }) {
      return client.post(
        `projects/${encodeURIComponent(projectId)}/branches`,
        projectSchemas.BranchResponse,
        body,
      );
    },
    listBranches(projectId: string) {
      return client.get(
        `projects/${encodeURIComponent(projectId)}/branches`,
        projectSchemas.ListBranchesResponse,
      );
    },
  };
}

export type ProjectApi = ReturnType<typeof createProjectApi>;
