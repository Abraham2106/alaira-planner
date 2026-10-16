import { FormEvent, useCallback, useId, useState } from "react";
import { createProjectApi } from "./api.js";
import { formatApiError } from "./format-api-error.js";
import "./project.css";

type ProjectWorkspaceProps = {
  showSubnav?: boolean;
};

export function ProjectWorkspace({ showSubnav = true }: ProjectWorkspaceProps) {
  const api = createProjectApi();
  const createFormId = useId();
  const editFormId = useId();
  const [projectName, setProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [branchTitle, setBranchTitle] = useState("");
  const [branchMode, setBranchMode] = useState("");
  const [projectDetail, setProjectDetail] = useState<string | null>(null);
  const [branchList, setBranchList] = useState<string | null>(null);
  const [searchSummary, setSearchSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const onCreateProject = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const created = await api.createProject({ name: projectName.trim() });
      setSelectedProjectId(created.id);
      setProjectDetail(`${created.name} (${created.id})`);
      setSuccess(`Proyecto creado: ${created.name}`);
      setProjectName("");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onLoadProject = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const id = selectedProjectId.trim();
      const [project, branches] = await Promise.all([
        api.getProject(id),
        api.listBranches(id),
      ]);
      setProjectDetail(`${project.name} · modo ${project.deliveryProfile.planningMode} · v${project.version}`);
      const lines = branches.branches.map(
        (b) => `${b.title} (${b.nodeType}, efectivo: ${b.effectiveExecutionMode})`,
      );
      setBranchList(lines.length ? lines.join("\n") : "Sin ramas además del nodo raíz.");
      setSuccess("Proyecto cargado.");
    } catch (err) {
      setProjectDetail(null);
      setBranchList(null);
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onAddBranch = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const id = selectedProjectId.trim();
      const branch = await api.createBranch(id, {
        title: branchTitle.trim(),
        ...(branchMode ? { executionModeOverride: branchMode } : {}),
      });
      setBranchTitle("");
      setSuccess(`Rama creada: ${branch.title}`);
      const branches = await api.listBranches(id);
      setBranchList(
        branches.branches
          .map((b) => `${b.title} (${b.nodeType}, efectivo: ${b.effectiveExecutionMode})`)
          .join("\n"),
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const onSearchProjects = async () => {
    resetFeedback();
    setBusy(true);
    try {
      const result = await api.searchProjects({ page: 1, pageSize: 10 });
      if (result.items.length === 0) {
        setSearchSummary("No hay proyectos visibles en tu tenant.");
      } else {
        setSearchSummary(
          result.items.map((p) => `${p.name} · ${p.id} · ${p.planningMode}`).join("\n"),
        );
      }
    } catch (err) {
      setSearchSummary(null);
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="planner-forms" data-testid="project-workspace">
      {showSubnav ? (
        <nav className="planner-subnav" aria-label="Secciones de proyectos">
          <a href="#/projects" aria-current="page">
            Proyecto
          </a>
          <a href="#/projects/wbs">WBS y dependencias</a>
        </nav>
      ) : null}

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
        id={createFormId}
        className="planner-fieldset"
        aria-labelledby={`${createFormId}-legend`}
        onSubmit={onCreateProject}
      >
        <legend id={`${createFormId}-legend`}>Crear proyecto (sintético)</legend>
        <div className="planner-field-grid">
          <label htmlFor={`${createFormId}-name`}>
            Nombre
            <input
              id={`${createFormId}-name`}
              name="name"
              required
              maxLength={256}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
        <div className="planner-actions">
          <button type="submit" disabled={busy}>
            Crear vía API
          </button>
        </div>
      </form>

      <form
        id={editFormId}
        className="planner-fieldset"
        aria-labelledby={`${editFormId}-legend`}
        onSubmit={onLoadProject}
      >
        <legend id={`${editFormId}-legend`}>Editar / inspeccionar proyecto</legend>
        <div className="planner-field-grid">
          <label htmlFor={`${editFormId}-project-id`}>
            ID de proyecto (`prj_…`)
            <input
              id={`${editFormId}-project-id`}
              name="projectId"
              required
              minLength={4}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
        <div className="planner-actions">
          <button type="submit" disabled={busy}>
            Cargar proyecto
          </button>
          <button type="button" disabled={busy} onClick={onSearchProjects}>
            Buscar proyectos (API v1)
          </button>
        </div>
        {projectDetail ? <p className="planner-muted">{projectDetail}</p> : null}
        {branchList ? (
          <pre className="planner-muted" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {branchList}
          </pre>
        ) : null}
        {searchSummary ? (
          <pre className="planner-muted" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {searchSummary}
          </pre>
        ) : null}
      </form>

      <form
        className="planner-fieldset"
        aria-label="Añadir rama al proyecto"
        onSubmit={onAddBranch}
      >
        <legend>Añadir rama (mutación)</legend>
        <div className="planner-field-grid">
          <label htmlFor={`${editFormId}-branch-title`}>
            Título de rama
            <input
              id={`${editFormId}-branch-title`}
              name="branchTitle"
              required
              maxLength={256}
              value={branchTitle}
              onChange={(e) => setBranchTitle(e.target.value)}
            />
          </label>
          <label htmlFor={`${editFormId}-branch-mode`}>
            Modo de ejecución (opcional)
            <select
              id={`${editFormId}-branch-mode`}
              name="executionModeOverride"
              value={branchMode}
              onChange={(e) => setBranchMode(e.target.value)}
            >
              <option value="">Heredar del proyecto</option>
              <option value="predictive">Predictivo</option>
              <option value="scrum">Scrum</option>
              <option value="kanban">Kanban</option>
            </select>
          </label>
        </div>
        <div className="planner-actions">
          <button type="submit" disabled={busy || !selectedProjectId.trim()}>
            Crear rama
          </button>
        </div>
      </form>
    </div>
  );
}
