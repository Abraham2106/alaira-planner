# ADR-0005 — Herramientas de IA mediadas por políticas de dominio

- **Estado:** Proposed
- **Fecha:** 2026-10-15
- **Relacionados:** REQ-061, 065–069, NFR-006/007, WBS-7.2

## Contexto

La IA recibe instrucciones de usuario y contenido conectado de distinta confiabilidad. Si puede llamar una API con privilegios propios sin revalidar al actor, una mención en Slack o un documento malicioso podría aprobar entregables, cambiar costos o revelar datos.

## Alternativas

1. LLM invoca directamente APIs con credenciales de workspace — sencillo pero inseguro.
2. LLM sólo propone texto, humanos hacen todas las acciones — seguro pero más fricción.
3. LLM propone comando tipado con contexto/citas; Policy Gateway confirma actor, scopes, acción, recurso, versión y approvals y ejecuta por API de dominio — balance de seguridad y utilidad.

## Decisión propuesta

Preferir opción 3. Separar generación de intención del enforcement. Ejecutar con identidad delegada, límite de permisos actor∩conector∩política tenant, aprobación humana cuando proceda y clave idempotente. El resultado muestra fuente y estado real; ningún resultado no confirmado se anuncia como éxito.

## Pruebas y reversibilidad

Red team: prompt injection en documentos, IDOR, escalada, replays, manipulación de campos y acciones de costo/baseline. Logs minimizados para auditoría. Si falla política, fail closed y opción de tramitar manualmente. La aceptación requiere POC e integración con SRS/TC.
