import { CapacityError } from "./errors.js";
import type { AssignmentRecalcMode, AssignmentTriangle, AssignmentTriangleField } from "./types.js";

/**
 * Reconcile work, duration and units after one field is edited (REQ-083).
 * Uses floating-point minutes; callers may round for display.
 */
export function recalculateAssignmentTriangle(
  current: AssignmentTriangle,
  mode: AssignmentRecalcMode,
  changed: AssignmentTriangleField,
): AssignmentTriangle {
  const { workMinutes, durationMinutes, units } = current;
  if (workMinutes < 0 || durationMinutes < 0 || units < 0) {
    throw new CapacityError("VALIDATION", "work, duration and units must be non-negative");
  }

  switch (mode) {
    case "fixed_work": {
      if (changed === "units") {
        if (units === 0) {
          throw new CapacityError("VALIDATION", "units must be positive when work is fixed");
        }
        return { workMinutes, durationMinutes: workMinutes / units, units };
      }
      if (changed === "duration") {
        if (durationMinutes === 0) {
          throw new CapacityError("VALIDATION", "duration must be positive when work is fixed");
        }
        return { workMinutes, durationMinutes, units: workMinutes / durationMinutes };
      }
      return { workMinutes, durationMinutes, units };
    }
    case "fixed_duration": {
      if (changed === "units") {
        return { workMinutes: durationMinutes * units, durationMinutes, units };
      }
      if (changed === "work") {
        if (durationMinutes === 0) {
          throw new CapacityError("VALIDATION", "duration must be positive when duration is fixed");
        }
        return { workMinutes, durationMinutes, units: workMinutes / durationMinutes };
      }
      return { workMinutes, durationMinutes, units };
    }
    case "fixed_units": {
      if (changed === "duration") {
        return { workMinutes: durationMinutes * units, durationMinutes, units };
      }
      if (changed === "work") {
        if (units === 0) {
          throw new CapacityError("VALIDATION", "units must be positive when units are fixed");
        }
        return { workMinutes, durationMinutes: workMinutes / units, units };
      }
      return { workMinutes, durationMinutes, units };
    }
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
