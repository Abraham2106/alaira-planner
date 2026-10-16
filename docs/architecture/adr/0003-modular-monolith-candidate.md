# ADR-0003 — Arquitectura inicial, opción monolito modular

- **Estado:** Proposed
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

## Decisión propuesta

Prototipar monolito modular con arquitectura hexagonal donde convenga, almacén transaccional y adaptadores asíncronos, midiendo rendimiento, costos y experiencia self-hosted. **No aceptar aún** una elección de runtime, DB, hosting ni bus.

## Validación de aceptación ADR

POC de aislamiento multi-tenant, aceptación idempotente, evidencia ajena a GitHub y reintentos con outbox; medir complejidad, latencia y costo operativo. Estado pasa a Accepted sólo si mantenedor aprueba resultados y alternativas.
