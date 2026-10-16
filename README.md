# Alaira Planner

> **Estado:** G0 aprobado, construcción por iniciar · **Versión documental:** 0.2.0 · 2026-10-15 · **Licencia:** [Apache-2.0](LICENSE). Este repositorio contiene especificaciones y planes; todavía no hay capacidades de producto implementadas.

**Alaira Planner** es un *Project Control Plane* con IA nativa, metodológicamente adaptable y orientado a evidencia. Planifica, ejecuta, observa y controla proyectos sobre un único modelo de alcance, cronograma, trabajo, personas, costos y evidencia. El mismo proyecto se dirige de forma predictiva, ágil o híbrida, y su estado se actualiza a partir de lo que realmente pasa en Slack, GitHub y Google Workspace.

La evidencia no es progreso: un PR mergeado o un documento aprobado se convierte en una propuesta de avance evaluada contra los criterios de aceptación. Las personas la confirman, el motor determinista calcula las consecuencias y todo queda en un registro de eventos auditable. La definición completa está en el [PRODUCT_BRIEF](docs/product/PRODUCT_BRIEF.md).

## Estado actual

| Elemento | Situación |
|---|---|
| Requisitos | 103 REQ y 22 NFR; baseline M1 aprobada (58 REQ y 17 NFR) por [RR-0002](docs/requirements/records/RR-0002-baseline-m1-y-g0.md) |
| Plan | 41 paquetes WBS en cinco *vertical slices*; ninguno aceptado |
| Decisiones técnicas | stack TypeScript + PostgreSQL, tenancy con RLS e IA gobernada aceptados con la condición de que TASK-0002 los valide |
| Pruebas | cada REQ y NFR tiene un caso asignado; ninguno ejecutado (`not_run`) |
| Próximo paso | TASK-0002 (bootstrap del monorepo y POC) y TASK-0003 (discovery), hacia el gate G1 |

Detalle en [STATUS](docs/governance/STATUS.md) y [preguntas abiertas](docs/governance/OPEN_QUESTIONS.md).

## Comenzar

- [Índice documental](docs/INDEX.md): mapa completo, orden de autoridad y rutas de lectura por rol.
- Producto: [brief](docs/product/PRODUCT_BRIEF.md), [visión](docs/product/VISION.md), [PRD](docs/product/PRD.md), [UX](docs/product/UX_IA.md) y [métricas](docs/product/METRICS.md).
- Requisitos: [SRS](docs/requirements/SRS.md), [trazabilidad](docs/requirements/TRACEABILITY.md) y [control de cambios](docs/requirements/CHANGE_CONTROL.md).
- Planificación: [EDT/WBS](docs/planning/WBS.md), [diccionario de trabajo](docs/planning/WBS_DICTIONARY.md) y [roadmap](docs/planning/ROADMAP.md).
- Arquitectura: [referencia](docs/architecture/ARCHITECTURE.md), [dominio](docs/architecture/DOMAIN_MODEL.md), [seguridad](docs/architecture/SECURITY_PRIVACY.md) y [ADRs](docs/architecture/adr/).
- Agentes: [protocolo](AGENTS.md), [modelo operativo](docs/agents/OPERATING_MODEL.md) y [registro](docs/agents/REGISTRY.md).
- Calidad: [estrategia de pruebas](docs/quality/TEST_STRATEGY.md) y [Definition of Done](docs/quality/DEFINITION_OF_DONE.md).

## Principios innegociables

1. El responsable humano aprueba compromisos, cambios de baseline y acciones de alto impacto.
2. Evidencia ≠ progreso aceptado: la aceptación es un evento explícito, autorizado y reversible bajo control.
3. Baseline ≠ forecast ≠ real.
4. Cada proyecto, y cada rama, puede ser predictivo, ágil o híbrido sobre el mismo grafo de trabajo.
5. El motor determinista es la autoridad sobre fechas, costos y estados; la IA propone y actúa solo con herramientas tipadas, permisos mínimos y la política de autonomía.
6. La metodología nunca es premium; APIs, exportación, seguridad multi-tenant y accesibilidad son criterios de diseño.

## Validar la documentación

Requiere Python 3.9+ y no tiene dependencias externas. Es la misma comprobación que ejecuta la CI en cada PR:

```bash
python scripts/validate_docs.py
```

Verifica enlaces locales, que el índice cubra todos los documentos, que los catálogos REQ y NFR del SRS sean contiguos y que los paquetes del árbol WBS coincidan con los del diccionario. Es una validación estructural: no equivale a aceptación ni a ejecución de casos de prueba.

## Contribuir y seguridad

Lee [CONTRIBUTING](CONTRIBUTING.md) antes de proponer cambios; cada commit lleva la firma DCO (`git commit -s`). Para reportar vulnerabilidades, sigue [SECURITY](SECURITY.md) y no las publiques en issues.

## Licencia

Alaira Planner se distribuye bajo la [Licencia Apache 2.0](LICENSE); consulta también [NOTICE](NOTICE). La licencia no concede derechos sobre la marca «Alaira» ([ADR-0004](docs/architecture/adr/0004-oss-license-pending.md)).
