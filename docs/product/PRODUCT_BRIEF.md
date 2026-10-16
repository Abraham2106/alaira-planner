# Definición de producto — Plataforma de dirección de proyectos con IA nativa

**Autoridad:** documento fuente del mantenedor (2026-10-15). Prevalece sobre [VISION](VISION.md), [PRD](PRD.md) y el resto de documentos de diseño; las obligaciones verificables que de él derivan están en el [SRS](../requirements/SRS.md) y su adopción se registra en [RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md).

**Notas de edición:** se eliminaron los marcadores de cita del borrador original. Las afirmaciones sobre competidores (licencias, planes, funciones) proceden de la investigación del mantenedor y deben verificarse con fuente y fecha antes de usarse públicamente, según [ECOSYSTEM_RESEARCH](../research/ECOSYSTEM_RESEARCH.md). El nombre del bot en los ejemplos es `@Alaira` (el borrador usaba un nombre provisional).

## Conclusión ejecutiva y tesis del producto

«Microsoft Project Planner» no es hoy un producto único con ese nombre. Microsoft retiró **Project for the web** en agosto de 2025 y trasladó esa experiencia a **Microsoft Planner**, que reúne el Planner tradicional, To Do y las capacidades premium procedentes de Project for the web. Los planes premium conservan dependencias, subtareas, sprints, historial de tareas y baselines; los datos de esos planes siguen en Dataverse.

Planner/Project, Jira, ClickUp, Notion y Excel no son cinco interfaces distintas para representar tareas: **representan modelos de trabajo distintos.** Jira parte del *work item*, el flujo y el backlog; Microsoft Project, del cronograma, las relaciones entre actividades, recursos y costos; Notion, de una base de datos/documento flexible; Excel, de una celda; ClickUp intenta abarcar buena parte de estos mundos con jerarquía de trabajo, vistas, sprints, tiempo, Gantt y automatizaciones.

Por tanto, el producto **no debe conceptualizarse como «otro gestor de tareas con un chatbot»**. En 2026 eso ya no diferencia: Jira comercializa agentes de IA; Microsoft incorpora Copilot y Project Manager Agent en Planner; ClickUp integra Brain; Notion avanza hacia agentes sobre sus bases de datos.

La oportunidad es construir un **sistema operativo de ejecución de proyectos** que una cuatro verdades hoy separadas:

1. **Verdad del proyecto:** alcance, WBS, entregables, paquetes de trabajo, hitos, dependencias, calendarios, capacidad, baseline, presupuesto y cambios.
2. **Verdad de la ejecución:** backlog, sprint, estados, pull requests, documentos, entregas, decisiones, tiempo invertido y evidencia de trabajo.
3. **Verdad financiera:** presupuesto aprobado, costo planeado, costo real, compromisos, forecast, reserva, variaciones y valor ganado cuando corresponda.
4. **IA transaccional y contextual:** una IA que no solo resume, sino que interpreta evidencia de Slack, GitHub, Docs, Sheets y otros sistemas y la convierte —con autorización, trazabilidad y reglas— en actualizaciones reales del proyecto.

> **Tesis: una plataforma de control de proyectos en la que el plan, la ejecución, la evidencia y el dinero pertenecen al mismo modelo de datos, mientras una capa de IA mantiene ese modelo actualizado a partir del trabajo que las personas ya realizan.**

No sustituye la responsabilidad del project manager: **cambia dónde emplea su atención** —menos persecución de actualizaciones, copia entre herramientas y *babysitting*; más decisiones, excepciones, riesgos, trade-offs, cambios de alcance y coordinación.

No obliga a decidir que una organización «es Agile» o «es Waterfall». PMI reconoce enfoques **predictivos, adaptativos e híbridos**; el producto soporta los tres.

## Ecosistema actual y diferencias que importan

### Microsoft Planner y la herencia de Project

Planner tiene dos personalidades: el nivel básico es colaborativo de tareas; el premium absorbe el antiguo Project for the web. El valor histórico de Project no es el Gantt —**un Gantt es solo una representación**— sino que entiende semánticamente duración, trabajo, asignaciones, disponibilidad, calendarios, relaciones, costos y baseline. Distingue recursos de trabajo, materiales y costos; expresa disponibilidad con unidades máximas, detecta sobreasignación y calcula costos por tarifa, por uso y fijos. Distingue **trabajo, duración y unidades de asignación**: cambiar personas, trabajo o duración produce resultados distintos según la lógica de programación.

**Terminología:** «recurso» no es sinónimo de persona. La interfaz dirá **Personas**, **Equipos**, **Capacidad** y **Recursos no humanos**; «Resource» queda como abstracción interna del motor.

Planner/Project es valioso cuando la pregunta es: *«Tengo un plan temporal, restricciones, personas con disponibilidad limitada, dependencias y un costo; ¿qué sucede si algo cambia?»*. El ecosistema Microsoft reparte esa profundidad entre Graph y Dataverse. **Lección:** no repetir la separación «tarea simple» frente a «proyecto premium» como dos universos técnicos; un solo núcleo modela desde una lista de cinco tareas hasta un programa de varios años.

### Jira

Jira es un sistema de trabajo estructurado alrededor de *work items* y *workflows*: backlog, sprints, estimaciones, story points, cambio de alcance, velocidad, dependencias y planificación multiequipo. Registra estimación original, tiempo restante y empleado, pero **tiempo registrado no equivale a un motor financiero**. Es fuerte para *«¿qué está listo, en curso o bloqueado; qué entra al próximo sprint?»*, no para *«¿cuál es mi costo a la terminación tras reprogramar tres paquetes y cambiar la disponibilidad de dos especialistas?»*.

### ClickUp

Es el competidor conceptual más cercano en amplitud: tareas, vistas, Gantt, sprints con story points, burndown y velocity, time tracking, dashboards, automatización e IA, repartidos por planes. Consecuencia: **«Gantt + Kanban + IA + Slack» no basta para ser único.** El hueco está en la combinación profunda: **baseline + cambio + presupuesto + evidencia + planificación adaptativa + ejecución ágil + capacidad + IA transaccional.**

### Notion

Demuestra que un Kanban sobre una base de datos general basta a muchos equipos. Ha incorporado dependencias, subtareas, vistas temporales, sprints, automatizaciones y sincronización con GitHub, pero su modelo privilegia páginas y propiedades flexibles, no un motor de recursos, baseline, ruta crítica, costo y programación.

> **En Notion una relación normalmente describe los datos; en un motor de proyectos una relación puede cambiar matemáticamente el proyecto.**

### Excel

Puede modelar casi cualquier presupuesto o cronograma con fórmulas. Su límite es **semántico**: para Excel `2026-11-14` es una fecha; para un motor de proyectos puede ser *FinishDate calculada de WP-4 con calendario MX-Engineering, dependencia FS con WP-3, lag +2d, baseline 2026-11-09, varianza de forecast +5d*.

### Comparación del núcleo

| Dimensión | Planner / Project | Jira | ClickUp | Notion | Excel | Requisito del nuevo producto |
|---|---|---|---|---|---|---|
| Abstracción principal | plan, tarea, programación, recursos/costo | work item + workflow | tarea en jerarquía | página/base de datos | celda/tabla | **grafo de proyecto** |
| Predictivo | fuerte | parcial | medio/alto | ligero | manual | nativo |
| Agile/Scrum | en Planner premium | muy fuerte | fuerte | disponible | manual | nativo |
| WBS | natural en Project | modelable | aproximable | aproximable | manual | nativo |
| Dependencias | nativas | nativas | nativas | menos profundas como motor | fórmulas | nativas y calculables |
| Recursos/capacidad | profundo en Project | capacidad en planificación | workload | propiedades | manual | personas + equipos + recursos |
| Time tracking | según licencia | sí | sí | por integración | manual | nativo + externo |
| Costos avanzados | fortaleza de Project | no es el centro | menos profundo | no es el centro | flexible pero manual | **motor financiero nativo** |
| Baseline/cambio | fortaleza Project/premium | historial/workflow | historial | historial | copias | **baseline inmutable versionada** |
| IA | Copilot/agentes | agentes | Brain | agentes | Copilot | **IA sobre todas las operaciones** |
| Evidencia externa | ecosistema Microsoft | ecosistema dev | integraciones | sync | imports | **primera clase del modelo** |

**Decisión de producto:** no convertir la metodología en característica premium. Gantt, dependencias, WBS, baseline, backlog, sprint, workload y métricas fundamentales son el lenguaje básico del producto. Lo que puede diferenciar ofertas empresariales es SSO/SCIM, retención, residencia de datos, controles organizacionales, compliance, administración masiva y soporte.

## Modelo de proyecto

El error más peligroso sería empezar por la interfaz (Kanban, luego Gantt, luego costos) e intentar conectarlos. Primero se define **el modelo universal del proyecto**; Gantt, Board, Backlog, WBS, dashboard o conversación con IA son representaciones y operaciones sobre ese modelo.

### Núcleo común

PMI describe la WBS como descomposición del alcance autorizado para planificación, presupuesto, programación, contabilidad, autorización del trabajo, medición del progreso y control.

```text
Organización
└── Portafolio
    └── Programa
        └── Proyecto
            ├── Objetivos / Outcomes
            ├── Fases
            ├── Entregables
            │   └── WBS
            │       └── Paquete de trabajo
            │           └── Work items / actividades
            ├── Hitos
            ├── Releases
            ├── Riesgos / issues / cambios
            ├── Calendarios
            ├── Personas / equipos / recursos
            ├── Presupuesto
            └── Evidencias / artefactos
```

La jerarquía es opcional, no burocracia obligatoria. El **paquete de trabajo** es la unidad donde convergen alcance, responsable, costo, duración, criterios de aceptación y evidencia:

```text
WP: Autenticación empresarial
Entregable: SSO listo para producción
Presupuesto: USD 18,000
Inicio planeado: 2 nov · Fin baseline: 20 nov
Equipo: Backend + Platform
Criterios de aceptación: SAML operativo · auditoría registrada · pruebas E2E aprobadas · documentación entregada
Trabajo adaptable: Sprint 14 y Sprint 15
Evidencias: GitHub PR #844 · build de GitHub Actions · ADR en Google Docs · informe de pruebas
```

El mismo nodo es **paquete de trabajo** para dirección, **épica/sprint** para ingeniería, **cuenta de control** para finanzas y **colección de evidencia verificable** para la IA.

### Predictivo

Busca definir el alcance con antelación; funciona mejor con alta certeza. Prioriza WBS, paquetes, actividades, hitos, dependencias FS/SS/FF/SF con lead/lag, calendarios (días hábiles, feriados, turnos, zona horaria), restricciones (no antes de, no después de, fechas impuestas), ruta crítica, baseline, forecast, reales, asignación de recursos, plan de costos y control de cambios.

**Baseline ≠ plan actual.** La baseline es lo aprobado; el forecast, lo que hoy creemos que ocurrirá; los reales, lo que ocurrió.

```text
Baseline Finish = 30 junio · Current Forecast = 12 julio · Actual Finish = null · Variance = +12 días
```

Si el sistema mueve la baseline cada vez que cambia una fecha, destruye la medición de desviación. **La IA nunca reescribe silenciosamente una baseline.**

### Adaptativo / Agile

El alcance se refina con trabajo priorizado y ciclos cortos: producto → outcome → épica → backlog → sprint → done → release. Soporta product y sprint backlog, Scrum/Kanban, story points, estimación por tiempo, capacidad, límites WIP, velocity, throughput, cycle y lead time, burnup, burndown, flujo acumulado y releases. **La velocidad es información de planificación del equipo, nunca una puntuación de productividad individual.**

### Híbrido

Puede ser el diferenciador más potente. No es un botón `Tipo = Hybrid`: se **mezclan modelos por rama del proyecto**.

```text
PROGRAMA: Lanzamiento de nueva plataforma
├── Fase regulatoria               → Predictiva (auditoría, certificación, hito de aprobación)
├── Desarrollo del producto        → Adaptativo/Scrum (backlog, sprints, release candidate)
├── Migración de infraestructura   → Predictiva (WBS + ventanas de cambio)
└── Discovery UX                   → Kanban / flujo continuo
```

El hito «Release candidate aceptado» puede depender de un conjunto de backlog items y la certificación de ese hito: **el sistema traduce progreso adaptativo en consecuencias predictivas.**

### Dimensión financiera

Distingue al menos: Budget, Committed, Actual, Forecast, Contingency, Management reserve, Available y At completion; y para quien use EVM: PV, EV, AC, CV = EV − AC, SV = EV − PV, CPI = EV / AC, SPI = EV / PV. Junto a la terminología formal, una presentación accesible:

```text
Presupuesto aprobado           $1,000,000
Ya gastado                       $410,000
Comprometido                      $90,000
Forecast restante                $420,000
Reserva/colchón                   $80,000
-------------------------------------------
Forecast al terminar             $920,000
Margen esperado                   $80,000
```

Dos métricas que no deben confundirse:

```text
Saldo disponible (spendable balance) = presupuesto autorizado − costos reales − compromisos abiertos − reserva protegida
Holgura de forecast (forecast headroom) = presupuesto autorizado − forecast total al completar
```

La primera dice cuánto puede comprometerse; la segunda, cuánto margen se espera al final.

## IA nativa

### La IA no es la base de datos

El motor determinista es la autoridad sobre fechas, calendarios, dependencias, capacidad, costo, baseline, permisos, estados, fórmulas y transacciones. La IA actúa **sobre** ese núcleo y no inventa el estado del proyecto.

```text
GitHub · Slack · Google Drive · Sheets · ERP
            │
            ▼
   Connector Fabric (eventos + sincronización)
            │
            ▼
      Evidence / Event Bus
            │
            ▼
   AI Orchestration (entender, resolver, sugerir, riesgo, resumir, clasificar)
            │
     Policy / Approval
            │
            ▼
   Canonical Project Graph (WBS, tareas, sprints, recursos, costo, riesgo, baseline, evidencia)
            │
   ┌────────┼──────────┐
Scheduling  Financial  Analytics
  Engine     Engine     Engine
```

### Evidence-to-progress

Función central y probable *moat*. Hoy el estado vive fuera del gestor: PR mergeado en GitHub, documento en Google Docs, diseño en Figma, decisión en Slack, factura en el ERP, horas en un time tracker, build en CI/CD, entrega en la plataforma de despliegue.

Objeto explícito `EvidenceEvent`: `event_id`, `source`, `external_id`, `actor`, `timestamp`, `event_type`, `artifact`, `project_candidate`, `work_item_candidate`, `confidence`, `raw_reference`, `normalized_payload`, `AI_interpretation`, `accepted_by`, `effect`.

```text
source: github · event_type: pull_request.merged · artifact: repo/auth-service#844
linked_work_item: SEC-128 · confidence: 0.99 · effect_proposed: progress 85% → 100%
```

**Mergeado no significa terminado.** Si la Definition of Done exige `PR merged AND integration tests passed AND security scan passed AND documentation updated`, la IA no cierra con el primer evento: *«Encontré evidencia de que el código fue integrado, pero falta la prueba de seguridad requerida. Propongo actualizar el progreso a 85 %, no cerrar la tarea.»* Es la diferencia entre IA decorativa e IA operativa.

### Slack como punto de entrada

Slack entrega eventos `app_mention` y mecanismos de interacción. Flujo de `@Alaira marca «Diseño de API de pagos» como completado en Proyecto Checkout`:

```text
Mensaje → identidad Slack → identidad interna → intent complete_work_item → resolución de entidades
→ autorización → criterios de aceptación/DoD → confianza de la IA → ejecutar o pedir confirmación
→ recalcular cronograma/forecast/métricas → evento de auditoría → respuesta
```

La respuesta da **consecuencia**, no solo confirmación: *«Diseño de API de pagos marcado como completado. Final real: 16 oct. El hito API Freeze sigue previsto para el 19 oct. No cambia la ruta crítica. Registrado a partir de tu instrucción en Slack.»* O bien: *«Completado. Adelanta 1 día el inicio posible de Integration Testing. No modifiqué la fecha comprometida del hito.»*

### Stand-up asíncrono

No se elimina el stand-up humano si aporta valor; se elimina como **mecanismo de extracción manual de estado**. Cada persona recibe una actualización sugerida (ayer: PR #844 mergeado, PR #851 en review, ADR editado; posible bloqueo: aprobación de Security pendiente desde hace 18 h; ¿correcto?), la confirma o corrige («Sí, pero el #851 queda para mañana») y la IA actualiza el sistema. El PM recibe un resumen por excepciones (25 personas: 18 sin excepción, 4 esperando revisión, 2 bloqueadas, 1 riesgo de fecha). **La interfaz de dirección es exception-first.**

### Agentes funcionales

| Agente | Responsabilidad |
|---|---|
| Intake | convierte lenguaje/documentos en proyectos, WBS o backlog inicial |
| Progress | reúne evidencias y propone avances |
| Scheduler | detecta impactos de fecha y escenarios |
| Dependency Watcher | vigila bloqueos y relaciones |
| Finance | interpreta presupuesto, reales, compromisos y forecast |
| Risk | identifica patrones y propone riesgos, no los declara como verdad |
| Change Control | analiza solicitudes de cambio contra la baseline |
| Stand-up | genera actualizaciones asíncronas |
| Portfolio | resume proyectos y dependencias entre proyectos |
| PM Copilot | interfaz conversacional universal |

A *«¿Qué tengo que resolver hoy para que el proyecto no se atrase?»* se responde desde ruta crítica, restricciones, riesgos, bloqueos, calendario y actividad reciente; no con una lista de tareas atrasadas.

### Política de autonomía

| Nivel | Ejemplo | Comportamiento |
|---|---|---|
| Informar | «PR mergeado relacionado con TASK-3» | automático |
| Proponer | «Sugiero mover el progreso de 70 a 90 %» | confirmación ligera |
| Controlado | cambiar baseline, presupuesto, hito contractual | aprobación obligatoria |

Cada cambio generado por IA registra: quién, qué, cuándo, por qué, con qué evidencia, qué modelo/regla intervino, estado anterior, estado posterior y quién aprobó.

### Interfaz

Cuatro experiencias superpuestas:

- **My Work** (ejecutores): hoy, en progreso, esperando a alguien, necesita tu confirmación.
- **Team** (leads): board, sprint, capacidad, bloqueos, release.
- **Project Control** (PM): overview, WBS, timeline/Gantt, backlog, board, recursos, finanzas, riesgos, cambios, evidencia, reportes.
- **Portfolio** (dirección): objetivos estratégicos, programas, salud, forecast, presupuesto, hitos, dependencias entre proyectos, decisiones requeridas.

Barra universal **Ask / Command** siempre disponible («Muéstrame solo los paquetes que pueden afectar noviembre», «¿Qué cambió desde el steering del jueves?», «Simula agregar dos backend engineers tres semanas», «¿Cuánto dinero queda sin comprometer?», «Crea un change request para posponer Beta dos semanas», «¿Qué entregables tienen trabajo real pero nadie ha actualizado?»). **Las vistas no contienen copias del proyecto**: son proyecciones del mismo grafo.

## Ficha técnica

| Campo | Especificación |
|---|---|
| Categoría | AI-native Project Execution & Control Platform |
| Propósito | planear, ejecutar, observar y controlar proyectos con un modelo unificado de alcance, cronograma, trabajo, personas, costos y evidencia |
| Usuario principal | Project Manager / Program Manager |
| Usuarios secundarios | Product Manager, Scrum Master, Tech Lead, equipo ejecutor, Finance, PMO, dirección, stakeholders |
| Modelos | predictivo, adaptativo, Kanban/flujo, Scrum e híbrido |
| Unidad fundamental | Work Node dentro de un Project Graph |
| Diferenciador | evidence-to-progress + planificación metodológicamente adaptable + finanzas + IA transaccional |
| Paradigma | human-governed / AI-assisted |
| Fuente de verdad | modelo canónico interno |
| Integraciones iniciales | Slack, GitHub, Google Drive/Docs/Sheets |
| Integraciones posteriores | Teams, Microsoft 365, Jira, Linear, Figma, ERP/finanzas, CI/CD, calendarios |
| Dispositivos | web desktop primero; móvil para My Work, aprobaciones y actualizaciones |
| API | REST/GraphQL + webhooks + suscripciones a eventos |
| Auditoría | event log inmutable |
| Automatización | reglas deterministas + agentes de IA |

**Objetos de primera clase:** Organization, Workspace, Portfolio, Program, Project, Goal, Outcome, Phase, Deliverable, WBSNode, WorkPackage, WorkItem, Milestone, Release, Sprint, Dependency, Constraint, Calendar, Person, Team, Resource, Assignment, Skill, Capacity, Estimate, TimeEntry, CostRate, Budget, BudgetLine, Commitment, ActualCost, Forecast, Baseline, Risk, Issue, Assumption, Decision, ChangeRequest, Artifact, EvidenceEvent, Comment, Approval, Automation, AIProposal, Connector, AuditEvent.

Cada proyecto tiene un `delivery_profile` y cada rama puede sobrescribirlo:

```json
{ "planning_mode": "hybrid", "schedule_engine": true, "agile_execution": true,
  "financial_control": "full", "resource_planning": true, "baseline_required": true }
```

```json
{ "work_package": "Software Development", "execution_mode": "scrum" }
```

**Motor de programación:** WBS, duración, trabajo, start/finish, actual start/finish, duración restante, hitos, grafo de dependencias FS/SS/FF/SF, lead/lag, restricciones, calendarios de proyecto, recurso y feriados, zona horaria, ruta crítica, holgura, programación automática y manual, snapshots de baseline, escenarios, asignación, detección de sobreasignación y nivelación de recursos.

**Motor Agile:** product backlog, épicas, historias/tareas, prioridad, rango, story points, estimación temporal, sprint, sprint goal, capacidad, WIP, release/versión, burndown, burnup, velocity, throughput, cycle time, lead time, flujo acumulado, cambio de alcance y carryover. Métricas separadas: `Velocity ≠ hours`, `Story points ≠ cost`, `Cycle time ≠ effort`, `Progress ≠ time logged`.

**Motor financiero:** presupuesto (también distribuido en el tiempo), rate cards, costo laboral, fijo, material y externo, comprometido, real, forecast, contingencia, reserva de gestión, PV/EV/AC, CPI/SPI, EAC/ETC/VAC, flujo de caja previsto, moneda, snapshot de tipo de cambio, periodos fiscales, centro de costo, proveedor y referencia de compra.

**Riesgos:** probabilidad, impacto, exposición, dueño, disparador, respuesta, contingencia y nodos relacionados. **Change Request:** motivo, solicitante, deltas de alcance, cronograma, costo, recursos y riesgo, baseline afectada, aprobadores, decisión y fecha efectiva. Al aprobarlo, la baseline v3 se preserva, el cambio CR-28 se aplica y se crea la v4. Nunca se destruye v3.

**Criterios de aceptación:** todo entregable acepta criterios verificables (por ejemplo, para «API pública»: OpenAPI aprobado, endpoint desplegado, pruebas de integración en verde, revisión de seguridad completa, documentación publicada). Eso permite a la IA determinar evidencia de progreso sin fingir que actividad observada equivale a producto terminado.

**Capacidades que deben ser núcleo, no add-ons:** Gantt, WBS, dependencias, ruta crítica, baselines, motor de calendario, workload, time tracking, presupuesto, forecast de costo, backlog, sprints, velocity, cycle time, portafolio, campos personalizados, dashboards, automatización, API/webhooks, asistente de IA, grafo de evidencia e historial de auditoría.

**Apropiadas para oferta empresarial:** SAML/SSO, SCIM, retención personalizada, residencia de datos, claves gestionadas por el cliente, políticas avanzadas, export de auditoría empresarial, legal hold, red privada, administración avanzada, entornos dedicados y soporte premium.

## Producción técnica

### Arquitectura lógica

Inicialmente **monolito modular + event backbone**, no treinta microservicios; las fronteras de dominio se definen desde el principio para poder separarlas después.

```text
Clientes: Web · Mobile · Slack · API · paleta de comandos
        │
API Gateway / BFF
        │
Application Core: Identity · Projects · Work · Agile · Resources · Costs · Schedule · Risk · Change · Evidence · Reporting
        │
Domain Events
        │
Connector Hub (GitHub/Slack/Drive) · AI Runtime (LLM/agentes) · Calculation Jobs (CPM/EVM/capacidad)
```

### Persistencia

No depender de una base de datos de grafos solo porque conceptualmente hay un «Project Graph»: tareas, asignaciones, costos, baselines, dependencias, partes de tiempo y sprints encajan en un almacén relacional. Propuesta: PostgreSQL como almacén transaccional canónico; almacenamiento de objetos para evidencia importada y artefactos generados; índice de búsqueda/vectorial para recuperación semántica; event store / auditoría append-only; cola o stream para procesamiento asíncrono de conectores e IA; warehouse analítico para portafolio a escala. Las relaciones se representan con tablas de aristas (`work_node`, `dependency_edge`, `hierarchy_edge`, `artifact_link`, `goal_link`) sin imponer una graph DB en el MVP.

### Eventos como lenguaje de integración

El núcleo no codifica «GitHub dice que el PR 99 se mergeó» por toda la aplicación: lo normaliza.

```json
{ "event_type": "artifact.lifecycle.changed", "source": "github", "actor": "external:user:8123",
  "artifact": { "type": "pull_request", "external_id": "99" }, "action": "merged", "occurred_at": "..." }
```

```json
{ "event_type": "user.intent.received", "source": "slack", "intent": "complete_work_item",
  "actor": "...", "text": "marca WP API como completado" }
```

```json
{ "event_type": "artifact.activity.detected", "source": "google_drive",
  "artifact": { "type": "document" }, "action": "updated" }
```

### Connector SDK

Contrato uniforme: `authorize()`, `revoke()`, `subscribe()`, `backfill()`, `receive_event()`, `normalize()`, `resolve_identity()`, `fetch_artifact()`, `execute_action()`, `health_check()`; y declaración de capacidades (`read_events`, `read_artifacts`, `write_actions`, `supports_webhooks`, `supports_backfill`). Así se añaden integraciones sin lógica de GitHub o Slack en el núcleo.

### GitHub

**Evidencia de desarrollo, no fuente universal del porcentaje de avance.** Issue ↔ WorkItem; Pull Request ↔ Artifact/Evidence; Review ↔ evidencia de aprobación; Merge ↔ evidencia de entrega; Commit ↔ evidencia de actividad; Actions ↔ evidencia de verificación; Release ↔ evidencia de release. Un proyecto legal, de construcción, de marketing o de investigación funciona igual sin repositorio. **GitHub es un conector, nunca el modelo central.**

### Google Workspace

Docs y Drive no se convierten en un gestor paralelo: Google Doc → Artifact; Google Sheet → Artifact / dataset externo; carpeta de Drive → contenedor de evidencia del proyecto; cambio de documento → EvidenceEvent. Si una especificación enlazada a WP-14 cambia después de su última aprobación: *«¿Deseas comparar cambios y evaluar impacto?»*.

### Runtime de IA

Seis pasos obligatorios: **Observe → Retrieve context → Interpret → Plan action → Policy / authorization → Execute + verify.** Nunca `Prompt → mutación directa de la base de datos`. Herramientas con contrato: `get_project()`, `find_work_item()`, `calculate_schedule_impact()`, `get_budget_status()`, `propose_progress_update()`, `create_change_request()`, `complete_work_item()`. Acciones que exigen elevación: `modify_baseline()`, `approve_change()`, `modify_budget()`, `delete_project()`, `change_permissions()`.

### Capa determinista y capa probabilística

| Problema | Motor |
|---|---|
| Interpretar «terminamos casi todo salvo QA» | IA |
| Calcular la nueva fecha final | determinista |
| Relacionar un PR con una tarea | IA + reglas |
| Verificar permisos | determinista |
| Proponer probabilidad de riesgo | IA/estadística |
| Calcular CPI | determinista |
| Resumir un cambio | IA |
| Guardar baseline | determinista |
| Detectar anomalías | estadística/IA |
| Aprobar un cambio contractual | humano |

### Modelo de progreso

Nunca una única fórmula universal de «% complete». Estrategias por paquete: manual, por duración, por trabajo, % físico, hitos ponderados, checklist ponderado, aceptación de entregable, completitud de historias, técnica de valor ganado y evidencia externa. Por ejemplo, un paquete de investigación: 20 % plan de entrevistas, 30 % entrevistas completas, 20 % síntesis, 30 % informe aprobado. Vale mucho más que inferir «13 de 20 subtareas = 65 %».

### Observabilidad del proyecto

Además de logs técnicos, un **Project Event Log** visible:

```text
09:22  GitHub PR #844 merged
09:23  Evidence linked to SEC-128
09:23  AI proposed 80 → 95%
09:31  Ana approved
09:31  Task forecast recalculated
09:31  Milestone unchanged
10:04  Vendor invoice imported
10:04  Actual cost +$2,800
10:05  Forecast variance now +$1,900
```

## Paquetes de trabajo y avance del producto

No construir de una vez «Jira + Project + ClickUp + Notion + IA», sino **vertical slices** que entreguen capacidades operativas completas.

| Código | Paquete | Alcance | Entregable verificable | Dependencia |
|---|---|---|---|---|
| WP-A | Product Kernel | modelo canónico, jerarquía, work nodes, estados, campos personalizados, hitos | crear un proyecto completo por API/UI | — |
| WP-B | Project Graph & Scheduling | WBS, dependencias, calendarios, Gantt, ruta crítica, baseline | cambiar una tarea recalcula el cronograma | WP-A |
| WP-C | Agile Execution | backlog, board, sprint, story points, velocity, métricas de flujo | un equipo ejecuta un sprint completo | WP-A |
| WP-D | People & Capacity | personas, equipos, skills, calendario, asignación, sobrecarga | vista de workload y detección de conflictos | WP-A, WP-B |
| WP-E | Financial Control | presupuesto, tarifas, reales, compromisos, forecast, EVM | el PM ve gasto, forecast y margen | WP-A, WP-B |
| WP-F | Connector Fabric | OAuth, webhooks/bus de eventos, GitHub, Slack, Google | un evento externo genera un EvidenceEvent | WP-A |
| WP-G | AI Runtime | tool calling, contexto, política, propuesta/aprobación, auditoría | la IA actualiza una tarea con evidencia verificable | WP-F |
| WP-H | Control Tower UX | cockpit, My Work, salud del proyecto, centro de excepciones | el PM opera el proyecto sin recorrer cada tarea | WP-B–G |
| WP-I | Hybrid Orchestration | predictivo ↔ agile, releases ↔ hitos | un sprint afecta el forecast de una fase sin romper la baseline | WP-B, WP-C |
| WP-J | Portfolio | programas, portafolios, dependencias entre proyectos, objetivos | dirección observa varios proyectos | WP-H |
| WP-K | Enterprise Governance | RBAC/ABAC, SSO, export de auditoría, retención, admin | modelo de seguridad enterprise-ready | transversal |
| WP-L | Analytics & Forecasting | modelos históricos, escenarios, riesgo probabilístico | forecast explicable y escenarios | datos de producción |

**Primer vertical slice — lanzamiento de una API:** crear proyecto → generar/importar WBS → crear dependencias → asignar personas → definir baseline → ver Gantt → conectar GitHub + Slack → mergear PR → detectar evidencia → la IA propone avance → el usuario confirma desde Slack → el motor recalcula el cronograma → el cockpit muestra la nueva situación. Cuando ese circuito funciona de extremo a extremo, existe un producto diferenciable.

**Segundo vertical slice — Scrum:** fase de software → backlog → sprint → ejecución en GitHub → historias completadas → release → release enlazada a hito predictivo → forecast recalculado. Prueba que el núcleo soporta **híbrido real**.

**Tercer vertical slice — dinero:** paquete → presupuesto → persona × tarifa × horas reales + compromisos con proveedores + costo fijo → real / forecast → varianza → cockpit financiero. *«¿Podemos gastar 20 000 USD adicionales y mantener el margen?»* se responde consultando el motor financiero, no inventando una cifra.

### Etapas de avance

| Etapa | Pregunta | Criterio de salida |
|---|---|---|
| Product definition | ¿qué objeto es una verdad del proyecto? | modelo de dominio y reglas aceptadas |
| Kernel prototype | ¿una sola estructura soporta distintos proyectos? | predictivo y Agile creados sobre el mismo modelo |
| Planning alpha | ¿el motor programa correctamente? | calendarios, dependencias, Gantt, baseline |
| Execution alpha | ¿un equipo puede trabajar a diario? | My Work, board, backlog, sprint |
| Connected alpha | ¿el proyecto aprende de herramientas externas? | Slack/GitHub/Google activos |
| AI alpha | ¿la IA actúa de forma gobernada? | propuesta → aprobación → mutación → auditoría |
| Financial beta | ¿el PM conoce dinero real y forecast? | presupuesto/real/compromiso/forecast integrados |
| Hybrid beta | ¿un sprint puede afectar una fase predictiva? | propagación funcional |
| PM control beta | ¿el PM trabaja por excepciones? | control tower operativo |
| Enterprise readiness | ¿la organización puede confiar el portafolio? | seguridad, auditoría, resiliencia y permisos |
| Portfolio maturity | ¿dirección ve programas y dependencias? | portafolio unificado |

### Definition of Done del producto inicial

> Un PM crea un proyecto híbrido con una WBS y una baseline. Una fase de software se ejecuta mediante backlog y sprints. El equipo trabaja en GitHub y conversa en Slack. Un PR mergeado aparece como evidencia. La IA identifica su tarea y propone progreso. El desarrollador confirma desde Slack. El sistema actualiza el trabajo real, recalcula la fecha dependiente y la capacidad, registra todo en auditoría y muestra al PM únicamente que un hito tiene ahora dos días de riesgo. Un costo externo registrado después modifica el forecast financiero, pero no la baseline. El PM pregunta en lenguaje natural qué decisión debe tomar, y el asistente explica la opción, el efecto de fecha, el costo y la evidencia que utilizó.

Si el sistema hace eso, no es un Kanban con IA: es el comienzo de una plataforma de dirección de proyectos.

### Métricas de éxito del producto

| Métrica | Lo que demuestra |
|---|---|
| % de actualizaciones capturadas sin ingreso manual del PM | reducción de administración |
| % de propuestas de IA aceptadas sin corrección | calidad contextual |
| tiempo desde el evento real hasta la actualización del proyecto | frescura |
| % de cambios con evidencia/procedencia | confiabilidad |
| horas semanales de administración de estado por PM | valor económico |
| % de riesgos identificados antes del impacto | capacidad preventiva |
| precisión del forecast de fecha | calidad del motor |
| precisión del forecast de costo | calidad financiera |
| % de tareas desactualizadas | calidad de la verdad operacional |
| latencia de resolución de bloqueos | eficacia del control tower |
| herramientas que un ejecutor abre para reportar | fricción |
| interacciones desde Slack/GitHub frente a abrir la plataforma | integración real al flujo |

Métrica estrella: **PM Attention Efficiency**, el porcentaje del tiempo del PM dedicado a decisiones y excepciones frente a recolectar y reconciliar información.

### Prioridad de inversión

1. Modelo canónico, scheduling, WBS, backlog, personas, baseline y modelo de eventos.
2. GitHub, Slack y Google como conectores excelentes, no veinte integraciones superficiales.
3. IA transaccional con procedencia, aprobaciones y política.
4. Costos, forecast y control financiero profundo.
5. Híbrido y portafolio.
6. Inteligencia predictiva basada en suficiente histórico real.

No se puede construir una IA excelente para dirección de proyectos si debajo solo existe una lista de tareas.

> **Un Project Control Plane con IA nativa, metodológicamente adaptable y orientado a evidencia.** No reemplaza Jira haciendo un Jira más bonito, ni Project haciendo un Gantt más sencillo, ni Excel agregando fórmulas, ni Slack obligando a abandonarlo: **los convierte en fuentes, interfaces o modelos parciales de un sistema central que sabe qué se está construyendo, quién puede hacerlo, cuándo debe ocurrir, cuánto puede costar, qué ocurrió realmente y qué decisión necesita atención humana.**
