# 19. Personal con correo y contraseña, sin MFA

**DC-22 · 13/10/2026:** el propietario pide retirar también MFA del personal. Esta decisión sustituye requisitos previos de AAL2, QR, TOTP, enrolamiento y recuperación de autenticador. DC-20 continúa retirando CAPTCHA. [Registro central](README.md), [seguridad](04-autenticacion-seguridad.md) y [H2](../implementacion/02-hito-2-acceso-del-personal.md).

## Acceso y autorización

1. `/personal/acceso` recibe correo y contraseña, valida entradas y llama a Supabase Auth.
2. Se consulta `get_staff_access` con la identidad autenticada. Cuenta sin autorización activa o retirada queda denegada, incluso con sesión aún vigente.
3. Cuenta autorizada continúa directamente a `/personal`; las páginas y operaciones administrativas exigen rol `manager`. Atención conserva búsqueda, sello y canje autorizados.
4. `/personal/mfa` solo redirige a `/personal` por compatibilidad con enlaces antiguos; allí se exige la sesión y autorización actuales. No muestra ni ejecuta un desafío.

Se eliminan el componente/formulario, acciones, tipos y validación de MFA. Login, recuperación, cambio de contraseña, catálogo, fotografías, invitaciones y recuperación de tarjeta dejan de exigir AAL2. Siguen vigentes validación de origen, permisos por operación, restricciones de Storage, RLS/grants, revisión, diario, auditoría e idempotencia. Cliente mantiene acceso por enlace privado sin SMS.

`assuranceLevel` en el DTO sigue describiendo la sesión del proveedor por compatibilidad; **no autoriza ni deniega operaciones**. Se aceptan sesiones de contraseña AAL1 y sesiones históricas AAL2 sujetas siempre al mismo rol vigente. No se conceden permisos por `user_metadata`, por conocer un UUID ni por ocultar controles.

## Base de datos

[Migración adicional](../../supabase/migrations/20261014000000_staff_access_without_mfa.sql) reemplaza exclusivamente el cuerpo/default de `app_private.require_staff(text, boolean)`, conservando propietario, permisos y firma de las RPC/políticas que dependen de él. La función exige identidad, cuenta activa/no retirada y rol requerido; no comprueba AAL2.

El segundo parámetro `require_mfa` se conserva **deprecado e ignorado** para compatibilidad con llamadas antiguas. Su valor predeterminado es `false`; una llamada antigua con `true` tampoco exige segundo factor y mantiene los mismos permisos por rol. No se reescriben migraciones aplicadas, no se abren tablas ni se deshabilita RLS. Dinero, catálogo, sellos, premios y conservación no cambian.

## Supabase Auth

Deshabilitar enrolamiento y verificación TOTP usando un **perfil parcial**, después de revisar sus diferencias; conservar URL/callbacks del dominio confirmado, contraseña, correo, límites y otros ajustes. Configuración local de pruebas también usa TOTP deshabilitado.

Para cuentas del personal con factores existentes, comprobar identidades desde `staff_accounts` y retirar sus factores mediante la API administrativa Auth, con claves exclusivas de operador/servidor y verificación posterior. Es necesario para que la recuperación de contraseña tampoco quede condicionada a factores anteriores. No editar tablas gestionadas de Auth mediante SQL ni eliminar usuarios, contraseñas, roles o historial. Guardar solo conteos y resultado en evidencia; detalles privados del operador permanecen ignorados por Git.

El preflight conserva cuenta administrativa activa como condición de lanzamiento y elimina `ADMINISTRATOR_MFA`; costo, pagos, condiciones/privacidad y piloto siguen siendo condiciones independientes.

## Recuperación e invitación

`/auth/confirm` verifica token y tipo permitido, fija sesión y permiso temporal firmado; `/personal/restablecer` exige ese permiso e identidad autorizada antes de aceptar una contraseña de al menos doce caracteres. Respuesta genérica para la solicitud de correo, callback fijo, límites Auth y tokens fuera de registros/URL final se conservan. Una contraseña nueva no otorga otro rol.

Invitaciones siguen reservadas al administrador y a la operación por etapas/idempotente de H7. No enviar correos sin canal configurado y autorización del destinatario. Retirar MFA no demuestra SMTP real ni habilita personal no autorizado.

## Interfaz y pruebas

Se conserva el sistema visual, Tailwind, etiquetas/autocomplete, pegado/gestores, carga contextual y prevención de dobles ejecuciones. `ui-ux-pro-max`, búsqueda `accessible authentication --domain ux -n 2`: el resultado **Accessible Authentication (Minimum), All** respalda pegado y gestores; no introduce otros métodos de acceso. Guías de Forms/Auth del Next.js instalado consultadas.

Comprobar login directo, contraseña inválida, alias antiguo, recuperación con nueva contraseña, enlace usado/invalidado, invitación y permisos por rol. Probar SQL/RPC y Storage con AAL1 real; JWT aún válido de cuenta desactivada debe quedar denegado. Conservar pruebas de concurrencia, historial, sellos y canjes usando cuentas sintéticas sin factores, exclusivamente en Supabase local.

La aceptación y aplicación oficial se registrarán en [evidencia de retirada](../implementacion/evidencia/h8/personal-sin-mfa/README.md); esta especificación por sí sola no acredita las pruebas ni un deployment Vercel.
