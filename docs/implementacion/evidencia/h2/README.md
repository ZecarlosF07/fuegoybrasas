# H2 — Evidencia de implementación

**Revisión:** 8 de octubre de 2026.  
**Estado:** base técnica implementada con verificación automática aprobada; aceptación manual del equipo y preparación del personal real pendientes.  
**Referencia:** [Hito 2](../../02-hito-2-acceso-del-personal.md), [guía](../../hitos-del-proyecto.md), [operación y preparación](operacion.md).  
**Versión verificable:** cambios de trabajo sobre `86e156a4215329090b973c0c295fecf889881431`, sin commit solicitado. Las evidencias identifican el árbol de trabajo y esta fecha; no representan una versión publicada.

## Resultado implementado

- Cuatro tablas con RLS/grants: personal con soft delete, configuración singleton, recibos y auditoría inmutables. Dos migraciones H2 después de la fundación H1.
- RPC de acceso propio, rol/MFA, configuración, cambio de acceso, baja/restauración y recuperación de operación. Identidad desde JWT, sin rol editable en metadata. Protección del último responsable con bloqueo global.
- Acceso por correo/contraseña, enrolamiento y verificación TOTP, logout, recuperación/invitación con destinos fijos y permiso de restablecimiento firmado. La recuperación ordinaria respeta el factor existente y no reautoriza bajas.
- Seis páginas del alcance y callback `/auth/confirm`. Grupos de acceso fuera de layouts protegidos. La home pública sigue siendo la base de H1; carta y fidelización llegan en sus hitos.
- Configuración por responsable con revisión, horarios, ubicación y cargos en borrador/confirmados. Pedidos y fidelización permanecen apagados. Conflictos conservan la edición; incertidumbre conserva UUID y diario mínimo sin PII.
- Validación de dominio compartida, DAL exclusivo del servidor, secretos aislados, tipos generados, componentes Tailwind menores de 170 líneas y acciones con espera contextual/barrera inmediata.

## Entorno y comprobaciones

Windows, Node 22.16.0, Yarn 1.22.22, Next 16.3.8, React 19.2.8, TypeScript 5.9.3, SDK Supabase JS 2.117.2 / SSR 0.12.7, CLI 2.119.0, PostgreSQL 17.11 en Docker Linux. Chrome se ejecutó sin ventana contra un build de producción local en el puerto 3100. Identidades sintéticas temporales; no personal real.

| Comprobación | Resultado y evidencia |
| --- | --- |
| Reconstrucción | `yarn db:reset` aplicó H1 y las dos migraciones H2 desde cero. `yarn db:types` regeneró `Database` desde ambos esquemas reales. |
| Lint, tipos y build | `yarn verify` aprobado: ESLint sin avisos, TypeScript estricto, build con Proxy y las rutas del alcance. |
| Unitarias/componentes | 34 aprobadas, incluyendo firma/identidad/caducidad de recuperación, horarios entre días/semanas, validación y primitivas asíncronas de H1. |
| PostgreSQL | 23 pgTAP aprobadas: cuatro tablas, RLS, grants, bridge privado, singleton y flags seguros; incluye las nueve comprobaciones H1. |
| Integración | 19 aprobadas con Auth/PostgreSQL local reales. Bootstrap auditado, registro público bloqueado, TOTP AAL1→AAL2, denegaciones, soft delete/restauración, historial inmutable, idempotencia concurrente, aislamiento de recibos, revocación y carrera de responsables. La comprobación final mantiene un JWT Auth AAL2 válido, desactiva su cuenta sintética y observa `FORBIDDEN` en acceso/configuración aunque `getUser` siga válido. |
| Petición en curso | Integración mantiene el advisory lock, demuestra espera real por `pg_stat_activity`, observa `not_found` mientras sigue en curso y recupera/repite el mismo UUID con un efecto. |
| Correo local | Recuperación enviada a Mailpit y plantilla real con `token_hash`, tipo y callback fijo comprobados, sin publicar el cuerpo. No prueba SMTP productivo. |
| Navegador | 15 aprobadas (nueve H1, seis H2): acceso, MFA, configuración/conflicto/logout, respuesta perdida tras commit y recuperación por UUID sin PII en diario, recuperación con factor conservado, invitación válida, callback inválido/libre, usuario ajeno y atención sin administración. |
| Frontera servidor/cliente | `yarn test:boundary` exige y obtuvo rechazo de una importación `server-only` en un Client Component con Next build real. |
| Secretos | `yarn check:secrets`: 29 recursos estáticos sin claves locales/remotas, secreto de recuperación ni URL PostgreSQL local. No se muestran valores. |
| HTTP y documentación | Producción local: acceso HTTP 200 y callback inválido 307, ambos `Cache-Control: no-store, private` y `Referrer-Policy: no-referrer`. Diez documentos con enlaces locales válidos; componentes propios dentro del límite de 170 líneas; `git diff --check` sin errores. Next dev puede reemplazar Cache-Control por no-cache; la comprobación de privacidad se hizo sobre el build de producción. |

Los intentos iniciales fallidos se corrigieron antes de la entrega: proveedor email local deshabilitado por el flag del CLI, selector de error ambiguo por el anunciador de rutas de Next y cambio de contraseña AAL1 rechazado por Auth con MFA existente. Las pruebas finales sustituyen esos resultados; no se redujeron las protecciones para hacerlas pasar.

## UX/UI y revisión visual

Se leyó `ui-ux-pro-max`, MASTER y el sistema canónico. Consultas aplicadas: `accessible authentication password otp` (labels, pegado, gestores, visibilidad), `error summary validation` (resumen enfocable/enlaces tras envío) y stack Next `authentication server actions cookies` (validación y cookies del servidor). Se descartaron otras modalidades de acceso y sugerencias de caché que contradicen el diseño privado no-store.

Capturas sin credenciales en [capturas](capturas/): acceso 360/390/768/1280 px y reflujo 320, error de campos vacíos, configuración sintética, recuperación MFA sin QR y denegación. Se inspeccionaron visualmente acceso móvil y configuración de escritorio; la revisión detectó feedback de conflicto que permanecía tras recargar y se corrigió. E2E comprueba ausencia de desbordamiento y axe en acceso/recuperación. La cobertura de teclado y reflujo de H1 permanece aprobada.

**Pendiente de aceptación manual:** lector de pantalla real, zoom real del navegador en las nuevas pantallas, todos los estados privados en cada ancho, proveedor CAPTCHA real y revisión con quienes atenderán. Axe y viewports no equivalen a esas comprobaciones. No se guardan trazas de los tests con credenciales, OTP, QR ni enlaces de recuperación.

## Migraciones remotas

Proyecto autorizado `geazxsvjkqpzbghlywbw`. Historial previo: H1. Dry-run anunció únicamente `20261007000000_staff_foundation.sql` y `20261007001000_staff_operations.sql`; ambas se aplicaron con CLI sin reparar historia ni hacer reset remoto. La comprobación posterior usa [h2-readonly.sql](../../../../supabase/checks/h2-readonly.sql), sin PII.

Lectura remota posterior: las tres versiones figuran en el historial; las cuatro tablas pertenecen a `app_owner` y tienen RLS. Denegación de acceso directo/esquema privado/funciones anónimas y puente no público: `true`. Flags pausados: `true`. Managers activos: `0` (no se creó personal real).

La aplicación web no se ha desplegado. El bootstrap ejecutado es sintético local. No se activaron pedidos/fidelización ni se provisionó personal real. Auth remoto, SMTP/CAPTCHA, dominio definitivo y PT-08 requieren preparación indicada en [operación](operacion.md).

## Ajuste del entorno predeterminado — 8 de octubre

Por instrucción del propietario, `yarn dev`, `yarn build`, `yarn start` y `yarn db:types` utilizan el proyecto remoto autorizado. Docker y `.env.local` se reservan para pruebas aisladas explícitas. El launcher rechaza un destino distinto antes de iniciar Next, excluye la conexión PostgreSQL local del proceso y admite variables del hosting sin archivo de secretos. E2E utiliza `build:local`/`start:local` y rechaza una URL Auth remota; las fixtures verifican también ese destino antes de crear cuentas.

Comprobaciones de este ajuste: historial y consulta remotos reconfirman las tres migraciones/cuatro tablas; `yarn verify` aprobado con 34 pruebas y build remoto; tipos regenerados desde el remoto y TypeScript aprobado; configuración Playwright enumera 15 casos. Los dos intentos con destinos incorrectos fueron rechazados antes de iniciar Next o E2E. `/personal/acceso` responde HTTP 200 con el comando habitual; 29 recursos del build sin secretos configurados.

No se repitió la suite completa de integración/E2E para este ajuste. Un intento adicional de los ocho casos de permisos locales no pudo preparar las identidades: Auth local respondió 401 `no_authorization` al comprobar la credencial administrativa. Las pruebas quedaron sin ejecutar; no cambia los resultados anteriores, no verifica permisos nuevamente y queda pendiente revisar esa credencial si se retoman pruebas locales. No se alteraron credenciales ni datos remotos para resolverlo.

## Condiciones para el equipo

La base ordinaria permite preparar H3 y reutilizar permisos/transacciones en H4–H7. Mantener pendientes de aceptación integral en el documento del hito: lector/zoom/piloto, alta autorizada de personas reales y correo/CAPTCHA productivos. PT-11 no se resuelve con limpieza de fixtures; PT-13 permanece pendiente para canjes. La gestión completa de personal y recuperación excepcional sigue en H7.
