# SRS — Especificación de requisitos de software de Alaira Planner

**ID:** SRS-ALP · **Versión:** 0.1.1 ([RR-0001](records/RR-0001-inconsistencias-fases-prioridades.md)) · **Fecha:** 2026-10-15 · **Estado:** propuesta, sin aprobación de baseline. **Convención:** «DEBE» indica obligación de producto propuesta, no funcionalidad existente.

## 1. Propósito, alcance y vocabulario

Especificar de forma comprobable una plataforma OSS de gestión multi-metodología de proyectos, programas y portafolios, asistida por IA y conectores. Audiencia: Alaira, Product, ingeniería, QA, seguridad, diseño, responsables de proyectos y agentes ejecutores. Sus cambios siguen el procedimiento de [CHANGE_CONTROL](CHANGE_CONTROL.md).

**Actores:** propietario de organización, administrador, PM, PMO, PO/SM, ejecutor, revisor de entregable, finanzas, invitado limitado, integrador externo y agente de IA delegado. Un actor puede ocupar varios roles bajo políticas explícitas.

**Glosario mínimo:** WBS/EDT = descomposición de entregables; baseline = versión aprobada congelada; BAC = presupuesto a terminación; PV = valor planificado; EV = valor ganado; AC = costo real; evidencia = artefacto o constancia con procedencia; aceptación = decisión de cumplimiento; idempotencia = reintentar sin aplicar duplicadamente; tenant = organización con aislamiento lógico.

**Priorización:** P0 = núcleo y seguridad; P1 = primera expansión; P2 = avanzado. La prioridad expresa criticidad, no fase: un requisito P0 **bloquea cualquier piloto externo o release que incluya la capacidad afectada**, aunque esa capacidad se entregue después de M1 (por ejemplo, REQ-065 con las integraciones de M4). **Fases M0–M5:** se describen en el [PRD](../product/PRD.md) y el [ROADMAP](../planning/ROADMAP.md), no son fechas comprometidas; la fase de cada requisito figura en la [matriz de trazabilidad](TRACEABILITY.md).

## 2. Contexto, interfaces y supuestos

Usuarios interactúan desde web responsive y, cuando se diseñe, integración Slack/Teams y API. Entradas pueden provenir de uploads, documentos, canales de comunicación, aprobaciones manuales, CSV y conectores. Salidas: estado, vistas WBS/Gantt/Kanban, reportes, eventos, webhooks y exportaciones. Se asume por validar soporte cloud primero; modo autoalojado OSS, multi-región/offline y modelo de licencia se deciden con ADR/RR.

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

## 5. Reglas del negocio e invariantes

- El avance de un paquete no puede superar 100% ni ser negativo; no se duplica al tener varias evidencias. La aceptación se versiona, conserva actor y justificación; rechazo y reversión preservan historia.
- Una WBS carece de ciclos y no mezcla agregados padre/hijo en la misma suma; cada regla de ponderación indica denominador y tratamiento de paquetes excluidos.
- Un calendario posee zona horaria y excepciones; un cálculo de CPM exige una red válida y fecha de corte, y marca calendarios/capacidad no modelados como limitaciones.
- Los cálculos de EVM usan la misma baseline y fecha de corte; AC es costo realmente reconocido bajo política, no necesariamente pagos bancarios ni horas registradas.
- Las acciones del agente están sujetas al permiso del solicitante y al de la integración; ninguna instrucción remota amplía el alcance del token.
- No hay opción de completar automáticamente por un mero documento recibido, commit u observación de chat, salvo una regla objetiva aprobada previamente.

## 6. Interfaces externas y fallos

Autenticación de API según ADR, versión de contrato, scopes de conectores, rate limits y deduplicación. Slack requiere verificación de origen, mapeo de usuario y autorización local, desambiguación y confirmación. Cualquier sync parcial se marca error y se reintenta sin confirmar estado ficticio. Los errores nunca exponen datos de otro tenant. Ver [INTEGRATIONS](../architecture/INTEGRATIONS.md).

## 7. Escenarios críticos de aceptación

**UC-01:** PM crea proyecto híbrido, WBS con entregable y backlog enlazado; al completar historias sin aprobación del entregable, el hito permanece pendiente y no se duplica porcentaje.

**UC-02:** integrante escribe en Slack «marca completado X en Y»; si X es ambiguo, bot pide selección; si no tiene permiso, deniega; si falta evidencia, registra solicitud pendiente, no aprobación; si hay aprobación autorizada, evento y auditoría una sola vez.

**UC-03:** responsable adjunta acta aprobada offline como evidencia; revisor autorizado valida; el reporte recalcula estado sin referencia a GitHub.

**UC-04:** PM propone cambio de alcance; baseline anterior queda consultable, baseline nueva sólo tras aprobación; PV/EV reportan ID de baseline.

**UC-05:** usuario de tenant B intenta acceso por ID directo a evidencia de A, también mediante búsqueda/RAG/webhook; todos los caminos deniegan sin fuga.

Detalles de TC y datos esperados: [ACCEPTANCE_SCENARIOS](../quality/ACCEPTANCE_SCENARIOS.md).

## 8. Validación, dependencias y trazabilidad

El alcance de cada requisito se recoge en WBS y TC mediante la [matriz de trazabilidad](TRACEABILITY.md); sólo se declara completado al aportar evidencia válida y revisión. MVP, presupuesto, licencias y stack quedan pendientes de aprobación humana. Primer gate: priorización de REQ-001…080 y NFR, más entrevistas y threat model.
