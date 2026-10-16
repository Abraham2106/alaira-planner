# TASK-0114 — Asignaciones y sobreasignación persistidas (M1)

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0114 (composer-2.5) / revisor nuevo (instancia distinta)
- **WBS:** WBS-3.6 (persistencia M1)
- **Requisitos:** REQ-017, REQ-018, REQ-083
- **ADRs:** ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/domain/src/assignments/`, `packages/contracts/src/assignments/`, `apps/api/src/modules/assignments/`, `apps/api/migrations/0180_*.sql`–`0189_*.sql`, `docs/quality/reports/TASK-0114.md`
- **Rutas prohibidas:** `packages/engine/src/capacity/` (0107), timesheets M3, nivelación M5, scheduling API (0113), REGISTRY, raíz
- **Bloque de migraciones:** `0180–0189`
- **Dependencias:** TASK-0107 (motor capacidad), TASK-0111 (WBS)
- **Objetivo y alcance:** personas/equipos sintéticos, asignación a work items, detección de sobreasignación vía engine; API y RLS.
- **Fuera de alcance:** timesheets (M3), nivelación automática (M5).
- **Criterios de aceptación (80/20):**
  1. Sobreasignación detectada en escenario 80/20 (TC-RES-02).
  2. Cambio de unidades recalcula triángulo work/duration (TC-RES-04 parcial).
  3. Authz + tenant en mutaciones.
  4. Solo datos sintéticos en fixtures.
- **Plan de pruebas:** Vitest integración Postgres; 2–4 casos.
- **Evidencia:** reporte TASK-0114.
- **Rollback:** `git revert`; migraciones down.
