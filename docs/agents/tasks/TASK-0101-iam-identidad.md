# TASK-0101 — IAM: tenants, usuarios, invitaciones, sesiones y CSRF

- **Estado:** integrated_provisional (integrado en `main`; no marcar `accepted` — auth/tenancy)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0101 (composer-2.5) / revisor-0101 (instancia nueva `88d11c0f`, ronda 2/2)
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
- **Evidencia:** [reporte TASK-0101](../../quality/reports/TASK-0101.md); commits en `main` (fix login 500: `a99129d`). Revisor ronda 2/2: **approve** (`88d11c0f`); `iam.integration.test.ts` 4/4 passed (Postgres Docker); `POST /auth/login` → **200** (no 500).
- **Revisión / autorización humana:** **REQUIERE_APROBACION_HUMANA:** sí (auth/tenancy) — **pendiente** del mantenedor. Hallazgos menores no bloqueantes: criterio 5 en modo 80/20 (suite integración); tests normalizan `set-cookie` cuando Fastify devuelve `string` vs `string[]`.
- **Rollback:** `git revert` de tus commits (p. ej. `a99129d` + migración `0104` si aplica).
