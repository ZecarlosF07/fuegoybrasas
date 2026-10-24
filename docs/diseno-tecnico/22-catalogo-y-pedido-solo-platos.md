# Catálogo y pedido de platos, coordinación por WhatsApp

**DC-27 · 22/10/2026.** El propietario solicita retirar modalidad y dejar el detalle del costo de envío a WhatsApp: «solo pedir los platos y ya». Pide mejorar carta/detalle con referentes de pollerías y UI/UX Pro Max. Sustituye las selecciones y condiciones logísticas públicas anteriores de H3/H5; no cambia precios comerciales, reglas de tarjeta o permisos.

## Pedido simplificado

- Cliente elige plato, cantidad, opciones reales e indicaciones opcionales; no selecciona entrega/recojo ni completa nombre, dirección, referencia, zona, pago o vuelto.
- `/pedido` reúne platos, cantidades y resumen; las indicaciones generales se despliegan solo si se necesitan. Conserva la aplicación opcional de preferencias de tarjeta.
- `/pedido/continuar` muestra el mensaje y permite abrir/copiar WhatsApp. `/pedido/datos` redirige a `/pedido`, conservando el borrador mediante su proveedor.
- Se muestra **subtotal de productos**. No se suma envío, se supone gratuito ni se promete un total final. Entrega, cobertura, dirección y costo de envío se coordinan por WhatsApp.
- Mensaje: productos, porciones, opciones, cantidades, precios y subtotal; indicaciones si existen; una frase de coordinación por chat. No contiene campos logísticos vacíos ni datos personales requeridos por la web.
- Abrir WhatsApp no confirma envío, recepción, pago, venta o entrega. No hay tablas ni escrituras de pedidos.

## Contrato y precios

`POST /api/cart/validate` acepta estrictamente `{ lines }`, sin modalidad, zona o PII. Mantiene límites de 32 KiB, 30 líneas, 20 unidades por línea/120 totales, opciones, precios, revisiones, agotados, pausa/horario y vencimiento de validación. La respuesta conserva líneas canónicas, problemas, fingerprint, revisión y vencimiento; `totals` contiene solo `subtotalCents`.

Los precios y sus modalidades internas siguen en el catálogo/administración por compatibilidad. La interfaz toma un precio único solo si todos los precios publicados del artículo coinciden, o existe uno solo. Ante precios contradictorios muestra «Precio por confirmar» e impide preparar esa línea automáticamente: no elige el menor ni inventa un precio web. Se conserva C01 fuera de la carta web. Las restricciones de atención de promociones se resuelven con el local; el cliente no autoriza otra modalidad desde la página.

Las 17 referencias publicadas se comprobaron mediante lectura del catálogo real: ninguna tiene precios contradictorios. No se modifican filas comerciales ni se necesitan migraciones para retirar selecciones y cálculos públicos. `payment_methods` y `delivery_zones` conservan sus tablas, historial y permisos, sin condicionar esta solicitud.

## Recuperación y privacidad

Se conservan las claves de almacenamiento v1 para recuperar pedidos existentes. Se acepta el campo antiguo `mode` únicamente al leer el formato comercial y se ignora. Al recuperar sesión se descartan nombre/dirección/referencia/zona/pago/vuelto, manteniendo productos, UUID e indicaciones. Las escrituras nuevas omiten esos campos. Formato corrupto, caducidad, cambios entre pestañas e indicaciones perdidas conservan sus controles de recuperación expresa.

El aviso de datos actualiza exclusivamente la descripción del pedido invitado para reflejar la retirada solicitada. No cambia el tratamiento de identidad, tarjeta o historial aprobado en DC-26. Su registro de aprobación conserva la aprobación original y añade la modificación descriptiva autorizada por DC-27, con hash actualizado y fecha, sin fingir una nueva aprobación explícita de una política distinta.

## Diseño y marca

Carta: fotos y títulos enlazados, porciones claras, inclusiones, precio y acción. Se puede agregar directamente un plato sin opciones obligatorias; los que necesitan una elección llevan al detalle. Categorías visibles al recorrer la carta, sin introducir popularidad ni descuentos inventados.

Detalle: imagen amplia, contexto de categoría, porción/precio, inclusiones legibles y bloque compacto para cantidad/opciones/indicaciones. Se conserva fotografía referencial identificada, prioridad de fotos propias y fallback. Componentes pequeños, tipos separados y lógica compartida entre alta desde tarjeta y detalle.

Se revisaron sitios oficiales y UI/UX Pro Max; [comparativa de colores](../marca/comparativa-colores-pollerias.md). El propietario aprobó la [propuesta 06](../marca/manual-propuesto-06-rojo-profundo.md) el 24/10: header rojo profundo, letras blancas y amarillo vivo en acciones, con cuerpo blanco/texto carbón. [DC-28](23-renovacion-ux-ui-y-marca.md) registra su aplicación; el sistema canónico es la única fuente productiva. No se copian recursos de competidores.

## Aceptación

Comprobar ausencia de modalidad/datos logísticos en detalle, carrito, API y mensaje; subtotal sin cargos aunque existan zonas configuradas; recuperación del formato anterior; precio cambiado, agotados/opciones, fallos/reintentos y expiración; acceso invitado ante fallo de preferencias; agregación directa desde carta; responsive/teclado/axe y compilación Yarn. Las pruebas sintéticas siguen exclusivamente en local. La evidencia se registra al ejecutarlas, sin atribuir pruebas físicas o recepción real de WhatsApp.
