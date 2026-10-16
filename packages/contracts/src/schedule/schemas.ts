import { z } from "zod";

export const dependencyTypeSchema = z.enum(["FS", "SS", "FF", "SF"]);

export const lagUnitSchema = z.enum(["minutes", "hours", "workdays"]);

export const localTimeSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

export const calendarExceptionSchema = z.discriminatedUnion("kind", [
  z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), kind: z.literal("holiday") }),
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    kind: z.literal("working_override"),
    workMinutesPerDay: z.number().int().positive(),
    workDayStart: localTimeSchema.optional(),
  }),
]);

/**
 * Lag/lead on dependencies: `lagMinutes` signed; negative means lead.
 * Unit conversion for API payloads uses `lagUnit` with the project calendar's
 * `workMinutesPerDay` when unit is `workdays`.
 */
export const workCalendarSchema = z.object({
  timeZone: z.string().min(1),
  workingWeekdays: z.array(z.number().int().min(1).max(7)).min(1),
  workDayStart: localTimeSchema,
  workMinutesPerDay: z.number().int().positive(),
  exceptions: z.array(calendarExceptionSchema),
});

export const scheduleTaskSchema = z.object({
  id: z.string().min(1),
  durationMinutes: z.number().int().min(0),
  calendar: workCalendarSchema.optional(),
});

export const scheduleDependencySchema = z.object({
  id: z.string().min(1),
  predecessorId: z.string().min(1),
  successorId: z.string().min(1),
  type: dependencyTypeSchema,
  lagMinutes: z.number().int(),
});

export const cpmScheduleRequestSchema = z.object({
  projectStartEpochMs: z.number(),
  defaultCalendar: workCalendarSchema,
  tasks: z.array(scheduleTaskSchema).min(1),
  dependencies: z.array(scheduleDependencySchema),
});

export type CpmScheduleRequestDto = z.infer<typeof cpmScheduleRequestSchema>;
