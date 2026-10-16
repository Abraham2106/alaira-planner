# ADR-0006 — Stack base de construcción

- **Estado:** Accepted (condicionado a la validación de TASK-0002)
- **Fecha:** 2026-10-15
- **Autores:** agente revisor bajo autoridad del mantenedor
- **Relacionados:** OQ-02, OQ-03, [ADR-0003](0003-modular-monolith-candidate.md), [ADR-0004](0004-oss-license-pending.md), [ADR-0007](0007-tenancy-y-autenticacion.md), WBS-1.3, WBS-1.4, NFR-001, NFR-008, NFR-012, NFR-015

## Contexto y fuerzas

El gate G0 exige una decisión de stack para iniciar M1. Fuerzas: monolito modular con outbox (ADR-0003); autoalojamiento OSS sin proveedor único; consistencia transaccional para aceptación, baseline y costos; desarrollo por varios agentes en paralelo con revisión; licencias compatibles con Apache-2.0; equipo pequeño sin especialistas por lenguaje.

## Alternativas

| Alternativa | Beneficios | Costos/riesgos | Criterio de descarte |
|---|---|---|---|
| **TypeScript full-stack + PostgreSQL** | un lenguaje para dominio, API, worker y web; tipos de contrato compartidos; ecosistema amplio y bien conocido por agentes | disciplina necesaria para mantener el dominio libre de framework | elegida |
| Python (Django) + SPA | ORM y admin maduros, buen cálculo numérico | dos lenguajes; tipado más débil en contratos | dos lenguajes para un equipo pequeño |
| Go + SPA | binario único, rendimiento, despliegue simple | iteración de dominio más lenta, dos lenguajes | velocidad de modelado del dominio |
| JVM (Kotlin/Spring) | robustez empresarial | consumo y complejidad para autoalojamiento pequeño | peso operativo |

## Decisión

| Capa | Decisión |
|---|---|
| Lenguaje | TypeScript en modo `strict` en todo el código |
| Runtime | Node.js en versión LTS activa, fijada en `.nvmrc` y en las imágenes |
| Repositorio | monorepo con pnpm workspaces: `apps/api`, `apps/worker`, `apps/web`, `packages/domain`, `packages/engine` (programación y finanzas deterministas), `packages/connectors` (Connector SDK y adaptadores), `packages/ai`, `packages/contracts` |
| Dominio | `packages/domain` sin dependencias de framework, HTTP ni base de datos (arquitectura hexagonal); un módulo por bounded context de [DOMAIN_MODEL](../DOMAIN_MODEL.md) |
| API | Fastify; REST con esquemas de petición/respuesta como fuente de un contrato OpenAPI publicado bajo `/api/v1` (NFR-017), webhooks entrantes por conector; GraphQL y suscripciones salientes a eventos se evalúan en M4 sobre el mismo dominio |
| Base de datos | PostgreSQL (versión soportada más reciente), fuente transaccional única del grafo de proyecto con tablas de aristas (`work_node`, `dependency_edge`, `hierarchy_edge`, `artifact_link`, `goal_link`); sin base de datos de grafos |
| Búsqueda y recuperación | full-text de PostgreSQL e índice vectorial con la extensión `pgvector` (licencia PostgreSQL), filtrado por tenant y permisos antes de recuperar; un motor de búsqueda dedicado solo si la medición lo exige |
| Auditoría | tabla append-only de eventos de dominio y de conectores, base del Project Event Log |
| Modelos de IA | capa de proveedor agnóstica en `packages/ai`; M1 implementa un adaptador para APIs compatibles con OpenAI, configurable por despliegue (servicio comercial o modelo autoalojado); ningún proveedor es obligatorio para desplegar la edición OSS |
| Migraciones | SQL versionado con `up` y `down` o plan de restauración explícito (NFR-012) |
| Outbox y trabajos | tabla outbox en PostgreSQL más proceso `worker`; sin broker externo en M1 |
| Evidencias | almacenamiento de objetos con API compatible S3; cualquier proveedor o servidor compatible |
| Web | React con Vite como SPA que consume la misma API v1 pública que bots e integraciones; sin API privada para la UI |
| Pruebas | Vitest (unidad e integración), fast-check (propiedades de invariantes), Playwright (E2E y accesibilidad) |
| Empaquetado | imágenes de contenedor y Docker Compose como despliegue local y de referencia autoalojado; nube gestionada por Alaira es opcional y posterior (OQ-03) |
| CI | GitHub Actions: lint, typecheck, pruebas, auditoría de licencias y de vulnerabilidades de dependencias, validación de docs |

Las librerías concretas de ORM o query builder, cola sobre PostgreSQL, validación de esquemas, componentes de UI y emulador S3 local se eligen en la TASK que las introduce, con revisión de licencia (ADR-0004) y de mantenimiento, sin necesidad de un nuevo ADR salvo que alteren esta tabla.

## Consecuencias y reversibilidad

Se puede iniciar M1. Un solo lenguaje reduce el coste de revisión cruzada entre agentes. El dominio aislado permite cambiar Fastify o la capa de persistencia sin reescribir reglas. Cambiar de base de datos sería costoso; se acepta porque PostgreSQL cubre transacciones, RLS (ADR-0007), JSONB y búsqueda inicial con licencia permisiva. Un almacén analítico separado (WBS-6.4) y un broker de eventos dedicado solo se introducen por ADR cuando la medición de NFR-001/NFR-022 lo justifique.

## Validación

TASK-0002 debe demostrar, con resultados registrados: `docker compose up` levanta API, worker, web, PostgreSQL y almacenamiento S3 local; una migración aplica y revierte; una prueba de aislamiento A/B pasa con RLS activo (ADR-0007); un comando de aceptación invocado dos veces produce un único evento en outbox; CI en verde; auditoría de licencias sin dependencias incompatibles. Si algún criterio no se puede cumplir, se abre un ADR que sustituye a este.

## Historial

- 2026-10-15: aceptado por el mantenedor, condicionado a TASK-0002 ([RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md)).
