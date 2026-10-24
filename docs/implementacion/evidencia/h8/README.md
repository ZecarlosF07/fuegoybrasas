# H8 — Preparación de publicación

**Actualización DC-28, 24/10:** [renovación integral UX/UI](renovacion-ux-ui-2026-10-24/README.md), con marca aprobada y revisión de carta, pedido, tarjeta y paneles. El reporte distingue las pruebas locales de la posterior comprobación del despliegue.

**Estado vigente 22/10 — DC-26:** textos aprobados y programa oficial activado por autorización del propietario. [Evidencia vigente](whatsapp-sin-pago-2026-10-21/README.md). Los reportes fechados anteriores no describen el estado actual de los flags.

**Actualización 21/10 — DC-23–25:** [revisión delegada, pedido sin pago y costo opcional](whatsapp-sin-pago-2026-10-21/README.md). 134 unitarias, 132 DB, 116 integración y 51 E2E aprobadas; migración adicional aplicada al oficial. Se retiran pagos/costo como bloqueos y se separa preparación de pedidos/tarjeta. [Guía de entrega](../../../entrega-al-cliente/README.md).

**Actualización DC-22:** [personal sin MFA](personal-sin-mfa/README.md) sustituye la exigencia de segundo factor. Evidencia previa conserva su fecha; el preflight actual ya no exige ADMINISTRATOR_MFA.

**Actualización 20/10/2026:** [verificación integral y Vercel publicado](verificacion-2026-10-20/README.md). Regresión local 132 unitarias, 132 DB, 113 integración y 50 E2E aprobadas; CI y SHA publicado comprobados. Supabase quedó accesible después de que el propietario lo habilitara y la carta pública responde 200. Piloto, datos comerciales y activación siguen pendientes. Los apartados fechados anteriores conservan su evidencia histórica.

**Fecha del reporte inicial:** 12/10/2026 (America/Lima). **Estado vigente:** versión publicada comprobada técnicamente; aceptación operativa y activación pública pendientes.

## Entrega

**Actualización visual 14/10:** [portada, carta y fotografías referenciales](renovacion-visual/README.md). Dieciséis recursos para diecisiete referencias; fotos propias del panel prioritarias. Build, unitarias y comprobaciones públicas de Chrome registradas por separado, sin activar funciones ni cambiar datos comerciales.

**Actualización 13/10 — DC-20:** [personal sin CAPTCHA](acceso-personal-sin-captcha.md). Se retira widget/proveedor/tokens y requisito de claves; se conserva contraseña/permisos/límites (DC-22 retiró MFA después). Supabase oficial confirma CAPTCHA deshabilitado. La verificación anterior corresponde a su versión histórica; pruebas de la retirada se registran por separado.

- GitHub/Vercel: configuración de build con Yarn, CI aislado sin claves oficiales, inspección de secretos y validación del destino/versión/origen del despliegue.
- `/api/health` mínimo, cabeceras de seguridad e instrumentación con allowlist sin cuerpos/PII; robots e indexación pausados por defecto.
- 23 migraciones oficiales, 18 tablas; carta con 17 referencias confirmadas, 11 pendientes de contenido y C01 fuera de venta web. Maps confirmado sin tracking.
- Horario 12:00–23:00 lunes–domingo estimado, sin verificar; Efectivo/Yape/Plin en borrador. No activan pedido ni aparecen como datos confirmados.
- Cuenta administrativa inicial creada/auditada sin email; contraseña en archivo privado ignorado y acceso con correo y contraseña.
- Ensayo ampliado de respaldo SQL/Auth/MFA/Storage y recuperación separada de bytes con hash; guías de despliegue, operación y piloto.

Decisiones [DC-16–19](../../../diseno-tecnico/18-publicacion-y-operacion-h8.md). Se conservan WhatsApp 982 042 493, diez sellos/Mostrito⅛, compra presencial pagada/entregada, canje posterior y exclusión de baja de clientes. No se activa programa ni se inventa costo del premio.

## Verificación realizada

Windows, Node 22.16, Yarn 1.22.22, Next 16.3.8, CLI Supabase 2.119.0. Solo fixtures locales con guardas de loopback. Desarrollo/build habituales usan el Supabase oficial; ninguna reconstrucción ni identidad sintética se cargó en remoto.

| Comando/comprobación | Resultado |
| --- | --- |
| `yarn db:reset` | 23 migraciones reconstruidas desde cero y seed local; 41,36 s. |
| `yarn test:db` | **132/132**, nueve archivos, incluidas ocho comprobaciones H8. |
| `yarn test:integration` | 112/113 en corrida inicial; una expectativa de horario provisional fue corregida. Catálogo repetido: **20/20**. Los **113 casos distintos / 17 archivos** tienen resultado aprobado; no se afirma una única corrida completa verde de integración. |
| `yarn test --maxWorkers=2` | **122/122**, 27 archivos. Repetición tras refactor del test: salud/telemetría/indexación **8/8**. |
| `yarn test:release` | **5/5**: destino/origen/SHA, preview, claves y fallback de versión. |
| `yarn test:e2e` | **50/50 en una ejecución completa**, 3,3 min / 213,86 s incluyendo build. Chrome local, seis proyectos con dependencias. |
| Lint / tipos | Lint completo aprobado. Typecheck aprobado; los builds posteriores comprueban también tipos finales. |
| `yarn build` | Build remoto final aprobado, 15,21 s; tipos obtenidos del oficial con `yarn db:types`. |
| `yarn test:boundary` | Rechazo real de importación `server-only` en cliente; 40,40 s. |
| `yarn check:secrets` | 46 recursos estáticos sin claves privadas configuradas locales/remotas. No es auditoría universal. |
| Migración remota | Historial y dry-run comprobados; única migración H8 aplicada por CLI, flags conservados false. |
| Preflight | [Agregados oficiales](preflight-remoto.json): 18 tablas, 24 migraciones y manager activo. DC-22 elimina requisito MFA; configuración preparada, lanzamiento pendiente de pagos, costo, textos y piloto. |
| Respaldo | [Resultado](restauracion.json): metadata/MFA recuperados y hash de bytes coincidente, 2557 ms en fixture pequeño. |

Los dos fallos encontrados se corrigieron: expectativas de catálogo anteriores a las confirmaciones del propietario y tipado explícito `Promise<never>` en helper que siempre lanza error. La advertencia Edge de instrumentación se resolvió usando Web Crypto. Lint eliminó callbacks anidados en las pruebas nuevas. Se repitieron las comprobaciones afectadas; no hubo fallo de precio, permiso, sello o canje.

Docker falló al iniciar por su socket OTel obsoleto. Se apartó `Docker/run` en respaldo, sin borrar volúmenes ni restaurar valores de fábrica; después respondió y permitió reconstrucción/pruebas. Esto no es un paso habitual para desarrollar con remoto.

## Evidencia y aceptación

[Matriz RF/CA/CT](matriz-aceptacion.md), [revisión UI](revision-ui.md), [despliegue](despliegue.md), [operación](operacion.md), [piloto pendiente](piloto-y-aceptacion.md). Capturas nuevas de H1–H7 se agrupan en [capturas](capturas/), sin sustituir los reportes históricos. Playwright traces con credenciales/QR se desactivan en recorridos privados.

La guía general y H8 se actualizan con este estado. CI está escrito pero su ejecución en GitHub se comprueba después del push. El commit de publicación identifica la versión; el [reporte de contenido](verificacion.json) registra hashes sin secretos. Escribir configuración no demuestra importación, ejecución CI o despliegue Vercel.

La corrida cargó las rutas anteriores de capturas H2/H4 antes de ajustar esos dos tests: actualizó esas imágenes y se copiaron sus 18 resultados al directorio H8. Los reportes Markdown históricos y capturas H6 sin SMS se conservan; futuras corridas usan el helper común para todos los hitos. No se afirma conservar intactas las imágenes históricas H2/H4.

### Comprobación posterior en GitHub/Vercel

El proyecto se subió a GitHub (`master`, base de publicación `c8e8c42`). La [primera ejecución CI](https://github.com/ZecarlosF07/fuegoybrasas/actions/runs/38327781166) terminó con un fallo de integración: `management-exceptions.test.ts:110` comparaba en JavaScript timestamps PostgreSQL que diferían en microsegundos pero coincidían al truncarlos a milisegundos. Se conserva la comparación estricta, trasladándola a PostgreSQL; seis casos del archivo aprobados en la repetición local. No se modificó lógica de negocio ni SQL de la aplicación. La siguiente ejecución remota aún debe confirmar el resultado completo.

Vercel reportó por separado Yarn global 1.22.19 frente al engine 1.22.22. [Corepack y verificación de comandos](despliegue.md) corrigen ese problema; instalación y build locales aprobados sin alterar el lockfile. Push no implica que Vercel haya terminado correctamente: URL/variables y servicios reales siguen pendientes.

## Seguimiento operativo vigente

1. Mantener la disponibilidad del Supabase oficial y revisar la operación del hosting. Importación en Vercel, HTTPS, SHA, catálogo e imágenes quedaron comprobados el 20/10; Preview conserva su prohibición de usar el oficial.
2. Operación real del administrador, recuperación de contraseña y personas autorizadas. No se enviaron invitaciones/correos.
3. Completar las once referencias comerciales aún en borrador y horarios/cargos cuando se conozcan. No hay selección de pago en el pedido ni dependencia de medios de pago.
4. Condiciones/aviso aprobados por DC-26. Costo interno opcional y desconocido; definir después los plazos/procedimientos aún pendientes en el aviso, sin inventarlos.
5. Piloto con personal, recepción real por Roberto en WhatsApp, dispositivos físicos, Narrador/zoom real y aceptación del propietario.
6. Plan/custodia/backups productivos, restauración fuera de esta máquina y monitor/alertas con responsables.

La revisión técnica fue delegada y la activación fue autorizada expresamente; no se infiere del push. Los controles humanos/operativos listados no se presentan como ejecutados ni como una aceptación integral del piloto presencial.
