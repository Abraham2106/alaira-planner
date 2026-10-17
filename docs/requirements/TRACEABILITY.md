# Matriz de trazabilidad de requisitos

**Estado:** asignación por rangos alineada con el [PRODUCT_BRIEF](../product/PRODUCT_BRIEF.md) y la baseline M1 de [RR-0002](records/RR-0002-baseline-m1-y-g0.md). Los TC son pruebas **planificadas, no ejecutadas**. La columna «Corte» sigue el [ROADMAP](../planning/ROADMAP.md); cuando un rango abarca varios cortes, se indica la excepción entre paréntesis. La aceptación requiere evidencia enlazada y verificación independiente.

**Nota de corte 2026-10-16.** Hay pruebas de código provisional (typecheck y vitest citados en los runs de las pistas A, B y C). No son la batería de aceptación del SRS y no cierran el gate. Ningún REQ de esta matriz pasa a `accepted`.

## Requisitos funcionales

| Requisitos | WBS principal | Prueba(s) | Corte |
|---|---|---|---|
| REQ-001–004 | WBS-2.1, 2.2 | TC-SEC-01..03, TC-IAM-01 | M1 |
| REQ-005–010 | WBS-2.3, 2.5 | TC-ORG-01, TC-PROJ-01..03, TC-API-01, TC-PORT-01 | M1 |
| REQ-011–016 | WBS-3.1, 3.5 | TC-WBS-01..04, TC-SCH-01, TC-ACC-01 | M1 (REQ-015, vínculo con backlog: M2) |
| REQ-017–019 | WBS-3.6 | TC-RES-01..03 | M1 (REQ-019, timesheets: M3) |
| REQ-020–024 | WBS-3.2, 3.3 | TC-SCH-02..05, TC-BASE-01 | M1 |
| REQ-025–026 | WBS-3.3 | TC-BASE-02..03 | M2 |
| REQ-027–029 | WBS-3.5, 3.3, 2.4 | TC-PROG-01, TC-UI-01, TC-AUD-01 | M1 |
| REQ-030 | WBS-3.2, 2.3 | TC-SCH-06 | M4 |
| REQ-031–040 | WBS-3.4, 3.5, 2.4 | TC-EV-01..03, TC-ACC-02..06, TC-INT-01, TC-AUD-02 | M1 |
| REQ-041–048 | WBS-4.1, 4.2, 4.3 | TC-AG-01..07, TC-HYB-01 | M2 |
| REQ-049–050 | WBS-4.3, 5.3 | TC-RAID-01, TC-NOTIF-01 | M4 |
| REQ-051–060 | WBS-6.1, 6.2, 6.3 | TC-FIN-01..07, TC-EVM-01..03 | M3 (REQ-058, forecast probabilístico: M5 con WBS-6.4) |
| REQ-061, 063–065 | WBS-5.1, 5.2, 2.5 | TC-BOT-01, TC-API-02, TC-INT-02..03 | M1 (suscripciones salientes de REQ-063: M4) |
| REQ-062 | WBS-5.2 | TC-BOT-02 | M5 |
| REQ-066, 068–069 | WBS-7.1, 7.2 | TC-AI-01, TC-AI-03..04 | M1 |
| REQ-067, 070 | WBS-7.4, 5.3 | TC-AI-02, TC-NOTIF-02 | M4 |
| REQ-071–073, 075 | WBS-2.7, 6.2, 2.5 | TC-REP-01..03, TC-SEARCH-01 | M4 (cockpit de proyecto de REQ-071: M1; reportes financieros de REQ-073: M3) |
| REQ-074 | WBS-3.4 | TC-SEC-04 | M1 |
| REQ-076, 078, 080 | WBS-2.6, 3.2, 2.4 | TC-UX-01, TC-UX-03, TC-AUD-03 | M1 |
| REQ-077, 079 | WBS-2.7, 8.7 | TC-UX-02, TC-EXT-01 | M5 |
| REQ-081, 083, 085 | WBS-2.3, 3.6, 3.3 | TC-HYB-02, TC-RES-04, TC-BASE-04 | M1 |
| REQ-082 | WBS-3.2 | TC-SCH-07 | M2 |
| REQ-084 | WBS-3.6 | TC-RES-05 | M5 |
| REQ-086 | WBS-3.6, 6.1 | TC-RES-06 | M3 |
| REQ-087–088 | WBS-3.4, 5.4 | TC-EV-04, TC-GH-01 | M1 |
| REQ-089 | WBS-5.5 | TC-GDR-01 | M2 |
| REQ-090–093 | WBS-7.2, 3.5, 5.1 | TC-AI-05..07, TC-BOT-03 | M1 |
| REQ-094 | WBS-7.4 | TC-AI-08 | M2 |
| REQ-095 | WBS-3.5 | TC-PROG-02 | M1 (aceptación de entregable, manual, checklist ponderado y evidencia externa); resto de estrategias en M2–M3 |
| REQ-096 | WBS-2.7 | TC-UX-04 | M1 (Project Control y My Work mínimos); completo en M4 |
| REQ-097 | WBS-2.4 | TC-AUD-04 | M1 |
| REQ-098–099 | WBS-6.2, 6.3 | TC-FIN-08..09 | M3 |
| REQ-100 | WBS-3.3 | TC-BASE-05 | M2 |
| REQ-101, 103 | WBS-4.3, 2.3 | TC-RAID-02, TC-ORG-02 | M4 |
| REQ-102 | WBS-4.2 | TC-AG-08 | M2 |

## Atributos de calidad

La verificación individual de cada NFR está en la columna «Verificación» del [SRS §4](SRS.md); los casos se definen en [ACCEPTANCE_SCENARIOS](../quality/ACCEPTANCE_SCENARIOS.md).

| NFR | WBS principal | Corte |
|---|---|---|
| NFR-001–008, 012, 013, 015–017, 019–022 | WBS-2.1–2.5, 7.2, 7.3, 8.1–8.3 | M1 |
| NFR-014 | WBS-8.3 | M3 (matriz de navegadores antes del producto inicial) |
| NFR-009–011, 018 | WBS-8.3, 8.2, 8.5 | antes del primer piloto externo (G3) |

Un requisito P0 bloquea el piloto o release del corte que incluya su capacidad ([RR-0001](records/RR-0001-inconsistencias-fases-prioridades.md)). En esta versión todos los REQ P0 pertenecen a M1; NFR-018 (P0) bloquea el primer piloto externo.

## Gestión de cambios

Si una RR añade o modifica un requisito, se crean o actualizan filas y TC en el mismo PR. No se declara «100 % de cobertura» hasta que cada REQ y NFR aprobado tenga al menos una prueba ejecutada con resultado y evidencia. Esta tabla es trazabilidad por rangos: antes de implementar se necesita trazabilidad **por requisito individual y por caso**, visible en la ficha TASK y en el reporte de pruebas. No confundir identificación de prueba con prueba realizada.

## Registro de cumplimiento

| Requisito | Estado | Prueba ejecutada | Evidencia de aceptación | Revisor |
|---|---|---|---|---|
| baseline M1 (RR-0002) | approved / not_implemented | no | no | por designar |
| resto | proposed / not_implemented | no | no | por designar |
| corte 2026-10-16 (código M1) | provisional / gate abierto | pruebas de código en los runs; batería SRS no cerrada | no | sin `accepted` |
