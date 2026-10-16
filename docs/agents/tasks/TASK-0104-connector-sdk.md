# TASK-0104 — Connector SDK: contrato, eventos normalizados y conector falso

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0104 (composer-2.5) / revisor-0104 (instancia nueva)
- **WBS:** WBS-5.2 (parte 1)
- **Requisitos:** REQ-064, REQ-087; NFR-008
- **ADRs:** ADR-0003, ADR-0006
- **RR relacionada:** RR-0002
- **Rama / worktree:** `main` · copia principal. **Prohibido** crear ramas o worktrees. `git commit -s` y `git push origin main`.
- **Rutas reservadas:** `packages/connectors/src/sdk/`, `packages/connectors/src/fake/`, `packages/contracts/src/connectors/`, `docs/quality/reports/TASK-0104.md`
- **Rutas prohibidas:** REGISTRY, fichas TASK, SRS, ADRs, conectores reales Slack/GitHub/Google, OAuth real, archivos raíz, rutas de otras TASK
- **Bloque de migraciones:** ninguno
- **Dependencias:** TASK-0002 (contract-first)
- **Objetivo y alcance:** contrato del Connector SDK (`authorize`, `revoke`, `subscribe`, `backfill`, `receive_event`, `normalize`, `resolve_identity`, `fetch_artifact`, `execute_action`, `health_check`), eventos normalizados (`artifact.lifecycle.changed`, `user.intent.received`, `artifact.activity.detected`) y un conector falso de referencia.
- **Fuera de alcance:** tokens cifrados, webhooks firmados, DLQ (TASK-0119), GitHub/Slack reales.
- **Criterios de aceptación:**
  1. Interfaz SDK y declaración de capacidades tipadas.
  2. `normalize` produce EvidenceEvent-shape con campos de REQ-087 (sin persistir).
  3. Conector falso implementa el contrato; health_check con estados connected/degraded/disconnected/revoked.
  4. Un conector nuevo no exige editar el núcleo (solo añadir carpeta bajo `packages/connectors/src/`).
  5. Solo payloads sintéticos.
- **Plan de pruebas:** Vitest del SDK y del conector falso.
- **Riesgos / condiciones de parada:** no crear apps en Slack/GitHub; no secretos reales.
- **Evidencia:** commits en `main` + reporte.
- **Rollback:** `git revert` de tus commits.
