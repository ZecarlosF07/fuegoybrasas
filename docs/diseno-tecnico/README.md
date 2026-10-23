# Fuego y Brasas — Diseño técnico

**Actualización DC-26, 22/10:** [aprobación y activación de tarjeta](21-aprobacion-y-activacion-tarjeta.md).

**Actualización 21/10/2026 — DC-23–25:** [pedido por WhatsApp sin pago y costo de premio opcional](20-pedido-whatsapp-y-costo-opcional.md) sustituye los campos/requisitos de pago y la obligatoriedad del costo de las definiciones anteriores.

**Actualización DC-22, 13/10/2026:** [personal sin MFA](19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Versión:** 1.15 · **Fecha:** 22 de octubre de 2026.
**Estado al 22/10/2026:** pedido publicado sin pagos y revisión técnica delegada comprobados; textos de tarjeta aprobados y programa oficial activado por DC-26. La evidencia registra la comprobación del despliegue por separado. Los controles humanos y operativos no ejecutados permanecen identificados.
**Base funcional:** [Análisis del proyecto](../analisis-del-proyecto.md) y [Resumen ejecutivo](../resumen-ejecutivo.md).

## 1. Propósito y precedencia

Este paquete traduce el análisis funcional a una arquitectura, un modelo de datos, permisos, contratos y un orden de construcción. Las últimas decisiones del propietario prevalecen sobre las imágenes y los documentos anteriores. Los documentos funcionales se conservan como antecedentes; este índice registra las aclaraciones posteriores.

Los tipos, nombres de tablas y contratos son definiciones adoptadas para la implementación incremental. Los bloques SQL, TypeScript y comandos de este paquete son especificaciones; el estado realmente aplicado se consulta en [H1](../implementacion/evidencia/h1/README.md), [H2](../implementacion/evidencia/h2/README.md), [H3](../implementacion/evidencia/h3/README.md), [H4](../implementacion/evidencia/h4/README.md), [H5](../implementacion/evidencia/h5/README.md), [H6](../implementacion/evidencia/h6/acceso-sin-sms/README.md) y [H7](../implementacion/evidencia/h7/README.md).

## 2. Documentos y dependencias

| Orden | Documento | Define | Depende de |
| --- | --- | --- | --- |
| 1 | [Arquitectura](01-arquitectura.md) | Módulos, responsabilidades y acceso a servicios. | Acuerdos de este índice. |
| 2 | [Fidelización](02-fidelizacion.md) | Reglas, ciclos, premios, correcciones y alternativas. | Análisis funcional y aclaración de entrega. |
| 3 | [Modelo de datos](03-modelo-de-datos.md) | Tablas, relaciones, restricciones y migraciones. | Arquitectura y fidelización. |
| 4 | [Autenticación y seguridad](04-autenticacion-seguridad.md) | Identidad, sesiones, permisos, RLS y privacidad. | Modelo de datos. |
| 5 | [Contratos y operaciones](05-contratos-y-operaciones.md) | Interfaces, validación y transacciones. | Datos, reglas y permisos. |
| 6 | [Frontend y estado](06-frontend-y-estado.md) | Rutas, componentes, borrador y recuperación. | Contratos y wireframes del análisis. |
| 7 | [Despliegue y operación](07-despliegue-y-operacion.md) | Entornos, configuración, mantenimiento y contingencias. | Arquitectura y seguridad. |
| 8 | [Pruebas y aceptación](08-pruebas-y-aceptacion.md) | Trazabilidad RF/CA, escenarios y evidencias. | Todos los diseños anteriores. |
| 9 | [Plan de implementación](09-plan-de-implementacion.md) | Etapas, dependencias y condiciones de finalización. | Paquete completo. |
| 10 | [Tablas DB](10-tablas-db.md) | Diccionario completo, relaciones y borrado lógico. | Modelo, seguridad y contratos; amplía definiciones anteriores. |
| 11 | [Flujo funcional](11-diagrama-flujo.md) | Pedido, sellos, premios, correcciones y fallos. | Reglas, contratos y conservación. |
| 12 | [Navegación](12-flujo-navegacion.md) | Páginas, rutas, permisos y destinos. | Frontend, seguridad y contratos. |
| 13 | [Estructura de carpetas](13-estructura-carpetas.md) | Organización objetivo y dependencias del código. | Arquitectura, rutas y stack instalado. |
| 14 | [Identidad visual y sistema UI](14-identidad-visual-y-sistema-ui.md) | Explicación de marca y aplicación por vistas; remite a reglas canónicas. | Análisis, frontend, investigación y sistema visual. |
| 15 | [Investigación UX y referentes](15-investigacion-ux-y-referentes.md) | Evidencia pública, consultas de la skill y adaptación crítica. | Material del propietario y fuentes oficiales. |
| 16 | [Acceso a tarjeta sin SMS](16-acceso-a-tarjeta-sin-sms.md) | Alta por nombre/contacto, clave privada, permisos y actualización de expectativas anteriores. | Decisión actual del propietario; sustituye identidad telefónica previa. |
| 17 | [Administración y operación H7](17-administracion-y-operacion-h7.md) | Indicadores/clientes, correcciones, restitución, recuperación, contingencia e invitaciones. | DC-12–15 y permisos MFA; amplía contratos y datos. |
| 18 | [Publicación y operación H8](18-publicacion-y-operacion-h8.md) | GitHub/Vercel, CI, salud, diagnóstico y datos comerciales. | DC-16–19; preparación diferenciada de piloto/activación. |
| 19 | [Personal sin MFA](19-acceso-del-personal-sin-mfa.md) | Login con contraseña, rol vigente, recuperación y ajuste Auth/SQL compatible. | DC-22; sustituye segundo factor en todos los hitos. |
| 20 | [Pedido WhatsApp y costo opcional](20-pedido-whatsapp-y-costo-opcional.md) | Pedido sin pago, compatibilidad de borradores, costo interno opcional y revisión técnica delegada. | DC-23–25; actualiza H5/H6/H8. |
| 21 | [Aprobación y activación de tarjeta](21-aprobacion-y-activacion-tarjeta.md) | Aprobación versionada y activación auditada. | DC-26. |

Reglas para agentes: [Proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md), enlazadas desde [AGENTS.md](../../AGENTS.md). Los valores visuales se mantienen únicamente en el sistema canónico; [MASTER](../../design-system/fuego-y-brasas/MASTER.md) permite recuperarlo mediante la skill. La ejecución se organiza en los [ocho hitos](../implementacion/hitos-del-proyecto.md).


## 3. Decisiones confirmadas por el propietario

**DC-26:** el propietario aprueba los textos y autoriza habilitar la tarjeta. [Registro vigente](21-aprobacion-y-activacion-tarjeta.md).

**DC-21, 13/10/2026:** origen de producción confirmado `https://fuegoybrasas.vercel.app`. URLs de Supabase Auth aplicadas mediante perfil parcial y verificadas; variables del hosting y deployment pendientes. Desarrollo conserva localhost y no se crea otra copia de secretos. [Configuración y evidencia](../implementacion/evidencia/h8/despliegue.md). El dominio no implica aceptación del piloto ni activación de pedidos/fidelización.

| ID | Decisión | Consecuencia |
| --- | --- | --- |
| DC-01 | Next.js para aplicación y servidor; Supabase para backend, datos, Auth y Storage. | No se añade un servidor independiente. |
| DC-02 | Compra como invitado y cierre por WhatsApp, número +51 982 042 493. | La aplicación prepara una solicitud; no confirma envío, venta, pago ni recepción. |
| DC-03 | Carrito y borrador locales; sin guardar solicitudes en Supabase. | No hay tablas de pedidos, direcciones ni detalle de ventas en el MVP. |
| DC-04 | Panel privado sencillo para mantener carta, precios, promociones y agotados. | Se añade mantenimiento mínimo del catálogo, con acceso de responsable. |
| DC-05 | Fidelización opcional desde la primera versión. | Un fallo de tarjeta no impide pedir como invitado. |
| DC-06 | Un sello por visita presencial con compra; valida el personal. | No se cuentan platos, aperturas de WhatsApp ni compras remotas automáticamente. |
| DC-07 | Diez sellos por Mostrito de ⅛ con chaufa, papas y ensalada; canje posterior sin otra compra. | DC-24 permite costo interno desconocido; DC-26 aprueba textos y activación. |
| DC-08 | Guardar indicaciones frecuentes, sin historial detallado de productos. | Preferencias declaradas y editables, separadas de las observaciones del pedido. |
| DC-09 | **El sello se genera cuando se entrega el pedido.** Aclaración recibida al elaborar este paquete. | Atención confirma compra pagada y pedido entregado durante la visita presencial; una cancelación anterior no genera sello. |
| DC-10 | Retirar la leyenda «Solo delivery» de P05, conservando la restricción de modalidad. | P05 solo se admite en entrega a domicilio, con validación temprana. |

| DC-11 | El propietario elimina SMS y elige alta web con nombre y teléfono. | Acceso por enlace privado/QR; teléfono de contacto no autentica. Recuperación asistida continúa en PT-08/H7. |
| DC-12 | El administrador consulta registros, clientes próximos a premio e indicadores. | Panel privado paginado exclusivo manager activo; sin ventas o exportación masiva. |
| DC-13 | Restituir el premio después de confirmar que no se entregó, con historial y motivo. | Mismo premio disponible, canje original inmutable, saldo intacto y resolución única. Resuelve PT-13. |
| DC-14 | Administrador recupera tarjeta presencialmente con comprobante/historial y concilia compras por caídas con fecha/referencia. | Teléfono solo no prueba titularidad; rota clave sin duplicar tarjetas. Procedimientos aprobados de PT-08. |
| DC-15 | No dar de baja clientes. | Baja/restauración customer/card denegadas; identidad, progreso, premios y metadatos históricos conservados. |
| DC-16 | Subir a GitHub para importar en Vercel; Supabase oficial único. | CI/fixtures locales; preview sin credenciales oficiales, sin segundo proyecto. |
| DC-17 | Administrador inicial confirmado, sin envío de correos. | Alta directa auditada, contraseña privada y permisos vigentes obligatorio al entrar. |
| DC-18 | Maps y modalidades de la carta confirmados; Mostritos con chaufa/papas/ensalada. | 17 referencias completas publicadas; C01/P05 y faltantes conservan sus límites. |
| DC-19 | Horarios/pagos estimados hasta dato real. | Borradores no verificados, ocultos en DTO público; no activar funciones por estimaciones. |
| DC-20 | El propietario retira CAPTCHA del personal. | Login/recuperación sin widget ni tokens CAPTCHA; se conservan contraseña, permisos vigentes, autorización y límites de Supabase Auth. Variables y requisito de proveedor retirados. [Cambio vigente](../implementacion/evidencia/h8/acceso-personal-sin-captcha.md). |
| DC-22 | El propietario retira MFA del personal. | Correo/contraseña y rol vigente; SQL sin AAL2 y Auth sin TOTP. [Diseño vigente](19-acceso-del-personal-sin-mfa.md) y evidencia de retirada. |

## 4. Decisiones técnicas adoptadas

**Ampliación del propietario del 11/10 — DC-12–15:** [Administración y operación H7](17-administracion-y-operacion-h7.md) sustituye la exclusión anterior de listado interno y baja/restauración de clientes. Recuperación, contingencia y restitución aprobadas y probadas; PT-08 conserva preparación real del personal/permisos y PT-11 textos/plazos de lanzamiento.

| ID | Decisión y razón | Fuente principal |
| --- | --- | --- |
| DT-01 | App Router, TypeScript estricto y Tailwind 4 existentes; runtime Node.js. | Arquitectura. |
| DT-02 | `@supabase/supabase-js` y `@supabase/ssr`; cliente de servidor por petición. | Seguridad. |
| DT-03 | Catálogo en esquema `public`; información personal, personal autorizado y movimientos en `app_private`, no expuesto por Data API. | Datos y seguridad. |
| DT-04 | RPC estrechas para acceder a datos privados; autorización en cada operación, además de RLS y permisos. | Seguridad y contratos. |
| DT-05 | Importes enteros en céntimos, moneda PEN; UUID para entidades; tiempos UTC y reglas horarias `America/Lima`. | Datos. |
| DT-06 | Sellos y canjes en transacciones PostgreSQL con bloqueo de tarjeta e idempotencia. | Fidelización y contratos. |
| DT-07 | Borrador persistente no sensible en `localStorage`; datos de contacto y dirección en `sessionStorage`. | Frontend. |
| DT-08 | MVP sin caché compartida de datos de aplicación; imágenes versionadas sí pueden usar CDN. `cacheComponents` no se habilita inicialmente. | Arquitectura y frontend. |
| DT-09 | **Sustituida por DC-11/DT-31.** Se retira OTP/SMS del cliente; no requiere proveedor SMS ni presupuesto de mensajes. | [Actualización vigente](16-acceso-a-tarjeta-sin-sms.md). |
| DT-10 | Personal con correo y contraseña; cuentas individuales, acceso por rol en tabla protegida y autorización por rol para operaciones internas. | Seguridad. |
| DT-11 | Hosting de Next.js propuesto en Vercel y Supabase administrado; contratación y cuentas pendientes. | Operación. |
| DT-12 | Sin ORM, Realtime, Edge Functions, cola ni POS en el MVP. SDK y funciones SQL cubren los casos actuales. | Arquitectura. |
| DT-13 | Catálogo público solo por proyección `read_catalog`, sin grants directos sobre tablas comerciales. Evita publicar campos sin verificar mediante Data API. | Seguridad y contratos; revisión de 3/10/2026. |
| DT-14 | Contacto declarado en `customers.contact_phone`; no autentica. Identidad de acceso por hash de clave privada; Auth del cliente solo compatibilidad histórica. | [Datos y acceso vigente](16-acceso-a-tarjeta-sin-sms.md). |
| DT-15 | Diario mínimo de operaciones internas en sesión antes de enviar; revisión tras recarga y reintento con el mismo UUID/entrada. | Frontend y contratos; revisión de 3/10/2026. |
| DT-16 | Configuración, tarjeta y disponibilidad coordinadas mediante orden común de bloqueos. | Contratos; revisión de 3/10/2026. |
| DT-17 | Indicaciones que no se pudieron restaurar requieren revisión explícita; respuestas de validación anteriores se descartan y su plazo usa reloj monotónico. | Frontend; revisión de 3/10/2026. |
| DT-18 | Carga de fotos por handler dedicado: archivo 3 MiB, cuerpo 4 MiB, 4096×4096; asociación posterior con revisión. Compatible con hosting propuesto sin ampliar todas las Actions. | Seguridad/contratos/operación; revisión de 3/10/2026. |
| DT-19 | Reglas generales y UX/UI en `.agents`, entrada desde AGENTS.md y sistema visual único; usar `ui-ux-pro-max` en trabajo de interfaces y documentación que las define. | Instrucción actual del propietario, documentos 14/15 y reglas canónicas; revisión 1.2. |
| DT-20 | Yarn exclusivo, tipos separados, componentes de hasta 170 líneas, Tailwind sin selectores CSS personalizados y Proxy sin middleware. | Instrucción del propietario del 4/10/2026 y [reglas de código](../../.agents/rules/codigo.md). |
| DT-21 | Propietario `app_owner` NOLOGIN para objetos privados y defaults restrictivos, sin cambiar defaults de propietarios administrados. Migraciones de ese esquema usan SET LOCAL ROLE app_owner. | [Migración de H1](../../supabase/migrations/20261004000000_private_schema.sql) y [evidencia](../implementacion/evidencia/h1/README.md). |
| DT-22 | Puente privado mínimo `request_claims()` de `postgres`, invocable solo por `app_owner`, para leer uid/AAL sin modificar permisos administrados de Auth. Resto de objetos bajo `app_owner`. | [Operación H2](../implementacion/evidencia/h2/operacion.md), migración y pruebas de permisos. |
| DT-23 | Callback fijo, cookie HttpOnly firmada por identidad durante diez minutos y sin redirección libre. DC-22 retira segundo factor también en recuperación; contraseña nueva conserva autorización. | [Contrato sin MFA](19-acceso-del-personal-sin-mfa.md). |
| DT-24 | Confirmación comercial `content_verified` para porción/inclusiones, invalidada por cambios de contenido o restauración. Precios y composición de opciones editados requieren reconfirmación explícita. Editor interno con campos snake_case estrictos; catálogo público conserva camelCase. | [Contratos H4](../implementacion/evidencia/h4/operacion.md) y [diccionario](10-tablas-db.md). |
| DT-25 | Asociación y reserva de limpieza de imágenes comparten bloqueo de configuración. La reserva auditada impide reutilizar la ruta y conserva referencias retiradas recuperables; eliminación Storage sucede fuera de SQL y permite reintento del mismo UUID. | [Operación H4](../implementacion/evidencia/h4/operacion.md), migraciones y pruebas reales locales de Storage. |

| DT-26 | Pagos/zonas como configuración versionada: revisión global e hija, patch cerrado de una fila, confirmación invalidada por edición y restauración disabled/unverified. Pedidos activos requieren pago confirmado; pausar antes de retirar el último. | [Operación H5](../implementacion/evidencia/h5/operacion.md) y migración remota. |
| DT-27 | Validación de pedido sin PII, DTO canónico en memoria, vigencia monotónica desde inicio de petición y revisión del borrador para descartar respuestas antiguas. Almacenamiento comercial/sesión independiente; URL larga conserva mensaje completo. | [Evidencia H5](../implementacion/evidencia/h5/README.md), contratos y pruebas. |
| DT-28 | Fidelización mediante RPC autorizadas y constraint diferido contador/eventos. Premios independientes, costo histórico e idempotencia con ficha actual; acceso del cliente actualizado por DT-31. | [Evidencia H6 histórica](../implementacion/evidencia/h6/README.md) y [revisión sin SMS](../implementacion/evidencia/h6/acceso-sin-sms/README.md). |
| DT-29 | Nueva tarjeta no crea usuario Auth. Hook preparado rechaza signup público de Auth, sin cambiar configuración remota; personal conserva Auth y altas administrativas controladas. | [Diseño 16](16-acceso-a-tarjeta-sin-sms.md). |
| DT-30 | Diario compartido interno evita sobrescritura/UUID nuevo ante incertidumbre. Alta por clave conserva cookie candidata para replay; cambio de contacto exige clave propia y revisión. | [Diseño 16](16-acceso-a-tarjeta-sin-sms.md) y evidencia histórica de operaciones internas. |

| DT-31 | Clave aleatoria de 256 bits, hash persistido, cookie HttpOnly y enlace con fragmento; cuatro RPC solo servidor. Registro sin SMS, cero sellos y teléfono no autenticante. | [Diseño vigente](16-acceso-a-tarjeta-sin-sms.md); migración 20261010000000. |
| DT-32 | H7: indicadores/clientes solo manager activo; reversión/restitución auditadas, invitación Auth por etapas, recuperación presencial con clave derivada HMAC por UUID y contingencia transaccional. Clientes sin baja por DC-15. | [Contratos H7](17-administracion-y-operacion-h7.md). |

DT-11 permite preparar la implementación, pero no autorizan contratar servicios ni afirman que sus cuentas estén disponibles. Las versiones nuevas de dependencias se fijarán en el lockfile al instalarlas y se comprobarán con la versión existente de Next.js.

## 5. Pendientes y bloqueos

| ID | Información que falta | Documentos afectados | Qué bloquea |
| --- | --- | --- | --- |
| PT-01 | Maps confirmado (-14.04883, -75.70694) y aplicado en H8. Calle/número no aportados, no se inventan. | Frontend, operación, pruebas. | Ubicación publicable por Maps; etiqueta de ubicación sin calle supuesta. |
| PT-02 | Horarios y cierres; PD-02. | Datos, contratos, frontend. | Estado automático de abierto/cerrado. Sin configuración, estado `unknown`. |
| PT-03 | Zonas, cargos y mínimos; PD-03. | Datos, contratos, pruebas. | Tarifación definitiva. El MVP puede informar importe y cobertura pendientes por WhatsApp. |
| PT-04 | Efectivo/Yape/Plin estimados como borrador autorizado; confirmar medios reales. | Datos, frontend, pruebas. | Checkout sigue bloqueado; estimados no son opciones públicas. |
| PT-05 | Precios/modalidades confirmados en H8, Mostritos con inclusiones. Once referencias aún sin contenido completo. | Datos, contratos, catálogo. | Solo esas referencias/opciones incompletas permanecen en borrador; 17 publicables. |
| PT-06 | Costo completo del premio; PD-10. | Fidelización, operación. | Activar públicamente fidelización; no bloquea construirla. |
| PT-07 | **Comprobación automática cerrada el 11/10:** migración remota y reconstrucción, integración/pgTAP/navegador aislados aprobados. Proveedor/presupuesto SMS retirados por DC-11. [Evidencia](../implementacion/evidencia/h6/acceso-sin-sms/README.md). | Seguridad, operación y pruebas. | Acceso privado automáticamente probado; aceptación H6 todavía exige revisión humana de Narrador/zoom. |
| PT-08 | Personas reales autorizadas y procedimientos de recuperación de acceso del personal pendientes. Recuperación de tarjeta presencial y contingencia aprobadas por DC-14, implementadas/probadas. | Seguridad y operación; diseños 16/17 y evidencia H7. | Preparación para operación pública; teléfono solo sigue sin ser prueba. |
| PT-09 | Facebook oficial confirmado por el propietario; siguen pendientes originales de logo/fotos, variantes aprobadas y procedencia/autorización de recursos; PD-13 parcialmente aclarado. | Frontend, Storage, identidad visual. | Presentación definitiva de marca; las fotos ausentes tienen fallback. La paleta de interfaz es una propuesta, no un manual oficial entregado. |
| PT-10 | Roberto Fuentes designado para WhatsApp; recepción/atención real pendiente de piloto. | Operación. | No inferir recepción/venta desde apertura del enlace. |
| PT-11 | Condiciones del programa, aviso de datos y plazos de conservación; DC-15 excluye baja de clientes. | Seguridad y operación. | Lanzamiento de fidelización. No se fijan plazos legales ni purgas por suposición. |
| PT-12 | GitHub confirmado; propietario importará en Vercel tras push. URL, variables/callbacks y respaldo contratado pendientes. | Operación. | Despliegue/activación; preparación de CI y ensayo aislado disponibles. |
| PT-13 | **Resuelto:** DC-13 aprueba restitución supervisada al confirmar no entrega, con motivo/historial. | Diseño 17, integración/E2E y evidencia H7. | Implementado y probado, sin bloqueo funcional pendiente. |

Las preguntas de negocio se presentan solo cuando afectan el trabajo siguiente. Un dato pendiente no se reemplaza por una suposición comercial ni por un valor sintético de pruebas. Los datos incompletos quedan en borrador o con estado desconocido según los contratos.

## 6. Control de cambios y cierre

Una decisión nueva registra ID, fecha, origen y documentos afectados. Datos y contratos son la referencia para nombres y estados; frontend los consume, no redefine reglas. Un cambio de meta o premio exige revisar fidelización, modelo, permisos, contratos y pruebas antes de aplicarse.

El paquete se cierra documentalmente con cobertura de RF-01 a RF-18 y CA-01 a CA-36, enlaces válidos y reglas coherentes. Esa revisión **no equivale a pruebas de la aplicación ejecutadas**. El documento de aceptación distingue las evidencias que se deberán obtener al construir.

## 7. Registro de la revisión 1.1

Se revisaron los diez documentos frente al análisis funcional, la aclaración de entrega, las guías instaladas de Next.js y documentación oficial de Supabase/PostgreSQL. La revisión distingue decisiones técnicas resueltas de PT-13, que requiere respuesta de negocio.

| Hallazgo | Ajuste y documentos | Comprobación prevista |
| --- | --- | --- |
| Campos comerciales podían leerse directamente aunque la UI los ocultara. | RPC pública con proyección explícita; arquitectura, datos, seguridad y contratos. | CT-27. |
| Dos fuentes de teléfono podían quedar desincronizadas. | Identidad telefónica única de Auth; datos, seguridad y fidelización. | CT-14, CT-30, CT-31. |
| Recargar podía perder el UUID de una operación incierta. | Diario mínimo, permisos vigentes y consulta antes de repetir; contratos/frontend/operación. | CT-04, CT-28. |
| Pausas, altas y canjes necesitaban un orden de bloqueo completo. | Bloqueos compartidos/exclusivos y semántica de confirmación; contratos/operación. | CT-29, CT-32. |
| Separar indicaciones del carrito podía agrupar líneas silenciosamente al perder sesión. | Marcador sin texto y revisión previa; frontend. | CT-33. |
| Una validación tardía o reloj incorrecto podía mezclarse con un borrador nuevo. | Revisión local, huella y plazo monotónico; contratos/frontend. | CT-34. |
| Corrección de perfil, ficha por ID y consulta de eventos carecían de contrato explícito. | RPC y permisos acotados; seguridad/contratos/frontend. | CT-24, CT-35. |
| Subir foto se confundía con asociarla al producto. | Dos efectos separados con revisión/idempotencia para asociación; contratos/operación. | CT-20, CT-36. |
| Cierre, suspensión y pausa se confundían con caída/alta nueva. | DTO y estados diferenciados; datos/contratos/frontend. | CT-37. |
| Invitación/recuperación carecían de rutas y callback SSR concretos. | Sesión, contraseña, destinos fijos y permisos vigentes; seguridad/contratos/frontend/operación. | CT-38. |
| Foto de 5 MiB superaba límites del flujo y hosting propuestos. | Handler acotado, límite 3 MiB y revisión en staging; seguridad/contratos/operación. | CT-39. |

Las pruebas CT-01 a CT-39 son especificaciones futuras. En esta etapa solo se ejecutan comprobaciones documentales: inventario, enlaces, referencias y consistencia de nombres/reglas. No se instalan dependencias, se escriben migraciones ni se modifica la aplicación.

Comprobación documental del 3 de octubre de 2026: diez archivos en versión 1.1, 42 enlaces locales válidos, cobertura de los 18 RF, 36 CA y 39 CT; bloques de código equilibrados y texto UTF-8 sin errores detectados. PT-13 sigue abierto: esa verificación no cierra la regla de excepción ni acredita pruebas de la aplicación.

## 8. Ampliación documental 1.2: marca y reglas de interfaz

El propietario solicitó separar reglas de agentes y documentación del equipo. Se incorporan documentos 14/15, reglas `.agents`, sistema canónico y entrada MASTER; se amplía el índice para incluir también documentos 10–13. Los ocho hitos añaden tareas, requerimientos y evidencia UX/UI, conservando sus identificadores previos. El objetivo táctil canónico amplía el mínimo previo de frontend y las decisiones de marca dejan de quedar sin especificar.

La investigación distingue material público observado de decisiones de interfaz; Facebook aclara la red oficial sin cambiar catálogo, WhatsApp o reglas de fidelización. PT-08, PT-11 y PT-13 permanecen abiertos. El registro anterior describe su revisión histórica, no el inventario o número de enlaces actuales. Esta ampliación no implementa código de aplicación, servicios ni pruebas de pantallas.

## 9. Revisión del 10 de octubre: acceso sin SMS

DC-11 sustituye la identidad telefónica anterior por [diseño 16](16-acceso-a-tarjeta-sin-sms.md). Modelo, diccionario, contratos, navegación, H6 y H8 referencian ese cambio. Los reportes del 9/10 siguen siendo evidencia histórica; no prueban el nuevo acceso. PT-08/PT-11/PT-13 conservan sus bloqueos.

## 10. Revalidación de H6 del 11 de octubre

El propietario autorizó completar pruebas con Docker exclusivo de fixtures. El [reporte vigente](../implementacion/evidencia/h6/acceso-sin-sms/README.md) acredita reconstrucción y pruebas SQL/integración/navegador del acceso por clave. Se corrigieron el segundo enlace en la misma página y la seguridad del envío de formularios antes de hidratar, sin migraciones adicionales. PT-07 cierra su comprobación automática; la [revisión humana](../implementacion/evidencia/h6/acceso-sin-sms/revision-manual.md) permanece pendiente y H6 no se declara aceptado. Desarrollo habitual sigue remoto; no hay fixtures remotas ni habilitación pública.
