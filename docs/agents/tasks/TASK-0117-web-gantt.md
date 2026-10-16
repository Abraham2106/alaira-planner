# TASK-0117 — Web Gantt: baseline, forecast y real (M1b UI)

- **Estado:** ready
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** (sin asignar) / revisor nuevo
- **WBS:** WBS-3.3 (UI)
- **Requisitos:** REQ-028; NFR-015
- **ADRs:** ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `apps/web/src/features/gantt/`, `docs/quality/reports/TASK-0117.md`
- **Rutas prohibidas:** shell (0103), project/wbs forms (0115), REGISTRY, raíz
- **Bloque de migraciones:** ninguna
- **Dependencias:** TASK-0115 (formularios web), TASK-0116 (baseline/forecast en API)
- **Objetivo y alcance:** vista Gantt con baseline/forecast/real; alternativa tabular accesible equivalente; mismo dato canónico que API.
- **Fuera de alcance:** portafolio, Control Tower.
- **Criterios de aceptación (80/20):**
  1. Gantt o tabla muestra desviación respecto baseline (TC-UI-01 parcial).
  2. Alternativa tabular navegable por teclado.
  3. Sin mutar baseline desde UI.
  4. Build + tests de componente mínimos.
- **Evidencia:** reporte TASK-0117.
- **Rollback:** `git revert`.
