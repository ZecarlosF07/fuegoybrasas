# Fuego y Brasas

Web de la pollería con Next.js y Supabase. H1–H6 incorporan base visual, personal/permisos, carta, mantenimiento, pedido invitado por WhatsApp y tarjeta sin SMS. H7 añade indicadores de administrador, correcciones, incidencias y recuperación presencial. H8 prepara GitHub/Vercel, CI, salud, diagnóstico y operación, con pruebas integrales locales aprobadas. Piloto y activación pública siguen pendientes; pedidos y fidelización reales permanecen pausados.

- [Hitos y alcance](docs/implementacion/hitos-del-proyecto.md).
- [Especificación de H1](docs/implementacion/01-hito-1-preparacion-del-proyecto.md).
- [Evidencia y límites de H1](docs/implementacion/evidencia/h1/README.md).
- [Evidencia de H2](docs/implementacion/evidencia/h2/README.md) y [preparación/operación](docs/implementacion/evidencia/h2/operacion.md).
- [Evidencia de H3](docs/implementacion/evidencia/h3/README.md) y [matriz comercial](docs/implementacion/evidencia/h3/matriz-comercial.md).
- [Evidencia de H4](docs/implementacion/evidencia/h4/README.md) y [contratos y operación](docs/implementacion/evidencia/h4/operacion.md).
- [Evidencia de H5](docs/implementacion/evidencia/h5/README.md) y [contratos/operación](docs/implementacion/evidencia/h5/operacion.md).
- [Evidencia de H6](docs/implementacion/evidencia/h6/README.md) y [revisión sin SMS y comprobaciones pendientes](docs/implementacion/evidencia/h6/acceso-sin-sms/README.md).
- [Evidencia de H7](docs/implementacion/evidencia/h7/README.md).
- [Evidencia H8 y bloqueos](docs/implementacion/evidencia/h8/README.md), [importación en Vercel](docs/implementacion/evidencia/h8/despliegue.md), [operación](docs/implementacion/evidencia/h8/operacion.md) y [piloto](docs/implementacion/evidencia/h8/piloto-y-aceptacion.md).
- [Reglas de trabajo](AGENTS.md) y [reglas de código](.agents/rules/codigo.md).

## Requisitos

Por decisión DC-20, login/recuperación del personal no usan CAPTCHA ni requieren sus claves. Se conservan correo/contraseña, permisos vigentes y autorización por rol; [detalle y comprobación](docs/implementacion/evidencia/h8/acceso-personal-sin-captcha.md).

**DC-22:** personal con correo y contraseña, sin MFA; [diseño vigente](docs/diseno-tecnico/19-acceso-del-personal-sin-mfa.md) y [pruebas/aplicación oficial](docs/implementacion/evidencia/h8/personal-sin-mfa/README.md).

Para trabajar con la aplicación: Node 22 (versión verificada en `.node-version`) y Yarn **1.22.22**. Supabase CLI **2.119.0** está fijada como dependencia del proyecto: no se necesita instalarla globalmente. Docker Desktop con contenedores Linux se utiliza únicamente para las pruebas aisladas de base de datos/Auth; Chrome para E2E.

Next.js **16.3.8**, React **19.2.8**, TypeScript estricto y Tailwind 4. Las dependencias resueltas están en `yarn.lock`. Usar exclusivamente Yarn.

## Archivos de entorno

| Archivo | Uso |
| --- | --- |
| `.env.remote.local` | Credenciales del Supabase oficial para `yarn dev/build/start` en la computadora. |
| `.env.vercel.production` | Archivo privado listo para importar en Vercel, exclusivamente en **Production**, con el dominio confirmado y las credenciales oficiales. |
| `.env.local` | Supabase local de pruebas aisladas. No importar en Vercel. |
| `.env.example` | Plantilla versionada sin credenciales reales. No importar en Vercel. |

La copia `.env.vercel.local` se eliminó el 13/10/2026 tras comprobar que sus credenciales coincidían con el archivo remoto. Corepack y las preferencias de diagnóstico/indexación se conservaron en `.env.remote.local`. El desarrollo mantiene `APP_SITE_URL=http://localhost:3000` y `APP_DEPLOYMENT_TARGET=development`.

Por petición posterior del propietario, `.env.vercel.production` reúne las once variables para importar directamente: `APP_SITE_URL=https://fuegoybrasas.vercel.app`, `APP_DEPLOYMENT_TARGET=production` y `ENABLE_EXPERIMENTAL_COREPACK=1` ya están preparados. No requiere sustituir valores ni contiene claves CAPTCHA/MFA. Su nombre evita la carga automática de Next.js durante builds de pruebas locales; Vercel recibe sus variables mediante importación. Guardarlas en Production y generar un nuevo deployment; [guía de publicación y configuración Auth aplicada](docs/implementacion/evidencia/h8/despliegue.md). Los archivos con credenciales permanecen ignorados por Git; cambios posteriores de claves requieren actualizar también esta exportación.

## Desarrollo habitual con Supabase remoto

La aplicación se ejecuta en la computadora y utiliza el proyecto Supabase **`geazxsvjkqpzbghlywbw`**, URL `https://geazxsvjkqpzbghlywbw.supabase.co`. No requiere iniciar Docker ni una base local. Con `.env.remote.local` ya preparado:

```powershell
yarn install --frozen-lockfile
yarn dev
```

Abrir `http://localhost:3000`. **Localhost describe dónde corre Next.js; la base de datos es remota.** `yarn dev`, `yarn build` y `yarn start` cargan `.env.remote.local` y verifican el proyecto autorizado antes de iniciar Next. En hosting aceptan variables inyectadas sin necesitar ese archivo. Los nombres `dev:remote`, `build:remote` y `start:remote` siguen disponibles por compatibilidad.

Las 24 migraciones H1–H8/DC-22 están aplicadas en el oficial; [preflight](docs/implementacion/evidencia/h8/preflight-remoto.json). Hay 18 tablas propias (nueve públicas y nueve privadas), 29 referencias y bucket público `catalog-media`. Diecisiete referencias tienen precio y contenido publicables; once esperan contenido completo y C01 está excluido de venta web. Ubicación Maps confirmada. Horario y tres medios de pago estimados permanecen sin verificar; cargos/zonas pendientes. Pedidos y fidelización están pausados; programa draft, costo desconocido y disponibilidad false. Cuenta real inicial creada sin email, permisos vigentes pendiente. El administrador con autorización vigente entra a `/administracion` y sus herramientas; atención no puede editar catálogo ni consultar métricas.

`.env.remote.local` está ignorado por Git. Para preparar un equipo autorizado, después de autenticarse en la CLI:

```powershell
yarn supabase link --project-ref geazxsvjkqpzbghlywbw --agent=no
yarn env:remote geazxsvjkqpzbghlywbw
yarn dev
```

Las claves se obtienen del proyecto vinculado, no se crean claves nuevas. La clave secreta queda exclusivamente del lado servidor para administración y RPC acotadas de tarjeta. `APP_SITE_URL` permanece en localhost para desarrollo; actualizarlo al dominio confirmado antes del lanzamiento. H2 conserva Auth/permisos del personal; H6 crea tarjeta con nombre/contacto y clave privada, sin SMS. H7 implementa recuperación asistida aprobada. Costo y condiciones/privacidad siguen pendientes; DC-22 retira el segundo factor del personal. La cuenta inicial se creó directamente sin correos por decisión del propietario; invitación/recuperación por email no se consideran operativas sin canal probado. La fidelización permanece pausada; no requiere proveedor SMS.

Para compilar/ejecutar el servidor de producción: `yarn build` y `yarn start`. Next incluye las variables públicas durante la compilación; compilar para el entorno que se va a ejecutar. Los scripts de pruebas aisladas **rechazan una URL Supabase remota antes de crear identidades**.

Los comandos remotos usan `scripts/run-remote-next.mjs`: cargan el archivo remoto y lanzan Next en un proceso nuevo. No anteponer `node --env-file` directamente a Next en esta versión: desarrollo reenvía esa opción a `NODE_OPTIONS` y el proceso interno la rechaza. El lanzador conserva los env locales y no muestra credenciales.

## Entorno aislado opcional para pruebas

Solo para reconstruir el esquema y ejecutar pruebas con identidades sintéticas, abrir Docker Desktop y utilizar:

```powershell
yarn db:start
yarn env:local
yarn env:h2
yarn db:reset
yarn db:types:local
yarn dev:local
```

Studio de pruebas está en `http://127.0.0.1:54323`. `.env.local` contiene exclusivamente su conexión y está ignorado por Git. `env:local` no sobrescribe un archivo existente ni imprime claves. `dev:local`, `build:local` y `start:local` son comandos explícitos para ese entorno.

**`db:reset` elimina datos exclusivamente de la base de pruebas local** y reaplica migraciones/seed. `db:stop` detiene esos servicios conservando el respaldo por defecto de la CLI. No es un paso para desarrollar con el Supabase remoto. El backend de analítica está desactivado en esta configuración de Windows.

## Migraciones y tipos

```powershell
yarn supabase migration new nombre_del_cambio --agent=no
```

Versionar SQL en `supabase/migrations/` y los tipos reales en `src/types/database.types.ts`. Para objetos de `app_private`, crear dentro de una transacción usando **`SET LOCAL ROLE app_owner`**: sus defaults restrictivos pertenecen a ese rol. Es un propietario `NOLOGIN`, sin privilegios de administrador, separado de los propietarios de Auth/Storage. Restablecer el rol al finalizar. Las futuras RPC públicas reciben sus `REVOKE`/`GRANT`, RLS y autorización explícitos conforme al diseño; no heredar acceso por accidente.

No modificar a mano Auth/Storage ni el archivo generado. H2 añade las cuatro tablas comunes y RPC protegidas; H3 añade seis tablas comerciales con soft delete, proyección `read_catalog()` y carga de referencia. El puente privado mínimo de claims necesario para permisos administrados de Supabase se describe en [operación H2](docs/implementacion/evidencia/h2/operacion.md); no concede acceso directo a Auth.

Para enviar un cambio remoto, revisar primero el proyecto y el historial; usar este procedimiento solo con autorización para ese entorno:

```powershell
yarn supabase migration list --linked --agent=no
yarn supabase db push --linked --dry-run --agent=no
yarn supabase db push --linked --agent=no
yarn supabase db query --linked --file supabase/checks/card-access-readonly.sql --agent=no
yarn db:types
```

Las nuevas migraciones se aplican mediante CLI al proyecto remoto autorizado, manteniendo sus SQL en Git. `db:types` obtiene el esquema remoto y verifica el proyecto vinculado antes de escribir el archivo generado. Para comprobar reconstrucciones en el entorno aislado, usar `db:reset`, `db:types:local` y `test:db`; esas pruebas no sustituyen la aplicación remota. Nunca usar `db reset` remoto ni reparar historial para ocultar un conflicto. `db:start`, `db:stop` y `db:reset` son herramientas exclusivamente locales; el push remoto utiliza los comandos `--linked` anteriores.

La compilación limita workers a dos mediante `experimental.cpus` del Next instalado: quince procesos agotaron memoria durante las pruebas con Docker en Windows. TypeScript sigue habilitado; este límite controla concurrencia de build.

## Verificación

```powershell
yarn verify
yarn test:db
yarn test:integration
yarn test:boundary
yarn test:e2e
yarn check:secrets
yarn check:repository-secrets
yarn test:release
```

`verify` ejecuta lint, tipos, pruebas unitarias/de componentes y build. `test:db` comprueba permisos con pgTAP y revierte sus objetos; `test:integration` usa Auth/PostgreSQL local reales y elimina sus identidades sintéticas al finalizar. Ejecutar integración y E2E secuencialmente porque ambas prueban el singleton. `test:boundary` compila una copia temporal con una importación prohibida y exige su rechazo por Next, sin alterar la aplicación.

E2E compila explícitamente con `build:local`, inicia con `start:local` en el puerto **3100** y usa Chrome sin ventana. Incluye teclado, axe, reflujo y capturas nuevas en `docs/implementacion/evidencia/h8/capturas/`, preservando las históricas. La fixture de controles renderiza componentes reales con los estilos de producción dentro de la sesión de prueba; no publica una página de demostración. El bloqueo de dobles ejecuciones del botón asíncrono se verifica en pruebas de componentes. Si Chrome no está instalado, preparar ese requisito antes de ejecutar E2E. Después de E2E, ejecutar `yarn build` antes de `yarn start`: el build remoto debe volver a incluir sus propias variables públicas.

`check:secrets` busca las claves de servidor configuradas en los recursos estáticos compilados, sin mostrar sus valores. En CI que no disponga de esas claves, registrar esta verificación como no ejecutada y configurar una credencial sintética de prueba; nunca cargar claves productivas solo para correr tests.

## Organización y límites

- `src/app`: rutas y composición, carta/detalle, pedido invitado y páginas privadas.
- `src/features/catalog` y `catalog-admin`: carta y mantenimiento; `cart` y `checkout-config`: pedido local y condiciones comerciales; `staff` y `business-config`: acceso y configuración común.
- `src/features/loyalty`: acceso privado, contacto declarado, tarjeta, preferencias, operaciones de atención y configuración del programa; tipos/validaciones/servicios/componentes separados.
- `src/components/ui`: primitivas pequeñas, tipado separado y estilos Tailwind.
- `src/lib/env`, `src/lib/supabase`: configuración y contextos SDK; módulos privados protegidos con `server-only`.
- `src/contracts/types`, `src/lib/validation`, `src/lib/money`: contratos, validación y utilidades puras.
- `src/proxy.ts`: renovación de sesión Auth del personal; la tarjeta usa su cookie privada; no concede roles ni sustituye la autorización de H2.
- `supabase/`: configuración, migraciones, seed, pruebas SQL y comprobaciones de solo lectura.
- `tests/`: integración, navegador y fixtures; unitarias junto al módulo que verifican.

La entrada `globals.css` únicamente contiene las directivas del compilador Tailwind. No hay selectores CSS personalizados. El tema de ejecución está en `tailwind.config.ts`, conforme al [sistema visual canónico](.agents/brand/sistema-visual.md); no se introducen paletas por componente. Fraunces y Manrope se cargan con `next/font/local` desde WOFF2 versionados, con [procedencia y licencias](src/app/fonts/README.md); el build y el navegador no descargan fuentes de Google. El logotipo original sigue pendiente: se usa el nombre textual.

H2 aporta DTO de configuración/personal, validación y transacciones comunes. `/personal/acceso` inicia el recorrido privado; `/administracion/configuracion` exige manager activo. `yarn env:h2` prepara los secretos ignorados y `yarn staff:bootstrap:local UUID_VERIFICADO` crea únicamente el primer responsable local. PT-08, PT-11 y PT-13 conservan sus pendientes; no hay personal real provisionado ni SMTP productivo validado.

H6 añade `/mi-tarjeta/acceso`, `/mi-tarjeta`, `/mi-tarjeta/telefono` y `/personal/clientes/[id]`. Diez sellos por Mostrito de ⅛; acreditación después de compra presencial pagada y entregada. `/api/me/card` es propio y no-store. La nueva migración conserva solo el hash de clave privada; teléfono no autentica. [Diseño vigente](docs/diseno-tecnico/16-acceso-a-tarjeta-sin-sms.md). Hook Auth preparado para bloquear signup público, sin habilitarlo ni cambiar configuración remota. La revisión cuenta con unitarias/build/lectura remota; integración/pgTAP/navegador quedan pendientes por instrucción del propietario, según [reporte actual](docs/implementacion/evidencia/h6/acceso-sin-sms/README.md).
