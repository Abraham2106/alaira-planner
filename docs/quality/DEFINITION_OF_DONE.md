# Definition of Ready y Definition of Done

## Ready para que un agente empiece

El Planner confirma: tarea y paquete WBS inequívocos; REQ y TC asociados; criterios observables; entrada y permisos; dependencias satisfechas; ADR pertinente aceptado si decide implementación; owner, revisor independiente, rutas reservadas, branch/worktree aislados, plan de rollback y riesgos conocidos. Si un punto P0 falta, el ticket queda `blocked`.

## Done técnico de una TASK

- Código/documentos bajo alcance, sin secretos, con cambios legibles.
- Pruebas unitarias/de integración relevantes ejecutadas o limitación reportada `not_run` y aceptada por reviewer cuando no es gate obligatorio.
- Evidencia de conformidad REQ/TC, incluso entregables no Git.
- Seguridad/privacy y licencias de dependencias revisadas; no acceso entre tenants.
- Observabilidad, errores y rollback documentados según riesgo.
- Revisor distinto del ejecutor deja conclusión; Planner actualiza seguimiento.
- PR no altera silenciosamente SRS, ADR, costos o baseline. Cambios aprobados quedan versionados.

## Done de paquete WBS

No basta merge: entregable de paquete existe, aceptación específica del diccionario demostrada, pruebas y evidencias trazadas, documentación y riesgos actualizados, y persona facultada acepta formalmente.

## Done del producto inicial (G3)

Es la Definition of Done del [PRODUCT_BRIEF](../product/PRODUCT_BRIEF.md), demostrada de punta a punta con datos sintéticos:

> Un PM crea un proyecto híbrido con una WBS y una baseline. Una fase de software se ejecuta mediante backlog y sprints. El equipo trabaja en GitHub y conversa en Slack. Un PR mergeado aparece como evidencia. La IA identifica su tarea y propone progreso. El desarrollador confirma desde Slack. El sistema actualiza el trabajo real, recalcula la fecha dependiente y la capacidad, registra todo en auditoría y muestra al PM únicamente que un hito tiene ahora dos días de riesgo. Un costo externo registrado después modifica el forecast financiero, pero no la baseline. El PM pregunta en lenguaje natural qué decisión debe tomar, y el asistente explica la opción, el efecto de fecha, el costo y la evidencia que utilizó.

M1 demuestra todo salvo los sprints (M2) y el costo (M3); G3 exige el escenario completo (UC-08 del SRS).

## Done de release

Licencia Apache-2.0 y DCO vigentes, derechos y dependencias compatibles; pruebas P0 y seguridad verdes, sin severidades bloqueantes, respaldo restaurado, runbooks, a11y en flujos críticos, release notes, responsables de soporte y sign-off humano. Un release puede contener menos de todo SRS sólo si su corte y limitaciones están publicados claramente.
