import { z } from "zod";
import {
  assignmentRecalcModeSchema,
  capacityAnalysisResultSchema,
  overassignmentConflictSchema,
} from "../capacity/schemas.js";
import { workCalendarSchema } from "../schedule/schemas.js";

export const context = "assignments";

const externalId = z.string().min(4).max(64);

export const schemas = {
  ProjectParams: z.object({
    projectId: externalId,
  }),
  AssignmentParams: z.object({
    projectId: externalId,
    assignmentId: externalId,
  }),

  CreatePersonBody: z.object({
    displayName: z.string().min(1).max(256),
    teamName: z.string().min(1).max(128).optional(),
    maxUnits: z.number().positive().optional(),
    calendar: workCalendarSchema,
  }),
  PersonResponse: z.object({
    id: externalId,
    projectId: externalId,
    displayName: z.string(),
    teamName: z.string().nullable(),
    maxUnits: z.number(),
    calendar: workCalendarSchema,
  }),
  PersonListResponse: z.object({
    people: z.array(
      z.object({
        id: externalId,
        displayName: z.string(),
        teamName: z.string().nullable(),
        maxUnits: z.number(),
      }),
    ),
  }),

  CreateAssignmentBody: z.object({
    personId: externalId,
    workNodeId: externalId,
    units: z.number().min(0),
    workMinutes: z.number().min(0),
    durationMinutes: z.number().min(0),
    scheduledStartEpochMs: z.number(),
    scheduledFinishEpochMs: z.number(),
  }),
  UpdateAssignmentBody: z.object({
    units: z.number().min(0).optional(),
    workMinutes: z.number().min(0).optional(),
    durationMinutes: z.number().min(0).optional(),
    scheduledStartEpochMs: z.number().optional(),
    scheduledFinishEpochMs: z.number().optional(),
    recalcMode: assignmentRecalcModeSchema.optional(),
    changedField: z.enum(["work", "duration", "units"]).optional(),
  }),
  AssignmentResponse: z.object({
    id: externalId,
    projectId: externalId,
    personId: externalId,
    workNodeId: externalId,
    units: z.number(),
    workMinutes: z.number(),
    durationMinutes: z.number(),
    scheduledStartEpochMs: z.number(),
    scheduledFinishEpochMs: z.number(),
  }),
  AssignmentListResponse: z.object({
    assignments: z.array(
      z.object({
        id: externalId,
        personId: externalId,
        workNodeId: externalId,
        units: z.number(),
        workMinutes: z.number(),
        durationMinutes: z.number(),
        scheduledStartEpochMs: z.number(),
        scheduledFinishEpochMs: z.number(),
      }),
    ),
  }),

  CapacityAnalysisResponse: capacityAnalysisResultSchema.extend({
    conflicts: z.array(
      overassignmentConflictSchema.extend({
        personExternalId: externalId.optional(),
      }),
    ),
  }),
};
