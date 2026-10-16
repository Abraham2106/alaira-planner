# TASK-0123 — Recuperación vectorial con permisos (M1d)

- **Estado:** in_progress (fix ronda 1 tras **changes_requested**; no `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0123 (instancia `bc-38fc6f14`, fix r1) / revisor-0123 (instancia `bc-fde52eb7`, ronda 1/1 — **changes_requested**)
- **WBS:** WBS-7.1
- **Requisitos:** REQ-068; TC-AI-03
- **ADRs:** ADR-0006, ADR-0007, ADR-0008 (pgvector); [RR-0003](../../requirements/records/RR-0003-m1-dev-sin-emulador-s3.md) (sin MinIO; blobs locales)
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/domain/src/retrieval/`, `packages/contracts/src/retrieval/`, `apps/api/src/modules/retrieval/`, `apps/api/migrations/0250_*.sql`–`0259_*.sql`, `docs/quality/reports/TASK-0123.md`
- **Rutas prohibidas:** herramientas IA dominio (0124), aceptación (0122), REGISTRY, raíz
- **Bloque de migraciones:** `0250–0259`
- **Dependencias:** TASK-0106 (authz), TASK-0118 (evidencia indexable)
- **Objetivo y alcance:** índice pgvector en Postgres; filtrado tenant/permisos antes de recuperar; citas y caducidad; embeddings sintéticos en CI.
- **Fuera de alcance:** modelos de embedding en producción; MinIO.
- **Criterios de aceptación (80/20):** actor restringido no ve citas ajenas; citas con metadatos mínimos.
- **Plan de pruebas:** Vitest dominio; integración Postgres con pgvector Docker.
- **Evidencia:** `fbcb3db`; [informe TASK-0123](../../quality/reports/TASK-0123.md). Dominio **4/4**; API integración **5/5** (ronda 1).
- **Revisión:** ronda 1 — **changes_requested** (`bc-fde52eb7`): exports `./acceptance` huérfanos en `package.json` domain/contracts (rutas **0122**); menores: test guest GET citations; `down.sql` sin `DROP EXTENSION vector`. Fix en rutas 0123.
- **Rollback:** `git revert`; migraciones down.
