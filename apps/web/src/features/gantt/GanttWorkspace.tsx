import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { hrefWithProject, rememberActiveProjectId } from "../../lib/session/active-project.js";
import { useActiveProjectId } from "../../lib/session/use-active-project.js";
import { formatApiError } from "../project/format-api-error.js";
import "../project/project.css";
import "./gantt.css";
import { createGanttApi } from "./api.js";
import { GanttBars, GanttLegend } from "./GanttBars.js";
import { GanttTable } from "./GanttTable.js";
import {
  computeTimelineBounds,
  mapVarianceToRows,
  type GanttTaskRow,
} from "./gantt-model.js";

export type ScheduleViewMode = "gantt" | "table";

export function GanttWorkspace() {
  const api = useMemo(() => createGanttApi(), []);
  const viewFieldsetId = useId();
  const activeProjectId = useActiveProjectId();
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("gantt");
  const [rows, setRows] = useState<GanttTaskRow[]>([]);
  const [meta, setMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const bounds = useMemo(() => computeTimelineBounds(rows), [rows]);

  const resetFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const loadVariance = useCallback(
    async (id: string) => {
      resetFeedback();
      setBusy(true);
      try {
        rememberActiveProjectId(id);
        const variance = await api.getBaselineVariance(id);
        const criticalIds = new Set<string>();
        if (typeof api.getScheduleForecast === "function") {
          try {
            const forecast = await api.getScheduleForecast(id);
            for (const workNodeId of forecast.criticalWorkNodeIds) {
              criticalIds.add(workNodeId);
            }
          } catch {
            /* La varianza sigue siendo el cronograma; sin forecast no hay marca crítica. */
          }
        }
        const mapped = mapVarianceToRows(variance).map((row) => ({
          ...row,
          isCritical: criticalIds.has(row.workNodeId),
        }));
        setRows(mapped);
        setLoaded(true);
        setMeta(
          `Baseline v${variance.baselineVersion} · forecast v${variance.forecastVersion} · ${mapped.length} tareas`,
        );
        if (mapped.length === 0) {
          setSuccess(null);
        } else {
          setSuccess("Cronograma cargado.");
        }
      } catch (err) {
        setRows([]);
        setMeta(null);
        setLoaded(false);
        setError(formatApiError(err));
      } finally {
        setBusy(false);
      }
    },
    [api, resetFeedback],
  );

  useEffect(() => {
    if (!activeProjectId) {
      setRows([]);
      setMeta(null);
      setLoaded(false);
      setError(null);
      setSuccess(null);
      return;
    }
    void loadVariance(activeProjectId);
  }, [activeProjectId, loadVariance]);

  return (
    <div className="planner-forms gantt-workspace">
      <nav className="planner-subnav" aria-label="Secciones de proyectos">
        <a href={hrefWithProject("#/projects", activeProjectId)}>Proyecto</a>
        <a href={hrefWithProject("#/projects/wbs", activeProjectId)}>Paquetes</a>
        <a href={hrefWithProject("#/projects/gantt", activeProjectId)} aria-current="page">
          Cronograma
        </a>
        <a href={hrefWithProject("#/projects/control", activeProjectId)}>Control</a>
      </nav>

      <p className="planner-muted">Solo lectura. Baseline, forecast y real siguen separados. El plan aprobado no se edita acá.</p>

      {!activeProjectId ? (
        <p className="planner-muted" role="status">
          Elegí un proyecto en <a href="#/projects">Proyectos</a>. El cronograma usa ese mismo proyecto.
        </p>
      ) : null}
      {busy ? (
        <p className="planner-muted" role="status">
          Cargando el cronograma…
        </p>
      ) : null}
      {meta ? (
        <p className="planner-muted" aria-live="polite">
          {meta}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="planner-error">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="planner-success">
          {success}
        </p>
      ) : null}

      <GanttLegend />

      {loaded && rows.length === 0 ? (
        <p className="planner-muted" role="status">
          No hay tareas en el cronograma.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <fieldset className="planner-fieldset" id={viewFieldsetId}>
            <legend>Vista del cronograma</legend>
            <div
              className="gantt-view-radios"
              role="radiogroup"
              aria-label="Alternar entre diagrama de barras y tabla"
            >
              <label>
                <input
                  type="radio"
                  name="scheduleView"
                  value="gantt"
                  checked={viewMode === "gantt"}
                  onChange={() => setViewMode("gantt")}
                />
                Diagrama de barras
              </label>
              <label>
                <input
                  type="radio"
                  name="scheduleView"
                  value="table"
                  checked={viewMode === "table"}
                  onChange={() => setViewMode("table")}
                />
                Tabla accesible
              </label>
            </div>
          </fieldset>

          {viewMode === "gantt" && bounds ? <GanttBars rows={rows} bounds={bounds} /> : null}
          {viewMode === "table" ? <GanttTable rows={rows} /> : null}
        </>
      ) : null}
    </div>
  );
}
