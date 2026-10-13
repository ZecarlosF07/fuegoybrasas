# H2 — Preparación y operación

**Fecha:** 8 de octubre de 2026. Este procedimiento corresponde a la base técnica ordinaria. PT-08 sigue bloqueando el alta de personas reales y la recuperación excepcional de MFA. No se habilitan pedidos ni fidelización.

## Desarrollo habitual con el proyecto remoto

El proyecto de trabajo es `geazxsvjkqpzbghlywbw`; H1 y H2 ya están aplicados allí. Con `.env.remote.local` preparado, iniciar con **`yarn dev`**. También `yarn build` y `yarn start` usan ese proyecto, sin requerir Docker. En hosting se inyectan las variables de entorno; no se despliegan archivos de secretos. Los nombres `*:remote` permanecen compatibles.

Las nuevas migraciones se conservan en `supabase/migrations/` y se aplican al proyecto vinculado mediante CLI: comprobar `migration list --linked`, revisar `db push --linked --dry-run`, ejecutar `db push --linked` y la consulta de solo lectura del hito. `yarn db:types` obtiene los tipos del esquema remoto. No reconstruir ni resetear la base remota para probar un cambio. La [guía del repositorio](../../../../README.md) contiene los comandos completos.

## Preparación opcional de pruebas aisladas

Usar Node 22 y Yarn, Docker con motor Linux y el CLI fijado por el proyecto:

```powershell
yarn install --frozen-lockfile
yarn db:start
yarn env:h2
yarn db:reset
yarn db:types:local
yarn dev:local
```

`db:reset` reconstruye únicamente el entorno de pruebas local y borra sus datos: usarlo con datos sintéticos. `.env.local` queda reservado para estas pruebas; no es requisito del desarrollo habitual. `env:h2` añade a los env ignorados el secreto independiente de recuperación; también obtiene la conexión PostgreSQL exclusivamente local. No publica secretos ni sobrescribe valores existentes. Cada despliegue requiere su propio `STAFF_AUTH_FLOW_SECRET` aleatorio de al menos 32 bytes. Rotarlo invalida los permisos temporales de restablecimiento, sin cambiar claves de Supabase.

`auth.enable_signup=false` bloquea el registro público. El CLI 2.119.0 requiere `auth.email.enable_signup=true` para activar el proveedor email/password, incluido el login de cuentas existentes. Esa combinación se probó con alta rechazada y login real permitido. TOTP está activado para enrolamiento y verificación. No habilitar registro público para resolver un login.

## Primer responsable y pruebas

El operador crea una identidad Auth de prueba y comprueba su correo. Luego ejecuta:

```powershell
yarn staff:bootstrap:local UUID_DE_AUTH_VERIFICADO
```

El script valida UUID, destino local y confirmación de correo mediante la API administrativa aislada de Auth. Una transacción operada por PostgreSQL toma el lock global, exige que no exista responsable activo, crea el primer manager y audita `bootstrap_staff`. No contiene contraseñas en argumentos, no promueve cuentas existentes y no instala una función o endpoint de bootstrap. `created_by=NULL` solo corresponde a este alta inicial; las cuentas de fixtures posteriores registran al responsable creador.

El script rechaza destinos remotos. Antes del primer responsable real, PT-08 debe identificar operador/persona autorizada, confirmar correo y procedimiento. El mantenimiento completo de personas y recuperación excepcional se entrega en H7. No borrar MFA desde el navegador ni usar `admin.updateUserById` para saltar una verificación.

Las pruebas crean identidades sintéticas con secretos aleatorios mantenidos en memoria. La limpieza privilegiada local retira solo sus UUID; deshabilita temporalmente los triggers propios en una transacción y los restaura antes del commit. Esta excepción de fixtures no es un procedimiento comercial de purga ni resuelve PT-11. Ejecutar integración y E2E **secuencialmente**: ambas utilizan y restauran el singleton de configuración. No ejecutar esos tests contra Supabase remoto.

## Login, recuperación y sesiones

El personal inicia sesión en `/personal/acceso`, configura o verifica TOTP en `/personal/mfa` y accede a `/personal`. Solo `manager` con AAL2 accede a `/administracion/configuracion`. Las RPC vuelven a verificar la fila actual: un JWT previo no conserva acceso después de una baja. Atención no ve funciones administrativas; su trabajo operativo llega en H6.

La recuperación devuelve el mismo mensaje para correos existentes y desconocidos. Las plantillas locales usan exclusivamente `token_hash` y `type=invite|recovery`, dirigidos a `/auth/confirm`. El handler rechaza parámetros libres, valida OTP, comprueba personal activo y crea una cookie HttpOnly firmada, limitada a diez minutos y a esa identidad. La cookie es necesaria además de la sesión para escribir la contraseña mediante la Action.

Con un factor ya verificado, Supabase devuelve `insufficient_aal` al cambiar contraseña desde AAL1. Por ello `/personal/restablecer` solicita **el autenticador existente antes de mostrar el cambio de contraseña**; luego vuelve a la misma página, sin un destino enviado por el navegador. Después del cambio entra con el AAL2 ya obtenido. Una invitación sin factor verificado permite fijar contraseña y conduce al enrolamiento MFA. No se borra el factor, no se modifica rol/activo y una sesión AAL1 no entra al panel. El enlace usado, cookie expirada/manipulada o sesión ajena no concede permiso de restablecimiento.

Proxy renueva cookies por petición y aplica `private, no-store`. Sesión ausente o token inválido conduce al acceso, mientras una caída de Auth responde 503. Los guards también se aplican en páginas que leen datos; layouts no sustituyen las RPC. Logout limpia únicamente el diario privado y el estado privado de atención en `sessionStorage`, conservando futuros borradores de pedido invitado.

## Guardado, reintentos y conflictos

La configuración utiliza revisión y UUID. Antes de enviar, la pestaña registra únicamente actor, UUID, revisión, hash y fecha; no guarda dirección, teléfono ni valores del formulario. Las entradas se normalizan mediante la misma validación compartida del dominio. El hash del diario verifica integridad de reintentos locales; el hash canónico PostgreSQL es independiente y es la autoridad para idempotencia.

Un botón pendiente permanece deshabilitado e informa la operación. Hay una barrera inmediata antes del primer `await`, además del estado React. `OPERATION_UNCERTAIN` conserva entrada y UUID; «Comprobar resultado» consulta solo recibos propios con permiso vigente. `not_found` conserva la misma operación porque puede seguir en curso. Una entrada diferente no se reenvía con su UUID. Tras recarga el diario no reconstruye datos sensibles: consultar resultado o reintroducir exactamente los mismos datos antes de reintentar. No iniciar otro guardado para resolver una incertidumbre.

Un conflicto retiene los campos para revisión. «Descartar cambios y cargar versión actual» obtiene otra lectura autorizada; no sobrescribe silenciosamente. Recibos inmutables conservan el efecto original y `get_operation` añade la revisión vigente. No-op registra recibo sin subir revisión ni crear una auditoría ficticia.

## Configuración remota antes del personal real

Las migraciones son independientes de la configuración del proveedor Auth. Confirmar en el proyecto autorizado:

- Dominio HTTPS definitivo en `APP_SITE_URL`, Site URL y lista exacta de callbacks `/auth/confirm`, sin comodines abiertos.
- Proveedor email/password y TOTP activos; registro público bloqueado. Contraseña mínima de 12 caracteres.
- SMTP verificado, dominio remitente y entrega real de recuperación/invitación. Copiar las plantillas de `supabase/templates/` con el callback fijo.
- CAPTCHA Turnstile o hCaptcha habilitado **también en Supabase Auth**, con secreto allí y clave pública/proveedor en Next (`NEXT_PUBLIC_CAPTCHA_SITE_KEY`, `AUTH_CAPTCHA_PROVIDER`). La aplicación rechaza login/recuperación en un dominio no local si falta esta configuración.
- Límites efectivos de intentos/OTP/correo configurados y comprobados en Supabase. No se usa un contador global en memoria de Next ni se presume una espera exacta del proveedor: el feedback de 429 solicita esperar.
- Logs del hosting/reverse proxy sin query de `/auth/confirm`, cuerpos de Actions ni cabeceras de autorización. Next dev desactiva logs de peticiones, argumentos de Server Functions y consola del navegador; esto no configura los logs del hosting.
- Secretos exclusivamente en el servidor y compilación para el proyecto/dominio correctos. No desplegar `SUPABASE_LOCAL_DB_URL` ni herramientas de fixtures en el runtime web.

`yarn dev` carga `.env.remote.local` al iniciar. Reiniciar el proceso si se añadieron secretos al env; las variables públicas requieren build del entorno correspondiente. Ninguna prueba local demuestra SMTP/CAPTCHA productivos o autoriza personas reales.

## Particularidad de propiedad PostgreSQL

Los objetos de aplicación pertenecen a `app_owner` NOLOGIN. Supabase no permite que `postgres` delegue USAGE de Auth a ese rol. Se usa un puente mínimo **`app_private.request_claims()`**, propiedad de `postgres`, con `SECURITY DEFINER`, `search_path=''`, sin argumentos y solo `uid`/`aal`. Solo `app_owner` lo ejecuta; anónimo, autenticado y service role no tienen EXECUTE. No modifica Auth/Storage, no acepta identidades libres ni expone metadata. La FK Auth se declara como operador y se transfiere la tabla a `app_owner`; los restantes objetos se crean bajo ese rol y sus defaults restrictivos.

## Verificaciones

```powershell
yarn verify
yarn test:db
yarn test:integration
yarn test:e2e
yarn test:boundary
yarn check:secrets
```

`verify` compila para el proyecto remoto, sin modificar su base. Integración y E2E rechazan destinos Auth remotos; `test:e2e` compila con `build:local` y arranca `start:local`. Antes de usar `yarn start` tras E2E, volver a ejecutar `yarn build` para incluir las variables públicas remotas.

Los resultados y limitaciones quedan en el [reporte de H2](README.md). Los casos de MFA no guardan trazas Playwright ni capturas con QR/secretos. El correo local se inspecciona en Mailpit sin publicar su cuerpo/token. El bootstrap y los casos concurrentes se ejecutan con identidades sintéticas; no con el personal del negocio.
