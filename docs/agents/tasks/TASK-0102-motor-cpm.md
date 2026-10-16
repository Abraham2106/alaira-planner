# TASK-0102 — Motor CPM puro: calendarios, dependencias y holgura

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0102 (composer-2.5) / revisor-0102 (instancia nueva)
- **WBS:** WBS-3.2 (cálculo M1)
- **Requisitos:** REQ-020, REQ-021, REQ-022, REQ-023; NFR-019
- **ADRs:** ADR-0006
- **RR relacionada:** RR-0002
- **Rama / worktree:** `main` · copia principal. **Prohibido** crear ramas o worktrees. `git commit -s` y `git push origin main`.
- **Rutas reservadas:** `packages/engine/src/schedule/`, `packages/domain/src/schedule/`, `packages/contracts/src/schedule/`, `docs/quality/reports/TASK-0102.md`
- **Rutas prohibidas:** REGISTRY, fichas TASK, SRS, ADRs, persistencia, API HTTP, UI, archivos raíz del monorepo, rutas de otras TASK
- **Bloque de migraciones:** ninguno (motor puro)
- **Dependencias:** TASK-0002 (contract-first; paquete `engine` puede nacer en tus rutas)
- **Objetivo y alcance:** motor determinista puro (sin framework ni BD): calendarios, feriados, zona horaria, FS/SS/FF/SF, lag/lead, CPM, holgura total/libre, detección de ciclos.
- **Fuera de alcance:** persistencia y API (TASK-0113), restricciones M2, Gantt, asignaciones.
- **Criterios de aceptación:**
  1. Calendario 5×8 con feriado y zona horaria produce fechas reproducibles (TC-SCH-02).
  2. FS/SS/FF/SF con lag/lead documentados (TC-SCH-03, TC-SCH-04).
  3. CPM y camino crítico coinciden con oráculo independiente; fast-check sobre invariantes (TC-SCH-05).
  4. Ciclos se detectan y rechazan antes de calcular.
  5. Caso de horario de verano cubierto o `not_run` justificado.
- **Plan de pruebas:** Vitest + fast-check; oráculo en el reporte.
- **Riesgos / condiciones de parada:** si el cálculo no es puro o depende de reloj/BD → blocked.
- **Evidencia:** commits en `main` + reporte.
- **Rollback:** `git revert` de tus commits.
