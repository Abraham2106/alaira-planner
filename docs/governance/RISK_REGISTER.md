# Registro de riesgos de concepción

Riesgo = incertidumbre futura; problema/issue = hecho materializado. Escala preliminar: probabilidad e impacto cualitativos bajo/medio/alto. No se han estimado costos de riesgos. El Planner mantiene dueño, fecha de revisión y evidencia.

| ID | Riesgo, prob./impacto | Mitigación y trigger | Owner sugerido |
|---|---|---|---|
| R-01 | alcance demasiado amplio; alto/alto | secuenciar por gates, validar M1 antes de avanzado; trigger: REQ sin AC | Product/Planner |
| R-02 | aislamiento multi-tenant deficiente; medio/alto | authz servidor, pruebas negativas y revisión externa; trigger: fuga entre tenants | Security |
| R-03 | LLM autoacepta entregables incorrectos; alto/alto | separación evidencia/aceptación y policy enforcement; trigger: falso completion | AI Safety |
| R-04 | dependencia de APIs Slack/Microsoft; medio/alto | adapters, retries, scopes mínimos, contratos y fallback manual | Integrations |
| R-05 | CPM incorrecto en calendarios o leads; medio/alto | fixture de red validado y comparación con cálculo de referencia | Scheduling |
| R-06 | EVM inconsistente con aceptación y baseline; alto/alto | reglas versionadas, pruebas deterministas, fechas de corte | Finance |
| R-07 | agents editan lo mismo; alto/medio | worktrees/rutas exclusivas y registro central | Planner |
| R-08 | costes IA excesivos o latencia; medio/medio | presupuesto por acción, cache y eval, no bloquear flujo crítico | AI/Platform |
| R-09 | OSS sin licencia clara; alto/alto | ADR-0004 y decisión humana antes de contributions/releases | Maintainer |
| R-10 | privacidad de evidencias y documentos; medio/alto | minimización, retención, consentimiento y ACL | Privacy |
| R-11 | importación/sync destruyen datos; medio/alto | dry-run, restore, idempotencia, contratos/versiones | Platform |
| R-12 | ergonomía demasiado compleja; alto/medio | pruebas con roles y divulgación progresiva de complejidad | UX |
| R-13 | estimaciones agénticas no equivalen a entregas; alto/alto | prueba y aceptación, no conteo de PR | Planner/QA |
| R-14 | falta de usuarios piloto; medio/alto | reclutamiento en M0 y contratos de privacidad | Product |
| R-15 | licencias de dependencias incompatibles con OSS elegido; medio/alto | SBOM y revisión de compatibilidad antes de merge | DX/Legal |

## Revisión

Cada riesgo debe evolucionar a tratamiento (evitar, mitigar, transferir, aceptar) con responsable y evidencia. Los riesgos críticos bloquean gates si no tienen mitigación verificada. Estado actual: catálogo propuesto, nadie asignado.
