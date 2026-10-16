import { FormEvent, useCallback, useId, useMemo, useState } from "react";
import { formatApiError } from "../project/format-api-error.js";
import "../project/project.css";
import { createWbsApi } from "./api.js";

export function WbsWorkspace() {
  const api = useMemo(() => createWbsApi(), []);
  const formId = useId();
  const [projectId, setProjectId] = useState("");
  const [wbsCode, setWbsCode] = useState("1.1");
  const [nodeTitle, setNodeTitle] = useState("");
  const [parentWorkNodeId, setParentWorkNodeId] = useState("");
  const [reparentNodeId, setReparentNodeId] = useState("");
  const [reparentTargetId, setReparentTargetId] = useState("");
  const [linkSourceId, setLinkSourceId] = useState("");
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkKind, setLinkKind] = useState<"backlog_projection" | "goal">("backlog_projection");
  const [treeSummary, setTreeSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshTree = useCallback(
    async (id: string) => {
      const tree = await api.listTree(id);
      if (tree.nodes.length === 0) {
        setTreeSummary("Árbol vacío: crea un paquete WBS.");
      } else {
        setTreeSummary(
          tree.nodes
            .map(
              (n) =>
                `${n.wbsCode} · ${n.title} · ${n.nodeType} · ${n.id}${
                  n.parentWorkNodeId ? ` → padre ${n.parentWorkNodeId}` : ""
                }`,
            )
            .join("\n"),
        );
      }
    },
    [api],
  );

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const onLoadTree = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      await refreshTree(projectId.trim());
      setSuccess("Árbol WBS cargado.");
    } catch (err) {
      setTreeSummary(null);
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onCreateNode = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const id = projectId.trim();
      const created = await api.createPackage(id, {
        wbsCode: wbsCode.trim(),
        title: nodeTitle.trim(),
        ...(parentWorkNodeId.trim() ? { parentWorkNodeId: parentWorkNodeId.trim() } : {}),
      });
      setSuccess(`Nodo WBS creado: ${created.title} (${created.id})`);
      await refreshTree(id);
      setNodeTitle("");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onReparent = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const id = projectId.trim();
      await api.reparentNode(id, reparentNodeId.trim(), reparentTargetId.trim());
      setSuccess("Dependencia jerárquica actualizada (reparent).");
      await refreshTree(id);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onProjectionLink = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const id = projectId.trim();
      await api.createProjectionLink(id, {
        sourceWorkNodeId: linkSourceId.trim(),
        targetWorkNodeId: linkTargetId.trim(),
        linkKind,
      });
      setSuccess("Enlace de proyección creado.");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="planner-forms" data-testid="wbs-workspace">
      <nav className="planner-subnav" aria-label="Secciones de proyectos">
        <a href="#/projects">Proyecto</a>
        <a href="#/projects/wbs" aria-current="page">
          WBS y dependencias
        </a>
      </nav>

      {error ? (
        <p className="planner-alert planner-alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="planner-alert planner-alert--success" role="status">
          {success}
        </p>
      ) : null}

      <form
        id={formId}
        className="planner-fieldset"
        aria-labelledby={`${formId}-legend`}
        onSubmit={onLoadTree}
      >
        <legend id={`${formId}-legend`}>Árbol WBS del proyecto</legend>
        <div className="planner-field-grid">
          <label htmlFor={`${formId}-project-id`}>
            ID de proyecto
            <input
              id={`${formId}-project-id`}
              name="projectId"
              required
              minLength={4}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
        <div className="planner-actions">
          <button type="submit" disabled={busy}>
            Cargar árbol
          </button>
        </div>
        {treeSummary ? (
          <pre className="planner-muted" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {treeSummary}
          </pre>
        ) : null}
      </form>

      <form className="planner-fieldset" aria-label="Crear nodo WBS" onSubmit={onCreateNode}>
        <legend>Crear paquete WBS</legend>
        <div className="planner-field-grid">
          <label htmlFor={`${formId}-wbs-code`}>
            Código WBS
            <input
              id={`${formId}-wbs-code`}
              name="wbsCode"
              required
              value={wbsCode}
              onChange={(e) => setWbsCode(e.target.value)}
            />
          </label>
          <label htmlFor={`${formId}-node-title`}>
            Título
            <input
              id={`${formId}-node-title`}
              name="title"
              required
              maxLength={256}
              value={nodeTitle}
              onChange={(e) => setNodeTitle(e.target.value)}
            />
          </label>
          <label htmlFor={`${formId}-parent-id`}>
            Padre (`wkn_…`, opcional)
            <input
              id={`${formId}-parent-id`}
              name="parentWorkNodeId"
              value={parentWorkNodeId}
              onChange={(e) => setParentWorkNodeId(e.target.value)}
            />
          </label>
        </div>
        <div className="planner-actions">
          <button type="submit" disabled={busy || !projectId.trim()}>
            Crear nodo vía API
          </button>
        </div>
      </form>

      <form className="planner-fieldset" aria-label="Reparentar nodo" onSubmit={onReparent}>
        <legend>Dependencia jerárquica (reparent)</legend>
        <div className="planner-field-grid">
          <label htmlFor={`${formId}-reparent-node`}>
            Nodo hijo
            <input
              id={`${formId}-reparent-node`}
              required
              value={reparentNodeId}
              onChange={(e) => setReparentNodeId(e.target.value)}
            />
          </label>
          <label htmlFor={`${formId}-reparent-target`}>
            Nuevo padre
            <input
              id={`${formId}-reparent-target`}
              required
              value={reparentTargetId}
              onChange={(e) => setReparentTargetId(e.target.value)}
            />
          </label>
        </div>
        <div className="planner-actions">
          <button type="submit" disabled={busy || !projectId.trim()}>
            Actualizar padre
          </button>
        </div>
      </form>

      <form
        className="planner-fieldset"
        aria-label="Enlace de proyección"
        onSubmit={onProjectionLink}
      >
        <legend>Dependencia de proyección</legend>
        <div className="planner-field-grid">
          <label htmlFor={`${formId}-link-source`}>
            Origen
            <input
              id={`${formId}-link-source`}
              required
              value={linkSourceId}
              onChange={(e) => setLinkSourceId(e.target.value)}
            />
          </label>
          <label htmlFor={`${formId}-link-target`}>
            Destino
            <input
              id={`${formId}-link-target`}
              required
              value={linkTargetId}
              onChange={(e) => setLinkTargetId(e.target.value)}
            />
          </label>
          <label htmlFor={`${formId}-link-kind`}>
            Tipo
            <select
              id={`${formId}-link-kind`}
              value={linkKind}
              onChange={(e) => setLinkKind(e.target.value as "backlog_projection" | "goal")}
            >
              <option value="backlog_projection">Proyección backlog</option>
              <option value="goal">Objetivo</option>
            </select>
          </label>
        </div>
        <div className="planner-actions">
          <button type="submit" disabled={busy || !projectId.trim()}>
            Crear enlace
          </button>
        </div>
      </form>
    </div>
  );
}
