# TASK-0118 — Evidencias y EvidenceEvent persistido (M1c)

- **Estado:** ready
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0118 (pendiente) / revisor-0118 (pendiente)
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
- **Evidencia:** reporte TASK-0118.
- **Rollback:** `git revert`; migraciones down.
