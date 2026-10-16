# Decisiones abiertas y validación requerida

Ninguna respuesta está inventada ni aprobada. Para resolver, crear RR o ADR y registrar aprobación.

| ID | Pregunta | Vía de decisión | Momento |
|---|---|---|---|
| OQ-01 | ¿Cuál licencia OSS (Apache-2.0, MIT, AGPL-3.0 u otra) y derechos/CLAs? | ADR-0004 + asesoría propietaria/legal | antes de contribuciones |
| OQ-02 | ¿Stack frontend/backend/database? | ADR con POC y comparación | G0 |
| OQ-03 | ¿Cloud y self-hosted, qué perfiles y regiones? | PRD/RR + ADR | G0–G1 |
| OQ-04 | ¿Auth local/SSO, tenant isolation, alcance roles? | ADR + threat model | G0 |
| OQ-05 | ¿Cómo se acredita EV para paquetes parciales? | RR + ADR | G0–G2 |
| OQ-06 | ¿Reglas de baseline de tiempo y presupuesto? | RR + aprobación PMO | G2 |
| OQ-07 | ¿Integración Slack primero, Teams en qué fase? | entrevistas/prueba de concepto | G0 |
| OQ-08 | ¿Retención, residencia y consentimientos de evidencia? | privacy review | G0 |
| OQ-09 | ¿Costo de IA y criterios para acciones automáticas? | ADR y evaluación riesgo | G1–G4 |
| OQ-10 | ¿Conectores Drive/M365 y formatos de import/export? | entrevistas e inventario API | G1–G4 |
| OQ-11 | ¿Financiación y sostenibilidad OSS, sin imponer premium? | estrategia Alaira | G2 |
| OQ-12 | ¿Política de privacidad/permisos de clientes externos? | diseño de rol | G1 |

Prioridad inicial: OQ-01, OQ-02, OQ-04, OQ-05 y OQ-08 por efectos sobre cumplimiento, arquitectura y reversibilidad.
