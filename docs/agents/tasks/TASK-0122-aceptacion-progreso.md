# TASK-0122 — Aceptación, progreso y rollup (M1d)

- **Estado:** review (implementación en `main`; no `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0122 (instancia `bc-bb5f7a94`) / revisor-0122 (pendiente asignación; en vuelo aparte)
- **WBS:** WBS-3.5
- **Requisitos:** REQ-033–REQ-038, REQ-095; TC-ACC-01..06, TC-PROG-02 (parcial M1)
- **ADRs:** ADR-0001, ADR-0006, ADR-0007; [RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md) §4 (estrategias de progreso)
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/domain/src/acceptance/`, `packages/contracts/src/acceptance/`, `apps/api/src/modules/acceptance/`, `apps/api/migrations/0240_*.sql`–`0249_*.sql`, `docs/quality/reports/TASK-0122.md`
- **Rutas prohibidas:** RAG (0123), AIProposal (0124), UI Control Tower (0127), REGISTRY, raíz
- **Bloque de migraciones:** `0240–0249`
- **Dependencias:** TASK-0111 (WBS/entregables), TASK-0118 (evidencia)
- **Objetivo y alcance:** solicitud, revisión, rechazo, reversión compensatoria y estrategias de progreso versionadas por paquete; rollup sin doble avance; datos sintéticos.
- **Fuera de alcance:** EVM financiero (M3), modos híbridos M2.
- **Criterios de aceptación (80/20):** TC-ACC-02..05 parcial; dedupe; no cierre con DoD incompleta (REQ-092 parcial vía dominio).
- **Plan de pruebas:** Vitest dominio; 2–4 integración Postgres; fixtures testkit.
- **Evidencia:** `ebabb35`, `85a8328`; [informe TASK-0122](../../quality/reports/TASK-0122.md). Dominio **31** tests (**5** acceptance); API integración **4/4**; migrate **0240–0241** ok; revisor pendiente.
- **Rollback:** `git revert`; migraciones down.
