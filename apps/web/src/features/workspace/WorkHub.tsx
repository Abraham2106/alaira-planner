import { useMemo, useRef, useState, type FormEvent } from "react";
import { Icon, type IconName } from "../shell/Icon.js";
import {
  exampleItems,
  statuses,
  statusClass,
  type WorkItem,
  type WorkStatus,
} from "./example.js";
import "./workspace.css";

type View = "list" | "board" | "timeline";
const views: { id: View; label: string; icon: IconName }[] = [
  { id: "list", label: "Lista", icon: "list" },
  { id: "board", label: "Tablero", icon: "board" },
  { id: "timeline", label: "Cronograma", icon: "chart" },
];
export function Status({ status }: { status: WorkStatus }) {
  return (
    <span className={`work-status ${statusClass[status]}`}>
      <span />
      {status}
    </span>
  );
}
export function Avatar({ item }: { item: Pick<WorkItem, "owner" | "name"> }) {
  return (
    <span
      className={`person-avatar person-${item.owner}`}
      title={item.name}
      aria-label={item.name}
    >
      {item.owner}
    </span>
  );
}

export function WorkHub({ personal = false }: { personal?: boolean }) {
  const [items, setItems] = useState(exampleItems);
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [mine, setMine] = useState(personal);
  const [ascending, setAscending] = useState(true);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const [draftStatus, setDraftStatus] = useState<WorkStatus>("Por hacer");
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState("ML");
  const [newDue, setNewDue] = useState("30");
  const [notice, setNotice] = useState("");
  const [starred, setStarred] = useState(false);
  const detail = useRef<HTMLDialogElement>(null);
  const create = useRef<HTMLDialogElement>(null);
  const visible = useMemo(
    () =>
      items
        .filter(
          (i) =>
            (!mine || i.owner === "ML") &&
            (filter === "all" || i.status === filter) &&
            `${i.title} ${i.id} ${i.name}`
              .toLocaleLowerCase()
              .includes(query.toLocaleLowerCase()),
        )
        .sort((a, b) => (ascending ? a.due - b.due : b.due - a.due)),
    [items, mine, filter, query, ascending],
  );
  const phases = [...new Set(visible.map((i) => i.phase))];
  const accepted = items.filter((i) => i.status === "Aceptado").length;
  const inReview = items.filter((i) => i.status === "En revisión");
  const progress = Math.round((accepted / items.length) * 100);
  const open = (item: WorkItem) => {
    setSelected(item);
    setDraftStatus(item.status);
    detail.current?.showModal();
  };
  const toggleGroup = (phase: string) =>
    setCollapsed((current) =>
      current.includes(phase)
        ? current.filter((p) => p !== phase)
        : [...current, phase],
    );
  const addItem = (event: FormEvent) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const person = exampleItems.find((i) => i.owner === newOwner)!;
    const next: WorkItem = {
      id: `ALA-${String(items.length + 1).padStart(2, "0")}`,
      title,
      phase: "03 · Validación y lanzamiento",
      status: "Por hacer",
      owner: person.owner,
      name: person.name,
      priority: "Media",
      due: Number(newDue),
      start: 16,
      evidence: 0,
      description:
        "Nueva tarea del espacio de ejemplo. Definí los criterios con tu equipo antes de solicitar aceptación.",
    };
    setItems((current) => [...current, next]);
    setQuery("");
    setFilter("all");
    setMine(false);
    setNewTitle("");
    create.current?.close();
    setNotice(
      "Tarea agregada al ejemplo. Los proyectos reales no se modificaron.",
    );
  };
  const save = () => {
    if (!selected) return;
    setItems((current) =>
      current.map((i) =>
        i.id === selected.id ? { ...i, status: draftStatus } : i,
      ),
    );
    detail.current?.close();
    setNotice("Estado actualizado únicamente en este ejemplo.");
  };

  return (
    <div className="work-hub">
      <div className="demo-ribbon">
        <span>
          <span className="demo-dot" />
          ESPACIO DE EJEMPLO{" "}
          <span className="demo-ribbon-copy">
            Explorá el producto con datos ilustrativos.
          </span>
        </span>
        <a href="#/projects">
          Ir a mis proyectos <Icon name="arrow" size={14} />
        </a>
      </div>
      <div className="hub-heading">
        <div className="hub-project-icon">
          <Icon name={personal ? "tasks" : "grid"} size={27} />
        </div>
        <div className="hub-title-block">
          <div className="hub-kicker">
            {personal ? "TU DÍA, EN ORDEN" : "PLAN DE TRABAJO"}
          </div>
          <div className="hub-title-line">
            <h2>{personal ? "Mi trabajo" : "Lanzamiento de producto"}</h2>
            <button
              className={`icon-button star-button ${starred ? "is-starred" : ""}`}
              aria-label={
                starred ? "Quitar de favoritos" : "Añadir a favoritos"
              }
              aria-pressed={starred}
              onClick={() => setStarred((v) => !v)}
            >
              <Icon name="star" size={19} />
            </button>
          </div>
          <p>
            {personal
              ? "Tus prioridades, entregas y decisiones en un solo lugar."
              : "Del primer concepto a una experiencia lista para salir."}
          </p>
        </div>
        <div className="hub-heading-end">
          <div className="avatar-stack" aria-label="Equipo de ejemplo">
            {[
              exampleItems[0]!,
              exampleItems[1]!,
              exampleItems[2]!,
              exampleItems[6]!,
            ].map((i) => (
              <Avatar key={i.owner} item={i} />
            ))}
          </div>
          <a className="hub-button" href="#/projects">
            <Icon name="people" size={16} />
            Mi equipo
            <Icon name="external" size={13} />
          </a>
        </div>
      </div>
      <div className="project-meta-line">
        <span className="project-health">
          <span />
          Proyecto en curso
        </span>
        <span>
          <Icon name="clock" size={14} />
          12 – 30 oct 2026
        </span>
        <span>
          <Icon name="people" size={14} />
          María López · responsable
        </span>
        <span className="meta-method">Híbrido</span>
      </div>
      <div className="hub-metrics" aria-label="Resumen del proyecto de ejemplo">
        <div className="metric-progress">
          <span>
            Avance aceptado <Icon name="help" size={13} />
          </span>
          <div>
            <strong>
              {progress}
              <small>%</small>
            </strong>
            <span className="metric-track">
              <i style={{ width: `${progress}%` }} />
            </span>
          </div>
          <small>Basado en entregables aceptados</small>
        </div>
        <div>
          <span>Entregables</span>
          <strong>
            {accepted}
            <small> de {items.length}</small>
          </strong>
          <small>aceptados por el equipo</small>
        </div>
        <div>
          <span>Por revisar</span>
          <strong>
            {inReview.length.toString().padStart(2, "0")}
            <span className="metric-ochre">Requieren decisión</span>
          </strong>
          <small>evidencia lista para validar</small>
        </div>
        <div>
          <span>Próximo hito</span>
          <strong className="metric-date">
            23 <small>oct</small>
            <Icon name="flag" size={18} />
          </strong>
          <small>Versión lista para el piloto</small>
        </div>
      </div>
      <div className="hub-view-line">
        <nav aria-label="Vistas del proyecto" className="hub-view-tabs">
          {views.map((v) => (
            <button
              key={v.id}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
            >
              <Icon name={v.icon} size={17} />
              {v.label}
            </button>
          ))}
        </nav>
        <span className="hub-view-caption">
          <Icon name="link" size={13} />
          Un plan, todas las vistas
        </span>
      </div>
      <div className="hub-body">
        <section className="hub-work" aria-label="Plan de trabajo">
          <div className="hub-toolbar">
            <label className="hub-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Buscar tareas"
                placeholder="Buscar una tarea…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="hub-filter">
              <Icon name="filter" size={16} />
              <select
                aria-label="Filtrar por estado"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              className={`hub-mine ${mine ? "selected" : ""}`}
              aria-pressed={mine}
              onClick={() => setMine((v) => !v)}
            >
              <Icon name="people" size={15} />
              Mis tareas
            </button>
            <button
              className="hub-button primary"
              onClick={() => create.current?.showModal()}
            >
              <Icon name="plus" size={16} />
              <span>Nueva tarea</span>
            </button>
          </div>
          {notice && (
            <div className="hub-notice" role="status">
              <Icon name="check" size={16} />
              {notice}
              <button aria-label="Cerrar aviso" onClick={() => setNotice("")}>
                <Icon name="close" size={14} />
              </button>
            </div>
          )}
          {visible.length === 0 ? (
            <div className="hub-empty">
              <Icon name="search" size={32} />
              <h3>No hay tareas con estos filtros</h3>
              <p>Probá otro nombre o ampliá los estados.</p>
              <button
                className="hub-button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                  setMine(false);
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : view === "list" ? (
            <div
              className="work-table-wrap"
              role="region"
              aria-label="Tareas del proyecto"
              tabIndex={0}
            >
              <table className="work-table">
                <thead>
                  <tr>
                    <th scope="col">
                      Nombre de la tarea <span>{visible.length}</span>
                    </th>
                    <th scope="col">Estado</th>
                    <th scope="col">Responsable</th>
                    <th scope="col">
                      <button onClick={() => setAscending((v) => !v)}>
                        Entrega {ascending ? "↑" : "↓"}
                      </button>
                    </th>
                    <th scope="col">Prioridad</th>
                    <th scope="col" aria-label="Evidencia">
                      <Icon name="link" size={15} />
                    </th>
                  </tr>
                </thead>
                {phases.map((phase) => (
                  <tbody key={phase}>
                    <tr className="work-group">
                      <th scope="rowgroup" colSpan={6}>
                        <button
                          aria-expanded={!collapsed.includes(phase)}
                          onClick={() => toggleGroup(phase)}
                        >
                          <Icon
                            name={
                              collapsed.includes(phase) ? "chevron" : "down"
                            }
                            size={13}
                          />
                          {phase}
                          <span>
                            {visible.filter((i) => i.phase === phase).length}
                          </span>
                        </button>
                      </th>
                    </tr>
                    {!collapsed.includes(phase) &&
                      visible
                        .filter((i) => i.phase === phase)
                        .map((item) => (
                          <tr key={item.id}>
                            <th scope="row">
                              <button
                                className="work-name"
                                onClick={() => open(item)}
                              >
                                <span
                                  className={`task-indicator ${statusClass[item.status]}`}
                                >
                                  {item.status === "Aceptado" ? (
                                    <Icon name="check" size={12} />
                                  ) : null}
                                </span>
                                <span>
                                  {item.title}
                                  <small>{item.id}</small>
                                </span>
                              </button>
                            </th>
                            <td>
                              <Status status={item.status} />
                            </td>
                            <td>
                              <Avatar item={item} />
                            </td>
                            <td className="work-due">{item.due} oct</td>
                            <td>
                              <span
                                className={`work-priority priority-${item.priority}`}
                              >
                                <Icon name="flag" size={12} />
                                {item.priority}
                              </span>
                            </td>
                            <td className="work-evidence">
                              {item.evidence > 0 ? (
                                <>
                                  <Icon name="link" size={12} />
                                  {item.evidence}
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                ))}
              </table>
              <button
                className="work-add-row"
                onClick={() => create.current?.showModal()}
              >
                <Icon name="plus" size={15} />
                Agregar una tarea
              </button>
            </div>
          ) : view === "board" ? (
            <div className="work-board">
              {statuses.map((status) => (
                <section className="board-column" key={status}>
                  <header>
                    <Status status={status} />
                    <span>
                      {visible.filter((i) => i.status === status).length}
                    </span>
                  </header>
                  {visible
                    .filter((i) => i.status === status)
                    .map((item) => (
                      <button
                        className="board-card"
                        key={item.id}
                        onClick={() => open(item)}
                      >
                        <small>
                          {item.id}
                          <Icon name="external" size={12} />
                        </small>
                        <strong>{item.title}</strong>
                        <span className="board-card-footer">
                          <Avatar item={item} />
                          <span>{item.due} oct</span>
                          <Icon name="flag" size={13} />
                        </span>
                      </button>
                    ))}
                  {visible.every((i) => i.status !== status) && (
                    <p className="board-empty">Sin tareas en este estado</p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div
              className="hub-timeline"
              role="region"
              aria-label="Cronograma ilustrativo de octubre de 2026"
              tabIndex={0}
            >
              <div className="timeline-inner">
                <div className="timeline-header">
                  <strong>Octubre 2026</strong>
                  <div>
                    {[
                      "12 – 16 oct",
                      "17 – 21 oct",
                      "22 – 26 oct",
                      "27 – 31 oct",
                    ].map((w) => (
                      <span key={w}>{w}</span>
                    ))}
                  </div>
                </div>
                {visible.map((item) => (
                  <div className="timeline-row" key={item.id}>
                    <button onClick={() => open(item)}>
                      <span
                        className={`task-indicator ${statusClass[item.status]}`}
                      />
                      {item.title}
                    </button>
                    <div className="timeline-track">
                      <button
                        aria-label={`${item.title}, del ${item.start} al ${item.due} de octubre, ${item.status}`}
                        className={`timeline-bar ${statusClass[item.status]}`}
                        style={{
                          left: `${((item.start - 12) / 20) * 100}%`,
                          width: `${(Math.max(1, item.due - item.start + 1) / 20) * 100}%`,
                        }}
                        onClick={() => open(item)}
                      >
                        {item.owner}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="timeline-legend">
                  {statuses.map((s) => (
                    <Status key={s} status={s} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="work-bottom">
            <span>
              {visible.length} de {items.length} tareas <span>·</span>{" "}
              {accepted} aceptadas
            </span>
            <span>
              <span className="demo-dot" />
              Cambios locales al ejemplo
            </span>
          </div>
        </section>
        <aside className="hub-insights" aria-label="Contexto del proyecto">
          <div className="insight-title">
            <h3>El pulso del proyecto</h3>
            <Icon name="chart" size={17} />
          </div>
          <div className="project-pulse">
            <span
              className="pulse-ring"
              style={{
                background: `conic-gradient(var(--shell-color-accent) ${progress}%, var(--shell-color-surface-subtle) 0)`,
              }}
            >
              <strong>
                {progress}
                <small>%</small>
              </strong>
            </span>
            <div>
              <strong>
                De la actividad
                <br />a lo aceptado.
              </strong>
              <p>
                {accepted} entregables con
                <br />
                aceptación confirmada.
              </p>
            </div>
          </div>
          <div className="pulse-stats">
            {statuses.map((s) => (
              <div key={s}>
                <span>
                  <i className={statusClass[s]} />
                  {s}
                </span>
                <strong>{items.filter((i) => i.status === s).length}</strong>
              </div>
            ))}
          </div>
          <section className="insight-section">
            <div className="insight-title">
              <h3>Necesita tu decisión</h3>
              <span className="insight-count">{inReview.length}</span>
            </div>
            {inReview.length ? (
              inReview.slice(0, 2).map((i) => (
                <button
                  className="decision-item"
                  key={i.id}
                  onClick={() => open(i)}
                >
                  <span className="decision-icon">
                    <Icon name="file" size={17} />
                  </span>
                  <span>
                    <strong>{i.title}</strong>
                    <small>{i.evidence} evidencias · En revisión</small>
                  </span>
                  <Icon name="chevron" size={13} />
                </button>
              ))
            ) : (
              <p className="hub-muted">Todo revisado por ahora.</p>
            )}
          </section>
          <section className="insight-section">
            <div className="insight-title">
              <h3>Próximos hitos</h3>
              <Icon name="flag" size={15} />
            </div>
            <div className="milestone">
              <span>
                23<small>OCT</small>
              </span>
              <div>
                <strong>Listo para el piloto</strong>
                <small>Versión interna del producto</small>
              </div>
            </div>
            <div className="milestone">
              <span>
                30<small>OCT</small>
              </span>
              <div>
                <strong>Lanzamiento v1.0</strong>
                <small>Primer acceso de usuarios</small>
              </div>
            </div>
          </section>
          <div className="insight-note">
            <Icon name="spark" size={18} />
            <div>
              <strong>El trabajo cuenta una historia.</strong>
              <p>
                Alaira conecta la evidencia con las decisiones del proyecto.
              </p>
              <button onClick={() => helpAssistant()}>
                Consultar un proyecto real
                <Icon name="arrow" size={13} />
              </button>
            </div>
          </div>
        </aside>
      </div>
      <dialog
        ref={detail}
        className="app-dialog detail-drawer"
        aria-labelledby="task-title"
      >
        {selected && (
          <>
            <div className="dialog-head">
              <span className="task-id">
                {selected.id} <span>· Ejemplo</span>
              </span>
              <button
                aria-label="Cerrar detalle"
                onClick={() => detail.current?.close()}
              >
                <Icon name="close" />
              </button>
            </div>
            <h2 id="task-title">{selected.title}</h2>
            <p className="detail-description">{selected.description}</p>
            <dl className="task-properties">
              <div>
                <dt>Estado</dt>
                <dd>
                  <label className="sr-only" htmlFor="task-status">
                    Estado de la tarea
                  </label>
                  <select
                    id="task-status"
                    value={draftStatus}
                    onChange={(e) =>
                      setDraftStatus(e.target.value as WorkStatus)
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>
                  <Avatar item={selected} />
                  {selected.name}
                </dd>
              </div>
              <div>
                <dt>Fecha de entrega</dt>
                <dd>
                  <Icon name="clock" size={16} />
                  {selected.due} de octubre de 2026
                </dd>
              </div>
              <div>
                <dt>Prioridad</dt>
                <dd>
                  <Icon name="flag" size={16} />
                  {selected.priority}
                </dd>
              </div>
              <div>
                <dt>Fase</dt>
                <dd>{selected.phase}</dd>
              </div>
            </dl>
            <section className="detail-evidence">
              <h3>
                <Icon name="link" size={17} />
                Evidencia y aceptación
              </h3>
              <p>
                {selected.evidence
                  ? `${selected.evidence} referencias ilustrativas vinculadas a esta tarea.`
                  : "Todavía no hay evidencia vinculada."}
              </p>
              <div>
                <Icon name="help" size={16} />
                <span>
                  La evidencia respalda una decisión. La aceptación requiere una
                  revisión explícita.
                </span>
              </div>
            </section>
            <div className="detail-foot">
              <p>
                Los cambios de esta vista solo viven en el ejemplo y se
                restablecen al recargar.
              </p>
              <button className="hub-button primary" onClick={save}>
                Guardar en el ejemplo
                <Icon name="check" size={16} />
              </button>
            </div>
          </>
        )}
      </dialog>
      <dialog
        ref={create}
        className="app-dialog"
        aria-labelledby="create-task-title"
      >
        <form onSubmit={addItem}>
          <div className="dialog-head">
            <h2 id="create-task-title">Nueva tarea</h2>
            <button
              type="button"
              aria-label="Cerrar nueva tarea"
              onClick={() => create.current?.close()}
            >
              <Icon name="close" />
            </button>
          </div>
          <p className="dialog-intro">
            Agregá una tarea al proyecto de ejemplo.
          </p>
          <label className="hub-field">
            Nombre de la tarea
            <input
              required
              maxLength={256}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="¿Qué necesita hacerse?"
            />
          </label>
          <div className="form-two-cols">
            <label className="hub-field">
              Responsable
              <select
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
              >
                {[
                  exampleItems[0]!,
                  exampleItems[1]!,
                  exampleItems[2]!,
                  exampleItems[6]!,
                ].map((i) => (
                  <option key={i.owner} value={i.owner}>
                    {i.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="hub-field">
              Entrega · octubre 2026
              <input
                type="number"
                min={16}
                max={31}
                required
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
              />
            </label>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="hub-button"
              onClick={() => create.current?.close()}
            >
              Cancelar
            </button>
            <button type="submit" className="hub-button primary">
              <Icon name="plus" size={16} />
              Crear en el ejemplo
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
function helpAssistant() {
  const button = document.querySelector<HTMLButtonElement>(".shell-ai-button");
  button?.click();
}
