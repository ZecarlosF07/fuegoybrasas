# 08. Pruebas, trazabilidad y aceptación

**Actualización del 10/10/2026:** [acceso privado sin SMS](16-acceso-a-tarjeta-sin-sms.md) sustituye OTP/phone_change e identidad telefónica del cliente; MFA del personal se conserva.

**Versión:** 1.1 · **Fecha:** 3 de octubre de 2026.  
**Estado:** plan de pruebas para futura implementación; ninguna prueba de negocio se declara ejecutada.  
**Relacionado:** [Análisis funcional](../analisis-del-proyecto.md), [Contratos](05-contratos-y-operaciones.md), [Implementación](09-plan-de-implementacion.md).

## 1. Estrategia y herramientas

Vitest para lógica pura y componentes síncronos, Testing Library para interacción, Playwright para recorridos y páginas con componentes de servidor asíncronos. pgTAP/Supabase CLI para integridad, grants, RLS y funciones; pruebas de integración con conexiones separadas para concurrencia real.

La guía instalada de Next.js `02-guides/testing/vitest.md` advierte que Vitest no prueba directamente componentes de servidor asíncronos; esos recorridos se verifican con E2E. Consultar también `02-guides/testing/playwright.md` antes de instalar/configurar herramientas.

Probar reglas de negocio y fronteras de permiso, no solo que una función llame a otra. No se exigen tests que repitan estilos o texto decorativo. Todas las pruebas usan entorno aislado; las de PostgreSQL, enlace entre dispositivos y Auth del personal se distinguen de mocks.

## 2. Cobertura de requerimientos

| Requisito | Diseño principal | Criterios cubiertos | Nivel |
| --- | --- | --- | --- |
| RF-01 | Frontend / arquitectura. | CA-01, CA-02. | Integración y E2E. |
| RF-02 | Datos / frontend. | CA-02, CA-03, CA-36. | Seed, integración y revisión comercial. |
| RF-03 | Datos / contratos. | CA-10, CA-18. | Unitario e integración. |
| RF-04 | Datos / contratos. | CA-11, CA-12, CA-17, CA-18. | Integración y E2E. |
| RF-05 | Frontend / contratos. | CA-04, CA-05. | Componentes y E2E. |
| RF-06 | Frontend. | CA-06, CA-07, CA-08. | Reducer y E2E. |
| RF-07 | Contratos. | CA-09, CA-10, CA-15, CA-16. | Dinero y validador. |
| RF-08 | Datos / contratos / frontend. | CA-13, CA-14, CA-15, CA-16, CA-17, CA-36. | Integración y E2E. |
| RF-09 | Contratos / frontend. | CA-20, CA-21. | Constructor y E2E. |
| RF-10 | Frontend. | CA-07, CA-12, CA-21, CA-22. | Persistencia y E2E. |
| RF-11 | Frontend. | CA-22. | Componentes y pruebas móviles. |
| RF-12 | Seguridad. | CA-23, CA-24. | Auth controlada y E2E. |
| RF-13 | Datos / fidelización / contratos. | CA-24, CA-27, CA-32. | RPC y E2E. |
| RF-14 | Frontend / seguridad / contratos. | CA-25. | Componentes, permisos y E2E. |
| RF-15 | Seguridad / fidelización. | CA-26, CA-31. | Grants, RLS y llamadas directas. |
| RF-16 | Datos / contratos. | CA-27, CA-28, CA-29, CA-30. | Transacciones e integración concurrente. |
| RF-17 | Fidelización / contratos. | CA-33. | RPC y revisión de historial. |
| RF-18 | Frontend / operación. | CA-17, CA-18, CA-19, CA-22, CA-23, CA-32, CA-34, CA-35, CA-36. | E2E, fallos y accesibilidad. |

DC-09 amplía CA-26: la autorización por sí sola no basta; acreditar exige compra pagada **y entregada**. Agregar CT-01 específico para comprobarlo.

## 3. Matriz de aceptación funcional

| Criterios del análisis | Preparación y comprobación |
| --- | --- |
| CA-01 a CA-03 | Fixture de 24 referencias regulares y cinco promociones. Fuente conserva C01, web no lo vende. Pedido sin sesión; cuatro alitas regulares y dieciséis en ronda. |
| CA-04 y CA-05 | Item sin opciones se agrega con una acción; grupo requerido verificado exige selección y calcula recargo. Grupo no confirmado no aparece. |
| CA-06 a CA-08 | Identidad de línea por item/opciones/indicaciones; editar, agrupar y eliminar; barra cuenta unidades y desaparece al vaciar. |
| CA-09 y CA-10 | P01+P02=5980 céntimos; P01+dos alitas=4490; P05 ahorro=2010. Sin comparaciones ficticias para otros productos. |
| CA-11 y CA-12 | P05 sin leyenda retirada; recojo incompatible. Cambiar modalidad conserva resto y pide resolver P05. |
| CA-13 y CA-14 | Entrega requiere dirección; recojo no la envía. Opcionales vacíos se omiten y no bloquean. |
| CA-15 y CA-16 | Cargo nulo y total pendiente; cero solo si verificado. Tarifa sintética de prueba suma exactamente y no entra al seed productivo. |
| CA-17 | Zona excluida validada bloquea entrega; cambiar recepción conserva borrador y reevalúa compatibilidad. |
| CA-18 y CA-19 | Desactivar promo/cambiar precio en otra sesión exige revisión. Horario sintético cerrado bloquea preparación pero conserva carta/borrador. |
| CA-20 | Decodificar URL de WhatsApp: destinatario 51982042493, acentos, fracciones, saltos, cantidades e importes correctos. |
| CA-21 y CA-22 | Regresar, recargar, copiar con éxito/fallo y enlace que no abre. No mostrar confirmación de recepción, venta o pago. |
| CA-23 y CA-24 | Fallar clave/tarjeta sin bloquear invitado; cliente A no lee tarjeta B ni llama a sello/canje. |
| CA-25 | Preferencia solo cambia con guardado propio; observaciones del pedido no alteran perfil; aplicar preferencia es explícito. |
| CA-26 y CA-27 | Atención activa/AAL2 y entrega pagada; 9→10 emite premio y 0/10; 10→11 conserva premio y 1/10. |
| CA-28 y CA-29 | Misma operación repetida emite una vez; dos operaciones de visitas distintas concurrentes suman ambas. |
| CA-30 y CA-31 | Dos empleados compiten por mismo premio: un solo canje; regalo sin compra nueva no acredita sello. |
| CA-32 y CA-33 | Agotado conserva premio; canje conserva progreso. Reversión añade motivo/actor; premio entregado queda como incidencia, sin borrar canje. |
| CA-34 y CA-35 | Teclado, foco, lector, texto ampliado; dock no cubre formularios; fallback de fotos conserva compra. |
| CA-36 | Datos sin confirmar no se publican como reales ni se habilitan opciones/precios pendientes. |

## 4. Casos técnicos adicionales

| ID | Escenario | Resultado esperado |
| --- | --- | --- |
| CT-01 | Compra pagada pero no entregada; o entregada sin pago confirmado. | `credit_stamp` rechaza; cero cambios/eventos/recibos de éxito. |
| CT-02 | Cancelación antes de entrega. | No se acredita sello. |
| CT-03 | Mismo actor/operationId con distinto cliente, tipo o payload. | `IDEMPOTENCY_CONFLICT`, sin segundo efecto. |
| CT-04 | Commit confirmado y pérdida de respuesta; recarga de vista. | Diario recupera UUID; consulta confirma efecto y estado actual, o reintento con misma entrada devuelve replay. |
| CT-05 | Referencia de visita repetida en tarjeta. | Bloqueo de segunda acreditación activa; sigue visible original. |
| CT-06 | Veinte sellos sin canjear. | Dos premios disponibles y progreso 0/10. |
| CT-07 | Revertir 10→9 con premio disponible; luego acreditar. | Premio anulado y luego restaurado con mismo ordinal, sin duplicar ni perder historial. |
| CT-08 | Reversión que afectaría premio canjeado. | Una incidencia, `review_required`, saldo sin decremento automático y canje conservado. |
| CT-09 | Revertir dos veces mismo evento. | `CORRECTION_ALREADY_APPLIED`; una sola reversión. |
| CT-10 | Cliente intenta cambiar metadata a manager, indicar otro actor o modificar tabla directamente. | Sin permisos efectivos; RPC verifica rol protegido. |
| CT-11 | Empleado desactivado con token vigente; empleado AAL1. | `FORBIDDEN` o `MFA_REQUIRED`, incluso por SDK directo. |
| CT-12 | Dos responsables desactivan concurrentemente al último par. | Siempre queda al menos uno activo; operación incompatible se rechaza. |
| CT-13 | Alta concurrente con misma clave o términos/pausa inválidos. | Un perfil/tarjeta, cero sellos; validación y atomicidad sin fila parcial. |
| CT-14 | Teléfono ocupado con otra clave, clave inválida/ajena y UUID inyectado. | Sin acceso a otra tarjeta ni duplicado; RPC por hash solo servidor, cliente sin sello/canje. |
| CT-15 | Dos responsables guardan precio con revisión vieja. | Uno confirma; otro ve conflicto y no sobrescribe. |
| CT-16 | Publicar item sin precio online verificado o grupo requerido inválido. | Rechazo de publicación; borrador conservado. |
| CT-17 | Catálogo/métodos cambian tras validar; validación vence. | Nueva validación y revisión antes de abrir/copiar mensaje. |
| CT-18 | Storage del navegador inaccesible, JSON corrupto o múltiples pestañas. | Memoria/aviso, sin pérdida silenciosa ni fuga de datos de sesión. |
| CT-19 | Sesión A y B consultan páginas privadas bajo caché/CDN. | Ningún dato ni cookie de A aparece en B; no-store respetado. |
| CT-20 | Foto inválida/SVG/HTML o carga por cliente/atención. | Rechazo; escritura solo por responsable/AAL2. |
| CT-21 | URL de WhatsApp demasiado larga o Clipboard denegado. | Texto completo seleccionable y chat sin texto; sin truncamiento. |
| CT-22 | Horario nocturno y fecha de promoción evaluados desde otro huso. | Regla de Parcona `America/Lima`, límites inclusivo/exclusivo definidos. |
| CT-23 | Contingencia registrada tarde por responsable. | Fecha de entrega real separada de registro; referencia/operación evitan duplicar. |
| CT-24 | Suma de eventos frente a contador y ordinales de recompensa. | Integridad; anomalía visible, sin reparación automática que borre entregas. |
| CT-25 | Restauración de respaldo con regalos entregados después del punto restaurado. | Reconciliación antes de reactivar; no regalo disponible duplicado. |
| CT-26 | Pedidos completos y login generan logs. | Sin direcciones, teléfonos completos, preferencias, OTP, JWT ni cuerpo del mensaje. |
| CT-27 | Consultar directamente tablas comerciales y llamar a `read_catalog` con claves públicas. | Tablas denegadas; RPC entrega solo proyección confirmada. Sin precios fuente, ubicación/horario en borrador ni comparación no verificada. |
| CT-28 | Recargar operación incierta aún en curso; entrar con otro actor o permisos degradados. | Ausencia de recibo no crea UUID nuevo; otra identidad/rol no recupera resultado privado; se revisa antes de otra operación en la tarjeta. |
| CT-29 | Pausar programa o agotar premio mientras se acredita/canjea en dos tarjetas. | Orden de bloqueos sin interbloqueo; operaciones previas pueden terminar antes de confirmar cambio; nuevas llamadas respetan pausa/disponibilidad. |
| CT-30 | Contacto modificado con clave propia y revisión; búsqueda antes/después. | Mismos UUID/progreso/premios; contacto anterior deja de localizar tarjeta, sin SMS/Auth nuevo. |
| CT-31 | Cambio de contacto sin clave, colisión o revisión antigua. | Rechazo sin modificar otra tarjeta ni mezclar identidades; número nunca autoriza acceso. |
| CT-32 | Cambian condiciones o se pausa programa mientras se activa tarjeta. | Alta comprueba versión/flag bajo bloqueo; una tarjeta o `TERMS_CHANGED`/`LOYALTY_PAUSED`, sin alta parcial. |
| CT-33 | Navegación nueva sin indicaciones de sesión para dos líneas del mismo item originalmente distintas. | Líneas separadas, aviso/revisión explícita; no fusión ni omisión silenciosa de indicaciones. |
| CT-34 | Respuesta de validación llega después de editar carrito; reloj del equipo adelantado/atrasado. | Se descarta respuesta anterior y plazo monotónico no prolonga preparación; mensaje usa modalidad/pago/WhatsApp de validación aceptada. |
| CT-35 | Atención modifica perfil; responsable corrige por solicitud expresa usando revisión vieja/actual. | Atención denegada; conflicto conservado; corrección autorizada audita campos/motivo sin texto personal en logs/auditoría. |
| CT-36 | Subir imagen y fallar asociación; repetir asociación o cambiar precio/contenido comparado. | Subida no publica por sí sola; revisión/idempotencia evitan sobrescritura; comparación necesita confirmación renovada; huérfano identificado para limpieza. |
| CT-37 | Perfil cerrado, tarjeta suspendida, programa pausado y logout con contenido privado precargado. | Estados diferenciados, sin reactivación/sello/canje indebido ni datos privados visibles después de salir; pedido invitado sigue independiente. |
| CT-38 | Invitación/recuperación real, token caducado/usado y destino externo manipulado. | Sesión solo tras Auth, contraseña propia sin cambiar rol/factor, MFA obligatorio; destino fijo, error recuperable y tokens ausentes de logs/referrers. |
| CT-39 | Foto dentro/fuera de límites de bytes/dimensiones y petición multipart sin `Content-Length`. | Carga acotada durante lectura, archivo máximo 3 MiB/cuerpo 4 MiB; 413/error útil; comportamiento comprobado en staging y sin ampliar Server Actions globalmente. |

## 5. Pruebas de concurrencia y seguridad

Usar transacciones/conexiones separadas contra PostgreSQL real, no `Promise.all` de mocks. Barreras de sincronización fuerzan llamadas solapadas. Verificar filas de eventos, contador, premios y recibos tras resolver ambas operaciones. Si hay timeout, reintentar mismo ID y comprobar un solo efecto.

Matriz de identidad: anon, cliente A, cliente B, atención AAL1, atención AAL2, responsable AAL2 y personal desactivado. Intentar Data API, RPC, acciones POST y SQL con roles limitados en entorno local. Comprobar ejecución no concedida por `PUBLIC` y que `app_private` no esté expuesto. Las tablas comerciales tampoco tienen grants directos; probar el contenido permitido de `read_catalog`, además de las denegaciones. Los helpers internos no conceden lectura de tablas ni se exponen por comodidad.

Conservar evidencias de resultados y mensajes de fallo, nunca tokens o teléfonos reales en reportes compartidos. Enlace privado entre dispositivos y SMTP/MFA del personal requieren prueba controlada; mocks no prueban esos servicios reales. CAPTCHA retirado por DC-20, sin condición pendiente de activación.

## 6. Fixtures y dispositivos

Fixtures: dos clientes, dos empleados, dos responsables; tarjetas nuevas, con 9/10/11/20 sellos; premio disponible/canjeado/anulado; artículo agotado; promoción vencida; opciones sintéticas; zona permitida/excluida/tarifa desconocida y horarios de cruce de medianoche. Todos identificados como pruebas.

Automatizar Chromium y WebKit, ampliar a Firefox en recorridos críticos. Revisar manualmente Android/iOS reales, retorno desde WhatsApp y navegadores integrados en redes sociales. Comprobar 320/375/768/1440 px, zoom al 200 %, teclado, lector disponible y conexión lenta. No afirmar compatibilidad real móvil solo por emulación de navegador.

Metas UX iniciales del análisis: primer agregado en treinta segundos y pedido sencillo preparado en dos minutos. Evaluarlas en tareas observadas; no prometerlas ni tratarlas como benchmark ya logrado. Medir carga y estabilidad de fotos/dock sin reemplazar pruebas de personas.

## 7. Evidencias y condiciones de aceptación

Durante implementación añadir scripts `test:unit`, `test:db`, `test:integration` y `test:e2e`; mantener `lint`, chequeo TypeScript y build existentes. CI ejecuta niveles apropiados, con migración desde cero y sin acceso a producción. No instalar herramientas ni escribir tests durante la etapa documental.

Cada etapa conserva commit, entorno, casos ejecutados, resultado y fallos abiertos. Para publicar: todos los casos críticos de precio/permiso/sello/canje pasan, datos comerciales están verificados, acceso privado del cliente y MFA real del personal funcionan y piloto con el personal valida atención/contingencia.

Esta entrega documental solo puede comprobar enlaces, cobertura de IDs y consistencia de definiciones. La aceptación funcional requiere implementación y evidencia futura; no se sustituye por leer este documento.
