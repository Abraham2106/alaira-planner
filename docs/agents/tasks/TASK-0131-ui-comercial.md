# TASK-0131 — Rediseño comercial de la interfaz

- Estado: review; asignación directa del mantenedor a Codex, 2026-10-16. Implementación local terminada; revisión independiente pendiente.
- WBS: 2.6, 2.7. REQ-076, REQ-077, REQ-078, REQ-096; NFR-013.
- Alcance autorizado: rehacer composición y componentes visuales, conservando únicamente la paleta. Referencias: Planner, Jira y ClickUp. Se mantienen los contratos y las reglas de dominio.
- Ejecutor: Codex. Revisión formal independiente: pendiente; no declarar accepted.
- Rutas reservadas: apps/web/src/features/shell/, apps/web/src/styles/, apps/web/src/features/workspace/, apps/web/src/features/project/ProjectWorkspace.tsx, apps/web/src/features/control-tower/HomeInbox.tsx, apps/web/src/features/control-tower/MyWorkWorkspace.tsx, apps/web/src/main.tsx.
- Trabajo local en la copia actual por instrucción directa; sin commits ni integración en esta entrega.
- Evidencia esperada: captura desktop y móvil, navegación y filtros funcionales, typecheck/build y pruebas web existentes. Ejemplo visual explícito y separado de datos reales.
- Rollback: restaurar solo las rutas modificadas desde la copia previa en el directorio de visualizaciones de esta conversación (ui-before); no usar git reset, porque ya había cambios locales del mantenedor.
- Criterios: jerarquía de navegación comercial, lista/tablero/cronograma del mismo ejemplo, búsqueda y detalle accesibles, cero overflow de documento móvil, acceso a proyectos reales y a sus operaciones existentes.

## Dirección aplicada

Una aplicación operacional de superficies claras, navegación lateral única, datos densos y detalle lateral; carbón, marfil, arena, terracota y ocre conservados. Tipografía sans para la interfaz, sin titulares de marketing.

- Observado en [ClickUp Views](https://clickup.com/features/views): contexto de proyecto seguido por pestañas y filas agrupadas por estado. Adaptación: tres vistas sobre una misma colección, con filtro estable al cambiar de vista.
- Observado en [Jira Features](https://www.atlassian.com/software/jira/features): detalle de trabajo contextual, acciones cercanas al objeto y evidencia separada. Adaptación: panel de detalle con estado, responsable, entrega y evidencia; cambios del ejemplo explícitamente locales.
- Consultado [Microsoft Planner](https://support.microsoft.com/en-us/planner/teams/manage-your-team-s-plans-with-planner-in-teams): proyecciones de lista y cronograma del mismo trabajo. Adaptación: timeline ilustrativo con rango temporal y alternativa tabular.
- Decisión distintiva: línea terracota de vista activa y pulso de avance aceptado, separado de la actividad. El ejemplo usa conteo equiponderado; no sustituye reglas reales de avance.
- El mantenedor autorizó rehacer toda la composición y conservar solo la paleta, y aprobó el overhaul visual/CSS. No se interpretó esto como aceptación de G1 ni como permiso de despliegue.

## Verificación ejecutada

- Ran: Vitest web, **26/26**, 17 archivos; regresión My Work adaptada al nuevo flujo de filtros/vistas.
- Ran: `tsc --noEmit -p apps/web/tsconfig.json`, **OK**.
- Ran: ESLint sobre los archivos de UI nuevos y modificados en esta tarea, **OK**. Aviso previo de tipo de módulo del eslint.config raíz.
- Ran: `vite build`, **OK**, 106 módulos.
- Ran: `python scripts/validate_docs.py`, **OK**, 123 documentos Markdown.
- Ran: React Doctor changed, **79/100**, sin errores; quedan avisos de complejidad/tamaño de shell y formateadores previos. No se presenta como aprobación estética ni auditoría completa.
- Ran: Playwright desktop 1440×1000 y 1280×800; móvil 390×844. Sin overflow horizontal del documento. Móvil convierte filas a disposición apilada preservando estado, persona y entrega.
- Ran: lista/tablero/timeline (8 objetos), búsqueda (1 coincidencia), filtro En revisión (2), aceptación local (38 → 50 %), creación local, búsqueda de navegación Ctrl K y cierre Escape. Detalle móvil y Tab/Escape verificados.
- Ran: directorio de proyectos reales; la API local respondió 403 y se mostró el error con acceso a iniciar sesión. No se crearon proyectos reales durante esta validación.
- Manual: contraste y jerarquía revisados sobre capturas; se aumentaron fuentes y oscurecieron metadatos tras la primera pasada. No se afirma cumplimiento WCAG integral.
- Limitación: el escáner estático de estados no reconoce `creating` como submitting; el estado existe con botón deshabilitado y texto Creando. Su heurística quedó registrada, no se adulteró para hacerla pasar.
- Limitación: visual_smoke_test por fetch falló por conexión desde el entorno shell; las verificaciones reales en navegador se ejecutaron con Playwright.
- Skipped: prueba completa autenticada de escritura contra API y axe; no hubo una sesión autorizada ni se instaló axe para esta tarea.

Capturas y copia previa recuperable: directorio de visualizaciones de esta conversación `01a142e5-f4df-7c21-bc1f-9aca7631ef63`, archivos `alaira-desktop.png`, `alaira-desktop-full.png`, `alaira-mobile.png`, `alaira-board.png`, `alaira-timeline.png`; respaldo `ui-before/`.

Sin dependencias nuevas, commits, push ni despliegue. Los cambios previos del mantenedor se conservaron.

## Corrección solicitada por el mantenedor

Se eliminaron las barras como separadores visibles: el encabezado usa «Plan de trabajo», el conteo dice «3 de 8» y el asistente se identifica como «Asistente del proyecto». La navegación jerárquica conserva enlaces con cheurones, sin introducir etiquetas parent/tag.
