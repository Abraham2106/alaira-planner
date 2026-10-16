# TASK-0106 — Autorización RBAC y deny by default

- **Estado:** integrated_provisional (integrado en `main`; no marcar `accepted` — authz/RLS/ADR-0007)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0106 (composer-2.5) / revisor-0106 (instancia `e819e802`, ronda 1/1)
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
- **Evidencia:** commit `f0cb142`; [reporte TASK-0106](../../quality/reports/TASK-0106.md). Revisor ronda 1/1: **approve** (`e819e802`); policy domain **4/4**; `authz.integration` **4/4** (Postgres); deny-by-default y **TC-SEC-03** OK.
- **Revisión / autorización humana:** **REQUIERE_APROBACION_HUMANA:** sí (authz/RLS/ADR-0007) — **pendiente** del mantenedor. Hallazgos menores no bloqueantes: stub `resolveActorContext` hasta `onReady`; `invited_org_role` no usado en accept IAM; `app_user` sin RLS en BD.
- **Rollback:** `git revert` de tus commits (p. ej. `f0cb142`).
