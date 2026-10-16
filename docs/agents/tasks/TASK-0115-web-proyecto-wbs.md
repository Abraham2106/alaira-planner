# TASK-0115 — Web: formularios de proyecto, WBS y dependencias (M1b)

- **Estado:** review (ronda 2 entregada en `main`; veredicto revisor pendiente; no `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0115 (composer-2.5) / revisor-0115 (instancia `e4c8f011`, ronda 2/2 en vuelo); ronda 1 (`7f9998ed`) — **changes_requested**
- **WBS:** WBS-2.6 (parte 2)
- **Requisitos:** REQ-028, REQ-011; NFR-015
- **ADRs:** ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `apps/web/src/features/project/`, `apps/web/src/features/wbs/`, `docs/quality/reports/TASK-0115.md`
- **Rutas prohibidas:** `apps/web/src/features/shell/` (0103), Gantt (0117), Control Tower, REGISTRY, raíz, API backend (salvo consumo cliente existente)
- **Bloque de migraciones:** ninguna
- **Dependencias:** TASK-0103 (shell), TASK-0112 (API v1 en `main`)
- **Objetivo y alcance:** formularios accesibles para proyecto, árbol WBS y dependencias básicas; cliente API tipado; teclado y errores claros.
- **Fuera de alcance:** Gantt (0117), baseline UI completa, auth UI completa.
- **Criterios de aceptación (80/20):**
  1. Crear/editar proyecto y nodo WBS vía UI contra API real (sintético).
  2. Navegación por teclado en formulario principal (`:focus-visible`).
  3. Error de API mostrado sin filtrar datos de otro tenant.
  4. Feature autodescubierta bajo `features/project/` o `features/wbs/`.
- **Plan de pruebas:** Vitest componente; build web; 1–2 e2e manuales documentados o `not_run` con motivo.
- **Evidencia:** ronda 2 `0a42062`; reporte `d523842`; [informe TASK-0115](../../quality/reports/TASK-0115.md).
- **Revisión:** ronda 1 — **changes_requested** (`7f9998ed`); ronda 2 entregada — revisor `e4c8f011` en vuelo.
- **Rollback:** `git revert`.
