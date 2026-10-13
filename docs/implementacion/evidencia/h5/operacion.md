# H5 — Contratos y operación

**Versión:** 1.0 · **Fecha:** 8 de octubre de 2026.  
**Alcance:** implementación de pedido invitado y condiciones comerciales. Complementa los [contratos de diseño](../../../diseno-tecnico/05-contratos-y-operaciones.md) y la [especificación H5](../../05-hito-5-pedido-por-whatsapp.md). [Evidencia](README.md).

## Configuración comercial

`payment_methods` y `delivery_zones` viven en `public` con RLS y sin CRUD directo para visitantes, sesiones del personal o service_role. Ambas conservan UUID, revisión, fechas, `deleted_at`, `deleted_by` y `delete_reason`. Motivo obligatorio entre 10 y 500 caracteres al retirar; DELETE físico denegado. `app_owner` mantiene los objetos; Auth/Storage no se modifican.

Solo responsable activo con AAL2 usa `/administracion/configuracion`. Se reutilizan conservación, recibos, auditoría, feedback y journal de H4. Crear no confirma las condiciones: enabled/verified requieren decisión explícita. Editar campos comerciales invalida verificación; una restauración deja ambos flags en false. No se puede cambiar el código de un pago existente. Cargo y mínimo vacíos son NULL; un cero escrito y confirmado sí es un importe conocido.

`get_admin_config()` devuelve los campos escalares y colecciones privadas, incluidos retirados. `read_catalog()` solo proyecta pagos/zonas vivos, habilitados y verificados, con nombres camelCase; las zonas excluidas se proyectan para poder rechazarlas. `paymentsReady` expresa existencia de un pago utilizable.

`saveCheckoutConfigAction` valida shape/fields y llama a `update_business_config(integer,jsonb,uuid)`. El patch hijo contiene exactamente una operación en una de estas claves:

```json
{
  "paymentMethods": [{
    "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "expectedRevision": 0,
    "fields": {
      "code": "codigo_confirmado_por_el_negocio",
      "label": "Nombre confirmado",
      "instructions": null,
      "needs_change": false,
      "enabled": false,
      "verified": false,
      "sort_order": 0
    }
  }]
}
```

Es un ejemplo de contrato, sin alta de datos reales. Para zonas la clave es `deliveryZones`; fields utiliza `name`, `coverage` (`allowed`/`excluded`), `fee_cents`, `minimum_subtotal_cents`, `enabled`, `verified`. Crear usa revisión hija cero; editar exige la revisión actual. La revisión global se pasa en `p_expected_revision`. No se mezclan scalar patch y operaciones hijas ni varias filas por petición.

La transacción bloquea configuración antes de la fila, verifica global/hija, normaliza el hash y registra recibo/auditoría atómicos. UUID repetido con misma entrada reproduce el resultado; entrada distinta devuelve conflicto de idempotencia. No-op produce recibo sin auditoría de cambio ni avance de revisión. Errores no exponen campos personales. El helper escalar anterior queda privado y sin EXECUTE de sesiones/API.

Pedidos solo se habilitan con al menos un pago vigente confirmado. Una constraint diferida protege también la retirada/desverificación del último pago: pausar primero. Los cambios de hijos incrementan revisión global; cargar la versión actual en el formulario escalar antes de activar. No sobrescribir entrada antigua silenciosamente: el conflicto exige revisar. Un guardado confirmado seguido de fallo de recarga se informa como cambio confirmado, sin repetirlo como incierto.

## Validación pública

`POST /api/cart/validate` en runtime Node recibe únicamente modalidad delivery/pickup, código de pago, zona opcional y líneas con UUID, artículo, cantidad, IDs de opciones, revisión y precio observados. Nombre, dirección y textos de indicaciones se rechazan como campos desconocidos; no forman parte de este contrato.

- Cuerpo real máximo 32 KiB, también en stream sin longitud fiable; recepción acotada a 15 segundos. JSON UTF-8 estricto.
- Entre 1 y 30 líneas con IDs únicos, 1–20 unidades por línea, máximo 120 unidades y 20 opciones únicas por línea.
- Origin presente debe coincidir con `APP_SITE_URL`; falta de Origin admite consumidores técnicos. No confiar en el hostname interno del servidor de Next.
- Consulta fresca mediante `read_catalog`, sin cookies de cliente, operaciones de autenticación ni clave privilegiada. Se reevalúan publicación, eliminación de padres, promoción vigente, opciones y sus límites.
- Respuesta `Cache-Control: no-store`, `nosniff`, requestId y contrato compartido. 200 contiene `ready` o `needs_review`; 422 para condiciones comerciales bloqueantes; 400/403/408/413/415 para entradas/origen y 503 para fallo de servicio.

DTO canónico: modo, configRevision, teléfono oficial, pago/zona, warnings, lineIssues, líneas con nombres/porciones/opciones/revisión/precios y totales. Errores usan códigos compartidos: ORDERING_PAUSED, CONFIG_NOT_READY, BUSINESS_CLOSED, MODE_NOT_ALLOWED, COVERAGE_EXCLUDED, MINIMUM_NOT_MET, ITEM_UNAVAILABLE, OPTION_UNAVAILABLE, CATALOG_CHANGED o VALIDATION_ERROR.

Importes son enteros PEN. Cargo desconocido implica `amountCents=null` y `totalCents=null`; subtotal permanece conocido. Horario desconocido, zona no configurada, mínimo desconocido y cargo pendiente permiten coordinación explícita. Horario cerrado, cobertura excluida y mínimo conocido incumplido bloquean. Recojo exige dirección del local confirmada y conserva cargo pendiente si no está verificado. C01 nunca entra y P05 no admite recojo.

La respuesta incluye SHA-256 de la entrada comercial normalizada y vigencia de 60 segundos. Cliente mide el plazo desde el comienzo de la petición con `performance.now()`, acotado a 60 segundos. No usa reloj de pared del dispositivo. Edición del borrador invalida revisión; respuestas antiguas se descartan y nunca navegan como válidas. Aceptar versiones actualiza snapshot/revisión/precio y exige revalidar; no elimina productos ni sustituye opciones retiradas automáticamente.

Los límites, timeout y comprobación de Origin acotan cada petición; no son un rate limiter distribuido. PT-12 debe definir protección de abuso en el hosting antes del lanzamiento; no se inventa un contador en memoria que falle con varias instancias. Los logs no incluyen cuerpos, nombres, direcciones, indicaciones o URL de WhatsApp.

## Borrador local y privacidad

Provider del dominio mantiene estado en memoria y se hidrata después del montaje. No escribe un carrito vacío antes de leer almacenamiento.

| Clave | Contenido | Conservación |
| --- | --- | --- |
| `fyb.cart.v1` — localStorage | IDs, modalidad, cantidades/opciones, revisión/precio/snapshot comercial, escritor y `hadInstructions`. | Siete días de inactividad; expirar exige revisión o descarte explícito. |
| `fyb.checkout.v1` — sessionStorage | Nombre, dirección/referencia, pago/zona/cambio e indicaciones generales/por línea. | Sesión de la pestaña; se limpia al salir del acceso privado existente. |
| Memoria | DTO validado, deadline y revisión del borrador. | No se persiste; una recarga exige revalidación. |

Línea se identifica por artículo + opciones ordenadas + indicaciones normalizadas. Solo líneas con indicaciones revisadas se fusionan y se conservan límites. `hadInstructions` sin texto recuperado mantiene líneas separadas en needs_review; usuario reingresa texto o confirma sin indicaciones.

JSON dañado o versión incompatible se conserva sin sobrescribir y bloquea hasta descarte explícito. Almacenamientos se leen por separado: si sessionStorage falla, los productos legibles se recuperan y sus indicaciones requieren revisión. Storage bloqueado permite trabajar en memoria con aviso de falta de persistencia. Escribir cada área tiene manejo independiente de errores.

Otra pestaña modifica el carrito: se muestra aviso, se bloquea edición y el usuario decide cargarla. Cargar versión externa no reutiliza indicaciones posiblemente antiguas de la sesión; `hadInstructions` exige revisión. Nueva solicitud requiere confirmación y vacía únicamente cuando el usuario la acepta. Volver del chat conserva productos y formulario.

## Continuación por WhatsApp

`/pedido` → `/pedido/datos` → `/pedido/continuar`, páginas dinámicas con noindex y títulos específicos. El carrito y su API no dependen de cliente Auth ni fidelización. En H6 deberá ensayarse también una caída real de tarjeta; su servicio todavía no existe.

Formulario local: nombre 1–80, dirección 5–250 solo para entrega, referencia 200, instrucciones generales 500 y por línea 200 caracteres. Medio de pago actual; cambio opcional solo cuando procede y sin admitir importe inferior al total conocido. Cantidad/precio/opciones se revisan antes de construir el mensaje.

Generador puro en navegador combina DTO canónico y datos locales. Incluye porciones, opciones, cantidades/precios, subtotal/cargo/total, datos pertinentes, pago y advertencias. Nunca manda PII a Supabase o a un endpoint generador. Recojo omite dirección privada de entrega.

URL oficial `https://wa.me/51982042493` con texto codificado hasta 7000 caracteres. Si excede, no truncar: texto completo seleccionable/copiable y chat sin parámetro. La preparación/validación es controlada y muestra loading contextual; abrir el destino externo ya preparado es un enlace accionado por el usuario. No se abre automáticamente después de un await.

Copiar espera Clipboard API antes de anunciar éxito. Si falla, selecciona el texto y explica copia manual. Revisión vencida quita apertura válida y ofrece revalidación; click/copia comprueban deadline también de forma inmediata. Apertura no confirma envío, recepción, pago ni venta, no vacía borrador y no escribe solicitudes en DB.

## Interfaz y preparación pública

Skill `ui-ux-pro-max` aplicada con el [sistema canónico](../../../../.agents/brand/sistema-visual.md). Dock únicamente en carta/detalle con espacio inferior y safe area; dentro del pedido se utiliza el resumen existente para despejar formularios. Errores tienen labels, enlaces y foco; continuación no enlaza errores a campos que solo existen en `/pedido/datos`. Acciones locales/navegación no muestran loading ficticio.

**Estado remoto:** tablas de pagos/zonas vacías, pedidos y fidelización pausados. No inventar medios de pago, cargos, ubicación ni personal real para activar el recorrido. Confirmar PT-04, precios afectados PT-05 y responsable/recepción PT-10; PT-01 antes de recojo. PT-02/PT-03 admiten advertencias contractuales para desconocidos. PT-08/PT-11/PT-13 permanecen pendientes en su alcance.

Preparación del responsable: entrar con MFA, confirmar contenidos/precios en carta, crear/verificar/habilitar pagos reales, configurar zonas/cargos si están confirmados, cargar configuración actual y activar pedidos tras aceptación operativa. Desactivar pedidos conserva borradores; antes de retirar el último pago se debe pausar. Restaurar condiciones exige reconfirmarlas expresamente.

El desarrollo habitual sigue con `yarn dev` y `.env.remote.local`, sin Docker. Reconstrucción/fixtures destructivas exclusivamente en entorno local de pruebas; jamás ejecutar reset o semillas sintéticas contra remoto.
