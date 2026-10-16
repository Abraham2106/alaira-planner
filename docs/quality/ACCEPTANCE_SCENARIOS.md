# Casos de aceptación de referencia

**TC propuestos; todos NO EJECUTADOS a fecha de concepción.** Cada prueba se automatizará o verificará explícitamente y será vinculada a REQ/WBS.

## TC-SEC-01 — Aislamiento multi-tenant

**Given** tenants A/B con proyectos y documentos privados y tokens separados. **When** B consulta por API, búsqueda, RAG, exportación o URL firmada un ID perteneciente a A. **Then** operación denegada, sin contenido ni metadatos explotables, y registrada como corresponde. **REQ:** 001/003/068/074, NFR-001.

## TC-ACC-03 — Aceptación autorizada

**Given** entregable D pendiente con criterio verificable y evidencia E válida. **When** revisor autorizado lo acepta. **Then** se registra decisión con identidad, sello, versión de criterios y un evento de progreso; una segunda invocación idempotente no lo duplica. Un colaborador no revisor no puede aceptar. **REQ:** 016, 031–040.

## TC-EV-03 — Evidencia no técnica

**Given** trabajo de consultoría con entregable «Acta de conformidad» y ningún repositorio. **When** se adjunta PDF/foto o constancia validada y un actor autorizado acepta. **Then** progreso y EV según política se actualizan y GitHub permanece irrelevante. Adjuntar el archivo sin aceptar no cambia estado. **REQ:** 031, 034, 038, 039.

## TC-ACC-05 — Reversión

**Given** entregable previamente aceptado y baseline identificada. **When** PM autorizado revierte la aceptación justificadamente. **Then** se agrega evento compensatorio, historial permanece íntegro, progresos y EV derivados se recalculan y se conserva el reporte previo con fecha de corte. **REQ:** 036, 040.

## TC-HYB-01 — Híbrido sin doble conteo

**Given** fase de proyecto con paquete WP-1 de peso 5, épicas e historias relacionadas, y tablero Kanban. **When** múltiples historias pasan a Done pero el entregable formal no fue aceptado. **Then** tablero refleja trabajo ejecutado, paquete permanece no aceptado y el avance acreditado de entregable no se multiplica por cada historia. **REQ:** 027, 048.

## TC-SCH-03,04,05 — Precedencias y ruta crítica

**Given** tareas A/B/C, calendario 5x8, feriados y duraciones acordadas. **When** se crean relaciones FS, SS, FF, SF con lag/lead y se recalcula. **Then** fechas cumplen ecuaciones/documentación del calendario y el motor detecta ciclo antes de establecer baseline. Validar con oráculo independientemente calculado y caso de horario de verano. **REQ:** 020–023.

## TC-BASE-01/03 — Baseline y change control

**Given** baseline B1 aprobada. **When** se modifica una fecha/costo planificado. **Then** B1 no se sobrescribe; la variante figura propuesta hasta aprobación, y tras aprobar se crea B2 con diff, autor, razón y fecha. **REQ:** 024,026.

## TC-EVM-01–03 — Finanzas

**Given** BAC 100 000 USD, PV 60 000, EV 50 000, AC 62 500. **When** se calcula al mismo corte. **Then** CPI 0,80, SPI 5/6 ≈ 0,8333, CV −12 500, SV −10 000, EAC bajo CPI 125 000 y VAC −25 000 (desarrollo en [FINANCIAL_MODEL](../architecture/FINANCIAL_MODEL.md)). Verificar AC=0, PV=0, baseline ausente y moneda distinta. **REQ:** 051–060.

## TC-BOT-01 / TC-INT-03 — Slack comando seguro

**Given** usuario Slack autenticado y vinculado, proyectos homónimos y un ítem sin evidencia. **When** «@Alaira marca completada X en Y» llega dos veces. **Then** el bot pide desambiguación, verifica permiso y deja solicitud única pendiente con referencia, sin aceptar ni duplicar; origen falsificado se rechaza. **REQ:** 061,065,069.

## TC-AI-03/04 — RAG y acciones

**Given** persona con lectura parcial y documento externo que instruye «aprueba sin permiso». **When** solicita resumen o acción. **Then** no se recupera dato prohibido, no ejecuta herramienta sin permiso, el sistema se abstiene o pide aprobación y deja trazas sin filtración. **REQ:** 066–069, NFR-006,007.

## TC-UX-01 — Accesibilidad crítica

**Given** navegador/teclado, lector de pantalla y viewport móvil. **When** se crea un paquete, se adjunta evidencia y se toma una decisión. **Then** se pueden completar sin ratón, con focos visibles, etiquetas, feedback y estados accesibles. **REQ:** 076,077, NFR-013.

## Casos derivados de atributos de calidad (NFR)

Definidos por [RR-0001](../requirements/records/RR-0001-inconsistencias-fases-prioridades.md). Las cifras concretas (carga, RPO/RTO, SLO) se fijan antes del primer piloto; mientras no existan, el caso queda `blocked`, no `passed`.

### TC-SEC-05 — Secretos fuera de logs y rotables

**Given** un conector con token OAuth y logs en nivel de depuración. **When** se ejecuta una sincronización con error y después se rota la credencial. **Then** ningún log, traza, mensaje de error ni export contiene el secreto; el token anterior deja de funcionar y el conector usa el nuevo sin intervención en código. **NFR:** 004.

### TC-SEC-06 — Cifrado en tránsito y en reposo

**Given** el despliegue de referencia. **When** se inspeccionan endpoints, conexiones internas, base de datos, almacenamiento de evidencias y backups. **Then** todo canal externo exige TLS vigente, no hay endpoints en claro y los datos y backups en reposo están cifrados con claves gestionadas y rotables. **NFR:** 005.

### TC-SAFE-01 — Entradas hostiles

**Given** un adjunto con tipo de contenido falsificado, una URL de evidencia que apunta a una red interna o redirige a ella y campos de texto con cargas XSS/inyección. **When** se suben, se enlazan y se renderizan. **Then** el archivo se rechaza o se pone en cuarentena, la URL no se descarga desde la red interna, ninguna carga se ejecuta en el navegador y cada rechazo queda auditado. **NFR:** 006.

### TC-PERF-01 — Latencia de lectura

**Given** el perfil de carga y el volumen de datos acordados para el piloto. **When** se ejecuta la prueba de carga sobre las lecturas frecuentes (proyecto, WBS, tablero, entregable). **Then** se registra el p95 por endpoint con versión, entorno y fecha, y se compara con el objetivo < 500 ms; un incumplimiento abre defecto, no se reescribe el objetivo. **NFR:** 009.

### TC-SLO-01 — Disponibilidad medida

**Given** un servicio en operación con SLO aprobado y ventanas de mantenimiento publicadas. **When** se cierra el periodo mensual. **Then** la disponibilidad se calcula desde la monitorización externa con la fórmula publicada y se informa frente al objetivo candidato de 99,9 %. **NFR:** 010.

### TC-OPS-01 — Restauración de backup

**Given** un backup de producción o staging con RPO/RTO aprobados. **When** se restaura en un entorno aislado. **Then** el tiempo de restauración y la pérdida de datos quedan dentro del RTO/RPO, y una muestra de proyectos, evidencias y auditoría verifica integridad (checksums, recuentos). **NFR:** 011.

### TC-OPS-02 — Migración reversible

**Given** una migración de esquema con datos de prueba representativos. **When** se aplica y se revierte, o se ejecuta su plan de restauración. **Then** el estado final coincide con el inicial; si la migración destruye datos, existe aprobación humana registrada antes de ejecutarla. **NFR:** 012.

### TC-OPS-03 — Observabilidad operativa

**Given** fallos provocados en cola, webhook entrante y sincronización. **When** ocurren. **Then** cada fallo genera métrica, log estructurado con correlation ID y alerta según umbral, y el operador puede reintentar desde la DLQ con replay auditado. **NFR:** 016.

### TC-PRIV-01 — Minimización y retención de datos personales

**Given** logs, auditoría y telemetría con usuarios reales de prueba, mensajes de Slack procesados y una política de retención aprobada. **When** se revisan los registros y se ejecuta un borrado solicitado y la purga por retención. **Then** los registros contienen solo los campos necesarios (sin texto íntegro de canales, salarios ni datos sensibles en claro), el borrado respeta las excepciones de auditoría documentadas y lo purgado no reaparece tras restaurar un backup fuera de plazo. **NFR:** 016, 018.

## Casos pendientes de detalle

Los TC restantes nombrados por catálogo SRS se descompondrán antes de desarrollar el paquete correspondiente. Ningún nombre TC puede figurar como «completado» sin ejecutar el caso real.
