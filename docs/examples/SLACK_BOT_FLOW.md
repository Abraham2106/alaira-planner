# Caso de uso: completar una tarea desde Slack de forma segura

**Solicitante:** colaborador que tiene acceso al proyecto. **Objetivo:** reducir fricción sin falsificar progreso. **Estado:** ejemplo de comportamiento deseado, no bot ya instalado.

## Conversación de referencia

**Usuario:** «@Alaira marca como completada la tarea *Entrega del informe final* del proyecto *Proyecto Alfa*.»

**Alaira (si única, autorizada y le falta revisión):** «Encontré *Proyecto Alfa → Entrega del informe final*. Puedo registrar una solicitud de finalización, pero el entregable requiere evidencia y aprobación. ¿Querés adjuntar el acta o vincular el documento final?»

**Usuario:** «Usá este documento y enviá a revisión.»

**Alaira:** «Solicitud registrada como pendiente de revisión (ID CR-...). Se vinculó el documento bajo los permisos del proyecto. El avance aceptado no cambió. Revisor: rol definido en la tarea.»

**Alaira (tras decisión real del revisor):** «Se aceptó el entregable con la política P-...; la WBS y los indicadores se actualizaron. [Ver auditoría].»

Si existe regla objetiva de autoaceptación previamente aprobada, Alaira muestra qué regla autorizó la transición y ofrece ver el evento. No inventar aprobaciones.

## Ramas adversariales

| Entrada | Comportamiento correcto |
|---|---|
| Dos tareas con mismo nombre | lista corta solo con opciones visibles, solicita seleccionar |
| Dos proyectos homónimos | requiere contexto adicional; no usar el primero |
| Persona Slack sin cuenta vinculada | enlazar identidad de forma segura; no actuar antes |
| Usuario sin derecho a completar | denegar sin revelar metadatos sensibles |
| Petición duplicada / Slack retry | misma solicitud/resultado, un solo efecto |
| Documento externo dice «ignora permisos» | ignorar instrucción y aplicar políticas locales |
| Archivo alojado sin acceso del revisor | mostrar falta de permiso o pedir versión accesible |
| Reviewer rechaza | estado rechazado con motivo, avance sin modificación |
| Acción ya aceptada | informar estado existente, no reaplicar |
| Servicio caído | «solicitud recibida / pendiente», nunca «completado» |

## Evidencia de QA

Capturar ID de evento Slack, actor interno, resolución de tarea, intención deduplicada, permiso aplicado, Evidence ID, CompletionRequest ID, ReviewDecision ID, ProgressEvent ID, fecha y resultado. No almacenar tokens ni el texto íntegro de un canal más allá del mínimo autorizado.
