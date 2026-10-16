# TASK-0002 — Bootstrap del monorepo y POC que valida ADR-0003, 0005, 0006 y 0007

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator (Cursor, 2026-10-15)
- **Agente ejecutor / revisor distinto:** implementador-0002 (composer-2.5) / revisor-0002 (instancia nueva, composer-2.5; no asignado hasta entrega)
- **WBS:** WBS-1.3, WBS-1.4, WBS-8.1 (base de CI)
- **Requisitos:** REQ-001, REQ-003, REQ-037, NFR-001, NFR-008, NFR-012, NFR-015, NFR-021
- **ADRs:** [ADR-0003](../../architecture/adr/0003-modular-monolith-candidate.md), [ADR-0005](../../architecture/adr/0005-agent-tools-policy-gate.md), [ADR-0006](../../architecture/adr/0006-stack-base.md), [ADR-0007](../../architecture/adr/0007-tenancy-y-autenticacion.md); todos aceptados con la condición de esta validación
- **RR relacionada:** [RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md)
- **Rama / worktree:** `main` · copia principal. **Prohibido** crear `agent/TASK-0002-*`, `integration/*` u otro worktree. Commits solo en `main` con `git commit -s`.
- **Rutas reservadas:** `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig*.json`, `.nvmrc`, `.gitignore`, `.npmrc`, `docker-compose.yml`, `Dockerfile*`, `.github/workflows/ci.yml`, `apps/api/src/bootstrap/`, `apps/api/src/modules/poc/`, `apps/api/migrations/0000_*.sql`–`0009_*.sql`, `apps/worker/src/bootstrap/`, `apps/worker/src/jobs/poc/`, `apps/web/src/bootstrap/`, `packages/ai/src/poc/`, `docs/quality/reports/TASK-0002.md`. No llenes `iam/`, `schedule/`, `connectors/`, `testkit/` ni `apps/web/src/features/`: están asignados a la ola 1.
- **Rutas prohibidas:** `docs/agents/REGISTRY.md`, fichas TASK, `AGENTS.md`, SRS, ADRs, `TRACEABILITY.md`, `docs/INDEX.md` (los hallazgos se proponen por RR o ADR, no se editan en esta tarea)
- **Bloque de migraciones:** `0000–0009` (primera migración sugerida: `0001_task0002_poc_tenancy_outbox`)
- **Dependencias:** TASK-0001 fusionada en `main` (PR #7)
- **Objetivo y alcance:** esqueleto del monorepo de ADR-0006, autodescubrimiento de módulos para que las TASK posteriores no editen registros centrales, y una prueba de concepto mínima que demuestre las decisiones condicionadas.
- **Fuera de alcance:** funcionalidad de producto más allá del POC (IAM completo, CPM, conectores reales, UI de producto), despliegue a nube, credenciales reales, SSO.
- **Entradas:** ADR-0003, 0005, 0006 y 0007; [TEST_STRATEGY](../../quality/TEST_STRATEGY.md); [ARCHITECTURE](../../architecture/ARCHITECTURE.md); solo datos sintéticos.
- **Salidas:** monorepo pnpm, `docker-compose.yml`, CI de producto, reporte de resultados en `docs/quality/reports/TASK-0002.md`.
- **Criterios de aceptación:**
  1. `docker compose up` levanta API, worker, web, PostgreSQL y almacenamiento S3 local.
  2. Una migración se aplica y se revierte (TC-OPS-02 a escala POC).
  3. Una prueba de aislamiento A/B pasa con RLS activo y el rol de aplicación sin `BYPASSRLS` (TC-SEC-01 a escala POC; el filtro de aplicación se desactiva a propósito y RLS sigue impidiendo leer el tenant B).
  4. Un comando de aceptación invocado dos veces con la misma clave produce un único evento en el outbox (REQ-037 / TC-INT-01 a escala POC).
  5. Una herramienta tipada de IA de prueba solo puede mutar el dominio a través de la pasarela de políticas; una escritura directa queda rechazada (NFR-021 / TC-AI-09 a escala POC).
  6. CI en verde con lint, typecheck, pruebas, auditoría de licencias y vulnerabilidades, y validación de docs.
  7. Autodescubrimiento: un módulo nuevo en `apps/api/src/modules/<contexto>/`, un job en `apps/worker/src/jobs/<contexto>/`, una feature en `apps/web/src/features/<feature>/` y un esquema en `packages/contracts/src/<contexto>/` se registran sin editar un archivo de registry/barrel central. El POC incluye un módulo de ejemplo cargado así.
- **Plan de pruebas:** Vitest para las pruebas de integración de los criterios 2–5 y 7; resultados en `docs/quality/reports/TASK-0002.md` con versión, fecha, comando y salida; cualquier criterio no ejecutado se reporta como `not_run`.
- **Riesgos / condiciones de parada:** si un criterio no se puede cumplir, se detiene y se propone un ADR sustituto; dependencias con licencia incompatible con Apache-2.0; no improvisar proveedores fuera de ADR-0006.
- **Evidencia:** commits en `main` y reporte de pruebas. No abrir PR ni crear ramas.
- **Revisión / autorización humana:** revisor distinto; cambios de tenancy y seguridad requieren aprobación humana. Un commit en `main` no es aceptación de hito.
- **Rollback:** `git revert` del commit en `main`; nada se despliega.
