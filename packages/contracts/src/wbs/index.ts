import { z } from "zod";

export const context = "wbs";

const externalId = z.string().min(4).max(64);

const criterionItem = z.object({
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/),
  text: z.string().min(1).max(2000),
  required: z.boolean(),
});

const packageStatus = z.enum(["draft", "active", "complete"]);
const projectionLinkKind = z.enum(["backlog_projection", "goal"]);

export const schemas = {
  ProjectParams: z.object({
    projectId: externalId,
  }),
  WorkNodeParams: z.object({
    projectId: externalId,
    workNodeId: externalId,
  }),

  CreatePackageBody: z.object({
    wbsCode: z.string().min(1).max(32),
    title: z.string().min(1).max(256),
    description: z.string().max(4000).optional(),
    parentWorkNodeId: externalId.optional(),
    responsibleUserId: externalId.nullable().optional(),
    estimateHours: z.number().positive().optional(),
    status: packageStatus.optional(),
    criteria: z.array(criterionItem).min(1),
  }),
  PackageResponse: z.object({
    id: externalId,
    projectId: externalId,
    nodeType: z.literal("work_package"),
    wbsCode: z.string(),
    title: z.string(),
    description: z.string(),
    status: packageStatus,
    estimateHours: z.number().nullable(),
    responsibleUserId: externalId.nullable(),
    criteriaVersion: z.number().int().positive(),
  }),

  CreateDeliverableBody: z.object({
    wbsCode: z.string().min(1).max(32),
    title: z.string().min(1).max(256),
    description: z.string().max(4000).optional(),
    parentWorkNodeId: externalId,
    criteria: z.array(criterionItem).min(1),
  }),
  DeliverableResponse: z.object({
    id: externalId,
    projectId: externalId,
    nodeType: z.literal("deliverable"),
    wbsCode: z.string(),
    title: z.string(),
    description: z.string(),
    deliverableVersion: z.number().int().positive(),
    criteriaVersion: z.number().int().positive(),
    parentWorkNodeId: externalId,
  }),

  UpdateDeliverableCriteriaBody: z.object({
    criteria: z.array(criterionItem).min(1),
  }),
  CriteriaVersionResponse: z.object({
    workNodeId: externalId,
    criteriaVersion: z.number().int().positive(),
    criteria: z.array(criterionItem),
  }),

  CreateMilestoneBody: z.object({
    wbsCode: z.string().min(1).max(32),
    title: z.string().min(1).max(256),
    parentWorkNodeId: externalId.optional(),
    approvalGateRequired: z.boolean().optional(),
  }),
  MilestoneResponse: z.object({
    id: externalId,
    projectId: externalId,
    nodeType: z.literal("milestone"),
    wbsCode: z.string(),
    title: z.string(),
    approvalGateRequired: z.boolean(),
    parentWorkNodeId: externalId,
  }),

  ReparentNodeBody: z.object({
    parentWorkNodeId: externalId,
  }),

  CreateProjectionLinkBody: z.object({
    sourceWorkNodeId: externalId,
    targetWorkNodeId: externalId,
    linkKind: projectionLinkKind,
  }),
  ProjectionLinkResponse: z.object({
    sourceWorkNodeId: externalId,
    targetWorkNodeId: externalId,
    linkKind: projectionLinkKind,
  }),

  WbsTreeNode: z.object({
    id: externalId,
    nodeType: z.enum(["work_package", "deliverable", "milestone"]),
    wbsCode: z.string(),
    title: z.string(),
    parentWorkNodeId: externalId.nullable(),
  }),
  WbsTreeResponse: z.object({
    nodes: z.array(
      z.object({
        id: externalId,
        nodeType: z.enum(["work_package", "deliverable", "milestone"]),
        wbsCode: z.string(),
        title: z.string(),
        parentWorkNodeId: externalId.nullable(),
      }),
    ),
  }),
};
