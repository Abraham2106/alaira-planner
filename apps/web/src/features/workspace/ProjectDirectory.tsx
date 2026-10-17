import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { logoutRequest } from "../auth/api.js";
import { createProjectApi } from "../project/api.js";
import { formatApiError } from "../project/format-api-error.js";
import { ProjectWorkspace } from "../project/ProjectWorkspace.js";
import { Icon } from "../shell/Icon.js";
import { hrefWithProject, rememberActiveProjectId } from "../../lib/session/active-project.js";
import "./workspace.css";

type ProjectRow = {
  id: string;
  name: string;
  planningMode: string;
  version: number;
};
type Branch = {
  title: string;
  nodeType: string;
  effectiveExecutionMode: string;
};
const modes: Record<string, string> = {
  predictive: "Predictivo",
  scrum: "Scrum",
  kanban: "Kanban",
  hybrid: "Híbrido",
  adaptive: "Adaptativo",
};
export function ProjectDirectory() {
  const api = useMemo(() => createProjectApi(), []);
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [selected, setSelected] = useState<ProjectRow | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [notice, setNotice] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const createDialog = useRef<HTMLDialogElement>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const result = await api.searchProjects({ page: 1, pageSize: 100 });
      setRows(result.items);
      setTotal(result.total);
    } catch (cause) {
      setRows([]);
      setError(formatApiError(cause));
    } finally {
      setBusy(false);
    }
  }, [api]);
  useEffect(() => {
    void load();
  }, [load]);
  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const project = await api.createProject({ name: name.trim() });
      rememberActiveProjectId(project.id);
      setNotice(`Proyecto creado: ${project.name}`);
      setName("");
      createDialog.current?.close();
      await load();
    } catch (cause) {
      setCreateError(formatApiError(cause));
    } finally {
      setCreating(false);
    }
  };
  const open = async (project: ProjectRow) => {
    rememberActiveProjectId(project.id);
    setSelected(project);
    setLoadingDetail(true);
    setDetailError("");
    setBranches([]);
    detailDialog.current?.showModal();
    try {
      const result = await api.listBranches(project.id);
      setBranches(result.branches);
    } catch (cause) {
      setDetailError(formatApiError(cause));
    } finally {
      setLoadingDetail(false);
    }
  };
  const visible = rows.filter((p) =>
    p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <div className="directory">
      <header className="directory-heading">
        <div>
          <div className="eyebrow">ESPACIO DE TRABAJO</div>
          <h2>Mis proyectos</h2>
          <p>El alcance, el equipo y el siguiente paso. Todo conectado.</p>
        </div>
        <button
          className="hub-button primary"
          onClick={() => createDialog.current?.showModal()}
        >
          <Icon name="plus" size={16} />
          Nuevo proyecto
        </button>
      </header>
      <div className="directory-tools">
        <label className="hub-search">
          <Icon name="search" size={16} />
          <input
            placeholder="Buscar un proyecto…"
            aria-label="Buscar proyectos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          className="hub-button"
          onClick={() => void load()}
          disabled={busy}
        >
          <Icon name="refresh" size={14} />
          Actualizar
        </button>
        <a className="hub-button" href="#/ejemplo">
          Abrir ejemplo ilustrativo
          <Icon name="arrow" size={14} />
        </a>
        <button
          className="hub-button"
          type="button"
          onClick={() => {
            setLogoutError("");
            void logoutRequest().catch((cause: unknown) => {
              setLogoutError(
                cause instanceof Error && cause.message
                  ? cause.message
                  : "No se pudo cerrar la sesión.",
              );
            });
          }}
        >
          Cerrar sesión
        </button>
      </div>
      {logoutError ? (
        <p className="directory-error" role="alert">
          {logoutError}
        </p>
      ) : null}
      {notice && (
        <p className="hub-notice" role="status">
          <Icon name="check" size={16} />
          {notice}
        </p>
      )}
      {busy ? (
        <p className="directory-status" role="status">
          Cargando tus proyectos…
        </p>
      ) : error ? (
        <div className="directory-error" role="alert">
          <Icon name="help" size={20} />
          <span>{error}</span>
          <a className="hub-button" href="#/entrar">
            Iniciar sesión
            <Icon name="arrow" size={14} />
          </a>
        </div>
      ) : visible.length ? (
        <>
          <div className="directory-table-wrap">
            <table className="project-directory-table">
              <thead>
                <tr>
                  <th scope="col">Proyecto</th>
                  <th scope="col">Metodología</th>
                  <th scope="col">Versión</th>
                  <th scope="col">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button onClick={() => void open(p)}>
                        <span className="project-square">
                          <Icon name="folder" size={15} />
                        </span>
                        {p.name}
                      </button>
                    </td>
                    <td>{modes[p.planningMode] ?? p.planningMode}</td>
                    <td>v{p.version}</td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Abrir ${p.name}`}
                        onClick={() => void open(p)}
                      >
                        <Icon name="arrow" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="directory-status">
            {visible.length} de {total} proyectos · Visibles según los permisos
            de tu sesión
          </p>
        </>
      ) : (
        <div className="hub-empty">
          <Icon name="folder" size={34} />
          <h3>
            {query
              ? "No encontramos ese proyecto"
              : "Tu próximo proyecto empieza acá"}
          </h3>
          <p>
            {query
              ? "Probá con otro nombre."
              : "Creá el primer proyecto y organizá sus entregables con tu equipo."}
          </p>
          <button
            className="hub-button primary"
            onClick={() => createDialog.current?.showModal()}
          >
            <Icon name="plus" size={16} />
            Crear proyecto
          </button>
        </div>
      )}
      <details className="project-tools-disclosure">
        <summary>Administrar estructura y ramas de un proyecto</summary>
        <p className="hub-muted">
          Operaciones sobre proyectos reales. Requieren una sesión con permisos.
        </p>
        <ProjectWorkspace showSubnav={false} />
      </details>
      <dialog
        ref={createDialog}
        className="app-dialog"
        aria-labelledby="new-project-title"
      >
        <form onSubmit={createProject}>
          <div className="dialog-head">
            <h2 id="new-project-title">Nuevo proyecto</h2>
            <button
              type="button"
              disabled={creating}
              aria-label="Cerrar nuevo proyecto"
              onClick={() => createDialog.current?.close()}
            >
              <Icon name="close" />
            </button>
          </div>
          <label className="hub-field">
            Nombre del proyecto
            <input
              required
              maxLength={256}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
          </label>
          <div className="dialog-actions">
            <button
              type="button"
              className="hub-button"
              disabled={creating}
              onClick={() => createDialog.current?.close()}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="hub-button primary"
              disabled={creating}
            >
              {creating ? "Creando…" : "Crear proyecto"}
              <Icon name="arrow" size={15} />
            </button>
          </div>
        </form>
        {createError ? (
          <p className="app-toast" role="alert">
            {createError}
          </p>
        ) : null}
      </dialog>
      <dialog
        ref={detailDialog}
        className="app-dialog detail-drawer"
        aria-labelledby="real-project-title"
      >
        <div className="dialog-head">
          <span className="eyebrow">PROYECTO</span>
          <button
            aria-label="Cerrar proyecto"
            onClick={() => detailDialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="real-project-title">{selected?.name}</h2>
        <p className="hub-muted">
          {selected && (modes[selected.planningMode] ?? selected.planningMode)}{" "}
          · v{selected?.version}
        </p>
        {loadingDetail ? (
          <p role="status">Cargando estructura…</p>
        ) : detailError ? (
          <p className="directory-error" role="alert">
            {detailError}
          </p>
        ) : (
          <section className="detail-evidence">
            <h3>Estructura del proyecto</h3>
            {branches.length ? (
              branches.map((b, i) => (
                <div className="project-branch" key={i}>
                  <Icon name="folder" size={14} />
                  {b.title}
                  <small>
                    {modes[b.effectiveExecutionMode] ??
                      b.effectiveExecutionMode}
                  </small>
                </div>
              ))
            ) : (
              <p>Aún no hay ramas además del nodo raíz.</p>
            )}
          </section>
        )}
        <p className="hub-muted">Identificador del proyecto</p>
        <code className="task-id">{selected?.id}</code>
        <div className="dialog-actions">
          <a
            className="hub-button primary"
            href="#/"
            onClick={() => {
              if (selected) rememberActiveProjectId(selected.id);
              detailDialog.current?.close();
            }}
          >
            Ver el trabajo
            <Icon name="arrow" size={15} />
          </a>
          <a
            className="hub-button"
            href={selected ? hrefWithProject("#/projects/wbs", selected.id) : "#/projects/wbs"}
            onClick={() => {
              if (selected) rememberActiveProjectId(selected.id);
              detailDialog.current?.close();
            }}
          >
            Abrir estructura de trabajo
            <Icon name="arrow" size={15} />
          </a>
        </div>
      </dialog>
    </div>
  );
}
