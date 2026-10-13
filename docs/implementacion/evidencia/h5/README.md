# H5 — Evidencia de implementación

**Revisión:** 8 de octubre de 2026.  
**Estado:** pedido invitado y configuración comercial implementados; migración aplicada al Supabase remoto. Repetición final de navegador aprobada: 31 pruebas sobre el árbol final, incluida la revisión de dock/espaciado. Compilación remota y revisión de secretos aprobadas. Aceptación manual y habilitación comercial pendientes.  
**Referencia:** [Hito 5](../../05-hito-5-pedido-por-whatsapp.md), [guía](../../hitos-del-proyecto.md) y [contratos/operación](operacion.md).  
**Versión verificable:** árbol de trabajo sobre `86e156a4215329090b973c0c295fecf889881431`, sin commit ni despliegue del sitio solicitados. Sistema visual canónico 1.0; H5 1.3.

## Resultado implementado

- Rutas `/pedido`, `/pedido/datos`, `/pedido/continuar`, carrito compartido y adición desde producto. Cantidades, opciones, indicaciones, edición/retirada y modalidades válidas; no exige cuenta o teléfono.
- Persistencia comercial local separada de datos de sesión. Recuperación posterior al montaje; versiones dañadas/expiradas, storage bloqueado, indicaciones perdidas y cambios de otra pestaña requieren decisiones explícitas. Fallo de sessionStorage no descarta los productos legibles.
- `POST /api/cart/validate` con límites reales de bytes/cantidades, contrato sin PII, consulta fresca, precios/opciones/revisiones canónicos y control de respuesta antigua. Vigencia de 60 segundos medida con reloj monotónico. C01/P05 conservan sus restricciones.
- Campos condicionales y errores con foco, importes enteros, cargo desconocido y total pendiente. No inventar cobertura, pago o ubicación. Recojo solo con ubicación confirmada; cobertura excluida, horario cerrado y mínimo conocido incumplido bloquean.
- Mensaje local completo, teléfono oficial, copia con resultado real, alternativa sin truncar para URL larga, apertura explícita y recuperación. Abrir WhatsApp conserva borrador y no confirma una venta ni escribe solicitudes en Supabase.
- Pagos/zonas administrables por manager/AAL2, con revisiones global/hija, idempotencia, auditoría y soft delete. Restauración deshabilitada/sin verificar; no se puede retirar el último pago utilizable con pedidos activos. Se reutilizan operaciones/journal del catálogo.
- Componentes por dominio, tipos separados, Tailwind, primitivas existentes y APIs del Next instalado. Dock en carta/detalle con reserva de espacio; se omite dentro del pedido. No se añaden dependencias, tablas de ventas, pago online o servicios de fidelización.

## Entornos y resultados

Windows, Node 22.16.0, Yarn 1.22.22, Next 16.3.8, React 19.2.8, TypeScript 5.9.3, Tailwind 4.3.3, Supabase SDK 2.117.2 / SSR 0.12.7 / CLI 2.119.0 y Sharp 0.35.5. PostgreSQL 17/Auth/Storage local para fixtures; Chrome sin ventana y build de producción local en puerto 3100. Desarrollo habitual con Supabase remoto autorizado.

| Comprobación | Resultado obtenido |
| --- | --- |
| Reconstrucción | Reset exclusivamente local aplicó las diez migraciones. Tipos finales generados desde remoto mediante `yarn db:types`. |
| Unitarias/componentes | `yarn test`: **77 aprobadas**, 16 archivos. 21 incorporadas para H5: dominio, cantidades, dinero, persistencia, revisión, carreras, sesión bloqueada, mensajes y recepción limitada. |
| Integración | `yarn test:integration`: **64 aprobadas**, nueve archivos. Seis nuevas con PostgreSQL/Auth/MFA reales: permisos, patches cerrados, proyección, conservación, global/hija, no-op, replay/concurrencia, atomicidad y último pago. |
| PostgreSQL | `yarn test:db`: **73 aprobadas**, cinco archivos. 16 nuevas comprueban RLS/ACL, soft delete, datos seguros y función base privada. |
| Navegador | **`yarn test:e2e`: 31 aprobadas sobre el árbol final**, siete H5 y 24 de regresión H1–H4. Comando completo en 142,16 s; Playwright en 1,8 min. Incluye las comprobaciones adicionales de datos/continuación, foco y dock. |
| Código | `yarn lint` aprobado sobre el árbol final; TypeScript estricto aprobado en builds local y remoto finales. |
| Compilación final | `yarn build:local` aprobado dentro de la repetición E2E; después, **`yarn build` remoto aprobado** en 26,34 s con dos workers. El build final utiliza variables del proyecto remoto autorizado. |
| Frontera de servidor | `yarn test:boundary` aprobado: Client Component no puede importar infraestructura marcada server-only. |
| Secretos | `yarn check:secrets`: **35 recursos estáticos** del build remoto final sin claves secretas locales/remotas. Sin credenciales/OTP/cookies ni trazas de login en evidencias. |
| Supabase remoto | Guard de destino, historial y dry-run mostraron una migración nueva; push aprobado y lectura posterior guardada en [remote-check.json](remote-check.json). |

Dos intentos anteriores con 15 workers se interrumpieron en Windows, uno con `Zone Allocation failed - process out of memory`. Se limita `experimental.cpus` a dos en `next.config.ts`, confirmado por tipos/código del Next instalado. El ajuste se conserva para builds reproducibles en esta computadora con Docker. La repetición posterior encontró Auth/PostgreSQL locales apagados (ECONNREFUSED) y se aplazó por decisión del propietario; ese fallo de entorno no acreditaba un defecto del carrito.

Al autorizar el propietario retomar las comprobaciones, se recuperó Docker sin restablecerlo a fábrica ni borrar volúmenes. Los logs identificaron el socket temporal inaccesible `userAnalyticsOtlpHttp.sock`. Con los procesos Docker cerrados y las rutas verificadas, se conservó el directorio de ejecución como `%LOCALAPPDATA%/Docker/run-h5-backup-0944ccca` y se creó uno vacío. Docker Engine 26.1.4 respondió y `yarn db:start` aprobó antes de ejecutar la suite. Solo se reinició la distribución `docker-desktop`; las imágenes, volúmenes y configuración se conservaron. La [guía oficial de WSL](https://learn.microsoft.com/en-us/windows/wsl/basic-commands) define la terminación de una distribución concreta; el [reporte de Docker sobre sockets inaccesibles en Windows](https://github.com/docker/desktop-feedback/issues/527) aporta un antecedente del problema, sin sustituir la comprobación de los logs de esta máquina.

Las pruebas destructivas rechazan destinos remotos y limpian únicamente sus fixtures locales. Integración/E2E se ejecutan secuencialmente por compartir singleton. Ninguna semilla, cuenta sintética, reset o reparación de historial se hizo en remoto.

Enlaces locales de los seis documentos de entrega comprobados; 70 archivos TSX propios dentro del límite de 170 líneas, sin aliases/interfaces declarados fuera de las carpetas de tipos del dominio. `git diff --check` aprobado; no se alteraron las reglas ni el historial Git. Las evidencias previas de H1–H4 se conservan como antecedentes.

## UX/UI y marca

Se aplicó `ui-ux-pro-max`, MASTER y el [sistema visual](../../../../.agents/brand/sistema-visual.md). Tokens/fuentes canónicos y primitivas existentes; no se persiste una paleta o MASTER alternativo.

| Consulta ejecutada | Decisión |
| --- | --- |
| `restaurant checkout mobile minimal` / design-system | Claridad/jerarquía de Minimalism & Swiss Style aprovechables; Hero/Features/CTA, paleta negro/dorado y fuentes Playfair SC/Karla descartadas por no encajar con checkout y marca. |
| `checkout form error recovery` / domain ux | Error Recovery y Error Messages: conservar entrada, anunciar errores y permitir reintento con contexto. |
| `context provider hydration forms` / stack nextjs | Sin resultados; no se atribuye una recomendación a esa consulta. |
| `forms server actions validation` / stack nextjs | Validación y Server Actions privadas contrastadas con las guías instaladas; validación pública mediante Route Handler. |
| `restaurant checkout minimal mobile` con variance/density/motion | Reintento de composición; se descarta patrón de marketing y animación/colores alternativos. Composición propia del pedido y reutilización del sistema. |
| `focus not obscured` / domain ux | Foco despejado y reserva para dock; dentro del checkout se omite dock. Foco completamente visible es regla del producto; no se atribuye el criterio mejorado AAA al mínimo AA. |

Se leyeron quick-reference y pro-rules de la skill y guías instaladas de server/client, handlers, configuración y memoria. Acciones asíncronas muestran carga contextual, deshabilitado y guard inmediato contra duplicados; cantidades, filtros y enlaces no presentan espera ficticia.

Capturas actualizadas del árbol final, con datos sintéticos, en [capturas](capturas/): carrito vacío/activo, [datos a 390 px](capturas/datos-390.png), [continuación a 1280 px](capturas/continuar-1280.png), [errores](capturas/errores-datos.png), [precio cambiado](capturas/precio-cambiado.png), [indicaciones perdidas](capturas/indicaciones-perdidas.png), [copia denegada](capturas/copia-denegada.png), [revisión expirada](capturas/revision-expirada.png), [servicio fallido](capturas/servicio-fallido.png) y [condiciones privadas](capturas/configuracion-condiciones.png).

Carrito, datos y continuación aprobaron las comprobaciones de desbordamiento y axe con reglas WCAG A/AA en 360/390/768/1280/320 CSS px. Se comprobó navegación por Tab entre nombre y dirección, foco completamente visible y contorno de 2 px; dock presente en producto y ausente dentro del checkout. Se repitió la consulta de la skill sobre foco no oculto y se inspeccionaron los PNG finales de carrito a 390 px, datos a 390 px y continuación a 1280 px. Las acciones del pie y el formulario quedan despejados. La comprobación automática no acredita por sí sola conformidad completa con WCAG.

**Pendientes manuales:** lector de pantalla real, zoom real, dispositivos físicos, fotografías originales PT-09 y revisión del propietario. Reflujo/axe/teclado automatizado no sustituyen esas comprobaciones. La apertura inspecciona la URL oficial y utiliza una respuesta sintética del chat; no prueba recepción real, política de ventanas de todos los navegadores ni atención del personal. El fallback de URL larga se verifica en unitarias, clipboard denegado y vuelta en navegador. Fidelización aún no existe: se comprueba independencia de Auth/tarjeta, y caída real de H6 queda pendiente de integración.

## Supabase remoto

Proyecto verificado `geazxsvjkqpzbghlywbw`, diez migraciones acumuladas y doce tablas propias: nueve en public y tres en app_private. Auth/Storage administrados no se incluyen en ese conteo.

Migración: [20261008006000_checkout_configuration.sql](../../../../supabase/migrations/20261008006000_checkout_configuration.sql). SHA-256: `94894aafbb2b1cc448cd61bf5d7811a66d4ef2dfb0a76764165517612457770b`.

[Comprobación de solo lectura](../../../../supabase/checks/h5-readonly.sql) y [salida](remote-check.json):

- Migración H5 presente, RLS en ambas tablas, CRUD de sesiones denegado y función escalar interna sin EXECUTE de authenticated.
- `payment_methods` y `delivery_zones`: **cero registros**; no se inventaron datos comerciales para habilitar pedidos.
- 29 referencias del catálogo conservadas. H5 no publica borradores ni altera precios de referencia.
- `ordering_enabled=false`, `loyalty_enabled=false`, `paymentsReady=false`. Teléfono público oficial +51982042493.
- No existe `public.orders`; la validación pública tampoco crea recibos/auditoría ni cambia la revisión, comprobado antes/después en E2E local.

`projectExpected` en SQL es una etiqueta; la identidad se verifica por el enlace CLI antes de consultar. `yarn dev/build/start` mantienen `.env.remote.local` y el guard del proyecto; el entorno local existe exclusivamente para pruebas.

## Trazabilidad y límites de cierre

| Alcance | Evidencia |
| --- | --- |
| H5-T01–T03, RT01–RT02 | Migración, pgTAP H5, `tests/integration/checkout-config.test.ts`, configuración privada E2E y lectura remota. Confirmación de pagos/precios/atención real sigue pendiente. |
| H5-T04–T05, T09, RF02–RF04; CT-18/33/34 | `cart.test.ts`, `cart-provider.test.tsx`, E2E de recarga/otra pestaña/indicaciones/corrupción. Sin PII en almacenamiento comercial ni petición de validación. |
| H5-T06–T07, RT03–RT13; CA-04–CA-19, CT-17/22 | Dominio y API real: precios actuales, opciones/cantidades, P05, pickup, NULL, horario cerrado, excluidas/mínimos, respuestas antiguas y errores recuperables. Opciones retiradas se prueban en dominio; no se simula su reemplazo automático. |
| H5-T08–T10, RF09–RF13; CA-20–CA-22, CT-21 | Mensaje puro, URL larga, vínculo inspeccionado, vuelta, copia denegada/expiración y ausencia de escrituras. Chat/PII exclusivamente sintéticos. Recepción real pertenece al piloto PT-10. |
| H5-T11, RT19–RT20 | Consultas/decisiones de skill, Tailwind/tokens únicos, capturas y pruebas de foco/axe/reflujo. Casos manuales pendientes declarados. |

H5 tiene implementación y evidencia técnica; aceptación del propietario y habilitación pública son decisiones adicionales. Antes de activar: PT-04 pagos, PT-05 artículos afectados y PT-10 responsable/recepción; PT-01 para recojo. Horarios/cobertura/cargos desconocidos solo continúan con los avisos contractuales. PT-12 incluye hosting/protección distribuida de abuso; los límites/timeout no sustituyen ese control.

PT-08/PT-11/PT-13 no se resuelven por inferencia. H6 puede avanzar sobre pedido invitado aislado; el sello seguirá acreditándose únicamente por visita presencial con compra pagada y pedido entregado, conservando diez sellos por Mostrito de ⅛.

## Cierre de la comprobación pendiente

El propietario había indicado dejar pendiente la última prueba de navegador ante Docker sin motor. Su solicitud posterior de realizar las comprobaciones pendientes reanudó ese trabajo. Se recuperó el entorno aislado, se ejecutó `yarn test:e2e` con **31 resultados aprobados**, se actualizaron las capturas y se inspeccionó el ajuste visual final.

Después se ejecutaron `yarn build` y `yarn check:secrets`, ambos aprobados, restaurando el build para Supabase remoto antes del uso habitual de `yarn start`. No se hicieron cambios de código de la aplicación ni nuevas mutaciones remotas en esta revisión. Las comprobaciones automáticas pendientes de H5 quedan cerradas; H6 puede comenzar técnicamente. La aceptación manual, la integración futura de caída de fidelización y los datos necesarios para activar funciones públicas mantienen los límites descritos arriba.
