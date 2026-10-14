# Sistema visual canónico — Fuego y Brasas

**Versión:** 1.0 · **Fecha:** 3 de octubre de 2026.  
**Estado:** propuesta de interfaz adoptada; base visual de H1 implementada y en revisión. Las interfaces comerciales y privadas de H2–H8 siguen pendientes; no es un manual gráfico oficial.  
**Alcance:** carta, pedido, cliente, personal y administración. Fuente única de tokens y medidas.

## 1. Identidad y logotipo

El [Facebook oficial](https://www.facebook.com/profile.php?id=61585453973558&sk=photos) y las imágenes del propietario muestran sello circular, llama y leños, carbón/marrón, crema, dorado y rojo/naranja. Los anuncios alternan superficies claras y oscuras; no aportan un manual ni códigos oficiales. Esta especificación normaliza esa identidad para la web.

La personalidad es cálida, cercana y centrada en comida a la brasa. La compra usa superficies claras; el carbón se concentra en zonas de marca y cierres. Fotos y acentos transmiten el carácter del restaurante. El panel interno comparte la familia visual con composición funcional.

- Conservar el logotipo suministrado; no redibujar, recolorear, estirar ni sustituirlo mediante IA. Utilizar variantes claras/oscuras solo si existen como recursos aprobados y son legibles sobre su fondo.
- Área libre mínima: un cuarto del diámetro exterior del sello. Ancho inicial: 64 px. Si las letras circulares pierden legibilidad, acompañar el sello con el nombre en texto; no transmitir contenido esencial solo mediante el logo.
- Sobre fotografía ocupada, usar superficie sólida de apoyo. Sin original apto, nombre textual temporal y recurso pendiente; no reconstruir letras desde un anuncio.
- Denominación: «Fuego y Brasas». «Sabor que une», presente en el material aportado, puede ser un título breve; no reemplaza nombre, precio o acción.

## 2. Tokens de color

Los HEX son propuestas de interfaz, no mediciones oficiales de un manual. Los componentes consumen nombres semánticos; no añaden códigos alternativos.

| Token | HEX | Uso |
| --- | --- | --- |
| `--fyb-bg` | `#FFF8ED` | Fondo público. |
| `--fyb-surface` | `#FFFFFF` | Tarjetas, formularios, diálogos y trabajo privado. |
| `--fyb-ink` | `#241C17` | Texto principal y fondos seleccionados de marca. |
| `--fyb-muted` | `#6B5C50` | Texto secundario sobre claro. |
| `--fyb-action` | `#9B2C20` | Acción principal, enlaces y foco sobre claro. |
| `--fyb-action-hover` | `#7D2018` | Hover/pressed de acción. |
| `--fyb-fire` | `#D65A1E` | Acento decorativo; no texto blanco normal. |
| `--fyb-gold` | `#C89538` | Detalle decorativo de sello/motivo; acento legible sobre carbón. |
| `--fyb-gold-ink` | `#8A5A16` | Texto dorado oscuro sobre claro. |
| `--fyb-border` | `#DED0BE` | Separadores decorativos, no único límite de controles. |
| `--fyb-control-border` | `#8A7869` | Contorno identificable de campos/controles sobre claro. |
| `--fyb-success` | `#247044` | Éxito, siempre acompañado de texto. |
| `--fyb-danger` | `#B42318` | Error y acción destructiva explícita. |
| `--fyb-info` | `#275F83` | Información y revisión pendiente. |

Mensajes semánticos: superficie clara con texto/icono del token respectivo. Botones sólidos: texto surface. El verde de un icono oficial de WhatsApp puede conservarse dentro de ese recurso; no redefine la paleta ni introduce otro botón principal.

### Pares comprobados

Ratios calculados mediante luminancia relativa sRGB y redondeados; no son pruebas de interfaces renderizadas.

| Par | Ratio | Decisión |
| --- | --- | --- |
| ink / bg | 15,88:1 | Texto principal. |
| muted / bg | 6,08:1 | Texto secundario. |
| surface / action | 7,57:1 | Botón principal con texto blanco. |
| gold-ink / bg | 5,60:1 | Texto dorado legible. |
| control-border / bg | 4,00:1 | Límite de control; sobre surface alcanza 4,22:1. |
| success / surface | 6,04:1 | Mensaje/acción de éxito. |
| danger / surface | 6,57:1 | Mensaje/acción destructiva. |
| info / surface | 6,88:1 | Mensaje informativo. |
| gold / ink | 6,23:1 | Detalle dorado sobre carbón. |
| surface / fire | 3,93:1 | No usar para texto normal de botón. |
| gold / bg | 2,55:1 | Solo decoración sobre crema. |
| border / bg | 1,43:1 | Solo separación decorativa. |

Texto normal: 4,5:1; texto grande según WCAG: 3:1. Controles/estados relevantes: 3:1 frente a colores adyacentes. Verificar transparencias, fondos e indicadores reales. [Contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Foco sobre claro: contorno action de 2 px, separado 2 px; sobre carbón: contorno surface con esa separación. Interacción sobre foto requiere superficie sólida. Selección combina indicador y texto/semántica, nunca solo cambio de color.

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

H1 integra `next/font`, variables y `display: swap`, según guía instalada. Google descarga durante build y sirve las fuentes con la aplicación. Si se necesitan archivos locales, obtenerlos de fuente autorizada con licencia. Dos familias como máximo, sin todas las variantes; el tema Tailwind 4 consume variables sin repetir valores por componente.

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
- Usar `next/image`, dimensiones/tamaños adaptativos y carga diferida fuera de vista. Seleccionar carga de la imagen principal según LCP real; no priorizar todas. `priority` está deprecado en Next.js instalado: leer guía antes de elegir `preload`, `loading` o `fetchPriority`.
- Motivo permitido: arco fino del sello o líneas discretas de brasa en encabezado/cierre, decorativas y fuera de texto. Madera/humo/llamas solo en foto o detalle menor, nunca detrás de campos/precios.
- Familia propuesta de interfaz: Lucide SVG de 20 px; auxiliares 16 px, destacados 24 px. El icono vive dentro del objetivo táctil. Marca externa usa recurso oficial autorizado; decoración `aria-hidden`, controles con nombre accesible. No emoji estructural.
- Hover/pressed: 150 ms; apertura/cierre no crítico: 220 ms; easing `ease-out`. Animar opacidad/transformación solo para feedback. Movimiento reducido elimina desplazamientos/escala. No GSAP, confeti, parallax ni fuego animado por una sugerencia genérica.

## 6. Componentes y patrones

| Familia | Presentación y comportamiento |
| --- | --- |
| Primaria | Fondo action/texto surface; hover action-hover. Una principal por bloque. Pendiente muestra verbo/estado sin éxito prematuro. |
| Secundaria | Superficie clara, texto action y contorno control-border. Links en párrafos subrayados. |
| Campo | Label persistente, contorno control-border, ayuda vinculada y error danger con texto; resumen enlazado cuando hay varios errores. |
| Badge/estado | Superficie clara y texto/icono semántico completo; sin descuento o popularidad inventados. |
| Producto | Foto → nombre/porción → inclusiones → precio/modalidad o «Desde» autorizado → acción. Agotamiento visible; precio/nombre esencial no truncados. |
| Categorías | Selección visible con indicador y semántica; scroll horizontal explícito y teclado. Conservar posición al volver del detalle. |
| Carrito | Cantidades, opciones e indicaciones por línea; cambios sin retiro silencioso. Dock solo con artículos y altura según contenido reservada en página. |
| Revisión | Campos mínimos y condicionales; productos/cargos separados; pendiente no equivale a «gratis». |
| WhatsApp | Revisar/enviar en chat, abrir/copiar y volver. Sin indicador de venta confirmada. |
| Acceso | Labels, OTP pegable/autocompletado, espera/error y salida hacia carta. Staff accede con correo/contraseña y permisos vigentes, sin CAPTCHA ni segundo factor por DC-20/DC-22. |
| Sellos | Diez posiciones, 5 × 2; conteo «X de 10», premio separado. Acreditados action, vacíos control-border; posiciones sin interacción. |
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
