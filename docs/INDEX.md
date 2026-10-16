# Índice y autoridad documental

**Versión:** 0.1.0 · **Estado:** concepción, no implementación.

| Ruta | Para qué sirve | Autoridad |
|---|---|---|
| `product/VISION.md` | Problema, personas, principios, límites | Visión propuesta |
| `product/PRD.md` | Objetivos del producto, experiencias, releases | Requisito producto propuesto |
| `requirements/SRS.md` | Requisitos verificables y atributos de calidad | Línea base funcional propuesta |
| `requirements/TRACEABILITY.md` | REQ → WBS → test → evidencia | Control de cobertura |
| `requirements/CHANGE_CONTROL.md` | Cómo cambia alcance y requisito | Proceso |
| `planning/WBS.md` | Árbol de entregables | Alcance |
| `planning/WBS_DICTIONARY.md` | Paquetes, criterios, dependencias | Planificación |
| `planning/ROADMAP.md` | Fases, gates, hitos y precedencias | Ruta hipotética |
| `architecture/ARCHITECTURE.md` | Arquitectura de referencia | Diseño candidato |
| `architecture/DOMAIN_MODEL.md` | Entidades, reglas e invariantes | Contratos conceptuales |
| `architecture/INTEGRATIONS.md` | APIs, webhooks, bot y sync | Diseño candidato |
| `architecture/SECURITY_PRIVACY.md` | Controles y privacidad | Riesgos y requisitos |
| `architecture/adr/` | Decisiones con alternativas y estados | Solo aceptados obligan |
| `agents/` y `../AGENTS.md` | Planificador, agentes y worktrees | Protocolo de equipo |
| `quality/` | Pruebas, DoD y aceptación | Evidencia exigida |
| `research/` | Mercado y verificación de competidores | Investigación, no verdad del producto |
| `governance/` | Riesgos, incógnitas, glosario | Gestión |

## Semántica

`REQ` identifica obligación verificable; `RR`, solicitud o decisión de requisito; `ADR`, decisión técnica; `WBS`, entregable/paquete; `TC`, prueba de aceptación; `EV`, evidencia. La relación entre ellos se conserva en la trazabilidad. Un ADR nunca puede recortar un requisito aprobado sin una RR.

Todos los documentos son borradores fundacionales salvo acuerdos expresos del mantenedor. **MVP, fechas, capacidad, presupuesto, licencias y stack no están aprobados.** Una planificación orientativa no es compromiso.
