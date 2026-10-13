# 04. Autenticación, autorización y privacidad

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. MFA del personal se conserva.

**Versión:** 1.1 · **Fecha:** 3 de octubre de 2026.  
**Relacionado:** [Modelo](03-modelo-de-datos.md), [Contratos](05-contratos-y-operaciones.md), [Operación](07-despliegue-y-operacion.md).

## 1. Acceso privado del cliente

Cliente crea su tarjeta con nombre, contacto peruano y términos, sin SMS ni contraseña. Clave criptográfica generada en servidor, hash persistido y acceso mediante cookie/enlace/QR. Teléfono no autentica, busca ni recupera tarjetas públicas. Las cuatro RPC por clave solo permiten service_role; servidor valida sesión propia y entrada estricta. [Contratos, amenazas, vigencia y recuperación](16-acceso-a-tarjeta-sin-sms.md).

## 2. Sesiones y componentes

Cliente: cookie HttpOnly/Secure HTTPS/SameSite=Lax; cada operación valida hash/vigencia/estado en SQL. Fragmento del enlace retirado de URL antes de apertura expresa. DTO y API propios no-store, sin hash/clave o datos de otros clientes. Olvidar acceso borra su cookie, pero no revoca el enlace ni la sesión staff. Recuperación asistida PT-08/H7 exige procedimiento aprobado, no solo un número declarado.

Personal: @supabase/ssr por petición, getClaims validado y consulta de permisos vigentes; getSession no autoriza. Proxy renueva sesiones del personal, no la cookie de cliente. Datos privados nunca tienen caché compartida. Autorización en cada Action/handler/RPC.

## 3. Personal y responsable

Cuentas individuales de correo y contraseña mediante Supabase Auth, sin formulario público que otorgue roles. Contraseña mínima propuesta de doce caracteres; recuperación mediante correo y proveedor SMTP operativo. El personal usa MFA TOTP; las funciones internas exigen `aal2` además de identidad y rol activo.

El primer responsable se crea mediante procedimiento de bootstrap protegido en entorno administrado. Altas posteriores usan invitación server-only de Auth seguida de asignación controlada en `staff_accounts`; una invitación aceptada sin fila activa no concede acceso. Ningún cliente modifica su rol mediante `user_metadata`.

Invitación/recuperación: plantillas de correo llevan al callback SSR `/auth/confirm` con `token_hash` y tipo admitido `invite|recovery`. Verificar mediante Auth, establecer cookies y redirigir a `/personal/restablecer` sin conservar el token en URL. Allí una identidad validada con autorización interna activa y permiso temporal firmado define/restablece contraseña. Si ya tiene TOTP verificado, debe verificarlo antes del cambio: Supabase exige AAL2. Una invitación sin factor permite fijar contraseña y luego enrolar MFA; el área interna siempre requiere AAL2. Ver el procedimiento probado de [H2](../implementacion/evidencia/h2/operacion.md). Recuperar contraseña no elimina el factor TOTP. Solicitar correo devuelve respuesta genérica y respeta límites de Supabase Auth; CAPTCHA retirado por DC-20. Configurar SMTP real y probar enlaces caducados/usados. [Plantillas para SSR](https://supabase.com/docs/guides/auth/auth-email-templates), [recuperación de contraseña](https://supabase.com/docs/guides/auth/passwords).

Callbacks y redirects se construyen desde `APP_SITE_URL` y destinos internos fijos; no se acepta `next`/`redirect_to` arbitrario del visitante. La ruta de confirmación usa `no-store`, `Referrer-Policy: no-referrer`, sin analítica/assets externos y sin registrar query strings de tokens. No hay una ruta pública de bootstrap: el operador crea la primera identidad confirmada y autorización manager mediante procedimiento administrado, registra auditoría y comprueba contraseña/MFA antes de operar. El script futuro valida entorno, no lleva credenciales literales y no puede dejar accesos temporales compartidos.

Después de confirmar `staff_accounts.active=false`, nuevas RPC de esa cuenta quedan bloqueadas incluso con un JWT que aún no haya vencido; una operación ya en curso puede haber sido autorizada antes del cambio. Los roles se consultan en la base, no exclusivamente en claims con información vieja. Un responsable no puede desactivar al último responsable activo; la función serializa esa operación. Recuperar MFA requiere otro responsable o administración documentada fuera del acceso público. La implementación del desafío sigue la [guía oficial TOTP de Supabase](https://supabase.com/docs/guides/auth/auth-mfa/totp).

## 4. Matriz funcional de permisos

| Operación | Visitante | Cliente | Atención | Responsable |
| --- | --- | --- | --- | --- |
| Consultar catálogo y validar carrito | Sí | Sí | Sí | Sí |
| Consultar tarjeta propia | No | Sí | Solo si tiene perfil cliente propio | Igual |
| Editar indicaciones propias | No | Sí | Solo perfil propio | Puede corregir por solicitud explícita con motivo |
| Buscar cliente por teléfono completo | No | No | Sí, MFA | Sí, MFA |
| Acreditar compra pagada y entregada | No | No | Sí, MFA | Sí, MFA |
| Registrar canje | No | No | Sí, MFA | Sí, MFA |
| Revertir sello / revisar incidencia | No | No | No | Sí, MFA |
| Mantener catálogo y configuración | No | No | No | Sí, MFA |
| Autorizar o desactivar personal | No | No | No | Sí, MFA |

Ser cliente y personal son capacidades independientes; la tarjeta nueva no usa identidad Auth; no se deduce una de la otra. DC-12 añade listado privado paginado e indicadores solo manager/AAL2, definidos en [H7](17-administracion-y-operacion-h7.md). Atención no accede; exportaciones masivas y campañas siguen fuera del producto.

## 5. Grants, RLS y superficie expuesta

PostgreSQL comprueba tanto permisos de operación como políticas de filas; configurar ambos explícitamente. Una política no revoca grants y una clave publicable no es un secreto. Referencia: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

| Grupo | Grants a `anon` / `authenticated` | RLS / ruta autorizada |
| --- | --- | --- |
| Tablas comerciales de `public` | Sin `SELECT`/INSERT/UPDATE/DELETE directo. | RLS habilitado y sin políticas de acceso directo para estos roles. Lectura mediante `read_catalog`; mantenimiento mediante RPC de responsable. |
| `read_catalog()` | `EXECUTE` a anon/authenticated. | Proyección explícita de filas/campos confirmados; no devuelve precios fuente, borradores ni comparación no verificada. |
| `app_private.*` | Sin `USAGE`/CRUD para roles de Data API. | RLS habilitado; acceso únicamente por RPC autorizadas. |
| Funciones públicas | `EXECUTE` por función, revocado de `PUBLIC` por defecto. | Validación interna de identidad y rol; no grant global de ejecución. |

Tablas privadas con RLS y sin grants CRUD directo. La clave de tarjeta se valida dentro de RPC acotadas exclusivamente de servidor; personal usa JWT y autorización vigente dentro de sus RPC. RLS no sustituye la comprobación explícita del propietario controlado SECURITY DEFINER.

La revisión sustituye los grants de lectura de tablas por una única RPC pública. RLS controla filas, no oculta condicionalmente columnas: un `SELECT` completo permitiría leer, por ejemplo, un precio anterior sin verificar aunque la UI lo omita. La RPC resuelve esa frontera sin vistas ni políticas recursivas entre items y precios. No se expone `is_catalog_item_public`; el predicado comercial se mantiene interno a `read_catalog`. [PostgreSQL distingue permisos de tabla y de columna](https://www.postgresql.org/docs/current/sql-grant.html).

`read_catalog` es `STABLE SECURITY DEFINER`, `search_path=''`, sin parámetros y con SQL estático. Su propietario controlado puede leer tablas comerciales; se comprueban explícitamente publicación, verificación y vigencia en cada rama de la proyección. Si ese propietario elude RLS, las políticas no filtran el resultado por él. No se usa `SELECT *`, no se accede a esquemas personales ni se devuelve JSON de filas completas. [Supabase explica el contexto de ejecución y los permisos de funciones](https://supabase.com/docs/guides/database/functions).

`public.has_staff_role(required_role)` es helper separado para políticas de Storage y funciones autorizadas: acepta solo roles conocidos, usa exclusivamente `auth.uid()` y comprueba cuenta activa/AAL2. Ejecución solo a authenticated, resultado booleano sobre la identidad actual; no permite consultar roles de otro usuario. No se concede `USAGE` sobre todo `app_private` para hacer funcionar una política.

Las RPC privadas se implementan como `SECURITY DEFINER` porque los callers no tienen acceso a tablas privadas. Usar propietario controlado, `SET search_path=''`, nombres de esquema completos y SQL estático. Cada función interna de personal comprueba `auth.uid()` y permisos dentro de la transacción; las de tarjeta por clave comprueban hash/vigencia/estado y solo admiten service_role; no confía en un `actorId` recibido. Helpers de rol no aceptan identidad arbitraria ni se exponen como directorio. [Funciones de base de datos](https://supabase.com/docs/guides/database/functions).

RPC públicas de catálogo/oferta sin PII; validación del carrito en Next. Las RPC por clave son exclusivamente de servidor, derivadas de acceso propio validado. Búsqueda/sello/canje requieren staff/MFA; administración manager/MFA. No hay grants directos sobre Auth o tablas privadas.

Las migraciones revocan grants existentes y permisos por defecto del propietario que crea objetos; no alteran a ciegas funciones administradas de Auth/Storage. Crear y restringir cada función en la misma transacción evita una ventana de ejecución por `PUBLIC`. La matriz de pruebas exige tanto denegar el acceso directo como verificar el resultado permitido de cada RPC.

## 6. Storage y claves

Bucket público `catalog-media`: únicamente imágenes de comida/marca aprobadas. Cualquier URL pública puede verse sin identidad; no subir información privada allí. Lectura pública del objeto no concede escritura.

Escritura de `storage.objects` exige responsable activo y MFA, bucket correcto y ruta `items/<itemId>/<uuid>.<ext>`. Bucket limitado a JPEG, PNG o WebP y **3 MiB** por archivo; el flujo de servidor comprueba extensión/MIME, decodifica la imagen y limita a 4096×4096 píxeles, excluyendo SVG/HTML. RLS comprueba autorización/ruta y Storage límites declarados; no inspeccionan los bytes como un decodificador. Las pruebas distinguen esas capas. Subir con nombre nuevo, después asociar vía RPC; no sobrescribir una foto cacheada. Limpieza de archivos huérfanos a cargo del responsable, sin borrar la imagen vigente. [Control de acceso de Storage](https://supabase.com/docs/guides/storage/security/access-control).

La carga utiliza Route Handler dedicado con cuerpo multipart acotado a 4 MiB; no se amplía globalmente el límite de Server Actions. Se verifica identidad/rol/MFA y origen permitido antes de leer el archivo; el límite se aplica durante lectura, no solo mediante `Content-Length`. Estos límites encajan en la propuesta de hosting y se vuelven a comprobar al contratar. [Vercel limita el cuerpo de una función a 4,5 MB](https://vercel.com/docs/functions/limitations).

Clave publicable: permitida en navegador. Clave secreta: exclusivamente servidor aislado para administración Auth y las cuatro RPC acotadas de acceso por clave, nunca `NEXT_PUBLIC_*`, DTO, logs ni RPC ordinarias. La [documentación de claves](https://supabase.com/docs/guides/getting-started/api-keys) distingue su capacidad; RLS no protege una consulta que la clave privilegiada esté autorizada a eludir.

## 7. Validación, abuso y errores

Zod valida en el servidor; tipos TypeScript no validan entrada de red. Inputs con límites, enums y UUID; imports de dinero ignoran importes enviados como autoridad. Parámetros en consultas, sin SQL construido con texto del visitante. Renderizar indicaciones como texto; nunca `dangerouslySetInnerHTML` con datos de usuario.

Server Actions reciben POST directo: comprobar origen/protecciones de Next.js y autorización por operación, sin CORS abierto. API de validación rechaza cuerpos >32 KiB y carritos por encima de límites técnicos. Búsquedas de cliente se restringen al número exacto y tienen límite operativo; no se habilitan listados por prefijo.

Alta de tarjeta: límite global SQL de 20 altas nuevas/minuto bajo lock, replay sin duplicado y validación estricta; medir abuso antes de lanzamiento. Auth del personal conserva contraseña, MFA y límites de proveedor; CAPTCHA retirado por DC-20. El límite HTTP y de tamaño no reemplaza autorización; no usar memoria serverless como contador global.

No registrar cuerpos de pedido, teléfonos completos, direcciones, OTP, JWT ni preferencias en logs. Errores inesperados se traducen a código estable y `requestId`, sin SQL ni detalles internos. Intentos de acceso denegado se observan con actor técnico y operación, sin contenido personal.

## 8. Recuperación, privacidad y validación pendiente

Cambio normal de teléfono: sesión → `updateUser({phone})` → verificar OTP con tipo `phone_change` → comprobar identidad de respuesta y `getUser()` vigente → volver a leer la misma tarjeta. El teléfono confirmado se lee directamente de Auth; no hay una segunda actualización del perfil. Antes de verificar se conserva en memoria el UUID esperado de la sesión y se comprueba que el resultado corresponde a él antes de propagar cookies nuevas. Una respuesta inesperada se trata como incidencia de identidad, sin mostrar otra tarjeta. El comportamiento y los tiempos efectivos se verifican con la versión instalada de SDK/Auth; no confundir la caducidad con el intervalo de reenvío. [Flujo oficial de cambio de teléfono](https://supabase.com/docs/guides/auth/phone-login).

Un teléfono pendiente de verificación no permite buscar la tarjeta; el número anterior confirmado conserva su uso hasta que Auth completa el cambio. Después solo el nuevo identifica al mismo cliente. Colisión de número: revisión, sin merge. Recuperación sin acceso: procedimiento del responsable por cerrar PT-08; no existe endpoint público para transferir una tarjeta.

Las preferencias pueden editarse o borrarse. Direcciones viven solo en el borrador de sesión, no en Supabase ni en analítica. La tarjeta no añade publicidad automática. Los términos/aviso se versionan y su aceptación queda vinculada al perfil.

Baja y conservación de auditoría necesitan procedimiento aprobado antes del lanzamiento; la desidentificación técnica no sustituye definir finalidad, plazos y atención de solicitudes. No se hacen afirmaciones de cumplimiento legal ni se fijan plazos normativos.

Verificar grants y RLS con JWT de visitante, dos clientes distintos, atención, responsable, personal desactivado y AAL1/AAL2. Probar llamadas directas por SDK y POST, no solo navegación por pantallas. La estrategia completa está en [Pruebas](08-pruebas-y-aceptacion.md).
