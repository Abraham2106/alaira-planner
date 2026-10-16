# TASK-0108 — AI runtime core: herramientas, política, proveedor falso

- **Estado:** in_progress
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0108 (composer-2.5) / revisor nuevo
- **WBS:** WBS-7.2 (parte 1)
- **Requisitos:** REQ-090, NFR-021
- **ADRs:** ADR-0005, ADR-0006
- **Rama / worktree:** `main`. Sin ramas. `git commit -s` y push.
- **Rutas reservadas:** `packages/ai/src/runtime/`, `packages/ai/src/tools/`, `packages/ai/src/providers/`, `packages/contracts/src/ai/`, `docs/quality/reports/TASK-0108.md`
- **Rutas prohibidas:** `packages/ai/src/poc/` (0002), RAG (0123), herramientas de dominio (0124), REGISTRY, raíz del monorepo
- **Migraciones:** ninguna
- **Dependencias:** TASK-0002 (esqueleto ai)
- **Objetivo:** contratos de herramientas, pasarela de políticas, niveles informar/proponer/controlado, AIProposal, adaptador OpenAI-compatible + proveedor falso determinista. Nunca prompt→mutación directa.
- **Fuera de alcance:** persistir propuestas, agentes Progress, Slack.
- **Criterios 80/20:** 1–2 tests (escritura directa rechazada + herramienta tipada permitida). Solo LLM falso. Cero credenciales reales.
- **Rollback:** `git revert` de tus commits.
