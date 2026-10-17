import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { hrefWithProject, rememberActiveProjectId } from "../../lib/session/active-project.js";
import { useActiveProjectId } from "../../lib/session/use-active-project.js";
import { mapVarianceToRows } from "../gantt/gantt-model.js";
import { AskCommandPanel } from "./AskCommandPanel.js";
import { createControlTowerApi } from "./api.js";
import "./control-tower.css";
import { detectScheduleExceptions } from "./exceptions-model.js";
import { EventLogList, type EventLogRow } from "./EventLogList.js";
import { ExceptionsList } from "./ExceptionsList.js";
import { literalApiReason } from "./use-ask-command.js";

export type ControlPanelTab = "exceptions" | "event-log";

export function ControlTowerWorkspace() {
  const api = useMemo(() => createControlTowerApi(), []);
  const tabFieldsetId = useId();
  const activeProjectId = useActiveProjectId();
  const [tab, setTab] = useState<ControlPanelTab>("exceptions");
  const [exceptions, setExceptions] = useState<ReturnType<typeof detectScheduleExceptions>>([]);
  const [logEntries, setLogEntries] = useState<EventLogRow[]>([]);
  const [meta, setMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadProject = useCallback(
    async (id: string) => {
      setError(null);
      setBusy(true);
      try {
        rememberActiveProjectId(id);
        const [variance, log] = await Promise.all([
          api.getBaselineVariance(id),
          api.searchEventLog(id, { page: 1, pageSize: 50 }),
        ]);
        const rows = mapVarianceToRows(variance);
        const detected = detectScheduleExceptions(rows);
        setExceptions(detected);
        setLogEntries(log.items);
        setLoaded(true);
        setMeta(
          `Varianza v${variance.baselineVersion} · ${log.total} eventos en log · ${detected.length} excepciones`,
        );
      } catch (err) {
        setExceptions([]);
        setLogEntries([]);
        setMeta(null);
        setLoaded(false);
        setError(literalApiReason(err));
      } finally {
        setBusy(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!activeProjectId) {
      setExceptions([]);
      setLogEntries([]);
      setMeta(null);
      setLoaded(false);
      setError(null);
      return;
    }
    void loadProject(activeProjectId);
  }, [activeProjectId, loadProject]);

  return (
    <div className="ct">
      <nav className="ct-crosslink" aria-label="Mismo proyecto">
        <a href={hrefWithProject("#/projects", activeProjectId)}>Proyecto</a>
        <a href={hrefWithProject("#/projects/wbs", activeProjectId)}>Paquetes</a>
        <a href={hrefWithProject("#/projects/gantt", activeProjectId)}>Cronograma</a>
        <a href="#/my-work">Mi trabajo</a>
      </nav>

      <AskCommandPanel projectId={activeProjectId} />

      {!activeProjectId ? (
        <p className="ct-empty" role="status">
          Elegí un proyecto en <a href="#/projects">Proyectos</a>. El control usa ese mismo proyecto.
        </p>
      ) : null}
      {busy ? (
        <p className="ct-note" role="status">
          Cargando el control…
        </p>
      ) : null}
      {meta ? (
        <p className="ct-note" aria-live="polite">
          {meta}
        </p>
      ) : null}
      {error ? (
        <p className="ct-alert" role="alert">
          {error}
        </p>
      ) : null}

      <fieldset className="ct-fieldset ct-tabs" id={tabFieldsetId}>
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
            Registro
          </label>
        </div>
      </fieldset>

      {activeProjectId && !busy && tab === "exceptions" ? (
        <ExceptionsList items={exceptions} loaded={loaded} />
      ) : null}
      {activeProjectId && !busy && tab === "event-log" ? (
        <EventLogList entries={logEntries} loaded={loaded} />
      ) : null}
    </div>
  );
}
