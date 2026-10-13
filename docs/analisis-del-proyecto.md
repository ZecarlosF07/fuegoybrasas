# Fuego y Brasas — Análisis completo del proyecto

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](diseno-tecnico/16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. MFA del personal se conserva.

**Versión:** 1.0.  
**Fecha:** 3 de octubre de 2026.  
**Negocio:** Fuego y Brasas, Parcona, Ica, Perú.  
**Estado:** Análisis de producto, requerimientos funcionales y UX.  
**Documento relacionado:** [Resumen ejecutivo](resumen-ejecutivo.md).

## 1. Propósito y estado del documento

Este documento define la experiencia de compra, la tarjeta de sellos y la operación mínima que necesita Fuego y Brasas. Su objetivo es servir como base para diseñar y desarrollar el producto, con decisiones trazables y criterios de aceptación verificables.

El análisis utiliza el brief, las seis imágenes proporcionadas y las respuestas del propietario. Las últimas decisiones de la conversación prevalecen sobre las exclusiones iniciales: la fidelización y las indicaciones habituales ahora forman parte de la primera versión.

Se emplean cuatro estados:

| Estado | Significado |
| --- | --- |
| Confirmado | Dato del negocio o decisión expresamente proporcionada o aceptada por el propietario. |
| Propuesta de análisis | Solución de producto o UX definida aquí como base de trabajo; no representa un dato operativo confirmado. |
| Pendiente | Información que el negocio todavía no ha proporcionado o una validación necesaria antes de publicar. |
| Hipótesis | Supuesto sobre el comportamiento del cliente que debe comprobarse mediante observación o pruebas. |

El documento cubre el análisis completo de las funciones previstas. Su existencia no confirma datos que siguen pendientes. Estos se concentran en la sección 25, sin repetir el cuestionario.

No se establecen aquí código, esquemas de base de datos, APIs, frameworks, infraestructura, hosting ni arquitectura de software. La propuesta del propietario de usar Supabase se registra como antecedente; su evaluación y configuración corresponden al diseño técnico posterior.

## 2. Contexto, objetivos y usuarios

### 2.1. Contexto del negocio

El local ya está funcionando. Su principal producto es el pollo a la brasa; el propietario identifica también a los mostritos y las promociones entre los más vendidos. La marca comunica «Pollería · Carnes · Boxes», pero el catálogo inicial se limita a los productos de las imágenes confirmadas.

La web debe facilitar una decisión de comida y un pedido correcto. La historia del negocio, su misión y otros contenidos institucionales tendrán una ubicación secundaria.

### 2.2. Objetivos

| Prioridad | Objetivo | Resultado esperado |
| --- | --- | --- |
| Principal | Convertir visitantes en pedidos preparados para WhatsApp. | Elegir comida, revisar importes y abrir una conversación con información suficiente. |
| Complementaria | Incentivar visitas presenciales recurrentes. | Acumular sellos por compras reales y canjear una recompensa comprensible. |
| Operativa | Reducir consultas y errores evitables. | Comunicar cantidades, opciones e indicaciones con claridad. |
| De servicio | Conservar indicaciones frecuentes. | Reutilizar preferencias que el cliente pueda revisar y modificar. |

La métrica central será el tiempo desde la entrada a la web hasta la apertura de WhatsApp con el pedido preparado. Esa apertura no demuestra que el mensaje se envió, que el negocio lo aceptó o que la venta se completó.

### 2.3. Usuarios y contextos

| Usuario | Necesidad | Implicación para el producto |
| --- | --- | --- |
| Cliente que busca una comida personal | Elegir y pedir rápidamente. | Precio, porción e inclusiones visibles; pocas decisiones. |
| Cliente que compra para compartir | Comparar cantidades y combos. | Explicar el contenido sin inventar para cuántas personas alcanza. |
| Cliente recurrente | Consultar sellos y reutilizar indicaciones. | Acceso opcional a su tarjeta y preferencias editables. |
| Personal de atención | Reconocer al cliente y registrar visitas y canjes. | Operaciones breves, acceso autorizado y confirmaciones claras. |
| Responsable del negocio | Mantener una oferta correcta y resolver incidencias. | Control de disponibilidad y revisión de movimientos de fidelización. |

Se considera probable que el tráfico llegue desde Facebook, Instagram, WhatsApp, Google, Maps, QR y enlaces compartidos. Es una hipótesis del brief; no hay datos de tráfico ni estudios de usuarios que permitan asignar porcentajes.

## 3. Acuerdos y límites de la información disponible

| Tema | Acuerdo o dato | Estado |
| --- | --- | --- |
| Operación | El local está funcionando en Parcona, Ica. | Confirmado |
| Lanzamiento | No existe fecha definida. | Pendiente |
| Catálogo | Se trabajará inicialmente con las dos imágenes de carta. | Confirmado |
| Promociones | Las cinco promociones proporcionadas siguen vigentes. | Confirmado al elaborar este documento |
| Alitas | Porción de S/15.00: cuatro unidades; ronda de S/44.90: dieciséis. | Confirmado |
| Pedidos | La venta termina de coordinarse mediante WhatsApp. | Confirmado |
| Número oficial | 982 042 493; formato internacional: +51 982 042 493. | Confirmado |
| Datos del pedido | Recoger nombre, modalidad, dirección cuando corresponda y forma de pago. | Confirmado como alcance funcional |
| Compra como invitado | La tarjeta y el registro no serán obligatorios para pedir. | Confirmado |
| Fidelización | Se incluye en la primera versión y cuenta compras presenciales. | Confirmado |
| Acceso del cliente | Teléfono verificado para consultar su tarjeta. | Confirmado como capacidad; canal de verificación pendiente |
| Validación de sellos | La realiza el personal que atiende. | Confirmado |
| Preferencias | Guardar indicaciones frecuentes. | Confirmado |
| Recompensa | Diez sellos por un Mostrito de ⅛ con sus acompañamientos. | Regla inicial aceptada; costo por validar |
| Canje | En una visita posterior, sin exigir otra compra. | Regla inicial aceptada |
| Vencimiento | Sin vencimiento inicialmente. | Base propuesta aceptada en la conversación |
| Gran Promoción | Retirar la mención pública «Solo delivery» conservando la condición comercial de entrega a domicilio. | Confirmado |
| Supabase | Plataforma propuesta por el propietario para clientes y fidelización. | Antecedente; diseño técnico pendiente |

No están confirmados los medios de pago aceptados, las tarifas o zonas de entrega, los horarios, la dirección exacta, las inclusiones de todos los platos, las opciones de personalización ni los archivos originales de marca y fotografía.

## 4. Referencias de UX y evaluación crítica

### 4.1. Alcance de la investigación

Se realizó una revisión documental de páginas y ayudas oficiales. No se hicieron compras reales, pruebas de conversión ni una auditoría completa de sus interfaces móviles. Los contenidos de algunos sitios dependen de carga dinámica, por lo que las observaciones se limitan a lo accesible. La utilidad para Fuego y Brasas es una conclusión de este análisis, no una eficacia demostrada por las referencias.

| Referencia | Observación verificable | Aplicación para Fuego y Brasas |
| --- | --- | --- |
| [Pardos Chicken: carta](https://websalon.pardoschicken.pe/carta) | La página accesible muestra búsqueda, «Mi orden» y confirmación de producto añadido. Es una carta de salón, no una evaluación de todo su flujo de entrega. | Mantener el pedido accesible y confirmar cada agregado. La búsqueda puede esperar por el tamaño del catálogo. |
| [Don Belisario](https://www.donbelisario.com.pe/) | Presenta categorías, promociones, complementos y opciones de recepción; describe combos personales y familiares. | Separar familias de productos y explicar la recepción. Las cuentas y la selección de múltiples locales no son necesarias aquí. |
| [Norky's](https://norkys.pe/) | Muestra productos destacados con descripciones y precios, además de categorías de comida. | Usar productos comprables como contenido principal y reservar la información institucional para después. |
| [Roky's](https://rokys.com/) y [Club Roky's](https://rokys.com/club-rokys) | El sitio muestra entrada de dirección; el club distingue registro, acumulación y canje. La lectura del menú principal fue limitada por su carga dinámica. | Aclarar los datos de recepción y separar participación, acumulación y canje en la tarjeta. |
| [Uber Eats: menús por modalidad](https://help.uber.com/merchants-and-restaurants/article/node-title?nodeId=5471a5a3-2168-4445-a510-07561eb489fe) | Su ayuda contempla disponibilidad y precios distintos según la modalidad; advierte que las opciones varían por mercado. | Validar modalidad, precio y restricciones del producto. No trasladar al MVP su estructura de plataforma, seguimiento o pedidos programados. |

### 4.2. Decisiones sobre patrones

| Patrón | Decisión de análisis | Motivo |
| --- | --- | --- |
| Categorías visibles | Incluir. | Facilitan recorrer una carta de varias familias. |
| Promociones como productos | Incluir. | Permiten pasar de la oferta a la compra en la misma acción. |
| Precio anterior y ahorro | Incluir cuando exista una comparación válida. | Explican la diferencia sin fabricar descuentos. |
| Personalización de todos los productos | Evitar. | Añade decisiones que cocina puede no necesitar. |
| Carrito editable | Incluir. | Permite corregir antes de abrir WhatsApp. |
| Barra inferior con pedido | Incluir cuando haya artículos. | Mantiene una acción principal accesible en móvil. |
| Búsqueda y filtros avanzados | Posponer. | Las categorías cubren el catálogo inicial. |
| Recomendaciones emergentes | Evitar. | Interrumpen cada agregado y alargan el pedido. |
| Complementos de pago | Condicionar a una oferta real con precio confirmado. | La carta actual no define bebidas ni extras como productos independientes. |
| Registro previo a comprar | Excluir. | La identificación solo es necesaria para la función opcional de fidelización. |

## 5. Alcance del MVP

### 5.1. Funciones necesarias

1. Carta organizada, precios legibles y promociones comprables.
2. Selección de productos, cantidades e indicaciones; opciones solo cuando el negocio las confirme.
3. Carrito editable, resumen de importes y continuidad al volver de WhatsApp.
4. Recogida mínima de datos de recepción y pago.
5. Preparación del mensaje y apertura del WhatsApp oficial.
6. Participación opcional en la tarjeta con teléfono verificado.
7. Consulta de sellos, premios e indicaciones habituales.
8. Gestión restringida al personal para acreditar visitas y registrar canjes.
9. Estados de error, agotado, promoción no disponible, cierre y fallos de verificación.
10. Un mecanismo de mantenimiento sencillo para que la oferta no permanezca desactualizada.

El mecanismo de mantenimiento se concretará durante el diseño técnico. El MVP no exige construir un editor completo de carta ni un panel comercial avanzado.

### 5.2. Condiciones que no amplían la oferta

- «Carnes» y «Boxes» en el logotipo no crean categorías sin productos confirmados.
- La gaseosa incluida en un combo no constituye por sí sola una bebida que pueda venderse por separado.
- El precio de consumo en mesa se conserva como dato de la carta fuente, pero no se ofrece en un flujo de entrega o recojo.
- La tarjeta de sellos habilita un perfil mínimo; no implica un historial detallado de todos los productos comprados.

### 5.3. Fuera del MVP

Registro obligatorio para comprar, contraseñas de cliente, aplicación móvil independiente, GPS, pasarela de tarjetas, chatbot, IA, reservas, pedidos programados, múltiples sucursales, cupones complejos, niveles de fidelidad, campañas automáticas, integración con caja y paneles administrativos complejos.

El acceso restringido del personal sí es necesario. Esa necesidad es distinta del acceso opcional del cliente a su tarjeta.

## 6. Catálogo y reglas comerciales

### 6.1. Transcripción de la carta confirmada

Los códigos siguientes sirven para referenciar productos dentro del análisis. No son identificadores técnicos ni una propuesta de estructura de datos.

| Referencia | Grupo de la carta | Producto publicado | Precio |
| --- | --- | --- | ---: |
| C01 | Pollo a la brasa | ¼ pollo — para mesa | S/10.00 |
| C02 | Pollo a la brasa | ¼ pollo — para llevar | S/13.90 |
| C03 | Pollo a la brasa | ½ pollo | S/32.90 |
| C04 | Pollo a la brasa | Pollo entero | S/59.90 |
| C05 | Clásicos | Salchipapa | S/10.00 |
| C06 | Clásicos | Broaster | S/10.00 |
| C07 | Alitas broaster | Clásicas, cuatro unidades | S/15.00 |
| C08 | Alitas broaster | Dulces, cuatro unidades | S/15.00 |
| C09 | Alitas broaster | Picantes, cuatro unidades | S/15.00 |
| C10 | Alitas broaster | Acevichadas, cuatro unidades | S/15.00 |
| C11 | Alitas broaster | En salsa de maracuyá, cuatro unidades | S/15.00 |
| C12 | Platos criollos | Lomo saltado | S/15.00 |
| C13 | Platos criollos | Tallarín saltado | S/15.00 |
| C14 | Platos criollos | Chaufa de pollo | S/14.00 |
| C15 | Platos criollos | Chaufa de carne | S/16.00 |
| C16 | Platos criollos | Mollejitas | S/15.00 |
| C17 | Platos criollos | Caldo de gallina | S/12.00 |
| C18 | Chicharrón de pollo | ¼ de pollo | S/19.90 |
| C19 | Chicharrón de pollo | ½ pollo | S/32.90 |
| C20 | Chicharrón de pollo | Pollo entero | S/59.90 |
| C21 | Mostritos | ⅛ de pollo | S/15.00 |
| C22 | Mostritos | ¼ de pollo | S/20.00 |
| C23 | Mostritos | ½ pollo | S/36.90 |
| C24 | Mostritos | Pollo entero | S/69.90 |

La carta indica que los pollos a la brasa incluyen papas fritas y cremas, y que todas las alitas incluyen papas fritas. No declara las inclusiones completas de los demás productos. No se extenderá automáticamente el contenido de una promoción a todas las porciones de la carta.

C01 es una entrada de consumo en mesa y queda fuera de los productos comprables por esta web. La aplicación de C02 a entrega y recojo debe validarse: la expresión «para llevar» no confirma por sí sola el precio de ambas modalidades.

### 6.2. Promociones vigentes confirmadas

| Referencia | Nombre | Incluye según el material proporcionado | Precio |
| --- | --- | --- | ---: |
| P01 | Mostrito | ⅛ de pollo a la brasa, chaufa, papas fritas y ensalada. | S/14.90 |
| P02 | Pollo entero a la brasa | Pollo entero, papas y ensalada; una pieza publicitaria también menciona cremas. | S/44.90 |
| P03 | Ronda de alitas | Dieciséis alitas, papas familiares, ensalada y cremas. | S/44.90 |
| P04 | Combo Mostrito | Pollo entero, papas, chaufa, ensalada, cremas y gaseosa de 1.5 L. | S/59.90 |
| P05 | Gran Promoción | Pollo entero más medio pollo, papas, chaufa, ensalada, cremas y gaseosa de 1.5 L. | S/89.90 |

P05 muestra un precio anterior de S/110.00 en su publicidad. Su ahorro calculado es S/20.10. La fecha de fin, los días aplicables y los límites de disponibilidad no han sido proporcionados.

La marca de gaseosa y la posibilidad de elegirla permanecen pendientes. Las imágenes muestran distintas marcas, pero eso no prueba que sean opciones intercambiables.

### 6.3. Diferencias que debe respetar la presentación

| Diferencia | Tratamiento |
| --- | --- |
| Mostrito C21: S/15.00; promoción P01: S/14.90. | Conservar ambas referencias. Si el negocio confirma equivalencia, mostrar una sola opción de compra al precio promocional mientras aplique. |
| Pollo C04: S/59.90; promoción P02: S/44.90. | Verificar inclusiones y condiciones antes de presentar uno como descuento del otro. |
| Mostrito entero C24: S/69.90; Combo Mostrito P04: S/59.90. | Mantener nombres e inclusiones distinguibles; no fusionar por similitud de nombre. |
| Alitas de cuatro unidades y ronda de dieciséis. | Mostrar el número de unidades antes de agregar. No son la misma porción. |
| ¼ para mesa y ¼ para llevar. | No ofrecer el precio de mesa para una recepción distinta. |

No se colocará un precio tachado ni un porcentaje calculado con otro plato que tenga inclusiones o condiciones diferentes.

### 6.4. Ciclo de vida de una promoción

Como capacidad funcional, cada promoción podrá estar activa o desactivada, tener precio anterior válido, precio vigente, periodo de aplicación cuando exista, modalidades admitidas y disponibilidad operativa.

La vigencia comercial y el agotamiento son condiciones distintas. Una oferta activa puede agotarse temporalmente; una oferta vencida deja de ser comprable aunque cocina tenga el producto.

Si una condición cambia mientras hay un carrito abierto, se revisa antes de preparar el mensaje. El cliente recibe una explicación y confirma las modificaciones; no se aumentan precios ni se eliminan artículos silenciosamente.

### 6.5. Condición de la Gran Promoción

La instrucción del propietario elimina la leyenda «Solo delivery» de la tarjeta y de los banners. No modifica la exclusividad comercial de P05 para entrega a domicilio.

**Propuesta de análisis:** mantener la compatibilidad de modalidad sin esa leyenda. Si el cliente no ha indicado recepción al agregar P05, solicitar «¿Cómo recibirás tu pedido?». Con recojo seleccionado, impedir el agregado y explicar «Esta promoción no está disponible para la modalidad elegida». Ofrecer volver a la carta o elegir otra modalidad, sin cambiarla automáticamente.

Si ya existe P05 en el carrito y el cliente intenta pasar a recojo, pedir que conserve la modalidad o retire esa promoción. Los demás artículos permanecen. Esta solución atiende el cambio de texto sin presentar una oferta incompatible como válida.

## 7. Requerimientos funcionales

Todos los requerimientos siguientes pertenecen al alcance de análisis del MVP. Los que dependen de datos operativos se habilitan únicamente con información validada.

| ID | Requerimiento |
| --- | --- |
| RF-01 | Consultar la carta y acceder a cada familia de productos sin registro obligatorio. |
| RF-02 | Mostrar nombre, precio, porción e inclusiones disponibles sin inventar contenido. |
| RF-03 | Presentar promociones activas como productos comprables con comparaciones de precio válidas. |
| RF-04 | Respetar disponibilidad, vigencia y compatibilidad de modalidad. |
| RF-05 | Agregar directamente un producto sin elecciones obligatorias; solicitar solo opciones confirmadas cuando existan. |
| RF-06 | Modificar cantidades, retirar productos y editar sus opciones e indicaciones. |
| RF-07 | Calcular importes por línea y subtotal a partir de los artículos y sus opciones con precio confirmado. |
| RF-08 | Recoger datos mínimos según recepción y mostrar cargos conocidos o pendientes con claridad. |
| RF-09 | Preparar un mensaje legible y abrir el WhatsApp oficial sin afirmar envío o aceptación automática. |
| RF-10 | Conservar el borrador del pedido al cerrar una vista, retroceder o regresar de WhatsApp. |
| RF-11 | Ofrecer copia del mensaje y reapertura de WhatsApp como alternativas de recuperación. |
| RF-12 | Permitir el acceso opcional a la tarjeta mediante verificación de teléfono. |
| RF-13 | Mostrar al cliente sus sellos, premios disponibles e indicaciones habituales. |
| RF-14 | Permitir revisar y modificar las indicaciones habituales sin alterar automáticamente pedidos anteriores. |
| RF-15 | Restringir al personal autorizado la acreditación de visitas y el canje de premios. |
| RF-16 | Registrar movimientos de fidelización y evitar duplicados por repetición de la misma operación. |
| RF-17 | Permitir revisión y corrección justificada de errores por el responsable autorizado. |
| RF-18 | Resolver estados vacíos, cierre, agotamiento, cobertura y fallos sin perder el pedido ni bloquear una compra por un fallo de fidelización. |

## 8. Requerimientos de UX, accesibilidad y calidad

### 8.1. Principios

La experiencia debe optimizar apetito, claridad y rapidez. La interfaz mostrará el producto y su precio antes de pedir datos personales. Las elecciones se presentan progresivamente y la tarjeta de sellos permanece como una opción secundaria durante la compra.

### 8.2. Reglas de diseño y comportamiento

- Diseñar primero para celular y adaptar después a pantallas mayores.
- Mantener texto de lectura alrededor de 16 píxeles y controles principales con objetivo de área táctil de 48 × 48 píxeles.
- Dar espacio suficiente entre aumentar, disminuir y eliminar para reducir toques accidentales.
- Identificar campos con etiquetas visibles; el ejemplo dentro del campo no sustituye su nombre.
- Mostrar errores junto al campo afectado y llevar la atención al primer error.
- Confirmar cada agregado con un aviso breve, sin abrir automáticamente el carrito.
- Mantener el contenido y la posición al volver a la carta.
- Reservar espacio para la barra inferior; no debe cubrir productos, errores ni botones.
- Permitir navegación por teclado, foco visible, lectura asistida, ampliación de texto y reducción de movimiento.
- No depender solo del color para explicar error, agotado, descuento o sello obtenido.
- Evitar desplazamiento horizontal de la página. El selector de categorías puede desplazarse de forma controlada y mostrar que hay más opciones.
- Mantener el pedido utilizable aunque falte una fotografía o la tarjeta esté temporalmente indisponible.

El objetivo de área táctil anterior es una decisión de diseño del proyecto. No se presenta como el tamaño mínimo exacto de WCAG, cuya regla incluye tamaños y excepciones específicas. Véase [W3C: tamaño mínimo del objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Los textos normales deben alcanzar contraste de al menos 4.5:1 y los textos grandes de 3:1, de acuerdo con [W3C: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

### 8.3. Calidad percibida

Los precios y los espacios para fotos no deben desplazarse mientras el cliente intenta tocar un botón. La interfaz debe indicar las esperas de verificación y registro de sellos. Un movimiento de fidelización no se muestra como acreditado hasta conocer el resultado real.

### 8.4. Dirección visual conceptual

| Elemento | Dirección propuesta |
| --- | --- |
| Jerarquía | Comida, nombre, porción, precio y acción dominan la compra. Logotipo, etiquetas y contenidos institucionales tienen un peso menor. |
| Fondo principal | Crema o blanco cálido, con texto oscuro y espacio suficiente entre productos. |
| Zonas de marca | Carbón en encabezados o cierres seleccionados, sin convertir toda la experiencia de compra en una superficie oscura. |
| Acentos | Naranja fuego para acciones destacadas cuando permita contraste; rojo oscuro para énfasis comercial; dorado para detalles de marca. El dorado claro no se usa como texto de lectura sobre crema. |
| Fotografía | Platos reconocibles, luz cálida controlada, presentación consistente y porciones reales. Los acompañamientos de la foto deben corresponder a lo incluido. |
| Tipografía | Una familia legible de formas sencillas para nombres, precios, botones y formularios. Una tipografía de mayor carácter puede reservarse para títulos breves de marca; las letras manuscritas de los anuncios no se trasladan a las instrucciones de compra. |
| Botones | Acción principal sólida y con texto explícito; acciones secundarias con menor peso visual. Editar y eliminar no compiten con continuar. El estado deshabilitado se explica cuando hay una condición que resolver. |
| Tarjetas | Superficie clara, agrupación limpia, bordes discretos y esquinas moderadas. Las inclusiones se leen sin abrir otro anuncio ni ampliar la imagen. |
| Carrito | Las cantidades e importes predominan sobre las fotografías. Los controles de edición se mantienen en posiciones consistentes. |
| Tarjeta de sellos | Diez posiciones visuales acompañadas por el progreso escrito. El premio disponible se distingue mediante texto y un estado visible, no solo por un cambio de color. |
| Equilibrio rústico y moderno | El carácter de brasas vive en la marca, las fotos y los acentos. Las texturas de madera, humo y llamas se limitan a elementos decorativos secundarios. |
| Movimiento e iconos | Feedback breve para agregado o sello confirmado, sin animaciones que retrasen acciones. Iconos consistentes acompañados por nombres; los emojis no sustituyen los controles esenciales. |

No se definen códigos HEX, fuentes comerciales concretas ni archivos finales de diseño. La elección visual debe verificarse con fotos y logotipo oficiales, y con los criterios de lectura y contraste anteriores.

## 9. Arquitectura de información y sitemap funcional

### 9.1. Categorías propuestas

El orden de navegación inicial será:

1. Promociones.
2. Pollo a la brasa.
3. Mostritos.
4. Alitas.
5. Platos criollos.
6. Chicharrón de pollo.
7. Clásicos.

El orden prioriza la preferencia comercial confirmada y mantiene el resto de la carta accesible. No se crean categorías vacías de bebidas, acompañamientos, carnes o boxes.

Las agrupaciones «Para mí», «Para dos» y «Para compartir» se posponen como filtros. Con cinco promociones, otra capa de navegación aporta poco y puede sugerir rendimientos no confirmados. Las fracciones de pollo y las unidades serán información concreta; los rendimientos por persona solo se publicarán cuando el negocio los defina.

### 9.2. Sitemap

~~~text
Zona pública
├── Inicio / carta comprable
│   ├── Categorías
│   ├── Promociones
│   └── Detalle y opciones de producto, cuando hagan falta
├── Mi pedido
├── Datos y revisión del pedido
├── Continuación en WhatsApp / recuperación del mensaje
├── Mi tarjeta
│   ├── Acceso por teléfono verificado
│   ├── Sellos y premios
│   └── Indicaciones habituales
└── Información del local y condiciones aplicables

Zona de atención
├── Acceso autorizado del personal
├── Buscar cliente
├── Consultar tarjeta e indicaciones
├── Acreditar visita
└── Registrar canje

Responsable autorizado
└── Revisar incidencias y corregir movimientos justificados
~~~

Se trata de vistas y responsabilidades de producto, no de rutas técnicas. El detalle de producto puede ser una vista breve superpuesta; el carrito y los datos del pedido serán etapas principales con navegación clara.

## 10. User journeys y flujos de pedido

### 10.1. Journey principal

| Momento | Acción del cliente | Información necesaria | Fricción que se evita |
| --- | --- | --- | --- |
| Descubrir | Abrir el enlace. | Marca, comida y precio. | Pantalla institucional o registro antes de la carta. |
| Elegir | Recorrer promociones o categorías. | Porción e inclusiones. | Comparar anuncios con datos incompletos. |
| Agregar | Seleccionar producto y opciones necesarias. | Precio de la selección. | Personalización innecesaria. |
| Revisar | Ajustar el carrito. | Cantidades, opciones e importes. | Tener que comenzar de nuevo para corregir. |
| Completar | Indicar recepción y datos mínimos. | Campos relevantes y cargos pendientes. | Dirección para recojo o teléfono redundante. |
| Continuar | Abrir WhatsApp y enviar. | Mensaje estructurado y aviso de confirmación del local. | Confundir una apertura con una venta realizada. |
| Recurrir | Activar la tarjeta y acudir al local. | Reglas y progreso de sellos. | Obligar a participar para comprar. |

### 10.2. Flujo de compra

~~~mermaid
flowchart TD
    A["Abrir carta"] --> B["Elegir producto"]
    B --> C{"¿Necesita opciones confirmadas?"}
    C -- Sí --> D["Elegir opciones necesarias"]
    C -- No --> E["Agregar al pedido"]
    D --> E
    E --> F{"¿Seguir comprando?"}
    F -- Sí --> B
    F -- No --> G["Revisar carrito"]
    G --> H["Completar recepción y datos"]
    H --> I["Revisar productos e importes"]
    I --> J["Abrir WhatsApp con el mensaje"]
    J --> K["El cliente revisa y envía"]
    K --> L["El local confirma y coordina"]
~~~

La selección de modalidad puede hacerse antes y se solicita anticipadamente al intentar comprar un producto restringido. El diagrama resume el camino válido; los errores y restricciones se desarrollan en la sección 21.

### 10.3. Flujo de entrega a domicilio

1. El cliente selecciona «Entrega a domicilio» sin necesidad de una pantalla inicial obligatoria.
2. Se conservan los productos compatibles y se explican las incompatibilidades.
3. Se informa el costo conocido o que será confirmado por WhatsApp, antes de continuar.
4. El cliente añade nombre, dirección, referencia opcional y medio de pago habilitado.
5. Si existe una cobertura validada, se comprueba; una dirección libre no demuestra cobertura.
6. El mensaje distingue productos, dirección, cargo confirmado o pendiente y total conocido o pendiente.
7. El local verifica cobertura, costo, disponibilidad y tiempo; el cliente confirma las condiciones finales.

No se incorporan GPS, mapas para seleccionar direcciones ni tiempos inventados.

### 10.4. Flujo de recojo

1. El cliente selecciona «Recojo en local».
2. Se revisa la compatibilidad del carrito, especialmente P05.
3. Se muestran dirección y horarios únicamente cuando estén confirmados.
4. Se solicita nombre y medio de pago habilitado; no se exige dirección del cliente.
5. Se abre WhatsApp con el pedido identificado como recojo.
6. El local comunica aceptación y momento de retiro. No se promete preparación inmediata.

No se habilita selección de horarios futuros en esta versión.

### 10.5. Flujo del carrito

Agregar → aviso breve → actualizar barra inferior → revisar cuando el cliente lo decida → modificar o seguir comprando → pasar a datos del pedido.

Cerrar el detalle de producto, volver a la carta o acceder a la tarjeta no debe vaciar el carrito. Un cambio de modalidad, precio o disponibilidad requiere una decisión explícita sobre los artículos afectados.

## 11. Home óptima y navegación de la carta

### 11.1. Orden propuesto

| Orden | Bloque | Función |
| --- | --- | --- |
| 1 | Encabezado compacto | Identificar la marca y ofrecer acceso secundario a «Mi tarjeta». |
| 2 | Producto o promoción principal comprable | Mostrar comida, precio e «Agregar» desde el primer tramo de la pantalla. |
| 3 | Selector de categorías | Permitir ir directamente a una familia. |
| 4 | Promociones activas | Mostrar las cinco ofertas con contenido comparable. |
| 5 | Carta por categorías | Mantener el catálogo completo accesible. |
| 6 | Invitación breve a la tarjeta | Explicar el beneficio sin interrumpir la compra. |
| 7 | Ubicación, horarios, contacto y condiciones | Resolver información operativa con datos confirmados. |

La promoción principal propuesta es P01, Mostrito de S/14.90, por su precio visible y la preferencia comercial confirmada. Si se desactiva o agota, se muestra otra oferta activa definida por el responsable; si no hay promociones, se pasa directamente a la carta.

### 11.2. Decisiones para reducir el primer agregado

- El bloque principal será una tarjeta comprable compacta, sin carrusel automático ni banner que ocupe toda la pantalla.
- Se empleará «Agregar» directamente; no se obligará a pasar primero por «Pedir ahora» y después por «Ver carta».
- El producto destacado mantiene la misma selección del catálogo. Su repetición como destacado no crea otro producto ni otro precio.
- No se añade una sección extensa adicional de «Los más pedidos» que repita el mismo contenido. La preferencia comercial puede señalarse en los productos pertinentes.
- La elección de recepción será accesible, pero no bloqueará la consulta inicial de comida.
- La barra inferior de pedido aparece tras el primer agregado.

Las etiquetas de popularidad reflejan la información del propietario, no un ranking numérico de ventas. No se asigna «Más pedido» a todos los tamaños de una familia sin datos que lo respalden.

## 12. Tarjetas, personalización y venta adicional

### 12.1. Tarjeta de producto

El orden de lectura será fotografía, nombre y porción, inclusiones breves, precio vigente, comparación válida cuando exista y botón «Agregar». La tarjeta puede tener una etiqueta comercial breve, pero no varios distintivos compitiendo.

Una fotografía ausente se sustituye por una presentación neutral con el nombre. No se usa una foto de una porción distinta para llenar el espacio. Los carteles publicitarios originales sirven de referencia, pero no sustituyen el contenido legible de la tarjeta.

Para P05, el precio anterior de S/110.00 y «Ahorras S/20.10» aportan una comparación directa. El ahorro monetario será el mensaje principal; no se añade un porcentaje si únicamente repite información. No se inventan precios anteriores para P01 a P04.

### 12.2. Personalización

| Decisión | Tratamiento del MVP |
| --- | --- |
| Fracción de pollo | Elegir la porción como producto o variante con precio publicado; no asumir precios intermedios. |
| Sabor de alitas | Elegir entre los cinco sabores publicados para la porción de cuatro unidades. La ronda necesita confirmar sabores y combinaciones admitidas. |
| Pecho o pierna | Ofrecer solo si el negocio confirma qué productos lo permiten y si puede garantizar la elección. |
| Marca de gaseosa | Ofrecer solo cuando exista una elección confirmada dentro del combo. |
| Cambio de acompañamiento | Mantener lo incluido. Los intercambios requieren confirmar viabilidad y precio. |
| Cremas | Mostrar las incluidas cuando estén confirmadas; no introducir un selector de salsas por defecto. |
| Observaciones por producto | Campo opcional para peticiones concretas; no convierte cualquier cambio escrito en una opción garantizada. |

Una opción obligatoria debe estar justificada por la operación. Si un producto se vende tal como está publicado, el primer toque lo agrega. Si una elección cambia el precio, se muestra el importe resultante antes de agregar.

### 12.3. Venta adicional

**Decisión de análisis para el lanzamiento:** no incluir una ventana de venta adicional ni un bloque de extras con precios inexistentes. El carrito mantiene «Seguir comprando» como acción secundaria.

Cuando el negocio confirme bebidas o complementos independientes, podrá incorporarse una sección breve de hasta tres sugerencias compatibles en el carrito. Cada sugerencia tendrá precio y agregado explícito; no se añadirá nada automáticamente ni se recomendará como extra lo que ya incluye el combo.

## 13. Carrito e importes

### 13.1. Contenido

Cada línea mostrará nombre, porción, opciones, indicaciones relevantes, cantidad, precio unitario e importe de esa línea. El cliente podrá editar, aumentar, disminuir o eliminar.

Dos selecciones del mismo producto con las mismas opciones e indicaciones se agrupan por cantidad. Si cambian las opciones o las indicaciones, permanecen en líneas distintas. Una disminución por debajo de una unidad se resuelve mediante eliminación explícita, evitando borrar accidentalmente un artículo.

### 13.2. Barra inferior

Se propone «Ver pedido · 3 unidades · S/XX.XX». El número representa la suma de cantidades, no el número de líneas distintas. El importe corresponde al subtotal de productos mientras falten cargos.

La barra aparece únicamente con un carrito no vacío, reserva espacio para el contenido y da paso a «Mi pedido». En datos y revisión se sustituye por la acción principal de esa etapa para evitar dos controles fijos que compitan.

### 13.3. Cálculos y presentación

- Importe de una línea: cantidad multiplicada por el precio de la selección.
- Subtotal de productos: suma de importes de todas las líneas.
- Total final: subtotal más cargos operativos conocidos y confirmados.
- Formato monetario: soles, símbolo S/ y dos decimales.
- Un cargo pendiente no se interpreta como cero.
- No se inventan descuentos, cargos de envase ni pedidos mínimos.

Como comprobaciones de referencia: P01 más P02 suman S/59.80; P01 más dos porciones de alitas de S/15.00 suman S/44.90.

### 13.4. Cambios y conservación

El borrador debe mantenerse al navegar por las vistas del pedido y al regresar de WhatsApp, incluso si la página vuelve a cargarse en el mismo navegador. Su conservación no constituye una venta registrada ni un historial comercial.

Los datos de dirección se usan para ese pedido. La decisión de guardarlos entre compras no forma parte del alcance. Se ofrece una acción explícita para vaciar el pedido.

## 14. Checkout mínimo

La experiencia tendrá una vista de datos y revisión con resumen compacto; no varias pantallas para cada campo. La modalidad elegida antes se reutiliza y puede cambiarse con revisión de compatibilidad.

| Campo | Regla propuesta | Motivo |
| --- | --- | --- |
| Nombre | Obligatorio; nombre de quien hace el pedido, sin exigir apellidos completos. | Identificarlo durante la atención. |
| Recepción | Obligatoria: entrega a domicilio o recojo. | Definir datos y condiciones relevantes. |
| Dirección | Obligatoria únicamente para entrega. | Permitir coordinación de recepción. |
| Referencia | Opcional, únicamente para entrega. | Ayudar cuando sea útil. |
| Forma de pago | Elegir entre medios efectivamente habilitados por el negocio. | Dar información operativa. |
| Vuelto | Solo si se confirma efectivo; opcional y condicionado al importe conocido. | Evitar una pregunta innecesaria en todos los pedidos. |
| Observaciones generales | Opcionales. | Incorporar una petición del pedido completo. |
| Teléfono del cliente | No exigir en el flujo de invitado. | La conversación final se abre desde WhatsApp del cliente. |

Efectivo, Yape y Plin son candidatos del brief, no medios ya confirmados. No se publicarán números de pago, QR ni instrucciones de transferencia sin validación del negocio. Tampoco se afirmará «pagado» por elegir un método.

Si se habilita efectivo, la propuesta es mostrar «¿Necesitas vuelto?» y solicitar el monto solo cuando corresponda. Cuando el total aún esté pendiente, el vuelto también se coordina por WhatsApp; no se valida un importe contra un total desconocido.

No se pide correo, contraseña, documento de identidad ni creación de perfil para comprar. Los pedidos para un tercero con otro teléfono requieren una decisión operativa futura; no se añade ese campo obligatoriamente a todos los clientes.

Si el cliente está identificado en su tarjeta, se pueden recuperar nombre e indicaciones habituales. Las indicaciones se muestran para revisión antes de aplicarlas. Editarlas en un pedido no cambia el perfil sin una acción explícita de guardar.

## 15. Cobertura, costo de entrega y recojo

### 15.1. Comparación de alternativas

| Alternativa | Ventajas | Limitaciones | Aplicación inicial |
| --- | --- | --- | --- |
| Seleccionar zona | Puede informar cobertura y tarifa temprano. | Necesita nombres de zonas, límites y precios mantenidos. | Buena opción cuando el negocio entregue una tabla validada; no asumir que ya existe. |
| Escribir dirección | Usa un dato que el pedido necesita. | El texto por sí solo no calcula distancia, cobertura ni costo. | Recoger dirección para coordinación; evitar prometer cálculo automático. |
| Tarifa fija | Fácil de entender y aplicar. | Solo funciona si es una regla real del negocio. | No adoptarla sin confirmación. |
| Confirmación por WhatsApp | Se adapta a una coordinación manual existente. | El usuario deja la web sin conocer el total definitivo. | Base provisional mientras falten tarifas, con aviso anticipado. |

### 15.2. Decisión operativa provisional

El MVP recogerá modalidad y dirección. Mientras no exista una tabla de tarifas confirmada, mostrará «El costo de entrega y el total final se confirman por WhatsApp» al elegir entrega y de nuevo junto a los importes.

Esta solución permite continuar el pedido, pero no cumple por completo el objetivo original de conocer el total real antes de salir. Esa limitación se conserva como hallazgo del análisis; no se disimula mostrando S/0.00.

No se añade un selector de zona con opciones ficticias. Cuando existan zonas verificadas, podrá habilitarse una selección simple, sin mapas ni cálculo de rutas.

### 15.3. Fuera de cobertura

Si una zona elegida pertenece a una cobertura validada y está excluida, se informa antes de abrir el pedido por WhatsApp y se ofrece cambiar zona o elegir recojo. Al cambiar a recojo se revisan los productos restringidos.

Sin información de cobertura, una dirección se considera pendiente de revisión del local; no se etiqueta como válida ni como fuera de cobertura por su texto.

### 15.4. Recojo y cargos adicionales

La web informará dirección exacta, referencia y horario de retiro cuando el negocio los confirme. El momento de preparación se acuerda por WhatsApp.

Si el negocio confirma que no existen cargos adicionales para recojo, el total coincide con el subtotal de productos. Hasta entonces, no se inventa un cargo ni se afirma que cualquier recepción tiene el mismo costo.

## 16. Mensaje y flujo de WhatsApp

### 16.1. Datos y orden del mensaje

El mensaje identificará al cliente y la recepción, listará cada producto con cantidad y opciones, mostrará los importes y finalizará con pago y observaciones. La información de dirección aparece solo para entrega. No se repiten campos vacíos ni se usan separadores o emojis en exceso.

Para cada línea se distinguirá el precio unitario del importe de la cantidad. Las indicaciones por producto se colocarán junto a ese producto; las generales irán al final. La tarjeta y su saldo no se incluyen en el pedido, porque no acreditan una compra.

### 16.2. Ejemplo conceptual

El siguiente formato utiliza un nombre y una dirección ficticios. Las selecciones de pago y las opciones reales solo aparecerán cuando hayan sido habilitadas por el negocio.

~~~text
NUEVO PEDIDO — FUEGO Y BRASAS

Cliente: Ana
Recepción: Entrega a domicilio
Dirección: Dirección proporcionada por la cliente
Referencia: Referencia indicada, si existe

PRODUCTOS
1 × Mostrito de ⅛ — S/14.90
1 × Pollo entero en promoción — S/44.90

Subtotal de productos: S/59.80
Costo de entrega: por confirmar
Total final: por confirmar con el local

Pago: medio habilitado elegido por la cliente
Observaciones: ají aparte

Solicito confirmar disponibilidad y condiciones finales.
~~~

El ejemplo no es una plantilla que deba enviar textos de relleno. En el mensaje real se sustituyen los datos presentes y se omiten referencia u observaciones cuando estén vacías.

### 16.3. Apertura, envío y confirmación

La función de conversación con texto preparado abre un chat y coloca el mensaje en el campo de escritura, tanto en teléfono como en WhatsApp Web, según la [ayuda oficial de WhatsApp](https://faq.whatsapp.com/5913398998672934). El usuario aún debe enviarlo.

El destino siempre será el número oficial 982 042 493. El pedido debe conservar acentos, fracciones, saltos de línea y precios al abrirse en WhatsApp. No se envía a un contacto elegido por azar ni al número impreso en cada anuncio.

Al volver a la web, se presenta «Revisa y envía el mensaje en WhatsApp. El local confirmará tu pedido». No se muestra «Pedido recibido» ni un estado de cocina que la web no puede conocer.

### 16.4. Recuperación

El cliente puede copiar el mensaje o volver a abrir WhatsApp. La web conserva el carrito y los campos completados. No se presume que detecta automáticamente si WhatsApp está instalado o si el mensaje se envió.

Si el cliente ya envió un pedido y quiere cambiarlo, debe indicar el cambio al local en la conversación. La edición de un borrador en la web no modifica una venta aceptada por WhatsApp.

## 17. Tarjeta virtual, sellos y preferencias

### 17.1. Participación e identidad

La tarjeta es una función opcional. El cliente accede con su teléfono y lo verifica antes de consultar información privada. El nombre preferido puede completar su identificación, pero el nombre por sí solo no permite distinguir tarjetas.

El medio de envío de la verificación, su disponibilidad y su costo son pendientes del diseño técnico. La elección de Supabase no demuestra por sí sola que esa verificación esté lista. El lanzamiento de la tarjeta requiere probarla con teléfonos reales.

El cliente puede ver su tarjeta e indicaciones, pero no acreditar visitas ni marcar un premio como canjeado. Si la verificación falla, el flujo de pedidos como invitado continúa disponible.

### 17.2. Reglas base

| Aspecto | Regla de la primera versión |
| --- | --- |
| Evento que genera un sello | Una visita presencial con compra pagada y validada por atención. |
| Cantidad | Un sello por visita, aunque incluya varios productos. |
| Compra por WhatsApp | Prepararla o enviarla no genera un sello. Si deriva en una visita presencial con compra, el personal valida esa visita. |
| Meta | Diez sellos. |
| Premio | Un Mostrito de ⅛ con chaufa, papas fritas y ensalada, tomando como referencia el contenido confirmado de P01. |
| Canje | En una visita posterior, sin exigir otra compra. |
| Visita solo para canje gratuito | No genera un sello porque no contiene una compra pagada. |
| Vencimiento inicial | Los sellos no vencen. |
| Costo | Se valida el costo del premio antes de publicar el programa. |

No se asignan varios sellos por cada plato de una misma visita. El personal debe conocer qué compra respalda el registro, sin que esto obligue a almacenar el detalle completo de productos vendidos.

### 17.3. Progreso y premios pendientes

**Propuesta de análisis:** cada grupo completo de diez sellos genera un premio pendiente y comienza el siguiente ciclo. El cliente puede seguir acumulando aunque todavía no canjee un premio anterior.

| Ejemplo de acumulación | Visualización |
| --- | --- |
| Tarjeta nueva | 0 de 10 sellos; sin premio pendiente. |
| Nueve visitas acreditadas | 9 de 10 sellos. |
| Décima visita acreditada | Un premio disponible y nuevo ciclo en 0 de 10. |
| Undécima visita, sin canjear | Un premio disponible y 1 de 10 sellos. |
| Veinte visitas, sin canjear | Dos premios disponibles y nuevo ciclo en 0 de 10. |

Al canjear se consume un premio pendiente; los sellos acumulados para el siguiente ciclo se conservan. El canje y una nueva compra pagada son operaciones distintas: una compra real en esa visita puede acreditarse, pero el canje solo no suma un sello.

No se crean niveles, recompensas alternativas, códigos promocionales transferibles ni descuentos parciales por sellos.

### 17.4. Operación de acreditación y canje

~~~mermaid
flowchart TD
    A["Cliente con tarjeta activa"] --> B["Visita al local"]
    B --> C{"¿Hay una compra pagada?"}
    C -- Sí --> D["Personal identifica al cliente"]
    D --> E["Revisa y acredita la visita"]
    E --> F{"¿Se completaron diez sellos?"}
    F -- Sí --> G["Premio disponible y nuevo ciclo"]
    F -- No --> H["Actualizar progreso"]
    C -- No --> I["Consultar premio disponible"]
    I --> J["Personal verifica y registra el canje"]
    G --> K["Canje en una visita posterior"]
    K --> J
~~~

La rama de canje solo se completa si hay un premio disponible y el negocio puede entregar el producto. El acceso del personal es obligatorio para ambas operaciones.

Si el Mostrito está agotado, el premio permanece pendiente. No se consume sin entrega ni se reemplaza por otro producto sin acuerdo con el cliente.

### 17.5. Errores y cambios del programa

El registro debe distinguir movimientos acreditados, canjeados y corregidos. Una repetición accidental no se convierte en otra visita. La corrección exige motivo y autorización del responsable; el movimiento original permanece trazable.

Si un sello erróneo generó un premio todavía no usado, la corrección ajusta también ese premio. Si ya fue canjeado, se presenta como incidencia para revisión del responsable y no se borra la entrega física del historial.

Un cambio futuro de meta o recompensa necesita condiciones explícitas. Como propuesta, no debe eliminar premios ya obtenidos ni alterar silenciosamente el progreso anterior.

### 17.6. Indicaciones habituales

Se guardará un texto breve con las peticiones frecuentes declaradas por el cliente, por ejemplo «ají aparte» o «sin ensalada». No se inferirán preferencias de un historial de productos que el MVP no registra.

El cliente puede editar o borrar ese texto. Al preparar otro pedido, se ofrece revisarlo y añadirlo a las observaciones. Una petición habitual no se aplica de forma oculta a todos los platos ni garantiza que cocina pueda realizar un cambio no ofrecido.

El personal podrá consultar las indicaciones del cliente identificado. La edición habitual será del cliente; el responsable podrá corregir un dato por solicitud expresa, conservando la trazabilidad pertinente.

## 18. Operación interna y responsabilidades

### 18.1. Roles funcionales propuestos

| Rol | Puede hacer | Límite |
| --- | --- | --- |
| Visitante | Consultar carta y preparar pedido. | No accede a tarjetas ajenas ni modifica sellos. |
| Cliente identificado | Consultar su tarjeta, premios e indicaciones; editar sus indicaciones. | No valida compras ni canjes. |
| Personal autorizado | Buscar al cliente, consultar indicaciones, acreditar una visita y registrar un canje. | No convierte una apertura de WhatsApp en compra acreditada ni modifica las reglas del programa. |
| Responsable autorizado | Autorizar al personal, revisar incidencias, corregir movimientos y mantener las condiciones comerciales. | Las correcciones deben ser justificadas y quedar registradas. |

«Responsable» expresa una función necesaria, no un cargo o persona ya confirmado. Se evitan accesos compartidos que impidan saber quién acreditó o canjeó un premio.

### 18.2. Atención de un pedido de WhatsApp

1. Revisar productos, cantidades, modalidad e indicaciones.
2. Confirmar disponibilidad y compatibilidad de las condiciones.
3. Verificar dirección, cobertura y cargos si corresponde.
4. Comunicar total, forma de pago y tiempo estimado real.
5. Obtener conformidad del cliente antes de preparar o despachar cuando cambien condiciones.
6. Comunicar a cocina la selección confirmada y coordinar recepción.

La web no automatiza confirmación de cocina, pagos, despacho ni seguimiento. Los responsables y tiempos de respuesta de esa atención todavía deben establecerse.

### 18.3. Atención de la tarjeta

El cliente presenta su teléfono asociado a la tarjeta. El personal busca una coincidencia, comprueba el nombre o la tarjeta mostrada y revisa el último movimiento para evitar una repetición accidental. Confirma la compra y acredita un sello.

En un canje, revisa premios disponibles, comprueba disponibilidad del Mostrito y confirma la entrega. Se muestra el resultado real de la operación, no una animación que suponga éxito.

Una consulta por número no se ofrece como buscador público. Recuperar acceso o cambiar de teléfono requiere atención del responsable; no se fusionan saldos automáticamente por coincidencia de nombre.

### 18.4. Mantenimiento y contingencias

El responsable debe mantener precios, inclusiones, vigencias y agotados por el mecanismo sencillo que se defina. El personal necesita un canal interno para avisar de un agotamiento y evitar ofertas desactualizadas.

Si el servicio de tarjeta está indisponible, la compra continúa. Atención conserva una incidencia de la visita para revisión posterior y evita prometer un sello ya acreditado. Al recuperarse el servicio, el responsable revisa esas incidencias antes de registrarlas, sin duplicar movimientos.

La forma de conservar incidencias durante una caída pertenece al procedimiento operativo por cerrar; no se presenta un fallo de registro como éxito.

## 19. Información funcional y límites de uso

Esta sección describe información de producto y responsabilidades. No constituye un esquema de base de datos.

| Conjunto | Información mínima necesaria | Uso |
| --- | --- | --- |
| Producto | Nombre, familia, porción, precio, inclusiones confirmadas, fotografía si existe y disponibilidad. | Elegir y comprar correctamente. |
| Promoción | Contenido, precio vigente, precio anterior válido, condiciones, modalidades y vigencia cuando exista. | Aplicar una oferta compatible. |
| Borrador de pedido | Selecciones, cantidades, opciones, observaciones y datos de recepción. | Revisar y preparar el mensaje. |
| Cliente participante | Teléfono verificado, nombre preferido e indicaciones habituales. | Consultar su tarjeta y personalizar solicitudes. |
| Tarjeta | Progreso del ciclo y premios disponibles. | Comunicar acumulación y canje. |
| Movimiento | Cliente, acción, fecha, personal responsable, resultado y motivo de corrección cuando exista. | Evitar duplicados y revisar incidencias. |
| Compra que respalda una visita | Referencia de atención o comprobante cuando exista, sin detalle obligatorio de productos. | Justificar el sello. |
| Operación del negocio | Contacto oficial, horarios, dirección y reglas de recepción confirmadas. | Informar y coordinar la venta. |

El cliente debe comprender qué datos guarda su tarjeta y para qué. La participación no incorpora publicidad automática, listas de difusión ni perfiles de consumo detallados.

Las direcciones de pedidos no se añaden por defecto a la tarjeta. Los informes agregados del flujo no deben incluir teléfonos, direcciones o indicaciones personales como etiquetas.

Antes de publicar deben definirse las condiciones de participación, el tratamiento de datos y las vías para corregir o retirar indicaciones y resolver incidencias. Este análisis no fija plazos legales ni interpreta obligaciones normativas.

## 20. Wireframes textuales de las vistas

Las siguientes descripciones definen jerarquía, contenido y acciones. Son wireframes de producto; no especifican componentes, colores exactos ni rutas técnicas.

### W01. Inicio y carta comprable

**Objetivo:** encontrar comida y agregar el primer producto.

Orden: encabezado con marca y acceso secundario a «Mi tarjeta» → promoción destacada con foto, contenido, precio y «Agregar» → categorías → promociones → familias de la carta → invitación breve a sellos → información del local.

La recepción está accesible sin un diálogo obligatorio al entrar. Con pedido activo, la barra inferior muestra unidades e importe de productos. La vista mantiene posición al volver y contempla destacado agotado, promociones vacías, carga y fotografía ausente.

### W02. Detalle u opciones de producto

**Objetivo:** resolver una elección que el producto realmente necesita.

Orden: volver o cerrar → nombre y porción → inclusiones → opciones obligatorias confirmadas → opciones adicionales válidas → observación opcional → cantidad → precio de la selección → «Agregar al pedido».

Si se abre para editar, conserva elecciones y muestra «Guardar cambios». Cerrar sin confirmar mantiene el carrito anterior. Una elección no disponible se explica dentro de su grupo; el precio no cambia sin mostrarse.

### W03. Mi pedido

**Objetivo:** revisar y corregir.

Orden: «Seguir comprando» → líneas con porción, opciones e indicaciones → controles de cantidad, editar y eliminar → recepción seleccionada o pendiente → subtotal y cargos conocidos o pendientes → «Continuar».

Un carrito vacío muestra «Tu pedido está vacío» y «Ver carta». Los artículos agotados o incompatibles se marcan con una acción para resolverlos; no se eliminan automáticamente. La eliminación de todos los artículos vuelve al estado vacío.

### W04. Datos y revisión

**Objetivo:** completar lo imprescindible y preparar el mensaje.

Orden: volver al pedido → resumen compacto → nombre → entrega o recojo → dirección y referencia condicionales → pago habilitado → vuelto condicional → observaciones → importes y aviso de costo pendiente → «Enviar pedido por WhatsApp».

Si la tarjeta está activa, las indicaciones habituales aparecen con una acción para usarlas o editarlas. El formulario no muestra acceso a la tarjeta como condición para continuar. Los errores se presentan junto a los campos y se conserva lo escrito.

### W05. Continuación y regreso de WhatsApp

**Objetivo:** explicar el siguiente paso y permitir recuperación.

Orden: aviso «Revisa y envía el mensaje en WhatsApp» → recordatorio de confirmación del local → resumen o acceso al mensaje → «Abrir WhatsApp» → «Copiar pedido» → «Volver a mi pedido».

La vista no afirma recepción, pago ni preparación. Volver a la carta conserva el pedido. Copiar confirma éxito solo si la copia pudo realizarse; si falla, se ofrece seleccionar el mensaje visible.

### W06. Acceso a Mi tarjeta

**Objetivo:** identificar al participante sin obstaculizar la compra.

Orden: volver → explicación breve de los diez sellos y el premio → teléfono → acción de verificación → entrada del código o comprobación correspondiente → nombre preferido si hace falta → condiciones de participación → «Ver mi tarjeta».

Incluye espera, verificación inválida o vencida, reintento según el servicio y «Seguir comprando». No se pide contraseña al cliente. La verificación real y su canal deben quedar definidos antes de habilitar esta vista.

### W07. Mi tarjeta e indicaciones

**Objetivo:** entender progreso, premio y preferencias.

Orden: nombre → diez posiciones de sello con texto «X de 10» → premios pendientes → instrucciones de canje presencial → últimos movimientos relevantes → indicaciones habituales con editar o borrar → «Ver carta» y salida de la sesión.

El texto acompaña a los sellos visuales. Un ciclo en cero con un premio pendiente se diferencia de una tarjeta nueva. Editar indicaciones requiere «Guardar»; abandonar la edición conserva el dato anterior.

### W08. Acceso del personal

**Objetivo:** identificar a quien opera la tarjeta.

Orden: «Acceso del personal» → identificación → credencial o verificación de acceso → «Entrar» → recuperación por el responsable.

No tiene un registro público que conceda permisos de atención. Contempla credencial inválida, espera y acceso no autorizado. La forma concreta de autenticación se resolverá en el diseño técnico.

### W09. Buscar cliente

**Objetivo:** localizar una tarjeta durante la atención.

Orden: identificación del personal → campo de teléfono → «Buscar» → resultado con nombre y número → «Abrir tarjeta».

Sin coincidencia, mostrar «No encontramos una tarjeta con ese número» y permitir revisar el dato. No crear ni fusionar tarjetas automáticamente. No mostrar una lista pública de clientes como sustituto de la búsqueda.

### W10. Ficha del cliente para atención

**Objetivo:** consultar preferencias y elegir una operación.

Orden: nombre y teléfono → indicaciones habituales → progreso y premios → último movimiento → «Acreditar visita» → «Registrar canje» cuando exista premio → volver a buscar.

La ficha diferencia las solicitudes del cliente del contenido garantizado del producto. Los movimientos completos y correcciones quedan disponibles para el responsable cuando haya una incidencia, sin convertir la vista en un panel comercial extenso.

### W11. Confirmación de visita

**Objetivo:** acreditar una compra presencial real.

Orden: cliente identificado → estado actual → confirmación de visita con compra pagada → referencia de atención cuando exista → resultado previsto de un sello → «Confirmar visita» → resultado real.

Durante el registro, la misma operación no se repite. Tras éxito se muestra el progreso y, si corresponde, el nuevo premio. Si el resultado es incierto, se verifica el movimiento antes de reintentar.

### W12. Confirmación de canje

**Objetivo:** entregar un premio y descontarlo una sola vez.

Orden: cliente → premio disponible → Mostrito de ⅛ y acompañamientos → confirmación de disponibilidad y entrega → «Confirmar canje» → resultado real.

Sin premio o sin producto disponible no se confirma el canje. Si otro empleado ya lo registró, se actualiza el saldo y se explica el resultado, sin entregar otro premio por un estado desactualizado.

### W13. Información del local y condiciones

**Objetivo:** resolver ubicación, horarios y reglas.

Orden: dirección confirmada → referencia y mapa correcto → horarios y recepción → WhatsApp oficial → condiciones de ofertas y tarjeta → información de datos y canal para incidencias.

No se publican direcciones, horarios o enlaces deducidos de negocios de nombre parecido. Las condiciones reflejan las reglas reales; no reaparece la leyenda de P05 que el propietario pidió retirar.

## 21. Estados vacíos, errores y recuperación

| Situación | Respuesta del producto | Continuidad |
| --- | --- | --- |
| Carrito vacío | Explicar que todavía no hay productos. | Acción «Ver carta»; sin barra inferior ni envío de pedido vacío. |
| Categoría sin productos | No mostrar categorías vacías; si queda vacía durante la visita, informar. | Ofrecer otra categoría. |
| Ninguna promoción activa | Omitir el bloque de promociones y mostrar la carta. | Mantener la compra disponible. |
| Promoción vencida o desactivada | Retirar su posibilidad de compra; revisar si ya estaba en carrito. | Explicar el cambio y permitir elegir otra opción. |
| Producto agotado | Mostrar estado sin botón de agregado activo. | Mantener otras opciones visibles. |
| Agotado dentro del carrito | Conservar la línea marcada hasta que el cliente la resuelva. | Retirar o reemplazar mediante elección explícita. |
| Modalidad incompatible | Explicar incompatibilidad sin modificar la recepción. | Cambiar modalidad o retirar el artículo afectado. |
| Precio actualizado | Mostrar precio anterior del borrador y nuevo importe aplicable. | Pedir revisión antes de preparar el mensaje. |
| Opción ya no disponible | Señalar la elección afectada. | Elegir otra opción válida sin rehacer todo el pedido. |
| Zona fuera de cobertura validada | Informar antes de abrir el pedido. | Cambiar zona o elegir recojo, revisando restricciones. |
| Cobertura desconocida | Indicar revisión por el local. | Continuar como solicitud sujeta a confirmación. |
| Costo de entrega desconocido | Mostrar cargo y total final pendientes, nunca cero. | Coordinar por WhatsApp con aviso previo. |
| Local cerrado con horario confirmado | Mostrar horario real y conservar la carta y el borrador. | Propuesta: bloquear el envío de pedido inmediato hasta apertura; no crear una reserva. |
| Horarios todavía no configurados | No afirmar «Abierto» o «Cerrado». | Mostrar que la atención se confirma por WhatsApp. |
| Nombre o dirección necesaria vacíos | Error específico junto al campo. | Mantener selecciones y datos válidos. |
| Sin medios de pago habilitados | Informar la falta de configuración. | Resolver antes de publicar el checkout; no ofrecer métodos inventados. |
| Foto ausente o con error | Presentación neutral legible. | El producto sigue siendo comprable si sus datos están completos. |
| WhatsApp no se abre | Ofrecer reapertura, copia y mensaje visible. | Conservar el pedido; no declarar un envío fallido que no pudo comprobarse. |
| Regreso tras no enviar | Mostrar borrador y siguiente paso. | Seguir editando o abrir WhatsApp otra vez. |
| Conexión interrumpida | Explicar qué operación no pudo confirmarse. | Mantener el borrador y permitir reintento. |
| Código de verificación inválido o vencido | Mensaje junto a la verificación. | Reintentar de acuerdo con el servicio o seguir como invitado. |
| Tarjeta nueva | Mostrar 0 de 10 y reglas. | Explicar cómo acreditar la primera compra presencial. |
| Sin premios disponibles | Mostrar progreso y distancia a la meta. | No habilitar canje. |
| Premio disponible | Mostrar qué se ganó y cómo canjearlo. | Registrar consumo únicamente por atención autorizada. |
| Mostrito de premio agotado | Mantener el premio disponible. | Canjear en otra visita o coordinar una solución aceptada. |
| Cliente no encontrado por atención | Permitir revisar el número. | Acceso o activación de su tarjeta; no asignar sellos a otra persona. |
| Registro o canje con resultado incierto | Revisar movimientos antes de repetir. | Evitar doble acreditación o doble consumo. |
| Servicio de fidelización indisponible | Avisar que no se pudo actualizar la tarjeta. | La compra continúa; registrar incidencia según procedimiento. |

La hora de operación debe corresponder a Parcona y a los horarios del negocio, no a una suposición tomada del reloj del visitante. No se inventan horas de cierre ni plazos de preparación.

Las solicitudes de cambios o sustituciones realizadas después de enviar el mensaje se atienden por WhatsApp. La web no modifica automáticamente un pedido ya aceptado por el local.

## 22. Criterios de aceptación y plan de validación

### 22.1. Casos funcionales verificables

| ID | Escenario y resultado esperado |
| --- | --- |
| CA-01 | Un visitante puede consultar, agregar y preparar un pedido sin crear una cuenta ni activar la tarjeta. |
| CA-02 | La carta de referencia conserva las 24 entradas y las cinco promociones; C01 no se ofrece para entrega o recojo. |
| CA-03 | La porción regular de alitas indica cuatro unidades y la ronda promocional dieciséis. |
| CA-04 | Un producto sin opciones obligatorias se agrega en una acción; el aviso no obliga a abrir otra pantalla. |
| CA-05 | Un producto con opciones necesarias no se agrega incompleto; el cliente ve el precio de su selección. |
| CA-06 | Dos selecciones iguales se agrupan; indicaciones u opciones distintas producen líneas separadas. |
| CA-07 | Aumentar, disminuir, eliminar y editar actualiza las líneas y los importes sin perder los demás artículos. |
| CA-08 | La barra inferior aparece con artículos, cuenta unidades y desaparece al vaciarse el pedido. |
| CA-09 | P01 más P02 producen subtotal S/59.80; P01 más dos porciones de alitas de S/15.00 producen S/44.90. |
| CA-10 | P05 puede mostrar S/110.00 como precio anterior y S/20.10 de ahorro. No se fabrican comparaciones para otras ofertas. |
| CA-11 | P05 no muestra la leyenda retirada; al intentar comprarla con recojo, se explica y bloquea la incompatibilidad. |
| CA-12 | Cambiar a recojo con P05 en carrito requiere resolver ese artículo y conserva los demás. |
| CA-13 | Entrega exige dirección; recojo no la exige ni incluye una dirección del cliente en el mensaje. |
| CA-14 | Los campos opcionales vacíos se omiten del mensaje y no bloquean la continuación. |
| CA-15 | Un cargo desconocido y el total final se muestran pendientes; no aparecen como S/0.00 ni como subtotal definitivo. |
| CA-16 | Con una tarifa de prueba conocida, se calcula subtotal más cargo correctamente. Esa tarifa sintética no se publica como dato del negocio. |
| CA-17 | Una zona excluida por cobertura validada bloquea el pedido de entrega y permite cambiar la recepción sin borrar el carrito. |
| CA-18 | Una promoción desactivada o un precio cambiado durante la sesión exige revisar el pedido antes de continuar. |
| CA-19 | Con horario de prueba confirmado y estado cerrado, se puede consultar y conservar el borrador, sin enviar un pedido inmediato. |
| CA-20 | El mensaje abre el chat de 982 042 493 y conserva acentos, porciones, saltos, cantidades e importes. |
| CA-21 | Al regresar de WhatsApp, el borrador permanece y la web no afirma que el local recibió o confirmó el pedido. |
| CA-22 | Si no se abre WhatsApp, se puede recuperar el mensaje y editar el pedido; la alternativa de copia tiene feedback real. |
| CA-23 | Un fallo de verificación o de tarjeta no bloquea una compra como invitado. |
| CA-24 | Un cliente identificado solo consulta su tarjeta e indicaciones; no puede leer tarjetas ajenas ni acreditar sellos. |
| CA-25 | Editar una indicación del pedido no cambia la habitual sin guardar; una habitual se revisa antes de usarla en otro pedido. |
| CA-26 | Solo personal autorizado acredita una visita con compra pagada o registra un canje. |
| CA-27 | La visita número diez produce un premio y ciclo 0 de 10; la siguiente produce 1 de 10 sin eliminar el premio pendiente. |
| CA-28 | La repetición de la misma acreditación por doble toque o reintento genera un único sello y un único premio, si corresponde. |
| CA-29 | Dos visitas reales diferentes se acumulan correctamente aunque se registren al mismo tiempo. No se pierden sellos por concurrencia. |
| CA-30 | Dos empleados intentan canjear el mismo último premio: solo un canje se confirma y ambos ven el saldo actualizado. |
| CA-31 | Un canje gratuito sin nueva compra pagada no acredita otro sello. |
| CA-32 | Un premio agotado no se consume; tras canjear uno disponible se conserva el progreso del siguiente ciclo. |
| CA-33 | Una corrección autorizada conserva motivo y responsable; un premio ya entregado se trata como incidencia, sin borrar el hecho del canje. |
| CA-34 | Textos y controles funcionan con teclado, foco visible y lectura asistida; los estados no dependen únicamente del color. |
| CA-35 | La barra inferior no tapa botones ni errores en pantallas móviles; las fotos ausentes no impiden comprar. |
| CA-36 | No se publican horarios, ubicación, medios de pago, precios por modalidad ni opciones todavía no confirmados. |

### 22.2. Validación de experiencia

Realizar pruebas con personas del contexto de uso: una compra individual, una compra para compartir, una corrección de carrito y una consulta de tarjeta. Evaluar también al personal en búsqueda, acreditación y canje.

Como objetivos provisionales de prueba, se propone un primer agregado en treinta segundos y un pedido sencillo preparado en dos minutos, cuando no requiera acceso a la tarjeta. Son metas iniciales para evaluar el diseño, no resultados medidos ni promesas comerciales. Deben revisarse después de las primeras observaciones.

Probar móvil y escritorio, Android e iOS cuando estén disponibles, navegación desde enlaces compartidos y navegadores integrados en redes sociales. Validar ampliación de texto, teclado, conectividad lenta, retorno desde WhatsApp y recuperación tras una recarga.

### 22.3. Datos y consistencia comercial

Antes de publicar se revisará el catálogo contra las fuentes, los precios por modalidad, las inclusiones, la compatibilidad de ofertas y los medios de pago. Las tarifas, zonas, fechas y horarios sintéticos se usarán solo en pruebas y no se confundirán con condiciones reales.

Esta sección es un plan de validación. No afirma que estas pruebas se hayan ejecutado ni que exista una implementación funcional.

## 23. Métricas y aprendizaje

| Indicador | Qué permite aprender | Límite |
| --- | --- | --- |
| Tiempo hasta primer agregado | Si la comida se encuentra rápidamente. | Comparar tareas y contexto; no solo promedios globales. |
| Tiempo hasta abrir WhatsApp con mensaje | Si el flujo completo es breve. | La apertura no demuestra envío ni venta. |
| Continuidad entre carta, carrito y datos | Dónde se interrumpe la preparación. | Una salida puede ser deliberada o causada por WhatsApp. |
| Errores de formulario y correcciones | Qué datos u opciones generan fricción. | Analizar de forma agregada sin registrar contenido personal innecesario. |
| Visitas presenciales acreditadas | Recurrencia entre participantes. | No representa todas las ventas del negocio. |
| Premios generados y canjeados | Uso real del programa. | Necesita movimientos validados por atención. |
| Costo de premios entregados | Sostenibilidad de la recompensa. | Requiere conocer el costo real del Mostrito. |

La confirmación y el resultado comercial de una conversación deberán revisarse desde la operación del local. Sin una integración explícita, la web no conoce por sí sola las ventas aceptadas en WhatsApp.

No se incluye un dashboard analítico complejo. La definición técnica de la medición, su alcance y la forma de revisión se decidirán después del análisis.

## 24. Preparación del lanzamiento y roadmap

### 24.1. Secuencia de preparación

| Etapa | Resultado necesario |
| --- | --- |
| Validación comercial | Carta final, precios por recepción, inclusiones, personalizaciones, restricciones y disponibilidad. |
| Validación operativa | Dirección, horarios, atención por WhatsApp, pagos y reglas de cargos y cobertura. |
| Validación del programa | Costo del premio, condiciones comunicables, personal autorizado y procedimiento ante errores. |
| Diseño de experiencia | Prototipo móvil de carta, carrito, datos, tarjeta y atención con los estados definidos. |
| Diseño técnico posterior | Solución real para pedidos, conservación del borrador, verificación de teléfono y control de movimientos. |
| Prueba controlada | Pedidos de prueba, retorno desde WhatsApp, visitas, décimo sello, canjes y contingencias con el personal. |
| Lanzamiento | Información real publicada, funcionamiento verificado y responsable de mantenimiento definido. |

La primera versión incluye compra y tarjeta. El lanzamiento de la tarjeta requiere verificación de teléfono y validación de sellos operativas; no se sustituye esa comprobación por una demostración visual.

Durante el periodo inicial se revisan errores de pedido, demora de respuesta, cambios de oferta y registros de fidelización. El responsable debe poder desactivar una oferta inválida y suspender operaciones de tarjeta ante una incidencia sin inutilizar la consulta de comida.

### 24.2. Versión 2, ordenada por valor

| Prioridad | Ampliación | Condición para incorporarla |
| --- | --- | --- |
| 1 | Zonas y tarifas de entrega previamente conocidas. | El negocio entrega reglas mantenibles y la coordinación manual causa fricción. |
| 2 | Bebidas y acompañamientos independientes; venta adicional breve. | Existen productos, precios y disponibilidad confirmados. |
| 3 | Mejoras de tarjeta basadas en canjes y costo real. | Hay uso suficiente para evaluar la recompensa actual. |
| 4 | Historial detallado de compras e identificación de productos habituales. | Se define cómo registrar ventas reales; los mensajes preparados no sirven como prueba. |
| 5 | Mantenimiento comercial más cómodo. | El mecanismo inicial genera trabajo repetitivo comprobado. |
| 6 | Búsqueda y filtros por ocasión o cantidad de personas. | Crece la carta y se confirman rendimientos e inclusiones. |

Las funciones inicialmente excluidas no pasan automáticamente a la versión 2. Se incorporarán solo si existe una necesidad observada y una decisión específica.

## 25. Pendientes y registro de decisiones

### 25.1. Datos y validaciones pendientes

Estos elementos no se convierten en nuevas preguntas en este documento. Son entradas necesarias para cerrar configuración comercial, operación y diseño.

| ID | Pendiente | Efecto sobre publicación o comportamiento |
| --- | --- | --- |
| PD-01 | Dirección exacta, referencia y enlace correcto de Maps. | La información de recojo no puede publicarse como definitiva. |
| PD-02 | Horarios, días de atención y cierre de recepción por modalidad. | No habilitar un estado automático de abierto o cerrado sin reglas. |
| PD-03 | Cobertura, tarifas, pedido mínimo si existe y cargos adicionales. | Usar coordinación explícita por WhatsApp; no prometer total final anticipado. |
| PD-04 | Medios de pago realmente aceptados e instrucciones. | Publicar solo opciones confirmadas; validar el checkout antes del lanzamiento. |
| PD-05 | Aplicación de precios de carta a entrega y recojo, en particular C02. | No trasladar precios de mesa ni asumir igualdad entre modalidades. |
| PD-06 | Inclusiones completas y cantidades de acompañamientos. | No fabricar descripciones ni rendimientos por persona. |
| PD-07 | Opciones admitidas, recargos, disponibilidad de presa, bebidas y sabores de la ronda. | No ofrecer elecciones que cocina no haya confirmado. |
| PD-08 | Equivalencia entre productos regulares y promociones de nombre similar. | Validar deduplicación y comparaciones de precio. |
| PD-09 | Vigencias, días y límites de las promociones. | La confirmación actual no significa disponibilidad permanente. |
| PD-10 | Costo de preparar y entregar el Mostrito del premio. | Validar la meta de diez sellos antes de publicar el programa. |
| PD-11 | Canal real de verificación de teléfono y recuperación de acceso. | La tarjeta no se lanza con acceso simulado ni datos privados sin verificar. |
| PD-12 | Personal autorizado, responsable y procedimiento de incidencias. | Definir quién acredita, canjea, corrige y atiende durante una caída. |
| PD-13 | Versión oficial del logo, fotografías originales y redes oficiales. | Evitar materiales ambiguos y enlaces a cuentas incorrectas. |
| PD-14 | Responsables y tiempos de respuesta de WhatsApp; coordinación con cocina y recepción. | No prometer aceptación o preparación inmediata. |
| PD-15 | Condiciones de participación y tratamiento de la información guardada. | Explicar reglas, finalidad de datos e incidencias antes de activar el programa. |

### 25.2. Decisiones de producto que adopta el análisis

| Decisión | Base y estado |
| --- | --- |
| Comprar sin cuenta; tarjeta opcional en la primera versión. | Acuerdo confirmado. |
| Mantener WhatsApp como cierre y número único 982 042 493. | Acuerdo confirmado. |
| Guardar indicaciones frecuentes; posponer historial de productos. | Alcance acordado y simplificación aceptada. |
| Un sello por visita presencial con compra; personal valida. | Acuerdo confirmado. |
| Diez sellos por un Mostrito de ⅛; canje posterior sin compra adicional. | Regla inicial aceptada, sujeta a validación de costo. |
| Siete categorías con promociones primero y sin familias vacías. | Propuesta de análisis basada en la carta real. |
| Destacado comprable en lugar de hero extenso y bloques repetidos. | Propuesta de análisis para reducir el primer agregado. |
| Modalidad accesible sin bloquear la consulta; pedirla antes para P05. | Propuesta de análisis para resolver restricciones temprano. |
| Retirar la leyenda de P05 y conservar su compatibilidad comercial. | Cambio de texto confirmado; mecanismo de compatibilidad propuesto aquí. |
| Subtotal visible y cargos pendientes explícitos. | Propuesta provisional ante datos operativos faltantes. |
| Sin venta adicional de productos no definidos. | Decisión de análisis por ausencia de precios independientes. |
| Premios pendientes compatibles con seguir acumulando visitas. | Propuesta de análisis para evitar perder progreso o bloquear recurrencia. |
| Correcciones justificadas y movimientos trazables. | Propuesta de análisis para una operación fiable. |
| Con horario real confirmado, conservar borrador y bloquear pedido inmediato durante cierre. | Propuesta de análisis; sin pedidos programados en el MVP. |

### 25.3. Riesgos concretos y respuesta

| Riesgo | Respuesta prevista |
| --- | --- |
| Carta y promociones parecen el mismo producto con precios distintos. | Confirmar equivalencias e inclusiones antes de fusionar o comparar. |
| La condición de P05 queda oculta tras quitar su leyenda. | Validar modalidad y explicar la incompatibilidad antes de comprar. |
| El cliente interpreta el subtotal como total final. | Etiquetas precisas y aviso temprano de cargos pendientes. |
| Abrir WhatsApp se interpreta como venta o visita acreditada. | Separar preparación, envío, confirmación y compra presencial. |
| Se acreditan sellos o canjes duplicados. | Acceso autorizado, confirmación real y registro de la misma operación una sola vez. |
| El premio resulta costoso o poco usado. | Validar costo y observar generación y canje antes de ampliar el programa. |
| Se muestran preferencias o tarjetas ajenas. | Acceso verificado del cliente y consultas restringidas al personal. |
| Ofertas, agotados o horarios quedan desactualizados. | Responsable y mecanismo de mantenimiento identificados antes del lanzamiento. |

## 26. Fuentes y trazabilidad del alcance

### 26.1. Material del negocio

- Brief inicial «Estoy comenzando a desarrollar una página web para una pollería llamada FUEGO Y BRASAS».
- Cuatro capturas publicitarias proporcionadas: Screenshot_20261002-235523.png, Screenshot_20261002-235515.png, Screenshot_20261002-235513.png y Screenshot_20261002-235517.png.
- Dos imágenes de carta: codex-clipboard-58a5994b-bcb4-491f-850d-74c1e1db0846.png y codex-clipboard-3b9eda53-12f6-4c83-a47d-8de65fc14573.png.
- Respuestas del propietario sobre funcionamiento, oferta inicial, promociones, alitas, WhatsApp, datos del pedido, fidelización y preferencias.
- [Resumen ejecutivo del proyecto](resumen-ejecutivo.md), conservado como documento de visión.

Los datos públicos encontrados sobre otras marcas no sustituyen la confirmación de información operativa de Fuego y Brasas.

### 26.2. Referencias externas

Las observaciones y recomendaciones de UX se apoyan en las páginas oficiales enlazadas en la sección 4. La preparación del mensaje se contrasta con la ayuda oficial de WhatsApp en la sección 16. Los criterios de contraste y tamaño de controles se distinguen de las recomendaciones de diseño mediante las referencias W3C de la sección 8.

La guía local UI/UX Pro Max se utilizó como apoyo para interacción táctil, jerarquía, navegación, formularios y feedback. No constituye evidencia de conversión del negocio ni reemplaza pruebas con usuarios.

### 26.3. Cobertura del análisis solicitado

| Entregable | Sección |
| --- | --- |
| Alcance del MVP y exclusiones | 5 |
| Requerimientos funcionales y de UX | 7 y 8 |
| Arquitectura de información y sitemap | 9 |
| User journey y flujos de compra, entrega, recojo y carrito | 10 |
| Home y organización de carta | 6, 9 y 11 |
| Tarjetas y personalización | 12 |
| Carrito y checkout mínimo | 13 y 14 |
| Cobertura y costo de entrega | 15 |
| Flujo y mensaje de WhatsApp | 16 |
| Tarjeta de sellos y preferencias | 17 |
| Operación interna | 18 |
| Información funcional necesaria | 19 |
| Wireframes textuales de cada vista | 20 |
| Casos de error, vacíos, agotado, promoción no disponible, cobertura y cierre | 21 |
| Criterios de aceptación y pruebas | 22 |
| Métricas y evaluación | 23 |
| Preparación del lanzamiento y roadmap de versión 2 | 24 |
| Datos pendientes, decisiones y riesgos | 25 |
