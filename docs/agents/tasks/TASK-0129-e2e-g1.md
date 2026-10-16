# TASK-0129 — E2E UC-06 y batería G1 (M1d cierre)

- **Estado:** proposed
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0129 (pendiente) / revisor-0129 (pendiente)
- **WBS:** WBS-8.1
- **Requisitos:** escenario UC-06 SRS; TC G1 del ROADMAP
- **ADRs:** ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `apps/web/e2e/g1/`, `docs/quality/reports/G1.md`, `docs/quality/reports/TASK-0129.md`
- **Rutas prohibidas:** features producto fuera de flujo G1, REGISTRY, raíz
- **Bloque de migraciones:** ninguna
- **Dependencias:** TASK-0122–TASK-0128 (M1d técnico); TASK-0003 (discovery humano para gate G1 completo)
- **Objetivo y alcance:** Playwright del circuito UC-06; informe G1 con TC ejecutados/not_run y motivos.
- **Fuera de alcance:** M2+; datos reales de piloto.
- **Criterios de aceptación (80/20):** informe G1 reproducible; P0 documentados.
- **Plan de pruebas:** Playwright + Postgres Docker; sin secretos reales.
- **Evidencia:** reporte TASK-0129 y G1.md.
- **Rollback:** `git revert`.
