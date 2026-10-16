# Control de cambios de requisitos y línea base

## Distinguir qué se decide

**SRS/REQ:** obligación funcional o no funcional, medible y verificable. **RR:** registro de solicitud, discusión y aprobación/rechazo de incorporar/modificar un requisito. **ADR:** decisión de arquitectura/tecnología que justifica una solución; nunca autoriza reducir el alcance. **WBS:** descomposición de entregables; cambia con una RR aprobada cuando cambia alcance. **TC:** prueba y criterio, derivado del REQ.

## Flujo RR

1. Crear `docs/requirements/records/RR-XXXX-slug.md` a partir de la [plantilla](records/RR-0000-template.md) (la versión rápida de abajo sirve para borradores); indicar problema, actor, alternativa, impacto y prioridad.
2. Analista identifica REQ afectados, compatibilidad, riesgos, costo, cronograma y datos; Planner realiza análisis de impacto en WBS/ROADMAP/TRACEABILITY.
3. Revisar con seguridad/arquitectura/usuarios según riesgo; registrar decisión en RR: `proposed / approved / rejected / deferred`.
4. Mantenedor aprueba cambios de contrato público, baseline, privacidad, dinero o licencia.
5. Actualizar SRS, diccionario WBS, casos TC y trazabilidad **en el mismo PR**; publicar versión documental y registrar motivo.
6. No alterar histórico de versiones aceptadas: generar nueva versión, dejar vínculo al RR anterior.

## Línea base

G0 congeló la **baseline M1** con el SRS 0.2.0 ([RR-0002](records/RR-0002-baseline-m1-y-g0.md)); cualquier cambio a esos requisitos exige una RR aprobada. Los requisitos de cortes posteriores siguen propuestos y se congelan en el gate previo a su corte. Mantener al menos estado anterior, autor, hora y razonamiento del cambio; la replanificación no borra baseline aprobada.

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
