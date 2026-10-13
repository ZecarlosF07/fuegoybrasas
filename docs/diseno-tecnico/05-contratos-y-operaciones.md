# 05. Contratos, validaciones y operaciones

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. MFA del personal se conserva.

**Versión:** 1.2 · **Fecha:** 8 de octubre de 2026.  
**Relacionado:** [Datos](03-modelo-de-datos.md), [Seguridad](04-autenticacion-seguridad.md), [Frontend](06-frontend-y-estado.md).

## 1. Convenciones de interfaces

DTO de aplicación en camelCase; SQL en snake_case, adaptado en DAL. UUID en texto, fechas ISO 8601 UTC y dinero en céntimos enteros. Server Actions y Route Handlers comparten validadores Zod; no exponen filas privadas completas. Excepción explícita de H4: campos del editor comercial y patches internos en snake_case, con lista cerrada y schema estricto por entidad; el sobre de operación y el catálogo público mantienen camelCase. Ver [contratos implementados de H4](../implementacion/evidencia/h4/operacion.md).

```ts
type Mode = 'delivery' | 'pickup';
type Result<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: {
      code: ErrorCode; message: string;
      fieldErrors?: Record<string, string[]>;
      lineIssues?: Array<{ lineId: string; code: ErrorCode; message: string }>;
      retryAfterSeconds?: number;
      currentState?: ConflictState;
    }; requestId: string };
type MutationMeta = {
  operationId: string; replayed: boolean;
  outcome: 'applied' | 'review_required';
};
type ConflictState =
  | { entity: 'card'; value: CardDTO }
  | { entity: 'profile'; value: {
      displayName: string; frequentInstructions: string; revision: number;
    } }
  | { entity: 'catalog_item'; id: string; revision: number }
  | { entity: 'business_config'; revision: number }
  | { entity: 'staff_account'; id: string; revision: number;
      active?: boolean; deleted?: boolean };
```

`ErrorCode` es un conjunto cerrado en implementación: `VALIDATION_ERROR`, `AUTH_REQUIRED`, `FORBIDDEN`, `MFA_REQUIRED`, `OTP_INVALID`, `OTP_EXPIRED`, `RATE_LIMITED`, `CONFIG_NOT_READY`, `ORDERING_PAUSED`, `BUSINESS_CLOSED`, `ITEM_UNAVAILABLE`, `MODE_NOT_ALLOWED`, `OPTION_UNAVAILABLE`, `COVERAGE_EXCLUDED`, `MINIMUM_NOT_MET`, `CATALOG_CHANGED`, `CONFLICT`, `NOT_FOUND`, `CUSTOMER_RECOVERY_REVIEW`, `IDENTITY_MISMATCH`, `TERMS_CHANGED`, `LOYALTY_PAUSED`, `CARD_UNAVAILABLE`, `DUPLICATE_VISIT_REFERENCE`, `IDEMPOTENCY_CONFLICT`, `REWARD_UNAVAILABLE`, `REWARD_ALREADY_REDEEMED`, `LATER_VISIT_REQUIRED`, `CORRECTION_ALREADY_APPLIED`, `SERVICE_UNAVAILABLE`, `OPERATION_UNCERTAIN` e `INTERNAL_ERROR`. Nuevos códigos se añaden a contratos, UI y tests juntos.

HTTP: 400 entrada inválida, 401 sin identidad, 403 permiso/MFA, 404 entidad privada no accesible, 409 conflicto, 422 incompatibilidad funcional, 429 límite y 503 dependencia caída. Server Actions devuelven `Result`, no códigos HTTP de negocio al consumidor. Un flujo que crea incidencia devuelve éxito de registro con `outcome=review_required`, no corrección aplicada.

`currentState` solo acompaña conflictos en entidades que el caller sigue autorizado a consultar. No aparece al denegar permiso ni revela otra tarjeta. Catálogo/configuración devuelven la revisión y permiten recargar el editor; perfil/card usan su proyección mínima. Esto permite mostrar un canje ya consumido con estado real sin fingir una mutación exitosa. Motivos administrativos exigen 10–500 caracteres; en corrección de perfil la confirmación de solicitud es `customerRequestConfirmed=true`.

## 2. Lecturas y RPC

| Interfaz Next.js | Acceso | Supabase / respuesta |
| --- | --- | --- |
| `GET /api/catalog` | Público; no-store. | `read_catalog()` → categorías/items publicables, precios por modalidad, opciones, promociones, configuración segura y `serverNow`. |
| `POST /api/cart/validate` | Público; no-store. | Una lectura fresca `read_catalog()` y validador de dominio; ninguna escritura de pedido. |
| `GET /api/me/card` | Cliente identificado. | `get_my_card()` → perfil propio, progreso, premios y últimos movimientos sin actores/referencias internas. |
| `lookupCustomerAction` | Atención/responsable, MFA. | `lookup_customer(phone)` → coincidencia exacta o ausencia, ficha mínima y último movimiento. |
| Ficha interna SSR | Atención/responsable, MFA. | `get_staff_customer(customerId)` → ficha mínima autorizada y últimos diez movimientos; el ID de la ruta no concede acceso. |
| Historial para corregir | Responsable, MFA. | `get_customer_history(customerId,cursor,limit)` → eventos, referencias y actores para revisar el original; límite 20, máximo 50. |
| `getOperationAction` | Actor de la operación con permiso vigente. | `get_operation(operationId)` → estado conocido o ausencia de recibo y lectura actual pertinente. |
| Páginas administrativas SSR | Responsable, MFA. | `get_admin_catalog()` y `get_admin_config()` → borradores y versiones para editar. |
| Incidencias/listado de personal | Responsable, MFA. | `get_open_incidents()` y `get_staff_accounts()` paginados; no listado de clientes. |
| `POST /api/admin/catalog/images` | Responsable, MFA; mismo origen. | Valida item, archivo <=3 MiB y cuerpo <=4 MiB; subida con JWT del responsable → `imagePath`. No publica ni asocia el objeto. |
| `GET /api/admin/catalog/images` | Responsable, MFA; `imagePath` validado. | Consulta existencia de una subida por su misma referencia; no anuncia asociación ni publicación. |
| `DELETE /api/admin/catalog/images` | Responsable, MFA; mismo origen, `imagePath` y `operationId`. | Reserva SQL sin referencias, incluidas las retiradas recuperables; elimina por Storage API fuera de la transacción. Reintento conserva UUID/ruta. |

`read_catalog()` es función SQL `STABLE`, `SECURITY DEFINER`, `search_path=''`, sin parámetros, con proyección JSON en una única sentencia para leer un snapshot consistente. Filtra explícitamente filas y campos; no concede lectura directa de tablas a visitantes. No incluye precios fuente, costos del premio, roles ni perfiles. Se obtiene tiempo del servidor en esa lectura para evaluar horarios/vigencias. Datos públicos no dependen de cookies.

`CatalogDTO` contiene `serverNow`, categorías ordenadas e items con ID/slug/nombre/porción/inclusiones verificadas/imagen/disponibilidad/revisión, precios delivery/pickup verificados y grupos/elecciones válidos. Una comparación sin verificar se omite; una promoción fuera de vigencia no aparece. La configuración incluye revisión, nombre, WhatsApp, flags, ubicación/horario confirmados o estado pendiente, cargo de recojo conocido/pendiente, pagos y zonas habilitados/verificados. No entrega el texto de dirección/horario guardado como borrador ni tarifas sin verificar. Las categorías sin items publicables no producen una sección vacía.

`CardDTO` contiene `customerId`, `displayName`, `phoneMasked`, `frequentInstructions`, `profileRevision`, `cardId`, `cardRevision`, `cardStatus`, `programEnabled`, `progress`, `target`, `programLabel`, `rewardProductAvailable`, `availableRewards` con ID/contenido y últimos diez movimientos con tipo/fecha/delta. El teléfono se deriva del valor confirmado vigente de Auth. Atención recibe además teléfono completo, IDs de eventos/operaciones y referencias para identificar, no historial de platos. La proyección del cliente no contiene esos identificadores operativos ni actores. El producto del premio puede estar agotado sin que desaparezca el premio ganado.

Sin perfil, `get_my_card` devuelve `NOT_FOUND` para conducir a activación; si el perfil está cerrado, `CUSTOMER_RECOVERY_REVIEW`, sin reactivarlo. Una tarjeta suspendida puede consultarse con su estado pero no admite sello/canje. Una pausa del programa conserva la consulta de progreso/premios e indica `programEnabled=false`. La UI distingue estos estados de una caída del servicio.

Los listados privados usan cursor por `(recorded_at,id)` o `(created_at,id)` y límite validado; incluyen `nextCursor` y no permiten un tamaño ilimitado. `get_operation` devuelve `status=recorded|not_found`, tipo, efecto/IDs originales y proyección actual autorizada. `not_found` significa ausencia de recibo confirmado en esa lectura; la petición original podría seguir en curso. Nunca habilita repetir con otro UUID.

Las lecturas privadas construyen el DTO con una sola sentencia de proyección, después de comprobar acceso, para no combinar un contador anterior con premios de otro snapshot. Las mutaciones componen su resultado desde el estado posterior de su propia transacción; no encadenan lecturas independientes desde el navegador para aparentar atomicidad.

## 3. Validación del carrito

```ts
type CartValidationInput = {
  mode: Mode;
  paymentMethodCode: string;
  deliveryZoneId?: string;
  lines: Array<{
    lineId: string;
    itemId: string;
    quantity: number;
    choiceIds: string[];
    observedItemRevision: number;
    observedUnitPriceCents: number;
  }>;
};
```

Nombre, dirección, referencia y textos de indicaciones permanecen en el navegador y se validan con los esquemas compartidos antes de preparar el mensaje. No son necesarios para consultar disponibilidad/precio en el backend. No se envían a Data API ni se incluyen en telemetría.

Límites técnicos: 1–30 líneas, cantidad entera 1–20 por línea, hasta 120 unidades totales y cuerpo HTTP <=32 KiB; hasta 20 elecciones únicas por línea. Son controles contra errores/abuso, no mínimos comerciales. Si se exceden, ofrecer contacto por WhatsApp sin fabricar una cotización.

Proceso de servidor:

1. Validar estructura, IDs únicos de línea y valores; leer catálogo/configuración en snapshot fresco.
2. Comprobar `ordering_enabled`, medios confirmados y estado horario. `closed` bloquea, `unknown` permite solicitud con atención pendiente. Recojo exige ubicación confirmada antes de habilitar esa recepción.
3. Comprobar item publicado, stock operativo, vigencia y precio verificado para la modalidad.
4. Validar pertenencia, min/max y disponibilidad de opciones. Calcular unitario desde precio y recargos reales.
5. Calcular líneas y subtotal. Validar zona, mínimo conocido y cargos confirmados; nulo nunca se convierte a cero. Entrega usa tarifa de zona verificada; recojo usa cargo confirmado de configuración. Sin verificación, total final nulo.
6. Comparar revisión/precio observados. Si cambiaron, devolver revisión necesaria con líneas canónicas y diferencias; no actualizar silenciosamente el borrador.

La respuesta de éxito tiene `status=ready|needs_review`, `validatedAt`, `expiresAt` a sesenta segundos, líneas con nombre/porción/opciones/revisión/unitario/importe y `totals={subtotalCents, charge:{status:known|pending,amountCents:number|null}, totalCents:number|null}`. Incluye modalidad, método de pago canónico, zona elegida cuando existe, revisión de configuración, WhatsApp validado y huella de la entrada normalizada. Incluye advertencias explícitas de cobertura/costo/horario desconocidos, sin afirmar venta ni reserva de stock. Una zona seleccionada no demuestra que la dirección escrita pertenezca a ella; el mensaje permite que atención lo confirme.

Items agotados, inexistentes, incompatibles o con opciones inválidas aparecen como `lineIssues` de la línea correspondiente; el cliente conserva todas sus selecciones. Un cambio de precio necesita aceptar los datos nuevos y revalidar. Una opción eliminada exige elegir otra; no se sustituye por la primera disponible.

La validez de sesenta segundos es técnica para preparar/copiar/abrir el mensaje. Si vence o cambia el borrador, se revalida antes de continuar. El navegador descarta una respuesta si corresponde a una revisión local anterior; no mezcla sus importes con una selección posterior. La caducidad local se mide con reloj monotónico desde el inicio de la petición, usando `expiresAt-validatedAt` como plazo máximo, para que un reloj del dispositivo incorrecto no prolongue la revisión. Cambios del catálogo posteriores al snapshot se detectan en la siguiente validación; el intervalo no reserva stock ni precio hasta que el local confirme.

## 4. Mensaje y WhatsApp

Constructor puro: datos canónicos del carrito validado + datos locales validados. No usar nombres/precios de una línea antigua para reemplazar los canónicos. Texto sin HTML; omitir opcionales vacíos.

Nombre: 1–80 caracteres. Dirección de entrega: 5–250; referencia opcional hasta 200; observaciones generales hasta 500 y por línea hasta 200. Recojo omite dirección/referencia del cliente. Método de pago confirmado se etiqueta sin prometer cobro realizado; vuelto solo si el método lo admite, número decimal convertido de forma exacta a céntimos.

Ejemplo de solicitud de entrega con importes del análisis:

```text
Hola, quisiera solicitar:
1 × Mostrito de ⅛ — S/14.90
1 × Pollo entero (promoción) — S/44.90
Subtotal de productos: S/59.80
Entrega: costo por confirmar
Total final: por confirmar
Nombre: [nombre]
Dirección: [dirección]
Forma de pago: [método habilitado]
Por favor, confirmen disponibilidad, importe final y atención.
```

Enlace `https://wa.me/51982042493?text=<encodeURIComponent(message)>`, usando número confirmado de configuración. Generar URL solo después de la revisión. No añadir teléfono del cliente obligatorio ni etiquetas de «venta realizada». P05 no lleva la leyenda retirada.

Al superar un límite técnico de URL de 7.000 caracteres codificados, mostrar mensaje para copiar y abrir chat sin texto; no truncar artículos. Probar compatibilidad real móvil, porque el límite efectivo puede variar. Copiar solo anuncia éxito si Clipboard API lo confirma; si no, selección de texto visible.

## 5. Mutaciones de identidad y catálogo

| Server Action | Entrada | RPC/efecto |
| --- | --- | --- |
| `signInStaffAction` | Correo, contraseña y CAPTCHA configurado. | Supabase `signInWithPassword`; consulta autorización propia. Cuenta activa AAL1 va a MFA, AAL2 puede entrar; no asigna roles. |
| `requestPasswordRecoveryAction` | Correo y CAPTCHA configurado. | Supabase `resetPasswordForEmail`, callback fijo; respuesta genérica sin revelar cuentas. Nombre adoptado en H2. |
| `GET /auth/confirm` (handler) | `token_hash`, tipo `invite|recovery`; sin destino libre. | Supabase `verifyOtp` y cookies; redirige a restablecer. Error estable si vencido/usado; sin logs de URL sensible. |
| `completePasswordAction` | Contraseña/confirmación; identidad vigente y cookie firmada de recuperación. | Supabase `updateUser({password})` para cuenta autorizada. Con factor existente se verifica AAL2 antes del cambio; sin factor conduce a enrolar MFA. No altera rol/activo ni elimina factores. Nombre adoptado en H2. |
| `enrollStaffMfaAction` | Sesión Auth y staff vigente. | Enrola TOTP propio si no hay factor verificado; solo puede limpiar intentos propios no verificados. Clave y QR exclusivamente en memoria durante configuración. |
| `verifyStaffMfaAction` | UUID de factor propio y código de seis dígitos. | `challengeAndVerify` y comprobación del acceso actual/AAL2. Destino interno fijo según permiso de recuperación; no recibe actor/redirect libre. |
| `signOutStaffAction` | Sesión actual. | `signOut` local, elimina permiso de recuperación; cliente limpia diario privado y checkout personal, conservando artículos locales del pedido invitado. |
| `registerCardAction` | Nombre/contacto/términos/aceptación; sin identidad libre. | `ensure_card_by_key` con hash derivado del servidor; alta única sin sello. |
| `openCardLinkAction` | Clave privada validada desde fragmento. | `get_card_by_key`; cookie solo tras validación, destino fijo. |
| `getPrivateCardLinkAction` | Cookie propia, sin UUID libre. | Validar acceso y generar enlace/QR expresamente. |
| `changeCardContactAction` | Nuevo contacto y revisión. | `update_card_phone_by_key`, clave propia; conserva tarjeta/progreso. |
| `updatePreferencesAction` | Nombre/indicaciones y revisión. | `update_card_profile_by_key` con hash de cookie propia; no rol/saldo/identidad libre. |
| `correctCustomerProfileAction` | Cliente, nombre/indicaciones, `expectedRevision`, confirmación de solicitud expresa, motivo y `operationId`. | `correct_customer_profile`; solo responsable/AAL2, auditoría de campos modificados sin copiar el texto personal. No cambia teléfono ni saldo. |
| `forgetCardAction` | Sin UUID. | Olvida cookie de tarjeta, limpia estado privado; no revoca enlace ni cierra sesión staff. |
| `updateCatalogItemAction` | ID, `expectedRevision`, patch validado y `operationId`. | `update_catalog_item`; bloquea rama, cambia campos del artículo, valida publicación y audita. Precios/grupos/opciones tienen RPC propias y avanzan también revisión del padre. |
| `getAdminCatalogAction` | `includeDeleted` booleano; manager/AAL2. | `get_admin_catalog`; snapshot privado de las seis entidades comerciales, validado antes de entregar al editor. |
| `saveCatalogEntityAction` | Tipo cerrado, ID, `expectedRevision`, patch y `operationId`. | Edición por seis RPC acotadas; revisión cero conduce a `create_catalog_entity` con UUID estable y campos de creación. No admite tabla, actor, columna libre ni modificación del precio fuente. |
| `updateBusinessConfigAction` | `expectedRevision`, patch de configuración/pagos/zonas y `operationId`. | `update_business_config`; bloquea singleton, valida y audita. No permite cambiar secretos ni reglas de premios. |
| `setRewardAvailabilityAction` | Versión de programa, disponible, `expectedRevision`, `operationId`. | `set_reward_availability`; responsable/AAL2, modifica solo disponibilidad operativa y audita. |

La nueva alta por `ensure_card_by_key` usa configuración/advisory/versión, valida términos y crea perfil/tarjeta juntos; repetir hash devuelve la misma tarjeta. Teléfono ocupado con otra clave no revela datos ni fusiona identidades. Cambio de contacto con revisión conserva la clave, los UUID y los derechos. [Contratos y permisos completos](16-acceso-a-tarjeta-sin-sms.md). RPC antiguas de cliente Auth quedan solo como compatibilidad protegida, fuera del recorrido actual.

El patch comercial es una lista de campos admitidos, no JSON arbitrario aplicado a SQL. Cada mutación hija de precio/opción aumenta también la revisión del item padre. Configuración usa su revisión global; un cambio no pisará otro formulario antiguo. Guardar sin cambio devuelve estado actual sin auditoría de una venta inexistente.

La foto se sube por el handler dedicado y luego se asocia con `updateCatalogItemAction`, revisión y UUID. Si falla esa asociación, la imagen sigue huérfana y el producto conserva su foto anterior. Una repetición de asociación usa el mismo patch/operationId; la limpieza solo borra objetos sin asociación vigente o recuperable y no confunde una subida incompleta con una publicación aplicada. Para errores HTTP de tamaño usar 413, traducido a `VALIDATION_ERROR` y texto útil en el panel.

H4 añade `content_verified` para confirmar porción/inclusiones; edición de contenido o restauración invalida la confirmación. Precio/composición de opciones editados requieren reconfirmación explícita. Publicación mantiene C01 excluido, P05 solo entrega y las condiciones comerciales de H3. `prepare_catalog_image_cleanup` comparte bloqueo de configuración con asociación, reserva permanentemente la ruta y registra recibo/auditoría antes de eliminar por Storage API. El handler decodifica bytes; el bucket y su política no inspeccionan píxeles. Contratos de campos, restauración de ramas, journal mínimo y límites reales se detallan en [operación H4](../implementacion/evidencia/h4/operacion.md); pruebas y límites de aceptación en [evidencia H4](../implementacion/evidencia/h4/README.md).

## 6. Sellos y canjes: entradas

```ts
type CreditStampInput = {
  customerId: string; operationId: string;
  paidConfirmed: true; deliveredConfirmed: true;
  visitReference?: string;
  occurredAt?: string; contingencyReference?: string;
};
type RedeemRewardInput = {
  customerId: string; rewardId: string; operationId: string;
  laterVisitConfirmed: true; productAvailableConfirmed: true;
};
type ReverseStampInput = {
  customerId: string; originalEventId: string;
  operationId: string; reason: string;
};
```

`occurredAt` distinto de la hora actual solo admite responsable con referencia de contingencia, nunca fecha futura. Atención ordinaria no puede retrofechar. Los actores se obtienen del JWT y la tabla de personal; no se aceptan `actorId`, incremento libre o estado de premio propuesto por el cliente.

Acciones → RPC: `creditStampAction` → `credit_stamp`; `redeemRewardAction` → `redeem_reward`; `reverseStampAction` → `reverse_stamp`. Respuesta: `MutationMeta`, IDs de eventos/recompensa/incidencia relevantes y `card` actualizado. Un replay preserva el efecto original y entrega una lectura actual de tarjeta, que puede haber cambiado por otras visitas.

## 7. Transacciones e idempotencia

Orden común de recursos, omitiendo los que una operación no necesita: **operación → configuración de negocio → identidad Auth en altas → perfil → tarjeta → versión de programa → premios por ordinal**. Una llamada modifica una tarjeta. Usar advisory lock transaccional calculado a partir de `(auth.uid(),operationId)` para serializar el mismo identificador; una colisión de hash solo serializa de más, no mezcla recibos.

Sello/canje toman `FOR SHARE` sobre configuración y perfil activo, `FOR UPDATE` sobre tarjeta/premio y `FOR SHARE` sobre versión. Permiten operaciones en otras tarjetas mientras bloquean una pausa o cambio de disponibilidad hasta resolver el commit. Activación/configuración toman `FOR UPDATE` sobre configuración antes de versión; costo/disponibilidad toman `FOR UPDATE` solo sobre versión y nunca solicitan después configuración o tarjeta. Reversión toma perfil, tarjeta y premios en el mismo orden, sin necesitar flag habilitado. El alta toma configuración, Auth, perfil y versión, y crea la tarjeta antes de soltar bloqueos. No existe inversión versión→tarjeta entre estos flujos. [Bloqueos de filas de PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).

Tiempo máximo propuesto de RPC cinco segundos, espera de bloqueo dos segundos, sujetos al entorno. Un timeout/bloqueo se traduce a error recuperable, no a pérdida del UUID. No mantener una transacción SQL abierta durante SMS, Storage o interacción humana.

Dentro de la función:

1. Verificar identidad, cuenta activa, rol requerido y AAL2 antes de consultar resultados anteriores.
2. Normalizar entrada y calcular hash canónico; bloquear identificador de operación.
3. Si hay recibo con tipo/hash iguales, devolver efecto original sin mutar y leer estado actual. Con entrada distinta, `IDEMPOTENCY_CONFLICT`.
4. Adquirir recursos en el orden anterior, verificar perfil/tarjeta y releer flags/versión bajo bloqueo. Acreditación y canje requieren `loyalty_enabled`; versiones draft no los permiten y tarjetas de versión retired conservan su regla. Reversión, lectura propia e incidencias siguen disponibles cuando se pausan nuevas acreditaciones/canjes. Una pausa confirmada impide nuevas acreditaciones/canjes; los que obtuvieron el bloqueo antes pueden terminar antes de confirmar la pausa.
5. Ejecutar la mutación, eventos, auditoría y recibo en una sola transacción.

**Acreditación:** sumar uno, insertar `stamp_credited`, comprobar umbral y crear/restaurar el ordinal de premio correspondiente. Insertar evento de emisión/restauración. No hay lectura+escritura separadas desde JavaScript.

**Activación del programa:** `activateLoyaltyProgramAction` → `activate_loyalty_program`, responsable/AAL2, con versión draft, costo confirmado, versión de términos, revisión y `operationId`. Valida meta/contenido ya definidos, registra costo/términos, activa la versión y habilita fidelización en una transacción. Antes de invocarla se completa el checklist operativo; no cambia automáticamente tarjetas anteriores. Configuración genérica no puede habilitar fidelización si falta versión/costo/términos. `updateRewardCostAction` → `update_reward_cost` actualiza solo costo de referencia con auditoría; no meta ni premio.

**Canje:** verificar recompensa `available`, versión/contenido conservados, `reward_available` de esa versión y confirmaciones, bajo los bloqueos comunes. Marcar `redeemed`, insertar evento con costo de referencia del momento y recibo. Si otro actor ganó el bloqueo, devolver `REWARD_ALREADY_REDEEMED`, con estado actual; el fallo no consume otra recompensa.

**Reversión:** verificar evento original no revertido y motivo de 10–500 caracteres. Calcular saldo posterior y premios afectados. Si son disponibles, aplicar delta -1 y anularlos con eventos. Si alguno ya fue canjeado, crear una sola incidencia y recibo `review_required`, sin aplicar decremento. Un cierre de incidencia solo añade nota y trazabilidad.

Fallos de validación no confirman cambios. Un timeout de red puede ocurrir después del commit: UI devuelve estado incierto y consulta `get_operation`; ausencia de recibo permite reintentar **el mismo identificador y entrada**. No borrar el identificador hasta conocer el resultado. La lectura de estado debe usar el primario, no una réplica eventual. Un replay exige también el permiso vigente para el tipo de operación guardado; una cuenta desactivada o degradada no recupera privilegios al consultar un recibo antiguo.

## 8. Administración e incidencias

`openIncidentAction` → `open_incident` registra anomalía de canje/registro, con cliente, referencia, descripción y `operationId`. `closeIncidentAction` → `close_incident` exige responsable, motivo y revisión; no cambia automáticamente sellos ni premios.

`inviteStaffAction` requiere responsable/AAL2 y correo+rol. Cliente secreto de Auth envía invitación; solo tras resultado verificable se crea fila autorizada. Si Auth y tabla no se completan juntas, el usuario queda sin rol activo y se muestra incidencia recuperable, sin anunciar acceso listo. Reconciliar antes de repetir invitaciones.

`updateStaffAccessAction` → `update_staff_access`, con cuenta, rol/activo y revisión. Adquiere un advisory lock global de administración de personal antes de contar responsables y aplicar cambios: nunca permite dejar cero responsables activos. `get_staff_access()` consulta exclusivamente acceso de la identidad actual, incluso AAL1, para conducir a MFA; no autoriza operaciones internas con AAL1.

Recuperación excepcional y baja requieren procedimiento PT-08/PT-11 y no incluyen endpoints públicos para transferir saldos. Las llamadas administrativas privilegiadas se mantienen aisladas del resto de operaciones.

## 9. Reglas de consistencia del contrato

[Contratos H7 y DC-12–15](17-administracion-y-operacion-h7.md) amplían lecturas administrativas, correcciones, invitaciones parciales, restitución supervisada, recuperación presencial y contingencia. Baja de clientes/tarjetas excluida por el propietario; no hay purgas ni baja Auth. Son la referencia vigente para esas operaciones.

Disponibilidad, modalidades e importes se validan en servidor aunque UI los muestre. Sellos y premios se validan nuevamente en SQL aunque Next.js comprobó el rol. Operaciones con resultado incierto no se muestran como éxito. Enlaces y copia son acciones del navegador; no hay respuesta de la API que equivalga a confirmación de WhatsApp.
