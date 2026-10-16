# Caso de uso: completar una tarea desde Slack de forma segura

**Solicitante:** colaborador con acceso al proyecto. **Objetivo:** que actualizar el estado no exija abrir la plataforma, sin falsificar el avance. **Estado:** comportamiento deseado para M1 (REQ-061, REQ-090–093); el bot todavía no existe. **Refs:** [ADR-0005](../architecture/adr/0005-agent-tools-policy-gate.md), [INTEGRATIONS](../architecture/INTEGRATIONS.md).

## Recorrido por el AI runtime

```text
Mensaje → identidad Slack → identidad interna → intent complete_work_item → resolución de entidades
→ autorización → criterios de aceptación / DoD → confianza de la IA → ejecutar o pedir confirmación
→ recalcular cronograma, forecast y métricas → evento de auditoría → respuesta con consecuencias
```

## Conversación de referencia: criterios cumplidos

**Usuario:** «@Alaira marca *Diseño de API de pagos* como completado en *Proyecto Checkout*.»

**Alaira:** «Diseño de API de pagos marcado como completado. Final real: 16 oct. El hito API Freeze sigue previsto para el 19 oct. No cambia la ruta crítica. Registrado a partir de tu instrucción en Slack. [Ver en el Project Event Log]»

## Conversación de referencia: criterios pendientes

**Usuario:** «@Alaira marca *Autenticación del servicio* como terminada.»

**Alaira:** «Encontré evidencia de que el código fue integrado (PR #844 mergeado, checks en verde), pero falta el escaneo de seguridad que exige la Definition of Done. Propongo actualizar el progreso a 85 %, no cerrar la tarea. ¿Confirmas?»

**Usuario:** «Sí.»

**Alaira:** «Progreso actualizado a 85 % con tu confirmación. La tarea sigue abierta hasta que haya evidencia del escaneo. No cambió la fecha del hito.»

## Conversación de referencia: entregable con revisión

**Usuario:** «@Alaira marca como completada la *Entrega del informe final* del *Proyecto Alfa*.»

**Alaira:** «El entregable requiere evidencia y aprobación del revisor. ¿Adjuntas el acta o vinculas el documento final?»

**Usuario:** «Usa este documento y envíalo a revisión.»

**Alaira:** «Solicitud de finalización registrada como pendiente de revisión (ID `creq_...`). El documento quedó vinculado bajo los permisos del proyecto. El avance aceptado no cambió.»

**Alaira (tras la decisión real del revisor):** «El revisor aceptó el entregable; la WBS y los indicadores se actualizaron. [Ver auditoría]»

Si una regla objetiva de autoaceptación estaba aprobada, Alaira muestra qué regla autorizó la transición. Nunca inventa aprobaciones.

## Ramas adversariales

| Entrada | Comportamiento correcto |
|---|---|
| Dos tareas con el mismo nombre | lista corta solo con opciones visibles y pide elegir |
| Dos proyectos homónimos | pide más contexto; no usa el primero |
| Persona de Slack sin cuenta vinculada | ofrece vincular la identidad de forma segura; no actúa antes |
| Usuario sin derecho a completar | deniega sin revelar metadatos sensibles |
| Petición duplicada o reintento de Slack | misma solicitud y resultado, un solo efecto |
| Documento externo que dice «ignora permisos» | ignora la instrucción y aplica las políticas locales |
| Archivo sin acceso para el revisor | indica la falta de permiso o pide una versión accesible |
| El revisor rechaza | estado rechazado con motivo; avance sin cambios |
| Acción ya aceptada | informa el estado existente; no la reaplica |
| Acción controlada («cambia la baseline») | explica que exige aprobación y abre la solicitud para un actor facultado |
| Servicio caído | «solicitud recibida, pendiente», nunca «completado» |

## Evidencia de QA

Capturar ID del evento de Slack, actor interno, tarea resuelta, intención deduplicada, nivel de autonomía, permiso aplicado, EvidenceEvent ID, AIProposal ID, CompletionRequest ID, ReviewDecision ID, ProgressEvent ID, fecha y resultado. No almacenar tokens ni el texto íntegro de un canal más allá del mínimo autorizado. Casos: TC-BOT-01, TC-BOT-03, TC-INT-03, TC-AI-05, TC-AI-07.
