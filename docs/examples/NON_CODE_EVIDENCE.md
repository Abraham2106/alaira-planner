# Casos de avance verificable fuera de GitHub

El progreso de Alaira Planner se basa en entregables y criterios, no en la existencia de código.

| Tipo de proyecto | Paquete / entregable | Evidencia propuesta | Revisor y condición de aceptación |
|---|---|---|---|
| Consultoría | diagnóstico organizacional | informe final PDF + acta firmada | cliente autorizado confirma cobertura y versión |
| Construcción | inspección de cimentación | acta de inspección, fotografía geolocalizada si existe base legal, checklist | inspector competente valida normas aplicables |
| Formación | curso impartido | lista de asistencia y evaluación agregada con consentimiento | coordinador valida criterios de cumplimiento |
| Marketing | campaña aprobada | arte final, enlace de publicación y aprobación | owner del cliente valida mensaje/uso de marca |
| Investigación | protocolo de ensayo | revisión de protocolo y autorización exigida | investigador responsable acepta |
| Operaciones | procedimiento implementado | documento controlado, capacitación y acta | responsable de operación verifica |
| Software | versión funcional | artefacto de release, tests y aprobación PO | PO acepta criterios; GitHub es opcional |

## Estados por ejemplo

1. Paquete definido con resultado, peso, fecha y regla de aceptación.
2. Ejecutante entrega evidencia con autor, versión, procedencia y ACL.
3. Sistema registra `EvidenceAttached`, sin cambiar EV del entregable por el mero upload.
4. Revisor valida criterios y acepta o rechaza.
5. Se registra `ReviewDecision`; la política versionada determina avance, EV y reporte.
6. La anulación posterior usa evento compensatorio, conserva historia y recalcula bajo fecha de corte.

En trabajos medibles progresivamente, el porcentaje físico sólo se acredita si la regla aprobada admite medición parcial y existe verificación objetiva. Dos documentos para el mismo entregable no son dos avances. Horas imputadas son costo/capacidad, no criterio de aceptación por defecto.
