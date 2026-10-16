import type { LagUnit } from "../schedule/types.js";
import { lagToMinutes } from "../schedule/types.js";

export function resolveLagMinutes(
  lagMinutes: number | undefined,
  lagAmount: number | undefined,
  lagUnit: LagUnit | undefined,
  workMinutesPerDay: number,
): number {
  if (lagMinutes !== undefined) {
    return lagMinutes;
  }
  if (lagAmount === undefined) {
    return 0;
  }
  const unit = lagUnit ?? "minutes";
  return lagToMinutes(lagAmount, unit, workMinutesPerDay);
}
