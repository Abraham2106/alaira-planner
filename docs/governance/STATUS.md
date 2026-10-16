# Estado del proyecto

## Corte 0.2.0 — G0 aprobado (2026-10-15)

- **Repositorio:** Abraham2106/alaira-planner.
- **Producto:** Alaira Planner, *Project Control Plane* con IA nativa, open source bajo Apache-2.0. Definición en el [PRODUCT_BRIEF](../product/PRODUCT_BRIEF.md).
- **Implementación:** no iniciada; no se asume funcionalidad real.
- **Requisitos:** SRS 0.2.0 con 103 REQ y 22 NFR. La baseline M1 (58 REQ y 17 NFR) está **aprobada** por [RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md); el resto, propuesto.
- **Work packages:** 41 paquetes WBS; ninguno aceptado. WBS-1.2 y WBS-1.5 quedan cubiertos por TASK-0001, pendiente de revisión.
- **Decisiones técnicas:** ADR-0001, 0002 y 0004 aceptados; ADR-0003, 0005, 0006 y 0007 aceptados con la condición de que TASK-0002 los valide.
- **Licencia:** Apache-2.0 con DCO; [LICENSE](../../LICENSE) y [NOTICE](../../NOTICE) publicados.
- **Pruebas:** cada REQ y NFR tiene un TC asignado; ninguna prueba de producto ejecutada (`not_run`).
- **Agentes:** TASK-0001 en revisión; TASK-0002 (bootstrap y POC) y TASK-0003 (discovery) listas para asignar ([REGISTRY](../agents/REGISTRY.md)).
- **Próxima acción:** fusionar TASK-0001, asignar TASK-0002 y TASK-0003 y abrir el hito interno M1a.

**Cambio principal:** la documentación se alineó con la definición de producto del mantenedor:

- Construcción por *vertical slices*: M1 entrega la tesis completa (planificación, evidencia de GitHub y Slack, e IA gobernada).
- Project Graph con `delivery_profile`.
- Estrategias de progreso por paquete en lugar de un 0/100 universal.
- IA transaccional con niveles de autonomía y motor determinista como autoridad.
- 23 REQ nuevos y 2 NFR nuevos.
- Seis paquetes WBS nuevos.

## Revisión documental 0.1.1 (2026-10-15)

Correcciones editoriales sin cambio de obligaciones:

- Índice completo con rutas de lectura por rol.
- Referencias cruzadas convertidas en enlaces verificados por CI.
- Convención única de ramas `agent/TASK-NNNN-slug`.
- Glosario ampliado.
- Desambiguación de `CR` frente a `creq_`.

[RR-0001](../requirements/records/RR-0001-inconsistencias-fases-prioridades.md) alineó fases y prioridades: sus decisiones 1 y 2 quedaron sustituidas en 0.2.0. También definió P0 como criticidad y una prueba para cada NFR.

Este estado distingue diseño producido de software realmente desarrollado. Los cambios posteriores se documentan como un nuevo corte; no se reescriben evidencias históricas.
