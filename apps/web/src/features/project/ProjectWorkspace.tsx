import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import { hrefWithProject, rememberActiveProjectId } from "../../lib/session/active-project.js";
import { useActiveProjectId } from "../../lib/session/use-active-project.js";
import { createProjectApi } from "./api.js";
import { formatApiError } from "./format-api-error.js";
import "./project.css";

type ProjectWorkspaceProps = {
  showSubnav?: boolean;
};

type BranchRow = {
  title: string;
  nodeType: string;
  effectiveExecutionMode: string;
};

type SearchRow = {
  name: string;
  id: string;
  planningMode: string;
};

export function ProjectWorkspace({ showSubnav = true }: ProjectWorkspaceProps) {
  const api = createProjectApi();
  const createFormId = useId();
  const editFormId = useId();
  const [projectName, setProjectName] = useState("");
  const activeProjectId = useActiveProjectId();
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId);
  const [branchTitle, setBranchTitle] = useState("");
  const [branchMode, setBranchMode] = useState("");
  const [projectDetail, setProjectDetail] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchRow[] | null>(null);
  const [searchRows, setSearchRows] = useState<SearchRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const resetFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  useEffect(() => {
    if (activeProjectId) setSelectedProjectId(activeProjectId);
  }, [activeProjectId]);

  const onCreateProject = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const created = await api.createProject({ name: projectName.trim() });
      setSelectedProjectId(created.id);
      rememberActiveProjectId(created.id);
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
      rememberActiveProjectId(id);
      const [project, branchPage] = await Promise.all([
        api.getProject(id),
        api.listBranches(id),
      ]);
      setProjectDetail(
        `${project.name} · modo ${project.deliveryProfile.planningMode} · v${project.version}`,
      );
      setBranches(
        branchPage.branches.map((branch) => ({
          title: branch.title,
          nodeType: branch.nodeType,
          effectiveExecutionMode: branch.effectiveExecutionMode,
        })),
      );
      setSuccess("Proyecto cargado.");
    } catch (err) {
      setProjectDetail(null);
      setBranches(null);
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
      rememberActiveProjectId(id);
      const branch = await api.createBranch(id, {
        title: branchTitle.trim(),
        ...(branchMode ? { executionModeOverride: branchMode } : {}),
      });
      setBranchTitle("");
      setSuccess(`Rama creada: ${branch.title}`);
      const branchPage = await api.listBranches(id);
      setBranches(
        branchPage.branches.map((item) => ({
          title: item.title,
          nodeType: item.nodeType,
          effectiveExecutionMode: item.effectiveExecutionMode,
        })),
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
      setSearchRows(
        result.items.map((project) => ({
          name: project.name,
          id: project.id,
          planningMode: project.planningMode,
        })),
      );
    } catch (err) {
      setSearchRows(null);
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="planner-forms" data-testid="project-workspace" aria-busy={busy}>
      {showSubnav ? (
        <nav className="planner-subnav" aria-label="Secciones de proyectos">
          <a href={hrefWithProject("#/projects", activeProjectId)} aria-current="page">
            Proyecto
          </a>
          <a href={hrefWithProject("#/projects/wbs", activeProjectId)}>Paquetes</a>
          <a href={hrefWithProject("#/projects/gantt", activeProjectId)}>Cronograma</a>
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

      <form id={createFormId} onSubmit={onCreateProject}>
        <fieldset className="planner-fieldset">
          <legend>Crear proyecto</legend>
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
              Crear proyecto
            </button>
          </div>
        </fieldset>
      </form>

      <form id={editFormId} onSubmit={onLoadProject}>
        <fieldset className="planner-fieldset">
          <legend>Abrir proyecto</legend>
          <p className="planner-muted">
            {selectedProjectId
              ? "Se abre el proyecto activo, el mismo de paquetes, cronograma y control."
              : "Elegí un proyecto en la lista. No hace falta pegar un identificador."}
          </p>
          <div className="planner-actions">
            <button type="submit" disabled={busy || !selectedProjectId.trim()}>
              Cargar proyecto activo
            </button>
            <button type="button" disabled={busy} onClick={onSearchProjects}>
              Buscar proyectos
            </button>
          </div>
          {projectDetail ? <p className="planner-muted">{projectDetail}</p> : null}
          {branches ? (
            branches.length === 0 ? (
              <p className="planner-muted">Sin ramas además del nodo raíz.</p>
            ) : (
              <ul className="planner-list planner-muted">
                {branches.map((branch) => (
                  <li key={`${branch.title}-${branch.nodeType}`}>
                    {branch.title} ({branch.nodeType}, efectivo: {branch.effectiveExecutionMode})
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {searchRows ? (
            searchRows.length === 0 ? (
              <p className="planner-muted">No hay proyectos visibles.</p>
            ) : (
              <ul className="planner-list planner-muted">
                {searchRows.map((project) => (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        rememberActiveProjectId(project.id);
                      }}
                    >
                      {project.name}
                    </button>
                    {" "}
                    {project.planningMode}
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </fieldset>
      </form>

      <form onSubmit={onAddBranch}>
        <fieldset className="planner-fieldset">
          <legend>Añadir rama</legend>
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
        </fieldset>
      </form>
    </div>
  );
}
