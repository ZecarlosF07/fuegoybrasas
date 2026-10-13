# H8 — Preparación de publicación

**Fecha:** 12/10/2026 (America/Lima). **Estado:** implementación técnica y pruebas locales terminadas; piloto y activación pública pendientes. El repositorio se prepara para importar en Vercel por instrucción del propietario. No se declara un despliegue Vercel ni aceptación operativa antes de comprobarlos.

## Entrega

**Actualización 13/10 — DC-20:** [personal sin CAPTCHA](acceso-personal-sin-captcha.md). Se retira widget/proveedor/tokens y requisito de claves; se conserva contraseña/MFA/permisos/límites. Supabase oficial confirma CAPTCHA deshabilitado. La verificación anterior corresponde a su versión histórica; pruebas de la retirada se registran por separado.

- GitHub/Vercel: configuración de build con Yarn, CI aislado sin claves oficiales, inspección de secretos y validación del destino/versión/origen del despliegue.
- `/api/health` mínimo, cabeceras de seguridad e instrumentación con allowlist sin cuerpos/PII; robots e indexación pausados por defecto.
- 23 migraciones oficiales, 18 tablas; carta con 17 referencias confirmadas, 11 pendientes de contenido y C01 fuera de venta web. Maps confirmado sin tracking.
- Horario 12:00–23:00 lunes–domingo estimado, sin verificar; Efectivo/Yape/Plin en borrador. No activan pedido ni aparecen como datos confirmados.
- Cuenta administrativa inicial creada/auditada sin email; contraseña en archivo privado ignorado y MFA pendiente de configurar por el propietario.
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
| Preflight | [Agregados oficiales](preflight-remoto.json): 18 tablas, 23 migraciones, 17 productos, cero diferencias de saldo, un manager y cero managers con MFA. Resultado **bloqueado** para lanzamiento; no se ignora ni presenta como éxito. |
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

## Bloqueos conservados

1. Importar GitHub en Vercel y configurar Production: origen HTTPS, secretos, callbacks y verificación de SHA/health. Preview no usa el oficial.
2. MFA y operación real del administrador; recuperación de autenticador y personas autorizadas. No se enviaron invitaciones/correos.
3. Confirmar pagos reales y datos comerciales de las once referencias incompletas. Horarios/cargos pueden seguir desconocidos donde el contrato lo permite.
4. Costo real del premio y aprobación de condiciones/aviso/plazos. Precios de S/15 y S/14,90 no resuelven PT-06.
5. Piloto con personal, recepción real por Roberto en WhatsApp, dispositivos físicos, Narrador/zoom real y aceptación del propietario.
6. Plan/custodia/backups productivos, restauración fuera de esta máquina y monitor/alertas con responsables.

Los pendientes no impiden subir el proyecto para importarlo. **H8 no está aceptado integralmente ni se activan pedidos/fidelización por hacer push.**
