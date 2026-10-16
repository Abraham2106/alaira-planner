import type { z } from "zod";
import type { schemas as baselineSchemas } from "@alaira/contracts/baseline";

type VarianceResponse = z.infer<(typeof baselineSchemas)["BaselineVarianceResponse"]>;
type VarianceTask = VarianceResponse["tasks"][number];

export type GanttTaskRow = {
  workNodeId: string;
  baselineStartMs: number | null;
  baselineFinishMs: number | null;
  forecastStartMs: number | null;
  forecastFinishMs: number | null;
  actualStartMs: number | null;
  actualFinishMs: number | null;
  forecastFinishVsBaselineMinutes: number | null;
  actualFinishVsBaselineMinutes: number | null;
  actualCostVsBaselineMinor: number | null;
};

export type TimelineBounds = {
  startMs: number;
  endMs: number;
  spanMs: number;
};

export function mapVarianceToRows(response: VarianceResponse): GanttTaskRow[] {
  return response.tasks.map((task: VarianceTask) => ({
    workNodeId: task.workNodeId,
    baselineStartMs: task.baseline?.earlyStartEpochMs ?? null,
    baselineFinishMs: task.baseline?.earlyFinishEpochMs ?? null,
    forecastStartMs: task.forecast?.earlyStartEpochMs ?? null,
    forecastFinishMs: task.forecast?.earlyFinishEpochMs ?? null,
    actualStartMs: task.actual?.actualStartEpochMs ?? null,
    actualFinishMs: task.actual?.actualFinishEpochMs ?? null,
    forecastFinishVsBaselineMinutes: task.variance.forecastFinishVsBaselineMinutes,
    actualFinishVsBaselineMinutes: task.variance.actualFinishVsBaselineMinutes,
    actualCostVsBaselineMinor: task.variance.actualCostVsBaselineMinor,
  }));
}

function collectEpochs(row: GanttTaskRow): number[] {
  const values: number[] = [];
  for (const v of [
    row.baselineStartMs,
    row.baselineFinishMs,
    row.forecastStartMs,
    row.forecastFinishMs,
    row.actualStartMs,
    row.actualFinishMs,
  ]) {
    if (v != null && Number.isFinite(v)) values.push(v);
  }
  return values;
}

/** Inclusive timeline for bar positioning (minimum one hour span). */
export function computeTimelineBounds(rows: GanttTaskRow[]): TimelineBounds | null {
  const all: number[] = [];
  for (const row of rows) {
    all.push(...collectEpochs(row));
  }
  if (all.length === 0) return null;
  const startMs = Math.min(...all);
  const endMs = Math.max(...all);
  const spanMs = Math.max(endMs - startMs, 60 * 60 * 1000);
  return { startMs, endMs: startMs + spanMs, spanMs };
}

export function barStyle(
  startMs: number | null,
  finishMs: number | null,
  bounds: TimelineBounds,
): { left: string; width: string } | null {
  if (startMs == null || finishMs == null) return null;
  const leftPct = ((startMs - bounds.startMs) / bounds.spanMs) * 100;
  const widthPct = Math.max(((finishMs - startMs) / bounds.spanMs) * 100, 0.5);
  return {
    left: `${Math.min(100, Math.max(0, leftPct))}%`,
    width: `${Math.min(100 - leftPct, widthPct)}%`,
  };
}
