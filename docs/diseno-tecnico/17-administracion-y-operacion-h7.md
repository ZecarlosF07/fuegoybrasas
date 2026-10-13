# 17. Administración y operación de H7

**Fecha:** 11 de octubre de 2026. **Origen:** ampliación y procedimientos aprobados por el propietario al implementar H7. Complementa contratos, seguridad, navegación y diccionario; conserva diez sellos, Mostrito de ⅛, WhatsApp y acceso sin SMS.

## Decisiones del propietario

- **DC-12:** panel exclusivo del administrador con clientes, progreso, premios e indicadores. Se admite listado privado paginado; sustituye su exclusión anterior. Sin exportación masiva, campañas, POS o ventas no registradas.
- **DC-13 / PT-13:** «Restituir el premio tras confirmar que no se entregó, dejando historial y motivo». Solo manager/AAL2 confirma la ausencia de entrega física. Restituye el mismo UUID sin sumar sellos; conserva canje original y cierra la incidencia en una transacción.
- **DC-14 / PT-08:** aprobado recuperar presencialmente por administrador comprobando referencia de compra e historial, y conciliar sellos por caídas únicamente por administrador con fecha y referencia de compra pagada/entregada. El teléfono no prueba titularidad. Personas reales y recuperación del autenticador del personal deben confirmarse para lanzamiento.
- **DC-15:** «no se deberia de dar de baja clientes». Se retiran baja/restauración de cliente/tarjeta del producto. No hay botón, purga ni baja Auth. Metadatos históricos del esquema se conservan; las RPC rechazan estas entidades con FORBIDDEN. PT-11 sigue abierto para términos, aviso de datos y plazos de conservación, sin inventar obligaciones legales.

## Páginas y lecturas

`/administracion` muestra indicadores y clientes paginados; `/administracion/clientes/[id]` añade historial/intervenciones; `/administracion/incidencias` gestiona casos; `/administracion/personal` gestiona cuentas. Atención conserva búsqueda exacta y ficha mínima. Layouts y cada RPC comprueban cuenta activa, rol y MFA. Páginas dinámicas y Supabase no-store; no hay caché compartida de clientes.

| RPC | Entrada y resultado |
| --- | --- |
| `get_loyalty_dashboard` | Fechas desde/hasta inclusivas, diferencia máxima 366 días, America/Lima. Estado actual: clientes activos, tarjetas con 8/9 sellos, premios disponibles e incidencias abiertas. Periodo: visitas acreditadas, sellos revertidos, premios emitidos, canjes registrados y restituciones. |
| `get_admin_customers` | Filtro all/near_reward/available_reward, cursor UUID y límite 1–50 (20 predeterminado). Perfiles vigentes, tarjetas no cerradas: nombre/contacto, progreso, saldo, premios, última visita no revertida y estado. Sin claves/hashes. |
| `get_customer_history` | Cliente, cursor de la misma tarjeta y límite 1–50. Eventos inmutables ordenados por recorded_at/id descendentes, atención/registro, actor, referencias, motivo y eventos originales de reversión/restitución. |
| `get_loyalty_incidents` | Estado, cursor, límite e inclusión expresa de retiradas; casos con revisión, descripción, actor y resolución. Abiertas no pueden ocultarse. |
| `get_managed_staff` | Cuentas, correo, rol, revisión, acceso, baja e invitación. Sin contraseña, MFA o sesiones. |

Las visitas acreditadas son eventos brutos; las reversiones se muestran aparte. Reward_issued cuenta premios nuevos, no restauraciones de ordinales. Canje registrado no demuestra entrega física; restituciones se muestran aparte. No se calculan ticket promedio, ventas o margen sin datos de ventas. Los cuatro indicadores actuales se distinguen del periodo consultado.

## Correcciones y conservación

`reverse_stamp`: cliente, evento original, motivo 10–500 y UUID; solo manager/AAL2. Respeta locks operación/configuración/perfil/tarjeta/versión/premios. Rechaza evento ajeno, ya revertido o saldo negativo. Sin canje afectado añade delta -1 y anula premios disponibles afectados. Nueva compra válida recompone el ordinal existente (también oculto) por credit_stamp, sin duplicar UUID/snapshot.

Si afectaría un premio canjeado, devuelve review_required, registra una sola incidencia abierta sobre ese original y conserva saldo/canje. Replay conserva efecto y consulta estado actual. Una nota de cierre no aplica la reversión pendiente.

`correct_customer_profile`: cliente, revisión, nombre/indicaciones, solicitud expresa true, motivo y UUID. No altera contacto, identidad, clave o saldo. Auditoría conserva campos/revisión sin copiar nombre o indicaciones.

`close_incident`: revisión, nota 10–500 y UUID. Casos ordinarios quedan closed sin efecto contable. Reward_delivery_failed se resuelve mediante reinstate_reward, sin cierre genérico que oculte una entrega pendiente. Retiro requiere closed; restauración permanece closed.

Conservación acotada mantiene variantes comerciales/personal y añade versión no usada, premio voided e incidencia closed. No hay restauración genérica de premio: solo acreditación válida recompone ordinal. Versiones activas/usadas y premios available/redeemed están protegidos. Las identidades de clientes nunca se dan de baja desde la aplicación por DC-15.

## Premio registrado sin entrega

`reinstate_reward(incidentId,expectedRevision,notDeliveredConfirmed,reason,operationId)` exige manager/AAL2 y confirmación true de no entrega. Bloquea la tarjeta y el premio, comprueba incidente open de ese canje y añade evento reward_reinstated con delta 0, motivo y reinstates_event_id apuntando al reward_redeemed original. El mismo premio vuelve a available, sin cambiar ordinal/snapshot/progreso; clears del estado actual redeemed_at/by no borran el evento de canje original.

La incidencia queda closed con resolución/actor/fecha; nuevo canje posterior usa el mismo premio. Al crear `reward_delivery_failed`, el trigger vincula automáticamente `source_event_id` al canje vigente no restituido y rechaza otra referencia. La restitución utiliza ese evento exacto; no infiere el original por fechas o UUID. Esto protege también operaciones con timestamps iguales o transacciones iniciadas antes de obtener el bloqueo. Un caso histórico sin vínculo queda en revisión, sin asignación automática a un canje posterior. Índice único sobre `reinstates_event_id` y locks impiden doble restitución. Replay exige permiso vigente y conserva el efecto original. El trigger de premio solo admite redeemed→available junto con su evento autorizado, nunca un patch libre.

## Recuperación presencial

`recover_card_access` exige manager/AAL2, revisión de perfil, referencia de comprobante, evento stamp_credited de esa tarjeta con la misma referencia no revertida, confirmación de presencia y de titularidad, motivo y UUID. Sin evidencia suficiente (incluida tarjeta sin visitas/referencias) se escala para revisión; teléfono y nombre solos no recuperan acceso ni crean otra tarjeta.

Next deriva una nueva clave de 256 bits mediante HMAC con STAFF_AUTH_FLOW_SECRET y propósito separado, actor/cliente/UUID. Mismo UUID reproduce la clave sin persistirla en recibos o diario. PostgreSQL guarda solo su hash y vigencia técnica de 365 días; conserva UUID, contacto, progreso y premios. Claves/cookies antiguas quedan inválidas al cambiar el hash. Si otra rotación ocurrió después, replay antiguo se rechaza para no entregar un enlace obsoleto.

Solo la respuesta expresa de recuperación contiene enlace/QR, visibles temporalmente en memoria y entregados al titular presente; sin registros, trazas, analítica o capturas. Una respuesta perdida conserva UUID: comprobar recibo y reintentar la misma entrada para recuperar el enlace. Mantener estable el secreto mientras se concilian operaciones pendientes; rotarlo cambia la derivación y requiere revisión, sin fingir que el enlace previo puede reconstruirse. La interfaz no guarda la nueva clave como tarjeta propia del administrador.

## Contingencia

Registro interno restringido y mínimo: referencia, tarjeta, fecha real de compra pagada/entregada, responsable que verificó y estado pendiente/conciliado. No copiar platos, montos, direcciones ni datos sensibles innecesarios. Personal informa que el sello no está confirmado; no escribe offline ni promete saldo.

`credit_contingency_stamp` solo manager/AAL2: cliente, occurredAt, referencia obligatoria, motivo, pago/entrega true y UUID. Rechaza fecha futura o anterior a creación de tarjeta y referencia vigente duplicada. Exige programa operativo al conciliar. Comparte helper transaccional con credit_stamp; occurred_at conserva atención real y recorded_at registro actual. No edita eventos inmutables, aumenta un sello y emite/restaura premios con las mismas reglas.

## Invitaciones parciales

Auth y SQL no comparten transacción. prepare_staff_invitation reserva actor/UUID/hash y UUID de staff en recibo inmutable, sin correo en claro. Un correo no se reserva nuevamente con otro rol/actor. Contexto valida entrada/actor y Auth correspondiente; identidad existente ajena no se apropia.

Next crea Auth administrativo no confirmado con metadata interna de reserva; stage_staff_invitation crea staff inactive/pending. Solo metadata administrativa vincula la reserva, nunca asigna rol por sí sola. Reserva de envío por 90 segundos evita dos envíos simultáneos. Reintento consulta invited_at antes de enviar; si existe, concilia sin reenviar. Resultado incierto conserva la misma referencia/cuenta inactiva, sin anunciar acceso listo.

complete_staff_invitation comprueba el envío en Auth, activa la fila y añade recibo determinista ligado a la reserva. Empleado acepta correo y completa contraseña/MFA. Consultar el primer recibo muestra estado actual sin modificar su resultado original. No se garantiza entrega del correo ni exactamente una ejecución del proveedor externo. SMTP productivo queda para H8.

staff_accounts añade invitation_status (ready para existentes, pending/sent) e invitation_send_started_at timestamptz nullable. Pending nunca puede ser active. Puentes mínimos de Auth son privados de postgres y ejecutables solo por app_owner; sin grants CRUD de Auth ni secretos en proyecciones.

## Datos, diario y aceptación

Dieciocho tablas propias; loyalty_events añade reinstates_event_id (FK compuesta misma tarjeta, UNIQUE cuando presente) y reward_reinstated al enum textual. Reason también es obligatorio en restitución. Eventos, auditoría y recibos siguen inmutables; no cambia el número de tablas ni se eliminan registros de clientes.

Mutaciones guardan diario compartido mínimo: feature, actor, UUID, tipo, huella y fecha. Sin correo/contacto/nombre/indicaciones/motivo/clave. Fallo de storage impide enviar. Respuesta perdida exige comprobar get_operation antes de repetir la misma entrada/UUID; otra sección no pisa el diario. Recuperación e invitación parcial conservan el diario hasta conciliar o obtener enlace explícito.

UI usa tokens/primitivas existentes, fichas adaptables, etiquetas y resumen de error enfocado; carga contextual en botón para trabajo real. Selección local no simula carga. Revisión móvil/teclado/axe no sustituye Narrador o zoom real. [H7](../implementacion/07-hito-7-correcciones-y-operacion.md), [evidencia](../implementacion/evidencia/h7/README.md) y [continuidad](../implementacion/evidencia/h7/continuidad.md) distinguen resultados reales, piloto y ensayos pendientes.
