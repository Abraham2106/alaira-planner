export type ScheduleErrorCode =
  | "VALIDATION"
  | "UNKNOWN_TASK"
  | "SELF_DEPENDENCY"
  | "CYCLE";

export class ScheduleError extends Error {
  constructor(
    readonly code: ScheduleErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ScheduleError";
  }
}
