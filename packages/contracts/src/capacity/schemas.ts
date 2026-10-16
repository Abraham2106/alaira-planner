import { z } from "zod";
import { workCalendarSchema } from "../schedule/schemas.js";

export const assignmentRecalcModeSchema = z.enum(["fixed_work", "fixed_duration", "fixed_units"]);

export const personResourceSchema = z.object({
  id: z.string().min(1),
  calendar: workCalendarSchema,
  maxUnits: z.number().positive().optional(),
});

export const resourceAssignmentSchema = z.object({
  id: z.string().min(1),
  personId: z.string().min(1),
  taskId: z.string().min(1),
  units: z.number().min(0),
  workMinutes: z.number().min(0),
  durationMinutes: z.number().min(0),
});

export const taskAssignmentWindowSchema = z.object({
  taskId: z.string().min(1),
  startEpochMs: z.number(),
  finishEpochMs: z.number(),
});

export const capacityAnalysisRequestSchema = z.object({
  people: z.array(personResourceSchema).min(1),
  assignments: z.array(resourceAssignmentSchema),
  taskWindows: z.array(taskAssignmentWindowSchema).min(1),
});

export const overassignmentConflictSchema = z.object({
  personId: z.string().min(1),
  intervalStartEpochMs: z.number(),
  intervalEndEpochMs: z.number(),
  assignedUnits: z.number(),
  maxUnits: z.number(),
});

export const capacityAnalysisResultSchema = z.object({
  conflicts: z.array(overassignmentConflictSchema),
  assignments: z.array(resourceAssignmentSchema),
  assumptions: z.array(z.string()),
});

export type CapacityAnalysisRequestDto = z.infer<typeof capacityAnalysisRequestSchema>;
export type CapacityAnalysisResultDto = z.infer<typeof capacityAnalysisResultSchema>;
