# Playbook operativo: aislamiento de tareas por Git worktree

**Aplica a agentes que editan código o documentación de forma concurrente.** El Planner decide asignación y ramas. Los comandos operan en un checkout local, no crean agentes ni worktrees en GitHub remoto.

## Preparar repo inicial

```bash
git clone https://github.com/Abraham2106/alaira-planner.git
cd alaira-planner
git fetch origin
git worktree list
```

Cuando el PR documental sea fusionado y exista `main` actualizado, el Planner puede reservar, por ejemplo, `TASK-0201` del paquete `WBS-2.1`:

```bash
git worktree add ../alaira-wt-TASK-0201-auth -b agent/TASK-0201-auth origin/main
cd ../alaira-wt-TASK-0201-auth
git status --short
```

No ejecutar un segundo `-b` con branch existente. El Planner registra la reserva en `REGISTRY.md`, comunica rutas exclusivas y comparte SRS/ADR/TASK relevantes. Un agente no edita REGISTRY ni canónicos fuera de su asignación.

## Implementar y entregar

```bash
git add <archivos-permitidos>
git commit -m "feat: implement REQ-002 under WBS-2.1"
git push -u origin agent/TASK-0201-auth
```

Crear PR con plantilla, nunca merge directo, pedir revisión independiente y actualizar tarea tras aceptación. Al cruzar cambios comunes, el Planner reordena PR o rebase controlado; evita dos agents modificando el mismo archivo.

## Limpiar

Tras merge y verificación de que no quedan cambios importantes:

```bash
git worktree list
git worktree remove ../alaira-wt-TASK-0201-auth
git branch -d agent/TASK-0201-auth
```

No usar `rm -rf` ni `git worktree remove --force` como limpieza predeterminada. Si hay trabajo no incorporado, bloquear y recuperar antes de borrar.

Documentación de referencia: https://git-scm.com/docs/git-worktree
