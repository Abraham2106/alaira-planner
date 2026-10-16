# TASK-0101 — IAM: tenants, usuarios, invitaciones, sesiones y CSRF

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0101 (composer-2.5) / revisor-0101 (instancia nueva)
- **WBS:** WBS-2.1
- **Requisitos:** REQ-001, REQ-002, REQ-004, REQ-009; NFR-001, NFR-006
- **ADRs:** ADR-0006, ADR-0007
- **RR relacionada:** RR-0002
- **Rama / worktree:** `main` · copia principal. **Prohibido** crear ramas o worktrees. `git commit -s` y `git push origin main`.
- **Rutas reservadas:** `packages/domain/src/iam/`, `packages/contracts/src/iam/`, `apps/api/src/modules/iam/`, `apps/api/migrations/0100_*.sql` … `0109_*.sql`, `docs/quality/reports/TASK-0101.md`
- **Rutas prohibidas:** REGISTRY, fichas TASK, SRS, ADRs, `TRACEABILITY.md`, `package.json` raíz, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `docker-compose.yml`, `.github/workflows/`, rutas de otras TASK
- **Bloque de migraciones:** `0100–0109`
- **Dependencias:** TASK-0002 (contract-first: si el esqueleto aún no existe, crea solo tus rutas; no toques el bootstrap)
- **Objetivo y alcance:** tenants, usuarios, invitaciones de un solo uso, Argon2id, sesiones de servidor (cookie HttpOnly/Secure/SameSite=Lax), CSRF en escrituras, desactivación sin borrar historia.
- **Fuera de alcance:** RBAC completo (TASK-0106), SSO, MFA, tokens de API, SCIM.
- **Criterios de aceptación:**
  1. Crear organización/tenant y usuario local; contraseña con Argon2id.
  2. Invitar, aceptar invitación (token un solo uso + caducidad) y desactivar membresía; el desactivado no accede (TC-IAM-01).
  3. Sesión caducada se rechaza (TC-SEC-02); CSRF en POST/PATCH/DELETE.
  4. Tenant derivado de sesión, nunca de parámetro de cliente; ID de otro tenant = 404.
  5. Pruebas negativas por cada endpoint nuevo; solo datos sintéticos.
- **Plan de pruebas:** Vitest; reportar passed/failed/not_run con comando y salida.
- **Riesgos / condiciones de parada:** contradicción con ADR-0007 → blocked + ADR/RR proposed.
- **Evidencia:** commits en `main` + reporte. Requiere aprobación humana (auth/tenancy).
- **Rollback:** `git revert` de tus commits.
