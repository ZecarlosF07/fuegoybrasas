# DC-20 — Personal sin CAPTCHA

**Fecha:** 13/10/2026. **Origen:** el propietario pide retirar CAPTCHA del personal. Esta decisión sustituye cualquier requisito anterior de site key/proveedor/widget en login o recuperación. Los reportes y hashes históricos conservan lo que se probó en su fecha.

## Cambio aplicado

- Login acepta únicamente correo y contraseña; recuperación, únicamente correo. Formularios sin widget, scripts externos, token ni bloqueo por claves CAPTCHA ausentes.
- Se eliminan componente, helper de servidor, tipos y declaración global del proveedor. Formularios mantienen labels, autocomplete, pegado, errores, POST y carga contextual con bloqueo de doble ejecución.
- Auth sigue validando contraseña; autorización consulta personal activo/rol y AAL actual. AAL1 conduce a MFA y área interna exige AAL2. No se retira MFA ni se concede un rol desde formulario.
- Límites del proveedor se conservan; 429 muestra `RATE_LIMITED`. Recuperación conserva callback fijo, respuesta genérica, permiso firmado y autenticador existente.
- Variables `AUTH_CAPTCHA_PROVIDER` y `NEXT_PUBLIC_CAPTCHA_SITE_KEY` retiradas de `.env.example` y archivos privados de desarrollo/importación. Para Vercel continúa pendiente `APP_SITE_URL` HTTPS real.
- Supabase oficial `geazxsvjkqpzbghlywbw`: lectura de `config pull` en snapshot privado ignorado confirma **`auth.captcha.enabled=false`**. No se aplicó configuración local al remoto ni se cambiaron callbacks, SMTP o tablas.

No requiere migración DB, cuenta Cloudflare, nueva clave o contratación. El desarrollo habitual mantiene el Supabase remoto y las pruebas sintéticas usan local.

## Revisión y pruebas

`ui-ux-pro-max`, consulta `accessible authentication --domain ux -n 2`: resultado **Accessible Authentication (Minimum), All** recomienda pegado/gestores; se conservan ambos. El resultado secundario ARIA Labels no modifica esta pantalla, que ya tiene etiquetas visibles. Sistema canónico/MASTER conservados sin otra paleta. Guía de Forms del Next.js instalado consultada.

Pruebas nuevas de Actions: origen HTTPS sin claves CAPTCHA continúa a MFA, AAL2 autorizado continúa, personal sin permiso se deniega, entradas inyectadas se rechazan antes de Auth, recuperación usa callback fijo sin token y 429 conserva error explícito. **6/6 aprobadas**; regresión unitaria **128/128 en 28 archivos**. Lint completo y build local con TypeScript aprobados.

`yarn playwright test tests/e2e/staff-access.spec.ts --project=core --no-deps --workers=1`: **7/7 aprobadas** en 55 s (57,94 s de comando). Login, enrolamiento TOTP, recuperación que conserva MFA, invitación local, permisos y callback inválido; sin JavaScript el formulario no expone credenciales por GET. A 360/390/768/1280/320 px se comprobaron etiquetas/autocomplete, axe, ausencia de scripts Turnstile/hCaptcha y botón utilizable sin token. [Capturas nuevas](capturas-sin-captcha/h2/capturas/), sin reemplazar evidencia previa. El origen HTTPS sin claves CAPTCHA se comprobó en unitario, no en un deployment Vercel real.

La configuración de Supabase se leyó mediante CLI autenticada, sin imprimir secretos. Snapshot queda bajo `.test-fixtures`, ignorado por Git. No se envían correos ni se crean sesiones de personal real para probar.

Build remoto final `yarn build`: aprobado con TypeScript, **19,74 s**. `yarn check:secrets`: 46 recursos estáticos sin claves privadas configuradas. Revisión de documentación: 17 archivos y 228 enlaces locales válidos. Inspección visual de acceso 390 px confirma formulario de correo/contraseña, botón y recuperación sin widget, con marca canónica. La comprobación de repo se realiza también antes del commit; configuración privada no se publica.

## Publicación

El commit final se sube a `master` en GitHub para el nuevo deploy. Si ya se agregaron las dos variables antiguas en Vercel, pueden eliminarse: el código nuevo no las consume. La URL HTTPS, credenciales oficiales y Corepack siguen siendo necesarios.

El cambio no habilita pedidos o fidelización ni cierra piloto/aceptación humana. [Despliegue](despliegue.md), [evidencia H8](README.md), [reglas vigentes](../../../diseno-tecnico/README.md).
