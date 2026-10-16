import type { GanttTaskRow } from "../gantt/gantt-model.js";
import { formatVarianceMinutes } from "../gantt/format-schedule.js";

export type ScheduleException = {
  workNodeId: string;
  kind: "forecast_slip" | "actual_slip" | "cost_overrun";
  summary: string;
};

const FORECAST_SLIP_MINUTES = 60;
const COST_OVERRUN_MINOR = 1;

/** Exception-first slice: tasks with meaningful schedule or cost deviation vs baseline. */
export function detectScheduleExceptions(rows: GanttTaskRow[]): ScheduleException[] {
  const out: ScheduleException[] = [];
  for (const row of rows) {
    const forecast = row.forecastFinishVsBaselineMinutes;
    if (forecast != null && Math.abs(forecast) >= FORECAST_SLIP_MINUTES) {
      out.push({
        workNodeId: row.workNodeId,
        kind: "forecast_slip",
        summary: `Desviación de forecast ${formatVarianceMinutes(forecast)} en fin vs baseline.`,
      });
    }
    const actual = row.actualFinishVsBaselineMinutes;
    if (actual != null && Math.abs(actual) >= FORECAST_SLIP_MINUTES) {
      out.push({
        workNodeId: row.workNodeId,
        kind: "actual_slip",
        summary: `Desviación real ${formatVarianceMinutes(actual)} en fin vs baseline.`,
      });
    }
    const cost = row.actualCostVsBaselineMinor;
    if (cost != null && Math.abs(cost) >= COST_OVERRUN_MINOR) {
      out.push({
        workNodeId: row.workNodeId,
        kind: "cost_overrun",
        summary: `Desviación de coste vs baseline: ${cost} (unidad menor).`,
      });
    }
  }
  return out;
}
