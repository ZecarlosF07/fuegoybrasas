# Revisión delegada — pedido sin pago y premio con costo opcional

**Revisión inicial:** 21/10/2026. **Activación y comprobación final:** 22/10/2026 (America/Lima). La evidencia UTC conserva su hora. El reporte inicial corresponde a DC-23–25; DC-26 registra la aprobación posterior.

## Alcance entregado

- Pedido invitado sin medio de pago, instrucciones de pago ni vuelto; conserva carrito, nombre, modalidad, indicaciones y coordinación por WhatsApp.
- Sin bloqueo por pagos no configurados. La administración conserva zonas/cargos y retira controles de pago; el historial de la tabla anterior permanece protegido.
- Costo del premio opcional en interfaz, contrato, activación y canje. Desconocido permanece `NULL`; no se usa precio de carta ni cero supuesto. Los canjes anteriores mantienen su snapshot.
- Diez sellos por Mostrito de ⅛, sin SMS, roles y procedimientos de H7 conservados.
- [Guía para el cliente](../../../../entrega-al-cliente/README.md) y [diseño vigente](../../../../diseno-tecnico/20-pedido-whatsapp-y-costo-opcional.md).

## Comprobaciones ejecutadas

Windows, Node 22.16, Yarn 1.22.22, Next.js 16.3.8, Supabase CLI 2.119.0 y Chrome. Solo las pruebas aisladas usan Docker. No hay identidades sintéticas ni reset en Supabase oficial.

| Comprobación | Resultado |
| --- | --- |
| Reconstrucción local | **25 migraciones** y seed desde cero; 41,69 s. |
| `yarn test --maxWorkers=2` | **134/134**, 29 archivos; 59,75 s. |
| `yarn test:db` | **132/132**, nueve archivos sobre reconstrucción limpia; 4,01 s. |
| `yarn test:integration` | **116/116**, 18 archivos en una ejecución limpia completa; 38,49 s. |
| Build local + `yarn playwright test` | Build y tipos aprobados; **51/51 recorridos**, 199,30 s para la ejecución de navegador. |
| `yarn test:release` | **8/8**, incluyendo preparación independiente de pedidos y tarjeta. |
| `yarn lint` | Aprobado; revisión final 37,27 s. |
| `yarn typecheck` | Aprobado; 20,77 s. El build final vuelve a verificar tipos oficiales. |
| `yarn build` con perfil de producción | Aprobado, TypeScript y fuentes locales; 24,31 s. |
| Secretos de cliente | 36 recursos estáticos sin las credenciales privadas configuradas. |
| Secretos del repositorio | 1190 archivos candidatos sin credenciales configuradas ni archivos privados versionados, antes de redactar este resumen. |

La integración comprueba activación omitiendo costo, alta, diez sellos y canje con costo nulo, actualización posterior sin reescribir historia, permisos e importes inválidos. El navegador deja el costo vacío desde el panel y continúa el recorrido completo de tarjeta y atención. El pedido se prepara sin seleccionar pago y su mensaje no contiene pago/vuelto; la API rechaza campos retirados.

La nueva migración se [aplicó al oficial](migracion-oficial.json) por CLI, tras revisar destino, historial y dry-run. No activa funciones automáticamente ni modifica tarjetas existentes. Los tipos finales se regeneraron desde el remoto; no se editaron manualmente.

## UX/UI y fallos encontrados

Se aplicaron `ui-ux-pro-max`, sistema visual canónico y guías instaladas de Next.js para formularios y Playwright. Consulta puntual `optional fields checkout --domain ux`: se conservan etiquetas e indicación explícita de campos opcionales, sin adoptar otra identidad visual.

Las pruebas recorren 320, 360, 390, 768 y 1280 px, teclado/foco, errores, recarga, reintentos y axe. Se inspeccionaron [datos del pedido sin pago](capturas/h5/capturas/datos-390.png) y [costo vacío en administración](capturas/h6/acceso-sin-sms/capturas/programa-costo-opcional.png). Las capturas y usuarios son sintéticos locales. No se presentan como Narrador, zoom real o dispositivos físicos.

Dos ejecuciones de integración anteriores detectaron una expectativa antigua sobre pagos y el residuo que dejó al fallar. Se corrigió la expectativa, se amplió la limpieza del test, se reconstruyó local y se obtuvo la ejecución completa aprobada. Los reportes de restauración ahora usan un directorio por ejecución; el histórico se conservó.

El primer intento E2E compiló, pero Windows denegó el puerto 3100: estaba dentro de su rango reservado 3077–3176. No se cambiaron exclusiones ni firewall. El origen de pruebas se centralizó en `tests/e2e/environment.ts` con puerto **13100**, escucha de loopback y callback permitido solo en Supabase local. Se reiniciaron los contenedores conservando volúmenes y aprobaron los 51 casos. Esto no modifica URLs Auth oficiales.

El ensayo de [restauración local](restauracion.json) recuperó Auth, metadatos y bytes Storage con hash coincidente en 2548 ms. Sus límites están en el JSON; no acredita custodia externa o restauración productiva.

## Publicación y alcance de aceptación

El [preflight](preflight-remoto.json) confirma 18 tablas y 25 migraciones. Pedidos está preparado sin pagos/costo; los documentos de fidelización se evalúan aparte. La migración no habilitó funciones por sí sola. El estado posterior de publicación y activación debe registrarse al comprobarlo, sin inferirlo del build.

La revisión técnica delegada está ejecutada. Quedan fuera de su evidencia recepción real de un mensaje en el teléfono del local, entrenamiento de otra persona, revisión física/Narrador, decisiones de privacidad y contratación/custodia de respaldos. No se enviaron mensajes por WhatsApp, se inventaron aprobaciones del negocio ni se activó fidelización a partir del costo opcional.

## Activación autorizada y publicación del 22/10

El propietario aprobó condiciones y aviso de datos el 21/10 y autorizó habilitar la tarjeta ([DC-26](../../../../diseno-tecnico/21-aprobacion-y-activacion-tarjeta.md)). La aprobación queda versionada con hashes de los textos, sin depender de las dos variables antiguas del hosting. No se modificaron los textos aprobados ni se asignaron plazos inventados.

- [Pedido oficial](activacion-pedidos.json): habilitado mediante `update_business_config` con autorización, revisión, recibo y auditoría. [Recorrido publicado](vercel-pedido.json) de formulario/mensaje en 390/1280 px, sin pago/vuelto ni envío real de WhatsApp.
- [Tarjeta oficial](activacion-tarjeta.json): programa activo mediante RPC administrativa, diez sellos por Mostrito de ⅛, costo `NULL` y disponibilidad inicial basada en la carta publicada. Cada canje conserva confirmación de cocina. Cero altas sintéticas, sellos o canjes oficiales durante la comprobación.
- [Verificación pública](vercel-tarjeta.json): Vercel sirve `f2c542a7ee258a39f34bca2bb6574096cd6a3e0c`; formulario habilitado sin SMS, términos/privacidad 200 y sin aviso de propuesta. Consulta privada anónima 401; ninguna mutación de prueba.
- Reflujo en 320, 360, 390, 768 y 1280 px: sin desbordamiento y cero infracciones axe. [Captura móvil](vercel-tarjeta-390.png), inspeccionada visualmente; no acredita un dispositivo físico.
- [Preflight actual](preflight-remoto.json): `ready=true`, pedidos y tarjeta preparados, 18 tablas, 25 migraciones, ningún balance inconsistente. La aprobación corresponde al propietario; el comando de lectura no la produce.

Verificación adicional de DC-26: `yarn test:release` **9/9**; pruebas afectadas de acceso/alta **11/11**; lint aprobado (115,45 s), build con tipos oficiales aprobado (44,62 s), 36 recursos estáticos sin secretos y 1203 archivos candidatos sin credenciales versionadas antes de añadir estas últimas capturas. Un intento de prueba bajo el temporal restringido no pudo cargar un módulo; repetido fuera de esa restricción, los once casos aprobaron.

La ejecución CI de `d25af1d` terminó con 32 E2E aprobados, un fallo y 18 dependientes sin ejecutar: axe consultó el título durante la redirección SSR, antes de que Next instalara los metadatos. La corrección exige y espera un título válido antes del análisis; no excluye reglas de accesibilidad ni introduce pausas fijas. Se consultó `ui-ux-pro-max` (Metadata / Next.js) y la guía instalada de metadatos; se conservó la metadata existente. El resultado posterior de GitHub se conserva en [registro CI](github-ci.json).

**Alcance de entrega:** revisión técnica delegada y activación expresamente autorizada. Permanecen sin atribuir ejecución la recepción real de WhatsApp, capacitación de otra persona, Narrador/zoom real, móviles físicos y custodia externa de respaldos. La tarjeta y pedidos están habilitados; esos límites no se ocultan ni se presentan como un piloto presencial realizado.

Estado de CI al cerrar este registro: la [ejecución de DC-26](https://github.com/ZecarlosF07/fuegoybrasas/actions/runs/39874581239) aprobó instalación, verificación de secretos, release, migraciones locales, lint, tipos, unitarias, DB e integración. Sigue preparando Chrome para E2E; no se registra como verde ni se atribuyen los pasos pendientes como ejecutados. La activación y la comprobación directa de Vercel ya terminaron correctamente.
