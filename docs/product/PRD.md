# PRD — Product Requirements Document

**Versión:** 0.2 · **Estado:** baseline M1 aprobada ([RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md)); resto propuesto · **Deriva de:** [PRODUCT_BRIEF](PRODUCT_BRIEF.md) y [VISION](VISION.md) · **Detalle normativo:** [SRS](../requirements/SRS.md).

## 1. Oportunidad

Los PMs dedican buena parte de su semana a recolectar estado de herramientas que modelan el trabajo de forma incompatible. Ningún competidor une en un modelo **baseline + cambio + presupuesto + evidencia + planificación adaptativa + ejecución ágil + capacidad + IA transaccional**; esa combinación es el hueco defendible ([análisis competitivo](../research/ECOSYSTEM_RESEARCH.md)).

Segmento inicial: equipos que ya trabajan en **Slack, GitHub y Google Workspace** y gestionan proyectos con componente de software y entregables formales (hitos, clientes, presupuesto). La forma en que proyectos sin código demuestran avance se valida en discovery (WBS-1.1).

## 2. Trabajos a resolver

- Planificar con WBS, paquetes, dependencias, calendarios, personas y baseline, y saber qué pasa si algo cambia.
- Ejecutar partes del proyecto con backlog y sprints sin perder la relación con hitos y baseline.
- Que el avance se actualice desde el trabajo real (PR mergeado, documento aprobado, decisión en Slack) con propuesta de IA y confirmación, sin perseguir a nadie.
- Ver de inmediato la consecuencia de un cambio en fechas, hitos, ruta crítica, capacidad y forecast.
- Saber cuánto puede gastarse todavía (saldo disponible) y qué margen se espera al terminar (holgura de forecast).
- Preguntar en lenguaje natural qué decisión hace falta y obtener opción, efecto de fecha, costo y evidencia usada.

## 3. Experiencias núcleo

| Experiencia | Para | Contenido |
|---|---|---|
| **My Work** | ejecutores | hoy, en progreso, esperando a alguien, necesita tu confirmación; actualización sugerida del stand-up asíncrono |
| **Team** | leads, Scrum Master, PO | board, sprint, capacidad, bloqueos, release |
| **Project Control** | PM | overview, WBS, timeline/Gantt, backlog, board, recursos, finanzas, riesgos, cambios, evidencia, reportes, centro de excepciones |
| **Portfolio** | dirección, PMO | objetivos, programas, salud, forecast, presupuesto, hitos, dependencias entre proyectos, decisiones requeridas |
| **Ask / Command** | todos | barra universal para consultar, simular y pedir acciones bajo la política de autonomía |
| **Slack** | todos | menciones a `@Alaira` con resolución de entidades, permisos, DoD, confirmación y respuesta con consecuencias |

Detalle de navegación y flujos en [UX_IA](UX_IA.md).

## 4. Cortes de entrega (vertical slices)

Cada corte entrega una capacidad operativa completa de extremo a extremo, no una capa técnica.

| Corte | Resultado verificable | Incluye | Excluye |
|---|---|---|---|
| **M0 — Definición** | modelo de dominio y reglas aceptadas (G0) | requisitos, ADRs, discovery en curso, threat model | producto funcional |
| **M1 — Tesis: lanzamiento de una API** | crear proyecto → WBS → dependencias → personas → baseline → Gantt → conectar GitHub y Slack → PR mergeado → evidencia → la IA propone avance → confirmación en Slack → recálculo del cronograma → cockpit con la nueva situación | kernel (jerarquía, work nodes, `delivery_profile`, campos personalizados, hitos), motor de programación con calendarios, FS/SS/FF/SF, lag/lead y ruta crítica, baseline/forecast/real, asignación de personas y sobreasignación, evidencia y aceptación, Connector Fabric con GitHub y Slack, runtime de IA con propuestas, autonomía y auditoría, Project Event Log, Project Control y My Work mínimos | Scrum, finanzas, Google, portafolio, nivelación de recursos |
| **M2 — Ejecución ágil e híbrido** | una fase de software ejecuta backlog y sprints con GitHub; una release enlazada a un hito predictivo recalcula su forecast sin romper la baseline | backlog, sprints, board, WIP, story points, métricas de flujo, releases ↔ hitos, modos por rama, restricciones de fecha, control de cambios con deltas, conector Google Workspace, stand-up asíncrono | finanzas, portafolio |
| **M3 — Control financiero** | un costo externo modifica el forecast y no la baseline; el PM ve gasto, comprometido, forecast, saldo disponible y holgura | presupuesto, tarifas, horas reales, compromisos, costos fijos, forecast, varianza, PV/EV/AC, CPI/SPI, EAC/ETC/VAC, reservas, cockpit financiero | ERP completo, contabilidad legal |
| **M4 — Control tower y portafolio** | el PM opera por excepciones; dirección ve programas y dependencias | centro de excepciones completo, agentes Risk/Dependency/Change/Portfolio, RAID, notificaciones, portafolio y objetivos estratégicos, dependencias entre proyectos, reportes | — |
| **M5 — Enterprise y forecasting** | una organización puede confiar su portafolio; forecast explicable con histórico | SSO/SAML, SCIM, retención, residencia, export de auditoría, administración; analítica histórica y forecast probabilístico; Teams/Microsoft 365, nivelación de recursos, móvil completo | — |

La **Definition of Done del producto inicial** del [PRODUCT_BRIEF](PRODUCT_BRIEF.md) se cumple al cerrar M3. A partir de ahí se habilita el piloto externo (WBS-8.5) y el primer release (WBS-8.6). Etapas del brief como hitos: Kernel prototype, Planning alpha, Connected alpha y AI alpha dentro de M1; Execution alpha y Hybrid beta en M2; Financial beta en M3; PM control beta y Portfolio maturity en M4; Enterprise readiness en M5.

## 5. Requisitos de lanzamiento

Aislamiento entre tenants, autorización por acción y recurso, política de autonomía de IA con trazabilidad completa, evidencias con procedencia, reversión de actualizaciones, motor determinista reproducible (CPM y EVM), pruebas de aceptación ejecutadas, accesibilidad evaluada y métricas de fiabilidad. La trazabilidad REQ → WBS → TC se revisa antes de cada release.

## 6. No-objetivos

ERP, nómina, vigilancia o puntuación individual de productividad, compatibilidad binaria con Microsoft Project o P6, veinte integraciones superficiales en lugar de tres excelentes, agente autónomo que apruebe cambios contractuales o gastos, metodología como característica premium y diferenciación basada solo en estética.

## 7. Preguntas a validar

Se gestionan en [OPEN_QUESTIONS](../governance/OPEN_QUESTIONS.md): segmento y regiones, política de privacidad y retención antes del piloto, forma de la oferta empresarial compatible con OSS, coste de IA por acción, reglas de baseline, conectores posteriores y requisitos offline.
