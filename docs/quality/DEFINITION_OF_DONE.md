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

## Done de release

Licencia OSS decidida, derechos y dependencias compatibles; pruebas P0 y seguridad verdes, sin severidades bloqueantes, respaldo restaurado, runbooks, a11y en flujos críticos, release notes, responsables de soporte y sign-off humano. Un release puede contener menos de todo SRS sólo si su corte y limitaciones están publicados claramente.
