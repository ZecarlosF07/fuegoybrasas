# H6 — Contratos y operación de fidelización

> **Reporte histórico del 9/10/2026:** conserva los resultados ejecutados con OTP antes del cambio solicitado. El acceso vigente y sus verificaciones están en [revisión sin SMS](acceso-sin-sms/README.md); las variables/procedimiento SMS de este reporte dejaron de aplicarse al cliente.

**Fecha:** 9 de octubre de 2026.  
**Alcance:** núcleo ordinario implementado; [evidencia](README.md), [especificación](../../06-hito-6-fidelizacion.md). H7 define correcciones/recuperaciones excepcionales. No habilita producción.

## Preparación del entorno

El desarrollo habitual usa el Supabase remoto autorizado mediante yarn dev/build/start. Docker se utiliza exclusivamente para pruebas aisladas. Las cuatro migraciones H6 están aplicadas; no ejecutar reset remoto, seed sintético o configuración local de Auth sobre ese proyecto.

El programa remoto está draft, sin costo confirmado, sin disponibilidad y con loyalty_enabled=false. Acceso telefónico permanece deshabilitado en la aplicación. Configuración de servidor en .env.remote.local ignorado o secretos del hosting:

| Variable | Condición para habilitar |
| --- | --- |
| AUTH_PHONE_ENABLED | true únicamente tras verificar configuración Auth, proveedor, presupuesto y prueba controlada. Actualmente false. |
| AUTH_SMS_OTP_EXPIRY_SECONDS | Vigencia realmente configurada en Auth; entero entre 60 y 3600 en remoto. El 300 del ejemplo es propuesta, no confirmación del servicio. |
| AUTH_SMS_RESEND_SECONDS | Intervalo real de Auth; entero entre 60 y 3600. No acortar el límite para aparentar envío disponible. |
| LOYALTY_TERMS_APPROVED / LOYALTY_PRIVACY_APPROVED | true después de aprobación y publicación de documentos/versiones; actualmente false. |
| AUTH_CAPTCHA_PROVIDER / NEXT_PUBLIC_CAPTCHA_SITE_KEY | Proveedor soportado y site key del entorno; configurar también el secreto en Supabase Auth, exclusivamente servidor. |

La aplicación exige esos gates y CAPTCHA configurado para activar el programa o reanudarlo. No basta marcar una casilla del panel. La base exige manager/AAL2, versión/costo/revisión/términos y cinco confirmaciones explícitas. Los gates del entorno son configuración del operador, no una prueba automática de que SMS o textos están aprobados.

### Auth público de cliente y acceso del personal

Para el futuro entorno público, **habilitar y comprobar before_customer_created antes de permitir altas telefónicas**. En Supabase seleccionar el hook PostgreSQL public.before_customer_created. La función solo admite proveedor phone de app_metadata administrada por Auth, celular peruano y email vacío; rechaza alta pública por email u otros proveedores. user_metadata no concede acceso ni permite saltar el filtro. Execute pertenece solo a supabase_auth_admin.

Mantener proveedor email/login operativo para personal existente. En la versión local probada, auth.email.enable_signup=false deshabilita también ese proveedor de login: no usarlo como único control de registro. La combinación de proveedor habilitado y hook protege las altas públicas. No se cambió la configuración remota durante H6.

El hook se ejecuta también al invitar un email nuevo, antes de que Auth marque invited_at. **inviteUserByEmail sobre una identidad inexistente queda rechazado** con ese hook. Procedimiento administrativo probado localmente:

1. Operador autorizado crea identidad email no confirmada mediante Admin.createUser, email_confirm=false, exclusivamente servidor.
2. Genera enlace de invitación para esa identidad existente mediante Admin.generateLink, type=invite, callback fijo /auth/confirm.
3. La entrega autorizada por SMTP y la asignación de staff_accounts se realizan mediante el procedimiento de personal aprobado. Nunca publicar el enlace/token, confirmar email anticipadamente ni asignar rol por metadata.
4. Persona acepta invitación, define contraseña y completa MFA antes de acceso privado. Si un paso falla, no dejar un rol activo o una identidad confirmada por accidente.

La fixture [createInvitationFixture](../../../../tests/integration/staff-fixture.ts) comprueba los dos primeros pasos y la regresión E2E de H2 verifica invitación/contraseña/MFA. No se automatiza envío externo ni provisión de personas reales en H6; PT-08/H7 conservan la aprobación operativa.

### SMS local frente a proveedor real

[config.toml](../../../../supabase/config.toml) contiene dos teléfonos/OTP fijos sintéticos. La CLI exige habilitar un adaptador SMS: Twilio con valores inválidos sintéticos permite test_otp sin contratar ni enviar SMS. **No copiar esa configuración o esos códigos a remoto.**

La configuración efectiva del Auth local con test_otp utiliza vigencia de 6000 segundos y reenvío de 60; la pantalla local muestra 100 minutos. El entorno remoto usa su configuración confirmada, no ese bypass de pruebas.

Solicitud ordinaria usa signInWithOtp, canal sms, creación de identidad opcional y captchaToken cuando corresponde. Respuesta inicial no revela si existe tarjeta o si un número colisiona; 429/fallo de servicio sí muestra error. Verificación usa verifyOtp, tipo sms. Un código erróneo no publica sesión.

Cambio normal usa updateUser(phone) y verifyOtp(type=phone_change). El SDK instalado no recibe captchaToken en updateUser: se protege mediante sesión verificada y límites de Auth; no afirmar que se envía CAPTCHA en esa llamada. Antes/después se valida UUID y teléfono confirmado. Cookies del SDK se acumulan y solo se publican tras validación completa. Otro UUID produce IDENTITY_MISMATCH, sin fusionar tarjetas.

## Datos, permisos y privacidad

| Datos | Acceso y conservación |
| --- | --- |
| customers / loyalty_cards | Un perfil por Auth UUID y una tarjeta por cliente, incluidos eliminados. Teléfono solo en Auth. Alta atómica; closed/eliminado requiere revisión, nunca crea tarjeta nueva. |
| loyalty_program_versions | Draft inicial de diez sellos; una active. Meta/premio/términos de versión usada no se editan. Costo y stock son campos operativos versionados. |
| loyalty_rewards | Ordinal único por tarjeta, nombre/contenido al emitir; derecho independiente del progreso. Disponible/canjeado no se oculta por soft delete. |
| loyalty_events | Append-only; seis tipos preparados, H6 emite crédito/premio/canje. Deltas +1/-1/0 según tipo. Reversión/restauración/anulación mediante operaciones H7 futuras. |
| loyalty_incidents | Incidencia abierta visible hasta resolución autorizada; no se elimina abierta ni corrige saldo automáticamente. |
| operation_receipts / audit_entries | Inmutables. Actor/UUID/hash/efecto y metadatos mínimos; no copian teléfono, indicaciones o texto de incidencia. Descripciones permanecen en tabla privada. |

Las seis tablas H6 están en app_private con RLS, sin USAGE/CRUD para público o clientes de la Data API. RPC explícitas autorizan dueño o personal vigente. Puentes mínimos propiedad de postgres leen/bloquean identidad Auth; solo app_owner los invoca, sin otorgarle SELECT directo sobre auth.users. No se modifica la administración de Auth/Storage.

Las cinco tablas editables llevan deleted_at, deleted_by y delete_reason, motivo de 10–500 caracteres al eliminar. No liberan identidad ni relaciones. Restaurar perfil/tarjeta mantiene acceso closed; versión queda draft y stock false. Eventos/recibos/auditoría nunca usan soft delete. UI de suspensión, baja y restauración excepcional pertenece a H7.

GET /api/me/card valida sesión real, devuelve solo la tarjeta propia y responde private, no-store. Parámetros customerId no permiten elegir otra tarjeta. DTO propio incluye nombre, teléfono enmascarado, indicaciones, revisiones, progreso, premios y diez eventos sanitizados; excluye teléfono completo, actor, referencia de visita, UUID de operación y costo. Personal autorizado obtiene campos mínimos adicionales y referencias para operar. React.cache se limita al render de la petición, sin caché persistente por usuario.

## Rutas y operaciones

| Entrada | Operación de servidor | Permiso y comportamiento |
| --- | --- | --- |
| /mi-tarjeta/acceso | requestOtpAction / verifyOtpAction | Acceso opcional fuera del layout protegido, sin ciclos de redirección. Alta y verificación no acreditan visita. |
| Alta con nombre/aceptación | ensure_customer_profile | Teléfono confirmado; términos actuales/flag/version. Perfil+tarjeta atómicos, cero sellos. Existente válido devuelve tarjeta sin alta duplicada. |
| /mi-tarjeta | get_my_card / update_my_profile | Dueño confirmado; edición name/instructions con expectedRevision. Consulta sigue disponible con pausa/suspensión, closed devuelve revisión requerida. |
| /mi-tarjeta/telefono | requestPhoneChangeAction / verifyPhoneChangeAction | Misma identidad validada; número pendiente no identifica la tarjeta. |
| /personal | lookup_customer | Atención/manager activos AAL2, teléfono completo actual confirmado; sin búsquedas por prefijo/directorio. |
| /personal/clientes/[id] | get_staff_customer | UUID validado y permiso actual en cada lectura/mutación. Sin autorización por ocultar botones. |
| Registrar sello | credit_stamp | customerId, operationId, paidConfirmed=true, deliveredConfirmed=true, visitReference opcional ≤80 caracteres normalizados. Suma uno. |
| Registrar canje | redeem_reward | customerId, rewardId, operationId, laterVisitConfirmed=true, productAvailableConfirmed=true. Premio available, stock/flag/card válidos. |
| Registrar incidencia | open_incident | customerId, operationId, type, descripción 10–500, rewardId/sourceEventId opcionales válidos. Delivery_failed requiere premio canjeado. Sigue disponible con pausa. |
| /administracion/configuracion | get_loyalty_programs / activate_loyalty_program | Manager AAL2. Activación con programId, revisión, costo en céntimos, termsVersion y cinco checks true. |
| Costo/disponibilidad | update_reward_cost / set_reward_availability | Manager AAL2, revisión, UUID; conserva snapshots de canjes anteriores. |
| Comprobar resultado | get_operation | Solo actor autorizado actual; H2/H6 comparten contrato de recibos. Estado actual más efecto original en replay. |
| /pedido/datos | GET propio y aplicación explícita | Opcional; captura revisión del borrador y descarta respuestas antiguas. No modifica preferencias desde observaciones del pedido. |

Las Actions reciben unknown y validan Zod estricto; SQL revalida reglas y actor desde JWT/tabla, nunca un rol libre. La respuesta común contiene ok/data o error tipado con requestId; HTTP propio usa 200/401/404/409/503. Errores críticos: AUTH_REQUIRED, FORBIDDEN, TERMS_CHANGED, CARD_UNAVAILABLE, LOYALTY_PAUSED, REVISION_CONFLICT, DUPLICATE_VISIT_REFERENCE, REWARD_UNAVAILABLE, CONFIG_NOT_READY, IDEMPOTENCY_CONFLICT y OPERATION_UNCERTAIN.

## Sellos, premios y transacciones

Registrar después de entregar una compra presencial pagada. Personal confirma ambos hechos; WhatsApp no genera sello. No hay retrofecha ordinaria ni límite inventado de un sello diario. Referencia opcional repetida con crédito vigente en esa tarjeta se rechaza; una operación nueva no acredita por sí sola otra visita real.

Contador net_stamps conserva total neto; progreso es módulo diez. Al décimo se emite ordinal uno y el siguiente ciclo comienza 0/10; al undécimo 1/10 con premio independiente; al vigésimo ordinal dos. Sin vencimiento nuevo. Constraint diferido comprueba net_stamps=sum(stamp_delta) al commit; premio/eventos deben pertenecer a la misma tarjeta.

Canje en otra visita, que puede ocurrir el mismo día; no exige compra. Confirma cocina, registra canje y después entrega físicamente. Guarda costo de referencia vigente en evento inmutable, sin cambiar progreso. Si la entrega falla, incidencia; **PT-13 permanece pendiente**, sin reutilizar canje ni reemplazar el premio automáticamente.

Orden: bloqueo advisory actor/operación → configuración → identidad Auth en alta → perfil → tarjeta → versión → premio. Mutaciones ordinarias leen configuración/perfil/versión con FOR SHARE y tarjeta/premio con FOR UPDATE; activación/configuración respetan locks exclusivos. Emisión, contador, eventos, auditoría y recibo se confirman juntos. La consulta de estado actual en replay vuelve a comprobar autorización.

## Respuestas perdidas y contingencia

Antes de enviar, guardar fyb.staff-operations.v1 en sessionStorage: actor, UUID, tipo, IDs de cliente/programa/premio, hash y fecha. No guardar tokens, teléfono, indicaciones, descripción o referencia legible. La clave se comparte con configuración: no sobrescribir una operación pendiente de otra sección.

1. Error incierto bloquea otra operación. Conservar la referencia y usar Comprobar resultado; recarga restaura diario.
2. Recibo encontrado: consultar ficha actual y mostrar efecto confirmado sin repetir. Si actualización falla tras éxito, bloquear nuevas operaciones hasta obtener ficha fresca.
3. not_found no demuestra que la transacción haya acabado: reconstruir mismos datos/hash y reintentar mismo UUID. Cambiar entrada/identificador se rechaza.
4. Storage ilegible/bloqueado: no emitir escritura; solicitar revisión/contingencia aprobada. No limpiar manualmente un diario incierto para desbloquear.
5. Actor distinto o permiso degradado: no recuperar otra operación. Logout limpia estado privado según reglas, sin borrar el carrito comercial no sensible.

Durante caída de fidelización el pedido invitado sigue utilizable cuando el catálogo se puede validar. Registro manual/retroactivo y recuperación excepcional requieren PT-08/H7; H6 no concede esa autorización.

## Preparación futura y fuentes

Antes de activar: PT-06 costo completo; PT-07 proveedor, presupuesto, CAPTCHA, TTL/reenvío y pruebas reales de SMS/cambio de teléfono en Perú; PT-08 personas y procedimientos; PT-11 documentos/plazos/baja; PT-13 resolución de canje sin entrega. Ensayar staging sin datos reales y verificar SMTP/invitación/MFA. No usar precio de venta como costo del premio.

Fuentes primarias consultadas: [Phone login](https://supabase.com/docs/guides/auth/phone-login), [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp), [límites Auth](https://supabase.com/docs/guides/auth/rate-limits), [Before User Created](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook), [configuración CLI](https://github.com/supabase/supabase/blob/master/apps/docs/spec/cli_v1_config.yaml), [Auth signup](https://github.com/supabase/auth/blob/master/internal/api/signup.go) e [invitación](https://github.com/supabase/auth/blob/master/internal/api/invite.go). Las conclusiones del SDK/CLI instalado se comprobaron además en pruebas locales; estas fuentes no aprueban decisiones del negocio.
