# H8 — Publicación y operación

**Fecha:** 12/10/2026. Decisiones vigentes del propietario; [evidencia](../implementacion/evidencia/h8/README.md). Este documento amplía los diseños anteriores sin convertir preparativos en aceptación del lanzamiento.

## Decisiones

| ID | Decisión | Aplicación |
| --- | --- | --- |
| DC-16 | GitHub `ZecarlosF07/fuegoybrasas` y Vercel; Supabase oficial único `geazxsvjkqpzbghlywbw`. | Desarrollo habitual y hosting usan el remoto. Reconstrucciones, correo sintético y pruebas destructivas usan únicamente local. No se crea un segundo proyecto. Preview nunca recibe credenciales oficiales. |
| DC-17 | Crear el administrador inicial directamente, con correo confirmado, sin enviar invitación. | Contraseña aleatoria en archivo privado ignorado; auditoría de bootstrap y MFA obligatorio al entrar. No se envían correos ni se habilita registro público de personal. Clientes siguen sin Auth/SMS. |
| DC-18 | Maps confirmado; precios de imágenes aplican a recojo/entrega salvo P05; Mostritos regulares incluyen chaufa, papas y ensalada. | Migración versionada. Publicar solo referencias que además tengan porción e inclusiones completas. C01 permanece para mesa, P05 sin recojo, alitas 4/16. |
| DC-19 | Horarios y pagos estimados hasta recibir datos reales. | Guardar 12:00–23:00, lunes–domingo, con `schedule_confirmed=false`. Efectivo/Yape/Plin son borradores deshabilitados y sin verificar. La proyección pública los oculta; no afirmar abierto/cerrado ni aceptación de un medio de pago. |

No se modifica el premio de diez sellos, su canje posterior ni la exclusión de bajas de clientes. Precio de venta no equivale a costo del premio. No se asume autorización de privacidad, conservación, contratación, piloto ni activación pública.

## Configuración de publicación

`scripts/run-remote-next.mjs` verifica el proyecto oficial y carga el entorno ignorado para `yarn dev/build/start`. En Vercel, las variables se inyectan desde el hosting: nunca subir `.env.remote.local` ni secretos al repositorio. `APP_DEPLOYMENT_TARGET=production` exige origen HTTPS confirmado y SHA de 40 caracteres; `VERCEL_GIT_COMMIT_SHA` permite identificar la versión. El build falla con códigos seguros si el destino es incorrecto o preview usa el perfil oficial.

Vercel debe importar la rama publicada en GitHub y ejecutar `yarn install --frozen-lockfile` / `yarn build`. [Entornos de Vercel](https://vercel.com/docs/deployments/environments). La integración y su URL deben confirmarse en la cuenta real; añadir `vercel.json` no despliega por sí solo.

`APP_INDEXING_ENABLED=false` por defecto. Desarrollo y preview conservan `noindex/nofollow` y robots que deniega rastreo. Tras aceptación, producción puede habilitar indexación de carta/productos; las páginas privadas mantienen su exclusión. Robots es una indicación para buscadores, nunca una barrera de autorización.

## Salud y diagnóstico

`GET /api/health` devuelve exclusivamente `{ status, release }`, 200 o 503, sin caché. Verifica variables necesarias; no consulta clientes, Auth o DB y no afirma disponibilidad de esas dependencias. Para comprobar Data API usar también `/api/catalog` y su respuesta `ok`; un 200 con `ok:false` representa fallo. No consultar tarjetas para monitoreo público.

Con `APP_TELEMETRY_ENABLED=true`, operaciones de servidor emiten UUID de petición, categoría, resultado, código permitido y duración. Se marca lento desde tres segundos. Instrumentation registra únicamente categoría de ruta y fallo genérico; su duración cero no es una medición de latencia. No se copian URL, cuerpo, SQL, errores internos, cookies, claves, teléfono, preferencias ni texto de WhatsApp. No existe un proveedor de alertas contratado/configurado automáticamente.

Cabeceras: `nosniff`, `DENY`, `no-referrer` y Permissions Policy sin cámara/micrófono/geolocalización. No se desactiva zoom. Autorización actual, RLS, RPC y MFA continúan en cada operación; health y Proxy no los sustituyen.

## Carta y datos

23 migraciones y 18 tablas propias. La migración H8 publica C02–C04, C07–C11, C21–C24, P01–P04; P05 ya estaba publicado. Total: **17 referencias públicas**. Once referencias sin contenido completo siguen en borrador, además de C01 excluido de la web. No se crean equivalencias u opciones sin aprobación.

La ubicación muestra el nombre del negocio y coordenadas confirmadas; no inventa calle/número. El enlace limpia `fbclid`. Los cargos y cobertura siguen desconocidos donde el contrato permite informar confirmación posterior por WhatsApp. Horario provisional permanece visible solo para administración.

## Verificación y recuperación

CI construye un entorno local desde cero, sin claves oficiales. El preflight remoto es de solo lectura y distingue preparación técnica de habilitación pública; [procedimiento](../implementacion/evidencia/h8/despliegue.md). Mantener ambos flags apagados hasta aprobar el piloto y las condiciones del programa.

El ensayo H7 recupera SQL/Auth y concilia un canje posterior; H8 amplía al esquema Storage, registro MFA y bytes sintéticos guardados por separado, con hash. Los roles preexisten en el clúster y no se configura una segunda plataforma HTTP. El dump SQL no incluye los bytes de Storage; [límite oficial](https://supabase.com/docs/guides/platform/backups). El plan real contratado, exportación cifrada, custodia, prueba fuera de la máquina y recuperación del autenticador siguen pendientes.

Supabase recomienda revisar configuración, seguridad y servicios antes de producción; [guía oficial](https://supabase.com/docs/guides/deployment/going-into-prod). DC-20 retira CAPTCHA del personal; login y recuperación usan contraseña/MFA y límites Auth. Supabase oficial ya tiene CAPTCHA deshabilitado, comprobado mediante lectura de configuración. SMTP no se necesita para crear esta cuenta inicial, pero las funciones existentes de invitación/recuperación por correo no se consideran listas sin un canal probado o un procedimiento alternativo aprobado.
