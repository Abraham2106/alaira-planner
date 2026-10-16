import { z } from "zod";

export const context = "acceptance";

const externalId = z.string().min(4).max(64);

const lifecycleSchema = z.object({
  executionStatus: z.enum(["in_progress", "execution_complete"]),
  completionRequestStatus: z.enum(["none", "pending", "withdrawn"]),
  acceptanceStatus: z.enum(["not_accepted", "accepted", "rejected"]),
});

const criterionEvalSchema = z.object({
  key: z.string().min(1).max(128),
  satisfied: z.boolean(),
});

export const schemas = {
  ProjectParams: z.object({ projectId: externalId }),
  DeliverableParams: z.object({ projectId: externalId, workNodeId: externalId }),
  WorkNodeParams: z.object({ projectId: externalId, workNodeId: externalId }),
  CompletionRequestBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
    note: z.string().max(2000).optional(),
  }),
  AcceptDeliverableBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
    criterionEvaluations: z.array(criterionEvalSchema).min(1),
    reason: z.string().max(2000).optional(),
    evidenceRefs: z.array(z.string().max(128)).optional(),
  }),
  RejectDeliverableBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
    reason: z.string().min(1).max(2000),
    observations: z.string().max(4000).optional(),
  }),
  RevertAcceptanceBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
    reason: z.string().min(1).max(2000),
  }),
  SetProgressStrategyBody: z.object({
    strategyKind: z.enum([
      "manual",
      "deliverable_acceptance",
      "weighted_checklist",
      "external_evidence",
    ]),
    checklistWeights: z
      .array(z.object({ key: z.string().min(1).max(128), weight: z.number().int().positive() }))
      .optional(),
  }),
  SetManualProgressBody: z.object({
    progressPercent: z.number().int().min(0).max(100),
  }),
  UpdateChecklistBody: z.object({
    items: z.array(
      z.object({ key: z.string().min(1).max(128), completed: z.boolean() }),
    ),
  }),
  LifecycleResponse: z.object({
    workNodeId: externalId,
    lifecycle: lifecycleSchema,
    progressPercent: z.number().int().min(0).max(100),
    latestDecisionId: externalId.nullable(),
  }),
  AcceptanceDecisionResponse: z.object({
    id: externalId,
    decisionType: z.enum(["completion_request", "accept", "reject", "revert_acceptance"]),
    workNodeId: externalId,
    criterionVersion: z.number().int().positive().nullable(),
    criterionEvaluations: z.array(criterionEvalSchema),
    reason: z.string().nullable(),
    actorUserId: externalId,
    createdAt: z.string().datetime(),
    lifecycle: lifecycleSchema,
    progressPercent: z.number().int().min(0).max(100),
  }),
  ProgressStrategyResponse: z.object({
    workNodeId: externalId,
    version: z.number().int().positive(),
    strategyKind: z.enum([
      "manual",
      "deliverable_acceptance",
      "weighted_checklist",
      "external_evidence",
    ]),
    config: z.record(z.unknown()),
  }),
  PackageRollupResponse: z.object({
    workNodeId: externalId,
    progressPercent: z.number().int().min(0).max(100),
    leaves: z.array(
      z.object({
        workNodeId: externalId,
        weight: z.number().int().positive(),
        progressPercent: z.number().int().min(0).max(100),
      }),
    ),
  }),
};
