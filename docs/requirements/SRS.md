# SRS — Especificación de requisitos de software de Alaira Planner

**ID:** SRS-ALP · **Versión:** 0.2.0 ([RR-0002](records/RR-0002-baseline-m1-y-g0.md)) · **Fecha:** 2026-10-15 · **Estado:** baseline M1 aprobada para los requisitos listados en RR-0002; el resto, propuesto. **Fuente de producto:** [PRODUCT_BRIEF](../product/PRODUCT_BRIEF.md). **Convención:** «DEBE» indica obligación de producto, no funcionalidad existente.

## 1. Propósito, alcance y vocabulario

Especificar de forma comprobable un *Project Control Plane* OSS con IA nativa: plan, ejecución, evidencia y dinero en un mismo modelo de datos, con modos predictivo, adaptativo e híbrido por rama, y una capa de IA que mantiene ese modelo actualizado a partir del trabajo real bajo política de autonomía. Audiencia: Alaira, producto, ingeniería, QA, seguridad, diseño, responsables de proyectos y agentes ejecutores. Sus cambios siguen el procedimiento de [CHANGE_CONTROL](CHANGE_CONTROL.md).

**Actores:** propietario de organización, administrador, Project/Program Manager, PMO, Product Manager, Scrum Master/PO, Tech Lead, ejecutor, revisor de entregable, finanzas, dirección, stakeholder o invitado limitado, integrador externo y agente de IA delegado. Un actor puede ocupar varios roles bajo políticas explícitas.

**Glosario mínimo:** WBS/EDT = descomposición de entregables; baseline = versión aprobada congelada; forecast = expectativa actual; real = lo ocurrido; BAC = presupuesto a terminación; PV = valor planificado; EV = valor ganado; AC = costo real; evidencia = artefacto o constancia con procedencia; EvidenceEvent = evento externo normalizado e interpretado; propuesta de IA = cambio sugerido pendiente de la política de autonomía; aceptación = decisión de cumplimiento de criterios; idempotencia = reintentar sin aplicar duplicadamente; tenant = organización con aislamiento lógico. Glosario completo en [GLOSSARY](../governance/GLOSSARY.md).

**Priorización:** P0 = núcleo y seguridad; P1 = primera expansión; P2 = avanzado. La prioridad expresa criticidad, no fase: un requisito P0 **bloquea cualquier piloto externo o release que incluya la capacidad afectada**, aunque esa capacidad se entregue después de M1 (por ejemplo, NFR-018 de retención bloquea el primer piloto externo). **Fases M0–M5:** se describen en el [PRD](../product/PRD.md) y el [ROADMAP](../planning/ROADMAP.md), no son fechas comprometidas; la fase de cada requisito figura en la [matriz de trazabilidad](TRACEABILITY.md).

## 2. Contexto, interfaces y supuestos

Usuarios interactúan desde web (desktop primero; móvil para My Work, aprobaciones y actualizaciones), Slack, la barra Ask/Command y la API. Integraciones iniciales: Slack y GitHub (M1) y Google Drive/Docs/Sheets (M2); posteriores: Teams, Microsoft 365, Jira, Linear, Figma, ERP, CI/CD y calendarios. Entradas: eventos de conectores normalizados como EvidenceEvent, uploads, documentos, aprobaciones manuales, CSV e intenciones en lenguaje natural. Salidas: estado y consecuencias, vistas WBS/Gantt/Board/Backlog/cockpit, Project Event Log, reportes, eventos, webhooks y exportaciones. Despliegue de referencia autoalojado ([ADR-0006](../architecture/adr/0006-stack-base.md)); licencia Apache-2.0 ([ADR-0004](../architecture/adr/0004-oss-license-pending.md)).

## 3. Catálogo de requisitos funcionales

Cada fila define requisito, prioridad y prueba de conformidad observable; ningún requisito se considera implementado. Los IDs son estables y no se reciclan.

### 3.1 Identidad, organizaciones y estructura (REQ-001–010)

| ID | P | El sistema DEBE… | Verificación |
|---|---|---|---|
| REQ-001 | P0 | crear organizaciones con aislamiento de datos por tenant | TC-SEC-01: tenant B no lee A |
| REQ-002 | P0 | autenticar usuarios por mecanismo aprobado y controlar sesiones | TC-SEC-02: sesión caducada se rechaza |
| REQ-003 | P0 | autorizar por roles y por contexto/recurso las escrituras y lecturas | TC-SEC-03: actor sin permiso recibe denegación |
| REQ-004 | P0 | invitar, desactivar y administrar membresías sin pérdida histórica de auditoría | TC-IAM-01: desactivado no accede |
| REQ-005 | P1 | modelar portafolio, programa, proyecto y relación entre ellos | TC-ORG-01: jerarquía consultable |
| REQ-006 | P0 | configurar al crear proyecto método predictivo, ágil o híbrido y cambiar vistas sin pérdida | TC-PROJ-01: misma identidad en vistas |
| REQ-007 | P0 | registrar propietarios, participantes, roles y visibilidad de proyectos | TC-PROJ-02: edición restringida |
| REQ-008 | P1 | ofrecer campos configurables con tipo, validación y gobierno por organización | TC-PROJ-03: tipo inválido falla |
| REQ-009 | P0 | mantener identificadores estables y trazables para entidades y operaciones | TC-API-01: IDs persisten |
| REQ-010 | P1 | exportar datos de negocio y permitir importación validada sin silencioso truncamiento | TC-PORT-01: roundtrip documentado |

### 3.2 Planeación, recursos y baseline (REQ-011–030)

| ID | P | El sistema DEBE… | Verificación |
|---|---|---|---|
| REQ-011 | P0 | construir jerarquía EDT/WBS con códigos y evitar ciclos | TC-WBS-01 |
| REQ-012 | P0 | definir paquete con responsable, descripción, criterios, estimación y estado | TC-WBS-02 |
| REQ-013 | P0 | registrar entregables de cualquier naturaleza y su versión/criterios | TC-WBS-03 |
| REQ-014 | P1 | definir hitos de duración cero y asociarles puertas de aprobación | TC-SCH-01 |
| REQ-015 | P1 | vincular entregables/paquetes con tareas, objetivos y/o backlog sin duplicar identidad | TC-WBS-04 |
| REQ-016 | P0 | exigir criterios de aceptación configurados para aceptar entregables | TC-ACC-01 |
| REQ-017 | P1 | registrar personas, roles, competencias declaradas y tarifas cuando esté autorizado | TC-RES-01 |
| REQ-018 | P1 | gestionar capacidad/disponibilidad y señalar sobreasignación | TC-RES-02 |
| REQ-019 | P1 | registrar partes de tiempo manuales revisables y aprobables, separadas de progreso | TC-RES-03 |
| REQ-020 | P1 | trabajar con zona horaria, calendarios laborales, excepciones y feriados | TC-SCH-02 |
| REQ-021 | P1 | expresar dependencias FS, SS, FF y SF, validando relaciones | TC-SCH-03 |
| REQ-022 | P1 | aplicar lag/lead con unidades, calendario y comportamiento documentados | TC-SCH-04 |
| REQ-023 | P1 | calcular CPM y camino crítico bajo supuestos explícitos y detectar ciclos | TC-SCH-05 |
| REQ-024 | P1 | crear baseline inmutable aprobada de plan/fechas/presupuesto | TC-BASE-01 |
| REQ-025 | P2 | comparar escenarios what-if sin alterar plan aprobado | TC-BASE-02 |
| REQ-026 | P1 | tramitar cambios que versionen baseline e identifiquen aprobador | TC-BASE-03 |
| REQ-027 | P0 | consolidar progreso con una regla de ponderación versionada y explicable | TC-PROG-01 |
| REQ-028 | P1 | presentar Gantt, dependencias y desviaciones desde un mismo dato canónico | TC-UI-01 |
| REQ-029 | P1 | preservar instantáneas e historia de estados para auditoría temporal | TC-AUD-01 |
| REQ-030 | P2 | modelar dependencias entre proyectos con restricción de acceso | TC-SCH-06 |

### 3.3 Evidencia, aceptación y auditoría (REQ-031–040)

| ID | P | El sistema DEBE… | Verificación |
|---|---|---|---|
| REQ-031 | P0 | adjuntar evidencia documental, enlace o registro manual, con tipo y metadatos | TC-EV-01 |
| REQ-032 | P0 | registrar autor, origen, instante, versiones, permisos y checksum cuando aplique | TC-EV-02 |
| REQ-033 | P0 | separar estados de ejecución, solicitud de finalización y aceptación | TC-ACC-02 |
| REQ-034 | P0 | aceptar sólo por actor/regla autorizada, con sello y criterios evaluados | TC-ACC-03 |
| REQ-035 | P0 | rechazar con motivo, observaciones y conservación de evidencia | TC-ACC-04 |
| REQ-036 | P0 | revertir mediante evento compensatorio autorizado y auditable | TC-ACC-05 |
| REQ-037 | P0 | deduplicar eventos/solicitudes repetidos e impedir doble avance | TC-INT-01 |
| REQ-038 | P0 | no inferir completion por commit, mensaje, upload ni resultado de IA sin política | TC-ACC-06 |
| REQ-039 | P0 | admitir progreso desde entregas no vinculadas a GitHub o código | TC-EV-03 |
| REQ-040 | P0 | mantener auditoría de transiciones, acciones del bot y decisiones | TC-AUD-02 |

### 3.4 Ejecución ágil, híbrida y colaboración (REQ-041–050)

| ID | P | El sistema DEBE… | Verificación |
|---|---|---|---|
| REQ-041 | P1 | conservar backlog priorizable por proyecto/equipo | TC-AG-01 |
| REQ-042 | P1 | definir épicas, historias, tareas, aceptación y relación con entregables | TC-AG-02 |
| REQ-043 | P1 | soportar sprints con objetivo, duración y membresía trazable | TC-AG-03 |
| REQ-044 | P1 | ofrecer tableros Kanban y límites WIP configurables por estado | TC-AG-04 |
| REQ-045 | P1 | calcular throughput, lead/cycle time, burnup y velocidad según definiciones | TC-AG-05 |
| REQ-046 | P1 | priorizar por orden y, si se activa, scoring explicable | TC-AG-06 |
| REQ-047 | P1 | agrupar entregas/releases y registrar su estado de aceptación | TC-AG-07 |
| REQ-048 | P1 | mapear iteraciones/backlog a fases, hitos o paquetes sin dobles conteos | TC-HYB-01 |
| REQ-049 | P1 | registrar riesgos, bloqueos, issues, decisiones y acciones (RAID) | TC-RAID-01 |
| REQ-050 | P1 | alertar dependencias y vencimientos con reglas y controles antirruido | TC-NOTIF-01 |

### 3.5 Finanzas y control de valor ganado (REQ-051–060)

| ID | P | El sistema DEBE… | Verificación |
|---|---|---|---|
| REQ-051 | P1 | registrar presupuesto autorizado/BAC y versiones por proyecto/paquete | TC-FIN-01 |
| REQ-052 | P1 | registrar tarifas, centros de costo, moneda y vigencias bajo permisos | TC-FIN-02 |
| REQ-053 | P1 | distinguir AC de compromisos, pagos y estimaciones; dejar procedencia | TC-FIN-03 |
| REQ-054 | P1 | calcular PV y EV según baseline/regla aceptada y fecha de corte | TC-EVM-01 |
| REQ-055 | P1 | exponer CPI=EV/AC y SPI=EV/PV con división por cero definida | TC-EVM-02 |
| REQ-056 | P2 | calcular escenarios EAC, ETC y VAC con fórmulas y supuestos visibles | TC-EVM-03 |
| REQ-057 | P2 | distinguir contingencia, reserva de gestión y cambios aprobados | TC-FIN-04 |
| REQ-058 | P2 | pronosticar con escenarios y expresar incertidumbre, no certeza ficticia | TC-FIN-05 |
| REQ-059 | P2 | separar moneda de origen, tasas y moneda de reporte con fecha de tipo de cambio | TC-FIN-06 |
| REQ-060 | P1 | aplicar segregación de funciones a aprobaciones financieras y cambios | TC-FIN-07 |

### 3.6 Integración, asistente IA y gobierno (REQ-061–080)

| ID | P | El sistema DEBE… | Verificación |
|---|---|---|---|
| REQ-061 | P1 | recibir solicitudes Slack verificadas, identificar actor/proyecto/tarea y solicitar confirmación cuando proceda | TC-BOT-01 |
| REQ-062 | P2 | admitir adapter Microsoft Teams con políticas equivalentes, si se prioriza | TC-BOT-02 |
| REQ-063 | P1 | ofrecer API versionada, eventos/webhooks autenticados y administración de credenciales | TC-API-02 |
| REQ-064 | P1 | exponer estado, reintentos, conflicto y desconexión de sincronización | TC-INT-02 |
| REQ-065 | P0 | procesar comandos externos con idempotencia, causalidad y reversión | TC-INT-03 |
| REQ-066 | P1 | citar fuentes/tiempos y confianza en respuestas del asistente | TC-AI-01 |
| REQ-067 | P2 | proponer riesgos/escenarios, nunca aprobarlos de forma encubierta | TC-AI-02 |
| REQ-068 | P1 | limitar recuperación RAG a permisos y datos del tenant/actor | TC-AI-03 |
| REQ-069 | P0 | pedir aprobación cuando la política exija alto impacto; registrar identidad y motivo | TC-AI-04 |
| REQ-070 | P1 | configurar notificaciones proactivas, opt-in y supresión de duplicados | TC-NOTIF-02 |
| REQ-071 | P1 | proveer dashboards de tarea, proyecto, programa y portafolio por permiso | TC-REP-01 |
| REQ-072 | P2 | agregar portafolios por reglas transparentes y comparar restricciones | TC-REP-02 |
| REQ-073 | P1 | exportar reportes y datos con fecha de corte, filtros y definiciones | TC-REP-03 |
| REQ-074 | P1 | gestionar permisos de archivos/evidencias y vínculos externos caducables | TC-SEC-04 |
| REQ-075 | P1 | buscar entidades con alcance restringido y filtros estructurados | TC-SEARCH-01 |
| REQ-076 | P0 | ofrecer web accesible por teclado, semántica y contraste evaluados | TC-UX-01 |
| REQ-077 | P1 | soportar vistas móviles esenciales sin ocultar estado de aceptación | TC-UX-02 |
| REQ-078 | P1 | admitir localización, fechas y zonas horarias explícitas | TC-UX-03 |
| REQ-079 | P2 | tener reglas de extensibilidad y automatización gobernadas por organización | TC-EXT-01 |
| REQ-080 | P0 | exportar auditoría pertinente sin revelar información de otros tenants | TC-AUD-03 |

### 3.7 Grafo de proyecto, IA transaccional y control (REQ-081–103)

Incorporados desde el [PRODUCT_BRIEF](../product/PRODUCT_BRIEF.md) por [RR-0002](records/RR-0002-baseline-m1-y-g0.md).

| ID | P | El sistema DEBE… | Verificación |
|---|---|---|---|
| REQ-081 | P0 | asignar a cada proyecto un `delivery_profile` (modo de planificación, motor de programación, ejecución ágil, control financiero, planificación de recursos, baseline obligatoria) y permitir que cada rama o paquete sobrescriba su modo de ejecución (predictivo, Scrum o Kanban) | TC-HYB-02 |
| REQ-082 | P1 | aplicar restricciones de fecha (no antes de, no después de, fecha impuesta), calcular holgura total y libre y admitir programación automática o manual por actividad | TC-SCH-07 |
| REQ-083 | P1 | distinguir trabajo, duración y unidades de asignación, con calendarios por persona o recurso | TC-RES-04 |
| REQ-084 | P2 | proponer nivelación de recursos como escenario sin alterar plan aprobado ni baseline | TC-RES-05 |
| REQ-085 | P0 | mantener por actividad y paquete fechas de baseline, forecast y reales separadas y calcular su varianza; ninguna acción de IA modifica una baseline | TC-BASE-04 |
| REQ-086 | P1 | modelar recursos no humanos (materiales y categorías de costo) además de personas y equipos, mostrando en la interfaz Personas, Equipos, Capacidad y Recursos no humanos | TC-RES-06 |
| REQ-087 | P0 | normalizar todo evento externo en un EvidenceEvent con fuente, ID externo, actor, instante, tipo, artefacto, candidatos de proyecto e ítem, confianza, referencia original, payload normalizado, interpretación de IA, aceptante y efecto | TC-EV-04 |
| REQ-088 | P1 | integrar GitHub: issues ↔ work items y PR, review, merge, Actions y releases como evidencia, sin usar GitHub como fuente directa del porcentaje de avance | TC-GH-01 |
| REQ-089 | P1 | integrar Google Drive/Docs/Sheets como artefactos y contenedores de evidencia y avisar cuando un documento enlazado cambia después de su última aprobación, ofreciendo comparar y evaluar impacto | TC-GDR-01 |
| REQ-090 | P0 | clasificar cada acción de IA como informar (automática), proponer (confirmación ligera) o controlada (aprobación obligatoria); son controladas al menos modificar baseline, aprobar cambios, modificar presupuesto, cambiar hitos contractuales, borrar proyectos y cambiar permisos | TC-AI-05 |
| REQ-091 | P0 | registrar en cada cambio originado por IA quién, qué, cuándo, por qué, evidencia, modelo o regla que intervino, estado anterior, estado posterior y aprobador | TC-AI-06 |
| REQ-092 | P0 | evaluar propuestas de avance contra los criterios de aceptación o DoD, indicando criterios cumplidos y pendientes, y no cerrar un ítem cuya evidencia esté incompleta | TC-AI-07 |
| REQ-093 | P1 | responder a cada acción (Slack, UI, API) con sus consecuencias: fechas reales, efecto en hitos, ruta crítica y forecast, y aclaración de lo que no se modificó | TC-BOT-03 |
| REQ-094 | P1 | generar un stand-up asíncrono: actualización sugerida por persona a partir de evidencia, confirmable o corregible, y resumen por excepciones para el PM | TC-AI-08 |
| REQ-095 | P1 | permitir elegir por paquete una estrategia de progreso versionada: manual, por duración, por trabajo, % físico, hitos ponderados, checklist ponderado, aceptación de entregable, completitud de historias, técnica de valor ganado o evidencia externa | TC-PROG-02 |
| REQ-096 | P1 | ofrecer las experiencias My Work, Team, Project Control y Portfolio, un centro de excepciones y una barra Ask/Command disponible en toda la aplicación, sujeta a permisos y a la política de autonomía | TC-UX-04 |
| REQ-097 | P1 | mostrar un Project Event Log legible que reconstruya qué cambió, por qué, con qué evidencia y con qué efecto | TC-AUD-04 |
| REQ-098 | P1 | calcular por separado el saldo disponible (autorizado − real − compromisos abiertos − reserva protegida) y la holgura de forecast (autorizado − forecast a terminación) | TC-FIN-08 |
| REQ-099 | P2 | distribuir el presupuesto en el tiempo y proyectar flujo de caja con periodos fiscales, proveedor y referencia de compra | TC-FIN-09 |
| REQ-100 | P1 | tramitar solicitudes de cambio con deltas de alcance, cronograma, costo, recursos y riesgo, baseline afectada, aprobadores, decisión y fecha efectiva; aprobar crea una nueva versión de baseline sin destruir la anterior | TC-BASE-05 |
| REQ-101 | P1 | registrar riesgos con probabilidad, impacto, exposición, dueño, disparador, respuesta, contingencia y nodos relacionados; la IA propone riesgos, no los declara | TC-RAID-02 |
| REQ-102 | P1 | ofrecer story points y estimación temporal separados, burndown, burnup, flujo acumulado, cambio de alcance y carryover, sin métricas de productividad individual | TC-AG-08 |
| REQ-103 | P2 | enlazar objetivos estratégicos y outcomes con portafolios, programas, proyectos y paquetes | TC-ORG-02 |

## 4. Atributos de calidad — NFR

**Las cifras son objetivos candidatos para validar, NO resultados medidos ni SLA comprometidos.** Los requisitos de seguridad P0 aplican antes de cualquier piloto externo.

| ID | P | Criterio medible propuesto / gate | Verificación |
|---|---|---|---|
| NFR-001 | P0 | ninguna consulta o acción cruza tenants sin permiso explícito; pruebas negativas automatizadas | TC-SEC-01 |
| NFR-002 | P0 | RBAC + reglas por recurso evaluadas en servidor, nunca sólo en UI | TC-SEC-03 |
| NFR-003 | P0 | todas las acciones relevantes incluyen actor, resultado, momento, causa y correlation ID | TC-AUD-02 |
| NFR-004 | P0 | claves OAuth, secretos y credenciales cifrados/rotables; no quedan en logs | TC-SEC-05 |
| NFR-005 | P0 | cifrado en tránsito y reposo en implementación seleccionada | TC-SEC-06 |
| NFR-006 | P0 | protección contra SSRF, inyección, XSS, CSRF cuando aplique, prompt injection y replay | TC-SAFE-01, TC-AI-03/04, TC-INT-03 |
| NFR-007 | P0 | pruebas de autorización y autorización de herramientas de IA antes de habilitar acciones | TC-AI-04 |
| NFR-008 | P0 | cambios externos idempotentes bajo entrega al menos una vez; reintentos observables | TC-INT-01, TC-INT-03 |
| NFR-009 | P1 | lectura normal p95 objetivo < 500 ms bajo carga definida en el piloto; medir y revisar | TC-PERF-01 |
| NFR-010 | P1 | objetivo candidato disponibilidad mensual 99.9% una vez en servicio; excluir mantenimiento según futuro SLO | TC-SLO-01 |
| NFR-011 | P1 | restauración de backup probada; definir RPO/RTO antes del primer piloto | TC-OPS-01 |
| NFR-012 | P0 | migraciones reversibles o con plan de restauración y aprobación para pérdida de datos | TC-OPS-02 |
| NFR-013 | P0 | accesibilidad de referencia WCAG 2.2 AA, verificada en flujos críticos | TC-UX-01 |
| NFR-014 | P1 | navegador moderno responsivo; matriz de soporte se define antes del MVP | TC-UX-02 |
| NFR-015 | P1 | exportación utilizable de datos en formatos documentados y sin dependencia de proveedor | TC-PORT-01 |
| NFR-016 | P0 | observabilidad de auditoría, errores, cola, webhooks y sincronización sin PII innecesaria | TC-OPS-03, TC-PRIV-01 |
| NFR-017 | P1 | APIs con versionado, paginación, validación y deprecación documentada | TC-API-02 |
| NFR-018 | P0 | retención/borrado legal y backups bajo política aprobada, sin promesas regulatorias no verificadas | TC-PRIV-01 |
| NFR-019 | P1 | pruebas de reproducibilidad de programación/CPM/EVM en casos y límites | TC-SCH-05, TC-EVM-01..03 |
| NFR-020 | P1 | plan de evaluación IA con falsos positivos, abstención, aislamiento y regresión | TC-AI-01..04 |
| NFR-021 | P0 | fechas, calendarios, dependencias, capacidad, costos, baseline, permisos, estados y fórmulas los calcula solo el motor determinista; la IA nunca muta datos directamente, solo mediante herramientas tipadas que aplican las mismas reglas de dominio que la UI | TC-AI-09 |
| NFR-022 | P1 | frescura: tiempo desde el evento externo hasta la actualización o propuesta en el proyecto medido por conector; objetivo candidato a fijar antes del piloto | TC-PERF-02 |

## 5. Reglas del negocio e invariantes

- El avance de un paquete no puede superar 100% ni ser negativo; no se duplica al tener varias evidencias. Lo calcula la estrategia de progreso versionada del paquete (REQ-095); no existe una fórmula universal de «% completado». La aceptación se versiona, conserva actor y justificación; rechazo y reversión preservan historia.
- Baseline, forecast y real son valores distintos. La baseline solo cambia por una solicitud de cambio aprobada que crea una nueva versión; forecast y real se actualizan sin tocarla.
- Una WBS carece de ciclos y no mezcla agregados padre/hijo en la misma suma; cada regla de ponderación indica denominador y tratamiento de paquetes excluidos.
- Un calendario posee zona horaria y excepciones; un cálculo de CPM exige una red válida y fecha de corte, y marca calendarios/capacidad no modelados como limitaciones.
- Los cálculos de EVM usan la misma baseline y fecha de corte; AC es costo realmente reconocido bajo política, no necesariamente pagos bancarios ni horas registradas.
- Las acciones del agente están sujetas al permiso del solicitante y al de la integración; ninguna instrucción remota amplía el alcance del token.
- La evidencia (documento, commit, PR, mensaje) no cambia el avance por sí sola: genera un EvidenceEvent que puede producir una propuesta de IA. La propuesta se aplica según la política de autonomía (informar, proponer, controlado) y nunca cierra un ítem con criterios de aceptación o DoD pendientes. El cierre automático solo procede si una regla objetiva aprobada previamente lo permite.
- El motor determinista es la única autoridad sobre fechas, calendarios, dependencias, capacidad, costos, baseline, permisos, estados y fórmulas; la IA interpreta, resuelve entidades, propone y explica.
- La velocidad, el tiempo registrado y la actividad son datos de planificación del equipo, nunca puntuaciones individuales. `Velocity ≠ horas`, `story points ≠ costo`, `cycle time ≠ esfuerzo`, `progreso ≠ tiempo registrado`.

## 6. Interfaces externas y fallos

Autenticación de API según [ADR-0007](../architecture/adr/0007-tenancy-y-autenticacion.md), versión de contrato, scopes de conectores, rate limits y deduplicación. Cada conector implementa el contrato uniforme del Connector SDK y declara sus capacidades. Slack requiere verificación de origen, mapeo de usuario y autorización local, desambiguación y confirmación. Cualquier sync parcial se marca error y se reintenta sin confirmar estado ficticio. Los errores nunca exponen datos de otro tenant. Ver [INTEGRATIONS](../architecture/INTEGRATIONS.md).

## 7. Escenarios críticos de aceptación

**UC-01:** PM crea proyecto híbrido, WBS con entregable y backlog enlazado; al completar historias sin aprobación del entregable, el hito permanece pendiente y no se duplica porcentaje.

**UC-02:** integrante escribe en Slack «marca completado X en Y»; si X es ambiguo, bot pide selección; si no tiene permiso, deniega; si falta evidencia, registra solicitud pendiente, no aprobación; si hay aprobación autorizada, evento y auditoría una sola vez.

**UC-03:** responsable adjunta acta aprobada offline como evidencia; revisor autorizado valida; el reporte recalcula estado sin referencia a GitHub.

**UC-04:** PM propone cambio de alcance; baseline anterior queda consultable, baseline nueva sólo tras aprobación; PV/EV reportan ID de baseline.

**UC-05:** usuario de tenant B intenta acceso por ID directo a evidencia de A, también mediante búsqueda/RAG/webhook; todos los caminos deniegan sin fuga.

**UC-06 (primer vertical slice):** PM crea el proyecto «Lanzamiento de API» con WBS, dependencias, personas y baseline. Un PR enlazado se mergea en GitHub; se registra un EvidenceEvent; la IA identifica el ítem y propone avance indicando los criterios de DoD cumplidos y pendientes; el responsable confirma desde Slack; el motor recalcula el cronograma; Slack y el cockpit muestran la consecuencia (hito sin cambio o con días de riesgo), y el Project Event Log registra toda la cadena.

**UC-07 (híbrido):** una release del equipo Scrum está enlazada al hito «Release candidate aceptado» de una fase predictiva; al completarse las historias de la release y aceptarse el entregable, el forecast de la fase dependiente se recalcula sin modificar la baseline.

**UC-08 (dinero):** se registra un costo externo; cambian el real, el forecast a terminación, el saldo disponible y la holgura de forecast, y la baseline no cambia. El PM pregunta «¿podemos gastar 20 000 USD más y mantener el margen?» y la respuesta proviene del motor financiero, citando las cifras usadas.

Detalles de TC y datos esperados: [ACCEPTANCE_SCENARIOS](../quality/ACCEPTANCE_SCENARIOS.md).

## 8. Validación, dependencias y trazabilidad

El alcance de cada requisito se recoge en WBS y TC mediante la [matriz de trazabilidad](TRACEABILITY.md); sólo se declara completado al aportar evidencia válida y revisión. La baseline M1 y las decisiones de G0 están en [RR-0002](records/RR-0002-baseline-m1-y-g0.md); fechas y presupuesto del proyecto de construcción no están comprometidos.
