# ADR-0008 — Emulador S3 local tras archivado de MinIO Community Edition

- **Estado:** Proposed
- **Fecha:** 2026-10-16
- **Autores:** agente implementador bajo instrucción del mantenedor
- **Relacionados:** [ADR-0006](0006-stack-base.md), [RR-0003](../../requirements/records/RR-0003-m1-dev-sin-emulador-s3.md), TASK-0002, WBS-1.3, NFR-012

## Contexto y fuerzas

[ADR-0006](0006-stack-base.md) exige almacenamiento de evidencias con API compatible S3 y deja la elección del **emulador S3 local** a la TASK que lo introduce, con revisión de licencia (ADR-0004) y mantenimiento. El bootstrap (TASK-0002) usó la imagen `minio/minio` en `docker-compose.yml`.

En febrero de 2026 MinIO Inc. archivó el repositorio **MinIO Community Edition** OSS; el registro Docker `minio/minio` dejó de publicar pulls públicos (`pull access denied`). Eso impide levantar el stack completo con `docker compose up` tal como estaba definido, aunque **PostgreSQL** y las pruebas de integración M1 en curso (IAM, event log, WBS, programación, etc.) no dependen de object storage en runtime.

Uso actual en código M1:

| Componente | Uso de S3 |
|---|---|
| `apps/api` | variables `S3_*` en Compose; sin cliente S3 en código M1 |
| `apps/worker` (`jobs/poc`) | `HeadBucket` opcional si `S3_ENDPOINT` y `S3_BUCKET` están definidos; fallo silencioso |
| `packages/domain`, motor, contratos M1a/M1b | sin dependencia de object storage |

La decisión de capa en ADR-0006 (**API S3 genérica**, proveedor agnóstico) sigue vigente; solo falla la **implementación concreta del emulador local** elegida en el POC.

## Alternativas

| Alternativa | Beneficios | Costos/riesgos | Criterio de descarte |
|---|---|---|---|
| **A. Diferir emulador local a M2**; M1 usa Postgres + tests sin S3; producción/autoalojamiento apunta a cualquier S3 compatible vía env | cero vendor nuevo ahora; desbloquea CI y dev local | TASK-0002 no demuestra S3 local hasta nueva decisión; evidencias binarias en M1 siguen siendo metadatos/URLs | candidata por defecto para M1 |
| **B. Filesystem local** (`file://` o directorio montado) detrás del mismo adaptador de almacenamiento | simple en dev; sin contenedor extra | no es S3 real; riesgo de deriva respecto a producción; requiere abstracción nueva | requiere diseño de adaptador y licencia |
| **C. Garage** (AGPL-3.0) u otro servidor S3 OSS autoalojable | API S3 real; alineado con ADR-0006 | revisión AGPL vs Apache-2.0 (ADR-0004); operación y documentación | pendiente auditoría de licencia |
| **D. SeaweedFS** u otro OSS con gateway S3 | API S3; ecosistema activo | complejidad operativa; licencia y mantenimiento por revisar | pendiente auditoría |
| **E. Mock S3 en tests** (p. ej. contenedor efímero solo en CI, o stub `@aws-sdk`) | pruebas de integración del adaptador sin infra permanente | no sustituye Compose de referencia para operadores | complemento, no sustituto solo |
| **F. Restaurar `minio/minio`** vía mirror/fork no oficial | mínimo cambio de Compose | imagen no mantenida por upstream; riesgo de seguridad y licencia | descartada sin excepción explícita del mantenedor |
| No hacer | — | dev local roto para stack completo; pulls fallidos en `compose up` sin perfiles | insostenible |

## Decisión

**Propuesta (no vinculante hasta `Accepted`):**

1. **Compose por defecto** levanta solo **PostgreSQL** (`docker compose up -d` o `docker compose up -d postgres`). Servicios `api`, `worker` y `web` quedan en perfil `poc-stack`; el servicio `minio` en perfil `object-storage`, sin arrancar por defecto.
2. **M1a/M1b** no exigen object storage local para pruebas de integración documentadas en reportes de calidad (0101, 0109, 0113, etc.).
3. La **sustitución del emulador S3 local** (A–E) queda para decisión del Planner/mantenedor tras [RR-0003](../../requirements/records/RR-0003-m1-dev-sin-emulador-s3.md); ninguna alternativa comercial obligatoria.

## Consecuencias y reversibilidad

- Positivo: integración M1 con Postgres deja de depender de `minio/minio`.
- Neutral: variables `S3_*` en `.env.example` pasan a opcionales para dev M1; el worker POC sigue probando conectividad solo cuando el emulador exista.
- Riesgo: TASK-0002 criterio «`docker compose up` levanta … almacenamiento S3 local» queda **parcialmente diferido** hasta aceptar emulador sustituto o enmendar ADR-0006 vía RR.
- Reversibilidad: reactivar servicio en Compose tras ADR aceptado; rollback = revertir perfiles en `docker-compose.yml`.

## Validación

- `docker compose config` válido.
- `docker compose up -d` inicia Postgres sin pull de `minio/minio`.
- Mantenedor/Planner elige alternativa A–E; TASK futura registra imagen, licencia y prueba de `HeadBucket`/upload mínimo.

## Historial

- 2026-10-16: propuesto por bloqueo de pull `minio/minio` y archivo de MinIO CE OSS.
