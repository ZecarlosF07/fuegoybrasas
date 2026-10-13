# Hito 2 — Preparar el acceso del personal

**Versión:** 1.2 · **Fecha:** 8 de octubre de 2026.  
**Destinatarios:** equipo de desarrollo y responsable del negocio.  
**Estado:** base técnica implementada y en revisión; evidencias y límites en el [reporte de H2](evidencia/h2/README.md). Aceptación manual y preparación del personal real pendientes.  
**Guía general:** [Hitos del proyecto](hitos-del-proyecto.md).

## 1. Descripción del objetivo

**Actualización DC-20 (13/10):** acceso y recuperación del personal sin CAPTCHA por instrucción del propietario. Se conservan contraseña, MFA, permisos y límites de Auth. [Implementación y comprobación](evidencia/h8/acceso-personal-sin-captcha.md).

Permitir que cada integrante autorizado entre con su propia cuenta y opere únicamente las funciones correspondientes a su rol. El hito establece la autorización efectiva, la segunda verificación MFA y los mecanismos comunes de configuración, auditoría e idempotencia que utilizarán catálogo y fidelización.

El resultado esperado es un acceso privado verificable: una sesión válida no basta si el personal está inactivo, eliminado o carece del nivel MFA requerido. El equipo debe demostrar estas restricciones tanto en navegación como mediante llamadas directas a las operaciones de servidor y de base de datos.

### Alcance del hito

- Acceso por correo/contraseña, MFA TOTP, cierre de sesión y recuperación ordinaria de contraseña.
- Primer responsable mediante bootstrap administrado y cuentas de prueba con roles `attendant` y `manager`.
- Tablas `staff_accounts`, `business_settings`, `operation_receipts` y `audit_entries`.
- Contratos comunes para autorización, cambios de configuración, revisión de versión, reintentos y conservación del personal.
- Páginas de acceso y entrada privada mínima; el mantenimiento completo de personal se entrega en H7.

H2 no activa pedidos ni fidelización al crear la configuración. Tampoco define cómo resolver una pérdida excepcional de MFA: esa operación depende de PT-08 y H7. Los clientes no tienen que registrarse para consultar la futura carta o preparar un pedido.

## 2. Tareas del hito

| ID | Tarea | Trabajo concreto | Resultado esperado |
| --- | --- | --- | --- |
| H2-T01 | Revisar límites de autorización | Relacionar roles, rutas, errores, permisos SQL y flujo Auth con los documentos 04, 05, 10 y 12. Consultar las guías instaladas de Next.js aplicables antes de escribir código. | Matriz de acceso común para navegador, servidor y RPC. |
| H2-T02 | Crear las migraciones comunes | Crear personal con sus FKs autorreferentes y soft delete; singleton de configuración; recibos y auditoría inmutables. Aplicar restricciones, índices, grants y RLS desde su creación. | Base reproducible sin acceso CRUD directo de usuarios públicos. |
| H2-T03 | Preparar el primer responsable | Documentar y ejecutar bootstrap administrado en local/pruebas; vincular una identidad Auth comprobada, registrar auditoría y retirar cualquier capacidad temporal. | Un responsable inicial trazable, sin endpoint público de promoción de rol. |
| H2-T04 | Implementar autorización actual | Construir `get_staff_access`, comprobaciones de sesión, rol, activo, borrado y AAL2; preparar `update_staff_access` con protección del último responsable. | Permisos efectivos y reutilizables en cada operación. |
| H2-T05 | Implementar login y MFA | Conectar formularios, enrolamiento/verificación TOTP, manejo de errores, rate limiting y cierre de sesión. | Una cuenta autorizada accede al área interna tras MFA. |
| H2-T06 | Implementar recuperación ordinaria | Conectar correo de recuperación, `GET /auth/confirm` y restablecimiento con destinos fijos; comprobar invitaciones y tokens inválidos. | Contraseña recuperable sin eliminar MFA ni reactivar permisos. |
| H2-T07 | Crear la base de configuración | Inicializar el singleton con WhatsApp oficial, zona horaria y flags apagados; implementar actualización restringida y versionada de campos disponibles. | Configuración común segura para próximos hitos. |
| H2-T08 | Implementar recibos y auditoría | Integrar UUID, hash de entrada, bloqueo por actor/operación, resultado confirmado y lectura `get_operation` en las primeras mutaciones autorizadas. | Un reintento no duplica el efecto y conserva su resultado original. |
| H2-T09 | Proteger conservación y navegación | Implementar baja/restauración de personal según contrato, guards, páginas de acceso fuera de layouts protegidos y respuestas privadas sin caché compartida. | JWT antiguos, URLs directas y restauraciones no recuperan permisos indebidamente. |
| H2-T10 | Verificar y presentar el hito | Probar permisos, MFA, recuperación, carreras del último responsable y reintentos de cambios reales de configuración/acceso en pruebas. | Evidencia reproducible y base lista para H3–H7. |
| H2-T11 | Diseñar y revisar el acceso con la skill | Consultar ui-ux-pro-max y reglas canónicas antes de construir login, MFA, recuperación y navegación privada; revisar labels, pegado, gestores y estados no autorizados. | Acceso consistente con marca y sin barreras de interacción. |

Orden recomendado: T01 → T02–T03 → T04 → T05–T07 → T08–T09 → T10. Implementar primero las restricciones y transacciones; la interfaz no es la autoridad de los permisos. No crear una RPC pública de prueba para demostrar idempotencia.

Ejecutar H2-T11 antes y durante T05–T06; comprobar el resultado en T10. Su identificador añadido conserva los anteriores; no posterga el diseño hasta después de la implementación. Las tareas exclusivamente de backend mantienen sus pruebas y no requieren búsqueda visual.

## 3. Requerimientos técnicos

### 3.1. Datos, contratos y autorización

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H2-RT01 | Personal vinculado a Auth | `staff_accounts.auth_user_id` único; roles cerrados, `active=false` por defecto y FKs/revisiones del documento 10. El rol no se toma de metadata editable por el usuario. |
| H2-RT02 | Configuración única | `business_settings.id=1`, `whatsapp_e164=+51982042493`, `timezone=America/Lima`; `ordering_enabled=false` y `loyalty_enabled=false` inicialmente. No admite soft delete: se pausa mediante flags. |
| H2-RT03 | Acceso SQL restringido | `app_private` fuera de Data API y sin grants CRUD/USAGE para usuarios públicos. RLS más RPC estrechas; funciones definidas con `search_path=''`, permisos explícitos y revocación de ejecución a `PUBLIC`. |
| H2-RT04 | Permiso en cada operación | Verificar identidad actual, fila activa no eliminada, rol y AAL2 dentro de la RPC. `get_staff_access` solo expone acceso propio en AAL1 para conducir a MFA. |
| H2-RT05 | Bootstrap controlado | Identidad del responsable verificada por operador autorizado; `created_by=NULL` únicamente en bootstrap documentado. Registrar actor administrado/auditoría sin secretos. No aceptar rol ni actor enviado por el navegador. |
| H2-RT06 | Contratos de acceso/configuración | Reutilizar `Result`, errores y `MutationMeta`; `updateStaffAccessAction` → `update_staff_access`, `updateBusinessConfigAction` → `update_business_config`. Validar patch permitido y `expectedRevision`; no admitir secretos o reglas de premios en configuración. |
| H2-RT07 | Ampliación incremental | H2 mantiene los campos del singleton y contratos comunes; pagos/zonas se incorporan en H5 y activación del programa en H6. No aceptar patches sobre tablas todavía inexistentes ni habilitar funcionalidades incompletas. |
| H2-RT08 | Último responsable protegido | Lock global de administración de personal antes de contar responsables y bloquear filas. Cambio de rol, baja o eliminación concurrentes nunca dejan cero managers activos no eliminados. |

### 3.2. Sesiones, trazabilidad y conservación

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H2-RT09 | MFA y sesiones | SDK SSR por petición, validación real de Auth y TOTP para operaciones internas; una sesión AAL1 recibe `MFA_REQUIRED`. Recuperar contraseña no borra factores ni modifica rol/activo. |
| H2-RT10 | Rutas de acceso independientes | `/personal/acceso`, `/personal/mfa`, `/personal/recuperar` y `/personal/restablecer` quedan fuera del layout AAL2. `/personal` comprueba permiso antes de devolver datos. Sin ciclos de redirección. |
| H2-RT11 | Callback seguro | `GET /auth/confirm` valida token y tipo `invite`/`recovery`, conduce al destino propio definido y luego a MFA. No acepta redirecciones libres; respuesta sin caché y sin referrer, sin recursos externos ni tokens en logs. |
| H2-RT12 | Idempotencia transaccional | Recibo único por `(actor_user_id,operation_id)` y hash de entrada canónica. Bloqueo antes del efecto; cambio, revisión, auditoría y recibo se confirman juntos. Mismo UUID con entrada distinta devuelve `IDEMPOTENCY_CONFLICT`. |
| H2-RT13 | Resultado incierto | `getOperationAction` → `get_operation` comprueba identidad y permiso vigente. `not_found` no prueba finalización; conservar UUID/entrada y reintentar exactamente la misma operación. No conceder un replay a una cuenta desactivada. |
| H2-RT14 | Auditoría sin PII innecesaria | Actor y entidad, campos cambiados, motivo y correlación; no almacenar contraseña, OTP, token, teléfono ni valores personales completos en `changed_fields`. Recibos y auditoría rechazan UPDATE/DELETE. |
| H2-RT15 | Soft delete de personal | Campos `deleted_at`, `deleted_by`, `delete_reason`; motivo obligatorio de 10–500 caracteres. Baja y restauración aumentan revisión, auditan y mantienen FK/identidad. Restaurar deja `active=false`; reautorizar exige una operación explícita. |
| H2-RT16 | Infraestructura administrativa aislada | La clave secreta se usa exclusivamente en administración Auth autorizada, nunca como cliente general para saltar permisos SQL. DAL y secretos `server-only`; lecturas privadas/no-store y sin caché cruzada entre sesiones. |
| H2-RT17 | Pruebas pertinentes | Reset de migraciones, integración SQL con identidades reales de prueba, carreras concurrentes y E2E login/MFA/recuperación. Comprobar los códigos y límites, además de los botones visibles. |

Las mutaciones mantienen el orden de bloqueos definido en los contratos. No abrir una transacción mientras el usuario escribe un código MFA o mientras un proveedor envía un correo.

### 3.3. Diseño UX/UI y sistema visual

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H2-RT18 | Reglas y skill aplicables | Leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md); usar `ui-ux-pro-max` y registrar encaje/recomendaciones, sin depender de una ruta personal ni sustituir decisiones por una plantilla. |
| H2-RT19 | Patrón visual del hito | Formularios de contraseña/MFA/recuperación conservan etiquetas, errores asociados, autocompletado/pegado permitido y foco. Mensajes no revelan existencia de cuentas ni reactivan accesos; navegación mantiene layouts de acceso separados. |

Los valores visuales se consultan en el sistema canónico. La aceptación exige estados reales del alcance, anchos definidos allí y evidencia manual/automática pertinente; los recursos originales siguen pendientes en PT-09 cuando no estén disponibles. Esta ampliación no crea interfaces ni afirma pruebas ejecutadas.

## 4. Requerimientos funcionales de H2

El prefijo **H2-RF** identifica requisitos de este hito; no renumera RF-01–RF-18 del producto. Se relaciona principalmente con RF-15, RF-16 y RF-18.

| ID | Requerimiento funcional | Comportamiento observable |
| --- | --- | --- |
| H2-RF01 | Ingresar con cuenta individual | Personal autorizado usa su correo y contraseña; errores no permiten enumerar cuentas o revelar información privada. |
| H2-RF02 | Completar segunda verificación | Una sesión sin MFA puede completar el desafío, pero no realizar operaciones internas. Código incorrecto/expirado no otorga acceso. |
| H2-RF03 | Respetar los roles | Atención entra a sus funciones; solo el responsable mantiene configuración y permisos. Un usuario Auth sin fila staff carece de acceso interno. |
| H2-RF04 | Revocar acceso vigente | Desactivar o eliminar personal impide nuevas operaciones y lecturas protegidas aunque conserve un JWT aún válido. |
| H2-RF05 | Recuperar contraseña | La cuenta sigue el correo válido y establece una nueva contraseña; debe completar MFA y conserva sus restricciones anteriores. |
| H2-RF06 | Cerrar sesión | Se limpia el estado privado del navegador y no se muestran datos de la identidad anterior a quien ingresa después. |
| H2-RF07 | Mantener configuración con seguridad | El responsable modifica un campo permitido, recibe el resultado y puede comprobar auditoría. Formulario desactualizado exige revisión. |
| H2-RF08 | Recuperar una operación incierta | La interfaz informa incertidumbre y consulta/reintenta con el mismo identificador; no anuncia un cambio confirmado hasta conocer el resultado. |
| H2-RF09 | Conservar un responsable activo | Una baja o degradación que eliminaría al último responsable es rechazada, incluyendo dos solicitudes simultáneas. |
| H2-RF10 | Restaurar sin reactivar | Una cuenta restaurada sigue sin acceso hasta que un responsable la reautorice explícitamente; recuperar Auth no sustituye ese paso. |
| H2-RF11 | Entender acceso, verificación y recuperación | Una persona distingue login, MFA, recuperación y acceso denegado; puede usar teclado y ayudas de autenticación sin interpretar un correo enviado como acceso restituido. |

## 5. Definition of Done

Todos los puntos deben contar con evidencia. El [reporte de H2](evidencia/h2/README.md) identifica los resultados comprobados y lo pendiente; estas casillas de aceptación integral permanecen para la revisión del equipo, sin convertir pruebas automáticas en aceptación manual.

**Aclaración de recuperación comprobada en H2:** cuando la cuenta ya tiene MFA, Auth exige AAL2 antes de cambiar contraseña. El callback conduce a `/personal/restablecer`, donde se verifica el factor existente antes de mostrar el formulario; no se usa una API privilegiada para evitar ese requisito. Una invitación sin factor conduce a enrolamiento después de establecer contraseña. Ambos recorridos conservan roles y estado actual.

### Base de datos y permisos

- [ ] Las cuatro tablas de H2 y sus permisos se reconstruyen desde cero; tipos generados corresponden al esquema real.
- [ ] Bootstrap documentado crea el primer responsable sin dejar una vía pública para elevar roles.
- [ ] Anónimo, usuario sin staff, atención, responsable, AAL1, cuenta inactiva y eliminada producen los resultados autorizados/denegados esperados por llamada directa.
- [ ] Manipular metadata, actor o rol en la entrada no altera la autorización efectiva.
- [ ] Cambios concurrentes de personal conservan al menos un responsable activo; baja/restauración mantienen sus referencias y revisión.
- [ ] UPDATE/DELETE de recibos y auditoría se rechazan; no se publica acceso directo a tablas de negocio.

### Acceso y operaciones comunes

- [ ] Login, enrolamiento/verificación MFA, logout y recuperación ordinaria funcionan en el entorno de prueba.
- [ ] Tokens inválidos, tipo incorrecto y destinos externos del callback son rechazados; recuperación no elimina MFA ni reactiva personal.
- [ ] Las páginas de acceso funcionan fuera del layout protegido y las URLs directas no evitan guards.
- [ ] Configuración conserva singleton/flags seguros; formularios antiguos reciben conflicto sin sobrescribir cambios.
- [ ] Un reintento concurrente de configuración/acceso tiene un solo efecto, un recibo y auditoría coherente; cambiar su entrada con el mismo UUID produce conflicto.
- [ ] Tras pérdida de respuesta se recupera el mismo resultado; `not_found` y revocación de permiso no habilitan una operación nueva o un replay privilegiado.
- [ ] No hay caché privada compartida, secretos o datos sensibles en contenido cliente, respuestas y registros.
- [ ] Lint, TypeScript, build y pruebas del alcance pasan; evidencia identifica commit, entorno, resultados y casos no ejecutados.

### Diseño UX/UI y marca

- [ ] Se leyeron reglas del proyecto, UX/UI y sistema canónico; se aplicó `ui-ux-pro-max` al trabajo visual y se registraron consultas/recomendaciones aplicadas o descartadas con motivo.
- [ ] Acceso, MFA, recuperación, restablecimiento y denegación tienen estados revisados; pegado/gestor y teclado funcionan sin eliminar protecciones o conceder permisos por interfaz.
- [ ] Se revisaron los anchos de evidencia del sistema visual, sin desbordamiento involuntario ni acciones esenciales ocultas; no hay colores/medidas alternativos duplicados en componentes.
- [ ] Teclado, foco completamente visible, labels/errores, contraste renderizado, zoom/reflujo y lector se comprobaron en el alcance; resultado y casos no ejecutados están identificados.
- [ ] Capturas y reporte identifican versión/entorno y datos sintéticos. Evidencia específica: Login/MFA, errores/espera, recuperación y cuenta no autorizada; sin credenciales o tokens en capturas.

### Escenarios críticos y evidencia

| Referencia | Escenario que se debe comprobar | Evidencia requerida |
| --- | --- | --- |
| CA-26, CA-31; CT-10, CT-11 | Autorizar por rol/AAL2 actual y rechazar cuentas revocadas o entradas manipuladas. | Matriz de llamadas SQL/servidor y E2E con identidades separadas. |
| CT-12 | Dos responsables intentan dar de baja al otro simultáneamente. | Resultado concurrente y consulta que demuestra que permanece un manager activo. |
| CT-03, CT-28 | UUID repetido, entrada distinta, respuesta perdida y petición todavía en curso. | Un único efecto/recibo; correlación de solicitudes y prueba de recuperación. |
| CT-19, CT-26, CT-38 | Aislamiento de sesiones, logs y recuperación/invitación con callback seguro. | Pruebas de dos sesiones, inspección de respuestas/logs sin tokens y E2E Auth. |
| Documento 10: conservación | Baja/restauración, protección del último responsable e inmutabilidad. | Estado antes/después, revisión, auditoría y rechazo de accesos directos. |

El correo real de recuperación se comprueba antes de habilitar personal en un entorno remoto. En local pueden usarse servicios de prueba; esa evidencia no acredita SMTP productivo. PT-08 bloquea la definición/ejecución de recuperaciones excepcionales y la habilitación operativa con personal real, sin impedir aceptar la base técnica ordinaria probada de H2.

## 6. Dependencias y pendientes

**Requisito previo:** [H1](01-hito-1-preparacion-del-proyecto.md) aceptado: SDK por contexto, entorno local, contratos, migraciones y controles básicos disponibles. H2 aporta el personal referenciado por las FKs de soft delete en los próximos hitos.

| Pendiente | Trabajo afectado | Condición de cierre o bloqueo |
| --- | --- | --- |
| PT-08: personas autorizadas y recuperación excepcional | T03–T06 y futura gestión de H7. | Se pueden usar identidades sintéticas para probar. Cuentas reales/recuperación excepcional necesitan procedimiento y autorizados confirmados. |
| Servicios de correo y callbacks del entorno | T05–T06. | No habilitar recuperación real hasta comprobar entrega y destinos; documentar diferencias de local/staging/producción. |
| PT-11: conservación y baja | T08–T09; bajas de clientes de H7. | No inventar caducidad ni purga del historial. H2 implementa inmutabilidad y soft delete del personal. |
| PT-13: canje sin entrega | H7–H8. | No bloquea H2; no se resuelve modificando recibos o auditoría. |

**Transición:** [H3](03-hito-3-catalogo-publico.md) usa configuración y personal; H4 usa autorización/idempotencia; H6 usa recibos y auditoría; H7 añade las pantallas completas de personal e incidencias. Registrar qué servicio o autorización queda pendiente sin marcarlo como implementado.

## 7. Referencias

- [Reglas generales](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md).
- [Identidad visual y cobertura por vistas](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md) e [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md).

- [Guía general de hitos](hitos-del-proyecto.md).
- [Arquitectura](../diseno-tecnico/01-arquitectura.md).
- [Autenticación y seguridad](../diseno-tecnico/04-autenticacion-seguridad.md).
- [Contratos y operaciones](../diseno-tecnico/05-contratos-y-operaciones.md).
- [Despliegue y operación](../diseno-tecnico/07-despliegue-y-operacion.md).
- [Casos CA/CT y aceptación](../diseno-tecnico/08-pruebas-y-aceptacion.md).
- [Tablas y soft delete](../diseno-tecnico/10-tablas-db.md).
- [Rutas y controles de navegación](../diseno-tecnico/12-flujo-navegacion.md).
- [Registro de pendientes](../diseno-tecnico/README.md).

La creación de esta especificación no ejecuta migraciones, crea cuentas reales ni acredita pruebas de la aplicación.
