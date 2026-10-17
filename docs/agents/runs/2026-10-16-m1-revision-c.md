# RUN — 2026-10-16 — Revisión M1 pista C

**Rol:** revisor y QA, distinto del implementador. **Veredicto:** `approve`.

**No** se marcó `accepted`. **No** se aprobó G1. **No** se implementó TASK-0125. **No** se editó `apps/`, `packages/` ni `docs/agents/REGISTRY.md`.

Fuentes leídas: [pista C](2026-10-16-m1-pista-c.md), `apps/worker/src/jobs/ai-progress/` (`index.ts`, `cycle.ts`, `process.ts`, `pg.ts`, `job.test.ts`), `packages/ai/src/agents/progress/run.ts`, `packages/ai/src/domain-tools/memory-store.ts`, `apps/api/migrations/0260_ai_proposal.up.sql`.

## Veredicto

`approve`. El tick, con `AI_PROGRESS_WORKER_ENABLED=true`, inserta una `ai_proposal` `pending`. El reintento conserva esa fila. El ciclo de producción usa el store Postgres del worker y rechaza el store de memoria.

## Lo que cumple el código

- **Fila pending.** `runAiProgressCycle` arma `autonomyLevel: proponer`, `typedCommand: propose_progress_update`, `resolution: pending` y `proposedState.mayCloseItem: false` (`apps/worker/src/jobs/ai-progress/cycle.ts`). `insertPendingProposal` hace `INSERT … ON CONFLICT (tenant_id, idempotency_key) DO NOTHING` (`apps/worker/src/jobs/ai-progress/pg.ts`). La migración `apps/api/migrations/0260_ai_proposal.up.sql` tiene `UNIQUE (tenant_id, idempotency_key)`. No hay `UPDATE` en el job.
- **Reintento.** Si `findProposal` ya ve la clave `ai-progress:<evidenceId>`, el ciclo devuelve `kept` con la `resolution` guardada y no vuelve a insertar. Si el `INSERT` pierde la carrera, relee la fila y tampoco la reescribe. Una fila preexistente `confirmed` sigue `confirmed`. Aunque el agente marque todos los criterios cumplidos, la fila nueva queda `pending` y `mayCloseItem` false.
- **Tenant y actor de la tarea.** El tick hace `set_config('app.tenant_id', …, true)` dentro de la transacción (`apps/worker/src/jobs/ai-progress/index.ts`). La carga une `evidence_event` con `work_node.responsible_user_id` y un `app_user` vivo del mismo tenant (`pg.ts`). `actorForTask` usa ese usuario. Un `member` no recibe `admin`. Sin responsable vivo, la SQL no devuelve la fila y el ciclo, si le llega un responsable nulo, la omite sin inventar actor.
- **Modelo.** La propuesta y el resultado del ciclo llevan `modelRef` `fake-deterministic/v1` y `limitedAvailability: true`. Si el agente devolviera otro `modelRef`, el ciclo lanza error y no inserta. El rol de conexión es `alaira_app` (`DATABASE_APP_URL` o el default de desarrollo de ese rol). `DATABASE_URL` no es respaldo.
- **Store de memoria fuera del ciclo de producción.** `tick` pasa `createWorkerPgDomainStore`. `runAiProgressCycle` lanza si `isMemoryDomainToolStore` (`WeakSet` de `packages/ai/src/domain-tools/memory-store.ts`). `processAiProgressJob` también rechaza ese store salvo `allowMemoryStore`, y el tick no activa ese flag. `runProgressAgent` solo cae a `defaultMemoryDomainToolStore` si no le pasan store; el tick siempre le pasa el store Postgres, después de esos dos rechazos. El doble de memoria sigue en los tests del agente (`packages/ai/src/agents/progress/progress.test.ts`) y en el caso de `processAiProgressJob` que pone `allowMemoryStore: true`.

## Pruebas reejecutadas

Postgres no hace falta para estos comandos. No se tocó ni se reseteó la base. No hubo tests `skipped`.

| Comando | Resultado |
|---|---|
| `pnpm --filter @alaira/worker exec vitest run src/jobs/ai-progress` | **10 passed**, 0 failed, 0 skipped. Un archivo: `src/jobs/ai-progress/job.test.ts` |
| `pnpm --filter @alaira/worker typecheck` | passed (exit 0) |
| `pnpm --filter @alaira/ai typecheck` | passed (exit 0) |

El caso que se llama «skips a task…» es un test que **passed**. No es un skip de Vitest.

Esos 10 tests ejercitan el ciclo con un doble de los puertos (`Map` en `job.test.ts`), no contra Postgres. El `ON CONFLICT` vivo del tick queda **not_run**.

## Hallazgos (no bloquean el approve)

1. **`prior_state` en cero cuando el DoD ya está completo.** Si `mayCloseItem` es true, `runProgressAgent` no arma `progressProposal` (`packages/ai/src/agents/progress/run.ts`). El ciclo usa `priorPercentComplete ?? 0` (`apps/worker/src/jobs/ai-progress/cycle.ts`) y guarda el porcentaje sugerido (100 si los cuatro criterios del doble están cumplidos) con `mayCloseItem: false` y `resolution: pending`. La fila no se cierra. El porcentaje anterior real del nodo no entra en `prior_state`.
2. **El log `kept` no relee el modelo.** En el reintento, `cycle.ts` informa `fake-deterministic/v1` y `limitedAvailability: true` sin leer `model_ref`. No modifica la fila.
3. **`limitedAvailability` no es columna.** Se persiste `model_ref`. El texto de `runtime_audit` también lo nombra. La lectura del API lo deriva de `model_ref === fake-deterministic/v1` (`apps/api/src/modules/ai-proposal/service.ts`).
4. **El tick no escribe el event log.** Sigue solo en el comando interactivo de `apps/api/src/modules/ai-proposal`. El run del implementador ya lo dice. UC-06 de punta a punta sigue fuera de esta pista.
5. **Informes viejos.** `docs/quality/reports/TASK-0126.md`, el cierre M1d y la pista A todavía dicen que el tick no persiste `ai_proposal` y usa el store de memoria. El árbol actual de `apps/worker/src/jobs/ai-progress/` ya no hace eso. Esos documentos no se reescribieron en esta revisión.

## Fuera de esta revisión

TASK-0125 sigue `proposed`. No hay `packages/connectors/src/slack/consequences/` ni `apps/api/src/modules/slack-consequences/`. El gate humana de línea base de TASK-0116 sigue abierto. G1 no se aprueba aquí; el borrador está en [G1.md](../../quality/reports/G1.md).
