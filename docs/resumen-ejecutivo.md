# Fuego y Brasas — Resumen ejecutivo del proyecto

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](diseno-tecnico/16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. MFA del personal se conserva.

**Ubicación:** Parcona, Ica, Perú.  
**Estado del negocio:** En funcionamiento.  
**Etapa del proyecto:** Definición de producto y alcance inicial.  
**Fecha del documento:** 3 de octubre de 2026.  
**Fecha de lanzamiento:** Por definir.

## 1. Descripción global

Fuego y Brasas desarrollará una web orientada a convertir visitantes en pedidos y fomentar la recurrencia de sus clientes. La experiencia dará prioridad al celular y combinará dos funciones: una carta comprable que prepara pedidos para WhatsApp y una tarjeta virtual de sellos para compras presenciales.

El producto principal del negocio es el pollo a la brasa. Los mostritos y las promociones también destacan entre sus ventas. La identidad comercial comunica «Pollería · Carnes · Boxes», mientras que la oferta inicial de la web se limitará a la carta y las promociones proporcionadas y confirmadas por el propietario.

Este documento reúne la visión general y los acuerdos alcanzados. Los requerimientos detallados, los flujos por pantalla, los wireframes y la arquitectura técnica se desarrollarán en una etapa posterior.

## 2. Objetivos y público

El objetivo principal es que una persona encuentre rápidamente qué comer y prepare un pedido correcto con pocos pasos. Como objetivo complementario, la tarjeta de sellos incentivará nuevas visitas y permitirá conservar las indicaciones frecuentes de cada cliente.

La experiencia se dirigirá principalmente a clientes de Parcona que consulten la web desde su celular. Se contempla que lleguen mediante redes sociales, WhatsApp, búsquedas, Google Maps, códigos QR y enlaces compartidos; la distribución real de esos canales todavía no está medida.

La métrica principal de referencia será el tiempo desde que el visitante entra a la web hasta que abre WhatsApp con su pedido preparado. Abrir WhatsApp, enviar el mensaje y obtener la confirmación del local son momentos distintos: la apertura del mensaje no equivale a una venta confirmada.

## 3. Alcance de la primera versión

| Función | Descripción general |
| --- | --- |
| Carta y promociones | Consultar productos, porciones, inclusiones y precios con información breve. Las promociones se presentarán como productos que pueden agregarse al pedido. |
| Selección y personalización | Elegir productos e incorporar únicamente las opciones necesarias y disponibles para cada uno. |
| Carrito | Agregar productos, modificar cantidades, eliminar artículos, editar personalizaciones, seguir comprando y revisar importes. |
| Datos del pedido | Recoger nombre, modalidad de entrega o recojo, dirección cuando corresponda y forma de pago. Referencia y observaciones serán opcionales. |
| WhatsApp | Preparar un mensaje con productos, cantidades, opciones, importes y datos del cliente para que este lo revise y lo envíe al local. |
| Tarjeta virtual | Participación opcional mediante teléfono verificado, consulta de sellos y recompensa por compras presenciales. |
| Gestión por el personal | Identificar al cliente, consultar sus indicaciones habituales, acreditar sellos y registrar canjes mediante una operación sencilla. |

Comprar no requerirá una cuenta ni participar en la tarjeta. La identificación para fidelización tendrá una finalidad independiente del flujo básico de pedido.

El WhatsApp oficial que recibirá los pedidos será **982 042 493**. La atención, confirmación y coordinación final de la venta se realizarán por ese canal. Los importes deberán distinguir el subtotal de productos de cualquier cargo adicional pendiente de confirmar, sin presentar un subtotal como si fuera el total definitivo.

## 4. Oferta comercial de partida

Las dos imágenes de carta se han confirmado como la oferta con la que se trabajará inicialmente. Contienen 24 entradas distribuidas en seis grupos: pollo a la brasa, mostritos, platos criollos, chicharrón de pollo, clásicos y alitas broaster. Estos grupos son una referencia comercial; la navegación definitiva se resolverá durante el análisis de UX.

Las cinco promociones proporcionadas siguen vigentes según la confirmación del propietario:

| Promoción | Precio publicado |
| --- | ---: |
| Mostrito de ⅛ de pollo | S/14.90 |
| Pollo entero a la brasa | S/44.90 |
| Ronda de 16 alitas | S/44.90 |
| Combo Mostrito | S/59.90 |
| Gran Promoción: un pollo entero más medio pollo | S/89.90 |

La porción regular de alitas de S/15.00 contiene cuatro unidades. La carta y las promociones muestran diferencias de precio e inclusiones que deberán expresarse con claridad, sin asumir que todos los productos de nombres similares son equivalentes.

Por indicación del propietario, se retirará de la presentación pública la mención «Solo delivery» de la Gran Promoción. Este cambio de texto conserva su condición comercial de entrega a domicilio; no establece que la promoción admita recojo. El tratamiento de esa condición dentro del flujo se precisará en el análisis funcional.

## 5. Fidelización e indicaciones habituales

La tarjeta virtual forma parte de la primera versión. La regla inicial aceptada es **un sello por visita presencial con compra pagada y un Mostrito de ⅛, con sus acompañamientos, al completar diez sellos**. El premio podrá canjearse en una visita posterior sin exigir otra compra. Inicialmente se plantea que los sellos no tengan vencimiento.

El personal que atiende validará los sellos y registrará los canjes. Los pedidos preparados en la web o enviados por WhatsApp no generarán sellos automáticamente. El costo de preparar el premio está pendiente de conocer y deberá validarse antes de publicar las condiciones del programa.

Las preferencias guardadas se concentrarán en indicaciones frecuentes, como «sin ensalada» o «ají aparte». Estas podrán revisarse y modificarse para cada pedido. El historial detallado de productos comprados queda como una posible ampliación posterior.

El propietario ha propuesto utilizar Supabase para respaldar las funciones de clientes y fidelización. La configuración y el diseño técnico todavía no forman parte de este documento.

## 6. Principios de experiencia e identidad

- Priorizar el uso desde el celular, la lectura rápida y las acciones cómodas con el pulgar.
- Mostrar comida y promociones comprables desde el inicio, reduciendo el tiempo hasta agregar el primer producto.
- Mantener un pedido breve, con personalizaciones y campos que aporten valor operativo.
- Integrar la fidelización como una opción que no interrumpa ni condicione la compra.
- Conservar la identidad de fuego, brasas, tradición y familia con una estética moderna, espacio libre y fotografías apetitosas.
- Tomar como orientación fondos crema o blanco cálido, zonas de carbón y acentos de naranja, rojo oscuro y dorado, sin saturar la interfaz de llamas, madera o efectos.

## 7. Límites y continuidad del proyecto

Quedan fuera del alcance inicial el registro obligatorio para comprar, una aplicación móvil independiente, seguimiento GPS, pasarela de tarjetas, chatbot, inteligencia artificial, reservas, cupones complejos, múltiples sucursales y un panel administrativo complejo. La tarjeta de sellos y las indicaciones habituales son las ampliaciones acordadas respecto del brief original.

El análisis completo precisará la organización de la carta, las personalizaciones, la operación de entrega y recojo, los estados de disponibilidad, los casos de error y los criterios de aceptación. También completará los datos operativos todavía no proporcionados: dirección exacta, horarios, cobertura y cargos de entrega, medios de pago aceptados, inclusiones pendientes, materiales originales y costo de la recompensa.

La siguiente etapa convertirá esta visión en requerimientos y flujos verificables, manteniendo como prioridad la rapidez del pedido y una operación que el personal pueda gestionar con facilidad.
