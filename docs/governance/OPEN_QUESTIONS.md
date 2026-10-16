# Decisiones abiertas y validación requerida

Toda resolución se registra en una RR o un ADR con aprobación. Las decisiones de G0 las tomó el mantenedor en [RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md).

| ID | Pregunta | Estado | Resolución o vía de decisión | Momento |
|---|---|---|---|---|
| OQ-01 | ¿Qué licencia OSS y cómo se certifican las contribuciones? | resuelta | Apache-2.0 + DCO; la metodología nunca es premium ([ADR-0004](../architecture/adr/0004-oss-license-pending.md)) | G0 |
| OQ-02 | ¿Stack frontend, backend y base de datos? ¿Proveedor de modelos de IA? | resuelta (condicionada a TASK-0002) | TypeScript, Fastify, React+Vite, PostgreSQL con `pgvector`, capa de IA agnóstica de proveedor ([ADR-0006](../architecture/adr/0006-stack-base.md)) | G0 |
| OQ-03 | ¿Cloud y autoalojado, perfiles y regiones? | resuelta en parte | referencia autoalojada con Docker Compose (ADR-0006); regiones de la nube gestionada antes del primer piloto | G0 / G3 |
| OQ-04 | ¿Autenticación, aislamiento de tenants y roles? | resuelta (condicionada a TASK-0002) | RLS, Argon2id, sesiones, RBAC + reglas de recurso; SSO/SCIM en WBS-8.7 ([ADR-0007](../architecture/adr/0007-tenancy-y-autenticacion.md)) | G0 |
| OQ-05 | ¿Cómo se acredita avance y EV para paquetes parciales? | resuelta | estrategias de progreso por paquete y técnicas de valor ganado declaradas ([RR-0002 §4](../requirements/records/RR-0002-baseline-m1-y-g0.md)); la fórmula de EVM, por ADR antes de M3 | G0 |
| OQ-06 | ¿Reglas de baseline de tiempo y presupuesto del cliente? | abierta | RR + validación con PMO en discovery | G2 |
| OQ-07 | ¿Slack o Teams primero? | resuelta | Slack y GitHub en M1, Google en M2, Microsoft 365 / Teams en M5 (RR-0002) | G0 |
| OQ-08 | ¿Retención, residencia y consentimientos de evidencia? | abierta, no bloquea M1 | revisión de privacidad; mientras tanto, solo datos sintéticos ([SECURITY_PRIVACY §4](../architecture/SECURITY_PRIVACY.md)) | antes del primer piloto (G3) |
| OQ-09 | ¿Costo de IA y criterios para acciones automáticas? | resuelta en parte | política de autonomía en [ADR-0005](../architecture/adr/0005-agent-tools-policy-gate.md); presupuesto de costo por acción en WBS-7.3 | G1 |
| OQ-10 | ¿Conectores posteriores (Jira, Linear, Figma, ERP) y formatos de importación/exportación? | abierta | entrevistas e inventario de APIs | G2–G4 |
| OQ-11 | ¿Forma de la oferta empresarial y sostenibilidad del proyecto? | abierta | estrategia Alaira; límite fijado en ADR-0004 (metodología nunca premium) | G3 |
| OQ-12 | ¿Permisos y privacidad de clientes externos? | abierta | diseño de roles | G1 |

Prioridad actual: OQ-12 y el presupuesto de OQ-09 antes de G1; OQ-08 antes del primer piloto.
