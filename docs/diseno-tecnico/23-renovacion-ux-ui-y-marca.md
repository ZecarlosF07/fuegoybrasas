# Revisión integral de UX/UI y aplicación de marca

**DC-28 · 24/10/2026.** El propietario aprueba la propuesta 06 y solicita revisar y modificar toda la web. Se aplica la identidad aprobada a carta, detalle, pedido, tarjeta, acceso y paneles, conservando los acuerdos comerciales vigentes. No requiere migración de datos.

## Referencias y estructura adoptada

- [Pardos](https://www.pardoschicken.pe/): se verificaron en navegador marca, categorías, pedido y portada fotográfica de campaña. La consulta web directa devolvió 403, por lo que esa observación procede del navegador.
- [Don Belisario](https://www.donbelisario.com.pe/menu): menú por categorías, promociones al comienzo, fichas con contenido/precio y carrito; también ofrece ubicación/modalidades propias que no corresponden al pedido de Fuego y Brasas.
- [Norkys](https://norkys.pe/): portada de campañas, bloque de productos con precios, categorías y pie. No se toma su etiqueta de popularidad como prueba de ventas de este negocio.
- [La Leña](https://www.lalena.com.pe/): su contenido público consultado prioriza «Ordenar», acceso y secciones institucionales; no demuestra que su inicio tenga el mismo catálogo que los otros sitios.

Los referentes comparten accesos claros a comida y pedido, pero no una estructura idéntica. Se adopta una portada estática breve con foto amplia, seguida de categorías y productos/promociones reales. Se elimina el bloque duplicado de tres accesos fotográficos antes de la carta para acercar los platos al inicio. Sin carrusel automático, ubicación obligatoria o checkout logístico.

## Identidad y componentes compartidos

La fuente de colores, tipografía y medidas es el [sistema visual canónico](../../.agents/brand/sistema-visual.md). La [propuesta 06](../marca/manual-propuesto-06-rojo-profundo.md) queda como historial aprobado. Header rojo con texto blanco, botones principales amarillos con texto carbón, precios/enlaces/foco rojos y cuerpo blanco. Separar el token de botón primario del de enlace/foco: un reemplazo global a amarillo perdería legibilidad.

Se reutilizan marca, navegación y variantes de botón. La presentación circular del sello preserva los píxeles originales y oculta el anuncio alrededor, sin recolorear ni reconstruir el logotipo. Se conserva el raster recibido; el original de mayor resolución sigue pendiente. Fotos propias de Storage tienen prioridad sobre los recursos referenciales existentes; no se descargan fotos de competidores.

## Recorridos revisados

- **Carta/detalle:** fotos con caja reservada y fallo explícito, porción/inclusiones, precio rojo, promoción auténtica y acción amarilla. Agregado directo solo sin opciones obligatorias; feedback/error contextual al producto que lo inicia. Navegación activa visible y accesible.
- **Pedido:** mantiene DC-27, dos pasos, productos e indicaciones opcionales; subtotal sin envío. Conservar recuperación, cambios de precio, expiración y apertura/copia de WhatsApp sin venta confirmada.
- **Cliente:** diez sellos adaptables en dos filas y premios separados; mismos campos y acceso privado. Corregir salto al contenido y mantener pausas/incidencias legibles.
- **Personal/administración:** header común, rol visible, navegación lateral en escritorio y menú desplegable explícito en móvil, ruta actual identificada. El menú admite Escape y devuelve foco al botón. Indicadores en cuadrícula compacta sin inventar nuevos datos; conservar formularios, permisos y acciones de revisión/confirmación.
- **Acceso y contenido informativo:** títulos de página descriptivos y salto al contenido enfocable; formularios, errores, carga real y lectura consistentes. Condiciones/privacidad conservan literalmente su texto; el cambio de atributos de accesibilidad se registra en el historial de aprobación del código fuente.

No cambian API, tablas, precios, reglas de sellos/canjes, identidad, permisos ni datos oficiales. La UI no añade SMS, MFA, CAPTCHA, modalidad o pago. La navegación adapta su presentación sin crear rutas nuevas ni mover páginas de acceso a layouts protegidos.

## Verificación y publicación

Usar `ui-ux-pro-max` y guías del Next.js instalado. Revisar 320, 360, 390, 768 y 1280 px, teclado, foco despejado, contraste renderizado, movimiento reducido, vacío/error/carga/agotados y lectura de títulos. Las capturas de fotografías diferidas deben tomarse después de desplazarlas al viewport y esperar su carga; una captura completa inicial no demuestra un fallo de una foto fuera de vista.

Ejecutar lint, unitarias, build/TypeScript, límites servidor/cliente y secretos con Yarn. Repetir la regresión de navegador con fixtures exclusivamente en Supabase local, incluidos roles, recuperación y operaciones; no crear clientes de prueba en el oficial. Guardar evidencia por versión, diferenciando simulación automatizada de lector de pantalla, zoom físico o recepción real de WhatsApp.

Después de aprobar los checks, preparar commit/push del conjunto y comprobar el despliegue de Vercel y las rutas públicas sin operaciones comerciales sintéticas. Los cambios visuales no activan/desactivan programas ni datos del negocio. Resultados y límites se registran al ejecutarse, sin anticipar aceptación.
