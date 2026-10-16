# ADR-0005 — IA transaccional mediada por políticas de dominio y motor determinista

- **Estado:** Accepted (condicionado a la validación de TASK-0002 y a las evals de WBS-7.3 antes de G1)
- **Fecha:** 2026-10-15
- **Relacionados:** REQ-061, REQ-065–069, REQ-087, REQ-090–093, NFR-006, NFR-007, NFR-021, WBS-7.1–7.4, [PRODUCT_BRIEF](../../product/PRODUCT_BRIEF.md), [RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md)

## Contexto

La IA es parte de la tesis del producto desde M1: interpreta evidencia de Slack, GitHub y documentos y la convierte en actualizaciones reales. Recibe instrucciones y contenido de distinta confiabilidad; si pudiera llamar APIs con privilegios propios sin revalidar al actor, una mención en Slack o un documento malicioso podría aprobar entregables, cambiar costos o revelar datos. Además, si la IA calculara fechas o cifras, el estado del proyecto se volvería probabilístico.

## Alternativas

1. El LLM invoca APIs directamente con credenciales del workspace: sencillo pero inseguro.
2. El LLM solo produce texto y los humanos hacen todas las acciones: seguro, pero anula la tesis de reducir la administración del PM.
3. El LLM propone comandos tipados con contexto y citas; una pasarela de políticas valida actor, scopes, acción, recurso, versión, nivel de autonomía y aprobaciones, y ejecuta mediante la API de dominio; el motor determinista calcula las consecuencias.

## Decisión

Opción 3, con estas reglas:

**Frontera determinista/probabilística (NFR-021).** El motor determinista es la única autoridad sobre fechas, calendarios, dependencias, capacidad, costo, baseline, permisos, estados, fórmulas y transacciones. La IA interpreta lenguaje, vincula evidencia con ítems (IA + reglas), resume, propone riesgos y explica. Aprobar un cambio contractual es siempre humano.

**Runtime en seis pasos.** Observe → Retrieve context → Interpret → Plan action → Policy / authorization → Execute + verify. Nunca `prompt → mutación directa`.

**Herramientas tipadas.** Las acciones pasan por herramientas con contrato que aplican las mismas reglas de dominio que la UI: `get_project`, `find_work_item`, `calculate_schedule_impact`, `get_budget_status`, `propose_progress_update`, `create_change_request`, `complete_work_item`. Exigen elevación: `modify_baseline`, `approve_change`, `modify_budget`, `delete_project`, `change_permissions`.

**Política de autonomía (REQ-090).**

| Nivel | Ejemplo | Comportamiento |
|---|---|---|
| Informar | vincular «PR mergeado» con su ítem | automático y auditado |
| Proponer | mover el progreso de 70 a 90 % | confirmación ligera del responsable |
| Controlado | baseline, presupuesto, hito contractual, permisos, borrado, aprobación de cambio | aprobación humana obligatoria por actor facultado |

**Identidad y límites.** Se ejecuta con identidad delegada del solicitante; los permisos efectivos son la intersección actor ∩ conector ∩ política del tenant; clave idempotente por intención. El contenido recuperado se trata como dato no confiable.

**Trazabilidad (REQ-091).** Cada cambio de origen IA registra quién, qué, cuándo, por qué, evidencia, modelo o regla, estado anterior, estado posterior y aprobador, visible en el Project Event Log.

**Resultados honestos.** La respuesta muestra fuente, estado real y consecuencias (REQ-093); ningún resultado no confirmado por el servicio se anuncia como éxito. Una propuesta nunca cierra un ítem con criterios de aceptación pendientes (REQ-092).

## Pruebas y reversibilidad

Red team: prompt injection en documentos y mensajes, IDOR, escalada, replays, manipulación de campos, vinculación errónea de PR a tarea y acciones de costo o baseline. Si la política falla, se falla cerrado y se ofrece el trámite manual. Las evals de WBS-7.3 fijan umbrales de precisión de vinculación y abstención antes de G1; si no se alcanzan, las propuestas de avance se limitan al nivel *informar* hasta mejorar.

## Historial

- 2026-10-15: propuesto.
- 2026-10-15: ampliado con el PRODUCT_BRIEF y aceptado con condición por el mantenedor ([RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md)).
