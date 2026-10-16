# RUN — Planner — 2026-10-16 — M1d TASK-0124 cierre / ready 0126–0128

**Agente / rol:** Planner/Orchestrator · **Worktree:** principal · **Rama:** `main`

## Contexto

- Revisor `bc-d26034fd` ronda 2 **approve** tras entrega `b91f0ab` + fix `85db5d2` (TS2322 `TenantId` / `toRuntimeActor`).
- `CONTINUAR_TRAS_G1 = no`; gate **TASK-0108** / ADR-0005 sigue abierto (no `accepted` en 0124).
- Rutas `ai-proposal` / `domain-tools` **liberadas (provisional)** en REGISTRY.

## Acciones

1. TASK-0124 → **integrated_provisional**; informe y ficha actualizados.
2. **ready** (sin asignar implementador): TASK-0126, TASK-0127, TASK-0128 (deps técnicas en provisional).
3. **proposed** (sin cambio): TASK-0125 (dependencia explícita TASK-0116 + gate humana línea base); TASK-0129 (E2E G1 + **0003**); TASK-0130 (superficie M1 completa).

## Checkpoint gates humanos (no bloquean `ready` 0126–0128 técnicos)

| Área | TASK | Pendiente |
|------|------|-----------|
| RLS / tenancy bootstrap | 0002 | aprobación humana RLS |
| IAM / auth | 0101 | aprobación humana auth |
| Authz / ADR-0007 | 0106 | aprobación humana authz/RLS |
| Asignaciones RLS | 0114 | aprobación humana RLS |
| Política IA | 0108 | aprobación humana ADR-0005 |
| OpenAPI público | 0112 | humana para `accepted` |
| Baseline / costos | 0116 | aprobación humana línea base (**bloquea 0125 ready**) |
| Discovery G1 | 0003 | humano (WBS-1.1) |

## Siguiente acción implementadores

- **TASK-0126–0128** (`ready`): reservar rutas vía Planner antes de `in_progress`.
- **TASK-0125**: esperar gate 0116 o decisión de mantenedor.
- **TASK-0129–0130**: no abrir hasta cierre técnico M1d y G1.

## Verificación

| Comando | Resultado |
|---------|-----------|
| `python3 scripts/validate_docs.py` | (post-commit en este run) |
