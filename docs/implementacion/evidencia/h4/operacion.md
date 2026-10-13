# H4 — Contratos y operación del mantenimiento de carta

**Fecha:** 8 de octubre de 2026.  
**Alcance:** implementación de [H4](../../04-hito-4-administracion-del-catalogo.md); [evidencia y pendientes](README.md). No implementa pedidos ni fidelización.

## Acceso y responsabilidades

`/administracion/carta` requiere cuenta de personal activa, no retirada, rol `manager` y sesión AAL2. El layout, la página, las Server Actions, el handler de fotografías y las RPC vuelven a comprobar los permisos actuales. Una cuenta desactivada o degradada no recupera acceso mediante un recibo anterior. Atención, cliente sin rol y visitante no mantienen la carta.

Las seis tablas comerciales conservan RLS y propietario `app_owner` sin login. No hay CRUD directo para `anon`, `authenticated` o `service_role`. La clave privilegiada solo se usa en el servidor para eliminar un objeto Storage después de reservar su limpieza; no se utiliza para editar el catálogo ni conceder roles. El bucket público contiene únicamente recursos de catálogo, nunca fotografías o datos personales de clientes.

`get_admin_catalog(p_include_deleted boolean=false)` devuelve un snapshot con `categories`, `items`, `prices`, `promotions`, `groups` y `choices`. La pantalla solicita los retirados y el filtro local permite revisarlos. Cada colección se ordena de forma estable. Zod valida estrictamente los campos comerciales y metadatos necesarios para mantener y restaurar; no incluye filas del esquema privado.

**Convención específica del editor:** el sobre de operación usa camelCase; los campos comerciales internos y los patches usan snake_case, igual que el diccionario y los formularios. Se comparte una sola definición validada por entidad, sin convertir nombres dinámicamente. El DTO público de `read_catalog` sigue en camelCase y omite referencias fuente, verificaciones internas, actor y motivo de retirada. Esta excepción no cambia los contratos del comprador.

## Crear y editar

`saveCatalogEntityAction` recibe `{entityType, entityId, expectedRevision, patch, operationId}`. `entityType` pertenece a la lista cerrada siguiente. Para crear, `expectedRevision=0`, UUID nuevo generado una vez en el navegador y campos obligatorios validados; para editar, revisión positiva de la lectura actual. La promoción utiliza `item_id` como identidad y PK/FK, sin UUID independiente.

| Entidad | RPC de edición | Campos admitidos en patch |
| --- | --- | --- |
| `category` | `update_catalog_category` | `name`, `slug`, `sort_order`, `active`. |
| `catalog_item` | `update_catalog_item` | `name`, `slug`, `kind`, `portion_label`, `inclusions`, `description`, `image_path`, `online_enabled`, `content_verified`, `publication_status`, `availability`, `sort_order`. |
| `catalog_price` | `update_catalog_price` | `price_cents`, `verified`. |
| `promotion` | `update_catalog_promotion` | `enabled`, `starts_at`, `ends_at`, `weekdays`, `previous_price_cents`, `comparison_verified`. |
| `option_group` | `update_catalog_option_group` | `name`, `min_choices`, `max_choices`, `active`, `verified`, `sort_order`. |
| `option_choice` | `update_catalog_option_choice` | `label`, `extra_price_cents`, `available`, `verified`, `sort_order`. |

`updateCatalogItemAction` delega al mismo caso de uso. Las RPC hijas reciben `p_entity_id`, `p_expected_revision`, `p_patch`, `p_operation_id`; la de artículo usa `p_item_id`. `create_catalog_entity` admite solo esas seis entidades y los campos de creación: añade `category_id` al artículo, `item_id`/`mode` al precio, `item_id` al grupo y `group_id` a la opción. La promoción recibe el artículo como `p_entity_id`. No se permite cambiar padres o modalidad durante una edición; el mantenimiento puede retirar la variante y crear otra cuando sea necesario, conservando claves únicas y referencias existentes.

No se aceptan columnas arbitrarias, nombres de tablas, revisión propuesta, actor, metadatos de borrado, `source_ref` ni `source_price_cents`. La SQL dinámica interna solo utiliza tablas de lista cerrada, columnas previamente validadas y valores ligados. La creación permanece sin publicación automática; las confirmaciones de negocio son explícitas.

Dinero en céntimos enteros PEN. El formulario convierte soles con hasta dos decimales sin redondear valores inválidos; un recargo de opción puede ser cero, un precio debe ser positivo. Vigencias se guardan UTC; campos de fecha/hora y días se presentan en Lima. Días sin selección significan todos los días. No se deducen horarios, inclusiones, modalidades ni equivalencias a partir de nombres.

## Publicación y confirmaciones

`content_verified` registra confirmación explícita de porción e inclusiones. Cambiar nombre, tipo, porción, inclusiones, descripción o categoría invalida esa confirmación; restaurar también. El checkbox del editor se desmarca al editar contenido. Un patch con contenido nuevo y `content_verified=true` es una reconfirmación expresa: el trigger invalida primero y la misma transacción confirma después. Por ello la revisión final puede avanzar más de una unidad; siempre se usa el valor devuelto por el servidor.

Cambiar importe de precio, composición de grupo o nombre/recargo de opción sin reconfirmación explícita deja `verified=false`. El editor desmarca su confirmación al cambiar esos campos. Precio fuente no es precio confirmado; no aparece como importe editable preaprobado.

Publicar requiere categoría activa/vigente, artículo habilitado, porción e inclusiones confirmadas y al menos un precio online verificado. La integridad de promoción y grupos obligatorios se comprueba en SQL. No se permite agotar/retirar la última opción utilizable de un grupo obligatorio de un producto publicado disponible; primero debe pasar el producto a agotado o borrador y revisar su composición. El agotado publicado permanece visible en la carta con su estado.

Comparaciones anteriores se invalidan por cambios efectivos de precio, contenido, grupo u opción. Su reactivación requiere volver a confirmar la comparación y cumplir las restricciones, no inferir ahorro por un precio fuente. Vigencia de promociones se evalúa en cada lectura con tiempo del servidor y Lima. C01 no se habilita online; P05 solo admite entrega. La leyenda retirada no se reintroduce. Las cantidades fuente de alitas se conservan.

Las restricciones diferibles se fuerzan antes de guardar recibo y auditoría. Un fallo revierte toda la mutación SQL. El editor muestra requisitos pendientes y un error accionable; permite guardar un borrador y conserva la entrada ante conflicto o fallo. H3 consulta sin caché persistente: una consulta pública nueva refleja los cambios, sin actualización optimista de la carta ni Realtime.

## Revisiones, auditoría y resultados inciertos

Cada operación valida identidad antes del replay, normaliza entrada y toma el bloqueo del UUID por actor. El orden comercial es operación → configuración singleton → categoría → artículo → precios/promoción/grupos ordenados → opciones. La serialización por configuración simplifica la coherencia del catálogo pequeño y la coordinación con limpieza; puede limitar concurrencia futura, sin añadir infraestructura al MVP. No se mantiene ningún bloqueo SQL durante Storage ni interacción humana.

Una edición con revisión antigua devuelve `CONFLICT`. El servidor no mezcla patches. Cambios de hijos avanzan también la revisión del artículo; cambios de opción alcanzan grupo y artículo. Cambio, restricciones, revisión, recibo y auditoría se confirman juntos. La auditoría almacena campos cambiados, revisiones y motivo de conservación, sin copiar el contenido completo del producto.

Mismo actor/UUID/tipo/entrada devuelve replay; entrada distinta produce `IDEMPOTENCY_CONFLICT`. Un no-op conserva revisión y obtiene solo recibo, sin auditoría de una mutación inexistente; también cuando dos fechas representan el mismo instante. `get_operation` conserva `recorded`/`not_found`, efecto original y revisión actual. Un timeout puede suceder después del commit: no equivale a rollback.

El editor conserva en `sessionStorage` un journal mínimo: actor, entidad, revisión, UUID, tipo, hash y tiempo; no persiste patch, motivo, credenciales ni datos comerciales completos. Se guarda antes de llamar al servidor. Una respuesta incierta exige «Comprobar resultado». Un recibo confirmado permite cargar la versión actual; `not_found` conserva UUID y hash para reintentar la misma entrada. Cambiar de registro se bloquea mientras hay una operación sin resolver. Si se recarga la pestaña y falta la entrada original, se conserva la referencia para conciliación; no se inventa otro cambio ni se borra el identificador para desbloquearlo.

«Descartar cambios y cargar versión actual» es explícito y se deniega si hay un UUID pendiente. La sesión se limpia al cerrar acceso del personal sin afectar el futuro borrador invitado. Todas las acciones asíncronas tienen carga contextual y protección inmediata contra doble ejecución; selección, filtros y navegación normal no muestran carga artificial.

## Retirar y restaurar

Se reutilizan `soft_delete_entity` y `restore_entity` con tipo cerrado, UUID, revisión, motivo recortado de 10–500 caracteres y UUID de operación. Fecha y autor provienen del servidor. Retirar conserva fila, UUID, FK, unicidad e historial; no marca en cascada los hijos como borrados. La proyección pública filtra toda la rama. Si retirar un hijo deja un producto publicado inconsistente, la operación falla hasta revisar el producto.

Restaurar exige padres vigentes y deja el registro en el estado seguro del diccionario. Restaurar categoría la deja inactiva y sus artículos vigentes en borrador, offline y sin confirmación de contenido. Restaurar artículo lo deja en borrador/offline, invalida sus precios, deshabilita promoción/comparación, desactiva grupos y deja opciones no disponibles/no verificadas. Cada hijo conserva identidad y su propio borrado anterior. Restaurar grupo u opción aplica también sus flags seguros; nunca publica la rama por sí solo.

El resultado solicita revisar descendientes y confirmar/publicar explícitamente. El motivo anterior queda en auditoría al restaurar; los tres metadatos de borrado se limpian en la fila. Motivo, retiro y restauración se prueban con replay/concurrencia y padre retirado. No hay endpoints de DELETE físico de registros comerciales.

## Fotografías

| Operación | Entrada | Resultado comprobado |
| --- | --- | --- |
| `POST /api/admin/catalog/images` | Multipart `itemId`, `uploadId`, un `file`. Manager/AAL2, mismo origen. | `{imagePath}` después de subir; no asocia ni publica. |
| `GET /api/admin/catalog/images?imagePath=…` | Ruta validada y sesión manager/AAL2. | `{exists:boolean}` mediante RPC; no devuelve datos privados de Storage. |
| `DELETE /api/admin/catalog/images` | JSON `{imagePath,operationId}`; manager/AAL2 y mismo origen. | `{removed:true}` después de reserva SQL y eliminación Storage. |

Handler Node y `no-store`, cuerpo máximo 4 MiB contado durante lectura aunque falte/mienta Content-Length; archivo hasta 3 MiB. Sharp decodifica JPEG/PNG/WebP estáticos, verifica tipo declarado, dimensiones hasta 4096×4096 y reencodifica quitando EXIF. Archivos truncados, SVG, texto renombrado y exceso se rechazan; 413 se explica como límite, sin incrementar el límite de Server Actions. Dependencia Sharp fijada a 0.35.5, compartida con la versión instalada de Next para evitar cargar dos implementaciones nativas incompatibles.

Storage usa bucket `catalog-media` público, límites de tamaño/MIME y ruta nueva `items/{itemUUID}/{uploadUUID}.{ext}`. Subida con JWT del responsable y autorización SQL de artículo/categoría vigentes. La política permite INSERT de manager/AAL2; no UPDATE, upsert ni DELETE para sesiones de navegador. **La decodificación de bytes corresponde al handler**; las políticas Storage controlan identidad/ruta y el bucket valida el MIME declarado, sin atribuirles inspección de píxeles. El personal autorizado utiliza el panel para la subida validada.

Asociar usa `update_catalog_item`, revisión y UUID propios; el trigger comprueba ruta del mismo artículo, existencia de objeto y ausencia de reserva de limpieza. Un error SQL deja el archivo subido y la asociación anterior intacta. Si una respuesta de asociación se pierde, se resuelve por el journal/recibo del editor; no se anuncia una publicación por subir el archivo.

El journal de foto conserva actor, artículo, upload UUID, ruta, hash de bytes y UUID de limpieza si existe. No almacena archivo ni contenido personal. Subida perdida se consulta por la misma ruta; el usuario debe conservar/reseleccionar el archivo original para reintentar sin crear otra identidad. `upsert=false` evita reemplazo silencioso; un archivo existente se comprueba, no se sobrescribe. Cierre de sesión limpia esta referencia.

`prepare_catalog_image_cleanup` toma el mismo bloqueo de configuración que la asociación y rechaza **cualquier referencia**, incluso de un artículo retirado recuperable. Guarda recibo y auditoría de reserva; la ruta queda permanentemente excluida de nuevas asociaciones/subidas. Después, fuera de SQL, el servidor elimina el objeto con cliente privilegiado aislado. La reserva no demuestra eliminación física: si Storage falla, se reintenta DELETE con mismo UUID/ruta. En una carrera asociación/limpieza solo una puede ganar. Una transferencia iniciada antes de la reserva podría dejar un objeto sin asociación; la misma limpieza se puede repetir, y esa ruta no se reutiliza.

No hay borrado masivo de originales ni proceso automático de purga. Recursos referenciados, incluidos los retirados recuperables, se conservan. Recursos reales y derechos de uso requieren PT-09; los archivos de pruebas son imágenes abstractas sintéticas y se eliminan únicamente del entorno local.

## Despliegue y continuidad

Migraciones `20261008004000_catalog_admin.sql` y `20261008005000_catalog_media.sql`, reconstruibles mediante CLI. El remoto autorizado es `geazxsvjkqpzbghlywbw`; verificar referencia e historial, ejecutar dry-run y aplicar únicamente migraciones nuevas, sin reset ni reparación del historial. No editar una migración aplicada para mantenimiento posterior. Diagnóstico sin PII: [h4-readonly.sql](../../../../supabase/checks/h4-readonly.sql). Generar tipos desde remoto con `yarn db:types` después de aplicar y compilar con Yarn.

`yarn dev/build/start` conservan `.env.remote.local` y Supabase remoto. Pruebas destructivas requieren comandos explícitos y URL local; no se suben fixtures, usuarios de prueba ni fotos sintéticas al remoto. H4 no confirma PT-05 ni crea personal real por inferencia. Un responsable autorizado debe disponer del acceso H2 y completar MFA para operar el panel. Pedidos/fidelización continúan pausados hasta sus hitos; PT-08, PT-11 y PT-13 conservan su alcance y bloqueo respectivos.
