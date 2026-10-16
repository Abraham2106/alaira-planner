import { FormEvent, useCallback, useId, useMemo, useState } from "react";
import { formatApiError } from "../project/format-api-error.js";
import "../project/project.css";
import "./gantt.css";
import { createGanttApi } from "./api.js";
import { GanttBars } from "./GanttBars.js";
import { GanttTable } from "./GanttTable.js";
import {
  computeTimelineBounds,
  mapVarianceToRows,
  type GanttTaskRow,
} from "./gantt-model.js";

export type ScheduleViewMode = "gantt" | "table";

export function GanttWorkspace() {
  const api = useMemo(() => createGanttApi(), []);
  const loadFormId = useId();
  const viewFieldsetId = useId();
  const [projectId, setProjectId] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("gantt");
  const [rows, setRows] = useState<GanttTaskRow[]>([]);
  const [meta, setMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bounds = useMemo(() => computeTimelineBounds(rows), [rows]);

  const resetFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const onLoadVariance = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const id = projectId.trim();
      const variance = await api.getBaselineVariance(id);
      const mapped = mapVarianceToRows(variance);
      setRows(mapped);
      setMeta(
        `Baseline v${variance.baselineVersion} · forecast v${variance.forecastVersion} · ${mapped.length} tareas`,
      );
      if (mapped.length === 0) {
        setSuccess("Sin tareas programables en la varianza (¿baseline aprobada?).");
      } else {
        setSuccess("Cronograma cargado desde API canónica (solo lectura; baseline inmutable).");
      }
    } catch (err) {
      setRows([]);
      setMeta(null);
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="planner-forms">
      <nav className="planner-subnav" aria-label="Secciones de proyectos">
        <a href="#/projects">Proyecto</a>
        <a href="#/projects/wbs">WBS y dependencias</a>
        <a href="#/projects/gantt" aria-current="page">
          Gantt y desviaciones
        </a>
      </nav>

      <p className="planner-muted">
        Vista de solo lectura: baseline, forecast y real desde{" "}
        <code>GET /baseline/variance</code>. No hay acciones para mutar baseline.
      </p>

      <form id={loadFormId} onSubmit={onLoadVariance}>
        <fieldset className="planner-fieldset" disabled={busy}>
          <legend>Cargar cronograma del proyecto</legend>
          <div className="planner-field-grid">
            <label htmlFor={`${loadFormId}-project`}>
              ID de proyecto
              <input
                id={`${loadFormId}-project`}
                name="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </div>
          <div className="planner-actions">
            <button type="submit">Cargar varianza</button>
          </div>
        </fieldset>
      </form>

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
