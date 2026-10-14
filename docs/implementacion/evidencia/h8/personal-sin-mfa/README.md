# DC-22 — Personal sin MFA

**Fecha:** 13/10/2026. **Decisión:** retirar segundo factor para administrador y atención; conservar correo/contraseña y rol vigente. [Diseño](../../../../diseno-tecnico/19-acceso-del-personal-sin-mfa.md).

## Cambio verificado

Login y recuperación continúan directamente a /personal después de verificar identidad/cuenta activa. Administración, fotos, invitaciones y recuperación de tarjeta exigen manager vigente. Eliminados formulario, acciones, QR, códigos y validación MFA. /personal/mfa solo redirige por compatibilidad. DTO assuranceLevel es informativo, también para sesiones históricas.

Migración adicional conserva firma, dueño, grants y dependencias de require_staff(text,boolean); require_mfa queda deprecado/ignorado. No se alteran tablas, roles asignados, RLS, auditoría, idempotencia ni reglas comerciales. [Hash y comandos](verificacion.json).

**Supabase oficial:** 24 migraciones; nueva migración aplicada después de historial y dry-run. TOTP enrolamiento/verificación deshabilitados con perfil parcial; MFA por teléfono permanece deshabilitado. Dos cambios declarados y diez ajustes remotos preservados, incluidos URLs/callbacks confirmados. Una cuenta de personal revisada; cero factores preexistentes y cero restantes, sin eliminar usuarios ni contraseñas. [Resultado sanitizado](supabase-oficial.json). Detalles de operador permanecen en .test-fixtures ignorado.

## Pruebas

| Comprobación | Resultado real |
| --- | --- |
| Yarn unitarias | 128/128, 28 archivos; seis casos de Actions incluyen AAL1 directo y AAL2 histórico, permiso inválido, entrada manipulada, recuperación fija y 429. |
| SQL local | 132/132 en nueve archivos, base reconstruida con la nueva migración. |
| Integración local | 113 casos de 17 archivos validados. Una expectativa antigua de denegación AAL1 en Storage falló; se cambió por subida permitida a manager y rechazo a atención, padre retirado y sobrescritura; cinco casos del archivo aprobados al repetir. |
| Chrome local | 50/50 en 229,16 s: acceso, contraseña errónea, alias, recuperación/enlace usado, invitación, roles, carta, fotos, carrito, tarjeta, canjes y administración. |
| Lint | Aprobado. |
| Builds con TypeScript | Local 42,79 s y remoto 28,43 s aprobados. |
| Frontera servidor/cliente | Next rechaza importación server-only desde cliente; aprobado. |
| Tipos | Regenerados desde public/app_private del oficial. |
| Preflight oficial | ready=true; sin ADMINISTRATOR_MFA. Lanzamiento sigue pendiente de pagos, costo, textos y piloto. |

Primer intento unitario restringido falló por ENOENT en archivos temporales del runner, antes de ejecutar los casos afectados. Repetición fuera del entorno restringido aprobada; no se presenta ese primer intento como éxito.

## Interfaz y evidencia

Skill ui-ux-pro-max: accessible authentication --domain ux -n 2; resultado Accessible Authentication (Minimum), All aplicado a pegado y gestores. Sistema canónico conservado, guías Next instaladas consultadas. [Capturas](capturas/) separadas de reportes anteriores; QR/tokens/credenciales reales no se capturan. Axe, etiquetas, teclado, focos y reflujo forman parte de los E2E; inspección de la nueva contraseña confirma formulario sin autenticador. La evaluación humana pendiente conserva su alcance. Revisión documental: 36 archivos, 568 enlaces locales y bloques equilibrados; componentes modificados dentro del máximo de 170 líneas.

[Recuperación](capturas/h2/capturas/recuperacion.png) y [acceso móvil](capturas/h2/capturas/acceso-390.png). Datos sintéticos; pruebas de invitación usan Auth/Mailpit local, sin enviar mensajes a personas reales.

## Publicación

Código y documentación se publican en GitHub para el siguiente deployment de Vercel. Variables de Production conservan APP_SITE_URL=https://fuegoybrasas.vercel.app y APP_DEPLOYMENT_TARGET=production. Archivos privados y snapshots no se publican. Escaneo de repositorio aprobado sobre 880 archivos candidatos; 43 recursos estáticos del build remoto sin claves privadas configuradas. [Guía](../despliegue.md).

Esto cierra la retirada técnica de MFA; no acredita despliegue Vercel, SMTP real, aceptación humana/piloto ni activación de pedidos o fidelización.
