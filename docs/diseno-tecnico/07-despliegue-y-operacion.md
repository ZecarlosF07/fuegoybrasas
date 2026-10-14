# 07. Despliegue, configuración y operación

**Actualización DC-22, 13/10/2026:** [personal sin MFA](19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Actualización del 10/10/2026:** [acceso privado sin SMS](16-acceso-a-tarjeta-sin-sms.md) sustituye OTP/phone_change e identidad telefónica del cliente; El acceso actual del personal se define en DC-22.

**Versión:** 1.1 · **Fecha:** 3 de octubre de 2026.  
**Relacionado:** [Seguridad](04-autenticacion-seguridad.md), [Datos](03-modelo-de-datos.md), [Implementación](09-plan-de-implementacion.md).

## 1. Infraestructura propuesta

Next.js en Vercel y Supabase administrado, sin servidor adicional. Es una propuesta técnica; cuentas, dominio y planes se confirman antes de contratar. [Vercel documenta soporte para Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs). No usar exportación estática: esta aplicación requiere acciones de servidor, Auth y validación.

El entorno verificado en H1 usa Node 22.16.0 y Yarn 1.22.22. Next.js instalado exige Node >=20.9.0. Se fija Node 22 y `yarn.lock`; compilar y verificar exclusivamente con Yarn conforme a la instrucción del propietario del 4 de octubre de 2026.

Docker Desktop funciona con motor Linux. Supabase CLI 2.119.0 está fijada en el proyecto. H1 comprobó arranque local, reset, migración y SDK real; el proyecto remoto autorizado `geazxsvjkqpzbghlywbw` recibió la migración inicial. Credenciales locales/remotas separadas en archivos ignorados. Ver [instrucciones](../../README.md) y [evidencia de H1](../implementacion/evidencia/h1/README.md); esto no acredita despliegue público, OTP ni piloto.

Elegir región disponible de Supabase y ejecución de Next.js según latencia medida desde Perú; colocarlas próximas cuando el proveedor lo permita. Región exacta pendiente de disponibilidad/cuentas, sin prometer una localización no contratada. Las RPC usan primario para consistencia.

## 2. Entornos separados

| Entorno | Datos | Auth y uso |
| --- | --- | --- |
| Local | Supabase CLI y Docker, migraciones/fixtures reproducibles. | Teléfonos y usuarios sintéticos; OTP de prueba exclusivamente local. |
| Staging | Proyecto Supabase separado del productivo y preview de Next.js. | Equipo de prueba, permisos vigentes, OTP real controlado y datos ficticios de pedido. |
| Producción | Proyecto y claves propios; catálogo confirmado. | Clientes reales, condiciones aprobadas y roles mínimos. |

No conectar previews públicos a datos de clientes productivos. No restaurar perfiles reales en staging sin tratamiento aprobado. Las fixtures nunca incluyen cuentas del propietario o claves reales.

## 3. Variables y configuración

| Variable/configuración | Lugar | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | App por entorno. | URL del proyecto correspondiente. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | App por entorno; pública. | SDK sujeto a permisos/RLS. |
| `SUPABASE_SECRET_KEY` | Secret store del servidor. | Administración aislada de Auth; no operaciones ordinarias. |
| `APP_SITE_URL` | Servidor. | URL canónica y callbacks permitidos; sin comodines abiertos en producción. |
| Credenciales SMTP | Dashboard/secrets de Supabase/proveedor. | Correos del personal si se habilitan; clientes sin SMS. CAPTCHA retirado por DC-20. |
| `SUPABASE_ACCESS_TOKEN` y referencia de proyecto | Secretos de CI/operador. | Migraciones y despliegue; nunca variables públicas de la app. |

Validar variables al iniciar; error claro de configuración sin imprimir valores. `.env.example` futuro contiene nombres y placeholders; `.env.local` y credenciales no se versionan. Variables públicas se incorporan al build y se reconstruye cuando cambian.

Número oficial, horarios, tarifas y métodos de pago son datos comerciales en base, no variables secretas. Flags `ordering_enabled` y `loyalty_enabled` permiten activar funciones independientemente tras revisión.

## 4. Secuencia de despliegue

1. Revisar commit/lockfile, documentación, cambios de esquema y tests correspondientes.
2. Aplicar migraciones a local vacío y staging; comparar esquema/tipos, permisos y seed.
3. Configurar Auth, permisos vigentes, redirects y SMTP si se usa correo del personal. Verificar con cuentas de prueba; cliente sin SMS y personal sin CAPTCHA por DC-20.
4. Construir Next.js y ejecutar recorridos completos contra staging, incluyendo concurrencia y reintentos.
5. Preparar respaldo y migraciones compatibles antes de cambios productivos. Aplicar primero cambios aditivos de base.
6. Desplegar aplicación compatible con esquema; comprobar salud, catálogo, sesión y una operación controlada.
7. Activar pedidos solo con datos mínimos comerciales listos; activar fidelización después de PT-06 a PT-11 y piloto.

Los flags comienzan desactivados en un seed productivo nuevo. Desactivar fidelización por incidencia no desactiva pedidos. Una pausa operativa de pedidos mantiene carta y borrador, y muestra contacto del local.

El alta inicial de responsable es un paso administrado de E1/E3, auditado y repetible sin duplicar identidad/rol. Registrar las rutas de callback permitidas por entorno y plantillas de invitación/recuperación SSR. Probar desde el correo real, no solo desde una sesión ya abierta. Ocultar query strings de Auth en logs de hosting/observabilidad; no usar secretos en enlaces.

Las pausas de fidelización y cambios de disponibilidad del premio se coordinan con los bloqueos de [Operaciones](05-contratos-y-operaciones.md). La confirmación del panel significa que las operaciones que ya habían adquirido el recurso terminaron y las nuevas respetarán el valor actualizado. Un timeout del cambio también se investiga con su UUID; no se anuncia una pausa confirmada sin respuesta verificable.

## 5. Migraciones, retroceso y medios

SQL versionado, revisado y reproducible; no editar tablas productivas como mecanismo habitual del panel. Para una tabla/campo nuevo, añadir antes de usar, rellenar sin perder datos y retirar dependencias antiguas en otro despliegue. Evitar cambios destructivos en el mismo paso que reemplaza código.

Un fallo de aplicación puede resolverse volviendo al deployment anterior si el esquema continúa compatible. No restaurar una base vieja solo para revertir UI: perdería sellos y canjes nuevos. Si una migración causó daño, detener escrituras afectadas, respaldar estado y aplicar reparación documentada.

Fotos versionadas se suben al bucket de catálogo, se validan y luego se asocian al item. Exportar/copiar medios según política operativa; no asumir que un respaldo PostgreSQL contiene los bytes de Storage.

La carga de aplicación acepta archivos de 3 MiB mediante handler con cuerpo máximo 4 MiB, dejando margen para multipart y por debajo del límite de Vercel propuesto. Revisar respuesta 413 y errores de decodificación en staging; un cuerpo aceptado por Next.js local no demuestra que el hosting acepte el mismo archivo.

## 6. Respaldos y recuperación

Confirmar capacidades y conservación del plan elegido según [respaldos de Supabase](https://supabase.com/docs/guides/platform/backups). No afirmar respaldo automático o PITR si el plan aún no lo incluye. El objetivo inicial propuesto es RPO de 24 horas y RTO de 4 horas; son metas por validar mediante un ensayo, no SLA ni capacidad ya obtenida.

Respaldar base, inventario/archivos de Storage y configuración crítica con tratamiento seguro de secretos. Comprobar qué parte de Auth y Storage recupera cada método. Antes del lanzamiento efectuar restauración a entorno aislado y revisar tarjetas, eventos, premios y relaciones.

Si hay que restaurar producción: pausar sellos/canjes, identificar ventana perdida, conservar evidencias posteriores y reconciliar entregas físicas con responsable. Un regalo entregado tras el punto del respaldo no puede quedar nuevamente disponible por omisión. No reactivar hasta conciliar los movimientos inciertos.

## 7. Observabilidad y métricas

Logs estructurados de servidor: `requestId`, operación, duración, resultado/código y referencia técnica de actor cuando sea necesaria. Sin cuerpo de pedido, teléfono, dirección, OTP, tokens ni textos de preferencias. Desactivar captura automática de cuerpos sensibles en herramientas externas.

Monitorear error y latencia de validación, Auth/OTP, RPC, conflictos, operaciones inciertas y consumo/costo de servicios. Propuesta inicial de investigación: RPC/validación que supera tres segundos reiteradamente o incremento sostenido de errores 5xx; ajustar umbrales tras piloto, sin notificaciones automáticas ya instaladas.

`GET /api/health` futuro comprueba proceso/configuración mínima con respuesta pública genérica; no publica credenciales, conteos de clientes ni una prueba costosa de base en cada ping. Verificación de dependencias se hace mediante monitor interno limitado y pruebas de operación.

Métricas de fidelización por consulta agregada de eventos, accesible al responsable o revisión operativa; no dashboard complejo. Para pedido, tiempos medidos en sesión/piloto y agregados. No contar aperturas de WhatsApp como ventas. No hay analítica de ticket/margen porque no se almacenan pedidos.

## 8. Procedimientos del personal

| Situación | Procedimiento |
| --- | --- |
| Compra presencial | Identificar tarjeta, confirmar pago y entrega, revisar último movimiento y acreditar una vez. |
| Cancelación antes de entrega | No acreditar sello. |
| Canje | Verificar premio/disponibilidad y visita posterior, confirmar resultado y entregar una sola vez. |
| Resultado incierto | Conservar identificador, consultar movimiento y no generar otra operación para la misma atención. |
| Recarga o cambio de equipo durante una operación | Recuperar diario de la misma pestaña cuando exista; en otro equipo revisar eventos y referencia con responsable antes de repetir. |
| Servicio caído | Continuar venta; anotar referencia interna de contingencia y revisar al recuperarse. |
| Sello errado | Responsable revisa evento y motivo; corrección o incidencia según impacto en premios. |
| Cambio de precio/agotado | Responsable modifica panel y comprueba carta pública; no edita contadores desde Dashboard. |
| Cambio/pérdida de número | Cambio verificado normal; recuperación excepcional solo por procedimiento aprobado. |
| Baja de empleado | Desactivar autorización y gestionar sesiones/permisos; conservar auditoría. |

Registro de contingencia propuesto: hoja interna restringida con fecha de entrega, referencia, identificador único, cliente identificado y estado de revisión. Evitar listas de teléfonos compartidas públicamente; transferir y retirar copias operativas según PT-11. El canal concreto y el custodio se confirman en PT-08.

Una incidencia de canje registrado sin entrega física se resuelve por **DC-13:** administrador confirma no entrega y motivo; `reinstate_reward` devuelve el mismo premio con evento enlazado al canje original y cierra el caso. No borra el canje, no suma sellos ni restituye automáticamente. DC-14 aprueba recuperación presencial y conciliación de caídas con comprobante/historial, fecha real y referencia. [Contratos H7](17-administracion-y-operacion-h7.md) y [ensayo de continuidad](../implementacion/evidencia/h7/continuidad.md) delimitan pruebas aisladas y preparación productiva de H8.

## 9. Costos y condiciones de publicación

Revisar cotizaciones vigentes al contratar: hosting, Supabase, almacenamiento/egreso, SMS, SMTP, dominio, respaldos y premio. No usar cifras aproximadas como presupuesto aceptado. Calcular costo por OTP, tasa de reenvío, costo de canjes y tiempo del personal.

Pedidos requieren PT-01/PT-04 y validación de catálogo pertinente; horarios/tarifas desconocidos solo usan los mensajes provisionales definidos. Fidelización requiere costo del regalo, OTP probado, permisos/permisos, condiciones/privacidad y contingencias. No existe fecha de lanzamiento confirmada.
