export type CapacityErrorCode =
  | "VALIDATION"
  | "UNKNOWN_PERSON"
  | "UNKNOWN_TASK";

export class CapacityError extends Error {
  constructor(
    readonly code: CapacityErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CapacityError";
  }
}
