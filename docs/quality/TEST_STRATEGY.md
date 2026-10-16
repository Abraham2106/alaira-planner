# Estrategia de pruebas y verificación — Alaira Planner

**Estado:** plan, no evidencia de pruebas ejecutadas. Las pruebas citadas en SRS se definen como casos planificados.

## 1. Objetivos

Cada cambio debe validar negocio, permisos, regresión, interoperabilidad y observabilidad. La selección sigue riesgo: tenant/security, aceptación y dinero requieren pruebas antes de optimizar UI.

## 2. Capas

| Capa | Cobertura | Gate propuesto |
|---|---|---|
| unitarias de dominio | WBS sin ciclos, dependencia/cálculo fechas, progreso, EVM, tarifas | todas verdes; property-based para invariantes |
| contrato API/events | idempotencia, esquemas, errores, paginación y versiones | contrato publicado y validado |
| integración | DB/outbox, almacenamiento, OAuth, webhooks, retries, revocación | fixtures con entorno aislado |
| seguridad | RBAC/ABAC/IDOR, prompt injection, tenants y secretos | cero fallas críticas conocidas |
| E2E | crear proyecto, adjuntar evidencia, pedir y aprobar, revertir; Slack safe flow | ejecución en staging autorizada |
| UX/a11y | teclado, lector pantalla, contraste, mobile, mensajes de error | flujos P0 cumplen criterios definidos |
| rendimiento/resiliencia | carga, latencia p95, caídas de cola, restore y SLO | mediciones registradas, no supuestos |
| IA/evals | citas correctas, abstención, suplantación, tools policy y leakage | límites de error definidos por riesgo |

## 3. Fixtures mínimos

- Dos tenants A/B con usuarios de mismo nombre para evitar confusión de actor.
- Proyecto predictivo con WBS de 2 niveles y dos calendarios con feriado.
- Proyecto ágil con estados, WIP=2, sprint y workflow cambiado.
- Proyecto híbrido que mapea múltiples historias a un solo entregable.
- Evidencia documental independiente de repositorio y rechazada/aceptada/revertida.
- Bot Slack con mensaje duplicado, usuario no vinculado, proyecto homónimo y evento falsificado.
- EVM con BAC=100 000, PV=60 000, EV=50 000, AC=62 500, más AC=0, PV=0 y falta baseline.
- RAG con documento marcado secreto por tenant/rol e intento de prompt injection.

## 4. Estrategia de ejecución

El PR ejecuta formato, validación de esquemas, unitarias y seguridad rápida; el merge gate incorpora integración y E2E críticas; nightly puede cubrir rendimiento y eval IA más costosos; pre-release incluye restauración, a11y y exploratoria con usuarios. Cada ejecución guarda versión de código/datos, fechas, ambiente, resultado y artefacto de evidencia. Prohibido usar `passed` sin logs reales. Al no haber código, todas están `not_run`.

## 5. Defectos y severidad

S0: fuga entre tenants, acciones críticas no autorizadas, corrupción irreversible de baseline/costo; bloquea inmediatamente. S1: incumplimiento funcional P0, pérdida de evidencia o sincronización duplicada; bloquea release. S2: desviación moderada con workaround; priorizar según impacto. S3: cosmética/documentación. El revisor separa «criterio no ejecutado» de «criterio fallido».

## 6. Relación con trazabilidad

REQ/NFR → WBS → TC → resultado → evidencia → aprobación. Ver `../requirements/TRACEABILITY.md` y `ACCEPTANCE_SCENARIOS.md`. La cobertura de identificadores no equivale a calidad ni a conformidad ejecutada.
