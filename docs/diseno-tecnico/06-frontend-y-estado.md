# 06. Frontend, rutas y estado

**Actualización del 10/10/2026:** [acceso privado sin SMS](16-acceso-a-tarjeta-sin-sms.md) sustituye OTP/phone_change e identidad telefónica del cliente; MFA del personal se conserva.

**Versión:** 1.2 · **Fecha:** 3 de octubre de 2026.
**Relacionado:** [Arquitectura](01-arquitectura.md), [Contratos](05-contratos-y-operaciones.md), [Wireframes funcionales](../analisis-del-proyecto.md).

## 1. Rutas y acceso

| Ruta | Vista del análisis | Acceso y responsabilidad |
| --- | --- | --- |
| `/` | W01 | Carta SSR pública, categorías y productos comprables. |
| `/productos/[slug]` | W02 | Detalle público enlazable; mismas reglas de opciones que el diálogo de selección. |
| `/pedido` | W03 | Carrito editable local. |
| `/pedido/datos` | W04 | Formulario y revisión local. |
| `/pedido/continuar` | W05 | Mensaje preparado, apertura/copia y retorno; no confirmación de venta. |
| `/mi-tarjeta/acceso` | W06 | Alta sin SMS o enlace privado guardado. |
| `/mi-tarjeta` | W07 | Tarjeta propia e indicaciones; privado. |
| `/mi-tarjeta/telefono` | Mantenimiento de identidad | Cambio verificado de número sobre la misma identidad; no traslado de tarjeta. |
| `/condiciones-tarjeta`, `/privacidad` | Condiciones del programa | Contenido público aprobado y versionado; accesible antes de crear tarjeta. |
| `/personal/acceso`, `/personal/mfa` | W08 | Acceso individual, enrolamiento/desafío MFA. |
| `/personal/recuperar`, `/personal/restablecer` | Recuperación interna | Solicitud genérica; callback fijo y permiso temporal firmado. Con factor existente verificar MFA antes de cambiar contraseña; sin factor, definir contraseña y enrolar MFA antes del área privada. |
| `/auth/confirm` | Callback de Auth | Confirma invitación/recuperación y establece sesión; destino interno fijo, sin pantalla de datos personales. |
| `/personal` | W09 | Búsqueda exacta de cliente. |
| `/personal/clientes/[id]` | W10–W12 | Ficha, confirmación de entrega/sello, canje y resultado. |
| `/administracion/carta` | Extensión aprobada | Edición mínima de precio, promoción, disponibilidad y fotografía. |
| `/administracion/configuracion` | Mantenimiento | Dirección/horarios/pagos/zonas confirmados; activación y costo/disponibilidad del premio, sin cambiar su regla. |
| `/administracion/incidencias`, `/administracion/personal` | Operación restringida | Revisión/corrección y permisos; sin dashboard comercial complejo. |

Layout público sin lectura de sesión. Acceso a tarjeta puede mostrarse como enlace fijo; el estado privado se obtiene fuera del HTML compartido. Layouts privados y sus lecturas verifican identidad, y cada acción vuelve a hacerlo.

Las condiciones se versionan como contenido aprobado en el repositorio. La versión mostrada y enviada al activar debe coincidir con `terms_version` del programa activo; si no coincide, se impide activar y se solicita revisar condiciones vigentes. Este paquete no redacta ni aprueba textos legales definitivos.

## 2. Componentes y límites de hidratación

Servidor: lectura inicial de carta, configuración pública, metadata, páginas privadas y DTO. Cliente: `CartProvider`, cantidad, selector de opciones, formularios, mensaje, Clipboard y feedback de mutaciones. No convertir todo el layout en componente cliente.

Componentes previstos: `CategoryNav`, `ProductCard`, `ProductOptionsDialog`, `CartLine`, `CartSummary`, `CartDock`, `CheckoutForm`, `PreparedMessage`, `StampCard`, `RewardList`, `CustomerLookup`, `StampConfirmation`, `RedemptionConfirmation` y `CatalogEditor`. Reutilizar controles de error/carga y formato de dinero; reglas de fidelización no se recalculan desde eventos en el navegador.

`loading.tsx` y Suspense cubren cargas de rutas; `error.tsx` permite recuperar fallos inesperados. Errores funcionales esperados se muestran en el formulario/resultado, sin lanzar una pantalla de excepción. La búsqueda devuelve ausencia distinta de servicio caído.

## 3. Estado del borrador

Reducer con acciones `hydrate`, `addLine`, `setQuantity`, `editLine`, `removeLine`, `setMode`, `setCheckout`, `acceptCatalogChanges` y `clearDraft`. No usar un store remoto para el carrito.

```ts
type CartLine = {
  lineId: string; itemId: string; choiceIds: string[];
  quantity: number; instructions: string;
  instructionsStatus: 'ready' | 'needs_review';
  observedItemRevision: number; observedUnitPriceCents: number;
  displaySnapshot: { name: string; portion: string; choices: string[] };
};
type CartDraft = {
  schemaVersion: 1; updatedAt: string;
  mode: 'delivery' | 'pickup' | null;
  lines: CartLine[];
};
```

Agrupar solo mismo item, mismos IDs de opciones ordenados y mismas indicaciones recortadas. Distintos textos producen líneas diferentes. Al editar una línea que pasa a coincidir con otra, sumar cantidades si no supera límites; de lo contrario pedir ajuste. Cantidad cero se trata como eliminación explícita con feedback, nunca importe negativo.

Cambiar modalidad conserva artículos; incompatibles se marcan para resolver. Para P05 solicitar modalidad antes del agregado si falta; con recojo bloquear y explicar. No cambiar recepción ni retirar P05 automáticamente. Estado `null` permite explorar otros productos, pero debe resolverse antes de validar checkout.

Los importes locales son orientativos hasta validación canónica. Nunca guardar «tarifa pendiente» como cero ni usar precio de mesa para entrega/recojo.

Sin modalidad elegida, mostrar el precio online verificado común o «Desde» si los importes varían; la selección final determina el precio que se revisa. No usar `source_price_cents`. El destacado inicial reutiliza el primer artículo promocional publicable/disponible por `sort_order`, sin duplicar su identidad; si no hay promoción apta, se omite. No se genera un ranking de ventas ni se añaden etiquetas de popularidad sin respaldo.

## 4. Persistencia y datos personales

| Almacenamiento | Contenido | Vida y limpieza |
| --- | --- | --- |
| `localStorage`, clave `fyb.cart.v1` | Productos, opciones, cantidades, modalidad y snapshots de visualización; sin nombre/dirección ni indicaciones personales. | Restaurar en navegación y recarga; caduca tras siete días de inactividad, con aviso antes de descartar un borrador recuperable. |
| `sessionStorage`, clave `fyb.checkout.v1` | Nombre, dirección, referencia, pago, vuelto y observaciones; indicaciones por línea, vinculadas por `lineId`. | Solo sesión de pestaña, recuperable al recargar o volver de WhatsApp; borrar al limpiar pedido o cerrar sesión. |
| Memoria | Sesión proyectada, preferencias leídas y carrito validado. | Limpiar datos privados al cerrar sesión. Una recarga obliga a revalidar el mensaje. |
| `sessionStorage`, clave `fyb.staff-operations.v1` | Solo diario de operaciones internas pendientes: UUID de actor/operación/entidades, tipo, huella de entrada y momento de inicio. Sin nombre, teléfono, indicaciones, motivo libre ni tokens. | Antes de enviar una mutación; recuperar en la misma pestaña/identidad, retirar cuando se conoce resultado y limpiar al cerrar sesión. |

La definición TypeScript representa el estado completo en memoria; al serializar `localStorage` se excluye `instructions`. En `sessionStorage` se guarda mapa por `lineId` y los campos de checkout. Si otra pestaña recibe líneas, no recibe sus indicaciones ni datos personales y muestra advertencia para revisarlas.

La línea persistida añade únicamente `hadInstructions`, booleano sin texto personal. Si falta su entrada de sesión al restaurar, mantiene esa línea separada, marca `instructionsStatus=needs_review` y pide volver a escribir las indicaciones o confirmar continuar sin ellas. No agrupa automáticamente líneas que originalmente eran distintas ni prepara el mensaje hasta esa revisión. Líneas eliminadas retiran también su entrada de sesión. Cerrar sesión borra los textos y aplica la misma revisión a las líneas que los tenían.

No almacenar JWT, OTP, tarjetas de otros clientes o premios en el borrador. `sessionStorage` depende de pestaña/contexto: conserva retorno habitual pero no garantiza reapertura tras cerrar pestaña o en otro navegador. El mensaje preparado con datos personales no se añade a URLs propias, query strings ni almacenamiento persistente. Al cerrar sesión se informa que se conservan productos y se borran datos personales/indicaciones del formulario; limpiar también el mensaje en memoria.

Hidratar tras montar, con indicador breve; no pintar carrito vacío definitivo y sobrescribir el borrador antes de leerlo. JSON inválido o versión futura: conservar copia local sin usarla, explicar incompatibilidad y ofrecer reinicio explícito; no registrar su contenido. Validar todos los datos recuperados y revisar contra catálogo actual.

Si Storage del navegador está bloqueado/cuota llena, mantener memoria y avisar que no se conservará después de salir. El evento `storage` entre pestañas detecta cambios: avisar y permitir cargar el borrador más reciente, sin reemplazar una edición activa silenciosamente.

## 5. Checkout y continuidad a WhatsApp

Formulario con nombre, recepción, dirección condicional, referencia opcional, método habilitado, vuelto condicional y observaciones. No pedir teléfono de invitado ni acceso obligatorio. Las preferencias habituales aparecen con «Usar estas indicaciones», no se insertan ocultamente; editar el pedido no guarda la preferencia.

Secuencia: validar campos locales → validar carrito en servidor → presentar cambios si existen → aceptar y revalidar → navegar a continuación con mensaje en memoria. La vista de continuación muestra «Revisa y envía el mensaje en WhatsApp» y un enlace real «Abrir WhatsApp». Esta separación permite navegación fiable tras una validación asíncrona, sin depender de ventanas emergentes.

Con validación vigente, copiar o abrir usa el mensaje completo. Si cambió el borrador o vencieron sesenta segundos, revalidar y volver a presentar el enlace; no usar una validación caducada en silencio. En una recarga sin resultado vigente, reconstruir desde borrador y revalidar; si falta información, volver a datos conservando lo existente.

Cada edición incrementa una revisión local del borrador. La petición captura esa revisión y la respuesta se descarta si ya cambió; modalidad, pago, zona y WhatsApp del mensaje proceden de la validación aceptada. Usar reloj monotónico para su plazo, conforme al contrato. Con total conocido, el vuelto solicitado no puede partir de un importe menor; con total pendiente, explicar que el vuelto queda sujeto al importe confirmado por atención.

No vaciar el carrito al abrir WhatsApp. Volver conserva líneas y formularios; ofrecer «Nuevo pedido» con confirmación para borrar. La página no conoce si el usuario envió, recibió respuesta o pagó. Mostrar cargos/total pendientes con texto y cantidades conocidas separadas.

## 6. Tarjeta y operaciones internas

`StampCard` presenta progreso escrito, diez posiciones y premios independientes. 0/10 con premio pendiente es distinto de tarjeta nueva. El cliente no dispone de controles de acreditación o canje.

Cada confirmación del personal sigue `idle → validating → submitting → applied | review_required | failed | uncertain`. Botón deshabilitado durante envío, pero la base sigue evitando duplicados. En `uncertain` conservar `operationId`, consultar estado y permitir reintento del mismo; no incrementar contador optimistamente.

Antes del POST se guarda el diario mínimo de operación. Al recargar, comprobar identidad/rol/MFA y consultar `get_operation` para las entradas pendientes antes de permitir otra acreditación/canje sobre esa tarjeta. Resultado registrado recupera su efecto y estado actual. Sin recibo confirmado, no generar otro UUID: repetir el mismo y la misma entrada si aún está en memoria; si falta, reconstruirla conscientemente y comprobar su huella, o remitir la referencia al responsable. No guardar textos libres solo para poder reintentar automáticamente.

Si falla la escritura del diario, impedir ese sello/canje y usar contingencia; no se simula protección frente a recargas. El diario no garantiza continuidad al cerrar la pestaña o cambiar de equipo: esas situaciones requieren revisión de movimientos/referencias por el responsable. Cerrar sesión sigue disponible y limpia datos; si hay resultados inciertos, ofrecer conservar sus referencias en el registro interno antes de salir. Otra cuenta nunca recupera automáticamente el resultado privado del actor anterior.

Acreditación muestra nombre/número, último movimiento y confirmaciones «Compra pagada» y «Pedido entregado». Canje muestra premio, contenido y confirmación de visita posterior/disponibilidad. `review_required` informa «Incidencia registrada; corrección pendiente», sin presentar saldo como corregido.

Panel de catálogo: listar familias y artículos, editar precio por modalidad, activación, vigencia, disponibilidad e inclusiones verificadas. Publicar exige validación; precio fuente no rellena automáticamente un precio online confirmado. No hay editores de tablas libres, campañas, ventas, integración de caja ni cambios de meta de sellos.

Foto: indicar formatos, máximo 3 MiB y 4096×4096; validar antes de subir, mostrar progreso/error y asociar tras guardar con revisión. Un éxito de subida no anuncia «foto publicada». No se cambia el límite global de Server Actions para aceptar archivos.

La corrección de nombre/indicaciones por responsable requiere solicitud expresa del cliente, revisión y motivo; atención no tiene ese control. El historial paginado para correcciones queda restringido al responsable. Perfil cerrado, tarjeta suspendida, programa pausado y servicio caído tienen estados distintos. Sellos/canje se deshabilitan según la respuesta autorizada, conservando consulta y pedido invitado.

El cambio de número muestra «pendiente de verificar» hasta completar Auth y releer la tarjeta. No usa activación de otra cuenta para mover saldos. Después de cerrar sesión, limpiar estado privado y renovar la navegación desde servidor para evitar contenido retenido en memoria del router; `no-store` HTTP por sí solo no vacía todos los estados del navegador.

## 7. Accesibilidad e interacción

Objetivo de construcción: WCAG 2.2 AA, con comprobación automática y manual; no se afirma certificación. Controles táctiles conforme al [Sistema visual canónico](../../.agents/brand/sistema-visual.md), que amplía el mínimo previo de esta especificación; etiquetas visibles y teclado completo. Contraste 4,5:1 para texto normal y estados que no dependan solo de color. Cuerpo y medidas de lectura según ese sistema, zoom habilitado y diseño desde 320 px sin desbordamiento horizontal involuntario.

Diálogo de opciones devuelve foco al disparador, limita foco mientras está abierto y permite Escape; errores se asocian con `aria-describedby`. Al enviar, enfocar el resumen enlazado si existen varios errores y, sin resumen, el primer campo inválido; no mover foco por blur. Feedback breve de agregado y operaciones en región `aria-live`, sin anunciar todo el carrito repetidamente. Permitir autocompletar nombre/contacto y copiar el enlace privado; no exigir transcripción imposible ni bloquear gestores de contraseña del personal.

`CartDock` reserva espacio inferior mediante su altura y safe-area; `scroll-padding` y desplazamiento al error evitan ocultar controles enfocados. La guía de la habilidad `ui-ux-pro-max` distingue el mínimo AA de foco parcialmente visible y el criterio reforzado AAA; este proyecto busca que el control enfocado quede completamente visible sin afirmar que eso sea requisito AA.

Fotos con dimensiones/aspect-ratio, alt pertinente, fallback neutro y carga diferida; imagen principal priorizada. Respetar `prefers-reduced-motion`; animaciones breves solo para feedback, sin retrasar acciones. Iconos consistentes con etiquetas; emojis no sustituyen botones esenciales.

Dirección visual: crema, carbón y acentos de fuego, conforme al análisis. Tokens, fuentes y patrones de interfaz quedan especificados en el [Sistema visual canónico](../../.agents/brand/sistema-visual.md); explicación y alcance en [Identidad visual](14-identidad-visual-y-sistema-ui.md), evidencia en [Investigación](15-investigacion-ux-y-referentes.md). Usar [Reglas UX/UI](../../.agents/rules/ux-ui.md) y `ui-ux-pro-max` al construir o revisar. Originales de marca/fotos siguen pendientes en PT-09; la propuesta de interfaz no equivale a manual gráfico oficial ni a pantallas probadas.

## 8. SEO, caché y medición

Metadata pública con nombre y contenido real; canonical y URL base solo tras definir dominio. Robots/noindex para carrito, tarjeta y áreas internas. Datos estructurados del restaurante únicamente con dirección/horarios confirmados. No inventar reseñas, puntuaciones o tiempos.

Supabase fetch `no-store`, respuestas privadas `no-store` y ausencia de caché compartida de sesión. Al mutar, consultar datos actualizados; refrescar una página no equivale a invalidar una caché externa que no se haya diseñado. Versionar rutas de imagen para evitar mostrar la anterior.

Medir tiempos del flujo con `performance` en sesión y, en piloto, recoger agregados sin PII. No se incorpora proveedor analítico externo ni cookies de marketing en v1. Abrir el enlace se registra como intento de apertura, no recepción efectiva. Una integración analítica posterior requiere revisar privacidad y contratos.
