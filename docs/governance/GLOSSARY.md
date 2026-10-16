# Glosario del proyecto

Si un término se define también en el [SRS](../requirements/SRS.md), prevalece la definición del SRS.

## Documentos y control

**ADR:** Architecture Decision Record, decisión técnica con alternativas, consecuencias y estado. Solo obliga en estado `Accepted`.

**RR:** Requirement Record, solicitud/decisión de cambio de requisito.

**SRS:** Software Requirements Specification; obligaciones funcionales y de calidad verificables.

**PRD:** Product Requirements Document; problema, usuarios, experiencias, prioridades y cortes.

**REQ / NFR:** requisito funcional / requisito no funcional (atributo de calidad) del SRS, con ID estable.

**TC:** caso de prueba de aceptación (`TC-ÁREA-NN`), derivado de un REQ/NFR. Un TC nombrado no es un TC ejecutado.

**TASK:** asignación ejecutable de un agente con rama, worktree y rutas reservadas; registrada en [REGISTRY](../agents/REGISTRY.md).

**CR (Change Request):** solicitud de cambio sobre una baseline aprobada (entidad `ChangeRequest`). No confundir con `CompletionRequest`, la solicitud de finalización de un ítem de trabajo, cuyo prefijo de ID es `creq_`.

**OQ / R:** pregunta abierta ([OPEN_QUESTIONS](OPEN_QUESTIONS.md)) / riesgo ([RISK_REGISTER](RISK_REGISTER.md)).

**DoR/DoD:** Definition of Ready/Done; condiciones para iniciar/cerrar trabajo. Véase [DEFINITION_OF_DONE](../quality/DEFINITION_OF_DONE.md).

**EV (prefijo identificador):** evidencia de aceptación del trabajo de construcción; distinto del indicador financiero EV, que se distingue por contexto.

## Priorización y fases

**P0 / P1 / P2:** prioridad de un requisito: P0 = núcleo y seguridad; P1 = primera expansión; P2 = avanzado. La prioridad expresa criticidad, no fase: un P0 bloquea cualquier piloto o release que incluya la capacidad, aunque se entregue después de M1 ([RR-0001](../requirements/records/RR-0001-inconsistencias-fases-prioridades.md)).

**M0–M5:** cortes o fases de entrega descritos en el [PRD](../product/PRD.md) y el [ROADMAP](../planning/ROADMAP.md); no son fechas comprometidas.

**G0–G5:** gates de salida de cada fase, con criterios en el [ROADMAP](../planning/ROADMAP.md). Cada gate exige aprobación humana.

**JPI:** jornada-persona ideal de referencia (6 h de trabajo enfocado de especialista), unidad de esfuerzo del [diccionario WBS](../planning/WBS_DICTIONARY.md). No es duración de calendario ni costo comprometido.

## Gestión de proyectos

**WBS/EDT:** estructura de desglose del trabajo orientada a entregables y paquetes; **WBS Dictionary:** definición de cada paquete y su aceptación.

**Milestone/hito:** punto de control de duración cero. **Deliverable/entregable:** resultado verificable que puede exigir evidencia y aceptación.

**Baseline/línea base:** versión formalmente aprobada que no se reescribe y contra la cual se compara el estado.

**Dependency:** relación de precedencia; FS = fin a inicio, SS = inicio a inicio, FF = fin a fin, SF = inicio a fin; lag/lead = desfase positivo/negativo bajo calendario.

**CPM:** Critical Path Method, método de ruta crítica sobre red válida; no sustituye la nivelación de recursos.

**PMO:** Project Management Office, oficina que gobierna proyectos y portafolios.

**RAID:** en este proyecto, registro de riesgos, bloqueos, issues, decisiones y acciones (REQ-049). Otras convenciones usan supuestos y dependencias; si se adopta otra, registrarla por RR.

## Finanzas (EVM)

**BAC:** presupuesto a la terminación. **PV:** valor planificado. **EV:** valor ganado. **AC:** costo real reconocido. **CV:** EV−AC. **SV:** EV−PV. **CPI:** EV/AC. **SPI:** EV/PV. **EAC:** estimación de costo al terminar. **ETC:** costo estimado restante. **VAC:** BAC−EAC. Fórmulas, casos límite y ejemplo en [FINANCIAL_MODEL](../architecture/FINANCIAL_MODEL.md).

## Ágil

**Lead time:** tiempo desde la entrada del trabajo al sistema hasta la entrega. **Cycle time:** desde el inicio definido del trabajo hasta su finalización definida. Las definiciones deben publicarse por tablero.

**Throughput:** ítems completados por unidad de tiempo. **Velocity:** puntos u otra unidad completada por sprint, comparable solo con definición estable y dentro del mismo equipo.

**WIP:** trabajo en curso; un límite WIP restringe cuántos ítems puede haber en un estado.

## Plataforma y seguridad

**Tenant:** frontera lógica de organización. **RBAC:** autorización por rol. **ABAC:** autorización por atributos y contexto.

**Idempotencia:** reintentar una intención sin repetir su efecto. **Outbox:** registro transaccional de eventos pendientes de publicación. **DLQ:** cola de mensajes fallidos (dead-letter queue) para revisión y replay auditado.

**RAG:** generación asistida por recuperación; resultados sujetos a permisos y con procedencia.

**IDOR:** acceso a un objeto ajeno manipulando su identificador. **SSRF:** forzar al servidor a hacer peticiones a destinos no autorizados.

**SBOM:** inventario de componentes y dependencias de software, base de la auditoría de licencias. **DCO / CLA:** Developer Certificate of Origin / Contributor License Agreement; alternativas para certificar derechos de contribución (pendiente en [ADR-0004](../architecture/adr/0004-oss-license-pending.md)).

## Desarrollo agéntico

**Planner / Orchestrator:** único agente que descompone, asigna, reserva rutas y consolida el plan. Véase [AGENTS.md](../../AGENTS.md).

**Worktree:** directorio de trabajo adicional vinculado a un repositorio Git, aislado por rama; característica local de Git, no una instancia de agente remota.
