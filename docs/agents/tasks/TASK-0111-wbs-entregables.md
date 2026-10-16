# TASK-0111 — WBS: paquetes, entregables, hitos y criterios versionados

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0111 (instancia `19f6fc1f`, composer-2.5) / revisor nuevo (instancia distinta)
- **WBS:** WBS-3.1
- **Requisitos:** REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016
- **ADRs:** ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/domain/src/wbs/`, `packages/contracts/src/wbs/`, `apps/api/src/modules/wbs/`, `apps/api/migrations/0150_*.sql`–`0159_*.sql`, `docs/quality/reports/TASK-0111.md`
- **Rutas prohibidas:** motor CPM (0102/0113), project-graph salvo consumo vía contratos (0110), REGISTRY, raíz, otras TASK
- **Bloque de migraciones:** `0150–0159`
- **Dependencias:** TASK-0110 (proyecto/work nodes en `main`)
- **Objetivo y alcance:** árbol WBS sin ciclos, paquetes con responsable y criterios, entregables versionados, hitos duración cero; vínculo a work items sin duplicar identidad.
- **Fuera de alcance:** programación CPM (0113), Gantt (0117), aceptación formal (0122).
- **Criterios de aceptación (80/20):**
  1. Árbol WBS sin ciclos; código duplicado rechazado (TC-WBS-01).
  2. Crear paquete con criterios mínimos (TC-WBS-02).
  3. Entregable con versión/criterios editables (TC-WBS-03).
  4. Authz + tenant en escrituras; invitado no crea paquete raíz.
- **Plan de pruebas:** Vitest; Postgres Docker; 2–4 tests integración.
- **Evidencia:** reporte TASK-0111 al cerrar.
- **Rollback:** `git revert` + migraciones down.
