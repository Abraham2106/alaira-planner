# TASK-0125 — Slack: confirmación y consecuencias (M1d)

- **Estado:** proposed
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0125 (pendiente) / revisor-0125 (pendiente)
- **WBS:** WBS-5.1 (parte 2)
- **Requisitos:** REQ-093; TC-BOT-03
- **ADRs:** ADR-0003, ADR-0005 (condicionado), ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/connectors/src/slack/consequences/`, `apps/api/src/modules/slack-consequences/`, `apps/api/migrations/0270_*.sql`–`0279_*.sql`, `docs/quality/reports/TASK-0125.md`
- **Rutas prohibidas:** intake base (0121 salvo imports), fabric core (0119), REGISTRY, raíz
- **Bloque de migraciones:** `0270–0279`
- **Dependencias:** TASK-0121, TASK-0124, TASK-0116 (varianza/forecast lectura)
- **Objetivo y alcance:** confirmar propuestas desde Slack; respuestas con consecuencias en fechas/forecast sin mutar baseline; sintético.
- **Fuera de alcance:** Socket Mode obligatorio; M1d UI completa.
- **Criterios de aceptación (80/20):** TC-BOT-03 parcial documentado.
- **Plan de pruebas:** Vitest + integración API; payloads Slack sintéticos.
- **Evidencia:** reporte TASK-0125.
- **Rollback:** `git revert`; migraciones down.
