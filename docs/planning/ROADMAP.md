# Roadmap de validación y construcción

**Estado:** hipótesis de secuencia, no compromiso de fechas ni disponibilidad de recursos. **Relación:** WBS y PRD. La estrategia es entregar cortes operables, no esperar a implementar los 80 requisitos antes de validar.

## Suposición de capacidad para estimar

Equipo ilustrativo, **no asignado**: 1 responsable de producto/Planner, 2 desarrolladores generalistas, 1 especialista de seguridad/QA parcial y 1 diseñador UX parcial. Los agentes de IA apoyan, pero no equivalen a capacidad humana ni eliminan revisión, reuniones, pruebas e integración. Los rangos siguientes son bandas de planificación dependientes de validación de stack y disponibilidad; no promesas.

| Fase | Ventana indicativa desde inicio efectivo | Paquetes priorizados | Gate y resultado |
|---|---|---|---|
| M0 Discovery/fundación | semanas 1–4 | 1.1–1.5, 8.2 temprano | G0: problema probado, licencia por decidir/aprobar, REQ P0/ADRs prioritarios |
| M1 Núcleo confiable | semanas 5–14 | 2.1–2.6, 3.1, 3.4–3.5, 8.1 | G1: proyectos, evidencia y aceptación con aislamiento + UI |
| M2 Planeación | semanas 15–23 | 3.2–3.3, 3.6, reportes | G2: calendarios, dependencias, baseline y Gantt reproducibles |
| M3 Ágil/híbrido | semanas 24–31 | 4.1–4.3 | G3: backlog/Kanban/sprints ↔ fase/entregable sin doble conteo |
| M4 Integraciones | semanas 32–39 | 5.1–5.3; 7.1 piloto | G4: bot Slack con autorización/idempotencia y conectores limitados |
| M5 Finanzas/IA | semanas 40–52+ | 6.1–6.3, 7.1–7.3, 8.3–8.6 | G5: EVM reproducible, IA evaluada y piloto/release decidido |

**Riesgo de secuencia:** esperar hasta M4 para pilotar Slack podría retrasar aprendizaje clave. Se recomienda probar un *thin slice* no productivo de Slack durante M1–M2 tras disponer de RBAC/aceptación; M4 amplía producción. M5 es especialmente incierto por integración de finanzas, fórmulas y datos.

## Gating cualitativo

**G0 Concepción aprobada:** entrevistas e hipótesis documentadas, licencia decidida o restricción explícita sobre distribución, baseline SRS M1, priorización, riesgo, ADRs iniciales, requisitos de seguridad.

**G1 Núcleo:** TC tenant/aceptación/reversa/auditoría ejecutados, evidencia no Git, demo de PM y colaborador; no fallas P0.

**G2 Predictivo:** CPM FS/SS/FF/SF y calendario con casos límite, baseline congelada, proyección Gantt fiel y autorización cambios.

**G3 Ágil/híbrido:** historias y paquete comparten identidad de resultado, cálculo WIP/lead/cycle, deduplicación del crédito.

**G4 Ecosistema:** firma Slack, scopes, desambiguación, revocación, replay idempotente, visibilidad de errores de sync y observabilidad.

**G5 Lanzamiento:** autorización de finanzas, validación EVM, AI red team, confidencialidad tenant, accesibilidad, pruebas de recuperación, revisión de licencias y aceptación humana.

## Cadencia y gobierno de cambios

Planning semanal del planificador, refinamiento continuo de requisitos, review por PR y demo al cerrar valor de usuario. Informe de progreso centrado en entregables aceptados, riesgo, cambios y próxima decisión; evitar evaluar agentes por tokens o commits. Cada gate congela baseline documental. Cambios de fecha/alcance se registran, no sobrescriben el histórico.

## Camino crítico candidato

La cadena más riesgosa probable es autorización y dominio → evidencia/aceptación → línea base y agregación → datos financieros → validación de pilotos. Dependencias tecnológicas de Slack y permisos externos pueden introducir una segunda ruta crítica; se calcula una vez confirmadas duraciones, calendarios y capacidad.
