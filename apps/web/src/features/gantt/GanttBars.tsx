import { barStyle, type GanttTaskRow, type TimelineBounds } from "./gantt-model.js";
import { formatVarianceMinutes } from "./format-schedule.js";

type GanttBarsProps = {
  rows: GanttTaskRow[];
  bounds: TimelineBounds;
};

function Bar({
  kind,
  startMs,
  finishMs,
  bounds,
  workNodeId,
}: {
  kind: "baseline" | "forecast" | "actual";
  startMs: number | null;
  finishMs: number | null;
  bounds: TimelineBounds;
  workNodeId: string;
}) {
  const style = barStyle(startMs, finishMs, bounds);
  if (!style) return null;
  const labels = {
    baseline: "Baseline",
    forecast: "Forecast",
    actual: "Real",
  };
  return (
    <span
      className={`gantt-bar gantt-bar--${kind}`}
      style={{ left: style.left, width: style.width }}
      role="img"
      aria-label={`${labels[kind]} ${workNodeId}`}
    />
  );
}

export function GanttBars({ rows, bounds }: GanttBarsProps) {
  return (
    <div className="gantt-chart" role="list" aria-label="Diagrama de barras baseline, forecast y real">
      <div className="gantt-legend-inline" aria-hidden="true">
        <span>
          <i className="gantt-swatch" style={{ background: "#71717a" }} /> Baseline
        </span>
        <span>
          <i className="gantt-swatch" style={{ background: "#2563eb" }} /> Forecast
        </span>
        <span>
          <i className="gantt-swatch" style={{ background: "#16a34a" }} /> Real
        </span>
      </div>
      {rows.map((row) => (
        <div className="gantt-row" role="listitem" key={row.workNodeId}>
          <div className="gantt-row-label">
            <span>{row.workNodeId}</span>
            <div className="planner-muted" style={{ fontWeight: 400 }}>
              Δ forecast: {formatVarianceMinutes(row.forecastFinishVsBaselineMinutes)}
            </div>
          </div>
          <div className="gantt-track">
            <Bar
              kind="baseline"
              startMs={row.baselineStartMs}
              finishMs={row.baselineFinishMs}
              bounds={bounds}
              workNodeId={row.workNodeId}
            />
            <Bar
              kind="forecast"
              startMs={row.forecastStartMs}
              finishMs={row.forecastFinishMs}
              bounds={bounds}
              workNodeId={row.workNodeId}
            />
            <Bar
              kind="actual"
              startMs={row.actualStartMs}
              finishMs={row.actualFinishMs}
              bounds={bounds}
              workNodeId={row.workNodeId}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
