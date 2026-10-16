# TASK-0107 — Motor de capacidad (cálculo puro)

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0107 (composer-2.5) / revisor nuevo
- **WBS:** WBS-3.6 (cálculo M1)
- **Requisitos:** REQ-018, REQ-083
- **ADRs:** ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/engine/src/capacity/`, `packages/domain/src/capacity/`, `packages/contracts/src/capacity/`, `docs/quality/reports/TASK-0107.md`
- **Rutas prohibidas:** persistencia, API HTTP, `schedule/` (0102), archivos raíz, otras TASK
- **Migraciones:** ninguna (puro)
- **Dependencias:** TASK-0102
- **Objetivo:** trabajo/duración/unidades, calendarios por persona, detección de sobreasignación. Sin framework ni BD.
- **Fuera de alcance:** persistir personas (TASK-0114), nivelación M5, timesheets M3.
- **Criterios 80/20:** 1–2 tests (sobreasignación + cambio de unidades). TC-RES-02/04 a escala cálculo.
- **Rollback:** `git revert` de tus commits.
