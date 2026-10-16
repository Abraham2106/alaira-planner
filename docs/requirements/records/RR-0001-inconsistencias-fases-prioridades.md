# RR-0001 — Resolver contradicciones de fases, prioridades y verificación entre PRD, ROADMAP, SRS y trazabilidad

- **Estado:** approved
- **Solicitante / fecha:** revisión documental 0.1.1 / 2026-10-15
- **Problema de negocio y usuarios afectados:** el Planner, los agentes y los revisores recibían señales distintas sobre qué entra en cada corte y qué significa una prioridad. Eso impedía congelar la baseline M1 en G0 y permitía que dos agentes interpretaran de forma diferente el mismo paquete.
- **Resultado esperado:** una sola interpretación de fase y prioridad por requisito, y una prueba definida para cada REQ y NFR, coherentes en PRD, ROADMAP, SRS, TRACEABILITY y ACCEPTANCE_SCENARIOS.
- **Evidencia o investigación de soporte:** contradicciones detectadas al leer el corpus completo.

## Contradicciones y decisión

Criterio general: prevalece el documento de mayor autoridad (SRS > ROADMAP > PRD), y ante empate, la opción que reduce el riesgo de aceptar entregables sin estructura ni prueba.

| # | Contradicción | Decisión | Justificación |
|---|---|---|---|
| 1 | El [PRD](../../product/PRD.md) limitaba M2 a «dependencias FS»; el gate G2 del [ROADMAP](../../planning/ROADMAP.md) y [REQ-021](../SRS.md) exigen FS/SS/FF/SF | M2 cubre los cuatro tipos con lag/lead; se corrige el PRD | El SRS y el gate G2 tienen más autoridad, y WBS-3.2 ya estima el motor completo |
| 2 | El PRD ubicaba el árbol WBS y los hitos en M2; el ROADMAP pone WBS-3.1 en M1 | Árbol WBS, paquetes, hitos y entregables en M1; calendarios, CPM, baseline y Gantt en M2 | La aceptación de entregables (núcleo de M1) necesita paquetes y criterios donde colgarse; WBS-3.1 excluye CPM explícitamente |
| 3 | P0 se definía como «núcleo y seguridad», pero REQ-006, REQ-065, REQ-069 y REQ-080 se entregan después de M1 | P0 expresa criticidad, no fase: bloquea cualquier piloto externo o release que incluya la capacidad afectada | Es coherente con la regla ya existente del SRS §4 («los requisitos de seguridad P0 aplican antes de cualquier piloto externo») y evita adelantar integraciones a M1 |
| 4 | TC-SAFE-01, TC-OPS-01..03, TC-PERF-01 y TC-SLO-01 se citaban sin definición, y los NFR no tenían columna de verificación | Columna «Verificación» en la tabla NFR del SRS; casos definidos en [ACCEPTANCE_SCENARIOS](../../quality/ACCEPTANCE_SCENARIOS.md), con dos nuevos para huecos detectados: TC-SEC-05 (secretos, NFR-004) y TC-SEC-06 (cifrado, NFR-005) | Cada NFR P0 queda con prueba trazable antes de G1 |
| 5 | La amenaza «PII excesiva en auditoría» se verificaba con TC-AUD-03, que prueba otra cosa (exportación sin fuga entre tenants) | Nuevo TC-PRIV-01 de minimización y retención, vinculado a NFR-016/018; TC-AUD-03 conserva su alcance | Separar aislamiento de minimización evita que un caso aprobado oculte el otro riesgo |

## Texto normativo aplicado

- SRS §1, *Priorización*: definición de P0 como criticidad que bloquea piloto o release del corte que incluya la capacidad.
- SRS §4: columna «Verificación» por NFR.
- PRD §4: alcance de M1 y M2 según las decisiones 1 y 2.
- TRACEABILITY: nuevos TC por fila, fase de REQ-011–016 en M1 (REQ-015 en M3 por depender del backlog) y nota sobre requisitos P0 entregados después de M1.
- ACCEPTANCE_SCENARIOS: TC-SEC-05, TC-SEC-06, TC-SAFE-01, TC-PERF-01, TC-SLO-01, TC-OPS-01..03 y TC-PRIV-01.
- SECURITY_PRIVACY §2: la amenaza de PII se verifica con TC-PRIV-01, y se añade la amenaza de secretos filtrados con TC-SEC-05.

## Cierre

- **Escenarios Given/When/Then:** los de los TC nuevos en ACCEPTANCE_SCENARIOS.
- **Alternativas descartadas:** M2 solo con FS (contradice SRS y G2); lista plana de entregables en M1 (obliga a migrar a árbol en M2); P0 = M1 (forzaría integraciones y aprobaciones de IA en el núcleo); ampliar TC-AUD-03 (mezcla dos riesgos).
- **Impactos:** ninguna estimación de WBS cambia; WBS-3.1 ya estaba en M1 en el ROADMAP. El gate G1 incorpora la ejecución de TC-SEC-05/06 por ser NFR P0 del corte.
- **Riesgos / mitigaciones:** mitiga R-01 (alcance demasiado amplio) al fijar cortes sin ambigüedad.
- **ADR vinculado:** ninguno; es una decisión de alcance.
- **Decision maker / fecha / justificación:** mantenedor Alaira, por instrucción expresa de alinear la documentación según el criterio del agente revisor, 2026-10-15. Puede revertirse con una RR posterior.
- **Baseline anterior / nueva:** 0.1 (propuesta) / 0.1.1 (propuesta). Sigue sin existir baseline aprobada; G0 continúa pendiente.
- **Prueba y evidencia de cierre:** `python scripts/validate_docs.py` sin errores, y PR que actualiza todos los documentos afectados en conjunto.
