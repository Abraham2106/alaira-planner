# TASK-0116 — Baseline inmutable, forecast y real (M1)

- **Estado:** integrated_provisional (integrado en `main`; no marcar `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0116 (composer-2.5) / revisor-0116 (instancia `a4277779`, ronda 1/1 — **approve**)
- **WBS:** WBS-3.3 (M1)
- **Requisitos:** REQ-024, REQ-027; TC-BASE-01, TC-BASE-04
- **ADRs:** ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/domain/src/baseline/`, `packages/contracts/src/baseline/`, `apps/api/src/modules/baseline/`, `apps/api/migrations/0190_*.sql`–`0199_*.sql`, `docs/quality/reports/TASK-0116.md`
- **Rutas prohibidas:** cambios M2 (escenarios), web Gantt (0117), REGISTRY, raíz
- **Bloque de migraciones:** `0190–0199`
- **Dependencias:** TASK-0113 (programación), TASK-0109 (event log)
- **Objetivo y alcance:** baseline aprobada inmutable; forecast y real separados; varianza reproducible; eventos en Project Event Log.
- **Fuera de alcance:** solicitudes de cambio versionadas M2 (026/027 completos).
- **Criterios de aceptación (80/20):**
  1. Baseline congelada no muta al recalcular forecast (TC-BASE-01).
  2. Varianza fecha/costo documentada en reporte (TC-BASE-04 parcial).
  3. Tenant + authz.
  4. 2–4 tests integración Postgres.
- **Evidencia:** implementación `7fc4e02`; reporte `34f5f92`; [informe TASK-0116](../../quality/reports/TASK-0116.md). Revisor **approve** (`a4277779`): domain **2/2**; API integración **4/4**; typecheck OK.
- **Revisión / autorización humana:** **REQUIERE_APROBACION_HUMANA:** sí (línea base / costos / varianza) — **pendiente** del mantenedor.
- **Rollback:** `git revert`; migraciones down.
