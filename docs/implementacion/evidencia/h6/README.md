# H6 — Evidencia de implementación

> **Reporte histórico del 9/10/2026:** conserva los resultados ejecutados con OTP antes del cambio solicitado. El acceso vigente y sus verificaciones están en [revisión sin SMS](acceso-sin-sms/README.md); las variables/procedimiento SMS de este reporte dejaron de aplicarse al cliente.

**Revisión:** 9 de octubre de 2026.  
**Estado:** núcleo ordinario implementado y comprobado; cuatro migraciones aplicadas al Supabase remoto. Habilitación pública, aceptación manual y excepciones de H7 pendientes.  
**Referencia:** [Hito 6](../../06-hito-6-fidelizacion.md), [guía](../../hitos-del-proyecto.md) y [operación](operacion.md).  
**Versión verificable:** árbol de trabajo sobre 86e156a4215329090b973c0c295fecf889881431, sin commit ni despliegue del sitio solicitados. H6 1.2; sistema visual canónico 1.0.

## Resultado implementado

- Acceso opcional por teléfono peruano mediante Supabase Auth, OTP pegable, reenvío y vigencia configurados; activación única con nombre y aceptación vigente. Alta sin sello de bienvenida. Cambio normal mediante phone_change mantiene UUID, tarjeta y progreso.
- Área /mi-tarjeta con diez posiciones, conteo, premios independientes, últimos eventos y estados de pausa/suspensión. Nombre e indicaciones se guardan expresamente; aplicarlas al pedido exige otra acción. Respuestas tardías no sobrescriben un borrador editado.
- Atención con AAL2 y permiso vigente: búsqueda exacta del teléfono confirmado, ficha mínima, confirmación de compra presencial pagada y entregada. Diez sellos emiten Mostrito de ⅛ con chaufa, papas y ensalada; once dejan 1/10 con premio pendiente; veinte emiten dos premios.
- Canje en visita posterior sin compra obligatoria, con confirmación de cocina; no suma ni descuenta sellos. Agotamiento y pausa conservan derechos. Una incidencia de entrega fallida registra el problema sin restituir automáticamente el premio.
- Configuración de versión, costo real de referencia y disponibilidad por manager/AAL2. Versiones utilizadas conservan reglas; canjes conservan su costo histórico. Reanudar exige versión activa válida; activación inicial exige condiciones operativas confirmadas.
- Transacciones, recibos, auditoría, locks e idempotencia. Diario mínimo compartido con configuración persiste antes de enviar; storage bloqueado impide escribir. Recarga y respuesta perdida consultan el recibo antes de permitir otro envío; solo se reintenta la misma entrada y UUID.
- Seis tablas privadas, RLS y permisos explícitos, cinco con soft delete; eventos inmutables. Contador y deltas se reconcilian mediante constraint diferido al confirmar la transacción. No hay tabla de pedidos ni registro de solicitudes preparadas.

Implementación principal: [módulo loyalty](../../../../src/features/loyalty/), [consulta propia](../../../../src/app/api/me/card/route.ts), [tipos remotos generados](../../../../src/types/database.types.ts). Los tipos de aplicación están separados; componentes H6 no superan 170 líneas y consumen Tailwind/primitivas existentes.

## Entornos y resultados

Windows; Node 22.16.0, Yarn 1.22.22, Next 16.3.8, React 19.2.8, TypeScript 5.9.3, Tailwind 4.3.3, Supabase SDK 2.117.2 / SSR 0.12.7 / CLI 2.119.0. PostgreSQL 17/Auth/Storage locales para pruebas aisladas; Chrome sin ventana con build de producción local en puerto 3100. Desarrollo habitual y compilación final usan Supabase remoto autorizado.

| Comprobación | Resultado y alcance |
| --- | --- |
| Reconstrucción | Reset exclusivamente local aplicó las catorce migraciones. Tipos finales generados desde remoto con yarn db:types. |
| Unitarias/componentes | yarn test: **94 aprobadas**, 20 archivos. Validación, diario compartido, fallo de storage, ausencia de recibo, UUID de reintento, respuesta perdida, actualización fallida tras resultado confirmado y cookies de phone_change. |
| Integración | yarn test:integration: **82 aprobadas**, diez archivos; 18 de H6 con Auth/PostgreSQL reales locales y conexiones separadas. |
| PostgreSQL | yarn test:db: **99 aprobadas**, seis archivos; 26 de H6 sobre tablas, grants, hook, conservación e inmutabilidad. |
| Navegador completo | **38 aprobadas**, siete H6 y 31 de regresión H1–H5. Tras ampliar recuperación de canje, **las siete H6 finales aprobaron nuevamente en 39,6 s** con yarn playwright test --project loyalty --no-deps. |
| Código | yarn lint y yarn typecheck aprobados. TypeScript estricto también pasa en builds local y remoto. |
| Compilación | Build local y remoto aprobados; el remoto se vuelve a generar después de E2E para no dejar variables públicas del entorno de pruebas. |
| Frontera de servidor | yarn test:boundary aprobado: Next rechaza una importación server-only desde Client Component. |
| Secretos | yarn check:secrets: **40 recursos estáticos** del build remoto comprobados sin claves secretas locales/remotas. |
| Remoto | Destino CLI, historial, dry-run, push y consulta posterior: catorce migraciones, 18 tablas propias, RLS y grants restrictivos; [resultado](remote-check.json). |

Los tests de integración/E2E restauran configuración y eliminan únicamente identidades/filas sintéticas propias en el entorno local, protegido por comprobaciones de URL. Nunca ejecutan fixtures, resets ni credenciales sintéticas sobre remoto. OTP fijo prueba Auth real local; no prueba entrega SMS comercial.

### Cobertura funcional

| Requisitos/casos | Evidencia ejecutada |
| --- | --- |
| RF-12/RF-13; CA-23/CA-24; CT-13/CT-14/CT-30/CT-31 | Activación simultánea, cero sellos, términos rechazados, teléfono confirmado actual, cambio real local con UUID conservado y verificación distinta sin propagación de cookies. |
| RF-14; CA-25 | Guardado propio versionado y aplicación explícita; API fallida y respuesta tardía no bloquean ni sobrescriben pedido invitado. |
| RF-15/RF-16; CA-26–CA-29; CT-01–CT-06 | Pago/entrega obligatorios, 9/10/11/20, mismo UUID/entrada, UUID conflictivo, referencia duplicada y visitas concurrentes. |
| CA-30–CA-32; CT-29 | Canje concurrente único, sin compra ni cambio de progreso; stock, pausa y confirmaciones. Orden de locks definido en SQL; no se acredita una prueba de carga sostenida. |
| CT-10/CT-11/CT-19/CT-26/CT-28/CT-37 | AAL1/inactivo/cliente denegados, DTO mínimo, diario sin PII, respuesta perdida de sello y canje, logout y estados diferenciados. |
| CT-24: integridad ordinaria; documento 10 | Constraint contador/eventos, ordinales independientes, versión utilizada/premio canjeado/incidente abierto protegidos; restauración de perfil queda closed. |
| RF-18 | Continuidad invitada, teclado, axe, reflujo y recuperación; lector/zoom/dispositivos/piloto reales siguen pendientes. |

CT-07–CT-09, resolución de incidencias, bajas excepcionales y PT-13 se completan en H7. CT-32 queda cubierto por validación bajo locks y pruebas de términos/pausa/alta atómica; no se afirma haber ensayado todas las intercalaciones posibles de cambios de configuración.

Archivos reproducibles: [integración](../../../../tests/integration/loyalty.test.ts), [pgTAP](../../../../supabase/tests/h6_loyalty.sql), [E2E](../../../../tests/e2e/loyalty.spec.ts), [hook de operación](../../../../src/features/loyalty/hooks/use-loyalty-operation.test.ts), [revisión actual de identidad/cookies](acceso-sin-sms/README.md).

## UX/UI y marca

Se leyeron UI/UX Pro Max, quick-reference/pro-rules, MASTER, reglas del proyecto y [sistema canónico](../../../../.agents/brand/sistema-visual.md). Se consultaron las guías instaladas de Actions, handlers, cookies y DAL de Next antes de implementar.

| Consulta ejecutada | Aplicación |
| --- | --- |
| restaurant loyalty card minimal / design-system | Claridad de Minimalism & Swiss Style aprovechable. Se rechazaron paleta verde/estética de casino y fuentes Playfair SC/Karla: no corresponden al sistema de Fuego y Brasas. |
| accessible authentication OTP / domain ux | Labels visibles, pegado/autocompletado del OTP, ayuda contextual y conservación de entradas. |
| server actions validation / stack nextjs | Validación en ejecución y autorización en cada Action/RPC, contrastadas con documentación instalada. |

Composición propia: crema/blanco, acción roja, Fraunces/Manrope canónicas; progreso y premios separados. Controles con loading real, texto contextual, bloqueo inmediato y errores explícitos; navegación normal no muestra espera artificial.

**41 capturas** en [capturas](capturas/): acceso, OTP sin código visible, tarjeta vacía, décimo sello con premio, programa, agotamiento y pausa en 360/390/768/1280/320 CSS px; además nueve sellos, error de confirmaciones, once sellos con operación pendiente, canje pendiente, suspensión y foco.

Se ejecutaron axe con tags WCAG A/AA y comprobación de desbordamiento en los siete conjuntos y cinco anchos, sin violaciones detectadas. Navegación por Tab y contorno de foco de 2 px comprobados. Se inspeccionaron los PNG de tarjeta vacía a 390 px, atención con premio a 390 px, OTP a 390 px y programa a 1280 px. Teléfonos/nombres son sintéticos; OTP, cookies, tokens y credenciales no aparecen en capturas ni trazas de autenticación.

Ejemplos: [tarjeta móvil](capturas/tarjeta-vacia-390.png), [premio](capturas/premio-personal-390.png), [canje pendiente](capturas/canje-pendiente.png), [sello pendiente](capturas/operacion-pendiente-once-sellos.png), [agotamiento](capturas/premio-agotado-390.png).

**Pendientes manuales:** lector de pantalla real, zoom real, dispositivos físicos, conectividad real, revisión del propietario y piloto con personal. Axe/reflujo/teclado automatizados no certifican conformidad WCAG ni sustituyen esas pruebas.

## Supabase remoto y migraciones

Proyecto vinculado verificado antes del push: **geazxsvjkqpzbghlywbw**. Cuatro migraciones nuevas aplicadas en orden; diez anteriores intactas. Dieciocho tablas propias: nueve public y nueve app_private. Auth/Storage siguen administrados. El campo projectExpected de la consulta es una etiqueta; la identidad del destino se comprobó mediante el vínculo CLI, no por esa etiqueta.

| Archivo aplicado | SHA-256 |
| --- | --- |
| [07000: tablas](../../../../supabase/migrations/20261008007000_loyalty_tables.sql) | DB6F0426D6C44C559207D877DD37CD40942B96E07B382D9CAD7913AC5B349F57 |
| [07100: lecturas/perfil](../../../../supabase/migrations/20261008007100_loyalty_reads.sql) | ED307B09B40027620D332C5AC1DAEAF974C8BA2D3FFE6CA3CC1E950EA9865BCF |
| [07200: operaciones](../../../../supabase/migrations/20261008007200_loyalty_operations.sql) | 3909495C7B6D40CD088C222A5DD7A406B979CB51C213272D3294A68EF8B308CC |
| [07300: filtro de altas Auth](../../../../supabase/migrations/20261008007300_auth_phone_gate.sql) | 1B596123901911909FF5E4DC68DA786A5E0A633FE06A5C627767374FE5282033 |

[Consulta remota de solo lectura](../../../../supabase/checks/h6-readonly.sql): cero clientes/tarjetas/eventos/premios/incidentes, 29 referencias comerciales, pagos/zonas vacíos, pedidos y fidelización false. Programa draft, meta diez, costo desconocido y disponibilidad false. No se crearon cuentas reales ni se alteraron datos comerciales.

La función before_customer_created está aplicada y solo Auth puede ejecutarla. **No se habilitó el hook ni se modificó configuración Auth remota**; existe un procedimiento de preparación en [operación](operacion.md). La aplicación mantiene AUTH_PHONE_ENABLED y aprobaciones false. No se contrató proveedor ni se envió SMS real.

## Límites y transición

PT-06: costo real; PT-07: proveedor/presupuesto/CAPTCHA y teléfonos reales; PT-08: personal/recuperación/contingencias; PT-11: condiciones/privacidad/conservación/baja; PT-13: resolución del premio registrado sin entrega. Todos conservan su estado pendiente. Los textos legales se muestran como borradores, no como aprobados.

H7 puede continuar sobre el núcleo técnico verificado. No habilitar fidelización pública antes de cerrar sus condiciones operativas y excepcionales, ni activar pedidos sin resolver sus propios datos comerciales. Este reporte acredita los resultados listados, no una aprobación del propietario o lanzamiento.

## Registro de cierre

La suite completa de 38 pasó antes de añadir el caso de respuesta perdida de canje. Se repitió después únicamente H6: **siete aprobadas**, incluidos sello y canje inciertos y 41 capturas. Una primera ejecución de ese añadido falló por el nombre de columna en la aserción del test; se corrigió a event_type. No fue un fallo de la transacción de canje. Compilación remota posterior aprobada en 12,10 s y comprobación de sus 40 recursos estáticos aprobada. Enlaces de los seis documentos actualizados verificados y doce componentes H6 dentro del límite de 170 líneas.
