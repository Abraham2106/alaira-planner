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
| [TASK-0106](tasks/TASK-0106-authz.md) | implementador-0106 | Implementador | 2.2 | `main` | principal | liberadas | integrated_provisional | revisor approve (`e819e802`); domain 4/4; authz.integration 4/4 Postgres; TC-SEC-03; hallazgos menores; **aprobación humana** authz/RLS/ADR-0007 |
| [TASK-0107](tasks/TASK-0107-motor-capacidad.md) | implementador-0107 | Implementador | 3.6 | `main` | principal | liberadas | integrated_provisional | revisor approve r2 (`0c51caff`); capacity.test 2/2; typecheck engine/domain/contracts OK; deuda histórica `72e6864` |
| [TASK-0108](tasks/TASK-0108-ai-runtime-core.md) | implementador-0108 | Implementador | 7.2 | `main` | principal | liberadas | integrated_provisional | revisor approve (`a0d4c0b7`); ai 3/3; contracts 2/2; hallazgos menores; **aprobación humana** ADR-0005 |
| [TASK-0109](tasks/TASK-0109-event-log.md) | implementador-0109 | Implementador | 2.4 | `main` | principal | `packages/domain/src/eventlog/`, `packages/contracts/src/eventlog/`, `apps/api/src/modules/eventlog/`, `apps/worker/src/jobs/eventlog/`, `apps/api/migrations/0130_*.sql`–`0139_*.sql`, `docs/quality/reports/TASK-0109.md` | in_progress | ola 3 M1a |
| [TASK-0110](tasks/TASK-0110-project-graph.md) | implementador-0110 | Implementador | 2.3 | `main` | principal | `packages/domain/src/project/`, `packages/contracts/src/project/`, `apps/api/src/modules/project/`, `apps/api/migrations/0140_*.sql`–`0149_*.sql`, `docs/quality/reports/TASK-0110.md` | in_progress | ola 3 M1a |
| [TASK-0111](tasks/TASK-0111-wbs-entregables.md) | — | Implementador | 3.1 | `main` | principal | `packages/domain/src/wbs/`, `packages/contracts/src/wbs/`, `apps/api/src/modules/wbs/`, `apps/api/migrations/0150_*.sql`–`0159_*.sql`, `docs/quality/reports/TASK-0111.md` | ready | depende 0110 |
| [TASK-0112](tasks/TASK-0112-api-io.md) | — | Implementador | 2.5 | `main` | principal | `apps/api/src/modules/apiv1/`, `packages/contracts/src/apiv1/`, `apps/api/migrations/0160_*.sql`–`0169_*.sql`, `docs/quality/reports/TASK-0112.md` | ready | depende 0109, 0110 |

Ola 3 M1a abierta (0109–0112). Ola 2 cerrada. `CONTINUAR_TRAS_G1 = no`.
