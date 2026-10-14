# Preparar GitHub y Vercel

**Estado:** configuración del repositorio preparada; comprobar publicación y URL real en el [reporte](README.md). No se ha aprobado activar pedidos/programa.

## Dominio confirmado

El propietario confirmó el 13/10/2026 **[https://fuegoybrasas.vercel.app](https://fuegoybrasas.vercel.app)** como origen de producción. En Vercel, exclusivamente en Production:

```dotenv
APP_SITE_URL=https://fuegoybrasas.vercel.app
APP_DEPLOYMENT_TARGET=production
```

El archivo `.env.remote.local` de desarrollo conserva `http://localhost:3000` y `development`; importar sus credenciales y sustituir estas dos entradas en el hosting. No se crea otra copia del archivo de secretos. `ENABLE_EXPERIMENTAL_COREPACK=1` ya está incluido. Las variables de Vercel aún debe guardarlas el propietario; no se dispone de un proyecto Vercel autenticado en este entorno.

**Supabase Auth aplicado y verificado:** Site URL `https://fuegoybrasas.vercel.app`, callback exacto `https://fuegoybrasas.vercel.app/auth/confirm` y callbacks exactos de desarrollo `http://localhost:3000/auth/confirm` / `http://127.0.0.1:3000/auth/confirm`. CLI 2.119.0 documenta que un perfil parcial solo aplica propiedades declaradas. Se comparó un perfil privado mínimo, se verificaron las dos diferencias declaradas y se aplicó al proyecto oficial `geazxsvjkqpzbghlywbw`; la comparación posterior confirma las URLs y conserva diez propiedades remotas no declaradas. No se aplicó el `supabase/config.toml` local completo, no se cambió MFA/CAPTCHA/SMTP y no se enviaron correos. Snapshots bajo `.test-fixtures`, ignorados por Git.

`yarn release:check` con este origen y el SHA real `bb546c4` completo: `ready=true`, sin problemas de configuración. Continúan pendientes de lanzamiento `PAYMENTS`, `ADMINISTRATOR_MFA`, `REWARD_COST` y `LOYALTY_DOCUMENTS`; el comando solo lee y no activa funciones. La consulta pública a `/api/health` devolvió HTTP 404 antes del nuevo deployment: aún no acredita una aplicación publicada correctamente. Guardar variables y hacer Redeploy; comprobar después los recorridos públicos y la salud del nuevo deployment.

## Variables de Vercel

**DC-20, 13/10:** [CAPTCHA retirado](acceso-personal-sin-captcha.md) por el propietario. No importar claves de ese proveedor; el acceso del personal mantiene contraseña/MFA. Supabase oficial tiene CAPTCHA deshabilitado, comprobado mediante lectura de configuración.

Importar `https://github.com/ZecarlosF07/fuegoybrasas` con la rama publicada `master`. Instalar con Yarn 1.22.22 / Node 22; `vercel.json` invoca `corepack yarn` para instalación, build y desarrollo. Corepack usa `packageManager: yarn@1.22.22` y evita depender de la versión global del hosting. Configurar **solo Production**, conservar Preview sin claves oficiales. El launcher rechaza ese uso de preview y falla de forma explícita.

El primer intento de Vercel reportó Yarn global 1.22.19 incompatible con el engine 1.22.22. La corrección mantiene la versión y lockfile, e invoca Corepack directamente; no modifica el Yarn global de la computadora. Si existe un override manual antiguo en Vercel, eliminarlo o usar los mismos comandos de `vercel.json`. El soporte automático de Corepack también puede habilitarse con `ENABLE_EXPERIMENTAL_COREPACK=1`; [documentación Vercel](https://vercel.com/docs/builds/configure-a-build#corepack) y [ejecución directa de Corepack](https://github.com/nodejs/corepack/blob/main/README.md#corepack-binary-nameversion--args).

Verificación de la corrección: caché Corepack aislada en `.test-fixtures`; `corepack yarn --version` devolvió 1.22.22, instalación `--frozen-lockfile` aprobada (0,27 s) y build remoto aprobado (16,21 s). Lockfile idéntico al commit publicado, SHA-256 normalizado `6c9b69cf4a9433fd39236b85d7e5559ef17674ace3d14229e16d2a466e11d90f`. No demuestra todavía un build en Vercel.

**Simplificación del 13/10/2026:** importar las variables de **`.env.remote.local`**. Se eliminó `.env.vercel.local`, que duplicaba las seis entradas de credenciales/confirmaciones del archivo remoto; se conservaron Corepack y las preferencias de indexación/diagnóstico, ambas deshabilitadas. `.env.local` conserva credenciales diferentes del entorno aislado de pruebas y `.env.example` sigue siendo una plantilla sin secretos: no son copias redundantes y no se importan en Vercel.

En Vercel, abrir la sección **Environment Variables** del proyecto, importar o pegar las entradas de `.env.remote.local` y seleccionar exclusivamente **Production**. Antes de guardar, sustituir `APP_SITE_URL=http://localhost:3000` por `https://fuegoybrasas.vercel.app` y `APP_DEPLOYMENT_TARGET=development` por `production`. Mantener esos dos valores de desarrollo en el archivo de la computadora. Marcar las dos claves de servidor como Secret y generar un nuevo deployment después de guardar. [Gestión oficial de variables](https://vercel.com/docs/environment-variables/managing-environment-variables).

Comprobación de la limpieza: archivo duplicado ausente, claves remotas completas y pruebas con URL local conservadas; 31 enlaces locales válidos y 758 archivos candidatos sin secretos versionados. `yarn build` aprobado con TypeScript en 31,90 s tras renovar la caché: los dos intentos previos fallaron al iniciar el proceso auxiliar de Turbopack. La caché anterior queda en `.test-fixtures`, ignorada por Git. Esta comprobación es de la computadora, no de un deployment Vercel.

| Variable | Valor o procedencia |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://geazxsvjkqpzbghlywbw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública del proyecto; copiar desde el archivo privado existente o dashboard. |
| `SUPABASE_SECRET_KEY` | Clave privada del proyecto; exclusiva del servidor, marcada como sensible en Vercel. |
| `STAFF_AUTH_FLOW_SECRET` | Conservar el secreto actual; exclusivo del servidor y sensible. Rotarlo invalida las claves derivadas de recuperación: requiere procedimiento propio. |
| `APP_SITE_URL` | `https://fuegoybrasas.vercel.app`, origen confirmado sin rutas ni parámetros. |
| `APP_DEPLOYMENT_TARGET` | `production` |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1`, incluido en el archivo remoto para seleccionar Yarn 1.22.22. |
| `APP_RELEASE_ID` | Omitir para usar `VERCEL_GIT_COMMIT_SHA`; no usar un SHA antiguo fijado manualmente. |
| `APP_TELEMETRY_ENABLED` | `false` en el archivo actual; cambiar a `true` solo si se acepta el diagnóstico sanitario del diseño 18, con registros sin PII. |
| `APP_INDEXING_ENABLED` | `false` hasta publicación aceptada. |
| `LOYALTY_TERMS_APPROVED` / `LOYALTY_PRIVACY_APPROVED` | `false` hasta aprobar los textos correspondientes. |
| CAPTCHA | Retirado por DC-20. No requiere proveedor, site key ni secreto; Auth oficial lo tiene deshabilitado. |

No subir archivos `.env`, contraseñas iniciales, `.test-fixtures`, claves de CLI, conexión PostgreSQL ni `.vercel`. Variables públicas se incluyen al compilar; cambiar entorno requiere nuevo build. [Vercel: entornos](https://vercel.com/docs/deployments/environments).

## Antes de desplegar

1. Verificar historial con `yarn supabase migration list --linked --agent=no`, después dry-run. No resetear remoto ni alterar historial para ocultar diferencias.
2. Ejecutar las pruebas aisladas e inspecciones de secretos. CI no carga variables de producción.
3. Supabase Auth ya usa Site URL y callbacks exactos del apartado «Dominio confirmado». Comprobarlos de nuevo si cambia el dominio. No aceptar destinos externos manipulados ni comodines generales.
4. Ejecutar `yarn release:check` con `APP_SITE_URL` y SHA reales en el entorno del comando. Leer códigos y [preflight](preflight-remoto.json); esta consulta no activa flags.
5. En Vercel comprobar SHA, logs sanitizados, `/api/health`, `/api/catalog`, robots, carta, acceso y MFA del administrador. No usar clientes reales como fixtures.

El preflight en desarrollo devuelve `SITE_URL` / `RELEASE_ID` porque el entorno habitual conserva localhost. Es un resultado esperado de preparación incompleta, no una autorización de lanzamiento ni un fallo ignorado.

## Primera cuenta

La cuenta inicial ya fue creada sin correo por petición del propietario. Su contraseña aleatoria se guarda en `.test-fixtures/initial-administrator.json`, ignorado por Git. El propietario debe abrirlo localmente, entrar a `/personal/acceso`, configurar su propio TOTP y conservar la recuperación del autenticador en un lugar seguro. No compartir capturas de contraseña/QR. No configurar un factor real desde las pruebas.

`yarn staff:bootstrap:official correo-confirmado@example.test` es una herramienta excepcional de operador: exige destino oficial y ausencia de otro administrador activo. Guarda diario antes del alta, no toma cuentas existentes y permite conciliar reintentos. No ejecutarla en CI/hosting ni usarla para altas ordinarias.

Sin SMTP no se envía ninguna invitación. Las pantallas existentes de recuperación/invitación por correo requieren un canal probado para uso real; no se dan por aceptadas solo por funcionar con Mailpit.

## Activación y reversión

Tras completar el [piloto](piloto-y-aceptacion.md), confirmar pagos reales, personas/MFA, costo del premio y textos de privacidad/condiciones. `yarn release:check --launch` añade controles de estos datos; no demuestra piloto ni envía solicitudes a WhatsApp.

El administrador puede habilitar pedido desde configuración comercial cuando estén confirmados sus requisitos. El programa se activa mediante su operación transaccional con costo y confirmaciones, no mediante escritura directa de `loyalty_enabled`. Aprobar también disponibilidad de cocina.

Ante defecto, pausar funciones desde sus controles, conservar UUID inciertos y volver a un despliegue compatible. **Rollback de código no deshace una migración ni un canje.** Probar la versión anterior frente al esquema vigente; ajustes DB por migración adicional, sin borrado de historial. Mantener variables públicas del entorno del build elegido.
