# Visión de producto — Alaira Planner

**Estado:** 0.2 · **Propiedad del producto:** Alaira · **Licencia:** Apache-2.0 ([ADR-0004](../architecture/adr/0004-oss-license-pending.md)) · **Fuente:** [PRODUCT_BRIEF](PRODUCT_BRIEF.md), que prevalece ante cualquier discrepancia.

## El problema

La verdad de un proyecto está repartida entre herramientas que representan **modelos de trabajo distintos**: Microsoft Planner/Project modela cronograma, recursos y costo; Jira, work items y flujo; Notion, páginas y bases de datos; Excel, celdas; ClickUp intenta abarcarlos con vistas y automatización. El PM reconstruye a mano el estado cruzando chats, PRs, documentos, hojas y cronogramas, y confunde actividad, trabajo terminado y entregable aceptado. El control financiero y la baseline quedan desconectados del backlog.

Añadir un chatbot a un gestor de tareas ya no diferencia: Jira, Microsoft, ClickUp y Notion incorporan agentes de IA.

## Tesis

> **Una plataforma de control de proyectos en la que el plan, la ejecución, la evidencia y el dinero pertenecen al mismo modelo de datos, mientras una capa de IA mantiene ese modelo actualizado a partir del trabajo que las personas ya realizan.**

Une cuatro verdades hoy separadas: la del **proyecto** (alcance, WBS, hitos, dependencias, capacidad, baseline, presupuesto, cambios), la de la **ejecución** (backlog, sprints, PRs, documentos, decisiones, tiempo, evidencia), la **financiera** (presupuesto, real, comprometido, forecast, reserva, valor ganado) y una **IA transaccional** que convierte evidencia externa en actualizaciones reales con autorización, trazabilidad y reglas.

Categoría: **Project Control Plane con IA nativa, metodológicamente adaptable y orientado a evidencia.** No reemplaza Jira, Project, Excel ni Slack imitándolos: los convierte en fuentes, interfaces o modelos parciales de un sistema central.

## Para quién

| Persona | Trabajo principal | Experiencia | Valor |
|---|---|---|---|
| Project / Program Manager (usuario principal) | cronograma, alcance, riesgos, cambios, presupuesto | Project Control | trabaja por excepciones en vez de perseguir actualizaciones |
| Product Manager, Scrum Master, Tech Lead | backlog, sprints, flujo, releases, capacidad | Team | ejecución ágil enlazada a hitos y baseline |
| Equipo ejecutor | hacer el trabajo y demostrarlo | My Work, Slack, GitHub | reporta sin abrir otra herramienta |
| Finanzas | presupuesto, costo real, compromisos, forecast | Project Control → finanzas | saldo disponible y holgura de forecast sin exportar a Excel |
| PMO y dirección | salud de programas, dependencias, decisiones | Portfolio | visibilidad de restricciones y decisiones requeridas |
| Stakeholders e invitados | revisar, aprobar entregables | notificación o enlace | aprobación de baja fricción y trazable |

Proyectos sin código (consultoría, construcción, marketing, investigación) funcionan igual: la evidencia puede ser un acta, un documento o una inspección. GitHub es un conector, nunca el modelo central.

## Principios

1. **Modelo primero, vistas después.** WBS, Gantt, Board, Backlog, dashboards y conversación son proyecciones del mismo grafo de proyecto; ninguna vista contiene una copia.
2. **Predictivo, adaptativo e híbrido por rama.** Un mismo proyecto mezcla fases predictivas, sprints y flujo continuo; el sistema traduce progreso adaptativo en consecuencias predictivas.
3. **Baseline ≠ forecast ≠ real.** La baseline solo cambia por control de cambios aprobado; la IA nunca la reescribe.
4. **Motor determinista como autoridad.** Fechas, calendarios, capacidad, costo, permisos, estados y fórmulas los calcula el motor; la IA interpreta, resuelve, propone y explica sobre él.
5. **Evidencia ≠ avance confirmado.** La evidencia alimenta propuestas; el avance cambia por una transición autorizada según la política de autonomía (informar, proponer, controlado), y la aceptación de un entregable exige sus criterios.
6. **Consecuencia, no confirmación.** Cada acción informa su efecto en fechas, hitos, ruta crítica y forecast.
7. **Exception-first.** La interfaz de dirección muestra lo que requiere decisión, no todas las tareas.
8. **La metodología no es premium.** Gantt, WBS, dependencias, baseline, backlog, sprints, workload, presupuesto y métricas son núcleo OSS; solo la gobernanza empresarial puede diferenciar ofertas.
9. **Sin vigilancia.** Velocidad y actividad son datos de planificación del equipo, nunca puntuaciones individuales.

## Resultado buscado

Métrica estrella: **PM Attention Efficiency**, la proporción del tiempo del PM dedicada a decisiones y excepciones frente a recolectar y reconciliar información. Indicadores de apoyo en [METRICS](METRICS.md).
