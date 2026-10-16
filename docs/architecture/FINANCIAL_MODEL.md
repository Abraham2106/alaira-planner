# Modelo financiero, EVM y control de cambios

**Estado:** especificación preliminar para el corte M3; las fórmulas deterministas deben pasar revisión de un especialista en control de proyectos y un ADR antes de implementarse. **Refs:** REQ-051–060, REQ-086, REQ-098–099, WBS-6.1–6.3, [PRODUCT_BRIEF](../product/PRODUCT_BRIEF.md).

## Estructura del presupuesto

Un presupuesto se descompone por **categorías**: personas internas, contratistas, software y licencias, infraestructura, viajes, servicios, materiales, contingencia y reserva de gestión. Cada línea se asigna a un nodo del grafo y lleva su baseline financiera.

| Concepto | Definición |
|---|---|
| Presupuesto aprobado | baseline financiera vigente |
| Comprometido | órdenes de compra o contratos firmados aún no facturados |
| Costo real (AC) | costo reconocido según la política contable del proyecto |
| Facturado / pagado | dimensiones contables distintas de AC |
| Reserva protegida | contingencia y reserva de gestión que solo se liberan con autorización |
| **Saldo gastable** | presupuesto autorizado − costo real − compromisos abiertos − reserva protegida (REQ-098) |
| Forecast a la conclusión (EAC) | costo real + estimación restante bajo una hipótesis declarada |
| **Holgura de forecast** | presupuesto aprobado − EAC; puede ser negativa aunque el saldo gastable sea positivo |

**Presentación accesible.** La vista financiera responde primero en lenguaje simple —«gastado», «comprometido», «disponible», «forecast al final»— y deja CPI, SPI y EAC como detalle para PM y finanzas. Ejemplo: «Has gastado 62 500 USD de 100 000 USD y tienes 15 000 USD comprometidos y 5 000 USD de reserva protegida; te quedan 17 500 USD para gastar, pero si el trabajo restante cuesta lo presupuestado terminarías en 112 500 USD» (mismos datos que el ejemplo numérico de abajo).

## Conceptos y política

BAC = presupuesto aprobado a la terminación de la baseline. PV = valor presupuestado del trabajo programado a fecha de corte. EV = valor presupuestado del trabajo **ganado según regla de medición/aceptación aprobada**. AC = costo real reconocido a fecha de corte, de acuerdo con política contable del proyecto. CV=EV−AC; SV=EV−PV; CPI=EV/AC; SPI=EV/PV. Valores monetarios usan unidad, moneda y fecha de tasa; PV/EV de baseline no se mezclan con otra sin conversión/control de cambio.

**Técnica de valor ganado** ([RR-0002 §4](../requirements/records/RR-0002-baseline-m1-y-g0.md)): solo cuentan como EV las estrategias de progreso declaradas como técnica de valor ganado en la política del proyecto: 0/100 por defecto, hitos ponderados con criterio propio por hito y, con aprobación del PM y de finanzas, 50/50 o porcentaje físico verificado. Nunca se deriva EV de horas, mensajes ni commits. La evidencia puede respaldar un porcentaje físico sin convertirlo en aprobación automática. La fórmula definitiva y sus casos límite se fijan por ADR antes de M3.

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

No mezclar ambos métodos EAC en un único número sin explicar la hipótesis. SPI clásico es indicador **de valor**, no porcentaje directo de retraso en calendario. Todos estos números los calcula el motor determinista (NFR-021); la IA puede explicarlos y proponer acciones, nunca calcularlos ni modificarlos. El forecast probabilístico (M5, WBS-6.4) se muestra aparte, con su distribución y supuestos.

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
