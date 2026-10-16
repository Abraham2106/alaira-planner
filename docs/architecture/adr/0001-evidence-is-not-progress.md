# ADR-0001 — Separar evidencia, declaración y aceptación de avance

- **Estado:** Proposed (principio de producto por ratificar)
- **Fecha:** 2026-10-15
- **Relacionados:** REQ-031 a REQ-039, WBS-3.4, WBS-3.5

## Contexto

Un cambio en GitHub, un mensaje en Slack o un documento creado son señales de actividad, pero no prueban por sí solos cumplimiento del paquete de trabajo. Aplicar avance automático induce corrupción de línea base y reportes.

## Alternativas

1. Inferir porcentaje desde eventos observados — bajo esfuerzo, alto riesgo de falsos positivos.
2. Solicitar sólo actualizaciones manuales — fiable pero fricción alta.
3. Capturar evidencia e intención, evaluar políticas de aceptación, y aprobar explícitamente — mayor costo inicial y trazabilidad.

## Decisión propuesta

Adoptar opción 3. Modelar `WorkItem`, `Evidence`, `CompletionRequest`, `ReviewDecision` y `ProgressEvent` distintos. La IA puede proponer un estado, pero sólo una transición autorizada satisface la definición de terminado. Para ítems donde política permita autoaceptación objetiva, registrar regla, pruebas y quién aprobó la política. Agregados se calculan con regla versionada.

## Consecuencias

Se necesita UI de revisión, deduplicación, registro de auditoría, reversiones compensatorias y pruebas para documentos/entregables no-código. No vincular progreso únicamente a GitHub. Pendiente validar costo de UX y política mínima de aceptación.
