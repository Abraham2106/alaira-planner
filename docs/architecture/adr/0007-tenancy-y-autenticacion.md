# ADR-0007 — Tenancy, identificadores, autenticación y autorización de M1

- **Estado:** Accepted (condicionado a la validación de TASK-0002)
- **Fecha:** 2026-10-15
- **Autores:** agente revisor bajo autoridad del mantenedor
- **Relacionados:** OQ-04, REQ-001–004, REQ-009, NFR-001, NFR-002, NFR-004, WBS-2.1, WBS-2.2, [ADR-0006](0006-stack-base.md), [SECURITY_PRIVACY](../SECURITY_PRIVACY.md)

## Contexto y fuerzas

El aislamiento entre tenants es el riesgo S0 del producto (R-02) y la primera prueba de G1 (TC-SEC-01). WBS-2.1 excluye SSO empresarial del primer corte. El autoalojamiento impide depender de un proveedor de identidad SaaS obligatorio.

## Alternativas

| Alternativa | Beneficios | Costos/riesgos |
|---|---|---|
| **Esquema compartido con `tenant_id` + autorización en la aplicación + RLS de PostgreSQL** | una sola base y migración; doble barrera; operación simple autoalojada | disciplina en cada consulta; RLS requiere configurar el contexto por transacción |
| Esquema por tenant | aislamiento lógico más fuerte | migraciones N veces; peor para miles de tenants pequeños |
| Base por tenant | aislamiento máximo | coste operativo alto; reservado a una futura opción enterprise |
| Proveedor de identidad externo obligatorio | menos código de auth | lock-in y dependencia SaaS incompatible con autoalojamiento |

## Decisión

**Tenancy.** Base y esquema compartidos. Toda tabla de negocio tiene `tenant_id NOT NULL`. El tenant se deriva siempre de la sesión o credencial, nunca de un parámetro del cliente. Dos barreras: (1) el módulo de políticas de la aplicación autoriza cada comando y consulta; (2) PostgreSQL Row-Level Security filtra por `current_setting('app.tenant_id')`, fijado con `SET LOCAL` en cada transacción, y el rol de la aplicación no tiene `BYPASSRLS`. Las tareas de plataforma que cruzan tenants usan un rol separado y auditado.

**Identificadores (REQ-009).** UUIDv7 internos. En API y eventos se exponen con prefijo de tipo (`prj_`, `ev_`, `creq_`, `usr_`…). Un ID inexistente y uno de otro tenant devuelven la misma respuesta 404.

**Autenticación de M1.** Cuentas locales con correo y contraseña cifrada con Argon2id; sesiones de servidor en cookie `HttpOnly`, `Secure`, `SameSite=Lax`, con caducidad por inactividad y absoluta, revocables (TC-SEC-02); protección CSRF en métodos de escritura; invitaciones con token de un solo uso y caducidad; limitación de intentos. Envío de correo por SMTP configurable. Fuera de M1: MFA TOTP (P1, siguiente iteración de WBS-2.1), SSO OIDC/SAML (corte posterior) y tokens de API con scopes para integraciones (M4, REQ-063).

**Autorización (REQ-003, NFR-002).** Deny by default. Roles por membresía de organización (propietario, administrador, miembro, invitado limitado) más reglas por recurso (miembros y roles de proyecto: PM, revisor, ejecutor). Una sola función de política en servidor decide `actor × acción × recurso`; la UI solo refleja sus resultados. La segregación de funciones (no aceptar lo propio, salvo política explícita) se evalúa en esa misma función.

## Consecuencias y reversibilidad

Cada repositorio de datos recibe el contexto de tenant de forma obligatoria; las pruebas negativas A/B se ejecutan en CI desde la primera tabla. Migrar a esquema o base por tenant sigue siendo posible porque `tenant_id` está en todas las tablas. Añadir OIDC no cambia el modelo de sesión.

## Validación

TASK-0002: prueba que, desactivando a propósito el filtro de la aplicación, RLS sigue impidiendo leer datos del tenant B desde una sesión de A; prueba de 404 indistinguible; prueba de sesión caducada rechazada. WBS-2.1/2.2 completan TC-SEC-01..03 y TC-IAM-01.

## Historial

- 2026-10-15: aceptado por el mantenedor, condicionado a TASK-0002 ([RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md)).
