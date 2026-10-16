# Diccionario EDT — Paquetes de trabajo

**Versión:** 0.2 ([RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md)) · **Unidades de esfuerzo:** intervalos de **jornadas-persona ideales de referencia** (JPI); no cronograma ni costo comprometido. Un día ideal presupone 6 h de trabajo enfocado de especialista con acceso a requisitos, entorno, revisión y herramientas. Excluye esperas externas y retrabajo por cambios. **Sin equipo contratado ni presupuesto: los rangos son hipótesis a reestimar con la primera TASK de cada paquete.** Stack en [ADR-0006](../architecture/adr/0006-stack-base.md). Todos los criterios exigen evidencia de prueba y aprobación del revisor; estados iniciales `proposed`. Cuando un paquete se entrega en varios *vertical slices* del [ROADMAP](ROADMAP.md), el contenido indica entre paréntesis el corte de cada parte (M1…M5); cada parte se acepta por separado.

## 1. Fundación

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-1.1 | Informe de discovery con 8–12 entrevistas y 3 flujos de usuario; no construir todavía | visión; ninguno | Product Research; 8–15 JPI | necesidades priorizadas, notas anonimizadas, hipótesis aceptadas/rechazadas |
| WBS-1.2 | SRS/PRD revisados, definiciones y baseline de M1; no prometer todo el catálogo | brief de producto, visión, RTM; 1.1 en paralelo (RR-0002) | Product/Planner; 6–12 JPI | 100% REQ P0 de M1 con TC, aprobación explícita de baseline |
| WBS-1.3 | ADRs comparados con POC de stack, tenancy, eventos y despliegue; no despliegue comercial | 1.2, riesgos | Arquitectura; 10–18 JPI | alternativas, pruebas y decisiones aprobadas registradas |
| WBS-1.4 | Automatización reproducible de agentes/worktrees, plantillas y CI básica; no auto-merge | AGENTS.md, 1.3 parcial | DX/Planner; 7–14 JPI | 2 tareas aisladas y revisadas sin sobrescrituras, CI registra evidencia |
| WBS-1.5 | Licencia OSS, guía de contribución, copyright, SBOM y política de comunidad; no se presupone licencia | 1.1, legal | Mantenedor/Legal; 4–10 JPI | LICENSE aprobado, derechos verificados, contribución publicada |

## 2. Núcleo

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-2.1 | Registro de tenant, identidad, invitaciones, sesiones; no SSO enterprise en primer corte | 1.3; REQ-001,002,004 | Backend IAM; 12–22 JPI | crear/desactivar usuario, sesiones expiran, auditoría trazada |
| WBS-2.2 | Políticas RBAC/ABAC, enforcement servidor y aislamiento; no solo roles visuales | 2.1; REQ-003 | Security/Backend; 10–18 JPI | pruebas negativas por endpoint/objeto y RAG sin fuga de tenant |
| WBS-2.3 | Grafo de proyecto: organización, portafolio, programa, proyecto, work nodes y aristas, `delivery_profile` con sobrescritura por rama, campos personalizados y ownership | 2.1–2.2 | Domain Backend; 14–26 JPI | proyecto con ramas predictiva y Scrum sobre el mismo modelo; vistas sin duplicar ID; campo de tipo inválido rechazado |
| WBS-2.4 | AuditEvent append-only, idempotencia, outbox, Project Event Log legible y persistencia inicial; no stream distribuido forzoso | 1.3, 2.2 | Platform; 14–26 JPI | replay no duplica operaciones; actor/causalidad registrados; el log reconstruye una cadena evidencia → propuesta → aprobación → recálculo |
| WBS-2.5 | API v1, búsqueda filtrada, import/export inicial y docs; no conectores completos | 2.2–2.4 | API/DX; 12–20 JPI | OpenAPI/contratos, paginación, autorización y roundtrip de muestra |
| WBS-2.6 | Sistema de diseño, navegación, formularios de proyecto/WBS/evidencia y a11y base; no mega-dashboard | 2.3, 3.4–3.5 parciales | UX/Frontend; 14–24 JPI | flujos primarios con teclado y lector, errores claros y diseño responsivo |
| WBS-2.7 | Control tower: My Work, Team, Project Control y Portfolio, centro de excepciones y barra Ask/Command; M1 mínimo (Project Control y My Work con cockpit), completo en M4 | 2.6, 3.3, 7.2 | UX/Frontend/AI; 16–30 JPI | el PM identifica sin recorrer tareas qué hito está en riesgo y por qué; Ask/Command respeta permisos y autonomía |

## 3. Planificación y aceptación

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-3.1 | Árbol WBS, paquete, entregable, hito y criterios; no CPM en este paquete | 2.3 | Domain/Frontend; 12–22 JPI | árbol sin ciclos, hijos únicos, criterios editables con versionado |
| WBS-3.2 | Calendarios de proyecto, recurso y feriados, zona horaria, FS/SS/FF/SF, lag/lead, ruta crítica y holgura (M1); restricciones de fecha y programación manual (M2) | 3.1, 1.3 | Scheduling; 18–36 JPI | casos con feriados, horario de verano y ciclos detectados; fechas CPM reproducibles contra oráculo |
| WBS-3.3 | Gantt, baseline inmutable, forecast y real separados con varianza (M1); escenarios y solicitudes de cambio con deltas (M2); la IA no modifica baselines | 3.2, 2.4 | Scheduling/UX; 15–30 JPI | cambio de una tarea recalcula forecast sin tocar baseline; aprobar un cambio crea v(n+1) y conserva v(n) |
| WBS-3.4 | Evidencias desde archivos, enlaces, constancias y EvidenceEvent normalizado de conectores; versiones, permisos y procedencia | 2.2–2.4, 3.1 | Evidence Backend; 15–25 JPI | documento no Git aceptable como evidencia; EvidenceEvent con todos sus campos; archivo no accesible desde otro tenant |
| WBS-3.5 | Solicitud, revisión, rechazo, compensación, estrategias de progreso versionadas por paquete y rollup; evaluación contra criterios/DoD | 3.1, 3.4, 2.4 | Domain/QA; 16–30 JPI | aceptar/revertir con políticas; duplicados sin doble progreso; ítem con DoD incompleta no se cierra |
| WBS-3.6 | Personas, equipos y recursos no humanos, asignación con trabajo/duración/unidades y sobreasignación (M1); timesheets con aprobación (M3); nivelación propuesta (M5) | 2.3, 3.1, 3.2 | Scheduling/Resource; 14–28 JPI | sobreasignación señalada; cambiar unidades recalcula según la regla documentada; horas no cambian aceptación |

## 4. Agilidad e híbrido

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-4.1 | Backlog, épica/historia, sprint y prioridad; no framework completo a escala | 2.3, 3.1 | Agile Domain/UX; 12–22 JPI | historias enlazadas a entregable y sprint con transición auditable |
| WBS-4.2 | Kanban/WIP, story points y estimación temporal separados, throughput, cycle/lead, velocidad, burndown, burnup, flujo acumulado, cambio de alcance y carryover; definiciones visibles | 4.1, 2.4 | Agile/Analytics; 12–22 JPI | fixtures calculan métricas y límites WIP sin falsos positivos; ninguna métrica por persona |
| WBS-4.3 | Orquestación híbrida: modos por rama, releases ↔ hitos, propagación de progreso adaptativo a forecast predictivo (M2); RAID con riesgos completos (M4) | 3.3, 3.5, 4.2 | Hybrid/Domain; 14–26 JPI | una release completada recalcula el forecast de la fase dependiente sin tocar baseline; un ítem en dos vistas no duplica progreso |

## 5. Integraciones

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-5.1 | Slack: verificar origen, mapear actor, desambiguar, confirmar, responder con consecuencias y registrar | 5.2, 2.2, 3.5 | Integrations; 14–26 JPI | comandos ambiguos/duplicados/denegados son seguros; la respuesta informa efecto en hitos y ruta crítica; sin aceptación encubierta |
| WBS-5.2 | Connector Fabric: SDK con contrato uniforme (`authorize`, `revoke`, `subscribe`, `backfill`, `receive_event`, `normalize`, `resolve_identity`, `fetch_artifact`, `execute_action`, `health_check`), declaración de capacidades, OAuth, webhooks/polling, bus de eventos, retries y estado de sync | 2.4, 2.5 | Integrations; 15–28 JPI | duplicado, reorden y revocación de credencial medidos y recuperables; un conector nuevo no añade lógica al núcleo |
| WBS-5.3 | Notificaciones de cambios/bloqueos, preferencias y anti-spam | 5.1, 4.3 | Notifications; 7–14 JPI | opt-in, desduplicación y ventanas sin spam |
| WBS-5.4 | Conector GitHub: issues ↔ work items; PR, review, merge, Actions y releases como EvidenceEvent; nunca fuente directa del % de avance | 5.2, 3.4 | Integrations; 10–18 JPI | un PR mergeado genera un único EvidenceEvent enlazado; webhook falsificado o repetido no produce efecto |
| WBS-5.5 | Conector Google Workspace: Docs/Sheets como artefactos, carpetas como contenedores de evidencia, detección de cambio posterior a aprobación | 5.2, 3.4 | Integrations; 10–18 JPI | cambio en documento aprobado genera aviso de impacto; ACL externa respetada |

## 6. Control financiero

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-6.1 | Presupuesto y líneas, rate cards, costo laboral, fijo, material y externo, compromisos, real y segregación de aprobaciones; no ERP | 2.2, 2.4, 3.1, 3.6 | Finance Domain; 16–32 JPI | origen, reconocimiento y autorizaciones de costo trazables; comprometido ≠ real |
| WBS-6.2 | Forecast a terminación, saldo disponible, holgura de forecast, PV/EV/AC, CPI/SPI con corte y baseline, cockpit financiero y reportes | 6.1, 3.3, 3.5 | Finance/QA; 14–26 JPI | fórmulas reproducibles con ceros y actualizaciones; un costo externo cambia forecast y no baseline |
| WBS-6.3 | EAC/ETC/VAC, contingencia y reserva de gestión, multimoneda, presupuesto en el tiempo y flujo de caja determinista | 6.2 | Finance/Analytics; 14–28 JPI | escenarios separados de aprobaciones con supuestos y sensibilidad |
| WBS-6.4 | Analítica histórica, forecast probabilístico de fecha y costo, detección de anomalías y riesgo probabilístico; requiere histórico real | 6.3, 8.5 | Analytics/AI; 14–28 JPI | forecast explicable con intervalo e incertidumbre visibles, separado de los cálculos deterministas |

## 7. IA gobernada

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-7.1 | Recuperación de contexto con permisos (índice vectorial en PostgreSQL), fuentes, caducidad y citación | 2.2, 3.4, 2.5 | AI/Backend; 13–25 JPI | actor restringido no recupera citas de otro tenant ni de recursos sin permiso |
| WBS-7.2 | Runtime de IA en seis pasos (observar, recuperar, interpretar, planificar, política, ejecutar y verificar), herramientas tipadas, AIProposal, niveles de autonomía, elevación y trazabilidad completa | 7.1, 3.5, 5.2 | AI/Integrations; 14–28 JPI | ninguna mutación sin herramienta tipada; acción controlada sin aprobación es rechazada; cada cambio registra los nueve campos de REQ-091 |
| WBS-7.3 | Conjunto de evaluación adversarial (vinculación PR → tarea, alucinación, prompt injection, acciones no autorizadas), costos, latencia y observabilidad | 7.1–7.2 | AI Safety/QA; 10–22 JPI | eval reproducible con umbrales aprobados antes de G1 |
| WBS-7.4 | Agentes funcionales (Intake, Progress, Scheduler, Dependency Watcher, Finance, Risk, Change Control, Stand-up, Portfolio, PM Copilot) y stand-up asíncrono; Progress en M1, Stand-up en M2, Finance en M3, resto en M4 | 7.2, 2.7 | AI/Product; 14–26 JPI | cada agente opera solo con herramientas de su ámbito; el stand-up produce un resumen por excepciones verificable |

## 8. Aseguramiento, adopción y release

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-8.1 | Test pyramid, fixtures, contrato, integración, E2E, CI y reporte QA | 1.4; transversal | QA/Platform; 14–28 JPI | pruebas críticas reproducibles y bloqueo en CI tras fallos |
| WBS-8.2 | Modelo de amenazas, privacidad, gestión de incidentes y auditoría de licencias | 1.3; transversal | Security/Legal; 12–24 JPI | mitigaciones P0 verificadas, plan de divulgación disponible |
| WBS-8.3 | A11y, perfiles de carga, observabilidad, restauración, SLO candidatos | 2.x, 8.1; transversal | SRE/UX; 14–26 JPI | flujos críticos WCAG objetivo, backups restaurados, latencia medida |
| WBS-8.4 | Manual de usuario, guías OSS, DX, instalación de referencia y exportabilidad | 1.5, 2.5, 8.1 | Docs/DX; 10–20 JPI | tercero instala desde guía sin información privada y exporta datos |
| WBS-8.5 | Piloto controlado, métricas, entrevistas y hallazgos verificados | 3.5, 8.2, 8.3, funcionalidades del corte | Research/PM; 12–24 JPI | usuarios completan flujos con consentimiento; errores y aprendizajes registrados |
| WBS-8.6 | Release checklist, aceptación final, etiquetado, changelog y rollback | 8.1–8.5, 1.5 | Planner/Mantenedor; 6–14 JPI | sign-off humano, licencia del proyecto publicada y dependencias compatibles, cero severidades bloqueantes |
| WBS-8.7 | Gobierno enterprise: SSO/SAML y OIDC, SCIM, retención personalizada, residencia de datos, export de auditoría, legal hold y administración avanzada | 2.1, 2.2, 8.2 | Security/Platform; 16–30 JPI | SSO y SCIM operativos con pruebas negativas; políticas de retención aplicadas y auditadas |

## Reglas de cierre

El esfuerzo es esfuerzo por paquete, no duración de calendario y no acumulable sin modelar solapamientos. Antes de mover un paquete a `ready`, añadir en su ficha `TASK` límites de API, criterios concretos, fixtures, responsable, roles de revisión, dependencias bloqueantes y permisos. Antes de `accepted`, anexar EV con resultados ejecutados. Los gates exigen revisión humana y línea base de alcance.
