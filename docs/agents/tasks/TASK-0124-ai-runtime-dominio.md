# TASK-0124 — AI runtime: herramientas de dominio y AIProposal (M1d)

- **Estado:** proposed
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0124 (pendiente) / revisor-0124 (pendiente)
- **WBS:** WBS-7.2 (parte 2)
- **Requisitos:** REQ-090–REQ-092; TC-AI-04..07, TC-AI-09
- **ADRs:** ADR-0005 (condicionado), ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/ai/src/domain-tools/`, `packages/contracts/src/ai-proposal/`, `apps/api/src/modules/ai-proposal/`, `apps/api/migrations/0260_*.sql`–`0269_*.sql`, `docs/quality/reports/TASK-0124.md`
- **Rutas prohibidas:** evals harness (0128), Control Tower UI (0127), REGISTRY, raíz
- **Bloque de migraciones:** `0260–0269`
- **Dependencias:** TASK-0108 (runtime core), TASK-0122, TASK-0123
- **Objetivo y alcance:** ejecutores de dominio tipados; AIProposal persistida; autonomía aplicada; trazabilidad REQ-091 (9 campos) vía event log.
- **Fuera de alcance:** agente Progress completo (0126); Slack consecuencias (0125).
- **Criterios de aceptación (80/20):** mutación solo vía herramienta; acción controlada sin aprobación rechazada.
- **Plan de pruebas:** Vitest `packages/ai`; integración API con políticas sintéticas.
- **Evidencia:** reporte TASK-0124.
- **Revisión / autorización humana:** **REQUIERE_APROBACION_HUMANA:** sí (ADR-0005) — pendiente mantenedor para `accepted`.
- **Rollback:** `git revert`; migraciones down.
