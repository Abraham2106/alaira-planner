# Registro central de agentes y asignaciones

**Control de escritura:** exclusivamente Planner. **Estado:** G0 aprobado ([RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md)). Las filas iniciales las abrió el agente que actuó bajo autoridad expresa del mantenedor mientras no había Planner independiente.

| TASK | Agente | Rol | WBS / REQ | Rama | Worktree local | Rutas reservadas | Estado | Última evidencia |
|---|---|---|---|---|---|---|---|---|
| [TASK-0001](tasks/TASK-0001-g0-alineacion-documental.md) | agente de documentación (Cursor) | Documentación / Planner delegado | WBS-1.2, 1.3, 1.5 | `docs/revision-documental-0.1.1` | copia principal | `docs/`, archivos de raíz, `.github/`, `scripts/validate_docs.py` | review | PR pendiente de aprobación del mantenedor |
| [TASK-0002](tasks/TASK-0002-bootstrap-monorepo-y-poc.md) | por asignar | Implementador | WBS-1.3, 1.4, 8.1 | `agent/TASK-0002-bootstrap` | `../alaira-wt-TASK-0002-bootstrap` | `apps/`, `packages/`, configuración del monorepo, `docker-compose.yml`, `.github/workflows/ci.yml` | ready | — |
| [TASK-0003](tasks/TASK-0003-discovery.md) | por asignar (humano) | Product Research | WBS-1.1 | `agent/TASK-0003-discovery` | `../alaira-wt-TASK-0003-discovery` | `docs/research/discovery/` | ready | — |

## Reglas del registro

Abrir una fila antes de iniciar worktree; reservar rutas excluyentes; actualizar estado cuando exista artefacto verificable; cerrar y liberar reservas tras merge o cancelación. Cambios de estado exigen enlace a evidencia/revisión, no inferencias por actividad. Nunca registrar tokens ni rutas con secretos. Cuando una rama se abandone, el Planner verifica cambios pendientes antes de eliminar directorios con `git worktree remove`. Las fichas de tarea viven en [`tasks/`](tasks/) con el formato de la [plantilla TASK](TASK_TEMPLATE.md).
