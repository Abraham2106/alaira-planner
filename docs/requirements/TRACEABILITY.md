# Matriz de trazabilidad de requisitos

**Estado:** matriz de asignación inicial; los TC son identificadores de pruebas **planificadas, no implementadas**. Cada rango coincide con el catálogo en SRS. La aceptación requiere evidencia enlazada y verificación independiente.

| Requisitos | WBS principal | Prueba(s) propuestas | Entrega |
|---|---|---|---|
| REQ-001–004, NFR-001–005 | WBS-2.1, 2.2, 8.2 | TC-SEC-01..03, TC-SEC-05..06, TC-IAM-01 | M1 |
| REQ-005–010, NFR-015,017 | WBS-2.3, 2.5 | TC-ORG-01, TC-PROJ-01..03, TC-PORT-01, TC-API-01 | M1–M2 |
| REQ-011–016 | WBS-3.1, 3.3, 3.5 | TC-WBS-01..04, TC-SCH-01, TC-ACC-01 | M1 (REQ-015, vínculo con backlog: M3) |
| REQ-017–020 | WBS-3.6, 3.2 | TC-RES-01..03, TC-SCH-02 | M2 |
| REQ-021–030, NFR-019 | WBS-3.2, 3.3, 3.5 | TC-SCH-03..06, TC-BASE-01..03, TC-PROG-01, TC-UI-01, TC-AUD-01 | M2–M5 |
| REQ-031–040, NFR-003,008 | WBS-3.4, 3.5, 2.4 | TC-EV-01..03, TC-ACC-02..06, TC-INT-01, TC-AUD-02 | M1 |
| REQ-041–047 | WBS-4.1, 4.2 | TC-AG-01..07 | M3 |
| REQ-048–050 | WBS-4.3, 5.3 | TC-HYB-01, TC-RAID-01, TC-NOTIF-01 | M3–M4 |
| REQ-051–060 | WBS-6.1, 6.2, 6.3 | TC-FIN-01..07, TC-EVM-01..03 | M5 |
| REQ-061–065 | WBS-5.1, 5.2, 2.5 | TC-BOT-01..02, TC-API-02, TC-INT-02..03 | M4 |
| REQ-066–070, NFR-007,020 | WBS-7.1, 7.2, 7.3, 5.3 | TC-AI-01..04, TC-NOTIF-02 | M4–M5 |
| REQ-071–075 | WBS-2.5, 6.2, 4.3, 3.4 | TC-REP-01..03, TC-SEC-04, TC-SEARCH-01 | M2–M5 |
| REQ-076–080, NFR-013–014,018 | WBS-2.6, 8.3, 8.2 | TC-UX-01..03, TC-EXT-01, TC-AUD-03, TC-PRIV-01 | M1–M5 |
| NFR-006,011–012,016 | WBS-8.1, 8.2, 8.3 | TC-SAFE-01, TC-OPS-01..03, TC-PRIV-01 | transversal |
| NFR-009–010 | WBS-8.3, 8.5 | TC-PERF-01, TC-SLO-01 | piloto |

La verificación individual de cada NFR figura en la columna «Verificación» del [SRS §4](SRS.md); los casos derivados de NFR están definidos en [ACCEPTANCE_SCENARIOS](../quality/ACCEPTANCE_SCENARIOS.md). La columna «Entrega» sigue el [ROADMAP](../planning/ROADMAP.md) y el PRD, alineados por [RR-0001](records/RR-0001-inconsistencias-fases-prioridades.md). Un requisito P0 entregado después de M1 (REQ-006 en sus vistas ágiles, REQ-065, REQ-069, REQ-080) bloquea el piloto o release del corte que lo incluya.

## Gestión de cambios

Si una RR añade o modifica requisito, crear/actualizar filas y TC dentro del mismo PR. No declarar «100% cobertura» hasta que cada REQ y NFR aprobado tenga al menos una prueba ejecutada con resultado y evidencia. Esta tabla es trazabilidad por rangos de planificación: antes de implementar se necesita trazabilidad **por requisito individual y por caso**, visible en issue/TASK y reporte de pruebas. No confundir identificación de prueba con prueba efectivamente realizada.

## Registro de cumplimiento

| Requisito | Estado | Prueba ejecutada | Evidencia de aceptación | Revisor |
|---|---|---|---|---|
| todos | proposed/not_implemented | no | no | por designar |
