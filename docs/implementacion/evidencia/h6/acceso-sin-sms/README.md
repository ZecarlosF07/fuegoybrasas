# H6 — Revisión de acceso sin SMS

**Fecha:** 11 de octubre de 2026; revisión iniciada el 10/10.  
**Estado:** núcleo automático comprobado; revisión humana de accesibilidad pendiente. **H6 todavía no está aceptado íntegramente.** Programa público pausado.  
**Versión:** árbol sobre `86e156a4215329090b973c0c295fecf889881431`, sin commit/despliegue solicitados; H6 1.4, sistema visual 1.0. [Manifiesto de fuentes](verificacion.json).  
**Referencias:** [Diseño vigente](../../../../diseno-tecnico/16-acceso-a-tarjeta-sin-sms.md), [H6](../../../06-hito-6-fidelizacion.md), [histórico con OTP](../README.md).

## Comportamiento comprobado

- Alta con nombre/contacto/términos, sin SMS ni cuenta Auth del cliente. Cero sellos; misma clave conserva identidad y tarjeta ante concurrencia/reintentos. Teléfono ocupado exige revisión, sin abrir otra tarjeta.
- Cookie privada HttpOnly, clave aleatoria de 256 bits y hash SQL. Enlace/QR por acción expresa; fragmento retirado. Clave inválida conserva acceso válido; segundo enlace en la misma página exige nueva apertura explícita.
- Preferencias/contacto con revisión; colisiones y revisiones antiguas rechazadas. API `private, no-store`; UUID libre no selecciona otra tarjeta. Hash/clave fuera de DTO habituales, recibos y auditoría. Cuatro RPC por clave solo service_role.
- Logout limpia acceso de tarjeta/datos privados de checkout, conserva carrito válido y sesión del personal. No revoca el enlace; pérdida/revocación/rotación asistida siguen en H7/PT-08.
- Personal Auth/MFA AAL2: visita presencial pagada y entregada suma uno. 9/10/11/20 conservan contador/ciclos/premios; canje posterior sin compra, sin sello ni reinicio. Dos empleados producen un único canje.
- Diario antes del envío; fallo de storage no emite POST. Respuestas perdidas de sello/canje se recuperan tras recarga consultando recibo, con el mismo UUID y un único efecto.
- Agotamiento/pausa/suspensión conservan derechos. Incidencia de premio no entregado no restituye automáticamente. Invitado continúa ante fallo de preferencias.

## Entornos y Docker

Windows, Node 22.16.0, Yarn 1.22.22, Next 16.3.8 y Docker Engine 26.1.4. `yarn dev/build/start` usan remoto **geazxsvjkqpzbghlywbw**. SQL/integración/navegador y fixtures usan exclusivamente loopback, protegido por guardas. Contextos de Chrome representan sesiones distintas; no son teléfonos físicos.

Docker fallaba al retirar `userAnalyticsOtlpHttp.sock`. Se cerraron procesos de su instalación, se respaldaron directorios de sockets como `run.h6-backup-20261011` y `run.h6-backup-20261011-02` bajo `%LOCALAPPDATA%/Docker/` y se recreó `run`. No se borraron imágenes/volúmenes/datos. El motor respondió; arranque/reset fueron explícitamente locales. Un rechazo temporal de aprobación por límite de uso se informó; el reintento posterior fue aprobado.

## Resultados reales

| Comprobación | Resultado |
| --- | --- |
| `yarn db:start` / `yarn db:reset` | Aprobados; quince migraciones y carga inicial reconstruidas localmente. |
| `yarn test:db` | **110 aprobadas, siete archivos**, incluidas once pgTAP nuevas de clave/grants y regresión H2–H6. |
| `yarn test:integration` | **90 aprobadas, doce archivos**. Dieciocho del núcleo usan clientes por clave sin Auth; cinco específicas de acceso y tres de compatibilidad Auth separadas. Conexiones distintas para concurrencia. |
| `yarn test` | **109 aprobadas, veintidós archivos**, incluyendo segundo enlace en StrictMode y verificación final del botón compartido. |
| `yarn test:e2e` | **40 aprobadas en 2,5 minutos**, ocho H6 y regresión H1–H5, incluido envío bloqueado sin JavaScript. |
| `yarn lint` / `yarn typecheck` | Aprobados; lint final de formularios en 96,59 s. Build también comprueba TypeScript. |
| `yarn build` | Aprobado con remoto tras todos los ajustes; 15,76 s. Compilación manual usa un directorio separado. |
| `yarn test:boundary` | Aprobado: copia aislada rechaza importar `server-only` desde cliente; no copia secretos. |
| `yarn check:secrets` | **41 recursos estáticos** remotos sin claves secretas locales/remotas tras build final. |
| Remoto, solo lectura | **15 migraciones, 18 tablas**, cero clientes/tarjetas/eventos/premios, ningún programa activo, `loyalty_enabled=false`. RPC app_owner/SECURITY DEFINER, anon/authenticated denegados y service_role permitido; esquema privado denegado. [Resultado](remote-check-20261011.json). |
| Revisión humana | **Pendiente**: el propietario respondió «Todavía no hice la revisión». Se cerraron las ventanas y se verificó la limpieza local. [Guía y registro](revision-manual.md). Narrador/zoom siguen sin ejecutar. |

[Verificación documental](comprobacion-documental.json): siete documentos, 173 enlaces locales válidos y bloques de código equilibrados. El único criterio H6 sin marcar es lector de pantalla/zoom real. La salida final de navegador incluyó un diagnóstico `The destination stream closed early` durante el recorrido de cambio de contacto/enlace; ese caso y la suite completa finalizaron aprobados. No se usa ese diagnóstico para declarar validada la revisión humana.

[Migración aplicada](../../../../../supabase/migrations/20261010000000_card_access_without_sms.sql): SHA-256 `5A7E1C7CDE18F6C86C0B517F31FD860B50695C69F3D77C741151FF3399F25344`. Ninguna migración se modificó ni se necesitó otra; correcciones de interfaz/pruebas. No se crearon fixtures/cuentas reales en remoto.

## Defectos y correcciones

1. Expectativa antigua de cliente Auth: se comprueba redirección al acceso del personal y ausencia de ficha privada. Alertas acotadas a `main` para distinguirlas del anunciador de rutas de Next.
2. Segundo enlace conservaba clave anterior y fragmento: listener de `hashchange`, retirada y limpieza del error anterior. Unitario StrictMode y E2E inválida B → válida A prueban sustitución de cookie solo al abrir expresamente.
3. Preparación manual mostró envío nativo GET antes de hidratación. Formularios ahora usan `method="post"`; botón compartido deshabilitado hasta hidratar. Caso real sin JavaScript comprueba que Enter no pone credenciales en URL. Datos sintéticos de preparación fallida limpiados.
4. Next dev bloqueaba recursos de `127.0.0.1`: guía instalada consultada y solo ese hostname añadido a `allowedDevOrigins`, sin comodines ni cambios productivos de autenticación.

La preparación manual en dev quedó esperando hidratación y se interrumpió. Se comprobó el residuo sintético local y se reconstruyó exclusivamente esa base; no se atribuyó limpieza automática al proceso terminado. Preparación manual ahora usa producción en `.test-fixtures/h6-manual-next`, con guía `distDir`, y navegación limitada a treinta segundos. Las fixtures generadas quedan fuera del análisis TypeScript de la aplicación; los tipos propios y las pruebas permanecen incluidos. La revisión humana sigue sin resultado.

La preparación final produjo ambas ventanas correctamente. `yarn eslint next.config.ts playwright.manual.config.ts tests/manual/h6-review.spec.ts --max-warnings=0` aprobó las últimas modificaciones de preparación; build remoto posterior aprobó también TypeScript. El directorio de build manual permanece ignorado por Git y separado de `.next`.

Tras la respuesta del propietario se finalizó la preparación mediante su marcador controlado. `yarn test:manual:h6` terminó con una prueba aprobada en 516,73 s; ese resultado solo acredita preparación y limpieza, sin sumarse a las cuarenta pruebas E2E ni aprobar la revisión humana. Consulta local posterior confirmó `loyalty_enabled=false` y cero clientes, cuentas de personal, usuarios Auth, eventos y premios. Los marcadores temporales se retiraron. Supabase remoto no recibió cambios.

El propietario autorizó después que el agente hiciera la revisión. Una nueva preparación terminó correctamente en 57,57 s, pero Computer Use detuvo la primera inspección al no poder determinar la URL actual de Chrome con suficiente confianza para aplicar sus controles de seguridad. Se cerró y limpió el entorno local. Teclado, Narrador y zoom real no se declaran comprobados por ese intento; se conserva la evidencia automática anterior y la aceptación manual pendiente.

Los intentos fallidos no acreditan aceptación. Repeticiones verifican las causas corregidas. Trazas H6/manual desactivadas; QR/enlace no se capturan. Las capturas históricas conservan su directorio.

## Correspondencia con aceptación

| Requisitos / casos | Evidencia |
| --- | --- |
| H6-RT01–10; CA-23–25; CT-13/14/30–32 | pgTAP h6_card_access; card-access.test, loyalty.test, Actions/sesión unitarios y E2E alta/contacto/enlace. Reconstrucción e inventario dieciocho tablas. |
| H6-RT11–17; CA-26–32; CT-01–06/29 | Integración: entrega, umbrales, replay/UUID/referencia, visitas/canjes concurrentes, costo y locks; E2E atención/configuración/stock. |
| H6-RT18–21; CT-10/11/19/26/28/37 | E2E storage sin POST, pérdidas/recarga de sello/canje; permisos, estado/replay, API no-store y logout con carrito/sesión staff. Unitarias de diario/Actions. |
| Documento 10; CT-24 núcleo | pgTAP/integración: historial inmutable, reconciliación, versiones/premios/incidentes protegidos, baja/restauración sin reactivar. Operación excepcional H7. |
| H6-RT22–23; UX/UI | Axe WCAG 2.2 AA/contraste renderizado y overflow a 360/390/768/1280/320; teclado/foco. Capturas/revisión visual. Narrador/zoom real pendientes. |

## UX/UI y capturas

Se reutilizan UI/UX Pro Max, MASTER y sistema canónico 1.0, sin otra identidad. Consulta `screen reader announcements --domain ux -n 2`: **Screen Reader / Accessibility / All** y **Focusable Error Summary / Forms / Web**, aplicables al orden semántico, resumen enfocado/enlaces y feedback contextual. Consulta anterior `form labels`: etiquetas y carga contextual. `pro-rules` se identificó como nativo; se usó `quick-reference` para web sin trasladar unidades nativas.

[37 capturas nuevas](capturas/): alta, tarjeta vacía, nueve sellos, décimo sello/premio separado, canje/sello inciertos, diario fallido, foco, configuración, agotamiento y pausa. Datos sintéticos; no reemplazan la evidencia OTP. Revisión visual directa de alta móvil y atención de escritorio: jerarquía legible, campos/confirmaciones y premio independiente. Axe no sustituye lector ni prueba QR físico.

Guías instaladas consultadas: Playwright, cookies, Server Actions, Forms, Link y allowedDevOrigins. Componentes propios ≤170 líneas, Tailwind y tipos separados; lint verifica estas reglas.

## Cierre y pendientes

**PT-07:** comprobación automática del acceso privado realizada con SQL/integración/navegador; proveedor SMS retirado del cliente. **H6 sigue pendiente de aceptación manual** hasta registrar Narrador/zoom en la [guía](revision-manual.md), corregir defectos y aprobarla.

PT-06 (costo real), PT-08 (personal/recuperación/revocación/contingencia), PT-11 (condiciones/privacidad/conservación/baja) y PT-13 (canje sin entrega) siguen abiertos. No se habilita fidelización pública, aprueban textos legales ni resuelven excepciones de H7. Teléfonos físicos, QR, conectividad y piloto corresponden a H8.
