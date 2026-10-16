# Índice y autoridad documental

**Versión documental:** 0.2.0 · **Estado:** G0 aprobado; construcción por iniciar.

Aprobado por el mantenedor ([RR-0002](requirements/records/RR-0002-baseline-m1-y-g0.md)):

- La definición de producto.
- La baseline M1.
- La licencia Apache-2.0.
- El stack y la tenancy, condicionados a TASK-0002.
- La secuencia de cortes.

**Fechas, capacidad y presupuesto no están comprometidos.** Estado vigente del corte: [STATUS](governance/STATUS.md).

## Orden de autoridad

Instrucciones expresas del mantenedor > requisitos aprobados ([SRS](requirements/SRS.md)) y criterios de aceptación > ADRs `Accepted` > diseño vigente > órdenes del Planner > propuestas de agentes. Detalle en [AGENTS.md](../AGENTS.md). Dentro del diseño vigente, el [PRODUCT_BRIEF](product/PRODUCT_BRIEF.md) prevalece sobre los demás documentos de producto. Ante contradicción entre documentos, prevalece el de mayor autoridad y la discrepancia se registra como RR.

## Rutas de lectura por rol

| Si eres… | Lee en este orden |
|---|---|
| Nuevo en el proyecto | [README](../README.md) → [Product brief](product/PRODUCT_BRIEF.md) → [Visión](product/VISION.md) → [PRD](product/PRD.md) → [STATUS](governance/STATUS.md) → [Preguntas abiertas](governance/OPEN_QUESTIONS.md) |
| Agente implementador | [AGENTS.md](../AGENTS.md) → [Modelo operativo](agents/OPERATING_MODEL.md) → [Playbook de worktrees](agents/WORKTREE_PLAYBOOK.md) → [DoR/DoD](quality/DEFINITION_OF_DONE.md) → ficha TASK asignada |
| Producto / requisitos | [SRS](requirements/SRS.md) → [Trazabilidad](requirements/TRACEABILITY.md) → [Control de cambios](requirements/CHANGE_CONTROL.md) → [Registros RR](requirements/records/) |
| Arquitectura / seguridad | [Arquitectura](architecture/ARCHITECTURE.md) → [Modelo de dominio](architecture/DOMAIN_MODEL.md) → [Seguridad y privacidad](architecture/SECURITY_PRIVACY.md) → [ADRs](architecture/adr/) |
| QA / revisor | [Estrategia de pruebas](quality/TEST_STRATEGY.md) → [Casos de aceptación](quality/ACCEPTANCE_SCENARIOS.md) → [DoR/DoD](quality/DEFINITION_OF_DONE.md) |
| Planner | [WBS](planning/WBS.md) → [Diccionario WBS](planning/WBS_DICTIONARY.md) → [Roadmap](planning/ROADMAP.md) → [Registro de agentes](agents/REGISTRY.md) → [Riesgos](governance/RISK_REGISTER.md) |

## Mapa completo

### Producto

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [PRODUCT_BRIEF](product/PRODUCT_BRIEF.md) | Definición del producto: tesis, mercado, modelo, IA, ficha técnica, construcción | Fuente de producto del mantenedor (aprobada, RR-0002) |
| [VISION](product/VISION.md) | Problema, personas, principios, límites | Visión aprobada |
| [PRD](product/PRD.md) | Objetivos, experiencias, *vertical slices* M0–M5 | Requisito de producto |
| [UX_IA](product/UX_IA.md) | Principios UX, navegación, vistas y flujos a prototipar | Guía de diseño conceptual |
| [METRICS](product/METRICS.md) | Indicadores de producto, proyecto y operación | Catálogo de hipótesis |

### Requisitos

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [SRS](requirements/SRS.md) | 103 REQ y 22 NFR verificables | Baseline M1 aprobada; resto propuesto |
| [TRACEABILITY](requirements/TRACEABILITY.md) | REQ → WBS → TC → evidencia | Control de cobertura |
| [CHANGE_CONTROL](requirements/CHANGE_CONTROL.md) | Cómo cambian alcance y requisitos | Proceso |
| [Plantilla RR](requirements/records/RR-0000-template.md) | Formato de solicitud/decisión de requisito | Plantilla |
| [RR-0001](requirements/records/RR-0001-inconsistencias-fases-prioridades.md) | Significado de P0 y verificación de NFR (fases sustituidas por RR-0002) | Aprobada |
| [RR-0002](requirements/records/RR-0002-baseline-m1-y-g0.md) | Adopción del brief, baseline M1, decisiones de G0 y política de avance | Aprobada |
| [RR-0003](requirements/records/RR-0003-m1-dev-sin-emulador-s3.md) | M1: Postgres local sin emulador S3 obligatorio (MinIO CE archivado) | Propuesta |

### Planificación

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [WBS](planning/WBS.md) | Árbol de entregables y regla del 100% | Alcance |
| [WBS_DICTIONARY](planning/WBS_DICTIONARY.md) | 41 paquetes: contenido, dependencias, esfuerzo, aceptación | Planificación |
| [ROADMAP](planning/ROADMAP.md) | *Vertical slices*, hitos M1a–M1d, gates G0–G5 y camino crítico | Secuencia aprobada, fechas no comprometidas |
| [RELEASE_CHECKLIST](planning/RELEASE_CHECKLIST.md) | Gate de release y entrega OSS | Checklist propuesto |

### Arquitectura

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [ARCHITECTURE](architecture/ARCHITECTURE.md) | Módulos, event backbone, AI runtime, frontera determinista | Diseño vigente |
| [DOMAIN_MODEL](architecture/DOMAIN_MODEL.md) | Project Graph, objetos clave, invariantes y eventos | Contratos conceptuales |
| [FINANCIAL_MODEL](architecture/FINANCIAL_MODEL.md) | Presupuesto, saldo gastable, EVM, ejemplo y casos límite | Especificación preliminar (M3) |
| [INTEGRATIONS](architecture/INTEGRATIONS.md) | Connector SDK, eventos normalizados, Slack, GitHub, Google, API | Diseño vigente |
| [SECURITY_PRIVACY](architecture/SECURITY_PRIVACY.md) | Amenazas, controles y política de datos | Riesgos y requisitos |

### Decisiones de arquitectura (ADR)

Solo los ADR en estado `Accepted` obligan. Los condicionados obligan desde ya y se sustituyen por otro ADR si TASK-0002 no los valida.

| ADR | Decisión | Estado |
|---|---|---|
| [0000](architecture/adr/0000-template.md) | Plantilla | — |
| [0001](architecture/adr/0001-evidence-is-not-progress.md) | Separar evidencia, solicitud y aceptación de avance | Accepted |
| [0002](architecture/adr/0002-planner-worktrees.md) | Planner central y worktree exclusivo por tarea | Accepted |
| [0003](architecture/adr/0003-modular-monolith-candidate.md) | Monolito modular con outbox | Accepted (condicionado a TASK-0002) |
| [0004](architecture/adr/0004-oss-license-pending.md) | Apache-2.0 + DCO; metodología nunca premium | Accepted |
| [0005](architecture/adr/0005-agent-tools-policy-gate.md) | IA transaccional mediada por políticas y motor determinista | Accepted (condicionado a TASK-0002 y evals) |
| [0006](architecture/adr/0006-stack-base.md) | Stack base: TypeScript, Fastify, React, PostgreSQL, pgvector | Accepted (condicionado a TASK-0002) |
| [0007](architecture/adr/0007-tenancy-y-autenticacion.md) | Tenancy con RLS, IDs, autenticación y autorización | Accepted (condicionado a TASK-0002) |
| [0008](architecture/adr/0008-local-s3-emulator-minio-ce-archived.md) | Emulador S3 local tras archivado de MinIO CE | Proposed |

### Agentes

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [AGENTS.md](../AGENTS.md) | Constitución operativa de agentes | Protocolo de equipo |
| [OPERATING_MODEL](agents/OPERATING_MODEL.md) | Topología, flujo intake → close, concurrencia | Protocolo de equipo |
| [ROLES](agents/ROLES.md) | Roles y separación de funciones | Protocolo de equipo |
| [REGISTRY](agents/REGISTRY.md) | Asignaciones, ramas y rutas reservadas (solo Planner) | Registro central |
| [WORKTREE_PLAYBOOK](agents/WORKTREE_PLAYBOOK.md) | Comandos de worktree, entrega y limpieza | Procedimiento |
| [TASK_TEMPLATE](agents/TASK_TEMPLATE.md) | Ficha de tarea | Plantilla |
| [TASK-0001](agents/tasks/TASK-0001-g0-alineacion-documental.md) | Resolución de G0 y alineación con el brief | Ficha (accepted) |
| [TASK-0002](agents/tasks/TASK-0002-bootstrap-monorepo-y-poc.md) | Bootstrap del monorepo y POC de ADRs condicionados | Ficha (in_progress) |
| [TASK-0003](agents/tasks/TASK-0003-discovery.md) | Discovery con usuarios en paralelo a M1 | Ficha (ready) |
| [TASK-0101](agents/tasks/TASK-0101-iam-identidad.md) | IAM: tenants, usuarios, invitaciones, sesiones | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0101.md) |
| [TASK-0102](agents/tasks/TASK-0102-motor-cpm.md) | Motor CPM puro | Ficha (in_progress) |
| [TASK-0103](agents/tasks/TASK-0103-web-shell.md) | Shell web, a11y y cliente API | Ficha (in_progress) |
| [TASK-0104](agents/tasks/TASK-0104-connector-sdk.md) | Connector SDK y conector falso | Ficha (in_progress) |
| [TASK-0105](agents/tasks/TASK-0105-testkit.md) | Testkit y fixtures sintéticos | Ficha (in_progress) |
| [TASK-0106](agents/tasks/TASK-0106-authz.md) | RBAC deny-by-default | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0106.md) |
| [TASK-0107](agents/tasks/TASK-0107-motor-capacidad.md) | Motor de capacidad puro | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0107.md) |
| [TASK-0108](agents/tasks/TASK-0108-ai-runtime-core.md) | AI runtime core | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0108.md) |
| [TASK-0109](agents/tasks/TASK-0109-event-log.md) | Event log, outbox e idempotencia | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0109.md) |
| [TASK-0110](agents/tasks/TASK-0110-project-graph.md) | Grafo de proyecto y delivery_profile | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0110.md) |
| [TASK-0111](agents/tasks/TASK-0111-wbs-entregables.md) | WBS, entregables e hitos | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0111.md) |
| [TASK-0112](agents/tasks/TASK-0112-api-io.md) | API v1, OpenAPI e import/export CSV | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0112.md) |
| [TASK-0113](agents/tasks/TASK-0113-programacion.md) | Programación persistida y CPM | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0113.md) |
| [TASK-0114](agents/tasks/TASK-0114-asignaciones.md) | Asignaciones y sobreasignación | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0114.md) |
| [TASK-0115](agents/tasks/TASK-0115-web-proyecto-wbs.md) | Web: proyecto y WBS | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0115.md) |
| [TASK-0116](agents/tasks/TASK-0116-baseline.md) | Baseline, forecast y real | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0116.md) |
| [TASK-0117](agents/tasks/TASK-0117-web-gantt.md) | Web Gantt accesible | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0117.md) |
| [TASK-0118](agents/tasks/TASK-0118-evidencia.md) | Evidencias y EvidenceEvent persistido | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0118.md) |
| [TASK-0119](agents/tasks/TASK-0119-connector-fabric.md) | Connector Fabric (webhooks, tokens, DLQ) | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0119.md) |
| [TASK-0120](agents/tasks/TASK-0120-github.md) | Conector GitHub → EvidenceEvent | Ficha (review) · [reporte](quality/reports/TASK-0120.md) |
| [TASK-0121](agents/tasks/TASK-0121-slack-intake.md) | Slack: verificación e intake seguro | Ficha (integrated_provisional) · [reporte](quality/reports/TASK-0121.md) |
| [Plantilla RUN](agents/runs/TEMPLATE.md) | Registro por ejecución de agente | Plantilla |
| [SWARM_MASTER_PROMPT](agents/prompts/SWARM_MASTER_PROMPT.md) | Prompt del Planner para construir M1 con un enjambre de agentes Composer | Procedimiento operativo |

### Calidad

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [TEST_STRATEGY](quality/TEST_STRATEGY.md) | Capas de prueba, fixtures y severidades | Plan |
| [ACCEPTANCE_SCENARIOS](quality/ACCEPTANCE_SCENARIOS.md) | Casos Given/When/Then de referencia | Evidencia exigida |
| [DEFINITION_OF_DONE](quality/DEFINITION_OF_DONE.md) | DoR, DoD de tarea, paquete y release | Evidencia exigida |
| [TASK-0002 report](quality/reports/TASK-0002.md) | Evidencia bootstrap/POC | Evidencia (provisional) |
| [TASK-0101 report](quality/reports/TASK-0101.md) | Evidencia IAM | Evidencia (provisional; auth humana) |
| [TASK-0102 report](quality/reports/TASK-0102.md) | Evidencia motor CPM | Evidencia (provisional) |
| [TASK-0103 report](quality/reports/TASK-0103.md) | Evidencia web shell | Evidencia (provisional) |
| [TASK-0104 report](quality/reports/TASK-0104.md) | Evidencia Connector SDK | Evidencia (provisional) |
| [TASK-0105 report](quality/reports/TASK-0105.md) | Evidencia testkit | Evidencia (provisional) |
| [TASK-0106 report](quality/reports/TASK-0106.md) | Evidencia RBAC deny-by-default | Evidencia (provisional; authz/RLS humana) |
| [TASK-0107 report](quality/reports/TASK-0107.md) | Evidencia motor de capacidad | Evidencia (provisional) |
| [TASK-0108 report](quality/reports/TASK-0108.md) | Evidencia AI runtime core | Evidencia (provisional; ADR-0005 humana) |
| [TASK-0109 report](quality/reports/TASK-0109.md) | Evidencia event log / outbox | Evidencia (provisional) |
| [TASK-0110 report](quality/reports/TASK-0110.md) | Evidencia grafo de proyecto | Evidencia (provisional) |
| [TASK-0111 report](quality/reports/TASK-0111.md) | Evidencia WBS y entregables | Evidencia (provisional) |
| [TASK-0112 report](quality/reports/TASK-0112.md) | Evidencia API v1 / OpenAPI | Evidencia (provisional; accepted humana) |
| [TASK-0113 report](quality/reports/TASK-0113.md) | Evidencia programación CPM | Evidencia (provisional) |
| [TASK-0114 report](quality/reports/TASK-0114.md) | Evidencia asignaciones M1 | Evidencia (provisional; RLS humana) |
| [TASK-0115 report](quality/reports/TASK-0115.md) | Evidencia web proyecto/WBS | Evidencia (provisional) |
| [TASK-0116 report](quality/reports/TASK-0116.md) | Evidencia baseline M1 | Evidencia (provisional; línea base humana) |
| [TASK-0117 report](quality/reports/TASK-0117.md) | Evidencia web Gantt M1b | Evidencia (provisional) |
| [TASK-0118 report](quality/reports/TASK-0118.md) | Evidencia evidencias M1c | Evidencia (provisional) |
| [TASK-0119 report](quality/reports/TASK-0119.md) | Evidencia connector fabric M1c | Evidencia (provisional) |
| [TASK-0120 report](quality/reports/TASK-0120.md) | Evidencia conector GitHub M1c | Evidencia (review; revisor pendiente) |
| [TASK-0121 report](quality/reports/TASK-0121.md) | Evidencia Slack intake M1c | Evidencia (provisional) |

### Gobernanza, investigación y ejemplos

| Documento | Para qué sirve | Autoridad |
|---|---|---|
| [STATUS](governance/STATUS.md) | Estado del corte actual | Gestión |
| [OPEN_QUESTIONS](governance/OPEN_QUESTIONS.md) | Decisiones abiertas OQ-01…12 | Gestión |
| [RISK_REGISTER](governance/RISK_REGISTER.md) | Riesgos R-01…18 | Gestión |
| [RACI](governance/RACI.md) | Responsabilidades por decisión | Gestión |
| [GLOSSARY](governance/GLOSSARY.md) | Términos y siglas | Referencia |
| [ECOSYSTEM_RESEARCH](research/ECOSYSTEM_RESEARCH.md) | Plan de benchmarking de competidores | Investigación, no verdad del producto |
| [NON_CODE_EVIDENCE](examples/NON_CODE_EVIDENCE.md) | Avance verificable fuera de GitHub | Ejemplo ilustrativo |
| [SLACK_BOT_FLOW](examples/SLACK_BOT_FLOW.md) | Conversación segura con el bot y ramas adversariales | Ejemplo ilustrativo |

Archivos de raíz: [LICENSE](../LICENSE), [NOTICE](../NOTICE), [CONTRIBUTING](../CONTRIBUTING.md), [SECURITY](../SECURITY.md). Automatización: [`scripts/validate_docs.py`](../scripts/validate_docs.py) y [`scripts/new-agent-worktree.sh`](../scripts/new-agent-worktree.sh).

## Convenciones de identificadores

| Prefijo | Significado | Dónde vive |
|---|---|---|
| `REQ-NNN` / `NFR-NNN` | Requisito funcional / atributo de calidad verificable | [SRS](requirements/SRS.md) |
| `RR-NNNN` | Solicitud o decisión de requisito | [records/](requirements/records/) |
| `ADR-NNNN` | Decisión técnica con alternativas | [adr/](architecture/adr/) |
| `WBS-X.Y` | Paquete de trabajo terminal | [WBS_DICTIONARY](planning/WBS_DICTIONARY.md) |
| `TASK-NNNN` | Asignación ejecutable de un agente | [REGISTRY](agents/REGISTRY.md) y [tasks/](agents/tasks/) |
| `TC-ÁREA-NN` | Caso de prueba de aceptación | [ACCEPTANCE_SCENARIOS](quality/ACCEPTANCE_SCENARIOS.md) |
| `EV` (evidencia) | Evidencia de aceptación del trabajo de construcción; no confundir con el indicador financiero EV | [GLOSSARY](governance/GLOSSARY.md) |
| `OQ-NN` / `R-NN` | Pregunta abierta / riesgo | [governance/](governance/) |
| `P0–P2` | Prioridad del requisito (no es fase) | [SRS §1](requirements/SRS.md) |
| `M0–M5` / `G0–G5` | Definición y *vertical slices* / gate de salida de cada corte | [PRD](product/PRD.md), [ROADMAP](planning/ROADMAP.md) |

Un ADR nunca puede recortar un requisito aprobado sin una RR. Los IDs son estables y no se reciclan.
