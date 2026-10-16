# TASK-0107 — Motor de capacidad (cálculo puro)

- **Estado:** integrated_provisional (integrado en `main`; no marcar `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0107 (composer-2.5) / revisor-0107 (instancia `0c51caff`, ronda 2/2 — **approve**); ronda 1 (`3202f30b`) — **changes_requested**
- **WBS:** WBS-3.6 (cálculo M1)
- **Requisitos:** REQ-018, REQ-083
- **ADRs:** ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/engine/src/capacity/`, `packages/domain/src/capacity/`, `packages/contracts/src/capacity/`, `docs/quality/reports/TASK-0107.md`
- **Rutas prohibidas:** persistencia, API HTTP, `schedule/` (0102), archivos raíz, otras TASK
- **Migraciones:** ninguna (puro)
- **Dependencias:** TASK-0102
- **Objetivo:** trabajo/duración/unidades, calendarios por persona, detección de sobreasignación. Sin framework ni BD.
- **Fuera de alcance:** persistir personas (TASK-0114), nivelación M5, timesheets M3.
- **Criterios 80/20:** 1–2 tests (sobreasignación + cambio de unidades). TC-RES-02/04 a escala cálculo.
- **Evidencia:** motor `72e6864`; informe r2 `29a2be6`; [reporte TASK-0107](../../quality/reports/TASK-0107.md). Revisor r2 **approve** (`0c51caff`): `capacity.test.ts` **2/2**; typecheck `@alaira/engine`, `@alaira/domain`, `@alaira/contracts` OK.
- **Revisión:** ronda 1 — **changes_requested** (exports `./authz`/`./ai`); ronda 2 — exports válidos en `main` actual (0106/0108); deuda histórica en `72e6864` sin rewrite. `schedule.test.ts` no trackeado = ruido local, no 0107. **REQUIERE_APROBACION_HUMANA:** no (veredicto técnico).
- **Rollback:** `git revert` de tus commits (p. ej. `72e6864`, `29a2be6`).
