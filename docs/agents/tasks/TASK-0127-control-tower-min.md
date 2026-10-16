# TASK-0127 — Control Tower mínimo y Ask/Command (M1d)

- **Estado:** review (no `accepted`; no `integrated_provisional` hasta veredicto revisor)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0127 (instancia `bc-a01d64b1`, entrega `c8e7afe`/`ac34cc2`) / revisor-0127 (en vuelo)
- **WBS:** WBS-2.7 (M1 mínimo)
- **Requisitos:** REQ-096, REQ-097; TC-UX-04, TC-AUD-04
- **ADRs:** ADR-0006, ADR-0005 (condicionado Ask/Command)
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `apps/web/src/features/control-tower/`, `docs/quality/reports/TASK-0127.md`
- **Rutas prohibidas:** shell core (0103 salvo portal), portafolio M4, REGISTRY, raíz
- **Bloque de migraciones:** ninguna
- **Dependencias:** TASK-0117 (Gantt), TASK-0124 (Ask/Command backend)
- **Objetivo y alcance:** cockpit excepciones, My Work básico, Ask/Command UI, vista Project Event Log legible.
- **Fuera de alcance:** Portfolio; RAID completo M4.
- **Criterios de aceptación (80/20):** navegación teclado en vistas principales; log legible.
- **Plan de pruebas:** Vitest componente; build web.
- **Evidencia:** `c8e7afe`, `ac34cc2`; [informe TASK-0127](../../quality/reports/TASK-0127.md). web vitest **25**; typecheck; build.
- **Revisión:** revisor en vuelo; rutas control-tower reservadas hasta veredicto.
- **Rollback:** `git revert`.
