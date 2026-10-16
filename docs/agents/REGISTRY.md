# Registro central de agentes y asignaciones

**Control de escritura:** exclusivamente Planner. Solo `main`. Integración provisional ≠ `accepted`. Tenancy/RLS de 0002 y 0101 **requieren visto humano**.

| TASK | Agente | Rol | WBS | Rama | Worktree | Rutas reservadas | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|
| [TASK-0001](tasks/TASK-0001-g0-alineacion-documental.md) | docs | Documentación | 1.2–1.5 | `main` | principal | liberadas | accepted | PR #7 |
| [TASK-0002](tasks/TASK-0002-bootstrap-monorepo-y-poc.md) | implementador-0002 | Implementador | 1.3, 1.4, 8.1 | `main` | principal | liberadas (provisional) | integrated_provisional | revisor approve; POC 4/4 Postgres; **aprobación humana** RLS |
| [TASK-0003](tasks/TASK-0003-discovery.md) | humano | Research | 1.1 | `main` | principal | `docs/research/discovery/` | ready | — |
| [TASK-0101](tasks/TASK-0101-iam-identidad.md) | implementador-0101 | Implementador | 2.1 | `main` | principal | liberadas (provisional) | integrated_provisional | revisor approve ronda 2 (`88d11c0f`); IAM 4/4; login 200; fix `a99129d`; hallazgos menores; **aprobación humana** auth |
| [TASK-0102](tasks/TASK-0102-motor-cpm.md) | implementador-0102 | Implementador | 3.2 | `main` | principal | liberadas | integrated_provisional | approve |
| [TASK-0103](tasks/TASK-0103-web-shell.md) | implementador-0103 | Implementador | 2.6 | `main` | principal | liberadas | integrated_provisional | approve |
| [TASK-0104](tasks/TASK-0104-connector-sdk.md) | implementador-0104 | Implementador | 5.2 | `main` | principal | liberadas | integrated_provisional | approve |
| [TASK-0105](tasks/TASK-0105-testkit.md) | implementador-0105 | Implementador | 8.1 | `main` | principal | liberadas | integrated_provisional | approve |
| [TASK-0106](tasks/TASK-0106-authz.md) | implementador-0106 | Implementador | 2.2 | `main` | principal | `packages/domain/src/authz/`, `packages/contracts/src/authz/`, `apps/api/src/modules/authz/`, `apps/api/migrations/0120_*.sql`–`0129_*.sql`, `docs/quality/reports/TASK-0106.md` | in_progress | ola 2 |
| [TASK-0107](tasks/TASK-0107-motor-capacidad.md) | implementador-0107 | Implementador | 3.6 | `main` | principal | `packages/engine/src/capacity/`, `packages/domain/src/capacity/`, `packages/contracts/src/capacity/`, `docs/quality/reports/TASK-0107.md` | review | entrega `72e6864`; engine 15 tests; revisor ronda 1 (`3202f30b`) en vuelo |
| [TASK-0108](tasks/TASK-0108-ai-runtime-core.md) | implementador-0108 | Implementador | 7.2 | `main` | principal | `packages/ai/src/runtime/`, `packages/ai/src/tools/`, `packages/ai/src/providers/`, `packages/contracts/src/ai/`, `docs/quality/reports/TASK-0108.md` | in_progress | ola 2 |

Ola 2 abierta. `CONTINUAR_TRAS_G1 = no`.
