# Hito 3 — Mostrar la carta

**Versión:** 1.2 · **Fecha:** 8 de octubre de 2026.  
**Destinatarios:** equipo de desarrollo y responsable del negocio.  
**Estado:** implementado y conectado al Supabase remoto; verificación técnica aprobada, aceptación manual y confirmaciones comerciales PT-05 pendientes. Ver [evidencia de H3](evidencia/h3/README.md) y [matriz comercial](evidencia/h3/matriz-comercial.md).  
**Guía general:** [Hitos del proyecto](hitos-del-proyecto.md).

## 1. Descripción del objetivo

Permitir que cualquier visitante consulte productos y promociones desde una carta conectada a Supabase, con porciones, inclusiones, precios confirmados y disponibilidad comprensibles. El hito transforma las referencias comerciales del análisis en datos versionados y en una lectura pública limitada a lo que realmente puede publicarse.

El resultado esperado es la página principal y el detalle de producto sin login. La base conserva datos fuente y pendientes para revisión interna; la vista pública no los presenta como precios válidos de compra. La compra completa se incorpora en H5 y el mantenimiento desde el panel en H4.

### Alcance del hito

- Seis tablas comerciales nuevas: `categories`, `catalog_items`, `catalog_prices`, `promotions`, `option_groups` y `option_choices`; además se consulta `business_settings`, cuyo singleton ya corresponde a H2.
- Carga inicial de siete categorías, 24 entradas C01–C24 y cinco promociones P01–P05, conservando identidades de referencia.
- Proyección SQL `read_catalog`, DAL pública y `GET /api/catalog`.
- Rutas `/` y `/productos/[slug]`, navegación por categorías y estados vacío, agotado, imagen ausente y error.
- Filtros de publicación, confirmación y borrado lógico desde la primera lectura.

No inventar opciones intercambiables, equivalencias de promociones o precios por modalidad. Los campos de pagos/zonas del DTO se completan al migrar esas tablas en H5; antes se representan según el contrato como información todavía no disponible, sin habilitar checkout.

## 2. Tareas del hito

| ID | Tarea | Trabajo concreto | Resultado esperado |
| --- | --- | --- | --- |
| H3-T01 | Preparar trazabilidad comercial | Relacionar categorías, C01–C24/P01–P05 y fuentes con campos del modelo; identificar inclusiones/modalidades pendientes. | Matriz de carga sin inferencias comerciales. |
| H3-T02 | Crear migraciones del catálogo | Añadir las seis tablas nuevas con claves, relaciones, revisiones, soft delete, restricciones, índices y permisos del documento 10. | Conjunto comercial íntegro y reproducible. |
| H3-T03 | Crear la carga inicial | Usar UUID estables y `source_ref`; separar datos de referencia y precios verificados. Mantener pendientes en estado seguro. | 29 artículos de referencia sin duplicados al repetir la carga permitida. |
| H3-T04 | Implementar la proyección pública | Crear `public.read_catalog()` con SQL estático, filtros explícitos y snapshot único; incorporar DTO público y tiempo del servidor. | Lectura consistente que excluye campos privados y datos no publicables. |
| H3-T05 | Conectar DAL y handler | Usar cliente público sin cookies; Server Components llaman DAL directamente y el navegador utiliza `GET /api/catalog` cuando necesita refrescar. | Contrato único sin llamadas HTTP internas innecesarias. |
| H3-T06 | Construir carta y categorías | Mostrar productos, promociones, precio/porción/inclusiones confirmados y estados de disponibilidad; diseñar uso móvil y teclado. | Carta navegable sin registro. |
| H3-T07 | Construir detalle y estados | Resolver slug publicable, imagen/fallback, opciones confirmadas y no encontrado; diferenciar error de servicio de catálogo vacío. | Información completa y recuperación comprensible. |
| H3-T08 | Preparar imágenes y metadata | Consumir referencias de imágenes válidas disponibles; metadata/SEO público con datos reales y controles de accesibilidad. | Recursos optimizados y contenido indexable sin inventar información del negocio. |
| H3-T09 | Verificar filtros y datos | Probar publicación, padres eliminados, agotados, vigencia Lima y acceso directo denegado a tablas. | Evidencia de carta correcta y segura. |
| H3-T10 | Presentar y documentar | Mostrar navegación con datos de prueba confirmados, documentar diferencias respecto de producción y entregar base a H4/H5. | Aceptación técnica separada de confirmación comercial. |
| H3-T11 | Aplicar marca y revisar carta con la skill | Usar ui-ux-pro-max, sistema canónico y wireframes antes de construir carta/detalle; revisar foto, porción, inclusiones, precio, categorías y estados reales. | Carta reconocible, comprensible y coherente en dispositivos. |

Orden recomendado: T01 → T02–T03 → T04–T05 → T06–T08 → T09–T10. Las pantallas consumen la proyección real; fixtures visuales aisladas no bastan para cerrar el hito.

Ejecutar H3-T11 antes y durante T06–T08; comprobar el resultado en T09–T10. Su identificador añadido conserva los anteriores; no posterga el diseño hasta después de la implementación. Las tareas exclusivamente de backend mantienen sus pruebas y no requieren búsqueda visual.

## 3. Requerimientos técnicos

### 3.1. Datos y lectura pública

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H3-RT01 | Modelo comercial vigente | Campos, tipos PostgreSQL, FKs, CHECK, índices y revisiones del documento 10. No cambiar Auth/Storage administrados ni crear tablas de pedidos. |
| H3-RT02 | Dinero y modalidades | Céntimos enteros de PEN; `catalog_prices` único por artículo/modalidad incluso si se elimina. `source_price_cents` es referencia interna; no sustituye precio online confirmado. `dine_in` no habilita compra web. |
| H3-RT03 | Identidades estables | C01–C24/P01–P05 en `source_ref`, UUID/slug controlados y carga versionada. No deduplicar productos distintos por nombre o precio parecido. Datos sintéticos separados de referencias productivas. |
| H3-RT04 | Soft delete completo | Seis tablas nuevas con `deleted_at`, `deleted_by`, `delete_reason`; FK al personal, motivo de 10–500 caracteres y consistencia de los tres campos. Conservar claves únicas y relaciones; no DELETE/cascadas físicas. |
| H3-RT05 | Lectura por RPC | RLS activado y sin CRUD directo para `anon`/`authenticated`. `read_catalog` es `STABLE`, `SECURITY DEFINER`, `search_path=''`, sin parámetros, proyección JSON de una única sentencia y ejecución concedida explícitamente. |
| H3-RT06 | Publicación por rama completa | Filtrar categoría activa/no eliminada, artículo publicado/online habilitado/no eliminado, precios online verificados/no eliminados, promoción habilitada/vigente y opciones/grupos válidos no eliminados. Comprobar ancestros explícitamente dentro de la RPC. |
| H3-RT07 | Datos seguros del DTO | No exponer costos del premio, precio fuente, roles, perfiles, revisiones privadas de personal ni motivos/actores de borrado. DTO incluye los campos comerciales y revisiones públicas definidos en contratos. |
| H3-RT08 | Vigencia y tiempo | Evaluar horarios/días y promociones con `serverNow` y `America/Lima`; comienzo inclusivo y final exclusivo. Fechas nulas no inventan caducidad; horario no confirmado resulta `unknown`, distinto de pausado/cerrado. |
| H3-RT09 | Datos de configuración progresivos | Leer singleton existente; ausencia devuelve `CONFIG_NOT_READY`. Pagos/zonas se amplían en H5 mediante migración/contrato compatible. Flags desactivados no ocultan por sí solos una carta publicable. |

### 3.2. Pantallas e integración

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H3-RT10 | Responsabilidades de frontend | Rutas en `src/app`, módulo catálogo con contratos/lógica pura/DAL de servidor separados; interacción de categorías en componentes cliente solo si se necesita. Conservar alias `@/*`. |
| H3-RT11 | Sin sesión ni caché heredada | Cliente de datos público sin Auth/cookies y lecturas no-store conforme arquitectura. Cambio de catálogo se observa en nueva consulta; no compartir datos privados por cachear componentes. |
| H3-RT12 | Rutas publicables | `/` muestra carta; `/productos/[slug]` solo resuelve el artículo autorizado en la misma proyección. Borrador/eliminado no se filtra mediante una segunda consulta abierta a tabla. |
| H3-RT13 | Imágenes y recursos | `image_path` referencia Storage, sin FK artificial; fallback cuando falta recurso. Aplicar optimización, tamaños y textos alternativos pertinentes; no usar capturas de WhatsApp como único contenido de la carta. |
| H3-RT14 | Accesibilidad y SEO | Semántica, teclado, foco visible, contraste y lectura móvil; datos confirmados en metadata. No publicar dirección, valoraciones o datos estructurados inventados. SEO privado/pedido corresponde a sus hitos. |
| H3-RT15 | Errores reconocibles | Diferenciar respuesta vacía, configuración incompleta y `SERVICE_UNAVAILABLE`; permitir reintentar sin solicitar login. No mostrar SQL interno o datos no autorizados en errores. |
| H3-RT16 | Verificación | Pruebas de filtros y DTO en integración, dinero/vigencias en dominio y E2E carta/detalle. Reset/carga/tipos, lint, TypeScript y build aplican al trabajo real del hito. |

Para probar soft delete en H3 se usan fixtures internas autorizadas de integración. Los botones, auditoría de mantenimiento y restauración supervisada del catálogo se aceptan en H4; el filtro de lectura ya debe proteger H3.

### 3.3. Diseño UX/UI y sistema visual

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H3-RT17 | Reglas y skill aplicables | Leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md); usar `ui-ux-pro-max` y registrar encaje/recomendaciones, sin depender de una ruta personal ni sustituir decisiones por una plantilla. |
| H3-RT18 | Patrón visual del hito | Carta/detalle reutilizan tokens y patrones; fotografía con dimensiones reservadas, fallback y texto comercial completo. Categorías/volver accesibles, sin carrusel automático, ranking inventado o registro obligatorio. |

Los valores visuales se consultan en el sistema canónico. La aceptación exige estados reales del alcance, anchos definidos allí y evidencia manual/automática pertinente; los recursos originales siguen pendientes en PT-09 cuando no estén disponibles. Esta ampliación no crea interfaces ni afirma pruebas ejecutadas.

## 4. Requerimientos funcionales de H3

El prefijo **H3-RF** identifica requisitos del hito; se vincula principalmente con RF-01–RF-04 y la presentación de opciones de RF-05.

| ID | Requerimiento funcional | Comportamiento observable |
| --- | --- | --- |
| H3-RF01 | Consultar sin registro | Un visitante abre carta y detalle sin cuenta ni acceso a fidelización. |
| H3-RF02 | Navegar por categorías | Categorías con contenido publicable permiten llegar a sus productos sin filas vacías o retiradas. |
| H3-RF03 | Ver información confirmada | Producto muestra nombre, porción, inclusiones y precio aplicable; información comercial todavía no verificada no se presenta como disponible para pedir. |
| H3-RF04 | Distinguir promociones | P01–P05 conservan su identidad y condiciones; precio previo solo se muestra si su comparación fue verificada. |
| H3-RF05 | Distinguir las alitas | Alitas de S/15 corresponden a cuatro unidades; ronda de S/44,90 contiene dieciséis. No se sustituyen por un selector de sabores no acordado. |
| H3-RF06 | Excluir precio de mesa | C01, ¼ de pollo para mesa, queda fuera de venta web; no se utiliza su precio S/10 para entrega o recojo. |
| H3-RF07 | Reconocer agotamiento | Un artículo publicado agotado puede consultarse con estado claro; no se anuncia como disponible para agregar al futuro pedido. |
| H3-RF08 | Respetar restricciones de promoción | P05 mantiene entrega como única modalidad compatible, sin la leyenda retirada «Solo delivery». La interfaz evita esa mención promocional sin alterar la restricción funcional. |
| H3-RF09 | Recuperarse de un fallo | Falta de imagen no impide leer; fallo de catálogo muestra estado/reintento; URL retirada no revela datos del borrador o registro eliminado. |
| H3-RF10 | Obtener datos actualizados | Al volver a consultar, el visitante observa cambios confirmados en precio, publicación y disponibilidad. |
| H3-RF11 | Comprender la oferta sin depender de la foto | El invitado encuentra nombre, porción, inclusiones, precio y estado mediante texto legible, incluso sin imagen; navegar por categorías y regresar conserva contexto. |

## 5. Definition of Done

Las casillas se completan únicamente con evidencia obtenida cuando se implemente el hito.

### Datos y seguridad

- [x] Migraciones y carga inicial se reconstruyen desde cero; existen seis tablas nuevas y el singleton previo, con tipos generados correctos.
- [x] La carga contiene C01–C24/P01–P05 con identidades estables y siete categorías, sin transformar pendientes en precios confirmados.
- [x] Precios de promociones y porciones coinciden con las referencias autorizadas; alitas regulares/ronda son cuatro/dieciséis.
- [x] C01 no tiene venta web; P05 no tiene precio online de recojo; dinero desconocido no se representa como cero.
- [x] `read_catalog` devuelve un snapshot consistente y ninguna información privada/fuente no autorizada.
- [x] Visitantes y usuarios autenticados no pueden consultar/modificar directamente las tablas del catálogo.
- [x] Borradores, registros eliminados y descendientes de padres eliminados no salen en el DTO ni en detalle por slug.
- [x] Promociones deshabilitadas/fuera de vigencia, precios/opciones no verificados y grupos obligatorios inválidos no se presentan como comprables.

### Carta y entrega

- [x] `/` y `/productos/[slug]` funcionan sin login con base real del entorno y estados claro de vacío/agotado/error/no encontrado.
- [x] Fotografías ausentes tienen fallback útil; carta/detalle se pueden recorrer con teclado y en pantalla móvil.
- [x] Vigencia y horario se prueban en límites de día/Lima, incluyendo horario desconocido y tramo nocturno cuando está configurado.
- [x] Nueva consulta refleja cambios sin recuperar contenido antiguo de una caché no prevista.
- [x] Metadata solo usa datos reales confirmados; no hay perfiles, secretos o datos sensibles en contenido público/logs.
- [x] Lint, TypeScript, build y pruebas pertinentes pasan; evidencia distingue fixtures verificadas de datos aún pendientes para producción.
- [ ] El responsable revisa la matriz comercial y el equipo documenta qué entradas están listas para publicación y cuáles requieren confirmación.

### Diseño UX/UI y marca

- [x] Se leyeron reglas del proyecto, UX/UI y sistema canónico; se aplicó `ui-ux-pro-max` al trabajo visual y se registraron consultas/recomendaciones aplicadas o descartadas con motivo.
- [x] Carta y detalle respetan jerarquía de producto, recursos propios/fallback y estados vacío/agotado/error; nombres, precios e inclusiones esenciales no se ocultan para encajar.
- [x] Se revisaron los anchos de evidencia del sistema visual, sin desbordamiento involuntario ni acciones esenciales ocultas; no hay colores/medidas alternativos duplicados en componentes.
- [ ] Teclado, foco completamente visible, labels/errores, contraste renderizado, zoom/reflujo y lector se comprobaron en el alcance; resultado y casos no ejecutados están identificados.
- [x] Capturas y reporte identifican versión/entorno y datos sintéticos. Evidencia específica: Carta/detalle con y sin fotos, promociones vacías, agotados y error de servicio; datos sintéticos identificados.

### Escenarios críticos y evidencia

| Referencia | Escenario que se debe comprobar | Evidencia requerida |
| --- | --- | --- |
| CA-01–CA-03, CA-36 | Carta/detalle públicos con nombre, precio, porción, agotamiento e imagen ausente. | E2E y matriz de datos expuestos frente a fuente/fixtures. |
| CA-04, CA-05; CT-16 | Opciones confirmadas y grupo obligatorio sin suficientes opciones. | Prueba de publicación/proyección con datos válidos e inválidos. |
| CA-10, CA-18; CT-22 | Promociones, comparación verificada y límites temporales Lima. | Casos de tiempos controlados y DTO esperado. |
| CT-27 | Acceso directo denegado y proyección pública segura. | Pruebas con roles SQL públicos y comparación de campos. |
| Documento 10: filtros de conservación | Padre eliminado, hijo vigente, claves retenidas y ausencia de metadata de borrado pública. | Fixtures antes/después, constraints y resultados de RPC/detalle. |

La aceptación técnica puede usar datos sintéticos expresamente verificados en local/staging. Publicar productos reales exige confirmaciones comerciales: ejecutar la carga de referencia no autoriza automáticamente precios o inclusiones por modalidad.

## 6. Dependencias y pendientes

**Requisitos previos:** [H1](01-hito-1-preparacion-del-proyecto.md) y base de [H2](02-hito-2-acceso-del-personal.md): esquema privado, personal para FKs, singleton, SDK público y contratos. Auditoría/recibos ya están disponibles para el mantenimiento de H4.

| Pendiente | Trabajo afectado | Condición de cierre o bloqueo |
| --- | --- | --- |
| PT-05: precios/inclusiones/opciones por modalidad | T01, T03–T07. | Bloquea publicación de los artículos afectados; no bloquea probar la proyección con fixtures explícitas. |
| PT-09: recursos de marca/fotografías | T07–T08. | Usar fallback aprobado; confirmar recursos y derechos de uso antes de la presentación final. |
| PT-01/PT-02: ubicación/horarios | T04 y T08. | No inventar ubicación ni horario; recojo se habilita en H5 solo con ubicación confirmada. Horario desconocido conserva el tratamiento del contrato. |
| PT-08, PT-11 y PT-13 | Operación/fidelización posterior. | Permanecen pendientes; no bloquean lectura pública aislada de H3 ni se resuelven en la carga comercial. |

**Transición:** [H4](04-hito-4-administracion-del-catalogo.md) permite mantenimiento auditado y publicación supervisada. [H5](05-hito-5-pedido-por-whatsapp.md) agrega carrito, datos del pedido y validación canónica usando esta misma proyección.

## 7. Referencias

- [Reglas generales](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md).
- [Identidad visual y cobertura por vistas](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md) e [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md).

- [Guía general de hitos](hitos-del-proyecto.md).
- [Análisis y catálogo de referencia](../analisis-del-proyecto.md).
- [Arquitectura](../diseno-tecnico/01-arquitectura.md).
- [Modelo de datos y carga inicial](../diseno-tecnico/03-modelo-de-datos.md).
- [Contratos públicos](../diseno-tecnico/05-contratos-y-operaciones.md).
- [Frontend, imágenes y SEO](../diseno-tecnico/06-frontend-y-estado.md).
- [Casos CA/CT](../diseno-tecnico/08-pruebas-y-aceptacion.md).
- [Tablas DB y conservación](../diseno-tecnico/10-tablas-db.md).
- [Navegación](../diseno-tecnico/12-flujo-navegacion.md).
- [Registro de pendientes](../diseno-tecnico/README.md).

La evidencia enlazada identifica qué se implementó y verificó; esta especificación conserva las condiciones de aceptación manual y publicación comercial todavía pendientes.
