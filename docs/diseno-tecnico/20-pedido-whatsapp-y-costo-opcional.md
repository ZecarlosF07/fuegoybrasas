# Pedido por WhatsApp y costo opcional del premio

**Actualización DC-26, 22/10:** [textos aprobados y tarjeta autorizada](21-aprobacion-y-activacion-tarjeta.md).

**Fecha:** 21/10/2026. **Alcance:** actualización de H5, H6 y preparación de H8.

## Decisiones

- **DC-23 — Indicación del propietario:** la web prepara el pedido del carrito para WhatsApp; no solicita medio de pago ni vuelto y no cobra por la web. Configurar pagos deja de condicionar pedidos.
- **DC-24 — Ajuste técnico:** el costo de referencia del premio es opcional. Desconocido se conserva como `NULL`; no se usa el precio de carta ni se bloquean altas, sellos o canjes por ese dato.
- **DC-25 — Revisión delegada:** el propietario solicita que el agente compruebe el producto para entregarlo al cliente. La evidencia acredita los escenarios técnicos ejecutados; no se atribuyen recepción real en WhatsApp, capacitación de otra persona, pruebas físicas o aprobación de textos a una simulación.

Se conservan WhatsApp **982 042 493**, pedido invitado, borrador local, diez sellos por Mostrito de ⅛, entrega presencial pagada antes del sello, canje posterior sin compra y procedimientos de H7. No hay tabla de pedidos ni se guarda el mensaje preparado en Supabase.

## Contrato de pedido

`POST /api/cart/validate` recibe modalidad, zona opcional y líneas con IDs, opciones, cantidades, revisión y precio observado. Se retira `paymentMethodCode`. Continúan catálogo vigente, agotados, modalidad, cobertura conocida, límites, precios y revisión explícita de cambios. Las entradas públicas siguen siendo estrictas y sin nombre, dirección o indicaciones personales.

El resultado deja de incluir `paymentMethod`. El formulario conserva nombre, dirección/referencia cuando corresponde e indicaciones. Desaparecen pago, instrucciones de pago y vuelto del formulario y del mensaje. Los cargos desconocidos no se convierten en cero.

Se mantienen `/pedido`, `/pedido/datos` y `/pedido/continuar`. «Abrir WhatsApp» abre el destino externo con el mensaje; el cliente decide enviarlo. No confirma recepción, venta, pago o entrega.

La recuperación de `fyb.checkout.v1` descarta los campos antiguos de pago/vuelto y conserva los demás datos. `fyb.cart.v1` mantiene su versión y productos. Las peticiones nuevas a la API no aceptan los campos retirados.

## Administración y migración

El panel conserva zonas/cargos y retira los controles de medios de pago. La tabla histórica `payment_methods`, sus permisos y recibos permanecen por compatibilidad, sin intervenir en nuevos pedidos. No se borran registros ni se resetea el proyecto oficial.

La migración adicional elimina los triggers que exigían pagos para habilitar pedidos. Conserva RLS, autorización, revisiones, auditoría e idempotencia. Por sí sola no activa ninguna función pública.

## Costo de referencia opcional

- El campo administrativo explica ingredientes, acompañamientos y empaque, en soles. Vacío significa desconocido; cero solo se registra si se ingresa expresamente. No es el precio de carta.
- Activación y modificación aceptan costo nulo; las RPC admiten omitir el argumento mediante valores predeterminados y se regeneran sus tipos con CLI.
- `reward_cost_cents_snapshot` puede quedar nulo en un canje. Otros eventos mantienen ese campo nulo. Los valores conocidos siguen siendo enteros no negativos.
- Registrar un costo después no reescribe canjes anteriores. Un indicador futuro deberá distinguir canjes sin costo conocido antes de presentar un costo total completo.
- Meta y contenido del premio de una versión utilizada conservan sus restricciones. El cliente no ve costos internos.
- Se mantienen confirmaciones de condiciones, privacidad, acceso probado y operación del personal. Aprobar textos corresponde al negocio y es independiente del dato financiero.

SQL admite el campo antiguo `costConfirmed` sin exigirlo; la interfaz y el nuevo contrato ya no lo envían. Las operaciones conservan rol manager, revisión e idempotencia.

## Preparación y aceptación

`release:check` informa `features.ordering` y `features.loyalty` por separado. Se retiran `PAYMENTS` y `REWARD_COST` como bloqueos. Los textos pendientes de fidelización no bloquean el pedido invitado; el resultado combinado puede seguir `ready=false` con pedidos preparado.

La aceptación comprueba: pedido completo sin pagos configurados; ausencia de pago/vuelto; borrador anterior recuperable; precios/cobertura/agotados y privacidad; activación con costo nulo; diez sellos y canje con snapshot nulo; costo posterior sin alterar historial; permisos, concurrencia y recibos.

Las identidades sintéticas se usan exclusivamente en Supabase local. La [guía de entrega](../entrega-al-cliente/README.md) y la evidencia H8 distinguen versión probada, publicación real y decisiones pendientes del negocio.
