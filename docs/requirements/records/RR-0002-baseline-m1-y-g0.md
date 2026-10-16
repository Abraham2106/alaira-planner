# RR-0002 — Definición de producto, baseline de requisitos M1 y resolución del gate G0

- **Estado:** approved
- **Solicitante / fecha:** mantenedor Alaira (Abraham2106) / 2026-10-15
- **Problema de negocio y usuarios afectados:** la construcción no podía empezar. G0 exigía licencia, ADRs iniciales aceptados, baseline M1, priorización y riesgos con dueño, y ninguno estaba resuelto. Además, la documentación de concepción se había redactado sin la definición de producto del mantenedor, de modo que el orden de construcción, el modelo de avance y el papel de la IA no coincidían con el producto real.
- **Resultado esperado:** documentación alineada con el [PRODUCT_BRIEF](../../product/PRODUCT_BRIEF.md), baseline M1 cerrada y G0 aprobado.
- **Autoridad:** instrucción expresa del mantenedor de adoptar su definición de producto y de responder bajo su autoridad todo lo que bloquee la construcción. Las decisiones las redactó el agente revisor y quedan ratificadas por el mantenedor al aprobar el PR que las introduce.

## 1. Adopción de la definición de producto

El [PRODUCT_BRIEF](../../product/PRODUCT_BRIEF.md) pasa a ser la fuente de producto con mayor autoridad después de las instrucciones expresas del mantenedor. Consecuencias:

| Tema | Antes | Ahora |
|---|---|---|
| Categoría | gestor multi-metodología con IA asistiva | *Project Control Plane* con IA nativa, orientado a evidencia |
| Orden de construcción | núcleo → planificación → ágil → integraciones → finanzas e IA | *vertical slices*: M1 tesis completa (planificación + evidencia + GitHub/Slack + IA gobernada), M2 Scrum e híbrido, M3 dinero, M4 control tower y portafolio, M5 enterprise y forecasting |
| Avance | solo 0/100 por aceptación | estrategias de progreso por paquete (REQ-095); la IA propone avance con evidencia y criterios, y se aplica según la política de autonomía |
| IA | asistente que propone | runtime transaccional de seis pasos, herramientas tipadas, niveles informar/proponer/controlado y trazabilidad completa (REQ-090–092, NFR-021) |
| Integraciones iniciales | Slack (M4) | Slack y GitHub en M1, Google Workspace en M2 |
| Nuevos requisitos | — | REQ-081 a REQ-103 y NFR-021 a NFR-022 en el [SRS](../SRS.md) |
| Nuevos paquetes | — | WBS-2.7, 5.4, 5.5, 6.4, 7.4 y 8.7 |

Las decisiones 1 y 2 de [RR-0001](RR-0001-inconsistencias-fases-prioridades.md) (contenido de M1 y M2) quedan sustituidas por este orden. Sus decisiones 3 a 5 (P0 como criticidad, verificación de NFR y TC-PRIV-01) siguen vigentes.

## 2. Baseline M1 aprobada

**58 REQ y 17 NFR**, que cubren el primer *vertical slice* del brief (lanzamiento de una API). Todo lo demás del SRS sigue propuesto, con su corte en la [matriz de trazabilidad](../TRACEABILITY.md).

| Área | Requisitos |
|---|---|
| Identidad y tenancy | REQ-001–004 |
| Grafo de proyecto | REQ-005–010, REQ-081 |
| WBS, entregables e hitos | REQ-011–014, REQ-016 |
| Personas y capacidad | REQ-017, REQ-018, REQ-083 |
| Programación y baseline | REQ-020–024, REQ-028, REQ-029, REQ-085 |
| Progreso | REQ-027, REQ-095 (aceptación de entregable, manual, checklist ponderado y evidencia externa) |
| Evidencia, aceptación y auditoría | REQ-031–040, REQ-074, REQ-080, REQ-087, REQ-097 |
| Conectores | REQ-061 (Slack), REQ-063 (API v1 y webhooks entrantes), REQ-064, REQ-065, REQ-088 (GitHub) |
| IA gobernada | REQ-066, REQ-068, REQ-069, REQ-090–093 |
| Experiencia | REQ-076, REQ-078, REQ-096 (Project Control y My Work mínimos) |
| Calidad | NFR-001–008, 012, 013, 015, 016, 017, 019, 020, 021, 022 |

NFR-009, 010, 011 y 018 se cumplen antes del primer piloto externo (G3).

## 3. Decisiones de G0

| Pregunta | Decisión | Registro |
|---|---|---|
| OQ-01 Licencia | Apache-2.0 con DCO; la metodología nunca es premium; la marca «Alaira» queda excluida | [ADR-0004](../../architecture/adr/0004-oss-license-pending.md), [LICENSE](../../../LICENSE) |
| OQ-02 Stack | TypeScript, Node.js LTS, Fastify, React+Vite, PostgreSQL (con índice vectorial), outbox, almacenamiento S3, Docker Compose, capa de modelos de IA agnóstica de proveedor | [ADR-0006](../../architecture/adr/0006-stack-base.md) |
| OQ-03 Cloud / autoalojado | despliegue de referencia autoalojado con Docker Compose; nube gestionada por Alaira opcional y posterior; regiones antes del primer piloto | ADR-0006 |
| OQ-04 Auth y tenancy | esquema compartido con `tenant_id` y RLS; cuentas locales con Argon2id y sesiones de servidor; SSO y SCIM en WBS-8.7 | [ADR-0007](../../architecture/adr/0007-tenancy-y-autenticacion.md) |
| OQ-05 Avance parcial y EV | ver §4 | esta RR |
| OQ-07 Slack o Teams | Slack y GitHub primero (M1); Google en M2; Teams y Microsoft 365 en M5 | esta RR |
| OQ-08 Privacidad y retención | no bloquea la construcción; se decide antes del primer piloto externo. Mientras tanto, en desarrollo, CI y demos solo se usan datos sintéticos | esta RR, [SECURITY_PRIVACY §4](../../architecture/SECURITY_PRIVACY.md) |
| OQ-09 IA y acciones automáticas | política de autonomía informar/proponer/controlado; el presupuesto de coste por acción se fija en WBS-7.3 antes de G1 | [ADR-0005](../../architecture/adr/0005-agent-tools-policy-gate.md) |
| ADRs | aceptados: 0001, 0002 y 0004; aceptados con condición de validación en TASK-0002: 0003, 0005, 0006 y 0007 | [INDEX](../../INDEX.md) |

Siguen abiertas, sin bloquear M1: OQ-06 (reglas de baseline del cliente, G2), OQ-10 (conectores posteriores), OQ-11 (forma de la oferta empresarial, G3) y OQ-12 (permisos de clientes externos, G1).

## 4. Política de avance (REQ-027, REQ-095) y de valor ganado (OQ-05)

- **Estrategia por paquete.** Cada paquete declara una estrategia versionada. Por defecto, los entregables usan **aceptación de entregable** (0/100) y los work items, **evidencia externa con confirmación**. M1 implementa además manual y checklist ponderado; el resto de estrategias del brief llega en M2–M3.
- **Evidencia y propuestas.** Un EvidenceEvent no cambia el avance. La IA puede proponer un porcentaje justificando qué criterios de DoD se cumplen y cuáles faltan (por ejemplo, 85 % porque falta el escaneo de seguridad). La propuesta se aplica con confirmación del responsable (nivel *proponer*) y nunca cierra un ítem con criterios pendientes.
- **Agregación.** El avance del padre se calcula sobre hojas únicas con pesos versionados: `Σ(peso × avance de la hoja) / Σ(peso de hojas vigentes)`. Peso entero positivo, 1 por defecto, editable por el PM con auditoría. Las hojas canceladas salen del denominador con evento auditado.
- **Valor ganado (M3).** Solo cuentan como EV las estrategias declaradas como técnica de valor ganado en la política del proyecto: 0/100 por defecto, hitos ponderados con criterio propio por hito y, si el PM y finanzas aprueban, 50/50 o % físico verificado. Nunca se deriva EV de horas, mensajes ni commits.

## 5. Discovery en paralelo

Las entrevistas de WBS-1.1 no pueden sustituirse por una decisión. Se acepta empezar M1 antes de tenerlas porque la tesis está definida por el mantenedor y el kernel (tenancy, grafo de proyecto, programación, evidencia) es de bajo arrepentimiento. A cambio, WBS-1.1 avanza con TASK-0003 y su informe es condición de **G1**; si contradice la baseline, se cambia por RR sin reescribir el histórico. Riesgos asociados: R-14, R-16 y R-17.

## 6. Riesgos

Mientras no haya equipo, el mantenedor es dueño de todos los riesgos del [registro](../../governance/RISK_REGISTER.md) y el Planner los revisa en cada gate. R-09 (licencia) queda mitigado por ADR-0004.

## Cierre

- **Alternativas descartadas:** mantener el orden anterior (contradice la tesis del producto); esperar a discovery para todo G0 (retrasa sin reducir el riesgo del kernel); elegir stack solo después del POC (circular); AGPL (ver ADR-0004).
- **Impactos:** PRODUCT_BRIEF (nuevo), VISION, PRD, SRS 0.2.0, TRACEABILITY, ACCEPTANCE_SCENARIOS, WBS 0.2, WBS_DICTIONARY, ROADMAP, ARCHITECTURE, DOMAIN_MODEL, FINANCIAL_MODEL, INTEGRATIONS, SECURITY_PRIVACY, UX_IA, METRICS, ECOSYSTEM_RESEARCH, ADR-0001 a 0007, OPEN_QUESTIONS, RISK_REGISTER, GLOSSARY, REGISTRY y fichas TASK, CONTRIBUTING (DCO), README y STATUS.
- **Decision maker / fecha:** mantenedor Alaira, 2026-10-15.
- **Baseline anterior / nueva:** 0.1.1 propuesta / **M1 aprobada (SRS 0.2.0)**.
- **Prueba y evidencia de cierre:** `python scripts/validate_docs.py` sin errores y PR aprobado por el mantenedor.
