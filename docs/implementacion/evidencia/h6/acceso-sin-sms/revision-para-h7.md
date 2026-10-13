# Revisión previa a H7

> Actualización del cierre de H6 del 11/10: Docker y las suites aisladas del nuevo acceso ya se ejecutaron; 110 pgTAP, 90 de integración y 40 de navegador aprobadas. El [reporte vigente](README.md) sustituye los pendientes de pruebas de esta revisión histórica. Narrador/zoom real y PT-08/PT-11/PT-13 permanecen pendientes; H6 no está aceptado íntegramente.

**Fecha:** 11 de octubre de 2026.  
**Conclusión:** se puede comenzar el desarrollo de las operaciones ordinarias de H7. H6 conserva comprobaciones pendientes del nuevo acceso; H7 completo y lanzamiento requieren pruebas y decisiones adicionales.

## Comprobaciones de esta revisión

- Se leyeron reglas de proyecto/código, guía, H7, diseño vigente de acceso sin SMS y reportes de H6. Se revisaron migración, Actions, sesión privada y pruebas preparadas del acceso.
- Consulta de solo lectura al proyecto vinculado `geazxsvjkqpzbghlywbw`: 15 migraciones y 18 tablas propias; migración sin SMS aplicada. Las cuatro RPC por clave permiten service_role, deniegan anon/authenticated y pertenecen a app_owner. Esquema privado denegado; clave/hash fuera de proyección.
- Fidelización deshabilitada, ningún programa activo y cero clientes/tarjetas/eventos/premios. No se hicieron cambios remotos ni se introdujeron fixtures.
- SHA-256 de la migración coincide con [reporte H6](README.md). Enlaces locales válidos y bloques Markdown equilibrados; ningún componente propio supera 170 líneas. Archivos `.env.local` y `.env.remote.local` ignorados por Git.
- Se corrigieron en la guía las referencias antiguas a verificación telefónica/proveedor del cliente, sustituidas por contacto declarado y acceso privado.

Las 108 unitarias, lint, TypeScript, build y comprobación de secretos aprobados pertenecen a la entrega inmediata anterior, según su reporte. No se repitieron esas suites en esta revisión sin cambios de aplicación. Integración PostgreSQL, pgTAP, reconstrucción y navegador del nuevo acceso siguen pendientes por instrucción expresa del propietario; no se inició Docker.

## Trabajo que puede comenzar

[H7](../../../07-hito-7-correcciones-y-operacion.md) permite avanzar en reversión ordinaria de sellos, restauración contable de ordinales, historial/corrección de nombre e indicaciones, gestión de incidencias y herramientas de personal con permisos, auditoría e idempotencia. Su aceptación exige pruebas transaccionales y de concurrencia; esta revisión no las sustituye.

## Decisiones que afectan el cierre

| Pendiente | Decisión necesaria | Trabajo afectado |
| --- | --- | --- |
| PT-08 | Personas autorizadas; cómo verificar titularidad al perder enlace/dispositivo, revocar/rotar acceso y actuar ante una caída. Teléfono declarado no prueba titularidad. | Recuperación asistida, contingencia y capacitación. |
| PT-11 | Procedimiento de baja y conservación aprobado, sin inventar plazos legales o purgas. | Baja excepcional, reapertura y operación pública. |
| PT-13 | Qué hacer con un premio registrado como canjeado que finalmente no se entrega. | Resolución concreta del incidente y cierre integral de H7. |

Estos pendientes no impiden las correcciones ordinarias ya definidas. La recuperación, purga o restitución no aprobadas no se implementan por suposición. Costo real del premio, términos/privacidad, personal, servicios internos y piloto conservan sus condiciones de lanzamiento; fidelización permanece pausada.

Referencias: [H6](../../../06-hito-6-fidelizacion.md), [diseño sin SMS](../../../../diseno-tecnico/16-acceso-a-tarjeta-sin-sms.md), [registro central](../../../../diseno-tecnico/README.md) y [guía de hitos](../../../hitos-del-proyecto.md).
