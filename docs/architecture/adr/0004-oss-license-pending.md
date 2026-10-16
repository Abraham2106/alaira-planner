# ADR-0004 — Elegir licencia OSS y modelo de contribución

- **Estado:** Accepted
- **Fecha:** 2026-10-15 (propuesta y aceptación)
- **Responsable de decisión:** mantenedor Alaira (Abraham2106), titular de derechos del repositorio
- **Relacionados:** WBS-1.5, OQ-01, R-09, R-15, [RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md), [CONTRIBUTING](../../../CONTRIBUTING.md), [SECURITY](../../../SECURITY.md)

## Contexto

Alaira Planner se declara proyecto con intención OSS, pero el repositorio nació sin licencia. Un repo público no es jurídicamente equivalente a software open source. Se necesita una licencia compatible con contribuciones, dependencias y un modelo sostenible de Alaira, y es la primera condición del gate G0 para aceptar código.

## Alternativas

| Alternativa | Beneficios | Costos/riesgos |
|---|---|---|
| **Apache-2.0** | permisiva; concesión explícita de patentes; excluye la marca; compatible con casi todo el ecosistema TypeScript/PostgreSQL; aceptable para empresas que autoalojan | permite que terceros ofrezcan el producto como SaaS sin devolver cambios |
| MIT | máxima sencillez | sin concesión de patentes ni cláusula de marca |
| AGPL-3.0 | obliga a publicar cambios usados en red; protege frente a clones SaaS | fricción de adopción en empresas, incompatibilidades con dependencias y, sin CLA, impide a Alaira ofrecer licencias alternativas |
| No decidir | ninguna | bloquea contribuciones y releases (R-09) |

## Decisión

1. **Licencia: Apache-2.0** para todo el código y la documentación del repositorio, publicada en [LICENSE](../../../LICENSE) (texto oficial de apache.org, SHA-256 `cfc7749b…bc523d30`) con [NOTICE](../../../NOTICE).
2. **Contribuciones: DCO** (Developer Certificate of Origin) mediante `Signed-off-by` en cada commit (`git commit -s`). No se exige CLA; la entrada y la salida de las contribuciones son ambas Apache-2.0.
3. **Marca:** el nombre «Alaira» no se licencia con el código; su uso se rige por la sección 6 de la licencia.
4. **Dependencias:** solo se incorporan dependencias con licencias compatibles con Apache-2.0 (MIT, BSD, ISC, Apache-2.0, PostgreSQL, MPL-2.0 sin modificar). GPL/AGPL/SSPL/BUSL u otras no compatibles quedan prohibidas en el producto distribuido salvo un ADR específico.
5. **Sostenibilidad:** la metodología nunca es premium. Gantt, WBS, dependencias, ruta crítica, baselines, calendarios, workload, time tracking, presupuesto, forecast, backlog, sprints, métricas, portafolio, campos personalizados, dashboards, automatización, API/webhooks, asistente de IA, grafo de evidencia y auditoría pertenecen al núcleo Apache-2.0 ([PRODUCT_BRIEF](../../product/PRODUCT_BRIEF.md)). Alaira puede ofrecer comercialmente hosting gestionado, soporte y gobierno empresarial (SAML/SSO, SCIM, retención personalizada, residencia de datos, claves gestionadas por el cliente, legal hold, red privada, entornos dedicados); si alguno se distribuye fuera del núcleo OSS se decide por ADR (OQ-11). Ningún servicio comercial puede ser requisito para desplegar la edición OSS.

Justificación: se prioriza la adopción, la contribución sin fricción legal y la seguridad jurídica de patentes por encima de la protección contra clones SaaS, que en una fase sin usuarios es un riesgo menor que no tener comunidad.

## Consecuencias y reversibilidad

El repositorio puede aceptar contribuciones de código bajo DCO y publicar artefactos. Relicenciar después de aceptar contribuciones externas exigiría el acuerdo de cada contribuidor; por eso esta es la decisión menos reversible de G0. La revisión de licencias de dependencias forma parte de la Definition of Done de cada TASK.

## Historial

- 2026-10-15: propuesta con decisión pendiente.
- 2026-10-15: aceptada por el mantenedor ([RR-0002](../../requirements/records/RR-0002-baseline-m1-y-g0.md)).
