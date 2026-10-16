# Seguridad, privacidad y modelo de amenazas

**Estado:** referencia vigente; tenancy y autenticación decididas en [ADR-0007](adr/0007-tenancy-y-autenticacion.md) y la IA en [ADR-0005](adr/0005-agent-tools-policy-gate.md). Lo demás debe convertirse en decisiones y pruebas. Este documento no declara cumplimiento de una norma ni certificación.

## 1. Activos y fronteras de confianza

Activos: identidades, membresías, proyectos, contratos de costo, evidencia documental, registros de aceptación, tokens OAuth, indicaciones a agentes, embeddings/índices, eventos de auditoría y backups. Fronteras: navegador/API, tenant A/tenant B, plugin/servicio externo/core, LLM/contexto no confiable/herramienta, personal de operaciones/datos del cliente, proveedor cloud/sistema.

## 2. Matriz inicial de amenazas

| Amenaza | Ejemplo | Control requerido | Prueba |
|---|---|---|---|
| IDOR/tenant escape | consultar evidencia ajena cambiando ID | tenant derivado de sesión, autorización por objeto | TC-SEC-01 |
| Escalada de rol | colaborador aprueba su propia entrega sin facultad | roles + políticas y segregación | TC-SEC-03 |
| Prompt injection | documento dice «ignora permisos» | tratar fuentes como datos; herramientas con policy enforcement | TC-AI-04 |
| Herramienta excesiva | bot usa token admin para completar | identidad del actor, scopes mínimos, permisos del dominio | TC-BOT-01 |
| Replay Slack/webhook | mismo mensaje aplicado 3 veces | firma, timestamp, idempotencia durable | TC-INT-03 |
| Fuga RAG | vector de tenant B citado a A | filtrado previo a búsqueda y autorización antes de respuesta | TC-AI-03 |
| Adjuntos maliciosos | archivo infectado/URL SSRF | antivirus o control adecuado, content type, URL allowlist y sandbox | TC-SAFE-01 |
| Integración revocada | acceso sigue funcionando | refresh/revocación, invalidación de cache | TC-INT-02 |
| Secretos filtrados | token OAuth impreso en un log de error | cifrado, rotación, redacción en logs | TC-SEC-05 |
| Auditar PII en exceso | logs de chat/salarios | minimización, mascarado, retention/consent | TC-PRIV-01 |
| Costos alterados | cambio de AC sin autorización | dual approval según política y audit trail | TC-FIN-07 |
| Vinculación errónea de evidencia | un PR de otro equipo o un nombre de rama manipulado se vincula a un entregable y la IA propone cerrarlo | vínculo con confianza y método, ambigüedad sin vincular, criterios de aceptación obligatorios, confirmación humana de avance | TC-EV-04, TC-GH-01, TC-AI-07 |
| IA con escritura directa | la IA escribe una fecha, costo o baseline sin pasar por el dominio | solo comandos tipados tras la pasarela de políticas; acciones controladas con aprobación humana | TC-AI-05, TC-AI-09 |
| Abuso del token de conector | token de GitHub o Slack con permisos amplios usado para leer repos o canales no autorizados | scopes mínimos, permisos efectivos = actor ∩ conector ∩ política, revocación probada | TC-INT-02, TC-BOT-01 |

## 3. Controles de diseño

Autenticación fuerte y sesión; autorización central en servidor; política deny-by-default; service accounts con scope y expiración; rate limits; validación de entradas; CSP, protecciones CSRF/XSS según arquitectura; cifrado tránsito/reposo; KMS y rotación; secretos nunca en repositorio ni prompts. Objeto/Evidence: ACL inherente al tenant y al recurso, escaneo y metadatos mínimos. External URL fetch: mitigar SSRF y redirecciones.

**IA:** separar system/policy de contenido recuperado, mostrar procedencia y abstención, permitir solo herramientas de dominio tipadas, validar usuario/tenant/estado en la herramienta y pedir confirmación de acciones de alto impacto. No guardar prompts sensibles por defecto ni usar documentos de tenants para entrenamiento sin base legal y consentimiento explícito.

**Agentes de desarrollo:** no compartir tokens entre worktrees; nunca permitir que un issue o documento externo modifique instrucciones de seguridad; acceso de escritura por ruta y revisión separada. Mantener dependencias bajo SBOM/revisión de licencia.

## 4. Política de datos a decidir antes de piloto

**Regla vigente hasta entonces** ([RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md)): en desarrollo, CI, demos y evaluaciones de IA solo se usan datos sintéticos o públicos. No se conectan workspaces de Slack, organizaciones de GitHub ni cuentas de Google con datos reales de clientes o de terceros, ni se envían esos datos a un proveedor de modelos, hasta aprobar esta política (OQ-08).

Categorías: datos de cuenta, plan, evidencia, comunicaciones conectadas, costos e información sensible del personal. Especificar finalidad, base legal cuando aplique, residencia, retención, exportación, rectificación, borrado, backup, acceso del equipo, subencargados y plazos de respuesta. No fijar ventanas arbitrarias sin requisitos regulatorios y acuerdos de clientes. Los logs de auditoría pueden requerir retención especial; resolver conflicto borrado/seguridad con revisión legal.

## 5. Requisitos de validación

Threat model actualizado por nuevo conector/capacidad IA; escaneo de dependencias y secretos en CI; pentest proporcional antes de exposición externa; incident runbook, restauración de backups, revisión de permisos, pruebas DAST/SAST según stack. Como Slack, GitHub y la IA entran en M1, G1 exige: ningún fallo P0 conocido en aislamiento y autorización, pruebas de autenticidad de webhooks y replay, y red team de IA (prompt injection, escalada, vinculación errónea). G3 añade pentest proporcional antes del primer piloto externo.

## 6. Seguridad operativa OSS

Completar [SECURITY.md](../../SECURITY.md) con un canal privado habilitado, política de soportes y parches, guía hardening self-hosted y procedimiento para rotar tokens. No introducir telemetría invasiva u obligación de usar SaaS propietario como requisito para desplegar edición OSS, salvo decisión y transparencia posterior.
