# Alaira Planner

> **Estado:** concepción de producto OSS · **Versión documental:** 0.1.1 · 2026-10-15. No existe aún implementación funcional; este repositorio contiene especificaciones y planes, no capacidades de producto implementadas.

**Alaira Planner** es una iniciativa de Alaira para crear una plataforma abierta de gestión integral de proyectos, programas y portafolios. Combina planificación predictiva, ejecución ágil e híbrida, control de entregables y costos, integración con herramientas cotidianas e IA asistiva y auditable.

El avance se basa en criterios de aceptación y evidencias de entregables: archivos, aprobaciones, trabajo de campo, documentos, integraciones o repositorios de código. Ningún repositorio, incluido GitHub, constituye la única fuente de avance.

## Estado actual

| Elemento | Situación |
|---|---|
| Requisitos | 80 REQ y 20 NFR propuestos; baseline no aprobada |
| Plan | 35 paquetes WBS propuestos; ninguno aceptado |
| Decisiones técnicas | ADR-0001 a 0005 en `Proposed`; stack, hosting y licencia sin decidir |
| Pruebas | cada REQ y NFR tiene un caso asignado; ninguno ejecutado (`not_run`) |
| Próximo gate | G0: discovery, licencia, priorización P0 de M1 y aprobación humana de baseline |

Detalle en [STATUS](docs/governance/STATUS.md) y [preguntas abiertas](docs/governance/OPEN_QUESTIONS.md).

## Comenzar

- [Índice documental](docs/INDEX.md): mapa completo, orden de autoridad y rutas de lectura por rol.
- Producto: [visión](docs/product/VISION.md), [PRD](docs/product/PRD.md), [UX](docs/product/UX_IA.md) y [métricas](docs/product/METRICS.md).
- Requisitos: [SRS](docs/requirements/SRS.md), [trazabilidad](docs/requirements/TRACEABILITY.md) y [control de cambios](docs/requirements/CHANGE_CONTROL.md).
- Planificación: [EDT/WBS](docs/planning/WBS.md), [diccionario de trabajo](docs/planning/WBS_DICTIONARY.md) y [roadmap](docs/planning/ROADMAP.md).
- Arquitectura: [referencia](docs/architecture/ARCHITECTURE.md), [dominio](docs/architecture/DOMAIN_MODEL.md), [seguridad](docs/architecture/SECURITY_PRIVACY.md) y [ADRs](docs/architecture/adr/).
- Agentes: [protocolo](AGENTS.md), [modelo operativo](docs/agents/OPERATING_MODEL.md) y [registro](docs/agents/REGISTRY.md).
- Calidad: [estrategia de pruebas](docs/quality/TEST_STRATEGY.md) y [Definition of Done](docs/quality/DEFINITION_OF_DONE.md).

## Principios innegociables

1. El responsable humano aprueba compromisos, cambios de línea base y acciones de alto impacto.
2. Evidencia ≠ progreso aceptado: la aceptación es un evento explícito, autorizado y reversible bajo control.
3. Cada proyecto puede adoptar modo predictivo, ágil o híbrido dentro de un dominio coherente.
4. La IA propone y ejecuta solo con los permisos mínimos y controles aplicables.
5. Las APIs, exportación, seguridad multi-tenant y accesibilidad son criterios de diseño.

## Validar la documentación

Requiere Python 3.9+ y no tiene dependencias externas. Es la misma comprobación que ejecuta la CI en cada PR:

```bash
python scripts/validate_docs.py
```

Verifica enlaces locales, que el índice cubra todos los documentos y que estén presentes los catálogos de 80 REQ, 20 NFR y 35 paquetes WBS. Es una validación estructural: no equivale a aceptación ni a ejecución de casos de prueba.

## Contribuir y seguridad

Lee [CONTRIBUTING](CONTRIBUTING.md) antes de proponer cambios. Para reportar vulnerabilidades, sigue [SECURITY](SECURITY.md) y no las publiques en issues.

## Condiciones OSS

La intención open source es un requisito de concepción, pero **no se ha elegido una licencia**. Hasta publicar un archivo LICENSE válido, la visibilidad pública del código **no concede automáticamente derechos de reutilización**. Véase [ADR-0004](docs/architecture/adr/0004-oss-license-pending.md).
