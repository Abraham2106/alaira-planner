# ADR-0003 — Arquitectura inicial, opción monolito modular

- **Estado:** Accepted (condicionado a la validación de TASK-0002; aceptado por el mantenedor el 2026-10-15, [RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md))
- **Fecha:** 2026-10-15
- **Relacionados:** NFR-001, NFR-008, WBS-1.3, ARCHITECTURE.md

## Contexto

El proyecto no tiene equipo, requisitos de escala medidos ni stack elegido. Requiere reglas transaccionales coherentes, desarrollo OSS reproducible y módulos aislables.

## Alternativas

| Opción | Ventaja | Riesgo |
|---|---|---|
| monolito modular + cola/outbox | despliegue simple, consistencia y facilidad DX | disciplina de límites internos |
| microservicios desde el día uno | despliegues por dominio independientes | complejidad operativa y transacciones distribuidas |
| backend serverless específico | elasticidad y arranque rápido | lock-in y debugging/reproductibilidad de self-hosting |

## Decisión

Monolito modular con arquitectura hexagonal en el dominio, almacén transaccional único y adaptadores asíncronos vía outbox. Runtime, base de datos, empaquetado y hosting se concretan en [ADR-0006](0006-stack-base.md); tenancy y autenticación en [ADR-0007](0007-tenancy-y-autenticacion.md).

## Validación de aceptación ADR

TASK-0002 ejecuta el POC de aislamiento multi-tenant, aceptación idempotente y reintentos con outbox, y registra complejidad y latencia. Si el POC no cumple, este ADR se sustituye por uno nuevo; la aceptación condicionada permite empezar M1 sin esperar al POC para el resto de decisiones.
