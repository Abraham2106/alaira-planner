import { z } from "zod";

export const context = "project";

const externalId = z.string().min(4).max(64);

const planningMode = z.enum(["predictive", "scrum", "kanban", "hybrid"]);
const executionMode = z.enum(["predictive", "scrum", "kanban"]);
const financialControl = z.enum(["none", "basic", "full"]);
const customFieldType = z.enum(["text", "number", "boolean", "date"]);

const deliveryProfile = z.object({
  planningMode,
  scheduleEngine: z.boolean(),
  agileExecution: z.boolean(),
  financialControl,
  resourcePlanning: z.boolean(),
  baselineRequired: z.boolean(),
});

export const schemas = {
  CreateProjectBody: z.object({
    name: z.string().min(1).max(256),
    deliveryProfile,
  }),
  ProjectResponse: z.object({
    id: externalId,
    tenantId: externalId,
    name: z.string(),
    deliveryProfile,
    version: z.number().int().nonnegative(),
  }),

  CreateBranchBody: z.object({
    title: z.string().min(1).max(256),
    executionModeOverride: executionMode.optional(),
    parentWorkNodeId: externalId.optional(),
  }),
  BranchResponse: z.object({
    id: externalId,
    projectId: externalId,
    title: z.string(),
    nodeType: z.enum(["project_root", "branch"]),
    executionModeOverride: executionMode.nullable(),
    effectiveExecutionMode: executionMode,
  }),
  ListBranchesResponse: z.object({
    branches: z.array(
      z.object({
        id: externalId,
        title: z.string(),
        nodeType: z.enum(["project_root", "branch"]),
        executionModeOverride: executionMode.nullable(),
        effectiveExecutionMode: executionMode,
      }),
    ),
  }),

  DefineCustomFieldBody: z.object({
    fieldKey: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z][a-z0-9_]*$/),
    fieldType: customFieldType,
    label: z.string().min(1).max(128),
  }),
  CustomFieldDefResponse: z.object({
    fieldKey: z.string(),
    fieldType: customFieldType,
    label: z.string(),
  }),

  SetOwnershipBody: z.object({
    responsibleUserId: externalId.nullable().optional(),
    approverUserId: externalId.nullable().optional(),
  }),
  OwnershipResponse: z.object({
    workNodeId: externalId,
    responsibleUserId: externalId.nullable(),
    approverUserId: externalId.nullable(),
  }),

  ProjectParams: z.object({
    projectId: externalId,
  }),
  WorkNodeParams: z.object({
    projectId: externalId,
    workNodeId: externalId,
  }),
};
