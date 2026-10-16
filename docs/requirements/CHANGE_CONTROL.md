# Control de cambios de requisitos y línea base

## Distinguir qué se decide

**SRS/REQ:** obligación funcional o no funcional, medible y verificable. **RR:** registro de solicitud, discusión y aprobación/rechazo de incorporar/modificar un requisito. **ADR:** decisión de arquitectura/tecnología que justifica una solución; nunca autoriza reducir el alcance. **WBS:** descomposición de entregables; cambia con una RR aprobada cuando cambia alcance. **TC:** prueba y criterio, derivado del REQ.

## Flujo RR

1. Crear `docs/requirements/records/RR-XXXX.md` usando la plantilla; indicar problema, actor, alternativa, impacto y prioridad.
2. Analista identifica REQ afectados, compatibilidad, riesgos, costo, cronograma y datos; Planner realiza análisis de impacto en WBS/ROADMAP/TRACEABILITY.
3. Revisar con seguridad/arquitectura/usuarios según riesgo; registrar decisión en RR: `proposed / approved / rejected / deferred`.
4. Mantenedor aprueba cambios de contrato público, baseline, privacidad, dinero o licencia.
5. Actualizar SRS, diccionario WBS, casos TC y trazabilidad **en el mismo PR**; publicar versión documental y registrar motivo.
6. No alterar histórico de versiones aceptadas: generar nueva versión, dejar vínculo al RR anterior.

## Línea base

La versión 0.1 es **propuesta, no aprobada**. El primer gate humano congela alcance M1, trazabilidad y reglas de cambio. Mantener al menos estado anterior, autor, hora y razonamiento del cambio; la replanificación no borra baseline aprobada.

## Plantilla rápida RR

```markdown
# RR-XXXX — [cambio solicitado]
Estado: proposed
Origen / solicitante: ...
Problema y objetivos: ...
Requisitos actuales: ...
Texto nuevo propuesto / ejemplos: ...
Alternativas (incluido no cambiar): ...
Impacto WBS, TC, costos, riesgos, seguridad, UX: ...
Decisión, fecha, aprobador, justificación: ...
Versiones de línea base afectadas: ...
```
