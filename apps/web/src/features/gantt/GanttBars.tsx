import { resolveDefaultLocale } from "../shell/datetime/format.js";
import { barStyle, type GanttTaskRow, type TimelineBounds } from "./gantt-model.js";
import { formatVarianceMinutes } from "./format-schedule.js";

type GanttBarsProps = {
  rows: GanttTaskRow[];
  bounds: TimelineBounds;
};

function withToday(bounds: TimelineBounds, nowMs: number): TimelineBounds {
  const startMs = Math.min(bounds.startMs, nowMs);
  const endMs = Math.max(bounds.endMs, nowMs);
  const spanMs = Math.max(endMs - startMs, 60 * 60 * 1000);
  return { startMs, endMs: startMs + spanMs, spanMs };
}

export function CriticalMark() {
  return (
    <span className="gantt-critical">
      <span className="gantt-critical-mark" aria-hidden="true" />
      Crítica
    </span>
  );
}

export function GanttLegend() {
  return (
    <ul className="gantt-legend" aria-label="Leyenda del cronograma">
      <li>
        <span className="gantt-swatch gantt-swatch--baseline" aria-hidden="true" />
        Baseline
      </li>
      <li>
        <span className="gantt-swatch gantt-swatch--forecast" aria-hidden="true" />
        Forecast
      </li>
      <li>
        <span className="gantt-swatch gantt-swatch--actual" aria-hidden="true" />
        Real
      </li>
      <li>
        <span className="gantt-critical-mark" aria-hidden="true" />
        Crítica
      </li>
    </ul>
  );
}

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
      draggable={false}
    />
  );
}

export function GanttBars({ rows, bounds }: GanttBarsProps) {
  const nowMs = Date.now();
  const scale = withToday(bounds, nowMs);
  const todayPct = ((nowMs - scale.startMs) / scale.spanMs) * 100;
  const todayLeft = `${todayPct}%`;
  const todayAlign = todayPct < 12 ? "start" : todayPct > 88 ? "end" : "center";
  const locale = resolveDefaultLocale();
  const today = new Date(nowMs);
  const todayLabel = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(today);

  return (
    <div className="gantt-chart">
      <div className="gantt-axis">
        <span />
        <div className="gantt-axis-track">
          <span className="gantt-today" style={{ left: todayLeft }} aria-hidden="true" />
          <span className="gantt-today-label" style={{ left: todayLeft }} data-align={todayAlign}>
            Hoy · <time dateTime={today.toISOString().slice(0, 10)}>{todayLabel}</time>
          </span>
        </div>
      </div>
      <div className="gantt-rows" role="list" aria-label="Diagrama de barras baseline, forecast y real">
        {rows.map((row) => (
          <div className="gantt-row" role="listitem" key={row.workNodeId}>
            <div className="gantt-row-label">
              <span className="gantt-id">{row.workNodeId}</span>
              {row.isCritical ? <CriticalMark /> : null}
              <div className="gantt-variance">
                Δ forecast: {formatVarianceMinutes(row.forecastFinishVsBaselineMinutes)}
              </div>
            </div>
            <div className="gantt-track">
              <span className="gantt-today" style={{ left: todayLeft }} aria-hidden="true" />
              <Bar
                kind="baseline"
                startMs={row.baselineStartMs}
                finishMs={row.baselineFinishMs}
                bounds={scale}
                workNodeId={row.workNodeId}
              />
              <Bar
                kind="forecast"
                startMs={row.forecastStartMs}
                finishMs={row.forecastFinishMs}
                bounds={scale}
                workNodeId={row.workNodeId}
              />
              <Bar
                kind="actual"
                startMs={row.actualStartMs}
                finishMs={row.actualFinishMs}
                bounds={scale}
                workNodeId={row.workNodeId}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
