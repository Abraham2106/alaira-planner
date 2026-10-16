# PRD — Product Requirements Document

**Versión:** 0.1 · **Estado:** propuesta de concepción · **Deriva de:** [VISION](VISION.md) · **Detalle normativo:** [SRS](../requirements/SRS.md).

## 1. Oportunidad y clientes

La promesa es reducir la reconstrucción manual del estado de proyectos heterogéneos. Segmento inicial **hipotético**: equipos de servicios/proyectos digitales de 5–50 participantes con entregables documentales y coordinación en Slack/Microsoft 365. Segunda expansión: PMO híbrida, proyectos operativos y entornos con mayor control de costos. Validar con usuarios antes de comprometer arquitectura o pricing.

## 2. Trabajos a resolver

- Al iniciar, elegir enfoque predictivo, ágil o híbrido; adaptar vistas sin perder un modelo común.
- Planificar fases, WBS, paquetes, hitos, dependencias, calendario, responsables y una línea base.
- Para ágil, priorizar backlog, ejecutar iteraciones y medir velocidad y tiempo de ciclo sin métricas coercitivas.
- Adjuntar evidencias, solicitar revisión, aceptar o rechazar entregables y recalcular estado auditable.
- Consultar desviaciones de plazo/costo y explicar de dónde provienen.
- Pedir desde Slack: «@Alaira marca la tarea X del proyecto Y como completada», con resolución de contexto, permiso, confirmación, evidencia exigida y log.
- Preguntar a la IA por riesgos, próximos bloqueos y escenarios; mostrar supuestos y grado de certeza.

## 3. Experiencias núcleo

**Onboarding:** organización → seguridad/miembros → plantilla/modo → calendario → primer entregable → vista de estado → integración opcional. Demostrar valor sin exigir GitHub.

**Gestión predictiva:** EDT indentable → paquete y criterios de aceptación → duraciones/recursos/dependencias → Gantt y baseline → estado y costos → control de cambios.

**Gestión ágil:** épica/historia → prioridad/backlog → sprint o Kanban/WIP → estado → entrega/aceptación → lead time, cycle time, throughput y velocidad (cuando aplican).

**Gestión híbrida:** fases e hitos con compromisos de entrega, equipos Scrum/Kanban vinculados a paquetes o resultados, consolidación por regla transparente y aprobaciones de gate.

**Asistente contextual:** explicar recomendaciones con fuentes, no completar a partir de inferencias; exigir autorización en acciones de escritura.

## 4. Modelo de entregas

| Corte | Alcance sugerido | Exclusiones explícitas |
|---|---|---|
| M0 — Validación | entrevistas, modelo de dominio, prototipos, arquitectura y riesgos | producto funcional |
| M1 — Núcleo | organizaciones, RBAC, proyecto/tareas, árbol WBS con paquetes, hitos y entregables, evidencia, aceptación, audit log, API, UI base | calendarios, CPM, forecast IA, EVM avanzado |
| M2 — Planificación | calendarios, dependencias FS/SS/FF/SF con lag/lead, CPM, baseline, Gantt, recursos y control de cambios | optimización compleja multi-recurso |
| M3 — Ágil e híbrido | backlog, boards, sprints, WIP, ciclo, mapeo de fases | escalar frameworks complejos |
| M4 — Integraciones | Slack bot con escritura segura, webhooks, Drive/Microsoft 365 gradual | conectores indiscriminados |
| M5 — Finanzas + IA | presupuesto, AC/PV/EV y CPI/SPI, previsión explicable, riesgos | contabilidad ERP completa |

El orden definitivo depende de descubrimiento, tamaño del equipo, riesgos y ADRs. Puede introducirse una integración temprana piloto sin asumir que todo M4 deba preceder a control financiero.

## 5. Requisitos de lanzamiento

Seguridad entre tenants, autenticación, autorización por acción y recurso, evidencias con procedencia, reversión de actualizaciones, pruebas contractuales y de aceptación, accesibilidad evaluada y métricas de fiabilidad. La trazabilidad `REQ→WBS→TC` y estado de licencia se revisan antes de anunciar una distribución OSS.

## 6. No-objetivos iniciales

ERP, nómina, vigilancia personal, compatibilidad binaria con Microsoft Project/P6, migración perfecta de todos los proveedores, agente autónomo que autorice gastos, promesas de camino crítico correctas sin validación y diferenciación basada solo en estética.

## 7. Preguntas a validar

Arquitectura y hosting; elección de licencia OSS; segmentos y regiones; mínimo legal de privacidad; proveedor de autenticación; Slack primero vs Teams; reglas de progreso agregado; fuente del costo real; monetización compatible con OSS; requisitos offline; integraciones prioritarias.
