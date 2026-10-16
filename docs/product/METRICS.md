# Métricas de producto, proyecto y salud de operación

**Estado:** catálogo de indicadores e hipótesis, sin mediciones. Deriva del [PRODUCT_BRIEF](PRODUCT_BRIEF.md). Propósito: aprender del producto y ayudar a los equipos. Está prohibido puntuar a individuos por mensajes, commits o respuestas.

## Métrica estrella

**PM Attention Efficiency:** porcentaje del tiempo del PM dedicado a decisiones y excepciones frente a recolectar y reconciliar información. Se mide con entrevistas y diarios de tiempo consentidos en los pilotos, no con vigilancia.

## Métricas de éxito del producto

| Métrica | Lo que demuestra | Precaución |
|---|---|---|
| % de actualizaciones capturadas sin ingreso manual del PM | reducción de administración | contar solo actualizaciones confirmadas |
| % de propuestas de IA aceptadas sin corrección | calidad contextual | segmentar por tipo de propuesta y conector |
| tiempo desde el evento real hasta la actualización del proyecto | frescura (NFR-022) | por conector, p50 y p95 |
| % de cambios con evidencia o procedencia | confiabilidad | — |
| horas semanales de administración de estado por PM | valor económico | auto-reportado en entrevistas |
| % de riesgos identificados antes del impacto | capacidad preventiva | requiere revisión posterior honesta |
| precisión del forecast de fecha | calidad del motor | comparar contra la fecha real, no contra la baseline |
| precisión del forecast de costo | calidad financiera | desde M3 |
| % de tareas desactualizadas | calidad de la verdad operacional | definir umbral de frescura por tipo |
| latencia de resolución de bloqueos | eficacia del control tower | desde M4 |
| herramientas que un ejecutor abre para reportar | fricción | entrevistas |
| interacciones desde Slack/GitHub frente a abrir la plataforma | integración real en el flujo | no es una meta de «menos uso» |

## Métricas de adopción

| Métrica | Definición | Precaución |
|---|---|---|
| Time to first value | mediana desde la creación de la organización hasta el primer paquete con responsable, criterio y evidencia vinculada | no forzarla con tutoriales |
| Ciclo de aprobación | mediana entre solicitud y decisión | segmentar por naturaleza y SLA, no por persona |
| Error de selección del bot | acciones revertidas por ambigüedad / acciones confirmadas | dispara mejoras de desambiguación |
| Retención | organizaciones activas en trabajo real N semanas después | anonimización y consentimiento |

## Métricas del proyecto cliente

**Predictivo:** avance según la estrategia de cada paquete, desviación baseline/forecast/real, hitos ganados, riesgos abiertos, AC/PV/EV y CPI/SPI por corte. **Ágil:** throughput, lead y cycle time, WIP, sprint goal, burndown, burnup, flujo acumulado, cambio de alcance y carryover; la velocidad solo se compara con el histórico del mismo equipo, nunca entre personas. `Velocity ≠ horas`, `story points ≠ costo`, `progreso ≠ tiempo registrado`. **Híbrido:** indicadores de fase y aceptación vinculados a equipos, sin doble conteo. **Finanzas:** saldo gastable y holgura de forecast por separado.

## Métricas operativas

p95 por endpoint, webhooks válidos procesados, frescura por conector, reintentos, cola pendiente, errores de autorización, reversiones, restauraciones probadas, costo de inferencia por acción, precisión de vinculación de evidencia, falsos positivos de la IA, respuestas sin cita y tasa de abstención. Todo alerta sobre degradación sin exponer datos de usuarios.

## Instrumentación

Eventos con tenant y actor seudonimizados, consentimiento y retención definidos; cohortes y agregación respetuosas con la privacidad. Cada métrica tiene dueño, fórmula, unidad, fecha de corte y segmento. Los experimentos A/B evalúan el daño potencial, no solo los clics.
