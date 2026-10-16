# TASK-0118 — Evidencias y EvidenceEvent persistido (M1c)

- **Estado:** in_progress (fix ronda 2; no `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0118 (instancia `bc-bfe3777a`, fix ronda 2) / revisor-0118 (instancia `bc-de0a4de8`, ronda 1/1 — **changes_requested**)
- **WBS:** WBS-3.4
- **Requisitos:** REQ-087; TC-EV-03, TC-EV-04
- **ADRs:** ADR-0001, ADR-0006, ADR-0007; [RR-0003](../../requirements/records/RR-0003-m1-dev-sin-emulador-s3.md) (almacenamiento binario local sin MinIO obligatorio)
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/domain/src/evidence/`, `packages/contracts/src/evidence/`, `apps/api/src/modules/evidence/`, `apps/api/migrations/0200_*.sql`–`0209_*.sql`, `docs/quality/reports/TASK-0118.md`
- **Rutas prohibidas:** conectores GitHub/Slack (0120/0121), fabric webhooks (0119), progreso/aceptación (0122), REGISTRY, raíz, otras TASK
- **Bloque de migraciones:** `0200–0209`
- **Dependencias:** TASK-0111 (work items), TASK-0109 (event log / idempotencia)
- **Objetivo y alcance:** persistir evidencias (enlace, constancia, metadatos) y EvidenceEvent con todos los campos de REQ-087; procedencia y permisos tenant; adaptador de blobs (S3 API en prod; filesystem o mock en dev según RR-0003); solo payloads sintéticos.
- **Fuera de alcance:** UI de evidencia (M1d/0127), recuperación vectorial (0123), conectores externos (0119+).
- **Criterios de aceptación (80/20):**
  1. EvidenceEvent persistido con campos REQ-087 verificables en contrato y dominio (TC-EV-04).
  2. Evidencia no técnica (documento/enlace) admisible sin ser commit Git (TC-EV-03 parcial).
  3. Tenant + authz; otro tenant no lee blob ni fila.
  4. 2–4 tests integración Postgres + tests dominio mínimos.
- **Plan de pruebas:** Vitest dominio/contratos; integración API con fixtures sintéticos; sin MinIO en CI (Postgres + adaptador local).
- **Evidencia:** `282c2cf`, `997959e`; [informe TASK-0118](../../quality/reports/TASK-0118.md). Dominio **5/5**; API integración **4/4** (ronda 1).
- **Revisión:** ronda 1 — **changes_requested** (`bc-de0a4de8`): alias Vitest `@alaira/connectors/fabric` acoplado a módulo **0119**; corrección en rutas 0118 sin depender de fabric WIP.
- **Rollback:** `git revert`; migraciones down.
