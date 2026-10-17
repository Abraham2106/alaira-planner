# TASK-0133 — WorkHub persistente (pista B)

- **Estado:** proposed
- **Planificador:** Planner/Orchestrator (esta corrida)
- **owner_role:** sin asignar
- **Agente ejecutor / revisor distinto:** pendiente / pendiente
- **WBS:** WBS-2.6, WBS-2.7
- **Requisitos:** REQ-006, REQ-076, REQ-096. El ejemplo ilustrativo de TASK-0131 no es el dato canónico.
- **ADRs:** ADR-0006, ADR-0007
- **Rama / worktree:** `main`. Sin rama nueva. No implementar en la corrida de la pista A.
- **Rutas reservadas:** `apps/web/src/features/workspace/WorkHub.tsx`, `apps/web/src/features/workspace/example.ts`, `apps/web/src/features/workspace/workspace.css`
- **Rutas prohibidas:** cliente de sesión de TASK-0132 salvo el enlace que ya pasa `projectId`, paleta y tokens, Slack (TASK-0125), e2e (TASK-0129), threat model (TASK-0130)
- **Dependencias:** TASK-0131 (UI a conservar), TASK-0132 (sesión y proyecto activo)
- **Objetivo:** sustituir el espacio ilustrativo por el trabajo real de la sesión, sin volver a mostrar el ejemplo cuando la API falla.
- **Fuera de alcance de esta ficha:** cualquier código en la corrida de la pista A.
- **Criterios de aceptación:** lista, tablero y cronograma leen la API del proyecto activo; el fallo de sesión no cae al ejemplo.
- **Plan de pruebas:** vitest web y un flujo con sesión real. Postgres `not_run` si no está.
- **required_approvals:** revisor distinto. No `ready` hasta cerrar el contrato de TASK-0132.
- **Rollback:** `git revert` de la futura entrega. No reset del árbol compartido.
