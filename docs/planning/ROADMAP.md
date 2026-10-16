# Roadmap de validación y construcción

**Estado:** G0 aprobado ([RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md)); secuencia de cortes aprobada, fechas no comprometidas. **Relación:** [PRODUCT_BRIEF](../product/PRODUCT_BRIEF.md), [PRD](../product/PRD.md) y [WBS](WBS.md).

## Estrategia

Se construye por **vertical slices**: cada corte entrega un circuito operativo completo que demuestra una parte de la tesis, no una capa técnica. El primer corte prueba la tesis entera en pequeño (plan + ejecución + evidencia + IA gobernada); los siguientes añaden Scrum e híbrido, después dinero, después control por excepciones y portafolio, y por último gobierno enterprise y forecast predictivo. El orden sigue la prioridad de inversión del brief: no se puede construir buena IA de dirección de proyectos si debajo solo hay una lista de tareas.

## Supuesto de capacidad

Equipo ilustrativo, **no asignado**: 1 responsable de producto/Planner, 2 desarrolladores, 1 especialista de seguridad/QA parcial y 1 diseñador UX parcial, equivalentes a unas **15 JPI por semana**. Los agentes de IA apoyan, pero no se cuentan como capacidad humana ni eliminan revisión, pruebas e integración. Las ventanas salen de sumar los rangos del [diccionario](WBS_DICTIONARY.md) y dividir por esa capacidad, sin modelar solapamientos; se reestiman con la primera TASK de cada paquete.

| Corte | Ventana indicativa | Esfuerzo | Paquetes | Gate y resultado |
|---|---|---|---|---|
| **M0 Definición** | semanas 1–4 | 35–69 JPI | 1.1–1.5, 8.2 temprano | **G0** aprobado: modelo de dominio, reglas, licencia, ADRs y baseline M1 |
| **M1 Tesis: lanzamiento de una API** | semanas 5–36 | ≈250–470 JPI | 2.1–2.5, 2.6, 2.7 mínimo, 3.1–3.5, 3.6 (asignación), 5.1, 5.2, 5.4, 7.1–7.3, 7.4 (Progress), 8.1 | **G1**: el circuito del primer *vertical slice* funciona de extremo a extremo |
| **M2 Ejecución ágil e híbrido** | semanas 37–44 | ≈55–100 JPI | 4.1–4.3, 5.5, 3.2–3.3 (restricciones y cambios), 7.4 (Stand-up) | **G2**: una release Scrum enlazada a un hito predictivo recalcula el forecast sin tocar la baseline |
| **M3 Control financiero** | semanas 45–52 | ≈50–100 JPI | 6.1–6.3, 3.6 (timesheets), 7.4 (Finance) | **G3**: se cumple la Definition of Done del producto inicial; se habilita el piloto externo |
| **M4 Control tower y portafolio** | semanas 53–58, con piloto en paralelo | ≈30–60 JPI + 8.5 | 2.7 completo, 4.3 (RAID), 5.3, 7.4 (resto), 8.5 | **G4**: el PM opera por excepciones y dirección ve programas y dependencias |
| **M5 Enterprise y forecasting** | semanas 59+ | por estimar con datos del piloto | 8.7, 6.4, 8.3, 8.4, 8.6, Teams/Microsoft 365, nivelación de recursos | **G5**: release decidido con seguridad, resiliencia y forecast explicable |

M1 es el corte más grande porque contiene la tesis. Para reducir el riesgo (R-01, R-17), M1 se divide en cuatro hitos internos que corresponden a las etapas del brief y se revisan por separado:

| Hito interno | Pregunta | Criterio de salida | Paquetes |
|---|---|---|---|
| **M1a Kernel prototype** | ¿una sola estructura soporta distintos proyectos? | proyecto con rama predictiva y rama Scrum sobre el mismo modelo; aislamiento de tenants probado | 2.1–2.5, 3.1 |
| **M1b Planning alpha** | ¿el motor programa correctamente? | calendarios, FS/SS/FF/SF, ruta crítica, baseline/forecast/real y Gantt reproducibles; personas asignadas y sobreasignación | 3.2, 3.3, 3.6, 2.6 |
| **M1c Connected alpha** | ¿el proyecto aprende de herramientas externas? | un PR mergeado y una mención en Slack generan EvidenceEvents seguros e idempotentes | 5.2, 5.4, 5.1, 3.4 |
| **M1d AI alpha** | ¿la IA actúa de forma gobernada? | propuesta → confirmación en Slack → mutación por herramienta tipada → recálculo → auditoría → cockpit | 7.1–7.3, 7.4 (Progress), 3.5, 2.7 mínimo |

## Gates

**G0 Definición (aprobado el 2026-10-15):** licencia publicada; ADRs de arquitectura, stack, tenancy y autenticación aceptados (los tres últimos condicionados a TASK-0002); baseline M1 aprobada; riesgos con dueño; política de progreso y de autonomía definidas. Discovery (WBS-1.1) continúa en paralelo y pasa a ser condición de G1.

**G1 Tesis:** el escenario UC-06 del SRS se ejecuta de extremo a extremo. TC de tenant, autorización, sesión, secretos y cifrado (TC-SEC-01..03, TC-SEC-05..06), evidencia (TC-EV-01..04), aceptación (TC-ACC-01..06), CPM y baseline (TC-SCH-03..05, TC-BASE-01, TC-BASE-04), GitHub y Slack (TC-GH-01, TC-BOT-01, TC-BOT-03, TC-INT-01..03) e IA (TC-AI-03..07, TC-AI-09) ejecutados, sin fallas P0. Informe de discovery entregado (WBS-1.1).

**G2 Ágil e híbrido:** UC-01 y UC-07; métricas ágiles reproducibles; modos por rama; restricciones de fecha; cambio aprobado crea una nueva baseline sin destruir la anterior; Google Workspace generando evidencia.

**G3 Producto inicial:** UC-08 y la Definition of Done del producto inicial del brief completa; EVM reproducible con casos límite; NFR-018 (retención y privacidad) aprobado antes de admitir datos reales de piloto.

**G4 Control y portafolio:** centro de excepciones, Ask/Command y agentes de M4 evaluados; portafolio con dependencias entre proyectos; resultados del piloto registrados.

**G5 Lanzamiento:** gobierno enterprise, red team de IA, pruebas de recuperación, accesibilidad, revisión de licencias de dependencias y aceptación humana.

## Cadencia y gobierno de cambios

Planificación semanal del Planner, refinamiento continuo de requisitos, revisión por PR y demo al cerrar cada hito interno o corte. El informe de progreso se centra en entregables aceptados, riesgos, cambios y próxima decisión; nunca se evalúa a los agentes por tokens o commits. Cada gate congela la baseline documental; los cambios de fecha o alcance se registran por RR sin sobrescribir el histórico.

## Camino crítico candidato

Autorización y grafo de proyecto → motor de programación → evidencia y aceptación → Connector Fabric y GitHub → runtime de IA con política → cockpit. Una segunda ruta crítica posible son las APIs y la aprobación de apps de Slack y GitHub; se calcula una vez confirmadas duraciones y capacidad.
