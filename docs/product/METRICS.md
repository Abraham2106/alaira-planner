# Métricas de producto, proyecto y salud de operación

**Estado:** catálogo de indicadores e hipótesis, sin mediciones. Propósito: aprender del producto y ayudar a equipos; prohibido puntuar individuos por mensajes, commits o respuestas.

## Métricas de producto

| Métrica | Definición | Precaución |
|---|---|---|
| Time to first value | tiempo mediano de organización creada a primer paquete válido con responsable/criterio | no manipular forzando tutorial |
| Tasa de evidencia aceptable | entregables con evidencia válida / entregables sometidos a revisión | discriminar trabajos sin archivo no es deseable |
| Ciclo de aprobación | mediana entre solicitud y decisión | segmentar por naturaleza y SLA, no personas |
| Carga de actualización | minutos semanales auto-reportados por PM para mantener estado | medir mediante entrevistas, no vigilancia |
| Éxito bot | intent resuelto y autorizado / solicitudes elegibles | no incluir peticiones rechazadas válidas como «fallo» |
| Error de selección | acciones bot revertidas por ambigüedad / acciones bot confirmadas | gatillar mejoras desambiguación |
| Activación por método | proyectos con una vista útil y un entregable configurado | comparar cohortes y roles |
| Retención | organizaciones activas en trabajo real N semanas después | anonimización/consentimiento |

## Métricas del proyecto cliente

**Predictivo:** avance aceptado ponderado por baseline, desviación de fechas, hitos ganados, riesgos abiertos, AC/PV/EV y CPI/SPI por corte. **Ágil:** throughput, lead/cycle, WIP, sprint goal, velocidad sólo comparada históricamente dentro del mismo equipo y definición; jamás comparativa de personas. **Híbrido:** indicadores de fase y aceptación de resultados vinculados a equipos, sin doble conteo.

## Métricas operativas

p95 por endpoint/carga, porcentaje de webhooks válidos procesados, latencia de sync, retries, backlog cola, tasa de errores de autorización, reversiones, prueba restauración, costo inferencia, falsos positivos de IA, consultas sin cita y tasa de abstención. Todo alerta sobre degradación, sin exponer detalles de usuarios.

## Instrumentación

Eventos con tenant/actor pseudonimizados, consentimiento y retención definida; cohortes y agregación sensible a privacidad. Cada métrica incluye owner, fórmula, unidad, fecha de corte y segmento. A/B tests posteriores deben evaluar daño potencial, no solo clicks.
