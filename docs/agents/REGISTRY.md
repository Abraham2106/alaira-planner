# Registro central de agentes y asignaciones

**Control de escritura:** exclusivamente Planner. **Estado:** G0 en `main` (PR #7). Instrucción del mantenedor: **solo `main`, sin ramas**; ola 1 en paralelo con rutas exclusivas.

| TASK | Agente | Rol | WBS / REQ | Rama | Worktree local | Rutas reservadas | Estado | Última evidencia |
|---|---|---|---|---|---|---|---|---|
| [TASK-0001](tasks/TASK-0001-g0-alineacion-documental.md) | agente de documentación | Documentación | WBS-1.2, 1.3, 1.5 | `main` | copia principal | liberadas | accepted | [PR #7](https://github.com/Abraham2106/alaira-planner/pull/7) |
| [TASK-0002](tasks/TASK-0002-bootstrap-monorepo-y-poc.md) | implementador-0002 (composer-2.5) | Implementador | WBS-1.3, 1.4, 8.1 | `main` | copia principal | `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig*.json`, `.nvmrc`, `.gitignore`, `.npmrc`, `docker-compose.yml`, `Dockerfile*`, `.github/workflows/ci.yml`, `apps/api/src/bootstrap/`, `apps/api/src/modules/poc/`, `apps/api/migrations/0000_*.sql`–`0009_*.sql`, `apps/worker/src/bootstrap/`, `apps/worker/src/jobs/poc/`, `apps/web/src/bootstrap/`, `packages/ai/src/poc/`, `docs/quality/reports/TASK-0002.md` | in_progress | en curso; rutas recortadas para ola 1 |
| [TASK-0003](tasks/TASK-0003-discovery.md) | por asignar (humano) | Product Research | WBS-1.1 | `main` | copia principal | `docs/research/discovery/` | ready | — |
| [TASK-0101](tasks/TASK-0101-iam-identidad.md) | implementador-0101 (composer-2.5) | Implementador | WBS-2.1 · REQ-001,002,004,009 | `main` | copia principal | `packages/domain/src/iam/`, `packages/contracts/src/iam/`, `apps/api/src/modules/iam/`, `apps/api/migrations/0100_*.sql`–`0109_*.sql`, `docs/quality/reports/TASK-0101.md` | in_progress | ola 1 despachada |
| [TASK-0102](tasks/TASK-0102-motor-cpm.md) | implementador-0102 (composer-2.5) | Implementador | WBS-3.2 · REQ-020–023 | `main` | copia principal | `packages/engine/src/schedule/`, `packages/domain/src/schedule/`, `packages/contracts/src/schedule/`, `docs/quality/reports/TASK-0102.md` | in_progress | ola 1 despachada |
| [TASK-0103](tasks/TASK-0103-web-shell.md) | implementador-0103 (composer-2.5) | Implementador | WBS-2.6 · REQ-076,078 | `main` | copia principal | `apps/web/src/features/shell/`, `apps/web/src/lib/api-client/`, `apps/web/src/styles/`, `docs/quality/reports/TASK-0103.md` | in_progress | ola 1 despachada |
| [TASK-0104](tasks/TASK-0104-connector-sdk.md) | implementador-0104 (composer-2.5) | Implementador | WBS-5.2 · REQ-064,087 | `main` | copia principal | `packages/connectors/src/sdk/`, `packages/connectors/src/fake/`, `packages/contracts/src/connectors/`, `docs/quality/reports/TASK-0104.md` | in_progress | ola 1 despachada |
| [TASK-0105](tasks/TASK-0105-testkit.md) | implementador-0105 (composer-2.5-fast) | Implementador | WBS-8.1 | `main` | copia principal | `packages/testkit/`, `docs/quality/reports/TASK-0105.md` | in_progress | ola 1 despachada |

## Olas

`CONTINUAR_TRAS_G1 = no`. Commits concurrentes: `git pull --rebase origin main` antes de push; nunca `--force`.

| Ola | TASK | Estado |
|---|---|---|
| 0 | 0002 | in_progress (infra recortada) |
| 1 | 0101–0105 | in_progress en paralelo |
| 2–12 | 0106–0130 | no abierta |

## Reglas del registro

Rutas excluyentes. Sin ramas ni worktrees por instrucción del mantenedor. Las fichas viven en [`tasks/`](tasks/).
