# TASK-0109 — Event log, outbox e idempotencia (Project Event Log)

- **Estado:** review (entrega en `main`; veredicto revisor pendiente; no `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0109 (composer-2.5) / revisor ronda 1 (nuevo, no implementador) en vuelo
- **WBS:** WBS-2.4
- **Requisitos:** REQ-029, REQ-037, REQ-097; NFR-012
- **ADRs:** ADR-0006, ADR-0007
- **RR relacionada:** RR-0002
- **Rama / worktree:** `main` · copia principal. **Prohibido** ramas/worktrees. `git commit -s` y `git push origin main`.
- **Rutas reservadas:** `packages/domain/src/eventlog/`, `packages/contracts/src/eventlog/`, `apps/api/src/modules/eventlog/`, `apps/worker/src/jobs/eventlog/`, `apps/api/migrations/0130_*.sql`–`0139_*.sql`, `docs/quality/reports/TASK-0109.md`
- **Rutas prohibidas:** REGISTRY, fichas TASK, SRS, ADRs, `TRACEABILITY.md`, raíz del monorepo, lockfile, workflows, rutas de otras TASK
- **Bloque de migraciones:** `0130–0139`
- **Dependencias:** TASK-0106 (authz en `main`; usar política existente, no reabrir IAM/RLS salvo bug bloqueante)
- **Objetivo y alcance:** eventos append-only, outbox transaccional, claves de idempotencia, lectura del Project Event Log por proyecto con actor/causalidad; integración Postgres + RLS por tenant.
- **Fuera de alcance:** stream distribuido, conectores externos (0119), persistencia de propuestas IA (0124), UI del log (0127).
- **Criterios de aceptación (80/20):**
  1. Misma clave de idempotencia dos veces → un solo efecto persistido (TC-INT-01 a escala event log).
  2. Append-only: no UPDATE/DELETE de filas de evento; compensaciones como nuevos eventos.
  3. Outbox: publicación simulada o handler de prueba consume sin duplicar.
  4. Lectura filtrada por tenant/proyecto; cross-tenant → 404 o vacío autorizado.
- **Plan de pruebas:** Vitest unitario + integración con `docker compose up -d postgres`; fixtures sintéticos del testkit (0105); 2–4 tests integración máximo.
- **Riesgos / condiciones de parada:** contradice outbox POC (0002) → ADR/RR proposed y `blocked`.
- **Evidencia:** entrega `ecab8df`; [informe TASK-0109](../../quality/reports/TASK-0109.md).
- **Rollback:** `git revert` de tus commits; migraciones `down` documentadas.
