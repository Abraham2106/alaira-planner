# Índice y autoridad documental

**Versión documental:** 0.1.1 · **Estado:** concepción, no implementación.

Todos los documentos son borradores fundacionales salvo acuerdos expresos del mantenedor. **MVP, fechas, capacidad, presupuesto, licencias y stack no están aprobados.** Una planificación orientativa no es compromiso. Estado vigente del corte: [STATUS](governance/STATUS.md).

## Orden de autoridad

Instrucciones expresas del mantenedor > requisitos aprobados ([SRS](requirements/SRS.md)) y criterios de aceptación > ADRs `Accepted` > diseño vigente > órdenes del Planner > propuestas de agentes. Detalle en [AGENTS.md](../AGENTS.md). Ante contradicción entre documentos, prevalece el de mayor autoridad y la discrepancia se registra como RR.

## Rutas de lectura por rol

| Si eres… | Lee en este orden |
|---|---|
| Nuevo en el proyecto | [README](../README.md) → [Visión](product/VISION.md) → [PRD](product/PRD.md) → [STATUS](governance/STATUS.md) → [Preguntas abiertas](governance/OPEN_QUESTIONS.md) |
| Agente implementador | [AGENTS.md](../AGENTS.md) → [Modelo operativo](agents/OPERATING_MODEL.md) → [Playbook de worktrees](agents/WORKTREE_PLAYBOOK.md) → [DoR/DoD](quality/DEFINITION_OF_DONE.md) → ficha TASK asignada |
| Producto / requisitos | [SRS](requirements/SRS.md) → [Trazabilidad](requirements/TRACEABILITY.md) → [Control de cambios](requirements/CHANGE_CONTROL.md) → [Registros RR](requirements/records/) |
| Arquitectura / seguridad | [Arquitectura](architecture/ARCHITECTURE.md) → [Modelo de dominio](architecture/DOMAIN_MODEL.md) → [Seguridad y privacidad](architecture/SECURITY_PRIVACY.md) → [ADRs](architecture/adr/) |
| QA / revisor | [Estrategia de pruebas](quality/TEST_STRATEGY.md) → [Casos de aceptación](quality/ACCEPTANCE_SCENARIOS.md) → [DoR/DoD](quality/DEFINITION_OF_DONE.md) |
| Planner | [WBS](planning/WBS.md) → [Diccionario WBS](planning/WBS_DICTIONARY.md) → [Roadmap](planning/ROADMAP.md) → [Registro de agentes](agents/REGISTRY.md) → [Riesgos](governance/RISK_REGISTER.md) |

## Mapa completo

### Producto

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [VISION](product/VISION.md) | Problema, personas, principios, límites | Visión propuesta |
| [PRD](product/PRD.md) | Objetivos, experiencias núcleo, cortes M0–M5 | Requisito de producto propuesto |
| [UX_IA](product/UX_IA.md) | Principios UX, navegación, vistas y flujos a prototipar | Guía de diseño conceptual |
| [METRICS](product/METRICS.md) | Indicadores de producto, proyecto y operación | Catálogo de hipótesis |

### Requisitos

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [SRS](requirements/SRS.md) | 80 REQ y 20 NFR verificables | Línea base funcional propuesta |
| [TRACEABILITY](requirements/TRACEABILITY.md) | REQ → WBS → TC → evidencia | Control de cobertura |
| [CHANGE_CONTROL](requirements/CHANGE_CONTROL.md) | Cómo cambian alcance y requisitos | Proceso |
| [Plantilla RR](requirements/records/RR-0000-template.md) | Formato de solicitud/decisión de requisito | Plantilla |
| [RR-0001](requirements/records/RR-0001-inconsistencias-fases-prioridades.md) | Alineación de fases, significado de P0 y verificación de NFR | Aprobada |

### Planificación

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [WBS](planning/WBS.md) | Árbol de entregables y regla del 100% | Alcance |
| [WBS_DICTIONARY](planning/WBS_DICTIONARY.md) | 35 paquetes: contenido, dependencias, esfuerzo, aceptación | Planificación |
| [ROADMAP](planning/ROADMAP.md) | Fases, gates G0–G5 y camino crítico candidato | Ruta hipotética |
| [RELEASE_CHECKLIST](planning/RELEASE_CHECKLIST.md) | Gate de release y entrega OSS | Checklist propuesto |

### Arquitectura

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [ARCHITECTURE](architecture/ARCHITECTURE.md) | Arquitectura de referencia y módulos | Diseño candidato |
| [DOMAIN_MODEL](architecture/DOMAIN_MODEL.md) | Entidades, invariantes y eventos | Contratos conceptuales |
| [FINANCIAL_MODEL](architecture/FINANCIAL_MODEL.md) | Fórmulas EVM, ejemplo numérico y casos límite | Especificación preliminar |
| [INTEGRATIONS](architecture/INTEGRATIONS.md) | API, webhooks, bot Slack, idempotencia y sync | Diseño candidato |
| [SECURITY_PRIVACY](architecture/SECURITY_PRIVACY.md) | Amenazas, controles y política de datos | Riesgos y requisitos |

### Decisiones de arquitectura (ADR)

Solo los ADR en estado `Accepted` obligan; hoy todos están `Proposed`.

| ADR | Decisión | Estado |
|---|---|---|
| [0000](architecture/adr/0000-template.md) | Plantilla | — |
| [0001](architecture/adr/0001-evidence-is-not-progress.md) | Separar evidencia, solicitud y aceptación de avance | Proposed |
| [0002](architecture/adr/0002-planner-worktrees.md) | Planner central y worktree exclusivo por tarea | Proposed |
| [0003](architecture/adr/0003-modular-monolith-candidate.md) | Monolito modular como candidato inicial | Proposed |
| [0004](architecture/adr/0004-oss-license-pending.md) | Licencia OSS y modelo de contribución | Proposed / pendiente |
| [0005](architecture/adr/0005-agent-tools-policy-gate.md) | Herramientas de IA mediadas por políticas de dominio | Proposed |

### Agentes

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [AGENTS.md](../AGENTS.md) | Constitución operativa de agentes | Protocolo de equipo |
| [OPERATING_MODEL](agents/OPERATING_MODEL.md) | Topología, flujo intake → close, concurrencia | Protocolo de equipo |
| [ROLES](agents/ROLES.md) | Roles y separación de funciones | Protocolo de equipo |
| [REGISTRY](agents/REGISTRY.md) | Asignaciones, ramas y rutas reservadas (solo Planner) | Registro central |
| [WORKTREE_PLAYBOOK](agents/WORKTREE_PLAYBOOK.md) | Comandos de worktree, entrega y limpieza | Procedimiento |
| [TASK_TEMPLATE](agents/TASK_TEMPLATE.md) | Ficha de tarea | Plantilla |
| [Plantilla RUN](agents/runs/TEMPLATE.md) | Registro por ejecución de agente | Plantilla |

### Calidad

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [TEST_STRATEGY](quality/TEST_STRATEGY.md) | Capas de prueba, fixtures y severidades | Plan |
| [ACCEPTANCE_SCENARIOS](quality/ACCEPTANCE_SCENARIOS.md) | Casos Given/When/Then de referencia | Evidencia exigida |
| [DEFINITION_OF_DONE](quality/DEFINITION_OF_DONE.md) | DoR, DoD de tarea, paquete y release | Evidencia exigida |

### Gobernanza, investigación y ejemplos

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [STATUS](governance/STATUS.md) | Estado del corte actual | Gestión |
| [OPEN_QUESTIONS](governance/OPEN_QUESTIONS.md) | Decisiones abiertas OQ-01…12 | Gestión |
| [RISK_REGISTER](governance/RISK_REGISTER.md) | Riesgos R-01…15 | Gestión |
| [RACI](governance/RACI.md) | Responsabilidades por decisión | Gestión |
| [GLOSSARY](governance/GLOSSARY.md) | Términos y siglas | Referencia |
| [ECOSYSTEM_RESEARCH](research/ECOSYSTEM_RESEARCH.md) | Plan de benchmarking de competidores | Investigación, no verdad del producto |
| [NON_CODE_EVIDENCE](examples/NON_CODE_EVIDENCE.md) | Avance verificable fuera de GitHub | Ejemplo ilustrativo |
| [SLACK_BOT_FLOW](examples/SLACK_BOT_FLOW.md) | Conversación segura con el bot y ramas adversariales | Ejemplo ilustrativo |

Archivos de raíz: [CONTRIBUTING](../CONTRIBUTING.md), [SECURITY](../SECURITY.md). Automatización: [`scripts/validate_docs.py`](../scripts/validate_docs.py) y [`scripts/new-agent-worktree.sh`](../scripts/new-agent-worktree.sh).

## Convenciones de identificadores

| Prefijo | Significado | Dónde vive |
|---|---|---|
| `REQ-NNN` / `NFR-NNN` | Requisito funcional / atributo de calidad verificable | [SRS](requirements/SRS.md) |
| `RR-NNNN` | Solicitud o decisión de requisito | [records/](requirements/records/) |
| `ADR-NNNN` | Decisión técnica con alternativas | [adr/](architecture/adr/) |
| `WBS-X.Y` | Paquete de trabajo terminal | [WBS_DICTIONARY](planning/WBS_DICTIONARY.md) |
| `TASK-NNNN` | Asignación ejecutable de un agente | [REGISTRY](agents/REGISTRY.md) |
| `TC-ÁREA-NN` | Caso de prueba de aceptación | [ACCEPTANCE_SCENARIOS](quality/ACCEPTANCE_SCENARIOS.md) |
| `EV` (evidencia) | Evidencia de aceptación del trabajo de construcción; no confundir con el indicador financiero EV | [GLOSSARY](governance/GLOSSARY.md) |
| `OQ-NN` / `R-NN` | Pregunta abierta / riesgo | [governance/](governance/) |
| `P0–P2` | Prioridad del requisito (no es fase) | [SRS §1](requirements/SRS.md) |
| `M0–M5` / `G0–G5` | Fase de entrega / gate de salida de fase | [PRD](product/PRD.md), [ROADMAP](planning/ROADMAP.md) |

Un ADR nunca puede recortar un requisito aprobado sin una RR. Los IDs son estables y no se reciclan.
