# Diccionario EDT — Paquetes de trabajo

**Versión:** 0.1 · **Unidades de esfuerzo:** intervalos de **jornadas-persona ideales de referencia** (JPI); no cronograma ni costo comprometido. Un día ideal presupone 6 h de trabajo enfocado de especialista con acceso a requisitos, entorno, revisión y herramientas. Excluye esperas externas y retrabajo por cambios. **Sin equipo contratado, presupuesto ni stack elegido: los rangos son hipótesis a reestimar tras M0.** Todos los criterios exigen evidencia de prueba y aprobación del revisor; estados iniciales `proposed`.

## 1. Fundación

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-1.1 | Informe de discovery con 8–12 entrevistas y 3 flujos de usuario; no construir todavía | visión; ninguno | Product Research; 8–15 JPI | necesidades priorizadas, notas anonimizadas, hipótesis aceptadas/rechazadas |
| WBS-1.2 | SRS/PRD revisados, definiciones y baseline de M1; no prometer todo el catálogo | 1.1, visión, RTM | Product/Planner; 6–12 JPI | 100% REQ P0 de M1 con TC, aprobación explícita de baseline |
| WBS-1.3 | ADRs comparados con POC de stack, tenancy, eventos y despliegue; no despliegue comercial | 1.2, riesgos | Arquitectura; 10–18 JPI | alternativas, pruebas y decisiones aprobadas registradas |
| WBS-1.4 | Automatización reproducible de agentes/worktrees, plantillas y CI básica; no auto-merge | AGENTS.md, 1.3 parcial | DX/Planner; 7–14 JPI | 2 tareas aisladas y revisadas sin sobrescrituras, CI registra evidencia |
| WBS-1.5 | Licencia OSS, guía de contribución, copyright, SBOM y política de comunidad; no se presupone licencia | 1.1, legal | Mantenedor/Legal; 4–10 JPI | LICENSE aprobado, derechos verificados, contribución publicada |

## 2. Núcleo

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-2.1 | Registro de tenant, identidad, invitaciones, sesiones; no SSO enterprise en primer corte | 1.3; REQ-001,002,004 | Backend IAM; 12–22 JPI | crear/desactivar usuario, sesiones expiran, auditoría trazada |
| WBS-2.2 | Políticas RBAC/ABAC, enforcement servidor y aislamiento; no solo roles visuales | 2.1; REQ-003 | Security/Backend; 10–18 JPI | pruebas negativas por endpoint/objeto y RAG sin fuga de tenant |
| WBS-2.3 | Entidades organización/proyecto/equipo, método y ownership; jerarquía portfolio gradual | 2.1–2.2 | Domain Backend; 12–22 JPI | proyecto creado y leído bajo permiso; método cambia vista sin duplicar ID |
| WBS-2.4 | AuditEvent, idempotencia, outbox y persistencia inicial; no stream distribuido forzoso | 1.3, 2.2 | Platform; 12–24 JPI | replay no duplica operaciones; actor/causalidad registrados |
| WBS-2.5 | API v1, búsqueda filtrada, import/export inicial y docs; no conectores completos | 2.2–2.4 | API/DX; 12–20 JPI | OpenAPI/contratos, paginación, autorización y roundtrip de muestra |
| WBS-2.6 | Navegación web, formulario proyecto, tareas/evidencias y a11y inicial; no mega-dashboard | 2.3, 3.4–3.5 parciales | UX/Frontend; 14–24 JPI | flujos primarios teclado/lector, errores claros y diseño responsivo |

## 3. Planificación y aceptación

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-3.1 | Árbol WBS, paquete, entregable, hito y criterios; no CPM en este paquete | 2.3 | Domain/Frontend; 12–22 JPI | árbol sin ciclos, hijos únicos, criterios editables con versionado |
| WBS-3.2 | Calendarios, FS/SS/FF/SF, lag/lead, motor programador y pruebas de casos límite | 3.1, 1.3 | Scheduling; 18–36 JPI | casos con feriados y ciclos detectados, fechas CPM reproducibles |
| WBS-3.3 | Gantt, baseline inmutable, análisis desviación y solicitudes CR; no autocambio | 3.2, 2.4 | Scheduling/UX; 15–30 JPI | comparación de baselines y aprobación registrada sin mutación histórica |
| WBS-3.4 | Evidencias desde archivos/enlaces/constancias, versiones, permisos, procedencia | 2.2–2.4, 3.1 | Evidence Backend; 15–25 JPI | documento no Git aceptable como evidencia, archivo no accesible por otro tenant |
| WBS-3.5 | Solicitud, revisión, rechazo, compensación y rollup de avance; sin inferencia por actividad | 3.1, 3.4, 2.4 | Domain/QA; 16–30 JPI | aceptar/revertir con políticas y duplicados sin doble progreso |
| WBS-3.6 | Disponibilidad, competencias, carga y timesheets con aprobaciones | 2.3, 3.1, 3.2 | Scheduling/Resource; 12–24 JPI | sobreasignación señalada, horas no cambian acceptance |

## 4. Agilidad e híbrido

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-4.1 | Backlog, épica/historia, sprint y prioridad; no framework completo a escala | 2.3, 3.1 | Agile Domain/UX; 12–22 JPI | historias enlazadas a entregable y sprint con transición auditable |
| WBS-4.2 | Kanban/WIP y throughput, cycle/lead, velocidad y burnup; definiciones visibles | 4.1, 2.4 | Agile/Analytics; 12–22 JPI | fixtures calculan métricas y límites WIP sin falsos positivos |
| WBS-4.3 | Mapeo backlog-fase/paquete, releases, RAID, dashboards multi-nivel | 3.5, 4.2, 2.5 | Hybrid/Analytics; 14–26 JPI | un ítem mapeado a 2 vistas no duplica progreso, permisos respetados |

## 5. Integraciones

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-5.1 | Slack: verificar origen, mapear actor, desambiguar, solicitar confirmación, responder y log | 2.2, 2.4, 3.5 | Integrations; 14–26 JPI | comandos ambiguos/duplicados/denegados son seguros; sin aceptación encubierta |
| WBS-5.2 | Conector genérico OAuth/webhook/polling, retries, sync state; integrar 1 fuente elegida | 2.4, 2.5 | Integrations; 15–28 JPI | duplicado/reorden/revocación de credencial medidos y recuperables |
| WBS-5.3 | Notificaciones de cambios/bloqueos, preferencias y anti-spam | 5.1 o 5.2, 4.3 | Notifications; 7–14 JPI | opt-in, desduplicación y ventanas sin spam |

## 6. Control financiero

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-6.1 | Presupuesto, líneas, AC, tarifas, costos y segregación aprobaciones; no ERP | 2.2, 2.4, 3.1 | Finance Domain; 16–32 JPI | origen/reconocimiento y autorizaciones de costo trazables |
| WBS-6.2 | PV/EV/AC, CPI/SPI con cut-off/baseline y reportes | 6.1, 3.3, 3.5 | Finance/QA; 14–26 JPI | fórmulas reproducibles con cero/actualizaciones y fuente visible |
| WBS-6.3 | EAC/ETC/VAC, reservas, multimoneda y escenarios de forecast | 6.2 | Finance/Analytics; 14–28 JPI | escenarios separados de aprobaciones con supuestos y sensibilidad |

## 7. IA gobernada

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-7.1 | Índice RAG permission-aware, fuentes, permisos y caducidad | 2.2, 3.4, 2.5 | AI/Backend; 13–25 JPI | actor restringido no recupera citas de otro tenant |
| WBS-7.2 | Herramientas tipadas, explicaciones, dry-run y políticas de confirmación | 7.1, 3.5, 5.1 | AI/Integrations; 14–28 JPI | herramienta no supera permisos; replay y confirmación protegidos |
| WBS-7.3 | Conjunto de evaluación adversarial, costos, latencia y observabilidad | 7.1–7.2 | AI Safety/QA; 10–22 JPI | eval reproducible para alucinación, prompt injection y acciones no autorizadas |

## 8. Aseguramiento, adopción y release

| Paquete | Entregable, contenido y exclusiones | Entradas; dependencias | Responsable; esfuerzo | Criterio observable de aceptación |
|---|---|---|---|---|
| WBS-8.1 | Test pyramid, fixtures, contrato, integración, E2E, CI y reporte QA | 1.4; transversal | QA/Platform; 14–28 JPI | pruebas críticas reproducibles y bloqueo en CI tras fallos |
| WBS-8.2 | Modelo de amenazas, privacidad, gestión de incidentes y auditoría de licencias | 1.3; transversal | Security/Legal; 12–24 JPI | mitigaciones P0 verificadas, plan de divulgación disponible |
| WBS-8.3 | A11y, perfiles de carga, observabilidad, restauración, SLO candidatos | 2.x, 8.1; transversal | SRE/UX; 14–26 JPI | flujos críticos WCAG objetivo, backups restaurados, latencia medida |
| WBS-8.4 | Manual de usuario, guías OSS, DX, instalación de referencia y exportabilidad | 1.5, 2.5, 8.1 | Docs/DX; 10–20 JPI | tercero instala desde guía sin información privada y exporta datos |
| WBS-8.5 | Piloto controlado, métricas, entrevistas y hallazgos verificados | 3.5, 8.2, 8.3, funcionalidades del corte | Research/PM; 12–24 JPI | usuarios completan flujos con consentimiento; errores y aprendizajes registrados |
| WBS-8.6 | Release checklist, aceptación final, etiquetado, changelog y rollback | 8.1–8.5, 1.5 | Planner/Mantenedor; 6–14 JPI | sign-off, licencia y licencia dependencias, severidades bloqueantes cero |

## Reglas de cierre

El esfuerzo es esfuerzo por paquete, no duración de calendario y no acumulable sin modelar solapamientos. Antes de mover un paquete a `ready`, añadir en su ficha `TASK` límites de API, criterios concretos, fixtures, responsable, roles de revisión, dependencias bloqueantes y permisos. Antes de `accepted`, anexar EV con resultados ejecutados. Los gates exigen revisión humana y línea base de alcance.
