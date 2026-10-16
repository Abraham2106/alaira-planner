# TASK-0112 — API v1, OpenAPI, búsqueda filtrada e import/export CSV

- **Estado:** ready
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** (sin asignar hasta `in_progress`) / revisor nuevo
- **WBS:** WBS-2.5
- **Requisitos:** REQ-010, REQ-063; NFR-008
- **ADRs:** ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `apps/api/src/modules/apiv1/`, `packages/contracts/src/apiv1/`, `apps/api/migrations/0160_*.sql`–`0169_*.sql`, `docs/quality/reports/TASK-0112.md`
- **Rutas prohibidas:** conectores (0119), web UI (0115), dominio WBS/project/eventlog salvo reexport en OpenAPI desde contratos existentes, REGISTRY, raíz, otras TASK
- **Bloque de migraciones:** `0160–0169` (solo si persistencia auxiliar de API keys o metadatos; preferir sin migración si no hace falta)
- **Dependencias:** TASK-0109, TASK-0110 (contratos y endpoints base en `main`)
- **Objetivo y alcance:** superficie HTTP `/api/v1` alineada con contratos Zod; documento OpenAPI generado o derivado; búsqueda paginada con filtros tenant-safe; import/export CSV de muestra con validación (sin truncamiento silencioso).
- **Fuera de alcance:** OAuth apps Slack/GitHub, webhooks salientes completos (M4), conectores.
- **Criterios de aceptación (80/20):**
  1. OpenAPI/contrato publicado y coherente con al menos proyecto + event log (TC-API-02 parcial).
  2. Paginación y filtros; respuesta 403/404 cross-tenant.
  3. Roundtrip CSV sintético documentado (TC-PORT-01 muestra).
  4. CSRF/sesión en escrituras donde aplique (IAM 0101).
- **Plan de pruebas:** Vitest integración API + Postgres; 2–4 casos.
- **Evidencia:** reporte TASK-0112.
- **Rollback:** `git revert`.
