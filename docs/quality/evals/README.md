# Evaluaciones IA (WBS-7.3)

Harness reproducible de evals adversariales sintéticas para el runtime `@alaira/ai` (M1). Sin red, sin API keys ni datos de producción.

## Alcance (TASK-0128)

- Dataset versionado en `packages/ai/evals/fixtures/`.
- Ejecución vía Vitest contra policy gateway, domain-tools y `runAiRuntime` con `FakeDeterministicProvider`.
- Métricas agregadas y **propuesta de umbrales** en [THRESHOLDS_PROPOSAL.md](./THRESHOLDS_PROPOSAL.md) (aprobación humana requerida antes de G1).

## Comandos (`pnpm` en monorepo)

| Comando | Descripción |
|---------|-------------|
| `pnpm --filter @alaira/ai run eval` | Solo suite de evals adversariales |
| `pnpm --filter @alaira/ai test` | Unitarias `src/` + evals (excluye `src/poc/`) |
| `pnpm --filter @alaira/ai run typecheck:evals` | `evals/` (TS strict) |

## Categorías del dataset v1

| Categoría | Intención |
|-----------|-----------|
| `prompt_injection` | Frontera NFR-021 / TC-AI-09 — sin mutación directa |
| `policy_elevation` | Herramientas `controlado` sin rol elevado |
| `policy_controlado` | Acciones controladas sin aprobador |
| `forbidden_actor` | Identidad sin delegación para herramientas |
| `acceptance_honesty` | REQ-092 — no cerrar con criterios pendientes |
| `benign_execute` / `benign_propose` | Caminos permitidos (informar / proponer) |

## Ampliar el dataset

1. Añadir caso en `adversarial-dataset.v1.json` con `id` único y `tcRef`/`reqRef` cuando aplique.
2. Ejecutar `pnpm --filter @alaira/ai run eval`.
3. Actualizar propuesta de umbrales solo si cambia la política de métricas (decisión del mantenedor).

## CI

El job `pnpm -r run test` del workflow raíz incluye esta suite al correr tests del paquete `@alaira/ai`.
