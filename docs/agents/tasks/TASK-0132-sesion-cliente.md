# TASK-0132 — Cliente de sesión y proyecto activo (pista A)

- **Estado:** integrated_provisional
- **Planificador:** Planner/Orchestrator (esta corrida)
- **owner_role:** implementador
- **Agente ejecutor:** implementador de esta corrida (pista A únicamente)
- **Revisor distinto:** pendiente. Esta corrida no se autorevisa como `accepted`.
- **WBS:** WBS-2.1, WBS-2.5, WBS-2.6
- **Requisitos:** REQ-002 (sesión), REQ-003 (denegación), REQ-006 (misma identidad de proyecto en las vistas), NFR-006 (CSRF en escrituras), NFR-021 (el POC de IA sigue llamando al motor determinista)
- **ADRs:** ADR-0006 (stack web), ADR-0007 (cookie de sesión y CSRF). ADR-0005 no se toca y su gate humana sigue abierta.
- **Rama / worktree:** `main` / copia principal. Sin rama nueva y sin worktree. Política vigente de las fichas: solo-main.
- **Dependencias:** TASK-0101 (IAM/CSRF en servidor), TASK-0115 (proyecto y WBS web), TASK-0117 (Gantt), TASK-0127 (control). TASK-0131 se conserva; no se rehace.
- **Rutas editables:** `apps/web/src/lib/api-client/**`, `apps/web/src/features/auth/**` (logout y handoff; sin rediseño), `apps/web/src/lib/session/**`, consumidores mínimos `apps/web/src/features/project/api.ts`, `apps/web/src/features/wbs/api.ts`, `apps/web/src/features/wbs/csrf.ts`, `apps/web/src/features/control-tower/api.ts`, `apps/web/src/features/gantt/api.ts`, cableado de `projectId` sin reestilo en `ProjectDirectory.tsx`, `ProjectWorkspace.tsx`, `WbsWorkspace.tsx`, `GanttWorkspace.tsx`, `ControlTowerWorkspace.tsx`, enlaces de `AppShell.tsx`, `apps/web/src/features/project/format-api-error.ts`, `packages/connectors/src/fabric/fabric.test.ts`, `packages/engine/src/index.ts`, esta ficha, `docs/agents/REGISTRY.md` y los runs de esta corrida.
- **Rutas prohibidas:** paleta, `apps/web/src/styles/tokens.css`, `shell.css`, rediseño de WorkHub (`WorkHub.tsx`, `example.ts`, `workspace.css`), backend de permisos, pistas B/C/D (ver abajo).
- **Bloque de migraciones:** ninguna.
- **Objetivo:** el cliente HTTP compartido envía credenciales y, en escrituras, `x-alaira-csrf` leído de `sessionStorage` `alaira-csrf` o de la cookie legible `alaira_csrf`. El proyecto activo queda en el hash (`?project=`) y en `sessionStorage` `alaira-active-project` para que WBS, Gantt y control lo lean tras recarga. Logout limpia el CSRF guardado y vuelve a `#/entrar`.
- **Fuera de alcance:** WorkHub persistente, Slack 0125, e2e G1, threat model, aprobación humana de RLS/auth/ADR-0005/baseline, release.
- **acceptance_criteria:**
  - Escrituras del cliente compartido llevan `x-alaira-csrf` cuando el login ya guardó el token; las lecturas no lo exigen.
  - 401, sesión ausente, sesión caducada (si el cuerpo lo dice) y 403 de permiso se muestran como fallo, no como éxito ni como lista de ejemplo.
  - Crear proyecto y rama usa la API real; el `projectId` sobrevive a la recarga y lo leen WBS, Gantt y control.
  - Logout borra el CSRF de `sessionStorage`, intenta revocar la sesión y navega a `#/entrar`.
  - Typecheck de connectors, ai, engine y web sin `any` y sin excluir archivos del tsconfig.
- **verification_strategy:** typecheck de `@alaira/connectors`, `@alaira/ai`, `@alaira/engine` y `@alaira/web`; vitest de los archivos tocados. Integración Postgres: `not_run` si la base no está; un skip no cuenta como passed. No reset de la base del usuario. No despliegue ni APIs de pago.
- **required_approvals:** revisor distinto antes de `accepted`. No se declaran aprobadas las gates humanas de RLS (0002/0106/0114), auth (0101), ADR-0005 (0108) ni línea base/costos (0116).
- **rollback_plan:** revertir solo los archivos de esta ficha. No `git reset` ni `git clean`: el árbol ya tenía el trabajo local de TASK-0131 y del mantenedor.

## Pistas reservadas, no codeadas

- **B — WorkHub persistente:** [TASK-0133](TASK-0133-workhub-persistente.md). Rutas anotadas, sin implementación.
- **C — Slack consecuencias:** TASK-0125 sigue `proposed`. El gate humana de TASK-0116 sigue abierto; no pasa a `ready`.
- **D — e2e G1 y threat model:** TASK-0129 y TASK-0130 siguen `proposed`.
