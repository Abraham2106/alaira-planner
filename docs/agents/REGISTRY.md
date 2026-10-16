# Registro central de agentes y asignaciones

**Control de escritura:** exclusivamente Planner. **Estado:** se inaugura sin agentes en ejecución.

| TASK | Agente | Rol | WBS / REQ | Rama | Worktree local | Rutas reservadas | Estado | Última evidencia |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | sin asignaciones | — |

## Reglas del registro

Abrir una fila antes de iniciar worktree; reservar rutas excluyentes; actualizar estado cuando exista artefacto verificable; cerrar y liberar reservas tras merge o cancelación. Cambios de estado exigen enlace a evidencia/revisión, no inferencias por actividad. Nunca registrar tokens ni rutas con secretos. Cuando una rama se abandone, el Planner verifica cambios pendientes antes de eliminar directorios con `git worktree remove`.

## Primera tarea sugerida

`TASK-0001`: validar visión, licencia y reglas de contribución, establecer baseline de SRS y decidir criterios de aceptación de M1. Estado propuesto, todavía **no asignado**.
