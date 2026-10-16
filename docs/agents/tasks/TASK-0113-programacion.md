# TASK-0113 — Programación persistida: calendarios, dependencias y recálculo CPM

- **Estado:** review (entrega en `main`; veredicto revisor pendiente; no `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0113 (composer-2.5) / revisor-0113 (instancia `8cfb7e4a`, ronda 1 en vuelo)
- **WBS:** WBS-3.2 (integración M1b)
- **Requisitos:** REQ-020, REQ-021, REQ-022, REQ-023, REQ-028; NFR-019
- **ADRs:** ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/domain/src/scheduling/`, `packages/contracts/src/scheduling/`, `apps/api/src/modules/scheduling/`, `apps/api/migrations/0170_*.sql`–`0179_*.sql`, `docs/quality/reports/TASK-0113.md`
- **Rutas prohibidas:** `packages/engine/src/schedule/` (motor puro 0102), baseline (0116), web (0117), REGISTRY, raíz, otras TASK
- **Bloque de migraciones:** `0170–0179`
- **Dependencias:** TASK-0102 (motor CPM), TASK-0111 (WBS/work items en `main`)
- **Objetivo y alcance:** persistir calendarios, dependencias FS/SS/FF/SF y lag/lead; invocar `@alaira/engine` para CPM; exponer API tenant-safe; recálculo reproducible.
- **Fuera de alcance:** restricciones M2, Gantt UI (0117), baseline (0116), asignaciones (0114).
- **Criterios de aceptación (80/20):**
  1. Dependencia FS con lag persiste y recálculo coincide con motor (TC-SCH-03/04 a escala integración).
  2. Ciclo detectado antes de persistir cálculo inválido.
  3. Cross-tenant → 404; sin permiso → deny (0106).
  4. Idempotencia en comando de recálculo donde aplique (0109).
- **Plan de pruebas:** Vitest; Postgres Docker; 2–4 integración; oráculo vs engine.
- **Evidencia:** entrega `3fb5600`; [informe TASK-0113](../../quality/reports/TASK-0113.md).
- **Rollback:** `git revert`; migraciones `017x` down.
