# TASK-0106 — Autorización RBAC y deny by default

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0106 (composer-2.5) / revisor nuevo
- **WBS:** WBS-2.2
- **Requisitos:** REQ-003; NFR-002
- **ADRs:** ADR-0007
- **Rama / worktree:** `main` · copia principal. Sin ramas. `git commit -s` y `git push origin main`.
- **Rutas reservadas:** `packages/domain/src/authz/`, `packages/contracts/src/authz/`, `apps/api/src/modules/authz/`, `apps/api/migrations/0120_*.sql`–`0129_*.sql`, `docs/quality/reports/TASK-0106.md`
- **Rutas prohibidas:** REGISTRY, fichas TASK, SRS, ADRs, `package.json` raíz, lockfile, rutas de otras TASK
- **Bloque de migraciones:** `0120–0129`
- **Dependencias:** TASK-0101 (IAM en main)
- **Objetivo:** RBAC + reglas de recurso, deny by default, una función de política `actor × acción × recurso` en servidor. Pruebas negativas por endpoint nuevo (80/20: 2–4 casos, no una matriz infinita).
- **Fuera de alcance:** SSO, ABAC avanzado, UI de admin.
- **Criterios:** denegación sin permiso (TC-SEC-03); invitado no escribe; no solo en UI. Solo datos sintéticos.
- **Rollback:** `git revert` de tus commits.
