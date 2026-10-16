# TASK-0002 — Bootstrap del monorepo y POC que valida ADR-0003, 0005, 0006 y 0007

- **Estado:** ready (se puede asignar en cuanto se fusione TASK-0001)
- **Planificador:** Planner
- **Agente ejecutor / revisor distinto:** por asignar / por asignar (distinto del ejecutor)
- **WBS:** WBS-1.3, WBS-1.4, WBS-8.1 (base de CI)
- **Requisitos:** REQ-001, REQ-003, REQ-037, NFR-001, NFR-008, NFR-012, NFR-015, NFR-021
- **ADRs:** [ADR-0003](../../architecture/adr/0003-modular-monolith-candidate.md), [ADR-0005](../../architecture/adr/0005-agent-tools-policy-gate.md), [ADR-0006](../../architecture/adr/0006-stack-base.md), [ADR-0007](../../architecture/adr/0007-tenancy-y-autenticacion.md); todos aceptados con la condición de esta validación
- **RR relacionada:** [RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md)
- **Rama / worktree:** `agent/TASK-0002-bootstrap` · `../alaira-wt-TASK-0002-bootstrap`
- **Rutas reservadas:** `apps/`, `packages/`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig*.json`, `.nvmrc`, `docker-compose.yml`, `.github/workflows/ci.yml`, `docs/quality/reports/TASK-0002.md`
- **Rutas prohibidas:** `docs/agents/REGISTRY.md`, `AGENTS.md`, SRS y ADRs (los hallazgos se proponen por RR o ADR, no se editan en esta tarea)
- **Dependencias:** TASK-0001 fusionada
- **Objetivo y alcance:** esqueleto del monorepo de ADR-0006 y una prueba de concepto mínima que demuestre las decisiones condicionadas.
- **Fuera de alcance:** funcionalidad de producto más allá del POC, despliegue a nube, conectores reales.
- **Entradas:** ADR-0003, 0005, 0006 y 0007; [TEST_STRATEGY](../../quality/TEST_STRATEGY.md); solo datos sintéticos.
- **Salidas:** monorepo, `docker-compose.yml`, CI, reporte de resultados en `docs/quality/reports/TASK-0002.md`.
- **Criterios de aceptación:**
  1. `docker compose up` levanta API, worker, web, PostgreSQL y almacenamiento S3 local.
  2. Una migración se aplica y se revierte.
  3. Una prueba de aislamiento A/B pasa con RLS activo y el rol de aplicación sin `BYPASSRLS`.
  4. Un comando de aceptación invocado dos veces con la misma clave produce un único evento en el outbox.
  5. Una herramienta tipada de IA de prueba solo puede mutar el dominio a través de la pasarela de políticas; una escritura directa queda rechazada.
  6. CI en verde con lint, typecheck, pruebas, auditoría de licencias y vulnerabilidades, y validación de docs.
- **Plan de pruebas:** Vitest para las pruebas de integración de los criterios 2–5; resultados registrados con versión y fecha; cualquier criterio no ejecutado se reporta como `not_run`.
- **Riesgos / condiciones de parada:** si un criterio no se puede cumplir, se detiene y se propone un ADR sustituto; dependencias con licencia incompatible con Apache-2.0.
- **Evidencia:** PR y reporte de pruebas.
- **Revisión / autorización humana:** revisor distinto + aprobación del mantenedor (afecta a seguridad y tenancy).
- **Rollback:** cerrar el PR; nada se despliega.
