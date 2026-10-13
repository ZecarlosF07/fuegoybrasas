# Hito 8 — Probar y publicar

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](../diseno-tecnico/16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. MFA del personal se conserva.

**Versión:** 1.1 · **Fecha:** 3 de octubre de 2026.  
**Destinatarios:** equipo de desarrollo, personal autorizado y responsable del negocio.  
**Estado:** preparación técnica implementada y probada según [evidencia H8](evidencia/h8/README.md); piloto y lanzamiento pendientes.  
**Guía general:** [Hitos del proyecto](hitos-del-proyecto.md).

**Actualización H7 del 11/10/2026:** [DC-12–15](../diseno-tecnico/17-administracion-y-operacion-h7.md) y [evidencia](evidencia/h7/README.md) acreditan implementación/pruebas de panel, recuperación presencial, contingencia y restitución supervisada. PT-13 está resuelto. DC-15 excluye baja de clientes/tarjetas. H8 conserva piloto/revisión humana, personas reales/MFA, SMTP, privacidad, datos comerciales, respaldos contratados y restauración integral de configuración/Storage; no repite la decisión funcional ya aprobada.

## 1. Descripción del objetivo

**DC-20 (13/10):** [personal sin CAPTCHA](evidencia/h8/acceso-personal-sin-captcha.md). Se retira como requisito técnico/de servicios; MFA y autorización se conservan.

**Actualización del 12/10 — DC-16–19:** [diseño 18](../diseno-tecnico/18-publicacion-y-operacion-h8.md). El propietario usa un solo Supabase oficial y solicita push a GitHub para importarlo en Vercel. CI/reconstrucciones son locales, preview sin credenciales oficiales. Cuenta inicial directa sin correos; MFA se conserva. Ubicación/modalidades confirmadas; horario/pagos estimados sin verificar. Preparación de despliegue no activa funciones ni acredita piloto.

Comprobar el producto completo con el personal y publicarlo con configuración, servicios y datos comerciales confirmados. El hito reúne evidencias de los siete anteriores, verifica los recorridos reales y prepara operación, monitoreo, respaldo y recuperación antes de activar pedidos y fidelización.

El resultado esperado es una versión desplegada que el responsable acepta después del piloto, con personas capaces de atender solicitudes, acreditar visitas entregadas, canjear y resolver incidencias siguiendo procedimientos. Un build exitoso o una demo local no equivalen a recepción de WhatsApp, apertura del enlace privado, respaldo recuperable o lanzamiento operativo.

### Alcance del hito

- Validación integral RF-01–RF-18, CA-01–CA-36 y CT-01–CT-39, más comprobaciones de soft delete y procedimientos aprobados.
- Revisión comercial, seguridad, accesibilidad, dispositivos y servicios Auth/WhatsApp reales de prueba.
- Piloto controlado con personal y datos identificados, separado de tarjetas reales.
- Staging/producción, migraciones, dominio/hosting confirmados, respaldos y ensayo de restauración.
- Instrucciones de operación, monitoreo seguro y activación mediante flags después de aceptación.

La primera versión prevista incluye pedido invitado y fidelización opcional. Entregar H5 antes no autoriza publicar permanentemente solo pedidos; un lanzamiento parcial requiere acuerdo explícito sobre alcance y bloqueos.

## 2. Tareas del hito

| ID | Tarea | Trabajo concreto | Resultado esperado |
| --- | --- | --- | --- |
| H8-T01 | Reunir evidencias y bloqueos | Revisar DoD de H1–H7, matriz RF/CA/CT, decisiones y fallos abiertos; identificar qué impide pruebas, despliegue o activación. | Registro de salida con responsables y evidencia faltante. |
| H8-T02 | Confirmar servicios y entornos | Confirmar cuentas, hosting/dominio/plan Supabase, SMTP del personal y enlace privado de tarjeta, callbacks y presupuestos; separar local/staging/producción. | Configuración autorizada y comprobable, sin contratación automática. |
| H8-T03 | Verificar reconstrucción y despliegue | Aplicar migraciones desde cero en entorno aislado, carga controlada y tipos; ejecutar CI/build y ensayar despliegue staging con flags apagados. | Versión candidata reproducible y compatible con esquema. |
| H8-T04 | Ejecutar aceptación integral | Probar escenarios completos y fallos con identidades separadas, concurrencia real y datos sintéticos; repetir solo lo afectado al corregir defectos. | Cobertura trazable sin casos críticos fallidos o sin ejecutar. |
| H8-T05 | Revisar dispositivos y accesibilidad | Revisar Android/iOS reales, retorno desde WhatsApp, navegadores integrados, teclado, foco, zoom, lector, tamaños y conexión lenta. | Evidencia manual y automática de uso del producto. |
| H8-T06 | Confirmar datos de publicación | Revisar matriz de precios/modalidades/inclusiones, pagos, ubicación, horarios, cobertura/cargos, marca y WhatsApp oficial. | Datos finales confirmados o desconocidos permitidos explícitamente informados. |
| H8-T07 | Confirmar fidelización y operación | Verificar costo/premio, términos/privacidad, acceso privado real, personas autorizadas y decisiones PT-08/PT-11/PT-13 implementadas. | Condiciones de activación cumplidas y procedimientos operativos disponibles. |
| H8-T08 | Ensayar respaldo y recuperación | Respaldar datos/recursos necesarios, restaurar aislado y conciliar regalos/visitas posteriores al punto restaurado antes de reactivar. | Recuperación medible, sin premios duplicados ni dependencias omitidas. |
| H8-T09 | Preparar monitoreo e instrucciones | Salud mínima, alertas/diagnóstico seguro, pausas, recuperación, atención WhatsApp, incidencias y asignación de responsables. | Operación diaria y respuesta a fallos sin depender de una sola persona técnica. |
| H8-T10 | Ejecutar el piloto | Personal recorre pedidos individuales/familiares, tarjeta, sello, premio, corrección y catálogo; observar tiempos/fallos y corregirlos. | Piloto aceptado y capacitación demostrada con evidencias. |
| H8-T11 | Desplegar y activar | Tras aprobación, aplicar cambios productivos verificados, comprobar versión, callbacks y datos; activar pedidos/programa por sus mecanismos específicos. | Producto publicado con alcance y configuración aceptados. |
| H8-T12 | Verificar publicación y entregar | Comprobar recorridos permitidos sin alterar tarjetas reales innecesariamente, confirmar monitoreo, responsables y plan de seguimiento. | Entrega operativa registrada y capacidad de pausar/revertir despliegue. |
| H8-T13 | Auditar UX/UI y marca con la skill | Usar ui-ux-pro-max para revisión integral del sistema implementado y sus estados; comprobar accesibilidad, consistencia, regreso de WhatsApp y comprensión de operaciones en el piloto. | Reporte visual/usabilidad con defectos, correcciones y evidencia antes de activar. |

Orden recomendado: T01–T02 → T03–T07 → T08–T09 → T10 → T11–T12. El ensayo de recuperación y la preparación de instrucciones preceden al lanzamiento. Aprobación del propietario se obtiene sobre resultados concretos del piloto y bloqueos, antes de activar producción.

Ejecutar H8-T13 antes del piloto T10 y de la activación T11; complementa la revisión de dispositivos de T05. Su identificador añadido conserva los anteriores; no posterga el diseño hasta después de la implementación. Las tareas exclusivamente de backend mantienen sus pruebas y no requieren búsqueda visual.

## 3. Requerimientos técnicos

### 3.1. Release, servicios y seguridad

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H8-RT01 | Entornos separados | Configuración/cuentas/proyectos y datos de local, staging y producción identificados. Fixtures no contienen PII real ni se cargan en producción; reset destructivo solo en entorno local/aislado autorizado. |
| H8-RT02 | Migraciones reproducibles | Secuencia completa, inventario de tablas, restricciones/grants/RLS y tipos generados verificados. Ensayar actualización desde versión anterior y no depender de cambios manuales ocultos en Dashboard. |
| H8-RT03 | CI y aplicación | Lint, TypeScript, build y pruebas pertinentes con versiones/lockfile fijados. Consultar AGENTS y guías instaladas antes de ajustes; no renovar stack o agregar backend ajeno al diseño durante lanzamiento. |
| H8-RT04 | Despliegue compatible | Hosting propuesto sujeto a PT-12; verificar runtime, URLs, SSR/cookies, handlers y límites de imágenes de 3/4 MiB en staging real. Migraciones y release de aplicación deben ser compatibles durante la transición. |
| H8-RT05 | Acceso real comprobado | SMTP/MFA e invitación/recuperación del personal; alta sin SMS, cookie/enlace/QR y cambio de contacto del cliente con tarjeta preservada. Callbacks/dominios por entorno; mocks no prueban servicios reales. |
| H8-RT06 | Secretos y permisos | Claves fuera de Git/bundles/DTO/logs, secreto Auth administrativo solo servidor y permisos revisados contra anon/cliente/atención/manager/AAL1/revocados. Tablas sin CRUD directo y RPC con permisos explícitos. |
| H8-RT07 | Seguridad de sesión y privacidad | Sin caché compartida privada, filtración tras logout o callback con redirección libre. Logs no contienen direcciones, teléfonos completos, preferencias, OTP/JWT o mensajes completos. Términos/aviso/retención aprobados PT-11. |
| H8-RT08 | Activación controlada | `ordering_enabled` solo después de configuración comercial y atención listas; fidelización mediante `activate_loyalty_program` y condiciones de H6, sin bypass por patch genérico. Costos/términos/personas/procedimientos reales confirmados antes de habilitar. |

### 3.2. Recuperación, observabilidad y experiencia

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H8-RT09 | Respaldo completo | Inventario de DB, bytes Storage y configuración/Auth necesaria según servicio contratado; acceso restringido, recuperación verificable. No afirmar que backup SQL contiene archivos Storage ni que un plan no contratado da cobertura. |
| H8-RT10 | Recuperación ensayada | Restauración aislada, comprobación de FKs/identidades/contador/eventos/premios/recibos y conciliación de entregas posteriores al respaldo. Pausa de escrituras hasta consistencia; RPO 24 h/RTO 4 h son metas propuestas a validar/medir, no SLA garantizado. |
| H8-RT11 | Pausa y rollback | Procedimiento para pausar pedidos/programa sin ocultar carta, perder borrador o borrar derechos. Rollback de aplicación requiere compatibilidad de esquema; no deshacer eventos comerciales confirmados como si fueran solo una versión de código. |
| H8-RT12 | Salud y monitoreo | `GET /api/health` responde salud mínima de proceso/configuración sin secretos o PII; no consulta DB costosa en cada llamada pública. Verificaciones de dependencias restringidas y alertas con requestId/operationId, latencia/errores y responsables. |
| H8-RT13 | Métricas interpretables | Diferenciar abrir WhatsApp de venta; no reportar facturación o preferencias inferidas de pedidos inexistentes. Medir visitas/sellos/canjes y costos de referencia disponibles con autorización, sin ampliar analítica o exportaciones personales por defecto. |
| H8-RT14 | Accesibilidad y dispositivos | Objetivo WCAG 2.2 AA con revisión automática/manual, sin afirmar certificación por un solo check. Probar 320/375/768/1440 px, zoom 200 %, teclado/foco/lector, dock sin cubrir campos, fotos y retorno móvil real. |
| H8-RT15 | SEO y contenido | Metadata/canonical con dominio y negocio confirmados; rutas privadas/pedido noindex según frontend. Sin reseñas/direcciones/horarios ficticios; términos/privacidad publicables y enlazados antes de fidelización real. |
| H8-RT16 | Piloto aislado y evidencias | Datos de ensayo claramente identificados; escenarios incluyen 9/10/11/20, premios available/redeemed/voided, fallos y correcciones. Reporte por commit/entorno/caso/resultado; secretos fuera de capturas compartidas. |
| H8-RT17 | Aceptación de excepciones | PT-08, PT-11 y PT-13 aprobados e implementados con pruebas específicas y referencias a decisiones. No sustituir prueba de restitución/entrega elegida por una nota genérica de cierre de incidencia. |

Las metas iniciales de primer agregado en treinta segundos y pedido simple preparado en dos minutos se evalúan en tareas observadas del piloto. No se presentan como rendimiento alcanzado ni promesa comercial; un problema observado genera corrección y nueva comprobación pertinente.

### 3.3. Diseño UX/UI y sistema visual

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H8-RT18 | Reglas y skill aplicables | Leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md); usar `ui-ux-pro-max` y registrar encaje/recomendaciones, sin depender de una ruta personal ni sustituir decisiones por una plantilla. |
| H8-RT19 | Patrón visual del hito | Auditoría UI identifica pantallas/estados/versión, anchos canónicos, pares renderizados, teclado, foco, zoom, lector y dispositivos reales. Observaciones del piloto se registran sin PII y sin atribuir conversión garantizada a competidores. |

Los valores visuales se consultan en el sistema canónico. La aceptación exige estados reales del alcance, anchos definidos allí y evidencia manual/automática pertinente; los recursos originales siguen pendientes en PT-09 cuando no estén disponibles. Esta ampliación no crea interfaces ni afirma pruebas ejecutadas.

## 4. Requerimientos funcionales de H8

**H8-RF** describe aceptación/operación del producto completo y no sustituye RF-01–RF-18.

| ID | Requerimiento funcional | Comportamiento observable |
| --- | --- | --- |
| H8-RF01 | Probar como invitado real | Participante prepara pedido individual/familiar y abre/copia mensaje completo; persona autorizada comprueba recepción y atención en WhatsApp sin inferir venta de la apertura. |
| H8-RF02 | Operar tarjeta con personas autorizadas | Cliente accede a su tarjeta y personal registra visita presencial pagada/entregada, premio y canje posterior con reglas comprendidas. |
| H8-RF03 | Resolver errores ensayados | Responsable puede corregir sello, cerrar/revisar incidencia y seguir recuperación/contingencia/PT-13 aprobados sin intervención improvisada. |
| H8-RF04 | Mantener datos públicos correctos | Responsable cambia precio/disponibilidad y verifica carta; restauración exige revisión y no publica automáticamente. |
| H8-RF05 | Usar el producto en dispositivos reales | Navegación, formularios, enlace privado, teclado, foco y retorno desde WhatsApp resultan utilizables con estados claros de fallo. |
| H8-RF06 | Reconocer límites comerciales | Horario/cobertura/cargos desconocidos admitidos se informan; datos bloqueantes faltantes no se muestran como confirmados ni se inventan métodos de pago. |
| H8-RF07 | Continuar ante falla opcional | Tarjeta fuera de servicio no bloquea pedido invitado si catálogo se valida; pausa de fidelización conserva consulta/derechos según estado. |
| H8-RF08 | Recuperar operación y datos | Personal reconoce incertidumbre, recupera UUID y puede seguir procedimiento de restauración/conciliación sin duplicar premios entregados. |
| H8-RF09 | Publicar tras aceptación | Propietario revisa resultados y bloqueos, acepta piloto y autoriza activación del alcance acordado con responsables identificados. |
| H8-RF10 | Sostener operación diaria | Personal encuentra instrucciones, responsables de atención/alertas, procedimiento de pausa y escalado; no depende del desarrollador para tareas ordinarias. |
| H8-RF11 | Comprobar comprensión y consistencia en el piloto | Usuarios del piloto y personal realizan recorridos sin confundir solicitud con venta, progreso con premio o revisión con resolución; el reporte identifica fallos y evidencia de corrección. |

## 5. Definition of Done

Todas las condiciones siguientes requieren evidencia real del entorno correspondiente. Casillas pendientes; ninguna prueba, servicio ni aprobación se declara completada por este documento.

### Validación integral y preparación

- [ ] H1–H7 tienen su aceptación/evidencia; no hay caso crítico de permisos, precio, sello, canje, conservación o recuperación fallido/sin ejecutar.
- [ ] Matriz vincula los 18 RF, 36 CA y 39 CT con casos/resultados, además de soft delete y procedimientos aprobados; cualquier no aplicable tiene justificación revisada, sin usarla para excluir un comportamiento vigente.
- [x] Migraciones completas reconstruyen esquema/datos controlados y actualización de versión; tipos, grants/RLS/funciones e inventario de tablas son coherentes. Evidencia H8: 23 migraciones, 18 tablas y 132 pgTAP.
- [ ] Lint, TypeScript, build y pruebas pertinentes pasan en CI/staging; concurrencia se probó contra PostgreSQL real con conexiones distintas.
- [ ] Android/iOS reales y navegadores previstos se revisan junto con teclado/lector/zoom/foco y tamaño mínimo; problemas críticos de accesibilidad están corregidos.
- [ ] Enlace/QR entre dispositivos, cambio de contacto, MFA del personal y correo de recuperación/invitación se comprobaron con servicios reales de prueba y callbacks autorizados.
- [x] Secretos, caché privada, permisos actuales y logs sanitizados se revisaron; no hay PII real en evidencias compartidas. E2E privado, pruebas de allowlist y 46 recursos estáticos comprobados; datos sintéticos únicamente.

### Configuración, procedimientos y piloto

- [ ] Precios/inclusiones/modalidades/opciones y pagos publicables están confirmados; C01/P05 y porciones de alitas conservan sus reglas.
- [ ] Ubicación de recojo está confirmada antes de habilitarlo; horarios/cobertura/cargos desconocidos solo permanecen si el contrato admite su tratamiento informado.
- [ ] WhatsApp oficial y responsables de atención se comprobaron mediante recepción/atención controladas, sin anunciar venta desde una apertura.
- [ ] Costo del premio, términos/privacidad, acceso privado entre dispositivos y personal autorizado están confirmados.
- [ ] **PT-08, PT-11 y PT-13** tienen decisiones aprobadas, operaciones/procedimientos implementados y pruebas; ninguna resolución central sigue suplida por una nota o suposición.
- [ ] Piloto cubre pedido individual/familiar, tarjeta, sello, premio/canje, reversión, incidente y mantenimiento; personal lo realiza usando instrucciones.
- [ ] Fallos del piloto se corrigieron y verificaron; responsable acepta resultados y alcance con evidencia fechada.

### Recuperación, publicación y entrega

- [ ] Backups incluyen lo necesario para recuperar DB y recursos; plan contratado y límites están documentados sin prometer capacidades inexistentes.
- [ ] Restauración aislada se ensayó con reconciliación de entregas posteriores; se midieron recuperación y pérdida potencial frente a metas propuestas.
- [ ] Procedimiento de pausa/reanudación/rollback se ensayó y conserva historial, borrador y premios; existen responsables y accesos autorizados.
- [ ] Dominio/hosting/cuentas/variables/callbacks están confirmados; versión desplegada corresponde a commit y migraciones verificados.
- [ ] Flags se activan después de aceptación; programa usa su activación transaccional y no una habilitación genérica incompleta.
- [ ] Se comprueba versión publicada, carta, continuación WhatsApp y acceso autorizado sin contaminar tarjetas reales con fixtures.
- [ ] Monitoreo/alertas/health e instrucciones de operación/contingencia quedan disponibles y los responsables saben utilizarlos.
- [ ] Registro de entrega distingue aceptación técnica, piloto y activación productiva; cualquier lanzamiento parcial cuenta con acuerdo explícito del propietario.

### Diseño UX/UI y marca

- [x] Se leyeron reglas del proyecto, UX/UI y sistema canónico; se aplicó `ui-ux-pro-max` al trabajo visual y se registraron consultas/recomendaciones aplicadas o descartadas con motivo. [Revisión H8](evidencia/h8/revision-ui.md).
- [ ] Reporte final con la skill cubre compra/cliente/personal/admin y estados críticos; defectos de marca/accesibilidad/usabilidad bloqueantes corregidos y verificados antes de activar.
- [ ] Se revisaron los anchos de evidencia del sistema visual, sin desbordamiento involuntario ni acciones esenciales ocultas; no hay colores/medidas alternativos duplicados en componentes.
- [ ] Teclado, foco completamente visible, labels/errores, contraste renderizado, zoom/reflujo y lector se comprobaron en el alcance; resultado y casos no ejecutados están identificados.
- [ ] Capturas y reporte identifican versión/entorno y datos sintéticos. Evidencia específica: Reporte global y piloto: encontrar producto, revisar pedido, volver de WhatsApp, entender progreso/premio y operar/escalar sin duplicaciones.

### Cobertura integral y evidencia mínima

| Cobertura | Comprobación principal | Evidencia requerida |
| --- | --- | --- |
| RF-01–RF-05; CA-01–CA-05, CA-10–CA-12, CA-18, CA-36 | Carta, promociones, datos confirmados, modalidades y opciones. | Revisión comercial y E2E/proyección pública. |
| RF-06–RF-11; CA-06–CA-22, CA-36 | Carrito, importes, formulario, validación, persistencia y WhatsApp. | Casos con precio esperado, recarga/fallos, URL decodificada y recepción controlada. |
| RF-12–RF-14; CA-23–CA-25, CA-27, CA-32 | Identidad propia, tarjeta y preferencias explícitas. | Auth real/controlada diferenciada, permisos y estado antes/después. |
| RF-15–RF-17; CA-26–CA-33 | Atención, entregas, idempotencia, concurrencia y correcciones. | Matriz de actores y eventos/recibos/premios finales de transacciones reales. |
| RF-18; CA-17–CA-19, CA-22–CA-23, CA-32, CA-34–CA-36 | Fallos, recuperación, datos pendientes y accesibilidad. | E2E de fallos y revisión manual de dispositivos/teclado/lector. |
| CT-01–CT-39 del documento 08 | Casos técnicos por sus definiciones exactas, incluidos Auth/Storage y restauración. | Reporte individual de caso, commit, entorno y resultado; no solo suma de tests. |
| Documento 10: soft delete | Todas las entidades, padres, claves, permisos, restauración/reintentos y protecciones del historial. | Matriz de conservación por entidad/actor, consulta de integridad y escenarios concurrentes. |
| PT-08/PT-11/PT-13 tras acuerdo | Procedimientos excepcionales y resolución del premio fallido. | Decisión, especificación final, prueba y capacitación aceptadas. |
| Operación y piloto | Respaldos, recuperación, servicios reales, atención y aprobación de publicación. | Acta/registro de piloto, ensayo de restore y checklist de configuración/despliegue sin secretos. |

## 6. Dependencias y pendientes

**Requisitos previos:** ocho especificaciones disponibles y [H1](01-hito-1-preparacion-del-proyecto.md)–[H7](07-hito-7-correcciones-y-operacion.md) implementados/aceptados para cierre integral. Algunas preparaciones de entornos y datos pueden adelantarse sin activar funcionalidades.

| Pendiente | Trabajo afectado | Qué bloquea o permite |
| --- | --- | --- |
| PT-01/PT-04/PT-05: ubicación, pagos y datos comerciales | T06, T10–T12. | Bloquean modalidad/checkout/artículos afectados; no publicar sustitutos sintéticos. |
| PT-02/PT-03: horarios/cobertura/cargos | T06. | Pueden conservar unknown/pendiente si contrato lo permite y usuario lo ve; no autoriza ignorar exclusión confirmada o cargo conocido. |
| PT-06/PT-07: costo/acceso privado real | T02, T07, T10–T12. | Bloquean fidelización pública; pruebas locales no sustituyen costo/presupuesto/proveedor confirmados. |
| PT-08: personal/recuperación/contingencia | T07–T10. | Bloquea operación pública de tarjetas y aceptación integral del procedimiento. |
| PT-11: términos/aviso/plazos | T07–T10. | Bloquea lanzamiento de fidelización; no inventar textos/plazos. DC-15 excluye baja de clientes. |
| PT-13: resuelto por DC-13 | T01, T04, T07, T10–T12. | Restitución aprobada y probada en H7; conservar recorrido y comprobarlo con el personal durante el piloto. |
| PT-09/PT-10: marca/atención | T06, T09–T10. | Fotos pueden usar fallback; atención responsable y recepción real son necesarias para piloto/lanzamiento. |
| PT-12: hosting/dominio/respaldos | T02–T03, T08, T11–T12. | Bloquea despliegue público y cobertura productiva de respaldo; desarrollo/ensayo aislado pueden continuar. |

Después de la entrega se registra seguimiento operativo y backlog fuera del alcance. Propuestas de fidelización alternativas, POS, pagos online o almacenamiento de ventas necesitan análisis/acuerdo propios; no se incorporan como condición oculta para cerrar este producto.

## 7. Referencias

- [Reglas generales](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md).
- [Identidad visual y cobertura por vistas](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md) e [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md).

- [Guía general de hitos](hitos-del-proyecto.md).
- [Análisis y criterios funcionales](../analisis-del-proyecto.md).
- [Fidelización](../diseno-tecnico/02-fidelizacion.md).
- [Autenticación y seguridad](../diseno-tecnico/04-autenticacion-seguridad.md).
- [Contratos](../diseno-tecnico/05-contratos-y-operaciones.md).
- [Frontend, accesibilidad y SEO](../diseno-tecnico/06-frontend-y-estado.md).
- [Despliegue, monitoreo y respaldo](../diseno-tecnico/07-despliegue-y-operacion.md).
- [Matriz RF/CA/CT](../diseno-tecnico/08-pruebas-y-aceptacion.md).
- [Plan técnico](../diseno-tecnico/09-plan-de-implementacion.md).
- [Tablas y comprobaciones de conservación](../diseno-tecnico/10-tablas-db.md).
- [Navegación](../diseno-tecnico/12-flujo-navegacion.md).
- [Decisiones y bloqueos](../diseno-tecnico/README.md).

La creación de este documento no ejecuta pruebas de la aplicación, contrata servicios, publica el producto ni acredita aceptación del propietario.
