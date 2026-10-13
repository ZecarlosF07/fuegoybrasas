# Hito 7 — Resolver errores y situaciones especiales

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](../diseno-tecnico/16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. MFA del personal se conserva.

**Versión:** 1.2 · **Fecha:** 11 de octubre de 2026.
**Destinatarios:** equipo de desarrollo, personal autorizado y responsable del negocio.  
**Estado:** implementación y verificación técnica terminadas; aceptación humana/operativa pendiente. [Contratos vigentes DC-12–15](../diseno-tecnico/17-administracion-y-operacion-h7.md) y [evidencia](evidencia/h7/README.md) separan pruebas ejecutadas de capacitación/piloto pendientes.
**Guía general:** [Hitos del proyecto](hitos-del-proyecto.md).

## 1. Descripción del objetivo

Dar al responsable herramientas y procedimientos para corregir errores, administrar accesos y sostener la operación cuando hay fallos de identidad, red o entrega. Cada intervención conserva el hecho original, su actor, el motivo y el resultado; una corrección no borra historial ni convierte silenciosamente un premio entregado en disponible.

El resultado esperado es un conjunto operativo verificable: reversión de sellos, incidencias, gestión de personal, recuperación excepcional aprobada, conservación de entidades privadas y contingencia controlada. El personal debe poder reconocer cuándo un caso necesita al responsable y cuándo todavía no existe un procedimiento aprobado para resolverlo.

### Alcance del hito

- `reverse_stamp`, historial autorizado, corrección de nombre/indicaciones y cierre de incidencias.
- `/administracion/incidencias` y `/administracion/personal`; ampliaciones de ficha de cliente y configuración interna.
- Invitaciones, roles, bajas/restauraciones y reconciliación de invitaciones Auth incompletas.
- Retiro/restauración de personal, versiones no usadas, premios anulados e incidencias cerradas, con conservación y protecciones. Clientes/tarjetas no se dan de baja.
- Recuperación presencial, contingencias y restitución por no entrega según DC-13/DC-14 aprobadas.
- Preparación de respaldo/recuperación y reconciliación que H8 ensayará integralmente.

PT-13 tiene resolución aprobada e implementada. PT-08 tiene procedimientos de recuperación de tarjeta y contingencia aprobados; quedan personal real y recuperación de MFA para lanzamiento. PT-11 conserva términos/aviso/plazos pendientes; DC-15 excluye baja de clientes. El cierre operativo requiere las pruebas y la preparación del personal, además de la implementación.

**Actualización aprobada del 11/10:** el propietario eligió restitución supervisada tras confirmar no entrega (PT-13), aprobó recuperación presencial con referencia/historial y conciliación de contingencia solo por administrador (PT-08), y excluyó baja de clientes/tarjetas (DC-15). Se conserva esa identidad, progreso y premios; las antiguas tareas/casillas de baja quedan sustituidas, sin purgas ni baja Auth. PT-11 solo mantiene textos/plazos pendientes para lanzamiento. Se añade panel de indicadores y listado privado paginado exclusivo del administrador (DC-12). Las filas históricas siguientes se interpretan con estas decisiones vigentes.

## 2. Tareas del hito

| ID | Tarea | Trabajo concreto | Resultado esperado |
| --- | --- | --- | --- |
| H7-T01 | Revisar excepciones y decisiones | Relacionar corrección, privacidad, recuperación y contingencia con PT-08/PT-11/PT-13; definir responsable y evidencia requerida para cada decisión. | Registro de bloqueos que distingue lo implementable de lo pendiente. |
| H7-T02 | Implementar reversión transaccional | Añadir `reverse_stamp` con evento original/motivo, cálculo de premios afectados, recibos y resultado `review_required` cuando corresponde. | Corrección única y trazable sin editar eventos antiguos. |
| H7-T03 | Implementar restauración contable | Conectar nueva acreditación válida a premio anulado del mismo ordinal, incluso oculto mediante soft delete; conservar UUID y eventos. | Recuperación del derecho sin duplicar premios. |
| H7-T04 | Implementar historial y corrección de perfil | Consulta manager paginada y `correct_customer_profile` con solicitud expresa, revisión y motivo. | Responsable puede revisar/corregir datos permitidos sin cambiar teléfono o saldo. |
| H7-T05 | Completar incidencias | Listado, apertura, revisión y cierre versionado, motivos y conservación; no ocultar incidentes abiertos ni tratar cierre como corrección contable. | Anomalías visibles y seguimiento trazable. |
| H7-T06 | Completar gestión de personal | Invitación Auth aislada, asignación verificada, reconciliación parcial, roles, revocación, baja y restauración inactiva. | Panel utilizable sin eludir protección del último responsable ni MFA. |
| H7-T07 | Completar conservación privada | Conservar versiones no usadas, premios anulados e incidencias cerradas, con protecciones del documento 10. DC-15 excluye baja de clientes/tarjetas. | Historial conservado; restauración no reactiva y clientes no se dan de baja. |
| H7-T08 | Recuperar acceso presencial aprobado | Aplicar DC-14: administrador contrasta comprobante/historial, confirma presencia/titularidad y rota clave sin duplicar tarjeta. | Identidad/progreso conservados y enlace antiguo inválido. |
| H7-T09 | Registrar resolución del premio fallido | Documentar DC-13 aprobada: restitución supervisada al confirmar no entrega, permisos, estados, auditoría y FK al canje original. | Acuerdo trazable que conserva el mismo premio e historial. |
| H7-T10 | Implementar la resolución aprobada | Tras T09, implementar la operación/UX y migraciones que la decisión requiera; comprobar que no duplica derechos ni borra el canje original. | Caso premio registrado/no entregado resoluble con evidencia. |
| H7-T11 | Implementar contingencias aprobadas | DC-14 define registro mínimo restringido y conciliación posterior solo manager con fecha real/referencia de compra pagada y entregada. | Caída del servicio no produce promesas de saldo ni duplicados al recuperarse. |
| H7-T12 | Preparar recuperación operativa | Documentar respaldos, pausa de escrituras y reconciliación de entregas posteriores al punto restaurado; preparar ensayo aislado de H8. | Plan que conserva coherencia entre datos digitales y entregas físicas. |
| H7-T13 | Verificar, capacitar y presentar | Probar reversión/incidencias/conservación/permisos, procedimientos aprobados y competencia del personal en prueba controlada. | Evidencia y entrega operativa revisable. |
| H7-T14 | Diseñar herramientas operativas con la skill | Aplicar ui-ux-pro-max a historial, correcciones, incidencias y accesos; revisar consecuencias, motivo y estados parciales con sistema canónico y procedimientos aprobados. | Herramientas comprensibles que no confunden incidencia o restauración con resolución. |
| H7-T15 | Implementar supervisión administrativa | Panel de indicadores por periodo, clientes paginados y filtros de 8/9 sellos o premios pendientes; ficha administrativa separada de atención. | Administrador supervisa progreso, premios y movimientos; atención no consulta el conjunto. |

Orden recomendado: T01 → T02–T07 → T08–T11 → T12–T13; T15 reutiliza lecturas y permisos. DC-13/DC-14 ya resuelven las puertas de decisión funcionales. La capacitación y servicios reales siguen requiriendo evidencia.

Ejecutar H7-T14 antes y durante T04–T07; aplicar su parte de T10/T11 solo después de resolver las decisiones que las bloquean. Su identificador añadido conserva los anteriores; no posterga el diseño hasta después de la implementación. Las tareas exclusivamente de backend mantienen sus pruebas y no requieren búsqueda visual.

## 3. Requerimientos técnicos

### 3.1. Correcciones, incidencias y conservación

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H7-RT01 | Reversión autorizada | `reverseStampAction` → `reverse_stamp`, solo manager activo/AAL2: cliente, evento original acreditado, UUID y motivo 10–500. Rechazar evento ajeno/ya revertido e incremento libre. |
| H7-RT02 | Reversión sin canje afectado | Delta -1, evento `stamp_reversed` y anulación de premios disponibles afectados con eventos, contador y recibo atómicos. Verificar saldo no negativo y conservar original/relaciones. |
| H7-RT03 | Reversión con canje afectado | Si el saldo posterior afectaría un premio canjeado, crear una sola incidencia/recibo `review_required`; no decrementar saldo, generar deuda, borrar canje ni reponer premio automáticamente. |
| H7-RT04 | Ordinal restaurado por acreditación | Al recompletar un umbral, usar premio voided existente del mismo ordinal/UUID; emitir `reward_restored`, limpiar metadatos de borrado si estaba oculto y conservar snapshots. Solo nueva acreditación válida puede hacerlo; no botón genérico de restaurar premio. |
| H7-RT05 | Historial y perfil | `get_customer_history` manager con cursor, tamaño por defecto 20/máximo 50. `correctCustomerProfileAction` → `correct_customer_profile` exige solicitud expresa, revisión, motivo y UUID; audita campos, sin copiar texto personal. |
| H7-RT06 | Incidencias versionadas | `open_incident`/`close_incident` respetan permisos; cierre manager con revisión/nota/actor/fecha, sin efecto contable implícito. Baja solo closed; restauración conserva closed. Incidente abierto no puede ocultarse. |
| H7-RT07 | Clientes sin baja | DC-15 excluye baja/restauración de cliente/tarjeta: RPC deniegan ambas entidades, no hay botón, purga ni baja Auth. Metadatos históricos del esquema se conservan. |
| H7-RT08 | Protecciones privadas | Versión activa o usada no se elimina, se retira; versión restaurable no usada vuelve a draft. Premio available/redeemed no admite soft delete; voided puede ocultarse sin destruir identidad. Último manager e incidentes abiertos siguen protegidos. |
| H7-RT09 | Conservación inmutable | No DELETE/UPDATE de `loyalty_events`, `operation_receipts` ni `audit_entries`; `business_settings` mantiene singleton/flags. Las 14 tablas editables llevan los tres campos coherentes de borrado, revisión, motivo y auditoría. |
| H7-RT10 | Operaciones administrativas estrechas | Lista cerrada de entidades en `soft_delete_entity`/`restore_entity`, manager/AAL2, revisión/UUID/motivo. RLS no reemplaza filtros explícitos de entidad/padres; incluir eliminados solo en lecturas autorizadas de revisión. |
| H7-RT11 | Concurrencia y reintentos | Reversión/conservación mantienen orden de locks del diseño y permiso actual antes del replay; correcciones e incidencias pueden operar con programa pausado. Recibos y diario conservan UUID ante fallo y evitan segunda intervención. |

### 3.2. Personal, excepciones y continuidad

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H7-RT12 | Invitaciones verificadas | `inviteStaffAction` requiere manager/AAL2; Auth administrativo solo servidor. Identidad invitada queda sin acceso activo si Auth/fila staff no se completan; comprobar resultado y reconciliar antes de repetir. No anunciar «acceso listo» ante efecto parcial. |
| H7-RT13 | Permisos y última cuenta | Reutilizar `update_staff_access` y lock global antes de contar managers. Baja deja inactive/eliminado; restauración deja inactive y requiere reautorización. JWT vigente/password recuperada no saltan esa comprobación. |
| H7-RT14 | Recuperación presencial aprobada | Manager/AAL2 contrasta referencia e historial de la misma tarjeta, confirma presencia/titularidad y rota hash con revisión/UUID/motivo. Sin traslado de saldo, alta duplicada, recuperación pública ni retirada de MFA. |
| H7-RT15 | Privacidad y conservación | PT-11 mantiene términos/aviso/plazos pendientes para lanzamiento. DC-15 excluye baja de clientes; no fijar plazos legales ni borrar Auth. Cualquier cambio posterior requiere acuerdo explícito y diseño específico. |
| H7-RT16 | Restitución aprobada por no entrega | DC-13: solo manager/AAL2 confirma no entrega, agrega reward_reinstated con motivo y FK al canje, devuelve el mismo premio a available y cierra incidencia. Original inmutable, saldo/ordinal intactos y doble resolución rechazada. |
| H7-RT17 | Acreditación de contingencia | DC-14: solo manager utiliza `occurredAt` y referencia obligatoria, sin fecha futura ni anterior a la tarjeta; separar entrega real de `recorded_at`. Registro interno restringido, mínimo y conciliado; no sincronización automática offline. |
| H7-RT18 | Respaldo y reconciliación | Inventariar SQL, Auth/configuración necesaria y archivos Storage: respaldo DB no garantiza copia de bytes Storage. Restaurar aislado, pausar escrituras y conciliar entregas posteriores al respaldo antes de habilitar operaciones. |
| H7-RT19 | Observabilidad y pantallas | `/administracion/incidencias`/`personal` manager/no-store; ficha solo datos pertinentes. RequestId/operationId para diagnóstico sin teléfono, preferencias, direcciones, OTP o tokens en logs. |
| H7-RT20 | Pruebas | SQL e integración de reversión/conservación/carreras, E2E de incidencias/invitaciones y ensayo de procedimientos aprobados. Prueba de CT-24 reconcilia contador/eventos/ordinales también tras correcciones, sin reparación destructiva automática. |

Las siete migraciones H7 incorporan las operaciones y sus protecciones. DC-13 añade `reinstates_event_id` y `reward_reinstated` sin tablas adicionales; DC-14 comparte el crédito transaccional y rota el hash de acceso. Las migraciones aplicadas permanecen inmutables; ajustes posteriores requieren una nueva.

### 3.3. Diseño UX/UI y sistema visual

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H7-RT21 | Reglas y skill aplicables | Leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md); usar `ui-ux-pro-max` y registrar encaje/recomendaciones, sin depender de una ruta personal ni sustituir decisiones por una plantilla. |
| H7-RT22 | Patrón visual del hito | Correcciones/incidencias/personas mantienen jerarquía funcional, identidad y efecto explícitos, conflictos/pendientes accesibles y confirmaciones con motivo. Diseñar resoluciones excepcionales solo cuando PT-08/PT-11/PT-13 determinen su comportamiento. |
| H7-RT23 | Supervisión administrativa | Dashboard y listado privado paginado solo manager activo/AAL2, filtros por progreso/premio y periodo America/Lima; límite/cursor validados, DTO sin claves y datos sin caché compartida. Indicadores distinguen estado actual y eventos del periodo. |

Los valores visuales se consultan en el sistema canónico. La aceptación exige estados reales del alcance, anchos definidos allí y evidencia manual/automática pertinente; los recursos originales siguen pendientes en PT-09 cuando no estén disponibles. Esta ampliación no crea interfaces ni afirma pruebas ejecutadas.

## 4. Requerimientos funcionales de H7

**H7-RF** amplía RF-15–RF-18 con las capacidades administrativas descritas en el diseño.

| ID | Requerimiento funcional | Comportamiento observable |
| --- | --- | --- |
| H7-RF01 | Corregir un sello erróneo | Responsable selecciona evento original e indica motivo; ve el efecto y el original permanece en historial. Atención no puede revertir. |
| H7-RF02 | Conservar derechos al corregir | Reversión válida anula premio pendiente afectado; una visita válida posterior restaura ese ordinal sin crear otro premio duplicado. |
| H7-RF03 | Revisar corrección sobre canje | Si se afectaría premio canjeado, aparece incidencia y resultado de revisión sin cambio automático de saldo o canje. |
| H7-RF04 | Revisar/cerrar incidencias | Responsable ve casos y añade resolución; cierre no acredita, canjea ni restaura por sí mismo. Caso abierto no puede ocultarse. |
| H7-RF05 | Corregir datos por solicitud | Responsable cambia nombre/indicaciones solicitados expresamente; no altera teléfono o saldo ni vence conflictos de revisión silenciosamente. |
| H7-RF06 | Administrar personal | Responsable invita, revisa permisos, desactiva o restaura cuentas; siempre permanece un responsable activo. |
| H7-RF07 | Resolver invitación parcial | Cuenta parcialmente invitada se muestra como pendiente de reconciliación y no como lista para operar; no se envían invitaciones repetidas sin revisar. |
| H7-RF08 | Recuperar tarjeta presencialmente | Administrador confirma presencia/titularidad con referencia de compra e historial de esa tarjeta; rota acceso conservando identidad/progreso, sin fusionar tarjetas. Sin evidencia suficiente, escala para revisión. |
| H7-RF09 | Conservar clientes sin baja | No existe baja de clientes/tarjetas por DC-15. Recuperación mantiene identidad, contacto, progreso y premios; solo sustituye la clave privada tras verificación presencial. |
| H7-RF10 | Operar ante caída | Personal informa estado, conserva registro permitido por contingencia y responsable concilia después con referencias/fecha real; no promete un sello ya registrado si no se confirmó. |
| H7-RF11 | Restituir premio no entregado | Administrador confirma no entrega y motivo: el mismo premio vuelve a disponible, incidencia cerrada, canje original conservado y saldo intacto. El mozo reporta el caso; no lo restituye. |
| H7-RF12 | Recuperar sin duplicar entregas | Tras restauración de datos, operaciones permanecen pausadas hasta revisar regalos/visitas posteriores al respaldo y recuperar consistencia. |
| H7-RF13 | Reconocer resultado y consecuencias de una intervención | El responsable distingue revisión requerida, incidencia cerrada, saldo corregido, baja y restauración; una nota o pantalla no implica autorización, restitución de premio o reactivación. |
| H7-RF14 | Supervisar clientes y actividad | Administrador ve registros, tarjetas con ocho/nueve sellos, premios pendientes e incidencias; consulta visitas/reversiones/emisiones/canjes/restituciones por periodo. Atención no accede al conjunto y los indicadores no afirman ventas ni entrega física. |

## 5. Definition of Done

El hito solo se acepta completo con evidencia técnica y operativa. Las casillas aprobadas enlazan al [reporte H7](evidencia/h7/README.md); las pendientes distinguen capacitación, revisión humana y servicios de lanzamiento.

### Correcciones y conservación

- [x] Panel, filtros, paginación e indicadores funcionan con manager/MFA y deniegan al mozo acceso por URL/RPC; estado actual y actividad del periodo se distinguen sin cifras de ventas inventadas.
- [x] Revertir 10→9 con premio disponible añade reversión/anulación y conserva original; acreditar de nuevo restaura mismo ordinal/UUID.
- [x] Premio anulado y oculto por soft delete se restaura contablemente mediante nueva acreditación válida, sin botón libre ni duplicación.
- [x] Reversión que afectaría premio canjeado genera una incidencia/recibo de revisión y mantiene saldo/canje; repetición no crea otra incidencia.
- [x] Segundo intento de revertir el mismo evento y atención intentando corregir son rechazados.
- [x] Historial paginado y corrección de perfil respetan permisos, solicitud expresa, revisión y auditoría sin PII innecesaria.
- [x] Cerrar incidente exige nota/revisión/actor y no modifica saldo; incidente abierto no se puede ocultar y restaurado sigue cerrado.
- [x] Baja/restauración de cliente y tarjeta quedan denegadas por DC-15, sin botón, purga ni baja Auth; recuperación conserva UUID/progreso/premios.
- [x] Se verifican las 14 tablas editables, tres historiales inmutables y singleton, incluyendo claves únicas retenidas y protecciones de versiones/premios.
- [x] Reintentos/concurrencia de corrección y conservación producen un solo efecto autorizado y revisiones consistentes.

### Personal y procedimientos aprobados

- [x] Invitación completa funciona con Auth real de prueba; efectos parciales no otorgan acceso y se reconcilian antes de repetir.
- [x] Panel administra roles/bajas/restauración con MFA, revocación efectiva y carrera del último manager protegida.
- [x] **DC-14 aplicado:** recuperación presencial y contingencia aprobadas, T08/T11 implementadas y probadas sin transferencias de saldo.
- [ ] **PT-08 operativo:** confirmar personas reales autorizadas y recuperación de MFA del personal antes del lanzamiento.
- [x] **DC-15 aplicado:** sin baja de clientes/tarjetas; metadatos e historial conservados. PT-11 mantiene textos/plazos de privacidad pendientes para lanzamiento, sin inventarlos ni borrar Auth.
- [x] **PT-13 resuelto:** T09 registra decisión y diseño; T10 está implementada y probada, conserva canje original y evita doble resolución concurrente.
- [x] Acreditación diferida manager conserva fecha real distinta de registro; referencia/replay impiden duplicar visitas tras caída.
- [x] Hay procedimiento de respaldo/restauración/reconciliación preparado y ensayo aislado trazable, ampliado integralmente en H8.
- [ ] Personal sabe reconocer incertidumbre y escalar incidencias; no anuncia saldo/entrega confirmados sin evidencia.
- [x] Lint, TypeScript, build y pruebas pertinentes pasan; reportes identifican commit/entorno, casos y acuerdos aprobados.

### Diseño UX/UI y marca

- [x] Se leyeron reglas del proyecto, UX/UI y sistema canónico; se aplicó `ui-ux-pro-max` al trabajo visual y se registraron consultas/recomendaciones aplicadas o descartadas con motivo.
- [x] Correcciones, incidencias, invitaciones/bajas y restauraciones tienen estados revisados y consecuencias explícitas; PT-08/PT-11/PT-13 pendientes no aparecen resueltos mediante copy o una pantalla ficticia.
- [x] Se revisaron los anchos de evidencia del sistema visual, sin desbordamiento involuntario ni acciones esenciales ocultas; no hay colores/medidas alternativos duplicados en componentes.
- [ ] Teclado, foco completamente visible, labels/errores, contraste renderizado, zoom/reflujo y lector se comprobaron en el alcance; resultado y casos no ejecutados están identificados.
- [x] Capturas y reporte identifican versión/entorno y datos sintéticos. Evidencia específica: Reversión ordinaria/revisión requerida, incidente abierto/cerrado, invitación parcial, cuenta restaurada inactiva y protecciones del último responsable.

### Escenarios críticos y evidencia

| Referencia | Escenario que se debe comprobar | Evidencia requerida |
| --- | --- | --- |
| CA-33; CT-07–CT-09 | Reversión ordinaria, ordinal restaurado y premio canjeado afectado. | Filas/eventos/recibos antes y después; E2E y carrera de intervención repetida. |
| CT-24, CT-35 | Reconciliación tras correcciones e intervención sobre perfil solicitada/con revisión. | Consulta de integridad y prueba de permiso/conflicto/auditoría. |
| CT-11, CT-12, CT-38 | Acceso revocado, último responsable e invitación/recuperación. | Pruebas directas concurrentes y Auth/E2E con fallos parciales. |
| CT-23, CT-25, CT-28 | Contingencia tardía, restauración con entregas posteriores e incertidumbre. | Registro interno restringido, ensayo de conciliación y recuperación de UUID. |
| Documento 10: conservación | Todas las protecciones privadas, historial inmutable y restauración sin reapertura. | Matriz por entidad y actor; estados/revisiones/FKs/UUID conservados. |
| DC-13/DC-14/DC-15; PT-08/PT-11 | Recuperación presencial, no baja y restitución por no entrega. | Acuerdo fechado, integración/E2E de excepciones y denegaciones; preparación real y privacidad pendientes claramente identificadas. |

PT-13 queda resuelto técnica y funcionalmente por DC-13 y sus pruebas. PT-08 conserva preparación operativa; PT-11 bloquea lanzamiento público. Un cierre de incidencia con una nota no sustituye la restitución supervisada ni la evidencia de no entrega.

## 6. Dependencias y pendientes

**Requisitos previos:** [H2](02-hito-2-acceso-del-personal.md), [H4](04-hito-4-administracion-del-catalogo.md) y [H6](06-hito-6-fidelizacion.md). H2 aporta acceso/recibos; H4 conservación comercial; H6 eventos, premios, incidencias y diario de operaciones.

| Pendiente | Trabajo afectado | Qué impide aceptar o ejecutar |
| --- | --- | --- |
| PT-08: personas reales y recuperación MFA del personal | T06, T13; operación real. | Recuperación de tarjeta/contingencia aprobadas y probadas; confirmar responsables y procedimiento del autenticador antes de operar públicamente. |
| PT-11: términos/aviso/plazos | Lanzamiento de fidelización. | No inventar conservación legal ni tratamiento Auth; DC-15 excluye baja de clientes. No bloquea las pruebas sintéticas H7. |
| PT-13: resuelto por DC-13 | T09–T10. | Restitución supervisada aprobada y comprobada; no conserva bloqueo funcional. |
| PT-12: nivel de respaldo contratado | T12. | Ensayo local puede avanzar; cobertura y procedimiento productivos requieren plan/servicios confirmados. |

**Transición:** [H8](08-hito-8-piloto-y-lanzamiento.md) verifica conjuntamente recorridos, capacitación, datos reales, recuperación y despliegue. Ningún pendiente central se considera cerrado por escribir estas especificaciones; debe quedar evidencia del acuerdo y de su funcionamiento.

## 7. Referencias

- [Reglas generales](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md).
- [Identidad visual y cobertura por vistas](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md) e [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md).

- [Guía general de hitos](hitos-del-proyecto.md).
- [Fidelización y correcciones](../diseno-tecnico/02-fidelizacion.md).
- [Permisos y recuperación](../diseno-tecnico/04-autenticacion-seguridad.md).
- [Contratos de reversión/incidencias/personal](../diseno-tecnico/05-contratos-y-operaciones.md).
- [Diario y estados de operación](../diseno-tecnico/06-frontend-y-estado.md).
- [Contingencia y recuperación](../diseno-tecnico/07-despliegue-y-operacion.md).
- [Casos CA/CT](../diseno-tecnico/08-pruebas-y-aceptacion.md).
- [Tablas y soft delete](../diseno-tecnico/10-tablas-db.md).
- [Navegación](../diseno-tecnico/12-flujo-navegacion.md).
- [Pendientes PT-08, PT-11 y PT-13](../diseno-tecnico/README.md).

Los resultados y límites de las comprobaciones ejecutadas se consultan en [evidencia H7](evidencia/h7/README.md). La implementación no activa el programa público ni acredita capacitación o piloto.
