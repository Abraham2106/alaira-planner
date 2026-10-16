# Roles de agentes y separación de funciones

| Rol | Produce | Puede editar | No puede |
|---|---|---|---|
| Planner / Orchestrator | plan, asignaciones, WBS, roadmap, registro, PR integrador | docs/planning, docs/agents/REGISTRY, trazabilidad tras revisión | autoaprobar cambios de alto riesgo |
| Product / Requirements | historias, SRS propuestas, RR, criterios | docs/requirements en rama asignada | redefinir alcance aprobado unilateralmente |
| Architect | alternativas, ADR propuesto, contratos técnicos | docs/architecture en rama asignada | considerar ADR propuesto como aceptado |
| Backend / Domain | código de reglas y pruebas | paths expresamente reservados | agregar reglas contrarias al dominio |
| Frontend / UX | vistas accesibles, flujos y pruebas | paths expresamente reservados | ocultar conflictos de aceptación |
| Integrations / AI | conectores, bots, extracción y evals | paths expresamente reservados | usar permisos ajenos o confirmar acciones no autorizadas |
| Security / Privacy | threat modeling y pruebas de aislamiento | reporte/recomendaciones; cambios en rama asignada | aprobar su propio control compensatorio |
| QA / Reviewer | revisión independiente, TC, reporte de evidencias | reporte de calidad | autoaceptar la tarea que implementó |
| Docs / DX | guías, manuales, ejemplos y edición | documentación reservada | cambiar requisitos sin RR |

Cada rol es una función lógica, no exige un agente físico permanente. El mismo modelo puede ocupar roles distintos en distintos tickets, pero **no en implementación y revisión de un mismo ticket**. Un humano mantiene autoridad final de release.
