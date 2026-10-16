import { FormEvent, useCallback, useId, useMemo, useState } from "react";
import { formatApiError } from "../project/format-api-error.js";
import "../project/project.css";
import "./control-tower.css";
import { AskCommandPanel } from "./AskCommandPanel.js";
import { createControlTowerApi } from "./api.js";
import { EventLogList, type EventLogRow } from "./EventLogList.js";

export function MyWorkWorkspace() {
  const api = useMemo(() => createControlTowerApi(), []);
  const loadFormId = useId();
  const [projectId, setProjectId] = useState("");
  const [recentLog, setRecentLog] = useState<EventLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetFeedback = useCallback(() => setError(null), []);

  const onLoadRecent = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    const id = projectId.trim();
    try {
      const log = await api.searchEventLog(id, { page: 1, pageSize: 15 });
      setRecentLog(log.items);
    } catch (err) {
      setRecentLog([]);
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="planner-forms">
      <nav className="planner-subnav" aria-label="Secciones de My Work">
        <a href="#/my-work" aria-current="page">My Work</a>
        <a href="#/projects/control">Project Control</a>
        <a href="#/projects">Proyectos</a>
      </nav>

      <p className="planner-muted">
        Cola personal mínima: confirma propuestas de IA vía Ask/Command y revisa actividad reciente
        en el Project Event Log.
      </p>

      <AskCommandPanel projectId={projectId} onProjectIdChange={setProjectId} />

      <form id={loadFormId} onSubmit={onLoadRecent}>
        <fieldset className="planner-fieldset" disabled={busy}>
          <legend>Actividad reciente en tu proyecto</legend>
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
            <button type="submit">Cargar eventos recientes</button>
          </div>
        </fieldset>
      </form>

      {error ? (
        <p className="planner-error" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-labelledby={`${loadFormId}-recent-title`}>
        <h2 className="ct-section-title" id={`${loadFormId}-recent-title`}>
          Necesita tu atención (log)
        </h2>
        <EventLogList entries={recentLog} />
      </section>
    </div>
  );
}
