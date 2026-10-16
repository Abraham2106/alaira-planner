#!/usr/bin/env bash
# Crea un worktree local aislado; ejecutar únicamente tras asignación del Planner.
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Uso: scripts/new-agent-worktree.sh TASK-0201-auth [base-ref]" >&2
  exit 2
fi
slug="$1"
base_ref="origin/main"
if [ "$#" -eq 2 ]; then
  base_ref="$2"
fi
if [[ ! "$slug" =~ ^TASK-[0-9]{4}-[a-z0-9-]+$ ]]; then
  echo "Formato esperado: TASK-0001-slug (minúsculas y guiones)" >&2
  exit 2
fi
root="$(git rev-parse --show-toplevel)"
if [ -z "$root" ]; then
  echo "No se encontró repositorio Git." >&2
  exit 2
fi
branch="agent/$slug"
path="$(dirname "$root")/alaira-wt-$slug"
if [ -e "$path" ]; then
  echo "El directorio ya existe: $path" >&2
  exit 1
fi
if git show-ref --verify --quiet "refs/heads/$branch"; then
  echo "La rama local ya existe; reutilizar manualmente según playbook." >&2
  exit 1
fi
git fetch origin
git worktree add "$path" -b "$branch" "$base_ref"
echo "Worktree: $path"
echo "Rama: $branch"
echo "IMPORTANTE: Registrar asignación y reservas en docs/agents/REGISTRY.md por el Planner."
