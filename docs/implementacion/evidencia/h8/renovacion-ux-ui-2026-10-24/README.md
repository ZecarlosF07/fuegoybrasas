# Revisión integral UX/UI — 24/10/2026

**Referencia:** [DC-28](../../../../diseno-tecnico/23-renovacion-ux-ui-y-marca.md), propuesta 06 aprobada. Trabajo sobre `c1465bd` más los cambios de esta entrega. Estado: revisión implementada y verificada en local; commit/publicación se registran después de comprobarlos.

## Cambios revisados

- Header rojo profundo y sello recibido, navegación blanca con selección visible, cuerpo blanco, precio/enlaces rojos y acción amarilla con texto carbón. Tokens de botón y enlaces/foco separados; misma identidad en acceso, carta, tarjeta y paneles.
- Portada estática con fotografía y acceso a carta; categorías y promociones reales antes del resto de platos. Eliminado el bloque duplicado de accesos fotográficos. Fotos propias prioritarias y recursos existentes identificados como referenciales.
- Detalle con foto, nombre/porción, contenido, precio y pedido; retirada la caja logística duplicada entre imagen y nombre en móvil. Botón de agregar y feedback local sin duplicar el error en otras fichas.
- Pedido de platos, dos pasos, subtotal sin envío y coordinación por WhatsApp, según DC-27. No se agregan modalidad, dirección, pago o ventas confirmadas.
- Tarjeta: sellos circulares adaptables, conteo textual y premios separados; mismos permisos y reglas. Páginas informativas y cliente con salto al contenido enfocable; textos legales literalmente conservados y cambio de atributos registrado en aprobación.
- Paneles con rol visible, sidebar en escritorio y menú explícito en móvil, Escape y retorno de foco. Indicadores más compactos. Títulos de páginas privadas descriptivos y páginas de error/404 con continuidad hacia carta.

## Evidencia ejecutada

| Comprobación | Resultado |
| --- | --- |
| `yarn lint` | Aprobado; primera revisión y repetición del menú. |
| `yarn test --maxWorkers=2` | 135 pruebas aprobadas, 30 archivos. |
| `yarn build` | Compilación y TypeScript aprobados con perfil remoto; repetida tras ajustes finales. |
| `yarn test:release` | 9 pruebas aprobadas, incluidos hashes de documentos y permisos de publicación. |
| `yarn test:boundary` | Next.js rechaza infraestructura `server-only` desde cliente. |
| `yarn db:start` + `yarn db:reset` | Motor disponible, 25 migraciones reconstruidas exclusivamente con `--local`. |
| `yarn test:e2e` | **54 pruebas aprobadas**, 2,9 minutos de navegador; incluye dos casos nuevos de teclado/contexto de error. |
| `yarn test:e2e --project=management --no-deps` | **9 aprobadas** después del ajuste final del menú móvil; incluye abrir, Escape/foco, seleccionar ruta y permisos. |
| `yarn check:repository-secrets` | 1457 candidatos comprobados sin credenciales configuradas ni archivos privados versionados en esa ejecución. |
| `yarn check:secrets` | 38 recursos estáticos comprobados sin secretos locales/remotos en esa ejecución. |
| Límite de componentes / `git diff --check` | Sin componentes propios de más de 170 líneas; sin errores de whitespace tras corrección. |

Los 54 casos corresponden a la regresión completa antes del ajuste final del menú; los nueve administrativos se repitieron después. La retirada de texto duplicado del detalle y la presentación 404/reintento son ajustes de presentación posteriores, comprobados con build y revisión pública; no se atribuye otra regresión completa a esos cambios.

Capturas en [capturas](capturas/): inicio, detalle/agotado/error, acceso/recuperación, editor de carta, pedido/mensaje, tarjeta y administración. Anchos automatizados: 320, 360, 390, 768 y 1280 px según recorrido. Axe, teclado, foco y reflujo incluidos en las suites; captura y contraste real no sustituyen certificación de accesibilidad.

Las capturas completas iniciales pueden mostrar fondos de imágenes todavía diferidas fuera del viewport. Se distinguió esa condición de un error real de imagen; no se adelantó la carga de todas las fotografías solo para alterar una captura. El caso de imagen fallida comprueba fallback explícito y conservación del texto comercial.

## Herramientas, fuentes y límites

`ui-ux-pro-max`: consultas UX «focus not obscured», «navigation active state» y stack Next.js «client navigation». Aplicados indicadores de ruta, foco despejado y componentes cliente limitados a interacción. Guías locales del Next.js instalado para accesibilidad, imágenes, fuentes y navegación; `preload` solo cuando corresponde, fuentes locales conservadas y estilos Tailwind.

Referentes oficiales y adaptación: [diseño 23](../../../../diseno-tecnico/23-renovacion-ux-ui-y-marca.md). No se copiaron fotos, datos comerciales, precios ni afirmaciones de popularidad de terceros. El sello raster original se conserva; vector/original de alta resolución continúa pendiente.

Las mutaciones sintéticas fueron únicamente contra Supabase local. La revisión pública del build remoto usa el catálogo oficial mediante lectura: no crea tarjetas ni envía mensajes de prueba al WhatsApp del negocio. No hay migraciones nuevas ni modificaciones de flags/datos oficiales en esta entrega.

[Revisión pública local con catálogo oficial](revision-publica-local.json): 17 productos, pedido habilitado, páginas públicas 200, ruta inexistente 404 y redirecciones 307 de acceso y compatibilidad conservadas. La revisión en navegador confirmó portada, fotografía de alitas y detalle del Mostrito; la portada final quedó abierta para el propietario.

No se declaran revisión humana de Narrador, dispositivos físicos, recepción real de WhatsApp o certificación legal. La aprobación de la marca y los textos comerciales existentes no equivale a esas comprobaciones.

## Publicación

Pendiente de registrar SHA, subida y comprobación del nuevo despliegue. Las comprobaciones locales anteriores no se presentan como pruebas de la versión publicada antes de actualizarla.
