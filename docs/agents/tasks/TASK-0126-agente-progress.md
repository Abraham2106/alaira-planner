# TASK-0126 — Agente Progress: evidencia → propuesta de avance (M1d)

- **Estado:** ready
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0126 (pendiente) / revisor-0126 (pendiente)
- **WBS:** WBS-7.4 (Progress)
- **Requisitos:** REQ-092; TC-AI-07
- **ADRs:** ADR-0005 (condicionado), ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/ai/src/agents/progress/`, `apps/worker/src/jobs/ai-progress/`, `docs/quality/reports/TASK-0126.md`
- **Rutas prohibidas:** Control Tower UI (0127), evals (0128), REGISTRY, raíz
- **Bloque de migraciones:** ninguna (reusa 0124)
- **Dependencias:** TASK-0124, TASK-0120 (evidencia GitHub)
- **Objetivo y alcance:** agente que reúne evidencia y propone avance contra criterios/DoD; sin auto-aceptar.
- **Fuera de alcance:** stand-up (M2/M4); finanzas.
- **Criterios de aceptación (80/20):** propuesta lista criterios cumplidos/pendientes.
- **Plan de pruebas:** Vitest con fixtures; job worker en test.
- **Evidencia:** reporte TASK-0126.
- **Rollback:** `git revert`.
