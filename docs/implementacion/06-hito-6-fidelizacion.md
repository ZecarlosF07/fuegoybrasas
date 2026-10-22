# Hito 6 — Implementar la tarjeta de fidelización

**Actualización 21/10 — DC-23–25:** [pedido sin pago y costo de premio opcional](../diseno-tecnico/20-pedido-whatsapp-y-costo-opcional.md) sustituye los campos de pago/vuelto, la dependencia de pagos y el costo obligatorio de premio. La revisión técnica se delega al agente; ver [guía de entrega](../entrega-al-cliente/README.md).

**Actualización DC-22, 13/10/2026:** [personal sin MFA](../diseno-tecnico/19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](../diseno-tecnico/16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. El acceso actual del personal se define en DC-22.

**Versión:** 1.4 · **Fecha:** 11 de octubre de 2026.  
**Destinatarios:** equipo de desarrollo y responsable del negocio.  
**Estado:** implementado; ajuste sin SMS aplicado al remoto y revalidado con 109 unitarias, 110 pgTAP, 90 de integración y 40 de navegador. Lint, TypeScript/build remoto, separación servidor/cliente y revisión de secretos aprobados. H6 conserva aceptación manual de Narrador/zoom y habilitación pública pendientes.
**Guía general:** [Hitos del proyecto](hitos-del-proyecto.md).

**Entrega:** [evidencia ejecutada](evidencia/h6/README.md) y [contratos/operación](evidencia/h6/operacion.md). Cinco migraciones H6 aplicadas al remoto; 18 tablas propias. Fidelización continúa deshabilitada, sin clientes ni premios reales.

## 1. Descripción del objetivo

Ofrecer al cliente una tarjeta propia, opcional y accesible mediante clave privada guardada y enlace/QR, y permitir que el personal registre visitas y canjes con integridad transaccional. Las indicaciones frecuentes se guardan por decisión del cliente y pueden aplicarse expresamente a un pedido, sin crear un historial de compras o preferencias inferidas.

La regla de negocio se mantiene: **un sello por visita presencial con compra pagada y pedido entregado**. Diez sellos generan un Mostrito de ⅛ con chaufa, papas fritas y ensalada. El premio se canjea en una visita posterior, sin compra obligatoria; puede ser otra visita el mismo día. Canjear no suma un sello ni borra el avance del siguiente ciclo.

El resultado esperado es un recorrido completo de identidad, tarjeta, preferencias, acreditación y canje ordinario. Las correcciones y recuperaciones excepcionales se entregan en H7. Un canje registrado que finalmente no se entrega permanece como PT-13: H6 no presume restitución automática ni una regla de entrega pendiente.

### Alcance del hito

- Seis tablas privadas nuevas: `customers`, `loyalty_program_versions`, `loyalty_cards`, `loyalty_events`, `loyalty_rewards` y `loyalty_incidents`.
- Alta con nombre/teléfono de contacto, clave privada, consulta propia, preferencias y cambio normal de contacto conservando identidad.
- Transacciones de sello/canje, emisión de premios, pausa y disponibilidad del producto de premio.
- Búsqueda exacta de cliente y ficha mínima para personal autorizado.
- Diario mínimo para operaciones inciertas y recuperación mediante recibos de H2.

Con H2, H3 y H5 se completa el inventario de **18 tablas de aplicación**: cuatro comunes, seis de catálogo, dos de checkout y seis de fidelización. Auth y Storage son referencias administradas, no tablas adicionales creadas por el equipo.

## 2. Tareas del hito

| ID | Tarea | Trabajo concreto | Resultado esperado |
| --- | --- | --- | --- |
| H6-T01 | Precisar reglas y habilitación | Revisar ciclos, versiones, identidad, términos, costo, permisos y bloqueos; distinguir pruebas locales de programa público. | Matriz de reglas y requisitos de activación sin beneficios nuevos. |
| H6-T02 | Migrar el conjunto de fidelización | Crear seis tablas/FKs, constraints, índices, revisiones, soft delete e inmutabilidad; preparar versión draft con meta/premio acordados. | Esquema reproducible que conserva eventos y premios independientes. |
| H6-T03 | Implementar transacciones centrales | Construir `credit_stamp`, `redeem_reward`, consultas de estado y emisión de premios bajo locks/recibos/auditoría. | Sello y canje atómicos, sin duplicados ni incrementos libres. |
| H6-T04 | Implementar configuración del programa | Activación por RPC específica, disponibilidad y costo de referencia versionados; impedir habilitación genérica incompleta. | Programa solo se activa tras cumplir condiciones técnicas/operativas. |
| H6-T05 | Integrar alta y acceso privado | Crear nombre/contacto/términos sin SMS, clave criptográfica, cookie segura, enlace/QR y apertura expresa; proteger RPC solo servidor. | Cliente crea tarjeta en un envío; teléfono declarado no abre tarjetas. |
| H6-T06 | Implementar perfil y tarjeta propios | Alta atómica e idempotente por hash, consulta mínima, preferencias y cambio de contacto con revisión. | Misma tarjeta/progreso; colisión pide revisión sin merge. |
| H6-T07 | Construir área del cliente | `/mi-tarjeta/acceso`, `/mi-tarjeta`, `/mi-tarjeta/telefono`, `/condiciones-tarjeta` y `/privacidad`; estados cerrado/suspendido/pausado y aplicación explícita de preferencias. | Cliente entiende progreso, premios y restricciones sin afectar el pedido invitado. |
| H6-T08 | Construir atención de tarjeta | Búsqueda exacta de contacto declarado; confirmar tarjeta presentada/nombre/movimientos y pago/entrega/visita posterior. | Número sin verificar no sustituye la identificación presencial. |
| H6-T09 | Recuperar operaciones inciertas | Guardar diario antes de enviar, consultar `get_operation`, reintentar mismo UUID/entrada y bloquear otra operación de esa tarjeta mientras no se resuelva. | Recarga o red inestable no duplica sellos ni entregas. |
| H6-T10 | Registrar excepciones básicas | Permitir `open_incident` para anomalías de registro/entrega sin alterar saldo automáticamente; conectar revisión de H7. | Caso no resuelto queda visible y trazable. |
| H6-T11 | Verificar y presentar | Probar permisos propios/staff, concurrencia real, hitos 9/10/11/20, identidad, pausa, stock y dependencia opcional del pedido. | Evidencia del núcleo ordinario y lista explícita de bloqueos de lanzamiento. |
| H6-T12 | Diseñar tarjeta y atención con la skill | Consultar ui-ux-pro-max y reglas antes de acceso, tarjeta, preferencias, cambio de teléfono, ficha y confirmaciones; revisar progreso/premios y resultados inciertos. | Progreso comprensible y operación de atención sin efectos visuales engañosos. |

Orden recomendado: T01 → T02 → T03–T04 → T05–T06 → T07–T10 → T11. La integridad de transacciones se prueba antes de conectar los botones. La generación de QR y las confirmaciones humanas ocurren fuera de transacciones SQL.

Ejecutar H6-T12 antes de construir las pantallas de cliente/personal; comprobar el resultado en T11. Su identificador añadido conserva los anteriores; no posterga el diseño hasta después de la implementación. Las tareas exclusivamente de backend mantienen sus pruebas y no requieren búsqueda visual.

## 3. Requerimientos técnicos

### 3.1. Datos e identidad

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H6-RT01 | Tablas privadas protegidas | Seis tablas de H6 en `app_private` según documento 10; sin exposición Data API/grants CRUD. Lecturas/RPC explícitas comprueban dueño o permiso staff vigente y filtros de conservación. |
| H6-RT02 | Identidad por clave privada | `contact_phone` E.164 único incluso eliminado; `access_key_hash` UNIQUE y vigencia pareada. `auth_user_id` nullable solo compatibilidad. Número no autentica. |
| H6-RT03 | Alta atómica | `registerCardAction` → `ensure_card_by_key`; hash del servidor, términos/flag/versión y creación perfil+tarjeta+auditoría; cero sellos y replay sin duplicado. |
| H6-RT04 | Programa versionado | Meta diez y contenido Mostrito⅛ acordados; una versión activa y reglas preservadas tras uso. Estado draft no permite operaciones, retired conserva derechos de tarjetas previas; no cambiar meta/premio de una versión utilizada. |
| H6-RT05 | Progreso y premios | `net_stamps` no negativo; progreso `net_stamps % 10`; ordinales de premio únicos por tarjeta. Reward conserva nombre/contenido al emitirse y no depende de borrar/reiniciar la tarjeta. Sin vencimiento añadido al programa inicial. |
| H6-RT06 | Eventos inmutables | Los seis tipos de eventos y deltas/checks/FKs del documento 10 se crean desde H6; eventos, recibos y auditoría no admiten UPDATE/DELETE. Reversión/anulación/restauración se implementan en H7, sin editar eventos antiguos. |
| H6-RT07 | Conservación desde migración | Las cinco tablas editables nuevas llevan los tres campos de soft delete; eventos no. Proteger versión activa/usada, premios disponibles/canjeados e incidentes abiertos. UI y procedimientos excepcionales de baja/restauración se entregan en H7. |
| H6-RT08 | Acceso privado seguro | Cookie HttpOnly/Secure HTTPS/SameSite, clave de 256 bits y hash SQL. Enlace con fragmento eliminado al entrar, apertura explícita y RPC `*_by_key` solo service_role. Sin OTP/SMS. |
| H6-RT09 | Cambio normal de contacto | `changeCardContactAction` → `update_card_phone_by_key`, clave propia y revisión. Misma tarjeta/progreso/premios; colisión pide revisión sin recuperar otra tarjeta. |
| H6-RT10 | Perfil, sesión y DTO | `updatePreferencesAction` → `update_card_profile_by_key` con revisión; lectura propia desde cookie, no UUID libre. API/páginas no-store, contacto enmascarado y sin hash/clave en proyección. |

### 3.2. Transacciones y atención

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H6-RT11 | Contrato de acreditación | `creditStampAction` → `credit_stamp`: cliente, UUID, `paidConfirmed=true`, `deliveredConfirmed=true` y referencia opcional. Actor desde JWT/tabla staff; suma exactamente uno. Retrofecha solo manager con contingencia de H7, nunca atención ordinaria. |
| H6-RT12 | Contrato de canje | `redeemRewardAction` → `redeem_reward`: cliente/premio/UUID, `laterVisitConfirmed=true`, `productAvailableConfirmed=true`. Validar premio available, derechos/versiones, `reward_available`, flag y tarjeta activa. Canje registra costo de referencia del momento, sin cobro ni sello. |
| H6-RT13 | Orden de bloqueos | Alta: configuración → advisory de altas → versión → creación atómica. Cambio contacto: advisory → perfil. Sello/canje conserva orden configuración/perfil/tarjeta/versión/premios de contratos. |
| H6-RT14 | Atomicidad e idempotencia | Cambio de contador/premio, eventos, auditoría y recibo en una transacción. Actor/UUID único y hash; replay devuelve efecto original más estado actual autorizado. Dos visitas distintas se suman; dos canjes del mismo premio producen un solo efecto. |
| H6-RT15 | Referencia de visita | Normalizar/validar hasta 80 caracteres; referencia repetida con acreditación vigente en esa tarjeta bloquea duplicación. No imponer límite por día; UUID no demuestra por sí solo una visita real. Personal confirma el hecho presencial. |
| H6-RT16 | Activación/stock/costo | `activateLoyaltyProgramAction` → `activate_loyalty_program` comprueba versión draft, revisión, costo y términos confirmados; habilitación atómica. `set_reward_availability` y `update_reward_cost` cambian campos operativos permitidos, con revisión/auditoría/UUID. |
| H6-RT17 | Búsqueda mínima autorizada | `lookup_customer` exige personal/permisos, contacto exacto; no directorio por prefijo. Confirmar tarjeta/nombre/movimientos antes de operar. |
| H6-RT18 | Diario de operaciones | `fyb.staff-operations.v1` en sessionStorage guarda antes del envío actor/UUID/tipo/IDs/hash/inicio, sin tokens, teléfono, preferencias o motivos. Si no puede persistir, no emitir escritura de fidelización; seguir contingencia autorizada. |
| H6-RT19 | Incertidumbre y logout | Consultar primario vía `get_operation`; ausencia de recibo no permite UUID nuevo. Reintentar solo misma entrada reconstruida/comprobada; otra identidad o permiso degradado no recupera operación. Sin actualización optimista de saldo; logout limpia estado privado y conserva carrito no sensible. |
| H6-RT20 | Incidencia sin resolución implícita | `openIncidentAction` → `open_incident` registra fallo de entrega/registro autorizado; no devuelve automáticamente el premio a available ni modifica sello. La resolución del premio fallido depende de PT-13/H7. |
| H6-RT21 | Pruebas del núcleo | Unitarias de Actions/cookie/fragmento; SQL/pgTAP e integración con conexiones separadas para permisos/alta/contacto; E2E de enlace entre dispositivos y regresión de staff/invitado. Distinguir evidencia automática real y revisión humana pendiente. |

Antes del canje se comprueba disponibilidad; después se registra el canje y se entrega físicamente el premio. El registro digital no permite inferir que se completó la entrega: una discrepancia se convierte en incidencia, sin reutilizar el botón para otro canje.

### 3.3. Diseño UX/UI y sistema visual

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H6-RT22 | Reglas y skill aplicables | Leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md); usar `ui-ux-pro-max` y registrar encaje/recomendaciones, sin depender de una ruta personal ni sustituir decisiones por una plantilla. |
| H6-RT23 | Patrón visual del hito | Conteo textual acompaña posiciones de sellos; premios independientes se muestran separados. Alta/enlace y errores accesibles; ficha y confirmaciones consumen resultados reales, sin saldo optimista ni nuevo UUID ante incertidumbre. |

Los valores visuales se consultan en el sistema canónico. La aceptación exige estados reales del alcance, anchos definidos allí y evidencia manual/automática pertinente; los recursos originales siguen pendientes en PT-09 cuando no estén disponibles. Las interfaces y pruebas ejecutadas se registran en el reporte de H6, sin inferir aceptación manual.

## 4. Requerimientos funcionales de H6

**H6-RF** se vincula con RF-12–RF-16 y RF-18; RF-17 se completa en H7.

| ID | Requerimiento funcional | Comportamiento observable |
| --- | --- | --- |
| H6-RF01 | Crear tarjeta sin SMS | Nombre/contacto/términos crean tarjeta; navegador recuerda acceso y enlace/QR permite abrirla. Un fallo no bloquea el pedido invitado. |
| H6-RF02 | Crear una sola tarjeta | Reintento con misma clave conserva perfil/tarjeta y cero sellos; número ocupado pide revisión, sin abrir otra tarjeta. |
| H6-RF03 | Ver tarjeta propia | Cliente ve progreso y premios propios; no consulta tarjeta ajena ni modifica sellos/canjes. |
| H6-RF04 | Guardar indicaciones frecuentes | Guardado explícito modifica perfil; observaciones de un pedido no cambian preferencias. Aplicarlas al formulario también es explícito. |
| H6-RF05 | Cambiar contacto conservando tarjeta | Desde acceso privado, guardar nuevo celular con revisión y conservar UUID/progreso/premios; colisión no fusiona tarjetas. |
| H6-RF06 | Acreditar visita entregada | Atención autorizada identifica al cliente y confirma compra pagada y entregada; antes de entrega, cancelación o canje sin compra no generan sello. |
| H6-RF07 | Obtener premio al décimo sello | De 9 a 10 se obtiene un premio y progreso 0/10; siguiente visita da 1/10 con premio pendiente. Veinte sellos producen dos premios. |
| H6-RF08 | Canjear en visita posterior | Premio disponible se canjea sin exigir otra compra; no suma sello ni reduce avance. Compra adicional válida exige acreditación separada y explícita. |
| H6-RF09 | Conservar premio agotado | Falta de producto impide el canje y conserva el premio disponible. Pausa no borra progreso ni premios; consulta propia sigue disponible según estado. |
| H6-RF10 | Recuperar respuesta perdida | Personal ve operación incierta, consulta resultado y recupera/reintenta el mismo UUID; nunca recibe dos premios o sellos por el mismo envío. |
| H6-RF11 | Respetar estado de tarjeta | Perfil cerrado/eliminado pide revisión, suspensión permite consulta con restricciones y programa pausado impide nuevas acreditaciones/canjes sin impedir pedido invitado. |
| H6-RF12 | Registrar entrega de premio fallida | Personal registra incidencia y conserva el canje en historial; resolución posterior sigue pendiente hasta acuerdo PT-13. |
| H6-RF13 | Distinguir progreso, premio y resultado pendiente | Cliente y personal entienden ciclo nuevo con premio disponible y operación todavía no confirmada; la tarjeta opcional no bloquea el pedido ni sugiere otro canje por falta de respuesta. |

## 5. Definition of Done

El núcleo ordinario requiere todos los puntos siguientes con evidencia. Esta aceptación técnica no cierra las excepciones de H7 ni habilita por sí sola fidelización pública. La revalidación del cambio de acceso tiene evidencia automática nueva; las casillas marcadas remiten al [reporte actual](evidencia/h6/acceso-sin-sms/README.md). La [revisión humana](evidencia/h6/acceso-sin-sms/revision-manual.md) sigue pendiente: H6 todavía no está aceptado íntegramente. Las pruebas históricas con OTP no sustituyen esta revisión.

### Integridad y permisos

- [x] Las seis tablas nuevas se reconstruyen con migraciones/constraints/grants y tipos; inventario acumulado corresponde a las 18 tablas del diseño.
- [x] Alta simultánea crea un perfil y una tarjeta sin sello de bienvenida, o rechaza términos/pausa sin alta parcial.
- [x] Cliente A no ve tarjeta B ni ejecuta sello/canje; atención AAL1/inactiva/eliminada y entradas con actor libre son rechazadas.
- [x] Pago sin entrega, entrega sin pago y cancelación anterior a entrega no acreditan sello ni crean recibo exitoso.
- [x] Visitas 9/10/11/20 producen contador, eventos, ordinales y premios coherentes, con progreso y premios independientes.
- [x] Reintentos iguales tienen un efecto; entrada distinta con el mismo UUID y referencia duplicada vigente se rechazan.
- [x] Dos visitas distintas concurrentes suman ambas; dos empleados no canjean el mismo premio dos veces.
- [x] Canje posterior sin compra conserva avance; agotamiento/pausa mantienen derechos y orden de locks evita inconsistencias entre tarjetas.
- [x] Eventos/recibos/auditoría son inmutables y restricciones de conservación protegen versiones, premios e incidentes.

### Identidad, pantallas y recuperación

- [x] Alta, enlace/QR, cookie, preferencias y consulta propia funcionan con clave validada; términos desactualizados requieren nueva aceptación.
- [x] Cambio de contacto conserva UUID/progreso y solo acepta clave propia; colisión y revisión obsoleta no sobrescriben otra tarjeta.
- [x] Preferencias solo cambian mediante guardado explícito y se aplican al pedido por acción expresa.
- [x] Área del cliente y personal cubren búsqueda exacta, ficha por ID y estados closed/suspended/paused sin reactivación implícita.
- [x] Diario persiste antes de enviar; fallo de storage no emite escritura; recarga consulta operación antes de otra en esa tarjeta.
- [x] Operación en curso/ausencia de recibo no origina UUID nuevo; cambio de actor o degradación de permiso impide replay indebido.
- [x] No hay saldo optimista, PII/tokens en diario/logs, caché cruzada ni datos privados visibles después de logout.
- [x] Fallo de fidelización no bloquea pedido invitado con catálogo validable.
- [x] Se puede registrar la incidencia de entrega fallida sin reintegrar automáticamente premio o modificar canje; PT-13 sigue registrado.
- [x] Lint, TypeScript, build y pruebas pertinentes pasan con evidencias; SQL/integración/navegador reales se distinguen de mocks y revisión humana pendiente.

### Diseño UX/UI y marca

- [x] Se leyeron reglas del proyecto, UX/UI y sistema canónico; se aplicó `ui-ux-pro-max` al trabajo visual y se registraron consultas/recomendaciones aplicadas o descartadas con motivo.
- [x] Tarjeta diferencia nueva tarjeta de ciclo reiniciado con premio pendiente; confirma sellos/canjes solo con resultado real y ofrece recuperación autorizada sin prometer resolución de PT-13.
- [x] Se revisaron los anchos de evidencia del sistema visual, sin desbordamiento involuntario ni acciones esenciales ocultas; no hay colores/medidas alternativos duplicados en componentes.
- [ ] Completar revisión manual con lector de pantalla y zoom real. Teclado, foco, labels/errores, axe/contraste y reflujo automático pasan; los casos no ejecutados se identifican en el reporte.
- [x] Capturas y reporte identifican versión/entorno y datos sintéticos. Evidencia específica: Alta sin SMS/enlace privado, ciclos 9/10/11/20, premio disponible/agotado, tarjeta pausada y sello/canje incierto.

### Escenarios críticos y evidencia

| Referencia | Escenario que se debe comprobar | Evidencia requerida |
| --- | --- | --- |
| CA-23–CA-25; CT-13, CT-14, CT-30–CT-32 | Alta sin SMS, enlace/clave propios, preferencias y cambio de contacto/términos. | E2E y consultas antes/después; pruebas SQL y entre dispositivos diferenciadas de mocks. |
| CA-26–CA-29; CT-01–CT-06 | Entrega pagada, umbral, referencia y replay/respuesta perdida. | Eventos/contador/premios/recibos tras transacciones y recuperación por diario. |
| CA-30–CA-32; CT-29 | Canje único, sin compra, stock/pausa concurrentes y progreso independiente. | Conexiones SQL distintas y estado final; E2E de atención. |
| CT-10, CT-11, CT-19, CT-26, CT-28, CT-37 | Autorización, sesión/caché, datos sensibles y estados/reintentos. | Matriz directa de identidades y recarga/logout con diario mínimo. |
| CT-24: núcleo de integridad | Eventos acumulados, contador y ordinales sin correcciones todavía. | Consulta de reconciliación en tarjetas con 0/9/10/11/20 sellos. |
| Documento 10: conservación | Tablas editables con metadatos y bloqueo de eliminación de versión utilizada/premio disponible/incidente abierto. | Constraints y pruebas de operaciones no autorizadas; UI excepcional se acepta en H7. |

Pruebas de reversión CT-07–CT-09 y resolución de PT-13 pertenecen a H7. Construir H6 con fixtures y servicio Auth controlado es aceptable técnicamente; habilitar clientes reales requiere costo, acceso privado probado, términos, personal/procedimientos y caso excepcional resueltos antes del lanzamiento.

## 6. Dependencias y pendientes

**Requisito técnico previo:** [H2](02-hito-2-acceso-del-personal.md). [H5](05-hito-5-pedido-por-whatsapp.md) se entrega antes para demostrar independencia del invitado e integrar preferencias opcionales; no convierte una solicitud de WhatsApp en visita acreditable.

| Pendiente | Trabajo afectado | Condición de cierre o bloqueo |
| --- | --- | --- |
| PT-06: costo completo del premio | T01, T04. | Bloquea activación pública; costo sintético identificado permite probar transacción/configuración en entorno aislado. |
| PT-07: comprobación del nuevo acceso privado | T05–T07, T11. | Cerrado en su comprobación automática: reconstrucción, pgTAP, integración y navegador reales aislados aprobados el 11/10. Revisión humana de accesibilidad sigue pendiente para aceptar H6; no requiere SMS/proveedor. |
| PT-08: personal/recuperación/contingencias | T08–T10 y H7. | Cuentas sintéticas permiten pruebas; operación pública requiere personas y procedimientos aprobados. |
| PT-11: términos/privacidad/conservación/baja | T01, T06–T07. | Texto de prueba no se presenta como política aprobada. Bloquea lanzamiento de fidelización y definición de baja excepcional. |
| PT-13: canje registrado no entregado | T10 y transición a H7. | H6 registra incidencia; no implementa restitución ni entrega pendiente sin decisión. Bloquea cierre integral de H7 y lanzamiento completo H8. |

**Transición:** [H7](07-hito-7-correcciones-y-operacion.md) implementa reversión, cierre de incidencias, restauración contable de ordinales y procedimientos excepcionales. Hasta completar esos controles y el piloto, flags públicos permanecen deshabilitados en entornos no aceptados.

## 7. Referencias

- [Reglas generales](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md).
- [Identidad visual y cobertura por vistas](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md) e [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md).

- [Guía general de hitos](hitos-del-proyecto.md).
- [Reglas de fidelización](../diseno-tecnico/02-fidelizacion.md).
- [Modelo de datos](../diseno-tecnico/03-modelo-de-datos.md).
- [Identidad y permisos](../diseno-tecnico/04-autenticacion-seguridad.md).
- [Contratos y bloqueos](../diseno-tecnico/05-contratos-y-operaciones.md).
- [Frontend y diario de operaciones](../diseno-tecnico/06-frontend-y-estado.md).
- [Pruebas CA/CT](../diseno-tecnico/08-pruebas-y-aceptacion.md).
- [Tablas y conservación](../diseno-tecnico/10-tablas-db.md).
- [Flujo funcional](../diseno-tecnico/11-diagrama-flujo.md).
- [Navegación](../diseno-tecnico/12-flujo-navegacion.md).
- [Registro de pendientes](../diseno-tecnico/README.md).

La especificación no activa el programa ni entrega premios. El teléfono no se verifica. [Resultados actuales](evidencia/h6/acceso-sin-sms/README.md) distinguen evidencia ejecutada de pruebas pendientes; el reporte anterior conserva la evidencia histórica. Las casillas manuales pendientes no impiden construir H7, pero siguen siendo necesarias para la aceptación y lanzamiento.
