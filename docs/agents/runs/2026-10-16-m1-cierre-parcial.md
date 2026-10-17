# RUN — Planner — 2026-10-16 — Cierre parcial M1 (provisional, G1 no aprobado)

**Agente / rol:** Planner/Orchestrator · **Worktree:** principal · **Rama:** `main`

**No** se marca `accepted`. **No** se aprueba G1. **No** es release. Este run no reescribe los runs de las pistas ni el corte 0.2.0. No se revirtió código.

Estado único: [REGISTRY](../REGISTRY.md). Corte de estado: [STATUS](../../governance/STATUS.md). Nota de pruebas: [TRACEABILITY](../../requirements/TRACEABILITY.md).

## Usable ahora

En el árbol local, sin release y sin G1:

- El cliente de sesión envía CSRF en las escrituras. El id del proyecto va en el hash. Logout solo limpia la sesión local si el POST de logout responde OK.
- El ejemplo ilustrativo queda en `#/ejemplo`. Inicio, paquetes, cronograma y control usan el proyecto activo. El avance que muestran es el del motor.
- El tick `ai-progress` está escrito para persistir una `AIProposal` `pending`, idempotente, con `modelRef` `fake-deterministic/v1` y `limitedAvailability`. Eso no declara la IA productiva.

La integración Postgres del flujo de UI y el tick vivo contra Postgres no se ejecutaron. No contar esas rutas como comprobadas en base real.

## Matriz

| Pieza | Implementado | Probado | Integrado | Aceptado |
|---|---|---|---|---|
| [TASK-0132](../tasks/TASK-0132-sesion-cliente.md) pista A: CSRF, `projectId` en el hash, logout solo si el POST OK | sí | typecheck web pasó después del parche. En el run de pista A: vitest web tocado 26/26, fabric 5/5, poc runtime 1/1 | `integrated_provisional` | no |
| Flujo UI de la pista A contra Postgres | — | **not_run** | no | no |
| Pista B: ejemplo solo en `#/ejemplo`; inicio, paquetes, cronograma y control con el proyecto activo; avance del motor. Ficha [TASK-0133](../tasks/TASK-0133-workhub-persistente.md) | sí, en el [run pista B](2026-10-16-m1-pista-b.md) | vitest **23/23** de esa pasada | la ficha sigue `proposed`: el run no la pasa a `integrated_provisional` | no |
| Pista B contra Postgres | — | **not_run** | no | no |
| Pista C: tick `ai-progress` persiste `AIProposal` `pending`, idempotente, `fake-deterministic/v1`, `limitedAvailability` | sí | worker vitest **10/10**. Revisor **approve** en [revisión C](2026-10-16-m1-revision-c.md) | el incremento no crea otra TASK; TASK-0126 sigue `integrated_provisional` | no |
| Tick vivo en Postgres | — | **not_run** | no | no |
| [TASK-0125](../tasks/TASK-0125-slack-consecuencias.md) | no | — | `proposed`; bloqueada por el gate humana de TASK-0116; no `ready` | no |
| [TASK-0129](../tasks/TASK-0129-e2e-g1.md) y [TASK-0130](../tasks/TASK-0130-seguridad-m1.md) | no | — | `proposed` | no |
| [Borrador G1](../../quality/reports/G1.md) | borrador | no cierra el gate | no | no aprueba G1 |

La revisión A/B fue `changes_requested` y después se corrigieron el typecheck y el logout. No fue un segundo approve formal. TASK-0132 no queda aprobada por esa corrección.

Las TASK que el registro ya tenía en `integrated_provisional` no se reabren aquí. TASK-0001 sigue `accepted`. TASK-0003 sigue `ready` y TASK-0131 sigue `review`. Este corte no suma aceptaciones.

## not_run

- Integración Postgres del flujo UI (pista A).
- Postgres del trabajo de proyecto (pista B).
- Tick vivo de `ai-progress` en Postgres (pista C). El verde de 10/10 es el doble de puertos.
- Batería de aceptación del SRS y UC-06 de punta a punta. El borrador G1 no las da por ejecutadas.
- Instalación real de Slack, GitHub y modelo de producción: no consta en estos runs.

## Gates humanos

Siguen abiertas. Este corte no las cierra:

| Gate | TASK |
|---|---|
| RLS / tenancy | 0002 |
| Auth | 0101 |
| Authz | 0106 |
| RLS de asignaciones | 0114 |
| ADR-0005 | 0108 |
| OpenAPI | 0112 |
| Línea base y costos | 0116 (bloquea TASK-0125; no pasa a `ready`) |
| Discovery | 0003 |
| Umbrales de evals | 0128 |

## Siguiente paso

Decisión del mantenedor sobre esas gates. Hasta entonces no hay `accepted`, no hay G1 y no se abre `ready` en TASK-0125. TASK-0133 permanece `proposed`: promoverla exigiría un estado que el run de pista B no declaró. Correr las pruebas `not_run` aportaría evidencia; no sustituye las gates ni aprueba G1.

## Rollback

No se ejecuta en este run.

- Revertir los commits de cada pista, o los archivos que lista su run. La pista B enumera los suyos en [2026-10-16-m1-pista-b.md](2026-10-16-m1-pista-b.md). La pista A revierte los archivos de [TASK-0132](../tasks/TASK-0132-sesion-cliente.md). La pista C revierte lo que nombra [2026-10-16-m1-pista-c.md](2026-10-16-m1-pista-c.md). No hacer `git reset` del árbol compartido.
- Este corte documental se revierte quitando el párrafo nuevo de [REGISTRY](../REGISTRY.md), el corte 2026-10-16 de [STATUS](../../governance/STATUS.md), la nota y la fila nueva de [TRACEABILITY](../../requirements/TRACEABILITY.md), la fila de este run en [INDEX](../../INDEX.md), y este archivo. El corte 0.2.0 y los párrafos anteriores del registro se quedan.
