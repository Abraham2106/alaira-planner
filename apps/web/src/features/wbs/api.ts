import { schemas as wbsSchemas } from "@alaira/contracts/wbs";
import { z } from "zod";
import {
  createApiClient,
  type ApiClientOptions,
} from "../../lib/api-client/http-client.js";

const defaultCriteria = [{ key: "done", text: "Criterio de aceptación sintético", required: true }];

const ReparentNodeResponse = z.object({
  workNodeId: z.string(),
  parentWorkNodeId: z.string(),
});

export function createWbsApi(options?: ApiClientOptions) {
  const client = createApiClient(options);
  return {
    listTree(projectId: string) {
      return client.get(
        `projects/${encodeURIComponent(projectId)}/wbs/tree`,
        wbsSchemas.WbsTreeResponse,
      );
    },
    createPackage(
      projectId: string,
      body: {
        wbsCode: string;
        title: string;
        parentWorkNodeId?: string;
      },
    ) {
      return client.post(
        `projects/${encodeURIComponent(projectId)}/wbs/packages`,
        wbsSchemas.PackageResponse,
        {
          ...body,
          criteria: defaultCriteria,
        },
      );
    },
    reparentNode(projectId: string, workNodeId: string, parentWorkNodeId: string) {
      return client.patch(
        `projects/${encodeURIComponent(projectId)}/wbs/nodes/${encodeURIComponent(workNodeId)}/parent`,
        ReparentNodeResponse,
        { parentWorkNodeId },
      );
    },
    createProjectionLink(
      projectId: string,
      body: {
        sourceWorkNodeId: string;
        targetWorkNodeId: string;
        linkKind: "backlog_projection" | "goal";
      },
    ) {
      return client.post(
        `projects/${encodeURIComponent(projectId)}/wbs/projection-links`,
        wbsSchemas.ProjectionLinkResponse,
        body,
      );
    },
  };
}

export type WbsApi = ReturnType<typeof createWbsApi>;
