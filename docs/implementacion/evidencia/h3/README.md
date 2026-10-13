# H3 — Evidencia de implementación

**Revisión:** 8 de octubre de 2026.  
**Estado:** catálogo público implementado y conectado al Supabase remoto; verificación técnica aprobada. Aceptación manual y confirmación comercial de las entradas afectadas por PT-05 pendientes.  
**Referencia:** [Hito 3](../../03-hito-3-catalogo-publico.md), [guía](../../hitos-del-proyecto.md), [matriz comercial](matriz-comercial.md).  
**Versión verificable:** árbol de trabajo sobre `86e156a4215329090b973c0c295fecf889881431`, sin commit ni publicación del sitio solicitados.

## Resultado

- Cuatro migraciones versionadas: tablas/permisos, integridad/proyección, carga de referencia y restricción de motivos recortados. Seis tablas nuevas en `public`; personal, auditoría y recibos permanecen privados. Total acumulado de la aplicación: diez tablas, siete públicas y tres privadas.
- Siete categorías, 24 entradas C01–C24 y cinco promociones P01–P05. Identidades estables; precios fuente internos, sin deducir modalidades. C01 permanece fuera de la web. Alitas regulares de cuatro y ronda de dieciséis unidades.
- P05 tiene precio verificado de S/89.90 para entrega, sin precio de recojo ni la leyenda retirada. Hay 28 borradores: C01 excluido permanentemente de venta web y 27 referencias pendientes de PT-05. La carta inicial contiene únicamente P05; esto es un control de publicación, no pérdida de la carga.
- `read_catalog()` devuelve configuración comercial segura, tiempo y artículos publicables en una sola sentencia SQL. RPC estable, `SECURITY DEFINER`, `search_path=''`, sin parámetros y con grants explícitos. RLS en las seis tablas y sin CRUD público directo.
- Borrado lógico completo, claves retenidas y eliminación física rechazada. Restauración sin reactivación/publicación/verificación automática; ancestros eliminados bloquean restaurar hijos. Cada modificación avanza revisiones; precio, composición o grupos/opciones invalidan la comparación anterior.
- `/` presenta carta, categorías y promoción destacada; `/productos/[slug]` resuelve exclusivamente la misma proyección. `GET /api/catalog` conserva el contrato `Result`, devuelve 503 ante fallo y utiliza `Cache-Control: no-store`.
- DAL sin cookies ni sesión, timeout y validación estricta del DTO. React `cache` se limita a la petición de página/metadata: no hay caché persistente del catálogo. La vigencia se evalúa en PostgreSQL; el horario utiliza `serverNow` y Lima, con desconocido distinto de cerrado.
- Estados vacío, agotado, imagen ausente/fallida, recurso no encontrado y servicio no disponible. Reintento real con carga contextual, doble ejecución bloqueada, error visible y foco al contenido recuperado; detalle conserva producto y contexto de categoría.
- Metadata pública para carta/productos, canonical y descripciones confirmadas. Slug no publicable devuelve 404 y noindex. No se publican dirección, horarios, valoraciones ni datos estructurados inventados.
- Componentes pequeños, tipos separados, lógica pura, Tailwind y primitivas compartidas. Sin compra/carrito simulados: H5 incorpora el pedido y WhatsApp; flags de pedido y fidelización siguen apagados.

## Entornos y comprobaciones

Windows, Node 22.16.0, Yarn 1.22.22, Next 16.3.8, React 19.2.8, TypeScript 5.9.3, Tailwind 4.3.3, Supabase SDK 2.117.2 / SSR 0.12.7 / CLI 2.119.0. Pruebas destructivas exclusivamente sobre PostgreSQL 17.11/Auth local. Chrome sin ventana contra build local de producción, puerto 3100. Desarrollo habitual en puerto 3000 conectado al remoto.

| Comprobación | Resultado |
| --- | --- |
| Reconstrucción | `yarn db:reset` reconstruyó H1, H2 y las cuatro migraciones H3. Tipos generados primero desde local y finalmente con `yarn db:types` desde el remoto. |
| PostgreSQL | 44 pgTAP aprobadas: nueve H1, catorce H2 y veintiuna H3; referencias, cantidades, RLS, grants, RPC, exclusión de mesa, soft delete, motivo recortado y no DELETE. |
| Dominio/componentes | 46 aprobadas: contrato estricto, horario Lima/nocturno/domingo-lunes, céntimos/precio mínimo, fallbacks y errores DAL; reintento, doble ejecución y contexto del detalle. Incluye regresión H1/H2. |
| Integración | 39 aprobadas con PostgreSQL/Auth local reales: veinte de H3 y diecinueve previas. Snapshot público, permisos, borradores, precio de mesa/no verificado, configuración ausente, agotamiento, actualización, soft delete, restauración, unicidad retenida, vigencia, comparación y grupos/opciones obligatorios. Repetir la carga conserva ediciones y número de artículos. |
| Navegador | 20 aprobadas: quince recorridos previos adaptados a la home comercial y cinco H3. Carta/categoría/vuelta, detalle agotado, borrador 404, metadata, imagen cargada/fallida, RPC fallida y recuperación, catálogo vacío. Los dos escenarios que cambian permisos/categorías locales se ejecutan después de los demás mediante dependencias de proyectos Playwright. |
| Accesibilidad automática | Axe sin violaciones en los estados comprobados; anchos 360/390/768/1280 px y reflujo 320/640 px. Salto al contenido, teclado, foco visible y reducido movimiento; recuperación devuelve foco a `main`. |
| Remoto | Dry-run inicial mostró las tres migraciones base H3 y después solo la cuarta de restricción; se aplicaron con CLI al proyecto autorizado. Comprobación posterior: seis tablas con propietario `app_owner` y RLS, siete categorías, 29 referencias, cinco promociones, 28 borradores, un artículo público y flags pausados. RPC remota con clave pública aprobada y SELECT directo rechazado con `42501`. |
| Compilación | `yarn build` aprobado con variables remotas: carta, detalle, handler y rutas privadas; `yarn typecheck`/TypeScript estricto y ESLint sin errores. |
| Frontera de servidor | `yarn test:boundary` obtuvo rechazo de Next para importación `server-only` desde Client Component. La fixture usa `build:local`, sin copiar env ni el lanzador remoto. |
| Secretos | `yarn check:secrets`: 31 recursos estáticos de producción sin secretos locales/remotos, flujo de recuperación ni URL PostgreSQL. |
| Documentación | Cinco documentos con enlaces locales válidos; componentes propios dentro de 170 líneas y `git diff --check` sin errores de formato. |

Los resultados de pruebas no equivalen a aceptación del propietario ni a lanzamiento.

Los fallos iniciales se corrigieron: permiso CREATE temporal para el propietario del esquema, parámetros UUID/text de las fixtures y selector de texto del 404. Vitest necesitó ejecutarse fuera del aislamiento de Windows que impedía leer sus temporales; no se cambiaron las conexiones de pruebas al remoto. El escenario de imágenes utiliza un PNG abstracto interceptado: verifica carga/layout y `onError`, no fotografía real ni autorización de Storage.

## UX/UI y composición

Se aplicó `ui-ux-pro-max`, MASTER y el [sistema visual canónico](../../../../.agents/brand/sistema-visual.md). Búsquedas: `restaurant menu mobile minimal` con design system; contraste con `restaurant menu` en product; `image responsive metadata` en stack Next. La plantilla de funnel, colores/fuentes alternativos y animación decorativa no encajan con el alcance y se descartaron. Se adoptó jerarquía de carta, espacios claros, imágenes adaptativas, fallback explícito y metadata confirmada. Revisión final: `quick-reference.md` §1–§3.

La composición implementada separa marca y acceso a carta; título breve y promoción destacada; categorías con selección semántica y desplazamiento horizontal explícito; tarjetas de producto y pie con acceso del personal. Detalle en una columna móvil/dos de escritorio, regreso a la categoría y nombre/porción/precio/inclusiones siempre visibles. No hay carrusel automático, testimonios, ranking, contador de pedidos ni CTA de compra todavía inexistente.

Capturas en [capturas](capturas/): carta en cuatro anchos y reflujo, foco, detalle agotado en cinco anchos, no encontrado, imagen sintética/fallida, error/reintento y vacío. Las capturas con «Pruebas H3» son fixtures locales temporales, retiradas al finalizar. No hay clientes, teléfonos personales, credenciales ni identidades reales.

Se inspeccionaron visualmente carta móvil y detalle de escritorio; no se detectó desbordamiento ni texto comercial truncado. Pares renderizados comprobados mediante axe: texto oscuro/secundario/dorado sobre superficies claras y texto claro sobre carbón. Foco action sobre claro y surface en pie oscuro; contraste/medidas derivan de los tokens existentes.

**Aceptación manual pendiente:** lector de pantalla real, zoom real del navegador, teléfono/dispositivos del personal y revisión del propietario. Reflujo por viewport y axe no sustituyen esas pruebas. Originales de logo/fotografía y prueba con archivos reales/Storage corresponden a PT-09 y H4.

La pestaña existente del navegador integrado no se inspeccionó ni cambió: su herramienta rechazó la selección por política de URL. La revisión visual se basa en las capturas del entorno de pruebas y la ejecución de Chrome anteriores a ese intento.

## Migraciones y operación remota

Proyecto `geazxsvjkqpzbghlywbw`. Historial acumulado: `20261004000000`, `20261007000000`, `20261007001000`, `20261008000000`, `20261008001000`, `20261008002000`, `20261008003000`. No se reseteó el remoto, reparó historial ni creó personal sintético allí. El diagnóstico [h3-readonly.sql](../../../../supabase/checks/h3-readonly.sql) evita PII y secretos.

`yarn dev`, `yarn build` y `yarn start` siguen utilizando `.env.remote.local`, sin exigir Docker. `.env.local` solo sirve al entorno aislado de pruebas. Las claves y conexiones no se muestran ni versionan. Los comandos CLI deben mantener la verificación del proyecto y el dry-run antes de nuevos cambios.

La referencia se carga en una migración con `ON CONFLICT ... DO NOTHING`, sin sobrescribir ediciones. No volver a ejecutar DDL/editar migraciones aplicadas para mantenimiento. H4 añadirá operaciones auditadas de edición/publicación y Storage; no hay botones administrativos de catálogo en H3. Un borrador no puede consultarse por slug ni por tabla pública.

## Pendientes y transición

- PT-05 bloquea publicar las entradas afectadas: confirmar entrega/recojo, inclusiones y porciones faltantes; se conserva la [matriz](matriz-comercial.md). La confirmación no se obtiene de datos sintéticos.
- PT-09: logo y fotografías originales; fallback útil ya implementado. La ruta de imágenes referencia el futuro bucket público `catalog-media`; su carga/políticas se implementan en H4.
- PT-01/PT-02: dirección y horarios. No se inventaron ni se interpretó horario desconocido como cerrado.
- PT-08/PT-11/PT-13 y preparación real de personal/SMTP/CAPTCHA de H2 siguen pendientes. No bloquean esta lectura pública independiente.
- H4 puede comenzar sobre estas tablas/RPC; H5 usará el mismo snapshot para validar carrito y solicitud por WhatsApp, conservando pedido invitado y borrador local.

Guías primarias consultadas: documentación instalada de Next para Server/Client Components, caché, Route Handlers, Image y Metadata; [funciones Supabase](https://supabase.com/docs/guides/database/functions) y [migraciones](https://supabase.com/docs/guides/deployment/database-migrations). Las reglas y decisiones del propietario prevalecen sobre recomendaciones externas.
