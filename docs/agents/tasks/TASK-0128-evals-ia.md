# TASK-0128 — Evals IA adversariales (M1d)

- **Estado:** proposed
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0128 (pendiente) / revisor-0128 (pendiente)
- **WBS:** WBS-7.3
- **Requisitos:** REQ-067 (parcial); TC-AI adversarial (ver TEST_STRATEGY)
- **ADRs:** ADR-0005 (condicionado)
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/ai/evals/`, `docs/quality/evals/`, `docs/quality/reports/TASK-0128.md`
- **Rutas prohibidas:** runtime dominio (0124 salvo consumo), REGISTRY, raíz
- **Bloque de migraciones:** ninguna
- **Dependencias:** TASK-0124
- **Objetivo y alcance:** dataset sintético adversarial; harness reproducible; propuesta de umbrales (aprobación humana del mantenedor).
- **Fuera de alcance:** red team completo (0130 parcial).
- **Criterios de aceptación (80/20):** harness corre en CI con fixtures; informe de umbrales propuestos.
- **Plan de pruebas:** comando documentado `pnpm` en paquete ai.
- **Evidencia:** reporte TASK-0128.
- **Revisión / autorización humana:** umbrales G1 requieren mantenedor.
- **Rollback:** `git revert`.
