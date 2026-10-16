# Visión de producto — Alaira Planner

**Estado:** propuesta 0.1 · **Propiedad del producto:** Alaira · **Tipo:** OSS previsto, licencia aún sin decidir.

## El problema

La ejecución real de proyectos se fragmenta entre hojas de cálculo, chats, documentación, entregables, cronogramas, Jira, repositorios y aprobaciones. Los jefes de proyecto suelen reconstruir manualmente el avance, con confusión entre actividad, trabajo terminado y entregable aceptado. Herramientas enfocadas en una sola metodología fuerzan migraciones y modelos paralelos; el control financiero y de baseline queda desconectado del backlog.

## Declaración de visión

Una única plataforma donde cualquier equipo pueda **planificar, coordinar, demostrar, aprobar y comprender** el progreso de trabajo predictivo, ágil o híbrido, con integración en el lugar donde ocurre el trabajo y agentes de IA que faciliten acciones seguras, no que gobiernen autónomamente el proyecto.

## Personas objetivo y entrada

| Persona | Trabajo principal | Punto de entrada | Valor |
|---|---|---|---|
| PM de servicios/operaciones | hitos, responsables, presupuesto, clientes | plantilla de proyecto y entregables | estado verificable sin perseguir actualizaciones |
| Scrum Master / Product Owner | backlog, sprints, flujos y entregas | importar backlog o iniciar plantilla | métricas ágiles sin perder trazabilidad |
| PMO / director de programa | comparativa de iniciativas, riesgos, capacidad | portfolio | visibilidad de restricciones y escenarios |
| Colaborador externo/interno | entregar, demostrar y aprobar | notificación, chat o tarea asignada | experiencia de baja fricción |
| Responsable financiero | presupuesto, costo, cambios y pronósticos | centro de costos | control sobre presupuesto frente a valor ganado |
| Administrador de integración | permisos, políticas, conectores | onboarding organización | gobernanza y trazabilidad |

Los usuarios de campo o sin código deben poder usar evidencia no Git: documentos, fotografías autorizadas, actas, firmas o comprobaciones presenciales.

## Ventajas buscadas (hipótesis por validar)

1. **Evidencia + aceptación, no actividad:** cada avance se vincula a entregables y reglas explícitas.
2. **Modelo unificado adaptable:** EDT/WBS, backlog y flujo híbrido son vistas sobre relaciones consistentes; no tres productos aislados.
3. **Interacción donde ya trabaja el equipo:** bot de Slack/Teams y API con confirmaciones idempotentes.
4. **Planificación controlable:** líneas base, ruta crítica y presupuestos versionados.
5. **IA explicable:** cada sugerencia cita hechos y permite aceptar, corregir o rechazar.
6. **OSS, exportabilidad e integraciones:** reducción de lock-in; no presumir licencia sin elegirla.

## Límites y compromisos

No reemplazar el juicio del PM, no medir personas mediante vigilancia, no equiparar mensajes o commits con finalización, no realizar cargos o cambios de línea base por comandos sin permisos, no construir inicialmente un ERP ni motor completo de P6. Interfaces web accesibles, simples y progresivas, pero el foco inicial es el dominio y su confiabilidad.

## Resultados de validación

Medir tiempo hasta primer proyecto útil, proporción de entregables aceptados con evidencia, exactitud del avance, acciones de bot correctas y revertibles, adopción por rol, carga de actualización percibida y fiabilidad de sincronizaciones; nunca métricas individuales invasivas.
