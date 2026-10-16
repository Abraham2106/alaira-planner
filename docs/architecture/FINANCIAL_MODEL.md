# Modelo financiero, EVM y control de cambios

**Estado:** especificación preliminar, fórmulas deterministas sujetas a revisión por especialista de control de proyectos. **Refs:** REQ-051–060, WBS-6.1–6.3.

## Conceptos y política

BAC = presupuesto aprobado a la terminación de la baseline. PV = valor presupuestado del trabajo programado a fecha de corte. EV = valor presupuestado del trabajo **ganado según regla de medición/aceptación aprobada**. AC = costo real reconocido a fecha de corte, de acuerdo con política contable del proyecto. CV=EV−AC; SV=EV−PV; CPI=EV/AC; SPI=EV/PV. Valores monetarios usan unidad, moneda y fecha de tasa; PV/EV de baseline no se mezclan con otra sin conversión/control de cambio.

La aceptación binaria de entregables puede ser incompatible con la medición de EV de trabajos largos. Se deberá decidir una política versionada (0/100, hitos ponderados, 50/50, porcentaje físico verificado) por tipo de paquete; los pesos EV no equivalen a cantidad de mensajes ni horas. Esta decisión se registra mediante RR y ADR. La evidencia puede probar porcentaje físico sin convertirlo en aprobación automática.

## Ejemplo numérico reproducible

Supongamos baseline BAC = **100 000 USD**. A la fecha de corte, PV=60 000 USD; el trabajo verificado gana EV=50 000 USD; y AC reconocido=62 500 USD.

| Indicador | Fórmula | Resultado | Interpretación |
|---|---|---|---|
| CV | EV − AC | −12 500 USD | costo por encima del valor ganado |
| SV | EV − PV | −10 000 USD | atraso en valor de trabajo frente al plan |
| CPI | EV / AC | 0,80 | se gana 0,80 de valor por cada 1 de costo |
| SPI | EV / PV | 0,8333 | 83,33% del valor programado |
| EAC por CPI | BAC / CPI | 125 000 USD | supone eficiencia CPI futura igual a histórica |
| ETC por CPI | EAC − AC | 62 500 USD | costo estimado restante bajo ese supuesto |
| VAC por CPI | BAC − EAC | −25 000 USD | desviación prevista al cierre |
| EAC costo futuro presupuestado | AC + (BAC−EV) | 112 500 USD | supone que el trabajo restante será al presupuesto original |

No mezclar ambos métodos EAC en un único número sin explicar la hipótesis. SPI clásico es indicador **de valor**, no porcentaje directo de retraso en calendario. Las previsiones basadas en IA son probabilísticas y se muestran aparte de estos cálculos.

## Casos límite imprescindibles

- AC=0 y EV>0: CPI indefinido, no infinito ni cero. PV=0: SPI indefinido. EV=0 con AC>0: CPI=0, y fórmula BAC/CPI no computable; pedir alternativa.
- Sin baseline aprobada, no mostrar «EV/SPI oficiales»; admitir indicador preliminar etiquetado y separado.
- Cambios aprobados de alcance: baseline nueva referenciada y comparación con anterior, sin reescribir historia.
- Moneda/tipo cambio: costo original, tasa/fuente, instante y moneda de reporte; conversión configurable y transparente.
- Gastos comprometidos ≠ AC; facturas recibidas ≠ pagos; horas ingresadas ≠ horas aprobadas; clasificar cada concepto.
- Sobrepago, cantidades negativas/ajustes contables y devolución: requieren política y comprobante; no ocultar con clamp.
- Reserva de contingencia vs reserva de gestión: distinguir parte de baseline aprobada, política de drawdown y autorización.

## Reportes mínimos

Por paquete/proyecto/programa: BAC, fecha de corte, PV, EV, AC, CV, SV, CPI, SPI, EAC/ETC/VAC por escenario, fuentes, baseline ID y advertencias. Exportar con fórmulas y definiciones, no sólo números. La IA puede comentar tendencias pero no cambiar costos ni baselines sin confirmación/autorización.
