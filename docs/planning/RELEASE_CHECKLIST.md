# Gate de release y entrega OSS

**Estado:** checklist propuesto; ninguna casilla está cumplida a fecha de concepción.

## Producto y alcance

- [ ] Corte Mx y exclusiones publicados; WBS y SRS versionados.
- [ ] 100% de REQ/NFR P0 del corte con TC ejecutado, evidencia, revisor y resultado.
- [ ] Demostración de evidencia documental aceptada sin GitHub y rollback de aceptación.
- [ ] Camino crítico/finanzas sólo si pertenecen al corte; fórmulas validables con baseline.

## Gobernanza OSS

- [ ] Titularidad, permiso de contribuciones y LICENSE aprobado y publicado.
- [ ] Análisis de compatibilidad de dependencias, avisos y SBOM.
- [ ] Guía de contribución, política de seguridad, canal privado de reporte y changelog.

## Ingeniería y seguridad

- [ ] Aislamiento multi-tenant, authz servidor, auditoría, secrets, rate limit y protección de integraciones verificados.
- [ ] Reintentos de webhooks y escrituras idempotentes medidos.
- [ ] RAG/IA aislada por permiso; inyección y aprobación humana probadas cuando aplique.
- [ ] Backups restaurados; migraciones/rollback ensayados, runbooks y alertas disponibles.
- [ ] Accesibilidad revisada con teclado y lector en flujos críticos.

## Experiencia y usuarios

- [ ] Onboarding, crear proyecto, entrega y aprobación comprobados con usuarios.
- [ ] Documentación de instalación self-hosted/operación reproducible.
- [ ] Observaciones de piloto, bugs abiertos, severidad y riesgos residuales publicados.

## Autorización

**Propuesta:** Planner recopila evidencia; QA y Security revisan; mantenedor Alaira acepta alcance, licencia y publicación. Nunca un agente cambia el estado a Released de manera autónoma.
