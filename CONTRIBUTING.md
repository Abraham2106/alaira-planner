# Contribución a Alaira Planner

El proyecto está en concepción. Se agradece la discusión de necesidades, escenarios, accesibilidad y arquitectura. **No se aceptarán contribuciones de código para redistribución hasta publicar licencia OSS y política de contribuciones aprobadas**; las propuestas pueden abrirse como issues o borradores.

## Antes de proponer cambios

Leer `AGENTS.md`, la [visión](docs/product/VISION.md), el [SRS](docs/requirements/SRS.md) y [control de cambios](docs/requirements/CHANGE_CONTROL.md). Vincular cualquier propuesta a `REQ-` o registrar una `RR-` si implica nuevo requisito. No mezclar decisiones técnicas con requisitos comerciales.

## Propuesta de PR

Un PR debe indicar problema, alcance, IDs relacionados, criterios de aceptación, pruebas y evidencia, cambios de documentación, riesgos y rollback. Los agentes usan worktree y rama propios; los humanos pueden usar un flujo Git equivalente. Nadie modifica el estado `accepted` de un trabajo sin revisión.

## Calidad

Aplicar privilegio mínimo, pruebas automatizadas en cuanto haya código, no incorporar dependencias no revisadas, no publicar información personal y no adjudicar métricas de progreso a una persona a partir de actividad digital. Formato de commits sugerido: `docs:`, `feat:`, `fix:`, `test:`, `chore:`.

Véanse `SECURITY.md` y `docs/quality/DEFINITION_OF_DONE.md`.
