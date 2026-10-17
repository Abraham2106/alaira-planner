# Snapshot de trabajo — 2026-10-16 — antes de la pista A

Inventario recuperable del árbol de trabajo. No es un backup binario ni incluye contenidos. No hay archivos de secretos (`.env`, credenciales, tokens) en esta lista.

- **HEAD:** `bcfce809ac3de131986137b9d55c96c12ce681e7` (`bcfce80`)
- **Política:** no reset, clean, stash, rebase, pull ni force-push.
- **Codegraph:** no existe `.codegraph/`; no se indexó.
- **Momento:** `git status --short -uall` antes de editar código de la pista A.

## Tracked modificados

- `apps/web/index.html`
- `apps/web/package.json`
- `apps/web/src/features/control-tower/AskCommandPanel.tsx`
- `apps/web/src/features/control-tower/ControlTowerWorkspace.tsx`
- `apps/web/src/features/control-tower/EventLogList.tsx`
- `apps/web/src/features/control-tower/ExceptionsList.tsx`
- `apps/web/src/features/control-tower/Feature.tsx`
- `apps/web/src/features/control-tower/MyWorkWorkspace.tsx`
- `apps/web/src/features/control-tower/control-tower-hash.test.ts`
- `apps/web/src/features/control-tower/control-tower-ui.test.tsx`
- `apps/web/src/features/control-tower/control-tower.css`
- `apps/web/src/features/control-tower/use-control-tower-hash.ts`
- `apps/web/src/features/gantt/GanttBars.tsx`
- `apps/web/src/features/gantt/GanttTable.tsx`
- `apps/web/src/features/gantt/GanttWorkspace.tsx`
- `apps/web/src/features/gantt/api.ts`
- `apps/web/src/features/gantt/gantt-model.ts`
- `apps/web/src/features/gantt/gantt.css`
- `apps/web/src/features/poc/Feature.tsx`
- `apps/web/src/features/project/Feature.tsx`
- `apps/web/src/features/project/ProjectWorkspace.tsx`
- `apps/web/src/features/project/project-form.test.tsx`
- `apps/web/src/features/project/project.css`
- `apps/web/src/features/project/use-portal-host.ts`
- `apps/web/src/features/project/use-projects-hash.ts`
- `apps/web/src/features/shell/AppShell.tsx`
- `apps/web/src/features/shell/datetime/DateTimeBanner.tsx`
- `apps/web/src/features/shell/navigation/ShellNav.tsx`
- `apps/web/src/features/shell/navigation/routes.ts`
- `apps/web/src/features/shell/pages/ShellPageContent.tsx`
- `apps/web/src/features/wbs/WbsWorkspace.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/styles/shell.css`
- `apps/web/src/styles/tokens.css`
- `apps/web/vite.config.ts`
- `docs/INDEX.md`
- `docs/agents/REGISTRY.md`
- `pnpm-lock.yaml`

## Untracked

- `.playwright-mcp/alaira-board.png`
- `.playwright-mcp/alaira-desktop-first.png`
- `.playwright-mcp/alaira-desktop-full.png`
- `.playwright-mcp/alaira-desktop.png`
- `.playwright-mcp/alaira-mobile-first.png`
- `.playwright-mcp/alaira-mobile.png`
- `.playwright-mcp/alaira-smoke/summary.json`
- `.playwright-mcp/alaira-state-coverage.json`
- `.playwright-mcp/alaira-timeline.png`
- `.playwright-mcp/element-2026-10-16T22-50-43-409Z.png`
- `.playwright-mcp/page-2026-10-16T22-48-49-990Z.yml`
- `.playwright-mcp/page-2026-10-16T22-48-59-611Z.png`
- `.playwright-mcp/page-2026-10-16T22-49-30-546Z.yml`
- `.playwright-mcp/page-2026-10-16T22-49-49-497Z.png`
- `.playwright-mcp/page-2026-10-16T22-50-00-115Z.yml`
- `.playwright-mcp/page-2026-10-16T22-51-27-967Z.yml`
- `.playwright-mcp/page-2026-10-16T22-58-21-203Z.yml`
- `apps/web/public/brand/banner-reverse.jpg`
- `apps/web/public/brand/banner.jpg`
- `apps/web/public/brand/logo-on-dark.png`
- `apps/web/public/brand/logo-on-light.png`
- `apps/web/src/features/auth/AuthScreen.tsx`
- `apps/web/src/features/auth/Feature.tsx`
- `apps/web/src/features/auth/api.ts`
- `apps/web/src/features/auth/auth-form.test.tsx`
- `apps/web/src/features/auth/auth.css`
- `apps/web/src/features/auth/use-auth-hash.ts`
- `apps/web/src/features/control-tower/HomeInbox.tsx`
- `apps/web/src/features/control-tower/proposal-card.tsx`
- `apps/web/src/features/control-tower/use-ask-command.ts`
- `apps/web/src/features/shell/Icon.tsx`
- `apps/web/src/features/workspace/ProjectDirectory.tsx`
- `apps/web/src/features/workspace/WorkHub.tsx`
- `apps/web/src/features/workspace/example.ts`
- `apps/web/src/features/workspace/workspace.css`
- `docs/agents/tasks/TASK-0131-ui-comercial.md`
- `docs/research/UI_TASTE_PROMPTS.md`
- `docs/research/assets/alaira-brand-coder-carrusel.jpg`
- `docs/research/assets/alaira-brand-paleta.png`

## Conservar

TASK-0131 (UI comercial) y el resto de cambios locales de esta lista no se revierten. La pista A no rehace paleta, tokens ni WorkHub.
