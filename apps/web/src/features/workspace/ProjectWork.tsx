import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hrefWithProject } from "../../lib/session/active-project.js";
import { useActiveProjectId } from "../../lib/session/use-active-project.js";
import { createGanttApi } from "../gantt/api.js";
import { GanttBars, GanttLegend } from "../gantt/GanttBars.js";
import { computeTimelineBounds, mapVarianceToRows, type GanttTaskRow } from "../gantt/gantt-model.js";
import "../gantt/gantt.css";
import { formatApiError } from "../project/format-api-error.js";
import { Icon } from "../shell/Icon.js";
import { DeliverableActions, type ActionNode } from "./DeliverableActions.js";
import {
  assembleFacts,
  classifyFailure,
  isNotFound,
  projectProgressPercent,
  type AcceptanceFact,
  type LifecycleFact,
  type NodeFact,
  type RollupFact,
  type WorkNodeRef,
} from "./work-facts.js";
import { createWorkApi } from "./work-api.js";
import "./workspace.css";

type TreeNode = WorkNodeRef & { wbsCode: string; title: string };
type View = "list" | "timeline";
type LoadState = "idle" | "loading" | "ready" | "error";

const TYPE_LABEL: Record<TreeNode["nodeType"], string> = {
  work_package: "Paquete",
  deliverable: "Entregable",
  milestone: "Hito",
};

const MODE_LABEL: Record<string, string> = {
  predictive: "Predictivo",
  scrum: "Scrum",
  kanban: "Kanban",
  hybrid: "Híbrido",
};

function lifecycleText(lifecycle: LifecycleFact | null): string {
  if (!lifecycle) return "Sin ciclo devuelto";
  const execution =
    lifecycle.executionStatus === "execution_complete" ? "Ejecución completa" : "En ejecución";
  const request =
    lifecycle.completionRequestStatus === "pending"
      ? "Solicitud pendiente"
      : lifecycle.completionRequestStatus === "withdrawn"
        ? "Solicitud retirada"
        : "Sin solicitud";
  const acceptance =
    lifecycle.acceptanceStatus === "accepted"
      ? "Aceptado"
      : lifecycle.acceptanceStatus === "rejected"
        ? "Rechazado"
        : "Sin aceptar";
  return `${execution} · ${request} · ${acceptance}`;
}

function percentText(value: number | null): string {
  if (value === null) return "Sin avance del motor";
  return `${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 0 }).format(value)}%`;
}

function depthOf(node: TreeNode, byId: Map<string, TreeNode>): number {
  let depth = 0;
  let parentId = node.parentWorkNodeId;
  const seen = new Set<string>([node.id]);
  while (parentId && !seen.has(parentId)) {
    const parent = byId.get(parentId);
    if (!parent) break;
    seen.add(parentId);
    depth += 1;
    parentId = parent.parentWorkNodeId;
  }
  return depth;
}

export function ProjectWork({ mode = "project" }: { mode?: "project" | "decisions" }) {
  const api = useMemo(() => createWorkApi(), []);
  const projectId = useActiveProjectId();
  const detail = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>("list");
  const [phase, setPhase] = useState<LoadState>("idle");
  const [failure, setFailure] = useState<"session" | "forbidden" | "error">("error");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [name, setName] = useState("");
  const [planningMode, setPlanningMode] = useState("");
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [facts, setFacts] = useState<Record<string, NodeFact>>({});
  const [strategies, setStrategies] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!projectId) {
      setPhase("idle");
      setNodes([]);
      setFacts({});
      setName("");
      setError("");
      return;
    }
    let cancelled = false;
    setPhase("loading");
    setError("");
    setWarning("");
    void (async () => {
      try {
        const [project, tree] = await Promise.all([
          api.getProject(projectId),
          api.listTree(projectId),
        ]);
        const [peopleOutcome, assignmentOutcome] = await Promise.allSettled([
          api.listPeople(projectId),
          api.listAssignments(projectId),
        ]);
        const packages = tree.nodes.filter((node) => node.nodeType === "work_package");
        const deliverables = tree.nodes.filter((node) => node.nodeType === "deliverable");
        const rollups: RollupFact[] = [];
        const acceptance: AcceptanceFact[] = [];
        const rowWarnings: string[] = [];
        await Promise.all([
          ...packages.map(async (node) => {
            try {
              rollups.push(await api.getRollup(projectId, node.id));
            } catch (cause) {
              if (!isNotFound(cause)) rowWarnings.push(formatApiError(cause));
            }
          }),
          ...deliverables.map(async (node) => {
            try {
              const state = await api.getAcceptanceState(projectId, node.id);
              acceptance.push({
                workNodeId: state.workNodeId,
                progressPercent: state.progressPercent,
                lifecycle: state.lifecycle,
              });
            } catch (cause) {
              if (!isNotFound(cause)) rowWarnings.push(formatApiError(cause));
            }
          }),
        ]);
        if (cancelled) return;
        const people = peopleOutcome.status === "fulfilled" ? peopleOutcome.value.people : [];
        const assignments =
          assignmentOutcome.status === "fulfilled" ? assignmentOutcome.value.assignments : [];
        if (peopleOutcome.status === "rejected") {
          rowWarnings.push(formatApiError(peopleOutcome.reason));
        } else if (assignmentOutcome.status === "rejected") {
          rowWarnings.push(formatApiError(assignmentOutcome.reason));
        }
        setName(project.name);
        setPlanningMode(project.deliveryProfile.planningMode);
        setNodes(tree.nodes);
        setFacts(
          assembleFacts({
            nodes: tree.nodes,
            rollups,
            acceptance,
            assignments,
            people,
          }),
        );
        setWarning(rowWarnings[0] ?? "");
        setPhase("ready");
      } catch (cause) {
        if (cancelled) return;
        setNodes([]);
        setFacts({});
        setName("");
        setFailure(classifyFailure(cause));
        setError(formatApiError(cause));
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, projectId, reloadKey]);

  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const progress = projectProgressPercent(nodes, facts);
  const ordered = useMemo(
    () => [...nodes].sort((a, b) => a.wbsCode.localeCompare(b.wbsCode, "es", { numeric: true })),
    [nodes],
  );
  const visible =
    mode === "decisions"
      ? ordered.filter((node) => facts[node.id]?.lifecycle?.completionRequestStatus === "pending")
      : ordered;

  useEffect(() => {
    const dialog = detail.current;
    if (!selected || !dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
        if (dialog.open) return;
      } catch {
        /* Fall back to the open attribute. */
      }
    }
    dialog.open = true;
  }, [selected]);

  const open = (node: TreeNode) => {
    setSelected(node);
  };

  if (!projectId) {
    return (
      <div className="work-hub">
        <div className="hub-empty">
          <Icon name="folder" size={34} />
          <h2>{mode === "decisions" ? "Mi trabajo" : "Elegí un proyecto"}</h2>
          <p>
            {mode === "decisions"
              ? "No hay una cola personal en el servidor. Abrí un proyecto para ver sus solicitudes de finalización."
              : "El trabajo de esta pantalla es el de tu proyecto activo. El ejemplo ilustrativo está aparte."}
          </p>
          <a className="hub-button primary" href="#/projects">
            Ir a mis proyectos
            <Icon name="arrow" size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="work-hub" aria-busy={phase === "loading"}>
      <div className="hub-heading">
        <div className="hub-project-icon">
          <Icon name={mode === "decisions" ? "tasks" : "grid"} size={27} />
        </div>
        <div className="hub-title-block">
          <div className="hub-kicker">{mode === "decisions" ? "SOLICITUDES" : "PROYECTO ACTIVO"}</div>
          <h2>{mode === "decisions" ? "Mi trabajo" : name || "Proyecto"}</h2>
          <p>
            {mode === "decisions"
              ? "Entregables con una solicitud de finalización pendiente."
              : "Lista y cronograma del mismo proyecto. El avance sale del motor."}
          </p>
        </div>
      </div>
      {planningMode ? (
        <p className="project-meta-line">
          <span className="meta-method">{MODE_LABEL[planningMode] ?? planningMode}</span>
        </p>
      ) : null}
      {mode === "project" ? (
        <div className="hub-metrics" aria-label="Avance del motor">
          <div className="metric-progress">
            <span>Avance del motor</span>
            <div>
              <strong data-testid="project-progress">
                {progress === null ? "—" : percentText(progress)}
              </strong>
            </div>
            <small>
              {progress === null
                ? "Hace falta un único paquete raíz con rollup. No se promedian las raíces."
                : "Hojas, pesos y estrategias que devolvió el motor."}
            </small>
          </div>
        </div>
      ) : null}
      {mode === "project" ? (
        <div className="hub-view-line">
          <nav aria-label="Vistas del proyecto" className="hub-view-tabs">
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
              <Icon name="list" size={17} />
              Lista
            </button>
            <button
              type="button"
              aria-pressed={view === "timeline"}
              onClick={() => setView("timeline")}
            >
              <Icon name="chart" size={17} />
              Cronograma
            </button>
          </nav>
          <a href={hrefWithProject("#/projects/wbs", projectId)}>Paquetes</a>
          <a href={hrefWithProject("#/projects/gantt", projectId)}>Cronograma completo</a>
          <a href={hrefWithProject("#/projects/control", projectId)}>Control</a>
        </div>
      ) : null}
      {phase === "loading" ? (
        <p className="directory-status" role="status">
          Cargando el proyecto…
        </p>
      ) : null}
      {phase === "error" ? (
        <div className="directory-error" role="alert">
          <Icon name="help" size={20} />
          <span>
            {failure === "forbidden"
              ? "No tienes permiso."
              : failure === "session"
                ? "No hay sesión activa."
                : "No se pudo leer el proyecto."}{" "}
            {error}
          </span>
          {failure === "session" ? (
            <a className="hub-button" href="#/entrar">
              Iniciar sesión
            </a>
          ) : (
            <a className="hub-button" href="#/projects">
              Volver a proyectos
            </a>
          )}
        </div>
      ) : null}
      {warning ? (
        <p className="directory-error" role="alert">
          {warning}
        </p>
      ) : null}
      {phase === "ready" && view === "list" ? (
        visible.length === 0 ? (
          <div className="hub-empty">
            <Icon name="folder" size={32} />
            <h3>
              {mode === "decisions"
                ? "No hay solicitudes de finalización pendientes"
                : "Este proyecto todavía no tiene nodos"}
            </h3>
            <p>
              {mode === "decisions"
                ? "Cuando un entregable pida finalización, aparece acá."
                : "Creá un paquete en la estructura de trabajo."}
            </p>
            {mode === "project" ? (
              <a className="hub-button" href={hrefWithProject("#/projects/wbs", projectId)}>
                Abrir paquetes
              </a>
            ) : null}
          </div>
        ) : (
          <div className="work-table-wrap" role="region" aria-label="Trabajo del proyecto" tabIndex={0}>
            <table className="work-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Responsable</th>
                  <th scope="col">Peso</th>
                  <th scope="col">Avance</th>
                  <th scope="col">Ciclo</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((node) => {
                  const fact = facts[node.id];
                  const depth = depthOf(node, byId);
                  return (
                    <tr key={node.id}>
                      <th scope="row">
                        <button type="button" className="work-name" onClick={() => open(node)}>
                          <span style={{ paddingLeft: `${Math.min(depth, 4) * 12}px` }}>
                            {node.title}
                            <small>{node.wbsCode}</small>
                          </span>
                        </button>
                      </th>
                      <td>{TYPE_LABEL[node.nodeType]}</td>
                      <td>
                        {fact?.responsibleName ? (
                          <span className="fact-confirmed">{fact.responsibleName}</span>
                        ) : (
                          <span className="fact-missing">Sin dato del servidor</span>
                        )}
                      </td>
                      <td>
                        {fact?.weight == null ? (
                          <span className="fact-missing">Sin peso devuelto</span>
                        ) : (
                          <span className="fact-confirmed">{fact.weight}</span>
                        )}
                      </td>
                      <td>{percentText(fact?.progressPercent ?? null)}</td>
                      <td>{lifecycleText(fact?.lifecycle ?? null)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : null}
      {phase === "ready" && mode === "project" && view === "timeline" ? (
        <SchedulePane projectId={projectId} />
      ) : null}
      <dialog ref={detail} className="app-dialog detail-drawer" aria-labelledby="node-action-title">
        {selected ? (
          <>
            <div className="dialog-head">
              <span className="task-id">{selected.wbsCode}</span>
              <button type="button" aria-label="Cerrar detalle" onClick={() => detail.current?.close()}>
                <Icon name="close" />
              </button>
            </div>
            <h2 id="node-action-title">{selected.title}</h2>
            <p className="fact-missing">{TYPE_LABEL[selected.nodeType]}</p>
            <DeliverableActions
              projectId={projectId}
              node={selected satisfies ActionNode}
              confirmedStrategy={strategies[selected.id] ?? null}
              onChanged={reload}
              onStrategyConfirmed={(strategyKind) =>
                setStrategies((current) => ({ ...current, [selected.id]: strategyKind }))
              }
            />
          </>
        ) : null}
      </dialog>
    </div>
  );
}

function SchedulePane({ projectId }: { projectId: string }) {
  const api = useMemo(() => createGanttApi(), []);
  const [rows, setRows] = useState<GanttTaskRow[] | null>(null);
  const [meta, setMeta] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError("");
    void (async () => {
      try {
        const variance = await api.getBaselineVariance(projectId);
        const criticalIds = new Set<string>();
        if (typeof api.getScheduleForecast === "function") {
          try {
            const forecast = await api.getScheduleForecast(projectId);
            for (const workNodeId of forecast.criticalWorkNodeIds) criticalIds.add(workNodeId);
          } catch {
            /* Sin forecast no hay marca crítica. Baseline y real siguen. */
          }
        }
        if (cancelled) return;
        const mapped = mapVarianceToRows(variance).map((row) => ({
          ...row,
          isCritical: criticalIds.has(row.workNodeId),
        }));
        setRows(mapped);
        setMeta(`Baseline v${variance.baselineVersion} · forecast v${variance.forecastVersion}`);
      } catch (cause) {
        if (cancelled) return;
        setRows(null);
        setError(formatApiError(cause));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, projectId]);

  const bounds = useMemo(() => computeTimelineBounds(rows ?? []), [rows]);

  if (busy) {
    return (
      <p className="directory-status" role="status">
        Cargando el cronograma…
      </p>
    );
  }
  if (error) {
    return (
      <p className="directory-error" role="alert">
        {error}
      </p>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <div className="hub-empty">
        <h3>No hay tareas en el cronograma</h3>
        <p>Baseline, forecast y real aparecen cuando el proyecto tiene varianza.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="hub-muted">{meta}</p>
      <GanttLegend />
      {bounds ? <GanttBars rows={rows} bounds={bounds} /> : null}
    </div>
  );
}
