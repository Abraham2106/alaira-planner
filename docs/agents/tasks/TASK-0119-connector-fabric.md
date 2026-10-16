# TASK-0119 — Connector Fabric: tokens, webhooks, dedup y DLQ (M1c)

- **Estado:** integrated_provisional (integrado en `main`; no marcar `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0119 (instancia `bc-67098c38`) / revisor-0119 (instancia `bc-41e07b3d`, ronda 2/2 — **approve**); ronda 1 (`bc-b8f62d65`) — **changes_requested**
- **WBS:** WBS-5.2 (parte 2)
- **Requisitos:** REQ-064, REQ-087; TC-INT-01, TC-SEC-05
- **ADRs:** ADR-0003, ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** liberadas (provisional)
- **Rutas prohibidas:** SDK base (0104 salvo extensión vía imports), conectores GitHub/Slack reales (0120/0121), dominio evidence persistido (0118 salvo consumo), REGISTRY, raíz
- **Bloque de migraciones:** `0210–0219`
- **Dependencias:** TASK-0104 (Connector SDK), TASK-0109 (outbox / idempotencia)
- **Objetivo y alcance:** almacenamiento cifrado de tokens OAuth/sintéticos; ingreso HTTP de webhooks con verificación de firma y anti-replay; deduplicación por clave externa; health por conexión; reintentos y DLQ en worker; sin apps OAuth reales (secretos sintéticos).
- **Fuera de alcance:** normalización GitHub/Slack específica (0120/0121), persistencia final de EvidenceEvent (0118).
- **Criterios de aceptación (80/20):**
  1. Webhook duplicado o reordenado no produce doble efecto (TC-INT-01).
  2. Firma inválida o replay rechazado sin persistir efecto lateral.
  3. Secretos/tokens no aparecen en logs (TC-SEC-05 parcial).
  4. Health connected/degraded/disconnected/revoked expuesto vía API o SDK fabric.
  5. Tests Vitest + 2–4 integración Postgres/worker con payloads sintéticos.
- **Plan de pruebas:** firmas HMAC con claves de testkit; cola DLQ simulada; sin llamadas a GitHub/Slack.
- **Evidencia:** r1 `66ef63b`, `110be1f`; r2 `1cc7c94`, `211c9aa`; [informe TASK-0119](../../quality/reports/TASK-0119.md). Revisor r2 **approve** (`bc-41e07b3d`): connectors **7/7**; API **5/5**.
- **Revisión:** ronda 1 — **changes_requested** (`bc-b8f62d65`); ronda 2 — **approve** (`bc-41e07b3d`). Rutas **liberadas** en REGISTRY.
- **Rollback:** `git revert`; migraciones down; purga DLQ de prueba.
