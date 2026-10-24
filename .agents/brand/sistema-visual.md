# Sistema visual canónico — Fuego y Brasas

**Versión:** 1.1 · **Fecha:** 24 de octubre de 2026.
**Estado:** propuesta 06 aprobada por el propietario el 24/10/2026; revisión integral implementada, con comprobaciones locales y publicación verificadas. No constituye un manual original del logotipo ni certificación de interfaces.
**Alcance:** carta, pedido, cliente, personal y administración. Fuente única de tokens y medidas.

## 1. Identidad y logotipo

El [Facebook oficial](https://www.facebook.com/profile.php?id=61585453973558&sk=photos) y las imágenes del propietario muestran sello circular, llama y leños, carbón/marrón, crema, dorado y rojo/naranja. Los anuncios alternan superficies claras y oscuras; no aportan un manual ni códigos oficiales. Esta especificación normaliza esa identidad para la web.

La interfaz es directa, reconocible y centrada en comida a la brasa. Encabezado rojo profundo con letras blancas, acción principal amarilla con texto carbón y cuerpo blanco. Carbón para lectura; fotos y sello aportan el resto del color. Se retira la dirección cálida/crema descartada por el propietario. Los paneles internos comparten identidad con composición funcional.

- Conservar el logotipo suministrado; no redibujar, recolorear, estirar ni sustituirlo mediante IA. Utilizar variantes claras/oscuras solo si existen como recursos aprobados y son legibles sobre su fondo.
- Área libre mínima: un cuarto del diámetro exterior del sello. Ancho inicial: 64 px. Si las letras circulares pierden legibilidad, acompañar el sello con el nombre en texto; no transmitir contenido esencial solo mediante el logo.
- Sobre fotografía ocupada, usar superficie sólida de apoyo. Sin original apto, nombre textual temporal y recurso pendiente; no reconstruir letras desde un anuncio.
- Denominación: «Fuego y Brasas». «Sabor que une», presente en el material aportado, puede ser un título breve; no reemplaza nombre, precio o acción.

## 2. Tokens de color

La propuesta 06 fue aprobada por el propietario. Los HEX son adaptaciones de interfaz al sello, no códigos oficiales de un manual original. Esta es la única fuente productiva; el tema Tailwind implementa estos valores. Los manuales de propuesta quedan como historial de aprobación.

| Token | HEX | Uso |
| --- | --- | --- |
| `--fyb-bg` | `#FFFFFF` | Fondo público y privado. |
| `--fyb-surface` | `#FFFFFF` | Tarjetas, formularios y texto sobre rojo. |
| `--fyb-ink` | `#171717` | Texto principal. |
| `--fyb-muted` | `#5C5C5C` | Texto secundario. |
| `--fyb-action` | `#98251F` | Header, enlaces, precios, selección y foco sobre blanco. |
| `--fyb-action-hover` | `#7D201A` | Hover rojo. |
| `--fyb-primary` | `#FFC400` | Botón principal e indicador activo sobre rojo. |
| `--fyb-primary-hover` | `#E6AD00` | Hover de botón amarillo. |
| `--fyb-on-primary` | `#171717` | Texto/iconos sobre amarillo. |
| `--fyb-primary-border` | `#966000` | Borde legible del botón amarillo. |
| `--fyb-gold` | `#FFC400` | Alias decorativo del amarillo; no texto sobre blanco. |
| `--fyb-gold-ink` | `#98251F` | Alias de énfasis legible existente; no otra paleta. |
| `--fyb-fire` | `#E56A16` | Referencia de llama; no segundo color de acciones. |
| `--fyb-subtle` | `#F5F5F5` | Apoyos neutros y pie. |
| `--fyb-border` | `#E5E5E5` | Separación decorativa. |
| `--fyb-control-border` | `#808080` | Contorno identificable de campos y controles secundarios. |
| `--fyb-success` | `#247044` | Éxito con texto explícito. |
| `--fyb-danger` | `#B42318` | Error/destrucción con texto y contexto. |
| `--fyb-info` | `#275F83` | Información con texto. |

No cambiar todos los usos de action a amarillo: enlaces y foco mantienen rojo. Primario: amarillo/texto carbón/borde oscuro. Secundario: blanco/texto carbón/contorno gris. Inverso de header: rojo/texto y contorno blancos. Error no se comunica solo con color. Precios rojos no implican descuento; etiquetas de promoción solo con datos reales.

### Pares comprobados

Contraste sRGB sólido, no certificación de pantallas: carbón/blanco 17,93:1; secundario/blanco 6,69:1; blanco/rojo 8,02:1; carbón/amarillo 11,22:1; amarillo/rojo 5,02:1; borde amarillo/blanco 5,29:1 y borde/amarillo 3,31:1; contorno gris/blanco 3,95:1. Blanco/amarillo 1,60:1: prohibido para texto. Separadores claros son decorativos, no límites de campos.

Foco: 2 px separados 2 px, rojo sobre claro y blanco sobre header rojo. Selección añade indicador/subrayado y semántica, no solo color. Comprobar estados, opacidades, fondos adyacentes y contraste realmente renderizado. [Contraste WCAG](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## 3. Tipografía

| Token/rol | Familia y peso | Tamaño/interlineado |
| --- | --- | --- |
| `--fyb-font-brand` | Fraunces 600–700; fallback Georgia, serif | Títulos cortos de marca. |
| `--fyb-font-ui` | Manrope 400–700; fallback system-ui, sans-serif | Productos, precios, formularios y paneles. |
| `brand-title` | Brand 700 | Móvil 32/38 px; escritorio 48/56 px. |
| `section-title` | UI 700 | Móvil 24/30 px; desde tablet 32/40 px. |
| `product-title` | UI 600 | 18/26 px; nombre/porción completos. |
| `body` / `field` | UI 400 | 16/24 px. |
| `label` / `button` | UI 600 | 16/24 px. |
| `price` | UI 700 | 20/28 px; cifras tabulares cuando estén disponibles. |
| `support` | UI 400–500 | 14/20 px; solo información auxiliar. |

No trasladar manuscritas de anuncios a navegación/instrucciones/precios ni convertir todo a mayúsculas. Datos esenciales mantienen body. Precios desde céntimos PEN, `S/` y dos decimales; desconocido no es cero. Verificar ñ, tildes y fracciones.

Se usa `next/font/local`, variables y `display: swap`, según la guía instalada. Desde la corrección del build del 13/10/2026, Fraunces y Manrope se distribuyen como WOFF2 oficiales versionados con sus licencias en `src/app/fonts`; el build no descarga fuentes de Google. Se conservan las familias, pesos y fallbacks adoptados. La procedencia y hashes están en [recursos tipográficos](../../src/app/fonts/README.md). Dos familias como máximo, sin todas las variantes; el tema Tailwind 4 consume variables sin repetir valores por componente.

## 4. Espaciado y composición adaptable

| Criterio | Valor |
| --- | --- |
| Escala de espacio | 0, 4, 8, 12, 16, 24, 32, 48 y 64 px. |
| Breakpoint tablet / escritorio | 768 / 1024 px. |
| Márgenes móvil / tablet / escritorio | 16 / 24 / 32 px. |
| Ancho interior máximo | 1200 px; limitado por espacio disponible menos márgenes. |
| Columnas de catálogo | 1 móvil, 2 tablet, 3 escritorio. |
| Separación de tarjetas | 16 px móvil; 24 px desde tablet. |
| Radio tarjeta / campo / botón | 12 / 8 / 10 px. |
| Objetivo táctil principal | Al menos 48 × 48 CSS px, incluyendo cantidad/cierre. |
| Separación de objetivos adyacentes | Al menos 8 px. |
| Anchos de evidencia | 360, 390, 768 y 1280 CSS px. |
| Reflujo adicional | 320 CSS px, zoom 200 % y 400 % sobre viewport de escritorio adecuado a WCAG. |

El objetivo táctil amplía el mínimo previo del diseño; no se atribuye como medida literal de WCAG. MVP sin selector de modo oscuro. Tablas privadas pueden convertirse en fichas o tener scroll explícito dentro de su contenedor si necesitan comparación bidimensional; la página no desborda. No ocultar acciones o inclusiones esenciales para encajar.

Encabezado compacto: sello/nombre, carta y acceso secundario a tarjeta. Paneles tienen navegación del rol. Una promoción destacada apta según contrato; si no existe se omite. Llegar a comida y acción sin una introducción de marca que ocupe toda la pantalla.

## 5. Fotografías, motivos, iconos y movimiento

- Fotos en caja 4:3 con espacio reservado. `contain` para platos/combos completos que perderían inclusiones; `cover` solo con encuadre revisado que conserve porción. Destacado estático, sin carrusel automático.
- Luz cálida, alimento de color natural, fondo simple y escala coherente. Evitar filtros naranja, saturación extrema o vapor/llamas añadidos.
- Foto ausente: caja neutra, icono decorativo y «Foto próximamente»; nombre, porción, contenido, precio y acción siguen presentes. No sustituir con platos competidores o imágenes generadas como prueba de la porción.
- No usar afiches completos ni capturas de WhatsApp como tarjetas. Precios y contenidos son texto actualizado. Registrar procedencia de recursos del negocio; no reutilizar assets competidores.
- Aplicación visual del 14/10/2026: la portada y la carta pueden utilizar los recursos de apoyo generados del proyecto, siempre identificados como «Imagen referencial», también en el texto alternativo de los productos. No constituyen fotografías reales del local ni prueba de la porción. Solo se asignan a referencias conocidas del catálogo publicado; una foto asociada desde Storage tiene prioridad y las nuevas referencias sin recurso conservan su estado sin foto. Las inclusiones, porciones y precios proceden del catálogo, nunca de la imagen. [Recursos y revisión](../../docs/implementacion/evidencia/h8/renovacion-visual/README.md).
- Usar `next/image`, dimensiones/tamaños adaptativos y carga diferida fuera de vista. Seleccionar carga de la imagen principal según LCP real; no priorizar todas. `priority` está deprecado en Next.js instalado: leer guía antes de elegir `preload`, `loading` o `fetchPriority`.
- Motivo permitido: arco fino del sello o líneas discretas de brasa en encabezado/cierre, decorativas y fuera de texto. Madera/humo/llamas solo en foto o detalle menor, nunca detrás de campos/precios.
- Familia propuesta de interfaz: Lucide SVG de 20 px; auxiliares 16 px, destacados 24 px. El icono vive dentro del objetivo táctil. Marca externa usa recurso oficial autorizado; decoración `aria-hidden`, controles con nombre accesible. No emoji estructural.
- Hover/pressed: 150 ms; apertura/cierre no crítico: 220 ms; easing `ease-out`. Animar opacidad/transformación solo para feedback. Movimiento reducido elimina desplazamientos/escala. No GSAP, confeti, parallax ni fuego animado por una sugerencia genérica.

## 6. Componentes y patrones

| Familia | Presentación y comportamiento |
| --- | --- |
| Primaria | Fondo primary/texto on-primary/contorno primary-border; hover primary-hover. Una principal por bloque. Pendiente muestra verbo/estado sin éxito prematuro. |
| Secundaria | Superficie clara, texto ink y contorno control-border. Inversa en header: rojo con texto/contorno blanco. Links en párrafos subrayados. |
| Campo | Label persistente, contorno control-border, ayuda vinculada y error danger con texto; resumen enlazado cuando hay varios errores. |
| Badge/estado | Superficie clara y texto/icono semántico completo; sin descuento o popularidad inventados. |
| Producto | Foto → nombre/porción → inclusiones → precio único o «Precio por confirmar» según DC-27 → acción. Agotamiento visible; precio/nombre esencial no truncados. |
| Categorías | Selección visible con indicador y semántica; scroll horizontal explícito y teclado. Conservar posición al volver del detalle. |
| Carrito | Cantidades, opciones e indicaciones por línea; cambios sin retiro silencioso. Dock solo con artículos y altura según contenido reservada en página. |
| Revisión | Campos mínimos y condicionales; productos/cargos separados; pendiente no equivale a «gratis». |
| WhatsApp | Revisar/enviar en chat, abrir/copiar y volver. Sin indicador de venta confirmada. |
| Acceso | Labels visibles, enlace privado de cliente, espera/error y salida hacia carta. Staff accede con correo/contraseña y permisos vigentes, sin CAPTCHA ni segundo factor por DC-20/DC-22. |
| Sellos | Diez posiciones, 5 × 2; conteo «X de 10», premio separado. Acreditados primary/on-primary con borde; vacíos con contorno; posiciones sin interacción. |
| Premio | Nombre/contenido, estado e instrucciones; distinguir ciclo nuevo con premio de tarjeta nueva. Sin vencimiento o compra extra inventados. |
| Operación staff | Cliente, confirmaciones requeridas, efecto previsto y resultado real. Incertidumbre visible, sin saldo optimista. |
| Administración | Listado/ficha, revisión y conflictos; separar subido/asociado, guardado/publicado. |
| Retiro/restauración | Entidad, consecuencia, motivo y permiso; conservar historia/estado seguro. Activar/publicar requiere otra decisión. |
| Feedback | Mensaje breve, icono/estado y recuperación válida; no SQL ni trazas técnicas visibles. |

Reservar altura real y safe-area de elementos fijos, con `scroll-padding`; foco completamente visible. No botón flotante de WhatsApp que compita o tape el dock. Campos inválidos: resumen enfocable cuando hay varios errores y enlaces a campos; sin resumen, foco al primero al enviar. No mover foco por blur.

## 7. Estados y textos

| Situación | Patrón de referencia | Recuperación |
| --- | --- | --- |
| Carrito vacío | «Tu pedido está vacío». | «Ver carta». |
| Agregado local | «Se agregó al pedido». | «Ver mi pedido», anuncio contextual breve. |
| Agotado | «Agotado por ahora». | Explorar carta/resolver explícitamente la línea. |
| Cambio comercial | «Hay cambios en tu pedido. Revísalos para continuar». | Revisión expresa, sin aceptar por defecto. |
| Validación expirada | «Necesitamos revisar tu pedido otra vez». | Revalidar sin perder borrador. |
| Solicitud preparada | «Revisa y envía el mensaje en WhatsApp. El local confirmará la atención». | «Continuar por WhatsApp», «Copiar pedido», «Volver a mi pedido». |
| OTP inválido/vencido | Mensaje genérico, sin revelar otras identidades. | Revisar/reenviar según configuración real de Auth. |
| Tarjeta pausada/cerrada/eliminada | Estado propio autorizado, diferente de caída. | Carta o procedimiento aprobado; no alta duplicada. |
| Premio sin disponibilidad física | «El premio sigue disponible en tu tarjeta; consulta cuándo podemos entregarlo». | No confirmar canje ni descontarlo. |
| Mutación incierta | «Estamos comprobando el resultado. No repitas esta operación». | Recuperar mismo UUID conforme contrato/escalar. |
| Conflicto de revisión | «Este registro cambió. Revisa la versión actual antes de guardar». | Revisar datos actuales; conservar entrada para comparación segura. |
| Incidencia registrada | «Incidencia registrada para revisión». | Seguimiento, sin anunciar saldo restituido. |
| Restauración confirmada | «Registro restaurado; revisa su estado antes de activarlo». | Revisión/publicación/acceso explícitos. |

Carga contextual, no pantalla vacía. Fallo de catálogo distinto de catálogo vacío. Fallar tarjeta permite compra invitada si catálogo validable. PT-13 impide fijar resolución de canje registrado sin entrega: mostrar incidencia según contrato sin prometer reposición automática.

## 8. Integración, cambios y aceptación

H1 implementa tokens/primitivas mediante configuración de Tailwind 4, sin selectores CSS personalizados, según la instrucción del propietario del 4 de octubre. El archivo de entrada solo importa/configura Tailwind. Los valores de ejecución se centralizan en `tailwind.config.ts` y se contrastan con este documento; no hay colores alternativos por componente. Componentes compartidos no contienen consultas Supabase ni reglas de premio. Componentes funcionales consumen contratos; layouts públicos no leen sesión privada para HTML compartido.

Cambio visual: registrar aquí versión, motivo, alcance y pares comprobados; actualizar evidencias/enlaces afectados. Un cambio de negocio requiere revisar documentos funcionales/contratos. No duplicar tokens en overrides.

Aceptar cada hito según [Reglas UX/UI](../rules/ux-ui.md): estados, anchos de evidencia, teclado/foco, contraste, zoom/reflujo y lector. H8 añade dispositivos reales y piloto. Ninguna prueba de pantallas se declara ejecutada en esta especificación.

## 9. Pendientes y fuentes

PT-09 parcialmente aclarado por Facebook confirmado: faltan originales del sello, fotos utilizables, variantes aprobadas y procedencia/autorización de recursos. No existe manual entregado. Usar fallback y revisar presentación final antes de lanzamiento. PT-08, PT-11 y PT-13 conservan bloqueos del [índice](../../docs/diseno-tecnico/README.md).

- [Investigación](../../docs/diseno-tecnico/15-investigacion-ux-y-referentes.md): evidencia y límites.
- [Explicación para el equipo](../../docs/diseno-tecnico/14-identidad-visual-y-sistema-ui.md).
- [Frontend y estado](../../docs/diseno-tecnico/06-frontend-y-estado.md).
- [WCAG: foco no oculto](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
- [WCAG: tamaño de objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## 10. Aplicación aprobada del 24/10/2026 — DC-28

[Propuesta 06 aprobada](../../docs/marca/manual-propuesto-06-rojo-profundo.md). Header rojo compartido con sello/nombre y letras blancas; navegación activa subrayada en amarillo. Inicio: foto principal estática y texto breve, categorías visibles y promociones reales/carta, sin duplicar tres tarjetas de acceso antes del menú. El usuario llega a platos sin ubicación, registro ni modalidad obligatoria. Footer neutro con accesos a información y personal.

Panel privado: navegación por rol lateral en escritorio y menú desplegable explícito en móvil, con Escape y retorno de foco, manteniendo permisos y rutas. Tarjeta: diez posiciones 5 × 2, colores/texto de progreso y premios independientes. Sellos decorativos no son botones; su tamaño se adapta sin exigirles el objetivo táctil de controles.

El sello original recibido se conserva como recurso; su presentación circular recorta únicamente el anuncio alrededor. No se recolorea ni reconstruye. Raster pequeño usado a tamaño contenido; el original vectorial/de mayor resolución sigue pendiente. Fotografías existentes identificadas como referenciales; Storage propio mantiene prioridad.

DC-27 sustituye la modalidad/cargos públicos anteriores; DC-28 cambia presentación y accesibilidad, no precios, ventas, sellos, permisos ni textos legales. Las decisiones posteriores del índice técnico prevalecen sobre estados históricos de este documento.

Evidencia de DC-28: [revisión y publicación del 24/10](../../docs/implementacion/evidencia/h8/renovacion-ux-ui-2026-10-24/README.md). La verificación automatizada conserva los límites indicados allí.
