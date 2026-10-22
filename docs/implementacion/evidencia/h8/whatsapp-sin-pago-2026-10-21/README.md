# Revisión delegada — pedido sin pago y premio con costo opcional

**Fecha local:** 21/10/2026, America/Lima. Los registros UTC pueden indicar 22/10. **Resultado técnico:** aprobado; publicación y activación se comprueban por separado. Código probado sobre base `6b2b2de` con cambios de DC-23–25 en el árbol de trabajo.

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
