import { FormEvent, useCallback, useId, useMemo, useState } from "react";
import { formatApiError } from "../project/format-api-error.js";
import "../project/project.css";
import "./control-tower.css";
import { mapVarianceToRows } from "../gantt/gantt-model.js";
import { AskCommandPanel } from "./AskCommandPanel.js";
import { createControlTowerApi } from "./api.js";
import { detectScheduleExceptions } from "./exceptions-model.js";
import { EventLogList, type EventLogRow } from "./EventLogList.js";
import { ExceptionsList } from "./ExceptionsList.js";

export type ControlPanelTab = "exceptions" | "event-log";

export function ControlTowerWorkspace() {
  const api = useMemo(() => createControlTowerApi(), []);
  const loadFormId = useId();
  const tabFieldsetId = useId();
  const [projectId, setProjectId] = useState("");
  const [tab, setTab] = useState<ControlPanelTab>("exceptions");
  const [exceptions, setExceptions] = useState<ReturnType<typeof detectScheduleExceptions>>([]);
  const [logEntries, setLogEntries] = useState<EventLogRow[]>([]);
  const [meta, setMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetFeedback = useCallback(() => setError(null), []);

  const onLoad = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    const id = projectId.trim();
    try {
      const [variance, log] = await Promise.all([
        api.getBaselineVariance(id),
        api.searchEventLog(id, { page: 1, pageSize: 50 }),
      ]);
      const rows = mapVarianceToRows(variance);
      const detected = detectScheduleExceptions(rows);
      setExceptions(detected);
      setLogEntries(log.items);
      setMeta(
        `Varianza v${variance.baselineVersion} · ${log.total} eventos en log · ${detected.length} excepciones`,
      );
    } catch (err) {
      setExceptions([]);
      setLogEntries([]);
      setMeta(null);
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="planner-forms">
      <nav className="planner-subnav" aria-label="Secciones de Project Control">
        <a href="#/my-work">My Work</a>
        <a href="#/projects/control" aria-current="page">Cockpit y log</a>
        <a href="#/projects/gantt">Gantt</a>
        <a href="#/projects">Proyecto</a>
      </nav>

      <p className="planner-muted">
        Project Control mínimo (WBS-2.7): cockpit de excepciones desde varianza de baseline y Project
        Event Log legible (REQ-097).
      </p>

      <AskCommandPanel projectId={projectId} onProjectIdChange={setProjectId} />

      <form id={loadFormId} onSubmit={onLoad}>
        <fieldset className="planner-fieldset" disabled={busy}>
          <legend>Cargar cockpit del proyecto</legend>
          <p className="planner-muted">
            Usa el ID de proyecto de Ask/Command:{" "}
            <code>{projectId.trim() || "(pendiente)"}</code>
          </p>
          <div className="planner-actions">
            <button type="submit" disabled={!projectId.trim()}>
              Cargar excepciones y log
            </button>
          </div>
        </fieldset>
      </form>

      {meta ? (
        <p className="planner-muted" aria-live="polite">
          {meta}
        </p>
      ) : null}
      {error ? (
        <p className="planner-error" role="alert">
          {error}
        </p>
      ) : null}

      <fieldset className="planner-fieldset ct-tabs" id={tabFieldsetId}>
        <legend>Vistas de control</legend>
        <div className="ct-tab-buttons" role="radiogroup" aria-label="Vista de control">
          <label>
            <input
              type="radio"
              name="control-tab"
              checked={tab === "exceptions"}
              onChange={() => setTab("exceptions")}
            />
            Excepciones
          </label>
          <label>
            <input
              type="radio"
              name="control-tab"
              checked={tab === "event-log"}
              onChange={() => setTab("event-log")}
            />
            Project Event Log
          </label>
        </div>
      </fieldset>

      {tab === "exceptions" ? <ExceptionsList items={exceptions} /> : null}
      {tab === "event-log" ? <EventLogList entries={logEntries} /> : null}
    </div>
  );
}
