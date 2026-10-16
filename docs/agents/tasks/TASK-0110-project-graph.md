# TASK-0110 — Grafo de proyecto: work nodes, ramas y delivery_profile

- **Estado:** integrated_provisional (integrado en `main`; no marcar `accepted`)
- **Planificador:** Planner/Orchestrator
- **Agente ejecutor / revisor distinto:** implementador-0110 (composer-2.5) / revisor-0110 (instancia `acbf1451`, ronda 1/1 — **approve**)
- **WBS:** WBS-2.3
- **Requisitos:** REQ-081, REQ-009; NFR-001
- **ADRs:** ADR-0006, ADR-0007
- **RR relacionada:** RR-0002
- **Rama / worktree:** `main` · copia principal. Sin ramas. `git commit -s` y `git push origin main`.
- **Rutas reservadas:** `packages/domain/src/project/`, `packages/contracts/src/project/`, `apps/api/src/modules/project/`, `apps/api/migrations/0140_*.sql`–`0149_*.sql`, `docs/quality/reports/TASK-0110.md`
- **Rutas prohibidas:** REGISTRY, fichas TASK, SRS, ADRs, raíz, lockfile, WBS/entregables (0111), schedule (0113), rutas de otras TASK
- **Bloque de migraciones:** `0140–0149`
- **Dependencias:** TASK-0106 (authz); TASK-0101 IAM ya en `main`
- **Objetivo y alcance:** organización → proyecto → work nodes y aristas; `delivery_profile` a nivel proyecto con sobrescritura por rama (predictivo/Scrum/Kanban); campos personalizados tipados y ownership; IDs externos con prefijos.
- **Fuera de alcance:** árbol WBS de entregables (0111), CPM persistido (0113), portafolio multi-proyecto (M4).
- **Criterios de aceptación (80/20):**
  1. Crear proyecto con rama predictiva y rama Scrum sobre el mismo `project_id` (TC-HYB-02 a escala grafo).
  2. Campo personalizado con tipo inválido → rechazo 400 con error de contrato.
  3. Mutación sin permiso → deny (authz 0106); prueba negativa en al menos un endpoint.
  4. Tenant de sesión; otro tenant no lee el proyecto (404).
- **Plan de pruebas:** Vitest; integración Postgres Docker; 2–4 casos; datos sintéticos.
- **Riesgos / condiciones de parada:** modelo incompatible con 0111 → elevar al Planner antes de persistir WBS.
- **Evidencia:** implementación `8f13a9e`; reporte `39a55e3`; [informe TASK-0110](../../quality/reports/TASK-0110.md). Revisor **approve** (`acbf1451`): domain **3/3**; API integración **4/4**; typecheck OK. **REQUIERE_APROBACION_HUMANA:** no (veredicto técnico).
- **Rollback:** `git revert`; migraciones `014x` down.
