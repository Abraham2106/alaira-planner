export type BaselineTaskSnapshot = {
  workNodeId: string;
  earlyStartEpochMs: number;
  earlyFinishEpochMs: number;
  plannedCostMinor: number | null;
};

export type TaskScheduleComparisonInput = {
  workNodeId: string;
  baselineEarlyFinishEpochMs: number | null;
  forecastEarlyFinishEpochMs: number | null;
  actualFinishEpochMs: number | null;
  baselinePlannedCostMinor: number | null;
  actualCostMinor: number | null;
};

export type TaskScheduleVariance = {
  workNodeId: string;
  forecastFinishVsBaselineMinutes: number | null;
  actualFinishVsBaselineMinutes: number | null;
  actualCostVsBaselineMinor: number | null;
};
