import { schemas as wbsSchemas } from "@alaira/contracts/wbs";
import { z, type ZodType } from "zod";
import { ApiClientError } from "../../lib/api-client/errors.js";
import { createApiClient } from "../../lib/api-client/http-client.js";
import { toApiV1Path } from "../../lib/api-client/paths.js";

const client = createApiClient();

const defaultCriteria = [{ key: "done", text: "Criterio de aceptación sintético", required: true }];

const ReparentNodeResponse = z.object({
  workNodeId: z.string(),
  parentWorkNodeId: z.string(),
});

async function patch<T>(path: string, schema: ZodType<T>, body: unknown): Promise<T> {
  const url = toApiV1Path(path);
  const response = await fetch(url, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
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

export function createWbsApi() {
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
      return patch(
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
