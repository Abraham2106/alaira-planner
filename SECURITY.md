# Política de seguridad (estado inicial)

**Estado:** repositorio sin servicio desplegado; la construcción empieza con M1.

No publiques vulnerabilidades explotables, tokens, credenciales ni datos privados en issues públicos. Repórtalas de forma privada desde la pestaña **Security → Report a vulnerability** del repositorio en GitHub (private vulnerability reporting). Si esa opción no aparece, abre un issue que solo pida un canal privado, sin detalles de la vulnerabilidad.

Se deberá establecer antes del primer despliegue: canal de divulgación responsable, tiempos de respuesta, dependabot o equivalente, revisión de dependencias y licencias, CI de análisis estático, escaneo de secretos, amenaza multi-tenant, recuperación de incidentes y responsables definidos. Véase [SECURITY_PRIVACY](docs/architecture/SECURITY_PRIVACY.md). No declarar certificaciones inexistentes.
