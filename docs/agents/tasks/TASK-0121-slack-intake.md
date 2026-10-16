# TASK-0121 — Slack intake: verificación, identidad e intención (M1c)

- **Estado:** proposed
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0121 (pendiente) / revisor-0121 (pendiente)
- **WBS:** WBS-5.1 (parte 1)
- **Requisitos:** REQ-093 (parcial intake); TC-BOT-01, TC-INT-03
- **ADRs:** ADR-0003, ADR-0005 (condicionado), ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/connectors/src/slack/`, `apps/api/src/modules/slack-intake/`, `apps/api/migrations/0230_*.sql`–`0239_*.sql`, `docs/quality/reports/TASK-0121.md`
- **Rutas prohibidas:** consecuencias Slack M1d (0125), AI runtime dominio (0124), fabric core (0119 salvo hooks), REGISTRY, raíz
- **Bloque de migraciones:** `0230–0239`
- **Dependencias:** TASK-0119 (webhooks fabric), TASK-0106 (authz / vínculo identidad)
- **Objetivo y alcance:** verificar origen Slack (firma fabric); mapear actor Slack ↔ usuario tenant; clasificar intención y desambiguar; crear solicitud pendiente sin mutar progreso; respuestas seguras ante comando ambiguo/duplicado/denegado (TC-BOT-01 parcial).
- **Fuera de alcance:** confirmar propuestas IA desde Slack (0125), Socket Mode app real obligatoria.
- **Criterios de aceptación (80/20):**
  1. Comando ambiguo o duplicado no aplica cambio de estado (TC-BOT-01 / TC-INT-03).
  2. Usuario sin permiso recibe rechazo explícito.
  3. Tests con eventos Slack sintéticos y authz 0106.
- **Plan de pruebas:** Vitest normalizador; integración API sin workspace Slack real.
- **Evidencia:** reporte TASK-0121.
- **Rollback:** `git revert`; migraciones down.
