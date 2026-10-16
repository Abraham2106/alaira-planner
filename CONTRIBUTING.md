# Contribución a Alaira Planner

El proyecto está en concepción. Se agradece la discusión de necesidades, escenarios, accesibilidad y arquitectura. **No se aceptarán contribuciones de código para redistribución hasta publicar licencia OSS y política de contribuciones aprobadas** ([ADR-0004](docs/architecture/adr/0004-oss-license-pending.md)); las propuestas pueden abrirse como issues o borradores.

## Antes de proponer cambios

Leer [AGENTS.md](AGENTS.md), el [índice documental](docs/INDEX.md), la [visión](docs/product/VISION.md), el [SRS](docs/requirements/SRS.md) y el [control de cambios](docs/requirements/CHANGE_CONTROL.md). Vincular cualquier propuesta a `REQ-` o registrar una `RR-` si implica nuevo requisito. No mezclar decisiones técnicas con requisitos comerciales.

## Propuesta de PR

Un PR debe indicar problema, alcance, IDs relacionados, criterios de aceptación, pruebas y evidencia, cambios de documentación, riesgos y rollback; la [plantilla de PR](.github/PULL_REQUEST_TEMPLATE.md) recoge estos campos. Los agentes usan worktree y rama propios según el [playbook](docs/agents/WORKTREE_PLAYBOOK.md); los humanos pueden usar un flujo Git equivalente. Nadie modifica el estado `accepted` de un trabajo sin revisión.

Antes de abrir el PR, ejecutar el validador que también corre en CI:

```bash
python scripts/validate_docs.py
```

Si se añade un documento bajo `docs/`, enlazarlo desde [docs/INDEX.md](docs/INDEX.md); el validador falla si queda huérfano.

## Calidad

Aplicar privilegio mínimo, pruebas automatizadas en cuanto haya código, no incorporar dependencias no revisadas, no publicar información personal y no adjudicar métricas de progreso a una persona a partir de actividad digital. Formato de commits sugerido: `docs:`, `feat:`, `fix:`, `test:`, `chore:`.

Véanse [SECURITY](SECURITY.md) y [DEFINITION_OF_DONE](docs/quality/DEFINITION_OF_DONE.md).
