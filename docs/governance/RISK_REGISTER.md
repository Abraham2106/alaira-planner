# Registro de riesgos de concepción

Riesgo = incertidumbre futura; problema/issue = hecho materializado. Escala preliminar: probabilidad e impacto cualitativos bajo/medio/alto. No se han estimado costos de riesgos. El Planner mantiene dueño, fecha de revisión y evidencia.

| ID | Riesgo, prob./impacto | Mitigación y trigger | Owner sugerido |
|---|---|---|---|
| R-01 | alcance demasiado amplio; alto/alto | secuenciar por gates, validar M1 antes de avanzado; trigger: REQ sin AC | Product/Planner |
| R-02 | aislamiento multi-tenant deficiente; medio/alto | authz servidor, pruebas negativas y revisión externa; trigger: fuga entre tenants | Security |
| R-03 | LLM autoacepta entregables incorrectos; alto/alto | separación evidencia/aceptación y policy enforcement; trigger: falso completion | AI Safety |
| R-04 | dependencia de APIs de Slack, GitHub, Google y Microsoft; medio/alto | adapters, retries, scopes mínimos, contratos y fallback manual | Integrations |
| R-05 | CPM incorrecto en calendarios o leads; medio/alto | fixture de red validado y comparación con cálculo de referencia | Scheduling |
| R-06 | EVM inconsistente con aceptación y baseline; alto/alto | reglas versionadas, pruebas deterministas, fechas de corte | Finance |
| R-07 | agents editan lo mismo; alto/medio | worktrees/rutas exclusivas y registro central | Planner |
| R-08 | costes IA excesivos o latencia; medio/medio | presupuesto por acción, cache y eval, no bloquear flujo crítico | AI/Platform |
| R-09 | OSS sin licencia clara; **mitigado** | Apache-2.0 + DCO aceptados en ADR-0004; LICENSE y NOTICE publicados | Maintainer |
| R-10 | privacidad de evidencias y documentos; medio/alto | minimización, retención, consentimiento y ACL | Privacy |
| R-11 | importación/sync destruyen datos; medio/alto | dry-run, restore, idempotencia, contratos/versiones | Platform |
| R-12 | ergonomía demasiado compleja; alto/medio | pruebas con roles y divulgación progresiva de complejidad | UX |
| R-13 | estimaciones agénticas no equivalen a entregas; alto/alto | prueba y aceptación, no conteo de PR | Planner/QA |
| R-14 | falta de usuarios piloto; medio/alto | reclutamiento en M0 y contratos de privacidad | Product |
| R-15 | licencias de dependencias incompatibles con OSS elegido; medio/alto | SBOM y revisión de compatibilidad antes de merge | DX/Legal |
| R-16 | discovery en paralelo contradice la baseline M1; medio/alto | WBS-1.1 avanza con TASK-0003 y es condición de G1; cambios por RR; kernel de bajo arrepentimiento primero; trigger: entrevistas que niegan el problema del PM | Product |
| R-17 | M1 demasiado grande (tesis completa, ≈250–470 JPI); alto/alto | hitos internos M1a–M1d con demo cada uno; recortar alcance dentro de REQ P1 antes que mover P0; trigger: M1b sin cerrar en la semana 20 | Planner |
| R-18 | la IA vincula evidencia al ítem equivocado o propone avance inflado; alto/alto | confianza y método por vínculo, ambigüedad sin vincular, criterios de aceptación obligatorios, confirmación humana, evals de WBS-7.3; trigger: precisión de vinculación bajo umbral | AI Safety |

## Revisión

Cada riesgo debe evolucionar a tratamiento (evitar, mitigar, transferir, aceptar) con responsable y evidencia. Los riesgos críticos bloquean gates si no tienen mitigación verificada. Mientras no haya equipo, el mantenedor es dueño de todos los riesgos y la columna «Owner sugerido» indica el rol que lo asumirá; el Planner los revisa en cada gate ([RR-0002](../requirements/records/RR-0002-baseline-m1-y-g0.md)).
