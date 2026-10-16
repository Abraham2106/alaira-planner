# TASK-0120 — Conector GitHub: PR/merge → EvidenceEvent (M1c)

- **Estado:** proposed
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0120 (pendiente) / revisor-0120 (pendiente)
- **WBS:** WBS-5.4
- **Requisitos:** REQ-087; TC-GH-01
- **ADRs:** ADR-0001, ADR-0003, ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/connectors/src/github/`, `apps/api/src/modules/github-connector/`, `apps/api/migrations/0220_*.sql`–`0229_*.sql`, `docs/quality/reports/TASK-0120.md`
- **Rutas prohibidas:** Slack (0121), SDK/fabric core (0119 salvo registro), evidence domain (0118 salvo API pública), REGISTRY, raíz
- **Bloque de migraciones:** `0220–0229`
- **Dependencias:** TASK-0118 (EvidenceEvent persistido), TASK-0119 (ingreso webhook y tokens)
- **Objetivo y alcance:** conector GitHub sobre SDK+fabric: issues ↔ work items; eventos PR/review/merge/checks normalizados a EvidenceEvent vía 0118; nunca actualizar % de avance directamente; fixtures y webhooks sintéticos.
- **Fuera de alcance:** OAuth GitHub App real en producción, Actions completas, Google.
- **Criterios de aceptación (80/20):**
  1. Un PR mergeado sintético genera un único EvidenceEvent enlazado (TC-GH-01).
  2. Webhook falsificado o repetido sin pasar fabric → sin efecto.
  3. Tests del normalizador + integración mínima con 0118/0119 mockeados o en Postgres.
- **Plan de pruebas:** payloads JSON de referencia en testkit; sin PAT real.
- **Evidencia:** reporte TASK-0120.
- **Rollback:** `git revert`; migraciones down.
