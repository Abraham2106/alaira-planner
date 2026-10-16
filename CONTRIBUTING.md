# Contribución a Alaira Planner

El proyecto tiene G0 aprobado y empieza su construcción. Se aceptan contribuciones de documentación y de código bajo la [Licencia Apache 2.0](LICENSE) ([ADR-0004](docs/architecture/adr/0004-oss-license-pending.md)). Las ideas y necesidades pueden abrirse como issues.

## Certificado de origen (DCO)

Cada commit debe llevar la firma del [Developer Certificate of Origin](https://developercertificate.org/), con la que certificas que tienes derecho a aportar el cambio bajo la licencia del proyecto:

```bash
git commit -s -m "docs: ..."
```

Esto añade `Signed-off-by: Nombre <correo>` al mensaje. Los PR con commits sin firma no se fusionan. No se requiere CLA.

## Antes de proponer cambios

Leer [AGENTS.md](AGENTS.md), el [índice documental](docs/INDEX.md), el [product brief](docs/product/PRODUCT_BRIEF.md), el [SRS](docs/requirements/SRS.md) y el [control de cambios](docs/requirements/CHANGE_CONTROL.md). Vincular cualquier propuesta a `REQ-` o registrar una `RR-` si implica nuevo requisito. No mezclar decisiones técnicas con requisitos comerciales.

## Propuesta de PR

Un PR debe indicar problema, alcance, IDs relacionados, criterios de aceptación, pruebas y evidencia, cambios de documentación, riesgos y rollback; la [plantilla de PR](.github/PULL_REQUEST_TEMPLATE.md) recoge estos campos. Los agentes usan worktree y rama propios según el [playbook](docs/agents/WORKTREE_PLAYBOOK.md); los humanos pueden usar un flujo Git equivalente. Nadie modifica el estado `accepted` de un trabajo sin revisión.

Antes de abrir el PR, ejecutar el validador que también corre en CI:

```bash
python scripts/validate_docs.py
```

Si se añade un documento bajo `docs/`, enlazarlo desde [docs/INDEX.md](docs/INDEX.md); el validador falla si queda huérfano.

## Calidad

Aplicar privilegio mínimo, pruebas automatizadas en cuanto haya código, no incorporar dependencias no revisadas ni con licencias incompatibles con Apache-2.0, usar solo datos sintéticos en pruebas y demos, no publicar información personal y no adjudicar métricas de progreso a una persona a partir de actividad digital. Formato de commits sugerido: `docs:`, `feat:`, `fix:`, `test:`, `chore:`.

Véanse [SECURITY](SECURITY.md) y [DEFINITION_OF_DONE](docs/quality/DEFINITION_OF_DONE.md).
