# 16. Tarjeta con enlace privado, sin SMS

**Versión:** 1.0 · **Fecha:** 10 de octubre de 2026.  
**Origen:** el propietario retiró la verificación SMS y eligió que el cliente cree su tarjeta en la web con nombre y teléfono.  
**Vigencia:** sustituye las definiciones anteriores de OTP, identidad telefónica en Auth y `phone_change` del cliente. El acceso del personal con Supabase Auth y MFA TOTP se conserva.

## Recorrido y límites

**Actualización H7:** [DC-14 y operación de recuperación](17-administracion-y-operacion-h7.md) aprueban recuperación presencial solo por administrador con comprobante/historial, rotación del hash y conservación de tarjeta/progreso. El teléfono no autentica. DC-15 excluye baja de clientes; PT-11 conserva textos/plazos de privacidad pendientes para lanzamiento.

En `/mi-tarjeta/acceso`, el cliente escribe nombre y celular peruano y acepta las condiciones vigentes. Un envío crea perfil y tarjeta juntos, con cero sellos. El navegador conserva el acceso; desde la tarjeta puede obtener su enlace privado y QR para guardarlos y abrirla en otro dispositivo. No se crea un usuario de Supabase Auth ni se solicita SMS, contraseña o registro para pedir por WhatsApp.

El teléfono es **contacto declarado**, no prueba de titularidad ni credencial. Escribir un número ocupado no abre esa tarjeta ni devuelve nombre, preferencias o saldo. Se informa `CUSTOMER_RECOVERY_REVIEW` sin crear otra. Esto evita duplicados, pero un número mal declarado puede requerir revisión del responsable: la unicidad del dato no demuestra propiedad.

Quien posee el enlace puede consultar y editar el perfil correspondiente. La interfaz explica que debe guardarse en privado. El cliente no acredita sellos ni canjea premios: esas operaciones siguen exigiendo personal activo con MFA y permiso vigente. Al buscar por teléfono, el personal confirma la tarjeta presentada, el nombre y los movimientos antes de operar. El QR contiene acceso privado, no una acreditación ni autorización de canje.

Si se pierde el enlace y el acceso del navegador, se solicita revisión al personal. **H7/PT-08 debe definir y probar cómo comprobar titularidad, reemplazar/revocar la clave y entregar el nuevo acceso**; esa recuperación no está implementada en esta revisión. No recuperar por teléfono, coincidencia de nombre o respuesta a preguntas sobre preferencias. PT-11 conserva el procedimiento de baja y conservación pendiente.

## Datos y seguridad

| Campo nuevo de `app_private.customers` | Tipo / NULL / default | Restricción y uso |
| --- | --- | --- |
| `contact_phone` | `text`, sí, `NULL` | E.164 `+519xxxxxxxx`; índice único para valores no nulos, incluyendo filas eliminadas. Contacto sensible; completo solo en ficha del personal autorizado. |
| `access_key_hash` | `text`, sí, `NULL` | SHA-256 hexadecimal de 64 caracteres; UNIQUE global. Nunca devuelve el hash la proyección propia o del personal. |
| `access_key_expires_at` | `timestamptz`, sí, `NULL` | Pareado con hash: ambos nulos o ambos presentes. Alta por RPC fija vigencia técnica de 365 días. |

`auth_user_id` sigue nullable y UNIQUE/FK para compatibilidad de perfiles anteriores, con `ON DELETE SET NULL`. La nueva alta deja ese campo nulo. Un perfil activo exige nombre y una identidad histórica Auth o contacto/hash/vigencia completos. La aplicación actual utiliza exclusivamente el acceso por clave. Las RPC antiguas protegidas de cliente Auth permanecen por compatibilidad y no son el recorrido público; no obtienen permisos anónimos.

No se añade ninguna tabla: siguen 18 tablas propias. Borrado lógico, UUID de cliente/tarjeta, eventos inmutables, relaciones y premios conservan las reglas del [diccionario](10-tablas-db.md). Ocultar/cerrar un perfil deniega el acceso; restaurarlo no lo reabre. La expiración técnica de la clave **no elimina ni vence sellos o premios** ni fija un plazo legal de conservación.

El servidor genera 32 bytes aleatorios criptográficos y envía únicamente SHA-256 a las RPC. La clave cruda queda en cookie `fyb-card-access`, HttpOnly, SameSite=Lax, path `/`, Secure en HTTPS y `maxAge` de 365 días. Para HTTP local se permite cookie sin Secure. Leer la cookie nunca basta: cada consulta/mutación comprueba hash, vigencia y estado en SQL. No hay caché compartida de tarjeta.

El enlace usa `/mi-tarjeta/acceso#tarjeta=<clave>`. El fragmento no se envía en la petición HTTP inicial; el componente lo retira del historial inmediatamente y exige pulsar «Abrir mi tarjeta» antes de enviarlo a una Action. No usar query string, analítica, trazas, logs o capturas con esa clave. Solo una acción expresa de guardar obtiene enlace/QR; el hash tampoco debe registrarse en auditoría o recibos. HTTPS es obligatorio en el dominio público.

Las recomendaciones sobre entropía y cookies se contrastaron con [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). La clave es una capacidad privada: su posesión da acceso. No se presenta como teléfono verificado ni como identidad civil comprobada.

## Contratos y autorización

| Operación Next.js | Entrada permitida | RPC y resultado |
| --- | --- | --- |
| `registerCardAction` | Nombre 1–80, celular normalizado, versión vigente, aceptación `true`. Sin UUID/rol/saldo/clave libre. | `ensure_card_by_key(hash,name,phone,terms,accepted)`; DTO propio, cero sellos. |
| `openCardLinkAction` | Clave hexadecimal de 64 caracteres. | `get_card_by_key(hash)`; guardar cookie únicamente tras respuesta válida; destino fijo `/mi-tarjeta`. |
| `getPrivateCardLinkAction` | Sin entrada; acceso desde cookie. | Validar tarjeta propia y generar enlace/QR; acción controlada con carga/error. |
| `updatePreferencesAction` | Nombre, indicaciones hasta 500 y revisión positiva. | `update_card_profile_by_key(hash,name,instructions,revision)`; DTO propio con revisión actual. |
| `changeCardContactAction` | Teléfono y revisión positiva. | `update_card_phone_by_key(hash,phone,revision)`; conserva UUID/progreso/premios/clave. Colisión pide revisión, sin merge. |
| `forgetCardAction` | Sin entrada. | Elimina solo la cookie de tarjeta y estado privado de checkout; conserva carrito y sesión del personal. No revoca el enlace. |
| `GET /api/me/card` | Sin UUID/query de cliente. | Acceso desde cookie; DTO propio `no-store`, sin clave/hash ni teléfono completo. |

Las cuatro RPC `*_by_key` solo conceden EXECUTE a `service_role`: anon/authenticated no pueden invocarlas directamente. La fábrica privilegiada tiene `server-only`, cliente sin sesión persistida y clave exclusivamente del servidor. Las Actions validan entradas estrictas y derivan hash de cookie/clave validada; nunca confían en un UUID de cliente recibido para estas operaciones. Next aplica sus controles de Origin/Host en Actions POST; los GET no escriben datos.

`get_loyalty_offer()` publica únicamente disponibilidad, meta, nombre del premio y versión de condiciones, sin PII. `lookup_customer` sigue protegido por staff/MFA; busca contacto declarado o, para compatibilidad, teléfono confirmado de una identidad histórica Auth. No existe directorio por prefijo.

## Transacciones, fallos y operación

Alta: configuración FOR SHARE → bloqueo advisory global de altas → versión FOR SHARE → creación atómica de perfil/tarjeta/auditoría. Repetir la misma clave devuelve la misma tarjeta; un replay no emite otro perfil o sello. La cookie candidata se guarda antes del RPC para reutilizarla tras respuesta perdida. Cambiar contacto comparte el advisory y bloquea el perfil; perfil/contacto exigen revisión y no sobrescriben conflictos.

El límite técnico inicial es **20 altas nuevas por minuto en toda la aplicación**, dentro del bloqueo; no modifica reglas de visitas ni limita sellos por día. `RATE_LIMITED` muestra espera y reintento. No sustituye medición de abuso en el piloto; no se introduce un CAPTCHA obligatorio al cliente. El personal conserva Auth/MFA y límites de proveedor; CAPTCHA retirado por DC-20.

Auditoría propia utiliza el UUID interno de cliente en `actor_user_id` y `actorKind=customer_card`, sin FK a Auth. Registra nombres de campos cambiados, sin valores de contacto, indicaciones o claves. Operaciones de personal siguen identificadas por Auth y staff; los recibos e historial de sellos/canjes no cambian.

Activar el programa exige costo, términos, privacidad, **acceso privado probado** y personal preparado (`accessTested` sustituye `smsTested`). La aplicación también comprueba clave de servidor configurada y aprobaciones de condiciones/privacidad fuera del entorno aislado. Supabase remoto sigue con fidelización deshabilitada y programa draft. No activar altas públicas de Auth para clientes; el hook preparado ahora rechaza signup público de Auth y no se habilitó ni se cambió configuración Auth remota en esta revisión.

## Aceptación y trazabilidad

CA-23/CA-24 y CT-13/CT-14 ahora prueban alta sin SMS, cero sellos, enlace correcto, aislamiento y permisos del servidor. CT-30/CT-31 prueban cambio de contacto/revisión/colisión y conservación, sin OTP. CT-32 mantiene validación de términos, pausa y atomicidad. Los identificadores se conservan; las expectativas telefónicas anteriores quedan sustituidas por esta definición.

Comprobar alta concurrente con misma clave; teléfono ocupado con otra clave; clave inexistente/vencida; cookie manipulada; cliente sin permiso de sello/canje; UUID inyectado; preferencia/contacto con revisión; pérdida de respuesta; apertura en otro dispositivo; cierre de acceso; tarjeta cerrada; copia denegada; flujo invitado independiente. Validar móvil, teclado, foco y estados reales antes de aceptación integral.

La [evidencia vigente](../implementacion/evidencia/h6/acceso-sin-sms/README.md) acredita reconstrucción local, 109 unitarias, 110 pgTAP, 90 de integración y 40 de navegador del nuevo acceso, además de build remoto y seguridad. El propietario autorizó las pruebas aisladas después del aplazamiento. Narrador y zoom real siguen pendientes; H6 no se considera aceptado hasta registrarlos. Los resultados anteriores con SMS conservan su carácter histórico.

Referencias: [H6](../implementacion/06-hito-6-fidelizacion.md), [H7](../implementacion/07-hito-7-correcciones-y-operacion.md), [pendientes](README.md), [migración aplicada](../../supabase/migrations/20261010000000_card_access_without_sms.sql).
