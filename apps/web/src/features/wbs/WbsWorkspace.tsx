import { FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { hrefWithProject, rememberActiveProjectId } from "../../lib/session/active-project.js";
import { useActiveProjectId } from "../../lib/session/use-active-project.js";
import { formatApiError } from "../project/format-api-error.js";
import "../project/project.css";
import { DeliverableActions } from "../workspace/DeliverableActions.js";
import {
  assembleFacts,
  classifyFailure,
  isNotFound,
  type AcceptanceFact,
  type NodeFact,
  type RollupFact,
} from "../workspace/work-facts.js";
import { createWorkApi } from "../workspace/work-api.js";
import { createWbsApi } from "./api.js";
import "../workspace/workspace.css";

type TreeNode = {
  id: string;
  nodeType: "work_package" | "deliverable" | "milestone";
  wbsCode: string;
  title: string;
  parentWorkNodeId: string | null;
};

const TYPE_LABEL: Record<TreeNode["nodeType"], string> = {
  work_package: "Paquete",
  deliverable: "Entregable",
  milestone: "Hito",
};

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

function lifecycleText(fact: NodeFact | undefined): string {
  const lifecycle = fact?.lifecycle;
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

export function WbsWorkspace() {
  const wbs = useMemo(() => createWbsApi(), []);
  const work = useMemo(() => createWorkApi(), []);
  const formId = useId();
  const activeProjectId = useActiveProjectId();
  const detail = useRef<HTMLDialogElement>(null);
  const [wbsCode, setWbsCode] = useState("1.1");
  const [nodeTitle, setNodeTitle] = useState("");
  const [parentWorkNodeId, setParentWorkNodeId] = useState("");
  const [reparentNodeId, setReparentNodeId] = useState("");
  const [reparentTargetId, setReparentTargetId] = useState("");
  const [linkSourceId, setLinkSourceId] = useState("");
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkKind, setLinkKind] = useState<"backlog_projection" | "goal">("backlog_projection");
  const [nodes, setNodes] = useState<TreeNode[] | null>(null);
  const [facts, setFacts] = useState<Record<string, NodeFact>>({});
  const [strategies, setStrategies] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<"session" | "forbidden" | "error">("error");
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refreshTree = useCallback(
    async (id: string) => {
      const tree = await work.listTree(id);
      const packages = tree.nodes.filter((node) => node.nodeType === "work_package");
      const deliverables = tree.nodes.filter((node) => node.nodeType === "deliverable");
      const rollups: RollupFact[] = [];
      const acceptance: AcceptanceFact[] = [];
      await Promise.all([
        ...packages.map(async (node) => {
          try {
            rollups.push(await work.getRollup(id, node.id));
          } catch (cause) {
            if (!isNotFound(cause)) throw cause;
          }
        }),
        ...deliverables.map(async (node) => {
          try {
            const state = await work.getAcceptanceState(id, node.id);
            acceptance.push({
              workNodeId: state.workNodeId,
              progressPercent: state.progressPercent,
              lifecycle: state.lifecycle,
            });
          } catch (cause) {
            if (!isNotFound(cause)) throw cause;
          }
        }),
      ]);
      let people: { id: string; displayName: string }[] = [];
      let assignments: { workNodeId: string; personId: string }[] = [];
      try {
        const [peoplePage, assignmentPage] = await Promise.all([
          work.listPeople(id),
          work.listAssignments(id),
        ]);
        people = peoplePage.people;
        assignments = assignmentPage.assignments;
      } catch (cause) {
        if (!isNotFound(cause)) {
          setSuccess(null);
          setError(formatApiError(cause));
        }
      }
      setNodes(tree.nodes);
      setFacts(assembleFacts({ nodes: tree.nodes, rollups, acceptance, assignments, people }));
    },
    [work],
  );

  useEffect(() => {
    if (!activeProjectId) {
      setNodes(null);
      setFacts({});
      return;
    }
    rememberActiveProjectId(activeProjectId);
    let cancelled = false;
    setBusy(true);
    setError(null);
    void refreshTree(activeProjectId)
      .catch((err: unknown) => {
        if (cancelled) return;
        setNodes(null);
        setFacts({});
        setFailure(classifyFailure(err));
        setError(formatApiError(err));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, refreshTree, reloadKey]);

  const onCreateNode = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeProjectId) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const created = await wbs.createPackage(activeProjectId, {
        wbsCode: wbsCode.trim(),
        title: nodeTitle.trim(),
        ...(parentWorkNodeId ? { parentWorkNodeId } : {}),
      });
      setSuccess(`Nodo WBS creado: ${created.title}`);
      setNodeTitle("");
      await refreshTree(activeProjectId);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onReparent = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeProjectId) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await wbs.reparentNode(activeProjectId, reparentNodeId, reparentTargetId);
      setSuccess("Dependencia jerárquica actualizada.");
      await refreshTree(activeProjectId);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onProjectionLink = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeProjectId) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await wbs.createProjectionLink(activeProjectId, {
        sourceWorkNodeId: linkSourceId,
        targetWorkNodeId: linkTargetId,
        linkKind,
      });
      setSuccess("Enlace de proyección creado.");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

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

  const byId = useMemo(() => new Map((nodes ?? []).map((node) => [node.id, node])), [nodes]);
  const orderedNodes = useMemo(() => {
    if (!nodes) return [];
    return [...nodes].sort((a, b) => a.wbsCode.localeCompare(b.wbsCode, "es", { numeric: true }));
  }, [nodes]);

  return (
    <div className="planner-forms" data-testid="wbs-workspace" aria-busy={busy}>
      <nav className="planner-subnav" aria-label="Secciones de proyectos">
        <a href={hrefWithProject("#/projects", activeProjectId)}>Proyecto</a>
        <a href={hrefWithProject("#/projects/wbs", activeProjectId)} aria-current="page">
          Paquetes
        </a>
        <a href={hrefWithProject("#/projects/gantt", activeProjectId)}>Cronograma</a>
        <a href={hrefWithProject("#/projects/control", activeProjectId)}>Control</a>
      </nav>

      {error ? (
        <p className="planner-alert planner-alert--error" role="alert">
          {failure === "forbidden"
            ? "No tienes permiso."
            : failure === "session"
              ? "No hay sesión activa."
              : null}{" "}
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="planner-alert planner-alert--success" role="status">
          {success}
        </p>
      ) : null}

      <h2>Árbol WBS del proyecto</h2>
      {!activeProjectId ? (
        <p className="planner-muted">
          Elegí un proyecto en <a href="#/projects">Proyectos</a>. Esta pantalla usa ese mismo
          proyecto.
        </p>
      ) : busy && !nodes ? (
        <p className="planner-muted" role="status">
          Cargando el árbol…
        </p>
      ) : (
        <div className="wbs-grid-wrap">
          <table className="wbs-grid" aria-label="Grilla WBS">
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Nombre</th>
                <th scope="col">Tipo</th>
                <th scope="col">Responsable</th>
                <th scope="col">Estrategia</th>
                <th scope="col">Peso</th>
                <th scope="col">Avance</th>
                <th scope="col">Ciclo</th>
              </tr>
            </thead>
            <tbody>
              {orderedNodes.length === 0 ? (
                <tr>
                  <td className="wbs-empty" colSpan={8}>
                    El árbol está vacío. Creá un paquete para verlo en la grilla.
                  </td>
                </tr>
              ) : (
                orderedNodes.map((node) => {
                  const fact = facts[node.id];
                  const depth = depthOf(node, byId);
                  const strategy = strategies[node.id];
                  return (
                    <tr key={node.id}>
                      <td className="wbs-code">{node.wbsCode}</td>
                      <td className="wbs-name" data-depth={Math.min(depth, 4)}>
                        <button type="button" onClick={() => setSelected(node)}>
                          {node.title}
                        </button>
                      </td>
                      <td>{TYPE_LABEL[node.nodeType]}</td>
                      <td>
                        {fact?.responsibleName ?? (
                          <span className="fact-missing">Sin dato del servidor</span>
                        )}
                      </td>
                      <td>
                        {strategy ? (
                          <span className="fact-confirmed">
                            Confirmada al guardar: {strategy}. La API no la devuelve al leer.
                          </span>
                        ) : (
                          <span className="fact-missing">Sin dato del servidor</span>
                        )}
                      </td>
                      <td>
                        {fact?.weight == null ? (
                          <span className="fact-missing">Sin peso devuelto</span>
                        ) : (
                          fact.weight
                        )}
                      </td>
                      <td>
                        <output className="wbs-progress-lock" aria-label={`Avance de ${node.wbsCode}`}>
                          {fact?.progressPercent == null ? "Sin avance del motor" : `${fact.progressPercent}%`}
                        </output>
                      </td>
                      <td>{lifecycleText(fact)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="planner-muted">
        El avance visible es el del motor. Responsable, estrategia y peso no se muestran como
        guardados si la API no los devuelve.
      </p>

      <form onSubmit={onCreateNode}>
        <fieldset className="planner-fieldset" disabled={busy || !activeProjectId}>
          <legend>Crear paquete</legend>
          <div className="planner-field-grid">
            <label htmlFor={`${formId}-wbs-code`}>
              Código WBS
              <input
                id={`${formId}-wbs-code`}
                name="wbsCode"
                required
                value={wbsCode}
                onChange={(event) => setWbsCode(event.target.value)}
              />
            </label>
            <label htmlFor={`${formId}-node-title`}>
              Nombre
              <input
                id={`${formId}-node-title`}
                name="title"
                required
                maxLength={256}
                value={nodeTitle}
                onChange={(event) => setNodeTitle(event.target.value)}
              />
            </label>
            <label htmlFor={`${formId}-parent-id`}>
              Padre
              <select
                id={`${formId}-parent-id`}
                name="parentWorkNodeId"
                value={parentWorkNodeId}
                onChange={(event) => setParentWorkNodeId(event.target.value)}
              >
                <option value="">Sin padre</option>
                {(nodes ?? []).map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.wbsCode} {node.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="planner-actions">
            <button type="submit" disabled={busy || !activeProjectId}>
              Crear paquete
            </button>
          </div>
        </fieldset>
      </form>

      <div className="wbs-deps">
        <form onSubmit={onReparent}>
          <fieldset className="planner-fieldset" disabled={busy || !activeProjectId}>
            <legend>Dependencia jerárquica</legend>
            <div className="planner-field-grid">
              <label htmlFor={`${formId}-reparent-node`}>
                Nodo hijo
                <select
                  id={`${formId}-reparent-node`}
                  required
                  value={reparentNodeId}
                  onChange={(event) => setReparentNodeId(event.target.value)}
                >
                  <option value="">Elegí un nodo</option>
                  {(nodes ?? []).map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.wbsCode} {node.title}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={`${formId}-reparent-target`}>
                Nuevo padre
                <select
                  id={`${formId}-reparent-target`}
                  required
                  value={reparentTargetId}
                  onChange={(event) => setReparentTargetId(event.target.value)}
                >
                  <option value="">Elegí un padre</option>
                  {(nodes ?? []).map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.wbsCode} {node.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="planner-actions">
              <button type="submit" disabled={busy || !activeProjectId}>
                Actualizar padre
              </button>
            </div>
          </fieldset>
        </form>

        <form onSubmit={onProjectionLink}>
          <fieldset className="planner-fieldset" disabled={busy || !activeProjectId}>
            <legend>Dependencia de proyección</legend>
            <div className="planner-field-grid">
              <label htmlFor={`${formId}-link-source`}>
                Origen
                <select
                  id={`${formId}-link-source`}
                  required
                  value={linkSourceId}
                  onChange={(event) => setLinkSourceId(event.target.value)}
                >
                  <option value="">Elegí un origen</option>
                  {(nodes ?? []).map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.wbsCode} {node.title}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={`${formId}-link-target`}>
                Destino
                <select
                  id={`${formId}-link-target`}
                  required
                  value={linkTargetId}
                  onChange={(event) => setLinkTargetId(event.target.value)}
                >
                  <option value="">Elegí un destino</option>
                  {(nodes ?? []).map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.wbsCode} {node.title}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={`${formId}-link-kind`}>
                Tipo
                <select
                  id={`${formId}-link-kind`}
                  value={linkKind}
                  onChange={(event) =>
                    setLinkKind(event.target.value as "backlog_projection" | "goal")
                  }
                >
                  <option value="backlog_projection">Proyección backlog</option>
                  <option value="goal">Objetivo</option>
                </select>
              </label>
            </div>
            <div className="planner-actions">
              <button type="submit" disabled={busy || !activeProjectId}>
                Crear enlace
              </button>
            </div>
          </fieldset>
        </form>
      </div>

      <dialog ref={detail} className="app-dialog detail-drawer" aria-labelledby="wbs-node-title">
        {selected && activeProjectId ? (
          <>
            <div className="dialog-head">
              <span>{selected.wbsCode}</span>
              <button type="button" aria-label="Cerrar detalle" onClick={() => detail.current?.close()}>
                Cerrar
              </button>
            </div>
            <h2 id="wbs-node-title">{selected.title}</h2>
            <DeliverableActions
              projectId={activeProjectId}
              node={selected}
              confirmedStrategy={strategies[selected.id] ?? null}
              onChanged={() => setReloadKey((value) => value + 1)}
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
