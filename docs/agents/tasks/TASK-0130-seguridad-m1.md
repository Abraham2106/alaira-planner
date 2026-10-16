# TASK-0130 — Seguridad M1: threat model, dependencias y red team IA (M1d)

- **Estado:** proposed
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0130 (pendiente) / revisor-0130 (pendiente)
- **WBS:** WBS-8.2
- **Requisitos:** NFR seguridad aplicables M1; TC-SEC relevantes G1
- **ADRs:** ADR-0005, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `docs/architecture/threat-model/`, `docs/quality/reports/TASK-0130.md`, `scripts/audit-licenses.sh` (si se crea)
- **Rutas prohibidas:** código producto salvo hooks CI mínimos acordados, REGISTRY, raíz
- **Bloque de migraciones:** ninguna
- **Dependencias:** TASK-0122–TASK-0129 (superficie M1)
- **Objetivo y alcance:** actualizar threat model M1; ejercicio red team IA documentado; auditoría licencias/dependencias.
- **Fuera de alcance:** G5 enterprise completo.
- **Criterios de aceptación (80/20):** informe con hallazgos y severidades; licencias sin bloqueantes Apache-2.0.
- **Plan de pruebas:** scripts documentados; not_run explícito si aplica.
- **Evidencia:** reporte TASK-0130.
- **Revisión / autorización humana:** sign-off seguridad antes de piloto.
- **Rollback:** `git revert` docs.
