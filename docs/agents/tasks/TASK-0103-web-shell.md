# TASK-0103 — Shell web: diseño base, navegación, a11y y cliente API

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0103 (composer-2.5) / revisor-0103 (instancia nueva)
- **WBS:** WBS-2.6 (parte 1)
- **Requisitos:** REQ-076, REQ-078; NFR-013
- **ADRs:** ADR-0006
- **RR relacionada:** RR-0002
- **Rama / worktree:** `main` · copia principal. **Prohibido** crear ramas o worktrees. `git commit -s` y `git push origin main`.
- **Rutas reservadas:** `apps/web/src/features/shell/`, `apps/web/src/lib/api-client/`, `apps/web/src/styles/`, `docs/quality/reports/TASK-0103.md`
- **Rutas prohibidas:** REGISTRY, fichas TASK, SRS, ADRs, `apps/web/src/features/` de otras features, `package.json` raíz, lockfile, `docker-compose.yml`, rutas de otras TASK
- **Bloque de migraciones:** ninguno
- **Dependencias:** TASK-0002 (contract-first: shell sobre Vite/React; si `apps/web` no existe, crea solo tus rutas y un `apps/web/package.json` mínimo sin pisar el de 0002 si ya está)
- **Objetivo y alcance:** shell React, diseño base, navegación, a11y base (teclado, focos, semántica, contraste) y cliente API tipado contra contratos públicos.
- **Fuera de alcance:** formularios de proyecto/WBS (TASK-0115), Gantt, Control Tower, auth UI completa.
- **Criterios de aceptación:**
  1. Layout con navegación por teclado y focos visibles (TC-UX-01 a escala shell).
  2. Fechas/zonas horarias explícitas en la UI (REQ-078).
  3. Cliente API tipado que consume `/api/v1` (sin API privada).
  4. Sin secretos en el bundle; solo datos sintéticos en stories/tests.
- **Plan de pruebas:** Vitest de componentes + comprobación a11y; Playwright E2E `not_run` si no hay app levantada.
- **Riesgos / condiciones de parada:** no añadir dependencias GPL/AGPL.
- **Evidencia:** commits en `main` + reporte.
- **Rollback:** `git revert` de tus commits.
