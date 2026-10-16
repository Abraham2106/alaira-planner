# TASK-0105 — Testkit: fixtures sintéticos y harness PostgreSQL

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0105 (composer-2.5-fast) / revisor-0105 (instancia nueva)
- **WBS:** WBS-8.1
- **Requisitos:** NFR-001, NFR-008 (harness); fixtures de TEST_STRATEGY §3
- **ADRs:** ADR-0006, ADR-0007
- **RR relacionada:** RR-0002
- **Rama / worktree:** `main` · copia principal. **Prohibido** crear ramas o worktrees. `git commit -s` y `git push origin main`.
- **Rutas reservadas:** `packages/testkit/`, `docs/quality/reports/TASK-0105.md`
- **Rutas prohibidas:** REGISTRY, fichas TASK, SRS, ADRs, `apps/`, otros `packages/*`, archivos raíz del monorepo, rutas de otras TASK
- **Bloque de migraciones:** `0110–0119` solo si el harness exige SQL propio; si no, ninguno
- **Dependencias:** TASK-0002 (contract-first)
- **Objetivo y alcance:** fixtures sintéticos de TEST_STRATEGY §3 y harness de integración con PostgreSQL (arrancar/limpiar DB de prueba, dos tenants A/B).
- **Fuera de alcance:** E2E Playwright (TASK-0129), evals de IA (TASK-0128), CI raíz (TASK-0002).
- **Criterios de aceptación:**
  1. Fixtures: tenants A/B con usuarios homónimos; proyecto predictivo 2 niveles + 2 calendarios; proyecto ágil WIP=2; híbrido Plataforma 2.0; EvidenceEvents; AIProposals de 3 niveles; intento de escritura directa.
  2. Harness que levanta PostgreSQL de prueba o se documenta `not_run` si Docker no está.
  3. Cero datos reales; cero secretos.
  4. Exportable para que otras TASK importen `@alaira/testkit`.
- **Plan de pruebas:** Vitest que instancia fixtures y, si hay Docker, el harness.
- **Riesgos / condiciones de parada:** no commitear dumps con PII.
- **Evidencia:** commits en `main` + reporte.
- **Rollback:** `git revert` de tus commits.
