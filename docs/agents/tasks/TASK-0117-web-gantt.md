# TASK-0117 — Web Gantt: baseline, forecast y real (M1b UI)

- **Estado:** integrated_provisional (integrado en `main`; no marcar `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0117 (instancia `10c8a9d6`) / revisor-0117 (instancia `bc-5cb84ade`, ronda 1/1 — **approve**)
- **WBS:** WBS-3.3 (UI)
- **Requisitos:** REQ-028; NFR-015
- **ADRs:** ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** liberadas (provisional)
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
- **Evidencia:** `a1e3015`, `23b999f`, `e1bf796`; [informe TASK-0117](../../quality/reports/TASK-0117.md). Revisor **approve** (`bc-5cb84ade`): Vitest web **18/18**; typecheck/build OK; UI read-only (sin mutar baseline); E2E **not_run**.
- **Rollback:** `git revert`.
