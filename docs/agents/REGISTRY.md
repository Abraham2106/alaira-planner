# Registro central de agentes y asignaciones

**Control de escritura:** exclusivamente Planner. **Estado:** G0 en `main` (PR #7). Instrucción del mantenedor (2026-10-15): **trabajar solo en `main`, sin ramas de integración ni de agente**.

| TASK | Agente | Rol | WBS / REQ | Rama | Worktree local | Rutas reservadas | Estado | Última evidencia |
|---|---|---|---|---|---|---|---|---|
| [TASK-0001](tasks/TASK-0001-g0-alineacion-documental.md) | agente de documentación (Cursor) | Documentación | WBS-1.2, 1.3, 1.5 | `main` | copia principal | liberadas (G0 fusionado) | accepted | [PR #7](https://github.com/Abraham2106/alaira-planner/pull/7) fusionado en `main` |
| [TASK-0002](tasks/TASK-0002-bootstrap-monorepo-y-poc.md) | implementador-0002 (composer-2.5) | Implementador | WBS-1.3, 1.4, 8.1 · REQ-001, 003, 037 · NFR-001, 008, 012, 015, 021 | `main` | copia principal | `apps/`, `packages/`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig*.json`, `.nvmrc`, `.gitignore`, `.npmrc`, `docker-compose.yml`, `Dockerfile*`, `.github/workflows/ci.yml`, `docs/quality/reports/TASK-0002.md` | in_progress | despachada en `main` |
| [TASK-0003](tasks/TASK-0003-discovery.md) | por asignar (humano) | Product Research | WBS-1.1 | `main` | copia principal | `docs/research/discovery/` | ready | — |

## Olas M1 pendientes (fichas al abrir cada ola)

Sin ramas: una TASK a la vez en la copia principal. `CONTINUAR_TRAS_G1 = no`.

| Ola | TASK candidatas | Depende de | Estado de la ola |
|---|---|---|---|
| 1 | 0101 iam, 0102 motor-cpm, 0103 web-shell, 0104 connector-sdk, 0105 testkit | 0002 en `main` con CI verde | blocked hasta 0002 |
| 2 | 0106 authz, 0107 motor-capacidad, 0108 ai-runtime-core | 0101 / 0102 / 0002 | no abierta |
| 3 | 0109 event-log, 0110 project-graph | 0106 | no abierta |
| 4 | 0111 wbs-entregables, 0112 api-io | 0109 / 0110 | no abierta |
| 5–12 | 0113–0130 (M1b–M1d) | según plan | no abierta |

## Reglas del registro

Reservar rutas excluyentes; actualizar estado cuando exista artefacto verificable. Nunca registrar tokens ni rutas con secretos. Por instrucción del mantenedor no se crean `agent/TASK-*`, `integration/*` ni worktrees hermanos. Las fichas viven en [`tasks/`](tasks/) con el formato de la [plantilla TASK](TASK_TEMPLATE.md).
