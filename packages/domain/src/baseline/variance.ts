import type { TaskScheduleComparisonInput, TaskScheduleVariance } from "./types.js";

const MS_PER_MINUTE = 60_000;

function finishDeltaMinutes(
  baselineFinishEpochMs: number | null,
  otherFinishEpochMs: number | null,
): number | null {
  if (baselineFinishEpochMs == null || otherFinishEpochMs == null) {
    return null;
  }
  return Math.round((otherFinishEpochMs - baselineFinishEpochMs) / MS_PER_MINUTE);
}

export function computeTaskScheduleVariance(
  input: TaskScheduleComparisonInput,
): TaskScheduleVariance {
  const forecastFinishVsBaselineMinutes = finishDeltaMinutes(
    input.baselineEarlyFinishEpochMs,
    input.forecastEarlyFinishEpochMs,
  );
  const actualFinishVsBaselineMinutes = finishDeltaMinutes(
    input.baselineEarlyFinishEpochMs,
    input.actualFinishEpochMs,
  );
  const actualCostVsBaselineMinor =
    input.baselinePlannedCostMinor != null && input.actualCostMinor != null
      ? input.actualCostMinor - input.baselinePlannedCostMinor
      : null;

  return {
    workNodeId: input.workNodeId,
    forecastFinishVsBaselineMinutes,
    actualFinishVsBaselineMinutes,
    actualCostVsBaselineMinor,
  };
}

export function computeProjectScheduleVariances(
  inputs: TaskScheduleComparisonInput[],
): TaskScheduleVariance[] {
  return inputs.map(computeTaskScheduleVariance);
}
