# ADR-0004 — Elegir licencia OSS y modelo de contribución

- **Estado:** Proposed / Decision Pending
- **Fecha:** 2026-10-15
- **Responsable de decisión:** titular de derechos / Alaira
- **Relacionados:** WBS-1.5, CONTRIBUTING.md, SECURITY.md

## Contexto

Alaira Planner se declara proyecto con intención OSS, pero el repositorio nace vacío y no hay licencia. Un repo público no es jurídicamente equivalente a software open source. Se necesita elegir licencia compatible con contribuciones, dependencias y modelo sostenible de Alaira.

## Alternativas para asesoría

- **Apache-2.0:** permisiva con aviso de patentes y obligaciones de notice.
- **MIT:** permisiva y sencilla; mínimos requisitos.
- **AGPL-3.0:** copyleft fuerte para uso sobre red, con implicaciones de distribución y compatibilidad.
- **Otra licencia aprobada por OSI:** evaluar caso y obligaciones.

También decidir DCO vs CLA, titularidad de marca `Alaira`, política de gobernanza, publicación de binarios/imágenes y diferencia entre servicios comerciales opcionales y código OSS. No se propone premium obligatorio como hecho.

## Decisión

Pendiente de autorización explícita. **No añadir LICENSE inventado.** Antes de aceptar código externo/publicar paquetes, validar derechos, compatibilidad de dependencias, contribuciones y redacción definitiva; registrar fecha y versión del texto.

## Consecuencia de no decidir

El repositorio puede servir para concepción pública y discusión, pero no debe anunciarse redistribuible bajo licencia OSS aún. Un modelo propietario anterior queda reemplazado por la intención OSS expresada en esta concepción, no por una licencia determinada.
