# Prompts para rehacer la UI de Alaira Planner con la identidad de Alaira

**Estado:** procedimiento propuesto (2026-10-16). No es requisito ni ADR. **Relación:** [UX_IA](../product/UX_IA.md) (autoridad de diseño), [PRODUCT_BRIEF](../product/PRODUCT_BRIEF.md), [SRS](../requirements/SRS.md) (REQ-076, REQ-078, REQ-096, NFR-013).

**Para qué sirve:** rehacer la UI actual de `apps/web` (hoy es un esqueleto técnico) para que se vea y se sienta como Alaira. Los prompts de §5 se pegan tal cual en un agente de código. Pegar siempre el **prompt 0** primero.

**Referencias visuales oficiales** (adjuntarlas al agente junto con el prompt):

- [Carrusel Alaira CodeR](assets/alaira-brand-coder-carrusel.jpg): tono, tipografía y la tarjeta de comentario del bot (lámina 6/7), que es la referencia de producto más directa.
- [Paleta de trabajo](assets/alaira-brand-paleta.png): los cinco colores base.

## 1. La identidad de Alaira, leída de las referencias

| Elemento | Qué se ve | Qué significa para el producto |
|---|---|---|
| Paleta | Marfil `#FAF7F1`, Carbón `#252724`, Terracota `#A34229`, Ocre `#D7A536`, Arena `#DFCFB8` | Neutros cálidos, no grises azulados. Terracota y ocre son los únicos colores con carga. |
| Titulares | Serif editorial, grande, frases cortas que terminan en punto («Tu código puede permanecer en tu infraestructura.») | Títulos de página y de sección en serif; todo lo demás en sans. |
| Texto | Sans limpia, tamaño contenido, mucho aire alrededor del titular | Cuerpo y UI en sans, jerarquía por tamaño y peso, no por color. |
| Énfasis | Una palabra en terracota dentro del titular («en **tu infraestructura**») | El terracota se usa poco y con intención; no colorea superficies grandes. |
| Logo | Marca en rombo terracota-ocre + «ALAIRA» en mayúsculas espaciadas | Único lugar donde se permite degradado. |
| Material | Vidrio ámbar, piedra, luz cálida lateral, sombras largas | **Solo marketing.** En la app se traduce a superficies planas marfil y bordes finos; a lo sumo una imagen de marca en login y estados vacíos. |
| Tarjeta de producto (6/7) | Tarjeta marfil, avatar con el logo, «codeR · bot · hace 2 horas», etiqueta «⚠ Riesgo alto» en terracota, texto breve, diff con números de línea en mono | Patrón base para propuestas de IA, evidencia y comentarios en Alaira Planner. |
| Voz | Voseo rioplatense («Analizá», «necesitás»), frases declarativas, sin exclamaciones | La UI habla igual: directa, en segunda persona, sin «¡Bienvenido!» ni «Oops». |

**Confirmar con el mantenedor:** la tipografía exacta de los titulares (no está en los archivos) y si el voseo se usa también dentro del producto o solo en marketing.

## 2. Traducción de marca a tokens de producto

La marca está pensada para piezas de marketing; una app densa necesita más tonos. Lo siguiente **deriva** de la paleta. Los colores marcados «extensión» no están en la paleta oficial y el mantenedor debe aprobarlos.

### 2.1 Modo claro (por defecto)

| Token | Valor | Uso | Contraste aprox. |
|---|---|---|---|
| `bg` | Marfil `#FAF7F1` | fondo de la app | — |
| `surface` | `#FFFFFF` | tablas, paneles, tarjetas | — |
| `surface-subtle` | Arena `#DFCFB8` al 30–40 % | hover, fila seleccionada, chips neutros | decorativo |
| `text` | Carbón `#252724` | texto principal | 14:1 sobre marfil |
| `text-muted` | `#5E5F5A` (extensión) | metadatos, fechas, ayudas | ≈6:1 |
| `border` | Arena `#DFCFB8` | divisores decorativos | 1.4:1, **no** sirve para bordes de inputs |
| `border-strong` | `#8C7B66` (extensión) | bordes de inputs, celdas editables | ≈3.8:1 (cumple 3:1 de componentes) |
| `primary` | Carbón `#252724`, texto marfil | botón primario | 14:1 |
| `accent` | Terracota `#A34229` | foco, selección activa, enlaces, énfasis, ruta crítica, riesgo | ≈5.8:1, sirve como texto |
| `attention` | Ocre `#D7A536` | pendiente de humano, propuesta, forecast | ≈2.1:1: **solo relleno con texto carbón encima** (≈6.7:1), nunca texto ocre |
| `success` | `#4F6B3A` (extensión, oliva) | aceptado | ≈5.6:1 |
| `focus-ring` | Terracota, 2 px + 2 px de separación | foco de teclado | ≈5.8:1 |

### 2.2 Modo oscuro

| Token | Valor |
|---|---|
| `bg` | `#1A1B19` (extensión) |
| `surface` | Carbón `#252724` |
| `text` | Marfil `#FAF7F1` (≈14:1) |
| `accent` | Terracota claro `#D9714F` (extensión; ≈4.6:1 sobre carbón; el terracota base no llega a 3:1) |
| `attention` | Ocre `#D7A536` (≈6.7:1 sobre carbón, aquí sí sirve como texto) |
| `success` | `#9DB37E` (extensión) |

### 2.3 Tipografía

- **Titulares (página, sección, estados vacíos):** la serif de la marca. Si no se dispone del archivo, usar **Newsreader** o **Source Serif 4** (licencia OFL, compatibles con Apache-2.0) y avisar al mantenedor.
- **UI y cuerpo:** **IBM Plex Sans** 400/600.
- **IDs, fechas, números tabulares, código:** **IBM Plex Mono**.
- Escala: 12 / 13 / 14 / 16 / 20 px en UI; 28 / 36 px solo para títulos serif de página.

### 2.4 Los 7 estados de confianza (UX_IA §1)

Cada estado lleva **ícono + etiqueta + color**. El color nunca va solo.

| Estado | Tratamiento |
|---|---|
| Actividad | texto muted, sin fondo |
| Evidencia | ícono de enlace o documento, chip arena |
| Propuesta de IA | borde punteado ocre, etiqueta «Propuesta», avatar del bot como en la tarjeta 6/7 |
| Solicitud de finalizar | chip ocre sólido, texto carbón, «Pendiente de aceptar» |
| Aceptado | chip oliva, check, nombre de quien aceptó y hora |
| Sincronización pendiente | ícono de reloj, texto muted |
| Predicción / forecast | patrón rayado ocre, etiqueta «Forecast» |
| *Riesgo, error, denegado* | chip terracota con ⚠, motivo literal |

**Gantt:** baseline = contorno carbón; forecast = barra rayada ocre; real = barra sólida carbón; ruta crítica = marca terracota + etiqueta «Crítica». Leyenda siempre visible.

## 3. Reglas de taste

**Personalidad:** editorial y cálida como la marca, pero es un instrumento de trabajo. Serena, precisa, sin ruido. Un PM con 30 segundos entre reuniones tiene que ver qué decisión necesita hoy y por qué.

**Compromisos cuando la especificación es ambigua:**

| Ante… | Elegir | Sobre |
|---|---|---|
| Densidad vs. aire | tablas densas (filas 32–36 px) con aire alrededor del título | tarjetas espaciosas en grid |
| Tabla vs. tarjetas | tabla; tarjeta solo para propuestas y comentarios (patrón 6/7) | grid de tarjetas |
| Color | marfil y carbón dominan; terracota y ocre solo con significado | colorear superficies grandes |
| Mostrar todo vs. excepciones | lo que necesita decisión primero | dashboards completos |
| Éxito | solo cuando el backend confirma | «¡Listo!» optimista |
| IA | dentro de la decisión, con evidencia citada | chat flotante o banners |
| Marketing vs. producto | superficies planas | vidrio, luz dramática, 3D dentro de la app |

**Lista de rechazo** (rehacer si aparece más de una):

1. Inter, Roboto o fuente de sistema como única fuente.
2. Degradados violeta/índigo o cualquier degradado fuera del logo.
3. Grises azulados; blanco puro como fondo de la app (el fondo es marfil).
4. Terracota como relleno de superficies grandes o en más de un elemento compitiendo por atención.
5. Texto ocre sobre marfil.
6. Grid de tres tarjetas con ícono, título y texto.
7. `rounded-2xl` en todo (usar 4 px en controles, 8 px en tarjetas, 0 en tablas).
8. Vidrio, blur, luz dramática o renders 3D dentro de pantallas de trabajo.
9. Hero o «¡Bienvenido!» en una app de trabajo; «Oops, algo salió mal».
10. Color como única señal de estado.
11. Más de un sidebar visible a la vez.
12. Íconos inventados o mezclados de varios sets.

## 4. Patrones tomados de otras herramientas

Resumen de la investigación del Anexo A, aplicado a Alaira:

| Patrón | De quién | Dónde |
|---|---|---|
| Un solo sidebar colapsable (`Ctrl+[`) + top bar con búsqueda y Crear | Jira | shell |
| Bandeja que se vacía, densidad denso/detallado, vistas guardadas, acciones masivas | Slack Activity | Inicio, Mi trabajo |
| Mensaje que se condensa a una línea de registro tras actuar | Slack Block Kit | propuestas, bot de Slack |
| Grid editable como vista principal del plan | Microsoft Planner | WBS |
| Timeline con ruta crítica | Microsoft Planner | Gantt |
| Lista + panel de detalle persistente | lo que Jira quitó y sus usuarios extrañan | WBS, evidencia, propuestas |
| «Hoy / Vencidas / Prioridades» como centro del día | ClickUp My Tasks | Mi trabajo |
| **Evitar:** varios sidebars, banners de IA, metodología detrás de paywall | ClickUp, Planner | — |

## 5. Prompts

Sustituir `{…}`. Adjuntar las dos imágenes de referencia en cada sesión.

### Prompt 0 — Contexto de marca y producto (siempre primero)

```text
Sos diseñador de producto senior y frontend engineer de Alaira. Vas a rehacer la UI de
Alaira Planner (apps/web: React 19 + Vite + TypeScript; API Fastify en /api/v1).
Adjunto dos referencias oficiales de marca: el carrusel de Alaira CodeR y la paleta.

IDENTIDAD
- Paleta: Marfil #FAF7F1 (fondo), Carbón #252724 (texto y botón primario), Terracota #A34229
  (acento, foco, riesgo, ruta crítica), Ocre #D7A536 (pendiente de humano, propuesta, forecast;
  solo como relleno con texto carbón encima), Arena #DFCFB8 (superficies sutiles y divisores).
  Extensiones: text-muted #5E5F5A, border-strong #8C7B66 (inputs), success oliva #4F6B3A.
  Modo oscuro: bg #1A1B19, surface #252724, texto marfil, acento terracota claro #D9714F.
- Tipografía: titulares de página en serif editorial ({SERIF_DE_MARCA} o Newsreader);
  UI en IBM Plex Sans 400/600; IDs, fechas, números y código en IBM Plex Mono.
- Voz: voseo, frases cortas y declarativas, sin exclamaciones.
- La tarjeta de comentario del bot (lámina 6/7) es el patrón para propuestas de IA:
  tarjeta clara, avatar con el logo, nombre + "bot" + tiempo relativo, chip de estado,
  texto breve, diff o evidencia en mono con números de línea.
- El vidrio ámbar, la luz dramática y los objetos 3D son de marketing: NO van en pantallas de trabajo.

QUIÉN LO USA
- PM con 30 segundos entre reuniones: qué decisión necesita hoy y por qué, sin recorrer tareas.
- Ejecutores: qué hacer hoy, qué espera a otros, qué necesita su confirmación.

REGLAS DE PRODUCTO (no negociables)
- Evidencia ≠ progreso: el avance solo cambia cuando una persona acepta.
- Baseline ≠ forecast ≠ real: baseline contorno carbón, forecast rayado ocre, real sólido carbón.
- El motor determinista manda sobre las fechas; la IA propone con evidencia y criterios cumplidos/pendientes.
- Siete estados distintos, cada uno con ícono + etiqueta + color: actividad, evidencia, propuesta de IA,
  solicitud de finalizar, aceptado, sincronización pendiente, predicción. Riesgo/error en terracota con ⚠.
- Decir Personas, Equipos y Capacidad; nunca "recursos" para personas.
- Fechas con zona horaria explícita. WCAG 2.2 AA. Éxito solo cuando el backend confirma.

COMPROMISOS
- Tabla sobre tarjetas (tarjeta solo para propuestas y comentarios). Filas de 32–36 px.
- Marfil y carbón dominan; terracota y ocre solo con significado, nunca en superficies grandes.
- Excepciones primero. IA dentro de la decisión, nunca en banners ni burbuja flotante.
- Radios: 4 px controles, 8 px tarjetas, 0 tablas. Sombras solo en elementos flotantes.
- Un solo set de íconos real ({Lucide|Phosphor}). Componentes: shadcn/ui sobre Radix, re-tematizado.
- Layout: un solo sidebar colapsable (Ctrl+[) + top bar (búsqueda, Ask/Command con Ctrl+K, Crear,
  fecha y zona) + área principal + panel derecho opcional para detalle.

RECHAZÁ TU PROPIO RESULTADO SI APARECE
Inter/Roboto/system como única fuente; degradados fuera del logo; grises azulados; fondo blanco
puro de app; terracota en superficies grandes; texto ocre sobre marfil; grid de 3 tarjetas con ícono;
rounded-2xl en todo; vidrio/blur/3D en pantallas de trabajo; "¡Bienvenido!" u "Oops"; color como
única señal; más de un sidebar; íconos inventados.

FORMA DE TRABAJAR
1. Antes de escribir código, en 5 líneas: qué debe entender el usuario apurado, jerarquía (1º, 2º, 3º)
   y qué omitís a propósito.
2. Implementá una sola pasada, dentro de las rutas que te indique la tarea.
3. Revisá contra la lista de rechazo; si fallás en más de un punto, rehacé antes de entregar.
4. Entregá: archivos cambiados, decisiones tomadas, lo que dejaste fuera y cómo verlo en
   http://localhost:5173.
Solo datos sintéticos. No inventes endpoints: usá los de apps/web/src/features/*/api.ts.
```

### Prompt 1 — Tokens, tipografía y página de referencia

```text
Tarea: reemplazar apps/web/src/styles/tokens.css, shell.css y focus.css por el sistema de la §2
(modo claro y oscuro con prefers-color-scheme y un atributo data-theme para forzarlo).
Incluí: neutros derivados de marfil/arena/carbón, acento terracota (base, hover, subtle),
attention ocre, success oliva, los 7 estados de confianza + riesgo (fg/bg/border cada uno),
tokens de baseline/forecast/real (incluido el patrón rayado), tipografía (serif de titulares,
Plex Sans, Plex Mono, cargadas localmente, sin CDN de terceros), espaciado base 4 px
(4/8/12/16/24/32/48), radios, sombras solo para flotantes y anillo de foco terracota.
Creá una página interna #/design que muestre todos los tokens, la escala tipográfica,
los estados lado a lado, botones, inputs y una tarjeta de propuesta estilo lámina 6/7.
Reportá el contraste real de cada combinación de texto sobre fondo.
```

### Prompt 2 — Shell y navegación

```text
Tarea: rediseñar apps/web/src/features/shell/ con la identidad de Alaira.
- Sidebar único sobre marfil, colapsable (Ctrl+[ y botón), recuerda el estado.
  Arriba: logo en rombo + "ALAIRA" en mayúsculas espaciadas (pedime el SVG si no está; no lo dibujes).
  Secciones: Inicio, Mi trabajo, Proyectos (con los proyectos recientes debajo); abajo Configuración.
  Ítem activo: barra terracota de 2 px a la izquierda + texto carbón 600, sin fondo de color.
- Top bar: tenant, búsqueda, Ask/Command (Ctrl+K), botón Crear (primario carbón), fecha y hora con zona en mono.
- Título de cada página en serif, a la izquierda, con una línea de contexto en sans muted debajo.
- Eliminá el bloque "POC feature (autodiscovered)" y cualquier texto de depuración visible.
- Panel derecho reutilizable para detalle: se abre al seleccionar una fila, Esc lo cierra, no tapa la lista.
- Enlace "Saltar al contenido", landmarks correctos, foco al cambiar de página.
```

### Prompt 3 — Inicio: bandeja de decisiones

```text
Tarea: pantalla Inicio para un PM. Es una bandeja que se vacía, no un dashboard.
Título serif: "Lo que necesita tu decisión." (o equivalente aprobado).
1. "Necesita tu decisión" (N): propuestas de IA, solicitudes de finalizar y cambios de riesgo en hitos.
   Fila: chip de estado (ícono + etiqueta), objeto, proyecto, por qué ahora (una línea),
   antigüedad en mono, acción primaria. Al abrirla, panel derecho con la tarjeta estilo 6/7.
2. "Hitos en riesgo": hito, baseline, forecast, Δ días (terracota si es atraso), causa principal.
3. "Evidencia sin actualizar": paquetes con trabajo real pero sin confirmación.
Densidad denso/detallado conmutable, vistas guardadas como pestañas, selección y acciones masivas.
Estado vacío en serif: "Nada necesita tu decisión." + "Último recálculo: {hora y zona}" en mono.
Sin tarjetas KPI grandes, sin gráficos decorativos, sin ilustraciones.
```

### Prompt 4 — Mi trabajo

```text
Tarea: Mi trabajo para un ejecutor (apps/web/src/features/control-tower/MyWorkWorkspace.tsx).
Secciones: Hoy, En progreso, Esperando a alguien, Necesita tu confirmación.
"Necesita tu confirmación" usa la tarjeta estilo lámina 6/7: avatar del bot, "Alaira · bot · hace 2 h",
chip "Propuesta" (borde punteado ocre), texto breve, evidencia citada (p. ej. PR #844 mergeado)
en mono, criterios cumplidos ✓ y pendientes ○, porcentaje propuesto, y botones
Confirmar (primario carbón) / Corregir / Rechazar.
Cuando el backend confirma, la tarjeta se condensa a una línea: "Confirmado por vos · 14:02 GMT-6",
con chip oliva "Aceptado". Si falla, chip terracota con el motivo literal y nada cambia.
```

### Prompt 5 — WBS: grid + detalle

```text
Tarea: rediseñar apps/web/src/features/wbs/ como grid editable con panel de detalle a la derecha.
Columnas: código WBS (mono), nombre (árbol con indentación y expandir/colapsar), tipo, responsable,
estrategia de progreso, peso, avance aceptado, estado de aceptación (chip), inicio y fin forecast (mono).
El avance del padre se muestra calculado, no editable, con un tooltip que explica la fórmula ponderada.
Teclado: flechas para moverse, Enter para editar, Esc para cancelar; errores de validación junto a la celda.
Celdas editables con borde border-strong al enfocar; fila seleccionada con fondo arena suave.
Panel derecho: criterios de aceptación, evidencia vinculada (tarjetas 6/7) e historial del ítem.
Nunca mostrar avance derivado de subtareas como si estuviera aceptado.
```

### Prompt 6 — Timeline / Gantt

```text
Tarea: rediseñar apps/web/src/features/gantt/. Tabla y Gantt sincronizados (misma selección y scroll vertical).
- Baseline: contorno carbón 1 px. Forecast: barra rayada ocre. Real: barra sólida carbón.
- Ruta crítica: marca terracota a la izquierda de la barra + etiqueta "Crítica" en la fila.
- Dependencias: líneas finas carbón muted; tipo (FS/SS/FF/SF) y lag en tooltip.
- Línea de hoy en terracota con fecha y zona en mono. Escala día/semana/mes, zoom por teclado.
- Leyenda siempre visible. Alternativa tabular completa navegable por teclado (REQ-028).
- Solo lectura sobre la baseline: no se puede arrastrar para cambiarla.
```

### Prompt 7 — Propuesta de IA y Ask/Command

```text
Tarea: componente de propuesta de IA y barra Ask/Command (Ctrl+K)
(apps/web/src/features/control-tower/AskCommandPanel.tsx).
La propuesta usa la tarjeta estilo lámina 6/7, en este orden:
1. Qué cambia (antes → después) en una línea.
2. Evidencia citada con enlaces, en mono si es código o ID.
3. Criterios cumplidos ✓ / pendientes ○.
4. Consecuencias calculadas por el motor: fechas e hitos afectados; qué NO cambia (la baseline).
5. Nivel de autonomía (informar / proponer / controlado) y quién puede confirmar.
6. Confirmar / Ver cambios / Rechazar con motivo.
Si la política deniega: chip terracota "Denegado", motivo literal y permiso que falta.
Ask/Command: paleta de comandos centrada sobre marfil, sin burbuja de chat; respuestas con fuentes;
los comandos que mutan muestran la propuesta antes de ejecutar.
```

### Prompt 8 — Entrar y primer proyecto

```text
Tarea: pantallas de registro de organización, login y primer proyecto.
Endpoints: POST /api/v1/iam/tenants/register y POST /api/v1/iam/auth/login (cookie de sesión;
token CSRF en el header x-alaira-csrf para escrituras).
Login: columna izquierda con el formulario sobre marfil (logo, título serif corto, organización,
email, contraseña); columna derecha con UNA imagen de marca del carrusel (es el único lugar
de la app donde se permite el material de marketing). En pantallas angostas la imagen desaparece.
Errores específicos y accesibles, en voz de Alaira.
Primer proyecto: nombre → plantilla → delivery_profile (predictivo / ágil / híbrido, una línea cada uno)
→ proyecto vacío con avance real 0 % y el siguiente paso sugerido.
```

### Prompt 9 — Mensajes de Slack con la voz de Alaira

```text
Tarea: mensajes Block Kit del bot para: evidencia detectada, propuesta de avance para confirmar,
resultado tras confirmar y acción denegada por política.
Reproducí la estructura de la tarjeta 6/7: nombre del bot, chip de estado como texto con emoji
de apoyo (el significado no puede depender del emoji), texto breve, evidencia en bloque de código.
Una acción primaria; valores por defecto que reduzcan la decisión a sí/no; etiquetas en todos los inputs.
Al terminar, reemplazar el mensaje por una línea de registro: quién, qué y cuándo.
Ofrecer un resumen diario en lugar de un mensaje por evento. Entregá el JSON de bloques.
```

### Prompt 10 — Variantes antes de decidir

```text
Para {PANTALLA}, proponé 3 direcciones distintas que respeten el prompt 0:
A) máxima densidad (tabla primero, casi sin tarjetas),
B) editorial (más presencia de la serif y del aire de la marca, misma información),
C) foco (una decisión a la vez, el resto colapsado).
Para cada una: captura o descripción precisa, qué sacrifica y para qué usuario es mejor.
No elijas vos: terminá con la pregunta para el mantenedor.
```

### Prompt 11 — Crítica con capturas (después de cada pasada)

```text
Te adjunto capturas de {PANTALLA} a 1440, 768 y 390 px, y las referencias de marca.
Actuá como crítico exigente, no como autor. En este orden:
1. ¿Qué entiende un PM apurado en 5 segundos? ¿Es lo correcto?
2. ¿Se reconoce como Alaira al lado del carrusel? ¿Qué lo aleja (color, tipografía, voz, densidad)?
3. Lista de rechazo: cada punto que aparece, con su ubicación.
4. Jerarquía: ¿hay un punto focal? ¿Qué compite con él? ¿Hay terracota de más?
5. Elementos que sobran.
6. ¿Se distinguen los estados sin color?
7. Contraste dudoso, foco invisible, objetivos menores a 24 px.
8. Las 3 correcciones de mayor impacto, ordenadas.
No cambies código hasta que el mantenedor apruebe las correcciones.
```

### Prompt 12 — Accesibilidad

```text
Auditá {PANTALLA} contra WCAG 2.2 AA (NFR-013): orden y visibilidad del foco, nombres accesibles,
landmarks, anuncios de estado (aria-live solo con éxito o error confirmados), contraste de texto y
de componentes (prestá atención a ocre y arena), objetivos de 24×24 px o más, color no como única
señal, prefers-reduced-motion y zoom al 200 %. Ejecutá axe si está disponible; si no, reportá not_run.
Listá hallazgos con severidad y corregí solo P0 y P1. Reportá qué probaste y qué no.
```

## 6. Ciclo de trabajo

1. El mantenedor confirma: tipografía de titulares, uso del voseo en producto y los colores «extensión» de §2. También entrega el SVG del logo.
2. Prompt 0 + 1 (tokens y `#/design`). Revisión visual contra el carrusel.
3. Prompt 0 + 2 (shell) → prompt 11 con capturas → corrección.
4. Por cada pantalla: prompt 10 → el mantenedor elige → prompt de la pantalla → prompt 11 → prompt 12.
5. Cada crítica aceptada se suma a §3 (lista de rechazo o compromisos), así el siguiente agente arranca con mejor criterio.

Orden sugerido: tokens → shell → login y primer proyecto → Inicio → Mi trabajo → propuesta de IA → WBS → Gantt → Slack.

Cada pasada de implementación necesita una ficha TASK y reserva de rutas del Planner ([AGENTS.md](../../AGENTS.md) §3); los prompts no la reemplazan.

## Anexo A — Investigación de soporte

### A.1 Qué es taste y qué le falta a la IA

Taste es elegir qué es correcto para un público y un momento cuando los datos ya no deciden, y responder por esa elección ([Field Vision](https://fieldvisiongroup.com/blog/ai-slop-what-taste-means/), [evolving.work](https://evolving.work/blog/ai-will-make-taste-more-valuable-not-less/)). Anthropic usa el término para «outputs que un practicante experto consideraría gran trabajo» ([Axios](https://www.axios.com/2026/04/19/ai-taste-anthropic-claude-opus)); la crítica académica distingue *craft* (competencia) de *taste* (juicio con contexto que el texto no contiene) ([Zenodo](https://doi.org/10.5281/zenodo.19556058)).

Sin restricciones, los modelos convergen a la media: Inter, degradado violeta, hero centrado, tres tarjetas ([Anthropic](https://claude.com/blog/improving-frontend-design-through-skills), [Superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic)). No ven su resultado y los más pulidos esconden más errores de contraste y espaciado ([02UI](https://02ui.com/blog/claude-4-7-vs-4-6-ui-design-test/)). Lo que funciona: opiniones curadas y explícitas, prohibiciones con su alternativa ([anthropics/skills#210](https://github.com/anthropics/skills/pull/210)) y un ciclo de capturas y crítica ([Sirui Tao](https://dylantao.github.io/blog/2026/website-redesign-ai-agent/)). Por eso este documento fija una identidad concreta en lugar de pedir «una UI bonita».

**¿Solo Opus 5.5 tiene taste?** No según los benchmarks de octubre de 2026: en [Design Arena](https://genmagic.co/benchmarks/da-ui) Muse Wonder (1392) supera a Opus 5.5 y Sonnet 5.5 (1378, empatados); en [Rams Index](https://www.rams.ai/benchmark) GPT-6.1 Sol (65.4) queda por delante de Opus 5.5 (60.4), dentro del ruido. Los mejores modelos tienen mejores valores por defecto; el taste lo aporta quien fija las restricciones.

### A.2 Benchmark de interfaces

- **ClickUp 4.0:** jerarquía Workspace → Spaces → Folders → Lists → Tasks ([ayuda](https://help.clickup.com/hc/en-us/articles/13856392825367-Intro-to-the-Hierarchy)). Se valoran My Tasks, Workload y la tarea con panel derecho ([ZenPilot](https://www.zenpilot.com/blog/clickup-4-review/)). Quejas: dos o tres sidebars a la vez, navegación global imposible de ocultar, Inbox difícil de alcanzar y banners de IA ([1](https://feedback.clickup.com/feature-requests/p/too-many-sidebars-open-simultaneously-especially-when-viewing-docs), [2](https://feedback.clickup.com/feature-requests/p/hide-global-nav-sidebar-in-40), [3](https://feedback.clickup.com/feature-requests/p/pin-inbox-and-my-work-directly-in-the-sidebar-global-nav-40), [4](https://feedback.clickup.com/feature-requests/p/disable-clickup-brain-banners-in-task-view)).
- **Microsoft Planner (ex Project for the web):** Grid, Board, Schedule y Charts; en premium, Timeline con dependencias, ruta crítica, People, sprints y baselines ([Microsoft](https://support.microsoft.com/en-us/planner/compare-microsoft-planner-basic-vs-premium-plans)). La metodología queda tras licencia, al revés que [ADR-0004](../architecture/adr/0004-oss-license-pending.md).
- **Jira:** sidebar único, colapsable y personalizable; top bar con búsqueda y Create; `Ctrl+[` ([Atlassian](https://support.atlassian.com/jira-software-cloud/docs/what-is-the-new-navigation-in-jira/), [sidebar](https://community.atlassian.com/forums/Navigation-Refresh-articles/A-full-height-sidebar-for-better-navigation/ba-p/3144347), [design system](https://atlassian.design/components/navigation-system/migration-guide)). Quejas: espacio en blanco y secciones de plugins en la vista de issue ([JRACLOUD-95229](https://jira.atlassian.com/browse/JRACLOUD-95229)) y la eliminación de la vista lista + detalle ([comunidad](https://community.atlassian.com/forums/Jira-articles/Preview-Panels-will-soon-replace-the-detail-view-in-Jira-s/ba-p/3196999/page/2)).
- **Slack:** Activity como bandeja con layouts denso/detallado, vistas guardadas y acciones masivas ([Slack](https://slack.com/blog/news/slack-activity-triage-for-notifications)); señales sin navegar («Bloops», «Peeks») ([Slack Design](https://slack.design/articles/a-new-visual-language-for-slack/)); Block Kit: conciso, revelación progresiva, valores por defecto y mensajes que se condensan al terminar ([Block Kit](https://docs.slack.dev/concepts/designing-with-block-kit), [App design](https://docs.slack.dev/concepts/app-design)).

### A.3 Límites

No se probaron las herramientas con cuentas reales. Rams Index es provisional y usa juez IA; Design Arena mide preferencia humana en prompts genéricos. Los contrastes de §2 se calcularon a partir de los valores hex y deben verificarse con una herramienta. La dirección no está validada con usuarios: contrastarla con el discovery de [TASK-0003](../agents/tasks/TASK-0003-discovery.md).
