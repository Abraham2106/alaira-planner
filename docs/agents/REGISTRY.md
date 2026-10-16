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
| [TASK-0109](tasks/TASK-0109-event-log.md) | implementador-0109 | Implementador | 2.4 | `main` | principal | liberadas | integrated_provisional | revisor approve (`d9b978fa`); domain 2/2; api integration 4/4; typecheck OK |
| [TASK-0110](tasks/TASK-0110-project-graph.md) | implementador-0110 | Implementador | 2.3 | `main` | principal | liberadas | integrated_provisional | revisor approve (`acbf1451`); domain 3/3; api 4/4; typecheck OK |
| [TASK-0111](tasks/TASK-0111-wbs-entregables.md) | implementador-0111 | Implementador | 3.1 | `main` | principal | liberadas | integrated_provisional | revisor approve (`0bc51793`); domain 4/4; api 4/4; entrega `3944d87`/`433431d` |
| [TASK-0112](tasks/TASK-0112-api-io.md) | implementador-0112 | Implementador | 2.5 | `main` | principal | liberadas | integrated_provisional | revisor approve (`da61391c`); contracts 1/1; api 5/5; typecheck OK; OpenAPI público matiz; **aprobación humana** para `accepted` |

| [TASK-0113](tasks/TASK-0113-programacion.md) | implementador-0113 | Implementador | 3.2 | `main` | principal | liberadas | integrated_provisional | revisor approve (`8cfb7e4a`); domain 1/1; api 4/4; entrega `3fb5600` |
| [TASK-0114](tasks/TASK-0114-asignaciones.md) | implementador-0114 | Implementador | 3.6 | `main` | principal | liberadas | integrated_provisional | revisor approve (`c4e2d65a`); `c27eb70`/`e465a8e`; **aprobación humana** RLS pendiente |
| [TASK-0115](tasks/TASK-0115-web-proyecto-wbs.md) | implementador-0115 | Implementador | 2.6 | `main` | principal | liberadas | integrated_provisional | revisor r2 approve (`e4c8f011`); r2 `0a42062`/`d523842`; r1 `changes_requested` (`7f9998ed`) |
| [TASK-0116](tasks/TASK-0116-baseline.md) | implementador-0116 | Implementador | 3.3 | `main` | principal | liberadas | integrated_provisional | revisor approve (`a4277779`); domain 2/2; api 4/4; typecheck OK; **aprobación humana** línea base/costos |
| [TASK-0117](tasks/TASK-0117-web-gantt.md) | implementador-0117 | Implementador | 3.3 | `main` | principal | liberadas (provisional) | integrated_provisional | revisor approve (`bc-5cb84ade`); Vitest web 18/18; typecheck/build OK; UI read-only; E2E not_run |
| [TASK-0118](tasks/TASK-0118-evidencia.md) | implementador-0118 | Implementador | 3.4 | `main` | principal | liberadas (provisional) | integrated_provisional | revisor r2 approve (`bc-1ea2b198`); r1 changes_requested (`bc-de0a4de8`); domain 5/5; api 4/4; alias fabric cerrado |
| [TASK-0119](tasks/TASK-0119-connector-fabric.md) | implementador-0119 | Implementador | 5.2 | `main` | principal | liberadas (provisional) | integrated_provisional | revisor r2 approve (`bc-41e07b3d`); r1 changes_requested (`bc-b8f62d65`); connectors 7/7; api 5/5 |
| [TASK-0120](tasks/TASK-0120-github.md) | implementador-0120 | Implementador | 5.4 | `main` | principal | liberadas (pendiente revisor) | review | `c591e24`/`83868ee`; [reporte](../quality/reports/TASK-0120.md); github 2/2; api 2/2; revisor `bc-31c93024` en vuelo |
| [TASK-0121](tasks/TASK-0121-slack-intake.md) | implementador-0121 | Implementador | 5.1 | `main` | principal | liberadas (provisional) | integrated_provisional | revisor r2 approve (`bc-1bc01205`); r1 changes_requested (`bc-3bd74776`); slack 3/3; api 3/3 |

Ola 3 M1a cerrada (0109–0112 provisional). M1b ola 1 cerrada (0113–0117 provisional). M1c ola 1 cerrada (0118–0119 provisional); ola 2 (0120 en **review**; 0121 provisional). `CONTINUAR_TRAS_G1 = no`. No M2/M3.
