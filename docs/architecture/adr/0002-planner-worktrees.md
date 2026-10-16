# ADR-0002 — Planificador central y worktree exclusivo por tarea

- **Estado:** Proposed (mandato operativo inicial)
- **Fecha:** 2026-10-15
- **Relacionados:** WBS-1.4, AGENTS.md

## Contexto

Múltiples agentes producen cambios concurrentes y pueden sobrescribir contexto, editar archivos comunes o aprobar sin independencia.

## Alternativas

- A: agentes sobre el mismo checkout (colisiones inevitables).
- B: clones totalmente independientes (aislamiento, pero más costo de configuración).
- C: `git worktree` por ticket y branch exclusiva, despacho y reservas por Planner (aislamiento ligero, requiere disciplina de integración).

## Decisión propuesta

Opción C. Planner único consolida tareas y registro; implementador trabaja sólo en su worktree; QA revisa separadamente; merge con controles. Los documentos canónicos se editan mediante asignación explícita, sin escrituras simultáneas del registro.

## Consecuencias

Proveer scripts de creación/limpieza en WBS-1.4, naming, bloqueo por rutas y CI. Las tareas puramente documentales también usan rama/worktree cuando se ejecutan en paralelo. No equiparar worktree remoto con servicio GitHub; es una característica local de Git.
