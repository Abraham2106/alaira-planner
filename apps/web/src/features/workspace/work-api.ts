import { z } from "zod";
import { schemas as acceptanceSchemas } from "@alaira/contracts/acceptance";
import { schemas as assignmentSchemas } from "@alaira/contracts/assignments";
import { schemas as evidenceSchemas } from "@alaira/contracts/evidence";
import { schemas as projectSchemas } from "@alaira/contracts/project";
import { schemas as wbsSchemas } from "@alaira/contracts/wbs";
import {
  CSRF_HEADER_NAME,
  readWriteCsrfToken,
} from "../../lib/api-client/csrf.js";
import { ApiClientError } from "../../lib/api-client/errors.js";
import { createApiClient } from "../../lib/api-client/http-client.js";
import { toApiV1Path } from "../../lib/api-client/paths.js";

const ManualProgressResponse = z.object({
  workNodeId: z.string(),
  progressPercent: z.number(),
  lifecycle: acceptanceSchemas.LifecycleResponse.shape.lifecycle,
});

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

/** The shared client has no PUT. Strategy and manual progress stay on that verb. */
async function putJson<T>(path: string, schema: z.ZodType<T>, body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const csrf = readWriteCsrfToken();
  if (csrf) headers[CSRF_HEADER_NAME] = csrf;
  const response = await fetch(toApiV1Path(path), {
    method: "PUT",
    credentials: "same-origin",
    headers,
    body: JSON.stringify(body),
  });
  const payload = await readPayload(response);
  if (!response.ok) throw new ApiClientError(response.status, payload);
  return schema.parse(payload);
}

export function newActionKey(prefix: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`.slice(0, 128);
}

export function createWorkApi() {
  const client = createApiClient();
  const projectPath = (projectId: string) => `projects/${encodeURIComponent(projectId)}`;

  return {
    getProject(projectId: string) {
      return client.get(projectPath(projectId), projectSchemas.ProjectResponse);
    },
    listTree(projectId: string) {
      return client.get(`${projectPath(projectId)}/wbs/tree`, wbsSchemas.WbsTreeResponse);
    },
    listPeople(projectId: string) {
      return client.get(
        `${projectPath(projectId)}/assignments/people`,
        assignmentSchemas.PersonListResponse,
      );
    },
    listAssignments(projectId: string) {
      return client.get(
        `${projectPath(projectId)}/assignments`,
        assignmentSchemas.AssignmentListResponse,
      );
    },
    getRollup(projectId: string, workNodeId: string) {
      return client.get(
        `${projectPath(projectId)}/work-nodes/${encodeURIComponent(workNodeId)}/rollup-progress`,
        acceptanceSchemas.PackageRollupResponse,
      );
    },
    getAcceptanceState(projectId: string, workNodeId: string) {
      return client.get(
        `${projectPath(projectId)}/deliverables/${encodeURIComponent(workNodeId)}/acceptance-state`,
        acceptanceSchemas.LifecycleResponse,
      );
    },
    requestCompletion(projectId: string, workNodeId: string, note?: string) {
      return client.post(
        `${projectPath(projectId)}/deliverables/${encodeURIComponent(workNodeId)}/completion-requests`,
        acceptanceSchemas.AcceptanceDecisionResponse,
        {
          idempotencyKey: newActionKey("done"),
          ...(note ? { note } : {}),
        },
      );
    },
    acceptDeliverable(
      projectId: string,
      workNodeId: string,
      body: { key: string; satisfied: boolean; reason?: string },
    ) {
      return client.post(
        `${projectPath(projectId)}/deliverables/${encodeURIComponent(workNodeId)}/acceptance`,
        acceptanceSchemas.AcceptanceDecisionResponse,
        {
          idempotencyKey: newActionKey("accept"),
          criterionEvaluations: [{ key: body.key, satisfied: body.satisfied }],
          ...(body.reason ? { reason: body.reason } : {}),
        },
      );
    },
    rejectDeliverable(projectId: string, workNodeId: string, reason: string) {
      return client.post(
        `${projectPath(projectId)}/deliverables/${encodeURIComponent(workNodeId)}/rejection`,
        acceptanceSchemas.AcceptanceDecisionResponse,
        { idempotencyKey: newActionKey("reject"), reason },
      );
    },
    revertAcceptance(projectId: string, workNodeId: string, reason: string) {
      return client.post(
        `${projectPath(projectId)}/deliverables/${encodeURIComponent(workNodeId)}/revert-acceptance`,
        acceptanceSchemas.AcceptanceDecisionResponse,
        { idempotencyKey: newActionKey("revert"), reason },
      );
    },
    createEvidenceLink(
      projectId: string,
      body: { title: string; url: string; workNodeId: string },
    ) {
      return client.post(
        `${projectPath(projectId)}/evidence`,
        evidenceSchemas.EvidenceRecordResponse,
        { kind: "link", title: body.title, url: body.url, workNodeId: body.workNodeId },
      );
    },
    setProgressStrategy(
      projectId: string,
      workNodeId: string,
      strategyKind: "manual" | "deliverable_acceptance" | "weighted_checklist" | "external_evidence",
    ) {
      return putJson(
        `${projectPath(projectId)}/work-nodes/${encodeURIComponent(workNodeId)}/progress-strategy`,
        acceptanceSchemas.ProgressStrategyResponse,
        { strategyKind },
      );
    },
    setManualProgress(projectId: string, workNodeId: string, progressPercent: number) {
      return putJson(
        `${projectPath(projectId)}/work-nodes/${encodeURIComponent(workNodeId)}/manual-progress`,
        ManualProgressResponse,
        { progressPercent },
      );
    },
  };
}

export type WorkApi = ReturnType<typeof createWorkApi>;
