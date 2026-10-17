import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "../../styles/shell.css";
import { DateTimeBanner } from "./datetime/DateTimeBanner.js";
import { ShellNav } from "./navigation/ShellNav.js";
import {
  routeFromHash,
  shellRoutes,
  type ShellRoute,
} from "./navigation/routes.js";
import { Icon } from "./Icon.js";
import { AskCommandPanel } from "../control-tower/AskCommandPanel.js";
import { hrefWithProject } from "../../lib/session/active-project.js";
import { useActiveProjectId } from "../../lib/session/use-active-project.js";

const NAV_STORAGE_KEY = "alaira-nav";
export type AppShellProps = { children?: ReactNode };
export function AppShell({ children }: AppShellProps) {
  const activeProjectId = useActiveProjectId();
  const [active, setActive] = useState<ShellRoute>(() =>
    routeFromHash(window.location.hash.split("?")[0] || "#/"),
  );
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(NAV_STORAGE_KEY) === "collapsed",
  );
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState(activeProjectId);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const askDialog = useRef<HTMLDialogElement>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const toggleNav = useCallback(() => setCollapsed((current) => !current), []);
  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEY, collapsed ? "collapsed" : "open");
  }, [collapsed]);
  useEffect(() => {
    const sync = () =>
      setActive(routeFromHash(window.location.hash.split("?")[0] || "#/"));
    const keys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchDialog.current?.showModal();
      }
      if (event.ctrlKey && event.key === "[") {
        event.preventDefault();
        toggleNav();
      }
    };
    window.addEventListener("hashchange", sync);
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("keydown", keys);
    };
  }, [toggleNav]);
  const navigate = useCallback(
    (route: ShellRoute) => {
      window.location.hash = hrefWithProject(route.hash, activeProjectId);
      setActive(route);
    },
    [activeProjectId],
  );

  useEffect(() => {
    if (activeProjectId) setProjectId(activeProjectId);
  }, [activeProjectId]);
  const auth = active.id === "entrar" || active.id === "registro";
  const workspacePage = ["home", "my-work", "projects", "ejemplo"].includes(active.id);
  const destinations = [
    ...shellRoutes.filter((r) => r.id !== "entrar"),
    { id: "gantt", label: "Cronograma", hash: "#/projects/gantt" },
    { id: "wbs", label: "Estructura de trabajo", hash: "#/projects/wbs" },
    {
      id: "control",
      label: "Control del proyecto",
      hash: "#/projects/control",
    },
    { id: "ejemplo", label: "Ejemplo", hash: "#/ejemplo" },
  ];
  const matches = destinations.filter((r) =>
    r.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <div
      className="shell-root"
      data-nav={collapsed ? "collapsed" : "open"}
      data-auth={auth || undefined}
    >
      <a
        href="#main-content"
        className="shell-skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Saltar al contenido principal
      </a>
      <div className="shell-layout">
        <aside className="shell-sidebar">
          <a
            href="#/"
            className="shell-brand"
            aria-label="Alaira Planner, inicio"
          >
            <span className="alaira-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="shell-brand-name">
              alaira<span>planner</span>
            </span>
          </a>
          <a href="#/projects" className="shell-workspace">
            <span className="workspace-initial">A</span>
            <span className="workspace-copy">
              <strong>Mi espacio de trabajo</strong>
              <small>Gestión de proyectos</small>
            </span>
            <Icon name="down" size={14} />
          </a>
          <nav aria-label="Principal">
            <ShellNav active={active} onNavigate={navigate} />
          </nav>
          <div className="shell-side-section">
            <span>EJEMPLO</span>
            <a href="#/ejemplo" aria-label="Abrir ejemplo ilustrativo">
              <Icon name="plus" size={15} />
            </a>
          </div>
          <nav aria-label="Ejemplo ilustrativo" className="shell-project-nav">
            <a className="shell-project-link" href="#/ejemplo">
              <span className="project-square">
                <Icon name="grid" size={15} />
              </span>
              <span>Lanzamiento de producto</span>
              <Icon name="down" size={13} />
            </a>
            <a
              href="#/ejemplo"
              className="shell-project-child"
              data-active={active.id === "ejemplo" || undefined}
            >
              <Icon name="list" size={16} />
              <span>Plan de ejemplo</span>
            </a>
          </nav>
          <div className="shell-side-section">
            <span>HERRAMIENTAS</span>
          </div>
          <nav aria-label="Planificación" className="shell-nav-list">
            <a
              href={hrefWithProject("#/projects/wbs", activeProjectId)}
              className="shell-nav-link"
              title="Estructura de trabajo"
              aria-current={active.id === "wbs" ? "page" : undefined}
            >
              <Icon name="grid" />
              <span>Estructura de trabajo</span>
            </a>
            <a
              href={hrefWithProject("#/projects/gantt", activeProjectId)}
              className="shell-nav-link"
              title="Cronograma"
              aria-current={active.id === "gantt" ? "page" : undefined}
            >
              <Icon name="chart" />
              <span>Cronograma</span>
            </a>
            <a
              href={hrefWithProject("#/projects/control", activeProjectId)}
              className="shell-nav-link"
              title="Control del proyecto"
              aria-current={active.id === "control" ? "page" : undefined}
            >
              <Icon name="flag" />
              <span>Control del proyecto</span>
            </a>
          </nav>
          <div className="shell-sidebar-bottom">
            <div className="shell-side-note">
              <Icon name="spark" size={20} />
              <strong>
                Menos seguimiento.
                <br />
                Más dirección.
              </strong>
              <p>Conectá el plan con el trabajo que sucede.</p>
              <button onClick={() => askDialog.current?.showModal()}>
                Explorar Alaira IA <Icon name="arrow" size={14} />
              </button>
            </div>
            <div className="shell-side-tools">
              <button
                title="Ayuda y atajos"
                onClick={() => helpDialog.current?.showModal()}
              >
                <Icon name="help" />
                <span>Ayuda y atajos</span>
              </button>
              <button
                title={collapsed ? "Mostrar menú" : "Ocultar menú"}
                aria-label={collapsed ? "Mostrar menú" : "Ocultar menú"}
                onClick={toggleNav}
              >
                <Icon name="panel" size={17} />
              </button>
            </div>
            <a href="#/entrar" className="shell-account">
              <span className="shell-avatar">T</span>
              <span>
                <strong>Tu espacio, conectado</strong>
                <small>Iniciar sesión</small>
              </span>
              <Icon name="chevron" size={15} />
            </a>
          </div>
        </aside>
        <header className="shell-header">
          <button
            className="shell-mobile-menu"
            aria-label={collapsed ? "Mostrar menú" : "Ocultar menú"}
            onClick={toggleNav}
          >
            <Icon name="panel" />
          </button>
          <div className="shell-breadcrumb">
            <Icon name={active.id === "home" ? "folder" : "grid"} size={16} />
            <span>Espacio de trabajo</span>
            <Icon name="chevron" size={12} />
            <strong>{active.label}</strong>
          </div>
          <div className="shell-header-actions">
            <button
              className="shell-search"
              onClick={() => searchDialog.current?.showModal()}
            >
              <Icon name="search" size={16} />
              <span>Buscar o ir a…</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="shell-ai-button"
              onClick={() => askDialog.current?.showModal()}
            >
              <Icon name="spark" size={16} />
              <span>Preguntar a Alaira</span>
            </button>
            <a
              href="#/entrar"
              className="shell-profile"
              aria-label="Iniciar sesión"
            >
              T
            </a>
          </div>
        </header>
        <main id="main-content" className="shell-main" tabIndex={-1}>
          {!workspacePage && !auth && (
            <div className="shell-page-head">
              <div className="eyebrow">PROJECT CONTROL</div>
              <h1>{active.label}</h1>
              <p>{active.description}</p>
            </div>
          )}
          {workspacePage && <h1 className="sr-only">{active.label}</h1>}
          {children}
          <div id="feature-host" />
          {!auth && (
            <footer className="shell-footer">
              <span>
                ALAIRA PLANNER <span>·</span> Planificá con claridad.
              </span>
              <DateTimeBanner locale="es-CR" />
            </footer>
          )}
        </main>
      </div>
      <dialog
        ref={searchDialog}
        className="app-dialog search-dialog"
        aria-labelledby="search-title"
      >
        <div className="dialog-head">
          <h2 id="search-title">Ir a tu trabajo</h2>
          <button
            aria-label="Cerrar búsqueda"
            onClick={() => searchDialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <label className="hub-search">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar una vista…"
            aria-label="Buscar una vista"
          />
        </label>
        <div className="command-results">
          {matches.map((r) => (
            <a
              key={r.id}
              href={hrefWithProject(r.hash, activeProjectId)}
              onClick={() => searchDialog.current?.close()}
            >
              <Icon name="arrow" size={16} />
              {r.label}
              <Icon name="chevron" size={14} />
            </a>
          ))}
          {matches.length === 0 && <p>No hay vistas con ese nombre.</p>}
        </div>
        <small>Ctrl K para abrir · Esc para cerrar</small>
      </dialog>
      <dialog
        ref={askDialog}
        className="app-dialog"
        aria-labelledby="ask-title"
      >
        <div className="dialog-head">
          <h2 id="ask-title">
            <Icon name="spark" /> Alaira IA
          </h2>
          <button
            aria-label="Cerrar asistente"
            onClick={() => askDialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="dialog-intro">
          Consultá tu proyecto o proponé un cambio. Las acciones requieren los
          permisos de tu sesión.
        </p>
        <div className="ct">
          <AskCommandPanel projectId={projectId} />
        </div>
      </dialog>
      <dialog
        ref={helpDialog}
        className="app-dialog"
        aria-labelledby="help-title"
      >
        <div className="dialog-head">
          <h2 id="help-title">Tu trabajo, a un atajo</h2>
          <button
            aria-label="Cerrar ayuda"
            onClick={() => helpDialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <dl className="shortcut-list">
          <div>
            <dt>Buscar una vista</dt>
            <dd>
              <kbd>Ctrl K</kbd>
            </dd>
          </div>
          <div>
            <dt>Contraer navegación</dt>
            <dd>
              <kbd>Ctrl [</kbd>
            </dd>
          </div>
          <div>
            <dt>Cerrar un panel</dt>
            <dd>
              <kbd>Esc</kbd>
            </dd>
          </div>
        </dl>
        <p>
          El ejemplo ilustrativo está en su propia entrada y no modifica tus
          proyectos.
        </p>
        <a
          className="hub-button primary"
          href="#/projects"
          onClick={() => helpDialog.current?.close()}
        >
          Abrir mis proyectos <Icon name="arrow" size={16} />
        </a>
      </dialog>
    </div>
  );
}
