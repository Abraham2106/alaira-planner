import { z } from "zod";
import {
  dependencyTypeSchema,
  lagUnitSchema,
  workCalendarSchema,
} from "../schedule/schemas.js";

export const context = "scheduling";

const externalId = z.string().min(4).max(64);

const taskForecastTimesSchema = z.object({
  workNodeId: externalId,
  earlyStartEpochMs: z.number(),
  earlyFinishEpochMs: z.number(),
  lateStartEpochMs: z.number(),
  lateFinishEpochMs: z.number(),
  totalFloatMinutes: z.number().int(),
  freeFloatMinutes: z.number().int(),
  isCritical: z.boolean(),
});

export const schemas = {
  ProjectParams: z.object({
    projectId: externalId,
  }),
  WorkNodeParams: z.object({
    projectId: externalId,
    workNodeId: externalId,
  }),

  UpsertScheduleConfigBody: z.object({
    projectStartEpochMs: z.number().finite(),
    defaultCalendar: workCalendarSchema,
  }),
  ScheduleConfigResponse: z.object({
    projectId: externalId,
    projectStartEpochMs: z.number(),
    defaultCalendar: workCalendarSchema,
    forecastVersion: z.number().int().min(0),
    lastRecalcAt: z.string().datetime().nullable(),
  }),

  UpsertScheduleTaskBody: z.object({
    durationMinutes: z.number().int().min(0),
    calendarOverride: workCalendarSchema.optional(),
  }),
  ScheduleTaskResponse: z.object({
    workNodeId: externalId,
    durationMinutes: z.number().int().min(0),
    calendarOverride: workCalendarSchema.nullable(),
  }),

  CreateScheduleDependencyBody: z.object({
    predecessorWorkNodeId: externalId,
    successorWorkNodeId: externalId,
    type: dependencyTypeSchema,
    lagMinutes: z.number().int().optional(),
    lagAmount: z.number().optional(),
    lagUnit: lagUnitSchema.optional(),
  }),
  ScheduleDependencyResponse: z.object({
    id: externalId,
    predecessorWorkNodeId: externalId,
    successorWorkNodeId: externalId,
    type: dependencyTypeSchema,
    lagMinutes: z.number().int(),
  }),

  RecalculateScheduleBody: z.object({
    idempotencyKey: z.string().min(8).max(128),
  }),

  TaskForecastTimes: taskForecastTimesSchema,
  ScheduleForecastResponse: z.object({
    projectId: externalId,
    forecastVersion: z.number().int().positive(),
    projectEarlyFinishEpochMs: z.number(),
    projectLateFinishEpochMs: z.number(),
    criticalWorkNodeIds: z.array(externalId),
    assumptions: z.array(z.string()),
    tasks: z.array(taskForecastTimesSchema),
  }),
};
