# Hito 4 — Permitir que el responsable actualice la carta

**Actualización DC-22, 13/10/2026:** [personal sin MFA](../diseno-tecnico/19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Versión:** 1.2 · **Fecha:** 8 de octubre de 2026.  
**Destinatarios:** equipo de desarrollo y responsable del negocio.  
**Estado:** implementado y verificado técnicamente; migraciones aplicadas al remoto. Aceptación manual y habilitación con personal/datos comerciales confirmados pendientes. Ver [evidencia](evidencia/h4/README.md) y [operación](evidencia/h4/operacion.md).  
**Guía general:** [Hitos del proyecto](hitos-del-proyecto.md).

## 1. Descripción del objetivo

Dar al responsable un panel sencillo para mantener precios, promociones, opciones, disponibilidad y fotografías sin modificar código o base de datos manualmente. Los cambios deben quedar autorizados, validados y auditados, y llegar a la carta solo cuando cumplen las condiciones comerciales de publicación.

El resultado esperado es un mantenimiento conectado al catálogo real de H3, protegido contra formularios antiguos, operaciones repetidas y publicaciones incompletas. Borrar significa retirar de uso conservando identidad, relaciones e historial; restaurar exige una revisión posterior antes de volver a publicar.

### Alcance del hito

- `/administracion/carta`: listado privado, editor, publicación y conservación del catálogo.
- Mantenimiento de categorías, artículos, precios por modalidad, promociones y opciones con contratos comerciales acotados.
- Subida validada a Storage y asociación de fotografías en una operación posterior.
- Soft delete/restauración de las seis tablas comerciales creadas en H3.
- Auditoría, revisiones e idempotencia en todas las mutaciones que las requieren.

La autorización de atención no permite editar catálogo. H4 no define nuevos combos, equivalencias o sabores: los datos pendientes deben confirmarse con el responsable. Pagos, cobertura y formulario de compra se entregan en H5; conservación de clientes y premios pertenece a H7.

## 2. Tareas del hito

| ID | Tarea | Trabajo concreto | Resultado esperado |
| --- | --- | --- | --- |
| H4-T01 | Precisar operaciones comerciales | Relacionar campos editables, estados, publicación y dependencias de padres; definir contratos estrechos para categorías siguiendo el documento 10. | Lista de operaciones permitidas sin editor SQL o patch arbitrario. |
| H4-T02 | Implementar transacciones de catálogo | Crear/ampliar `update_catalog_item` y mantenimiento de categorías; validar revisión, permisos, precios, promociones y grupos obligatorios. | Cambios atómicos, versionados y auditados. |
| H4-T03 | Implementar conservación comercial | Añadir `soft_delete_entity` y `restore_entity` para los tipos comerciales permitidos; incluir revisión, motivo, idempotencia y estados de restauración seguros. | Retiro/restauración sin pérdida de identidad o publicación implícita. |
| H4-T04 | Implementar lecturas privadas | Listado/detalle mínimo para manager, filtros actuales y eliminados autorizados y carga de revisión para formularios. | Editor muestra datos necesarios sin abrir tablas al navegador. |
| H4-T05 | Construir editor y publicación | Formularios de categorías, artículos, inclusiones, precios/modalidades, promociones y opciones; mostrar pendientes de confirmación antes de publicar. | Responsable puede guardar, revisar y publicar cambios válidos. |
| H4-T06 | Incorporar disponibilidad | Permitir agotamiento/rehabilitación de artículo y opciones, comprobando grupos obligatorios y dependencias comerciales. | Carta refleja disponibilidad sin ofrecer combinaciones inválidas. |
| H4-T07 | Implementar fotografías | Crear bucket/políticas y `POST /api/admin/catalog/images`; validar archivo, subir ruta versionada y asociar con mutación de catálogo. | Foto válida persiste y solo se publica tras asociación confirmada. |
| H4-T08 | Resolver conflictos y reintentos | Mantener UUID/entrada, consultar recibos ante incertidumbre y mostrar conflictos de revisión o asociación de imagen. | Ningún cambio o archivo se da por aplicado por una respuesta incompleta. |
| H4-T09 | Verificar y presentar | Probar rol/permisos, edición simultánea, publicación, imágenes, retirada/restauración y reflejo público. | Evidencia de mantenimiento completo y trazabilidad. |
| H4-T10 | Diseñar el mantenimiento con la skill | Consultar ui-ux-pro-max y patrones privados antes del editor; revisar campos, publicación, disponibilidad, imágenes, versiones y confirmaciones de retiro/restauración. | Panel comprensible y consistente con acciones de negocio distintas. |

Orden recomendado: T01 → T02–T04 → T05–T07 → T08–T09. La subida y la transacción SQL son efectos separados; no mantener una transacción abierta durante una transferencia de archivo.

Ejecutar H4-T10 antes y durante T05–T07; comprobar el resultado en T09. Su identificador añadido conserva los anteriores; no posterga el diseño hasta después de la implementación. Las tareas exclusivamente de backend mantienen sus pruebas y no requieren búsqueda visual.

## 3. Requerimientos técnicos

### 3.1. Operaciones, versiones y conservación

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H4-RT01 | Autorización efectiva | Manager activo/no eliminado y AAL2 comprobados en servidor y RPC para cada lectura/mutación. Atención, visitante y usuario cliente reciben denegación también por llamada directa. |
| H4-RT02 | Contrato comercial acotado | `updateCatalogItemAction` → `update_catalog_item`, con artículo, `expectedRevision`, patch validado y `operationId`. Mantenimiento de categorías usa una interfaz explícita del mismo dominio; no acepta entidad, tabla o columna libre. |
| H4-RT03 | Revisión de dependencias | Cambio de precio/promoción/grupo/opción aumenta la revisión del artículo padre. Formulario con versión anterior recibe `CONFLICT`; no sobrescribir el precio más reciente ni mezclar dos patches. |
| H4-RT04 | Publicación comprobada | Validar rama activa/no eliminada, porción/inclusiones confirmadas, precio online verificado y grupos obligatorios realizables. C01 sigue fuera de venta web; P05 solo admite entrega. `source_price_cents` no autoriza publicar. |
| H4-RT05 | Promociones coherentes | Tipo promotion, condiciones/días/fechas verificables, tiempo Lima; `previous_price_cents` se muestra únicamente con `comparison_verified=true` y comparación válida. No inferir ahorro comparando productos diferentes. |
| H4-RT06 | Idempotencia y auditoría | Autorizar antes del replay; hash canónico y recibo por actor/UUID. Cambio, revisión, auditoría y recibo en la misma transacción. `get_operation` conserva el significado de `not_found`. |
| H4-RT07 | Contratos de conservación | `softDeleteEntityAction` → `soft_delete_entity` y `restoreEntityAction` → `restore_entity`: `entityType` de lista cerrada, UUID, revisión, motivo 10–500 y UUID de operación. No SQL dinámico a partir de entradas libres. |
| H4-RT08 | Metadatos e identidad | Eliminación mantiene claves únicas/FKs, completa los tres campos de borrado y aumenta revisión/updated_at. No DELETE físico ni cascada que marque hijos como eliminados; las lecturas filtran los ancestros. |
| H4-RT09 | Restauración segura | Categoría inactiva; artículo draft/online deshabilitado; precios sin verificar; promoción deshabilitada/comparación no verificada; grupos inactivos/no verificados y opciones no disponibles/no verificadas. Revisar toda la rama antes de publicar. |
| H4-RT10 | Bloqueos consistentes | Respetar orden configuración → categoría → artículo → precio/promoción/grupo → opción. Resolver cambios y conservación concurrentes dentro de las transacciones sin esperar interacción humana. |

### 3.2. Recursos y frontend privado

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H4-RT11 | Acceso privado a catálogo | DAL `server-only`, proyecciones mínimas y opción de incluir eliminados solo para manager. No permitir lectura directa ni devolver actor/motivo de borrado por el endpoint público. |
| H4-RT12 | Validación de imágenes | Handler manager activo; JPEG, PNG o WebP por contenido real, máximo 3 MiB y dimensiones hasta 4096×4096. Límite total de petición 4 MiB, comprobado al leer bytes; rechazar tipos falsos y exceso incluso sin Content-Length fiable. |
| H4-RT13 | Storage separado de SQL | Bucket público `catalog-media`, escritura autorizada y ruta `items/{id}/{uuid}.{ext}`. Subida devuelve referencia, no publicación; asociación posterior por revisión/UUID. No incrementar globalmente el límite de Server Actions para subir imágenes. |
| H4-RT14 | Archivos y reintentos | Antes de repetir una asociación incierta consultar recibo/estado. Limpieza de huérfanos comprueba referencias actuales y recuperables de soft delete; no elimina archivos todavía referenciados ni presume rollback de Storage por fallo SQL. |
| H4-RT15 | Formularios privados | `/administracion/carta` protegido y no-store; separar componentes de interacción, schemas, dominio y DAL. Conflicto permite revisar datos actuales sin perder silenciosamente el borrador del editor. |
| H4-RT16 | Pruebas necesarias | Integración SQL de publicación/permisos/carreras/conservación; pruebas del handler de archivos y E2E cambio → carta pública. Lint, TypeScript y build del hito con evidencia. |

### 3.3. Diseño UX/UI y sistema visual

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H4-RT17 | Reglas y skill aplicables | Leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md); usar `ui-ux-pro-max` y registrar encaje/recomendaciones, sin depender de una ruta personal ni sustituir decisiones por una plantilla. |
| H4-RT18 | Patrón visual del hito | Editor comparte campos/acciones; interfaz distingue guardar/publicar y foto subida/asociada, identifica versiones en conflicto y consecuencias de retiro/restauración. Motivo, permisos y estado seguro son los del contrato. |

Los valores visuales se consultan en el sistema canónico. La aceptación exige estados reales del alcance, anchos definidos allí y evidencia manual/automática pertinente; los recursos originales siguen pendientes en PT-09 cuando no estén disponibles. Esta ampliación no crea interfaces ni afirma pruebas ejecutadas.

## 4. Requerimientos funcionales de H4

**H4-RF** describe el mantenimiento previsto en el diseño. RF-01–RF-05, RF-16 y RF-18 del producto se comprueban también a través de los resultados públicos de estos cambios.

| ID | Requerimiento funcional | Comportamiento observable |
| --- | --- | --- |
| H4-RF01 | Mantener carta desde el panel | El responsable edita datos permitidos y obtiene confirmación de la operación aplicada. |
| H4-RF02 | Confirmar precio por modalidad | Puede revisar entrega/recojo y marcar verificación explícita; una cifra de referencia no se publica como precio confirmado. |
| H4-RF03 | Controlar publicación | Guardar borrador no publica; publicar informa campos o condiciones que faltan antes de aplicar el cambio. |
| H4-RF04 | Actualizar promociones | Responsable activa/desactiva, revisa vigencia y comparación; la carta muestra solo promociones que cumplen las condiciones. |
| H4-RF05 | Marcar agotamiento | Un producto u opción pasa a agotado; no se sustituyen opciones ni se ofrece un grupo obligatorio imposible. |
| H4-RF06 | Cambiar fotografía | Archivo inválido se rechaza con error claro; archivo válido aparece en la carta después de asociarse al artículo. |
| H4-RF07 | Retirar sin perder historial | El responsable indica motivo y retira un registro; desaparece del uso público conservando referencias, versión e historial. |
| H4-RF08 | Restaurar para revisión | Registro restaurado conserva identidad y sigue sin publicación automática. La interfaz muestra las revisiones necesarias antes de habilitarlo. |
| H4-RF09 | Resolver edición simultánea | Segundo formulario antiguo muestra conflicto y datos actuales; nunca reemplaza silenciosamente lo guardado por otra persona. |
| H4-RF10 | Reintentar con seguridad | Una respuesta perdida se identifica como incierta y se recupera con el mismo UUID; el responsable no aplica dos veces el cambio. |
| H4-RF11 | Distinguir efectos del mantenimiento | El responsable entiende qué se guardó, publicó, asoció, retiró o restauró; un archivo subido o registro restaurado no se anuncia como contenido público activo. |

## 5. Definition of Done

Los puntos marcados tienen evidencia automática y revisión técnica en el [reporte H4](evidencia/h4/README.md). Los pendientes manuales se conservan explícitos; las fixtures no confirman datos del negocio.

### Mantenimiento y seguridad

- [x] Manager con autorización vigente mantiene las seis entidades comerciales mediante operaciones restringidas; atención/cliente/anónimo no pueden editarlas.
- [x] Cada cambio usa revisión y UUID; cambios de hijos actualizan la revisión del artículo y quedan auditados.
- [x] Precio por modalidad, vigencia, inclusiones y opciones se conservan sin equivalencias inventadas; C01/P05 mantienen sus restricciones.
- [x] Publicación falla ante precio no verificado, padre retirado o grupo obligatorio inválido, con error accionable.
- [x] Formulario antiguo produce conflicto y reintento del mismo cambio no duplica efectos.
- [x] Agotamiento de artículo/opción se refleja en nueva consulta pública y no deja una selección obligatoria imposible comprable.

### Fotografías y conservación

- [x] Subidas verifican contenido, tipo, bytes y dimensiones; pruebas incluyen exceso durante lectura y respuesta segura de límite.
- [x] Solo manager activo sube/asocia imágenes; asociación usa revisión y recibo, independientemente del efecto Storage.
- [x] Archivo subido pero no asociado no modifica la carta; fallo de asociación tiene recuperación y tratamiento de huérfanos seguro.
- [x] Eliminación exige motivo, revisión y permisos; conserva claves/FKs y oculta los descendientes mediante filtros.
- [x] Restauración conserva UUID y deja cada entidad en su estado seguro; restaurar categoría no publica hijos automáticamente.
- [x] Eliminación/restauración simultánea o repetida produce un solo efecto autorizado; no se utiliza DELETE físico.
- [x] La limpieza de archivos conserva referencias de registros eliminados recuperables.
- [x] Lint, TypeScript, build y pruebas pertinentes pasan; demo comprueba cambios en panel y carta pública con evidencia de auditoría.

### Diseño UX/UI y marca

- [x] Se leyeron reglas del proyecto, UX/UI y sistema canónico; se aplicó `ui-ux-pro-max` al trabajo visual y se registraron consultas/recomendaciones aplicadas o descartadas con motivo.
- [x] Editor y confirmaciones distinguen guardado/publicación, subida/asociación y restauración/reactivación; conflictos conservan entrada revisable y no anuncian éxito sin resultado confirmado.
- [x] Se revisaron los anchos de evidencia del sistema visual, sin desbordamiento involuntario ni acciones esenciales ocultas; no hay colores/medidas alternativos duplicados en componentes.
- [ ] Teclado, foco completamente visible, labels/errores, contraste renderizado, zoom/reflujo y lector se comprobaron en el alcance; resultado y casos no ejecutados están identificados.
- [x] Capturas y reporte identifican versión/entorno y datos sintéticos. Evidencia específica: Editor, fotografía subida no asociada, conflicto, publicación denegada, retiro y restauración segura.

### Escenarios críticos y evidencia

| Referencia | Escenario que se debe comprobar | Evidencia requerida |
| --- | --- | --- |
| CT-15, CT-16 | Dos editores y publicación con dependencias inválidas. | Integración/E2E con revisiones, conflicto y estado final. |
| CT-20, CT-36, CT-39 | Imagen inválida, límites, asociación incierta, huérfano y comparación promocional no verificada. | Casos del handler/Storage y transacción de asociación; carta antes/después. |
| CT-03; mecanismo de CT-28 | Replay y pérdida de respuesta de una mutación autorizada. | Recibo único y recuperación con UUID original. |
| CA-10, CA-18; CT-22 | Precio/promoción/agotamiento y vigencia Lima reflejados públicamente. | Fixtures temporales y resultados de `read_catalog`. |
| Documento 10: conservación | Padres retirados, motivo obligatorio, claves únicas retenidas, restauración no publicada. | Matriz SQL por entidad y E2E de retiro/revisión/publicación explícita. |

La prueba técnica puede realizarse con catálogo sintético. Publicar una modificación comercial real requiere confirmar el dato correspondiente; PT-05 no se resuelve marcando automáticamente todos los precios como verificados.

## 6. Dependencias y pendientes

**Requisitos previos:** [H2](02-hito-2-acceso-del-personal.md) para permisos/permisos/recibos/auditoría y [H3](03-hito-3-catalogo-publico.md) para tablas/proyección pública. Las ampliaciones de contrato de categorías/conservación se versionan y enlazan al diseño; no agregan tablas ajenas al inventario de 18.

| Pendiente | Trabajo afectado | Condición de cierre o bloqueo |
| --- | --- | --- |
| PT-05: modalidades/inclusiones/equivalencias | T01–T02, T05–T06. | Bloquea publicación de datos afectados; el editor debe permitir identificarlos, sin decidirlos por el negocio. |
| PT-09: imágenes y recursos autorizados | T07. | Bloquea asociación de recursos reales no confirmados; pruebas usan archivos sintéticos. |
| PT-08: personal autorizado | T04–T09 en operación real. | H2 provee permisos técnicos; cuentas reales requieren autorización del responsable. |
| PT-11 y PT-13 | Conservación de clientes/resolución de canjes en H7. | No impiden mantenimiento técnico comercial; no crear purgas o restituciones de premios en H4. |

**Transición:** [H5](05-hito-5-pedido-por-whatsapp.md) valida el carrito contra este catálogo mutable; cambios de revisión, retirada y agotamiento obligan a revisar el pedido antes de preparar WhatsApp. H7 amplía conservación administrativa a entidades privadas con sus protecciones particulares.

## 7. Referencias

- [Reglas generales](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md).
- [Identidad visual y cobertura por vistas](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md) e [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md).

- [Guía general de hitos](hitos-del-proyecto.md).
- [Seguridad y permisos](../diseno-tecnico/04-autenticacion-seguridad.md).
- [Contratos de catálogo e imágenes](../diseno-tecnico/05-contratos-y-operaciones.md).
- [Frontend y estados](../diseno-tecnico/06-frontend-y-estado.md).
- [Pruebas CA/CT](../diseno-tecnico/08-pruebas-y-aceptacion.md).
- [Diccionario y conservación](../diseno-tecnico/10-tablas-db.md).
- [Flujo funcional](../diseno-tecnico/11-diagrama-flujo.md).
- [Navegación](../diseno-tecnico/12-flujo-navegacion.md).
- [Registro de pendientes](../diseno-tecnico/README.md).

La implementación y sus pruebas están registradas en el reporte H4. No equivalen a aceptación del propietario ni confirman precios, recursos o identidades comerciales pendientes; la operación real requiere el acceso autorizado de H2.
