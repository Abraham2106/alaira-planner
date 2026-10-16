import { z } from "zod";

export const context = "baseline";

const externalId = z.string().min(4).max(64);

const baselineTaskTimesSchema = z.object({
  workNodeId: externalId,
  earlyStartEpochMs: z.number(),
  earlyFinishEpochMs: z.number(),
  plannedCostMinor: z.number().int().min(0).nullable(),
});

const taskVarianceSchema = z.object({
  workNodeId: externalId,
  forecastFinishVsBaselineMinutes: z.number().int().nullable(),
  actualFinishVsBaselineMinutes: z.number().int().nullable(),
  actualCostVsBaselineMinor: z.number().int().nullable(),
});

export const schemas = {
  ProjectParams: z.object({
    projectId: externalId,
  }),
  WorkNodeParams: z.object({
    projectId: externalId,
    workNodeId: externalId,
  }),

  ApproveBaselineBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
    reason: z.string().max(2000).optional(),
    plannedCosts: z
      .array(
        z.object({
          workNodeId: externalId,
          plannedCostMinor: z.number().int().min(0),
        }),
      )
      .optional(),
  }),

  BaselineSummaryResponse: z.object({
    projectId: externalId,
    baselineVersion: z.number().int().positive(),
    sourceForecastVersion: z.number().int().positive(),
    approvedAt: z.string().datetime(),
    approvedByUserId: externalId,
    approvedReason: z.string().nullable(),
    projectEarlyFinishEpochMs: z.number(),
    tasks: z.array(baselineTaskTimesSchema),
  }),

  UpsertActualTaskBody: z.object({
    actualStartEpochMs: z.number().finite().nullable().optional(),
    actualFinishEpochMs: z.number().finite().nullable().optional(),
    actualCostMinor: z.number().int().min(0).nullable().optional(),
  }),

  ActualTaskResponse: z.object({
    workNodeId: externalId,
    actualStartEpochMs: z.number().nullable(),
    actualFinishEpochMs: z.number().nullable(),
    actualCostMinor: z.number().int().min(0).nullable(),
  }),

  BaselineVarianceResponse: z.object({
    projectId: externalId,
    baselineVersion: z.number().int().positive(),
    forecastVersion: z.number().int().positive(),
    tasks: z.array(
      z.object({
        workNodeId: externalId,
        baseline: baselineTaskTimesSchema.nullable(),
        forecast: z
          .object({
            workNodeId: externalId,
            earlyStartEpochMs: z.number(),
            earlyFinishEpochMs: z.number(),
          })
          .nullable(),
        actual: z
          .object({
            workNodeId: externalId,
            actualStartEpochMs: z.number().nullable(),
            actualFinishEpochMs: z.number().nullable(),
            actualCostMinor: z.number().int().min(0).nullable(),
          })
          .nullable(),
        variance: taskVarianceSchema,
      }),
    ),
  }),
};
