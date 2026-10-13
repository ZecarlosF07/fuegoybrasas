# Hito 5 — Completar el pedido por WhatsApp

**Versión:** 1.3 · **Fecha:** 8 de octubre de 2026.  
**Destinatarios:** equipo de desarrollo y responsable del negocio.  
**Estado:** implementado con migración remota y comprobaciones automáticas aprobadas; repetición final de navegador: 31 pruebas aprobadas, incluidas siete H5. Build remoto y revisión de secretos aprobados después de la suite. Aceptación manual y habilitación comercial pendientes. [Reporte](evidencia/h5/README.md) y [operación](evidencia/h5/operacion.md).  
**Guía general:** [Hitos del proyecto](hitos-del-proyecto.md).

## 1. Descripción del objetivo

Permitir que un invitado prepare una solicitud completa desde la carta y continúe su atención en el WhatsApp oficial **+51 982 042 493**. El recorrido conserva el borrador, revisa datos comerciales actuales y explica cambios de precio, disponibilidad o cargos antes de construir el mensaje.

El resultado esperado es un carrito y formulario recuperables con validación canónica. Abrir WhatsApp solamente abre un destino externo: no confirma que el usuario envió el mensaje, que se aceptó el pedido, que pagó o que hubo una venta. La solicitud y sus datos personales no se almacenan en Supabase.

### Alcance del hito

- Carrito, cantidades, opciones, indicaciones por línea y selección de entrega/recojo.
- Persistencia local/sesión, recuperación y protección ante instrucciones perdidas.
- Tablas/configuración de `payment_methods` y `delivery_zones`, ampliación del contrato de configuración y `/administracion/configuracion` para manager.
- `/pedido`, `/pedido/datos`, `/pedido/continuar` y `POST /api/cart/validate`.
- Mensaje completo, apertura/copia de WhatsApp y retorno al borrador.

Fidelización y registro son opcionales. H5 debe funcionar como invitado antes de H6; después, un fallo de tarjeta seguirá sin bloquear el pedido si puede validarse el catálogo. No incorporar pagos online, seguimiento de pedidos o confirmaciones de venta ajenas al alcance.

## 2. Tareas del hito

| ID | Tarea | Trabajo concreto | Resultado esperado |
| --- | --- | --- | --- |
| H5-T01 | Preparar configuración de compra | Revisar pagos, modalidades, ubicación, cobertura/cargos y horarios; distinguir confirmaciones bloqueantes de valores desconocidos permitidos. | Reglas de habilitación sin supuestos comerciales. |
| H5-T02 | Migrar pagos y zonas | Crear las dos tablas con constraints, revisiones, permisos y soft delete; ampliar `read_catalog`/`update_business_config` y generar tipos. | Configuración de checkout protegida y proyectada con datos seguros. |
| H5-T03 | Construir configuración privada | Añadir formularios manager/AAL2 para campos, pagos, zonas y pausa de pedidos, con revisión, recibos y auditoría. | Responsable controla condiciones confirmadas de compra. |
| H5-T04 | Implementar dominio del carrito | Reducer/context, claves de línea por artículo/opciones/indicaciones, límites, edición y cálculo provisional en céntimos. | Carrito predecible sin duplicación de reglas. |
| H5-T05 | Implementar persistencia | Versionar almacenamiento, caducidad, validación al recuperar y conflictos entre pestañas; separar información comercial de datos personales. | Borrador recuperable sin conservar PII en localStorage. |
| H5-T06 | Implementar validación canónica | Crear handler público y validador con lectura fresca de catálogo, límites, revisiones y respuesta `ready`/`needs_review`. | Precios/opciones/cargos actuales y cambios explícitos. |
| H5-T07 | Construir páginas del pedido | Conectar resumen, modalidad, nombre, dirección cuando procede, pago/cambio e indicaciones; gestionar estados vacíos, revisión y fallos. | Recorrido invitado completo y accesible. |
| H5-T08 | Preparar mensaje y continuación | Generador puro local con respuesta canónica/datos del formulario; WhatsApp oficial, copia y alternativa para mensajes largos. | Contenido completo sin solicitudes persistidas ni venta ficticia. |
| H5-T09 | Integrar recuperación | Invalidar validación por edición/tiempo, aceptar cambios expresamente, conservar borrador al volver y ofrecer inicio de nueva solicitud con confirmación. | Usuario recupera la solicitud sin pérdida o sustitución silenciosa. |
| H5-T10 | Verificar y presentar | Probar precios, modalidades, persistencia, errores, límites, copia/apertura y ausencia de escrituras de pedidos. | Evidencia de recorrido real listo para prueba operativa. |
| H5-T11 | Diseñar el pedido con la skill | Aplicar ui-ux-pro-max a carrito, dock, campos condicionales, errores, revisión de cambios y salida/regreso de WhatsApp; usar sistema y textos canónicos. | Pedido invitado fácil de revisar y recuperar, con cierre comercial explicado. |

Orden recomendado: T01 → T02–T03 → T04–T06 → T07–T09 → T10. El generador de mensajes reutiliza reglas/DTO del dominio y no duplica el cálculo autorizado del servidor.

Ejecutar H5-T11 antes de construir las pantallas del hito; completar su revisión antes de la presentación. Su identificador añadido conserva los anteriores; no posterga el diseño hasta después de la implementación. Las tareas exclusivamente de backend mantienen sus pruebas y no requieren búsqueda visual.

## 3. Requerimientos técnicos

### 3.1. Configuración y validación

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H5-RT01 | Datos comerciales de checkout | `payment_methods` y `delivery_zones` según documento 10: enabled/verified, revisiones, FK de borrado, motivo 10–500 e índices. No se crean `orders`, líneas de venta, direcciones de clientes ni pagos realizados. |
| H5-RT02 | Mantenimiento transaccional | `updateBusinessConfigAction` → `update_business_config` con revisión/UUID; cambios de pagos/zonas incrementan revisión global. Bajas/restauraciones usan contratos de conservación; restaurar deja disabled/unverified. |
| H5-RT03 | Entrada pública limitada | `POST /api/cart/validate`: modo delivery/pickup, pago/zona cuando aplican, IDs/cantidades/opciones y revisiones/precio observado. No enviar nombre, dirección o texto de indicaciones a esta API. |
| H5-RT04 | Límites del contrato | Cuerpo máximo 32 KiB, 1–30 líneas, 1–20 unidades por línea, 120 unidades en total y hasta 20 opciones únicas por línea. Validación en ejecución y control de abuso; errores compartidos, sin cuerpos personales en logs. |
| H5-RT05 | Reglas canónicas | Lectura fresca `read_catalog`; verificar pausa/horario, rama publicada no eliminada, disponibilidad, precio por modalidad, grupos/opciones y configuración vigente. `dine_in` nunca es modalidad de checkout; P05 rechaza pickup. |
| H5-RT06 | Importes y desconocidos | Cálculos enteros en céntimos: precio, adicionales, subtotal y cargos confirmados. Cargo desconocido conserva NULL y `totalCents=null`; mostrar subtotal conocido más advertencia, nunca entrega gratuita implícita. |
| H5-RT07 | Condiciones de modalidad | Recojo requiere ubicación confirmada; su cargo solo se calcula si está verificado y, en otro caso, cargo/total siguen pendientes. Cobertura excluida bloquea; mínimo conocido se aplica; cobertura/cargo desconocido permitido informa coordinación por WhatsApp. Horario desconocido informa, horario cerrado bloquea. |
| H5-RT08 | Respuesta y vigencia | `ready`/`needs_review`, nombres/precios/revisiones canónicos, incidencias, warnings, configuración/teléfono oficial y tiempos. Vigencia de validación 60 segundos; cambio requiere aceptación explícita y nueva validación. |
| H5-RT09 | Respuestas concurrentes | Usar versión del borrador para descartar una respuesta de validación anterior a la última edición. Deadline monotónico: reloj incorrecto del dispositivo no prolonga validez. Datos validados solo en memoria. |

### 3.2. Borrador, formulario y WhatsApp

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H5-RT10 | Persistencia comercial | `fyb.cart.v1` en localStorage: IDs, cantidades, opciones, modalidad y snapshots de presentación permitidos. Caduca tras siete días de inactividad. No guardar nombre, dirección o texto de indicaciones en este almacenamiento. |
| H5-RT11 | Datos de sesión | `fyb.checkout.v1` en sessionStorage: nombre, dirección/referencia, pago/cambio e indicaciones generales/por línea. Validar shape/versión; almacenamiento bloqueado permite seguir en memoria con aviso. |
| H5-RT12 | Líneas e indicaciones perdidas | Identidad de línea por artículo + opciones ordenadas + indicaciones normalizadas; fusión consciente dentro de límites. `hadInstructions` permite reconocer texto ausente al recuperar: mantener líneas separadas en `needs_review` hasta reingreso o confirmación explícita sin indicaciones. |
| H5-RT13 | Formulario local | Nombre 1–80, dirección 5–250 cuando aplica, referencia hasta 200, observaciones generales hasta 500 y por línea hasta 200 caracteres. Pago válido; cambio solo si el método lo necesita. Recojo omite dirección; no exigir teléfono/cuenta para pedir. |
| H5-RT14 | Mensaje completo | Generador puro local combina catálogo validado y formulario; usa `https://wa.me/51982042493` a partir de configuración oficial. No enviar PII a un servicio de generación ni almacenar solicitud en DB. |
| H5-RT15 | Apertura y copia | Hasta 7000 caracteres codificados en URL; si excede, ofrecer texto íntegro y abrir chat sin texto codificado. No truncar. Clipboard solo anuncia éxito después de confirmación efectiva; si falla, texto seleccionable. |
| H5-RT16 | Navegación y recuperación | Rutas previstas, sin `/pedido/exito` de venta confirmada. Retorno desde WhatsApp conserva borrador; limpiar/iniciar otro exige intención explícita. Acceso directo sin carrito informa estado útil. |
| H5-RT17 | Fallos y seguridad | Stock/precio/opción retirados no se sustituyen silenciosamente. Fallo de validación no entrega una solicitud como validada; falla de fidelización no participa del bloqueo invitado. API pública no-store, privada por sesión y logs sin PII. |
| H5-RT18 | Pruebas del recorrido | Unitarias de dominio/mensaje/persistencia, integración configuración/proyección/API y E2E móvil/carrito/revisión/retorno/copia. Verificar ausencia de escritura de solicitudes, no solo formato del mensaje. |

### 3.3. Diseño UX/UI y sistema visual

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H5-RT19 | Reglas y skill aplicables | Leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md); usar `ui-ux-pro-max` y registrar encaje/recomendaciones, sin depender de una ruta personal ni sustituir decisiones por una plantilla. |
| H5-RT20 | Patrón visual del hito | Dock reserva espacio/safe-area; cantidades, importes y revisión tienen jerarquía legible. Formularios conservan entrada y contexto; cambios requieren aceptación expresa y apertura de WhatsApp nunca se muestra como venta confirmada. |

Los valores visuales se consultan en el sistema canónico. La aceptación exige estados reales del alcance, anchos definidos allí y evidencia manual/automática pertinente; los recursos originales siguen pendientes en PT-09 cuando no estén disponibles. La evidencia de aplicación se registra en el reporte de H5; estas definiciones no sustituyen las comprobaciones manuales pendientes.

## 4. Requerimientos funcionales de H5

**H5-RF** se relaciona con RF-04–RF-11 y RF-18 del producto; las identidades generales se conservan.

| ID | Requerimiento funcional | Comportamiento observable |
| --- | --- | --- |
| H5-RF01 | Pedir como invitado | Visitante arma y continúa una solicitud sin registrarse o acceder a tarjeta. |
| H5-RF02 | Editar el carrito | Agrega/retira artículos, cambia cantidad/opciones e indicaciones y ve importes actualizados. |
| H5-RF03 | Conservar su borrador | Recarga o vuelve a la web con artículos conservados; datos personales solo se recuperan dentro de la sesión prevista. |
| H5-RF04 | Revisar instrucciones ausentes | Si se perdió el texto de una línea, se solicita revisión; no se fusionan líneas distintas ni se supone «sin indicaciones». |
| H5-RF05 | Elegir modalidad válida | Entrega/recojo muestran requisitos; P05 no puede continuarse como recojo y no se usa la leyenda retirada. |
| H5-RF06 | Completar datos pertinentes | Nombre, dirección cuando corresponde, pago e indicaciones; no se piden campos ajenos a la modalidad ni cuenta obligatoria. |
| H5-RF07 | Aceptar cambios de carta | Precio/opción/disponibilidad cambiados se muestran antes de continuar; se revalida tras aceptación o edición. |
| H5-RF08 | Reconocer cargos pendientes | Se diferencia subtotal de total; cobertura/cargos no confirmados se informan para coordinación, sin convertirlos en cero. |
| H5-RF09 | Continuar por WhatsApp | Abre el número oficial con contenido validado o copia texto completo; la página dice solicitud preparada y no venta confirmada. |
| H5-RF10 | Recuperar apertura/copia fallida | Puede copiar/seleccionar mensaje y abrir chat manualmente sin perder contenido. |
| H5-RF11 | Volver o empezar otra solicitud | Retorno conserva borrador; iniciar otro requiere acción explícita para evitar vaciarlo por abrir WhatsApp. |
| H5-RF12 | Continuar con tarjeta fuera de servicio | La compra invitada sigue disponible cuando el catálogo puede validarse, sin depender del login de fidelización. |
| H5-RF13 | Reconocer revisión y continuidad por WhatsApp | El invitado identifica lo que debe corregir y lo que aún confirmará el local; puede volver, editar o copiar sin perder el borrador ni recibir una confirmación de venta falsa. |

## 5. Definition of Done

Las casillas marcadas remiten a [evidencia](evidencia/h5/README.md) del entorno local de pruebas y la migración remota. La repetición de navegador sobre el árbol final está aprobada. Las comprobaciones manuales o integraciones todavía inexistentes permanecen pendientes; marcar una comprobación técnica no activa pedidos reales.

### Configuración, datos y validación

- [x] Pagos/zonas y su conservación se reconstruyen con migraciones, permisos y tipos; configuración versionada se mantiene solo por manager/AAL2.
- [x] Restaurar pagos/zonas no los habilita ni verifica automáticamente; configuración singleton se pausa mediante flags y no se elimina.
- [x] API respeta límites, contrato seguro y datos canónicos; no recibe nombre, dirección ni texto de indicaciones.
- [x] Cálculos exactos, modalidades, vigencia, opciones obligatorias, pausa y horario se prueban; C01/P05 conservan restricciones.
- [x] Cambio de precio, publicación, disponibilidad, pago o zona obliga a revisar/revalidar; no hay sustitución silenciosa.
- [x] Cargo desconocido produce total pendiente, cobertura excluida bloquea y recojo sin ubicación confirmada no se habilita.
- [x] Respuesta atrasada o validación expirada no autoriza continuar; reloj local erróneo no extiende los 60 segundos.

### Borrador y continuación

- [x] Un invitado recorre carta → carrito → datos → continuación sin registro.
- [x] localStorage/sessionStorage tienen responsabilidades y caducidad previstas; PII e indicaciones no se conservan en localStorage.
- [x] Recarga, storage bloqueado/corrupto y edición desde otra pestaña tienen recuperación explícita sin borrar/mezclar silenciosamente el borrador.
- [x] Líneas con indicaciones perdidas permanecen separadas hasta revisión; edición/fusión conserva límites y cantidades.
- [x] Mensaje incluye datos/porciones/opciones/precios canónicos e indicaciones completas; destino oficial es 982 042 493.
- [ ] Mensaje largo, apertura impedida y clipboard denegado conservan texto íntegro y ofrecen alternativa usable. URL larga aprobada en unitarias; clipboard denegado y vuelta aprobados en navegador. Falta comprobar bloqueo nativo de ventanas en los navegadores del piloto.
- [x] Abrir o volver de WhatsApp no vacía carrito, confirma venta ni crea registros de solicitud/pago en Supabase.
- [ ] Fallo de fidelización no impide el recorrido invitado cuando catálogo/validación funcionan. Independencia de acceso comprobada; la caída del servicio real se integra con H6.
- [x] Lint, TypeScript, builds, pruebas unitarias, integración, PostgreSQL, navegador y revisión de secretos aprobados; evidencia identifica revisión/entorno y diferencias productivas.
- [ ] Aceptación manual de accesibilidad: lector de pantalla real, zoom real y dispositivos del piloto. Las comprobaciones automáticas de axe, reflujo y foco están aprobadas.

### Diseño UX/UI y marca

- [x] Se leyeron reglas del proyecto, UX/UI y sistema canónico; se aplicó `ui-ux-pro-max` al trabajo visual y se registraron consultas/recomendaciones aplicadas o descartadas con motivo.
- [x] Dock no tapa foco/contenido, campos condicionales y errores se comprueban automáticamente, cargos pendientes siguen claros y WhatsApp muestra solicitud preparada/continuidad, conservando vuelta y borrador. Dock ausente en checkout y presente en producto.
- [x] Carrito, datos y continuación se comprobaron a 360/390/768/1280/320 CSS px, sin desbordamiento involuntario ni acciones esenciales ocultas; se mantiene el sistema canónico.
- [ ] Teclado, foco completamente visible, labels/errores, contraste renderizado, zoom/reflujo y lector se comprobaron en el alcance; resultado y casos no ejecutados están identificados. Axe, reflujo y recorrido de foco aprobados; zoom real y lector siguen pendientes.
- [x] Capturas y reporte actualizados identifican versión/entorno y datos sintéticos: carrito vacío/activo, conflicto de precio, validación expirada, errores de datos, copia fallida y regreso del chat. Opciones retiradas están comprobadas en dominio.
- [ ] Añadir evidencia visual específica de conflicto por opción retirada durante el piloto; no presentar la prueba de dominio como una captura de ese estado.

### Escenarios críticos y evidencia

| Referencia | Escenario que se debe comprobar | Evidencia requerida |
| --- | --- | --- |
| CA-04–CA-19; CT-17, CT-22 | Opciones, edición, dinero, datos, modalidades, configuración y validación actual. | Pruebas unitarias/integración y E2E individual/familiar con importes esperados. |
| CA-07, CA-12, CA-21, CA-22; CT-18, CT-33 | Persistencia, storage limitado y pérdida de indicaciones sin fusión silenciosa. | Recarga/cierre de sesión/pestañas y snapshots de almacenamiento sanitizados. |
| CT-34 | Respuesta antigua y reloj del dispositivo incorrecto. | Prueba de carrera/versionado y expiración monotónica. |
| CA-20–CA-22; CT-21 | Apertura, retorno, URL larga y clipboard denegado. | URL/destino inspeccionados, mensaje completo y borrador conservado. |
| RF-18; CT-26, CT-27 | Servicio de tarjeta caído, proyección segura y ausencia de PII/logs/escrituras de pedidos. | Recorrido invitado con dependencia de tarjeta fallida y revisión de red/DB/logs. |
| Documento 10: conservación | Pago/zona/artículo retirado durante preparación y restauración no habilitada. | Validación antes/después, conflicto/advertencia esperados y estado de configuración. |

Aceptar H5 técnicamente no confirma que se reciben/atienden solicitudes reales. Antes de habilitar pedidos públicos deben estar confirmados pagos, precios aplicables y responsabilidades de atención; los desconocidos admitidos se informan según contrato.

## 6. Dependencias y pendientes

**Requisitos previos:** [H3](03-hito-3-catalogo-publico.md) y [H4](04-hito-4-administracion-del-catalogo.md), con proyección actual, mantenimiento y revisión de catálogo. H2 aporta configuración/permisos/recibos; no se necesita H6 para pedir.

| Pendiente | Trabajo afectado | Condición de cierre o bloqueo |
| --- | --- | --- |
| PT-01: ubicación/recojo | T01–T03, T06–T07. | Bloquea habilitación de recojo sin ubicación confirmada. |
| PT-02/PT-03: horarios/cobertura/cargos | T01–T03, T06, T08. | Aplicar estados desconocidos permitidos y advertencias; excluir zonas confirmadas como no atendidas. No inventar ceros ni horarios. |
| PT-04/PT-05: pagos/precios/inclusiones | T01–T03, T06–T08. | Bloquean checkout público o artículos afectados mientras faltan confirmaciones. Fixtures permiten aceptación técnica. |
| PT-10: atención de WhatsApp | T08–T10 y piloto H8. | Confirmar responsable y comprobar recepción/atención real antes de habilitar pedidos. |
| PT-08, PT-11 y PT-13 | Fidelización y excepciones posteriores. | No bloquean pedido invitado aislado; siguen pendientes y no autorizan reducir el alcance público acordado sin aprobación. |

**Transición:** [H6](06-hito-6-fidelizacion.md) añade tarjeta y aplicación opcional explícita de preferencias. H8 prueba recepción real y habilita funciones después de la aceptación; H5 no mide aperturas como ventas.

## 7. Referencias

- [Reglas generales](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md).
- [Identidad visual y cobertura por vistas](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md) e [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md).

- [Guía general de hitos](hitos-del-proyecto.md).
- [Análisis funcional](../analisis-del-proyecto.md).
- [Contratos de validación y WhatsApp](../diseno-tecnico/05-contratos-y-operaciones.md).
- [Estado, persistencia y recuperación](../diseno-tecnico/06-frontend-y-estado.md).
- [Pruebas CA/CT](../diseno-tecnico/08-pruebas-y-aceptacion.md).
- [Tablas de configuración y soft delete](../diseno-tecnico/10-tablas-db.md).
- [Flujo funcional](../diseno-tecnico/11-diagrama-flujo.md).
- [Rutas](../diseno-tecnico/12-flujo-navegacion.md).
- [Registro de pendientes](../diseno-tecnico/README.md).

La implementación y sus comprobaciones se describen en [Evidencia H5](evidencia/h5/README.md). No se configuraron pagos reales, activaron pedidos o enviaron mensajes comerciales. La recepción/atención real y las pruebas manuales siguen pendientes.
