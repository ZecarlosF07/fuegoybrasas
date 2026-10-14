# Portada y carta con fotografía protagonista

**Fecha:** 14/10/2026. **Alcance:** portada, navegación pública, categorías, tarjetas y fotografía del detalle. Revisión realizada sobre el árbol de trabajo basado en `6eb535f`; [resultados de Chrome](verificacion-navegador.json). No acredita un deployment Vercel ni el piloto operativo de H8.

## Cambios

- Portada con el lema existente, acción hacia la carta y una imagen grande de pollo a la brasa; texto sobre superficie sólida, sin carrusel.
- Navegación con carta, tarjeta y pedido; atajos ilustrados a las categorías que tienen platos publicados.
- Tarjetas con imágenes a todo el ancho, inclusiones, porción, precio y acción legibles. Promociones identificadas sin inventar descuentos ni popularidad.
- Información del local al final de la carta, usando únicamente la configuración verificada; no se presentan horarios o pagos estimados como confirmados.
- Encabezado y cierre comparten la identidad existente. El logotipo original sigue pendiente; se conserva el nombre textual.

`CatalogHero`, `CategoryHighlights` y `CatalogVisit` separan presentación. `services/media.ts` resuelve fotografías y grupos; los tipos viven en `types/media.ts`. Los componentes siguen por debajo de 170 líneas, con Tailwind y los tokens del [sistema visual](../../../../../.agents/brand/sistema-visual.md).

## Recursos y procedencia

Se añadieron **16 imágenes WebP** para las **17 referencias publicadas**: tres porciones de pollo regular, cuatro Mostritos, cinco sabores de alitas de cuatro piezas, pollo entero promocional, ronda, Combo Mostrito y Gran Promoción. El Mostrito de ⅛ y su promoción comparten recurso. [Inventario, tamaños y SHA-256](imagenes.json); aproximadamente 5 MB en total antes de la optimización de `next/image`.

Son **imágenes referenciales generadas con `imagegen`**, no fotografías reales del local ni evidencia del volumen servido. La imagen de portada se orientó con el afiche suministrado por el propietario; las demás se describieron desde las porciones e inclusiones del catálogo publicado. Se inspeccionaron los resultados antes de integrarlos; los originales se conservan y la copia WebP solo cambia la codificación.

Los recursos se guardan en `public/images/menu/`, se despliegan con la web y no requieren nuevas credenciales ni migraciones. No proceden de competidores y no contienen precios, logotipos ajenos ni texto comercial incrustado.

Cada producto de apoyo muestra «Imagen referencial» y un texto alternativo correspondiente. `resolveCatalogMedia()` prioriza siempre `imagePath` de Supabase Storage: cuando se asocia una foto propia desde el panel se utiliza esa foto. Si se retira y el slug tiene recurso de apoyo, reaparece la imagen referencial. Un producto nuevo o desconocido conserva «Foto próximamente»; un archivo fallido muestra «Foto no disponible». No se deduce una fotografía por semejanza del nombre ni se amplía el contrato de rutas Storage.

Precios, porciones, inclusiones, publicación y disponibilidad siguen viniendo del snapshot de Supabase. El mapa de imágenes no crea productos ni confirma una venta. Pedidos y fidelización mantienen sus condiciones y flags vigentes.

## Skill y guías

Se leyó `ui-ux-pro-max` y el sistema canónico, sin persistir otra paleta. Consulta `restaurant food ordering photography --design-system`: se aprovechó la presencia de comida y la jerarquía; se descartaron su paleta/tipografías alternativas, funnel comercial, scroll-snap y animaciones. Consulta `image preload responsive sizes --stack nextjs`: se aplicaron contenedores con espacio reservado, `fill`, `sizes` y carga diferida. Su consejo `priority` se sustituyó por `preload` para la única imagen principal, siguiendo las guías de **Next.js 16.3.8 instalado**.

Fraunces/Manrope se mantienen locales. No hay CSS nuevo, enlaces de Google Fonts, una segunda identidad ni reseñas/cifras comerciales inventadas.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| `corepack yarn build`, perfil de producción | Aprobado con TypeScript; build final 15,26 s. Variables privadas inyectadas en el proceso sin imprimir sus valores. |
| Lint de catálogo, layout y guardas de secretos | Aprobado; imports ajustados a las reglas y callbacks de pruebas dentro del límite. |
| Unitarias de media, catálogo y recuperación | **13/13**, tres archivos. Foto propia prioritaria, referencia identificada, slug desconocido/prototipo rechazado y categorías sin platos excluidas. |
| Recursos | Las 17 entradas tienen archivo existente; 16 WebP distintos con tamaños/hashes registrados. |
| Chrome con lecturas públicas del oficial | 17 tarjetas y 21 imágenes cargadas por tamaño: 320, 360, 390, 768 y 1280 px. Sin escrituras, login ni datos sintéticos en remoto. |
| Reflujo | Sin desbordamiento de página ni del bloque de portada en los cinco tamaños. Se corrigió un desbordamiento interno del `figure` detectado al inspeccionar escritorio. |
| Axe | Cero violaciones en los cinco tamaños para los tags WCAG 2 A/AA, 2.1 AA y 2.2 AA. No equivale a certificación ni sustituye lector/zoom/dispositivos reales. |
| Teclado y rutas | Salto al contenido visible, foco y acción a la carta; filtro de alitas, detalle y regreso con categoría conservada; acceso del personal visible sin iniciar sesión. |
| Fallo controlado de imagen | HTTP 404 interceptado solo en Chrome: mensaje explícito y precio del plato conservado. |
| Fuentes | Fraunces/Manrope cargadas; cero peticiones del navegador a Google Fonts. |
| Credenciales y documentación | 36 recursos estáticos sin claves privadas configuradas; 920 archivos candidatos sin secretos; 79 enlaces locales y límites de componentes comprobados. |

Vitest inicialmente no pudo leer archivos temporales del sandbox; la repetición fuera de esa restricción aprobó los 13 casos. El helper de Chrome se corrigió para usar contexto explícito, esperas acotadas de imagen y navegación de Next.js; el resultado final es el JSON enlazado. La revisión se limita al cambio visual: no se afirma otra corrida completa de las pruebas DB/integración/E2E de H8.

Capturas: [móvil 360](inicio-360.png), [móvil 390](inicio-390.png), [tablet](inicio-768.png), [escritorio](inicio-1280.png), [carta completa](carta-completa-1280.png), [detalle](detalle-alitas-390.png), [imagen fallida](imagen-fallida-390.png) y [acceso del personal](acceso-personal-390.png). También se comprobó [reflujo a 320](inicio-320.png).

El piloto con dispositivos, lector de pantalla y zoom real conserva su alcance pendiente. Antes de sustituir imágenes de apoyo por fotografías reales, revisar su correspondencia con la porción y actualizar su asociación desde el panel.
