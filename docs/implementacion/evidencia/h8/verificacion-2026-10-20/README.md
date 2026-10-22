# Verificación de H8 — 20 de octubre de 2026

**Resultado:** regresión local aprobada y versión publicada comprobada. **H8 conserva pendientes de aceptación operativa y activación.** Fecha local America/Lima; los JSON usan UTC y por eso registran el 21 de octubre.

**Código verificado:** `6b2b2de06c08c9f483dd7a27e84e9fbf35fa213a`. Node 22.16, Yarn 1.22.22, Next.js 16.3.8, Supabase CLI 2.119.0 y Chrome en Windows. No se cambió código de la aplicación ni se aplicaron migraciones durante esta revisión.

## Regresión aislada

Las fixtures y reconstrucciones se ejecutaron exclusivamente contra Supabase local `127.0.0.1:54321`; los comandos habituales y la compilación final conservan el proyecto remoto autorizado. Las capturas nuevas se guardan en [capturas](capturas/), sin sustituir las históricas.

[Registro de comandos ejecutados](verificacion-tecnica.json).

| Comprobación | Resultado real |
| --- | --- |
| `yarn db:start` | Motor Docker disponible; servicios locales iniciados. |
| `yarn db:reset` | Las 24 migraciones y seed reconstruidos; 52,77 s. |
| `yarn lint` | Aprobado sin advertencias; 99,95 s. |
| `yarn test --maxWorkers=2` | **132/132**, 29 archivos; 82,16 s. |
| `yarn test:db` | **132/132**, nueve archivos; 4,48 s. |
| `yarn test:integration` | **113/113**, 17 archivos en una ejecución completa; 36,62 s. |
| `yarn test:e2e` | **50/50** en una ejecución completa, incluyendo build con TypeScript; 226,13 s. |
| `yarn test:release` | **5/5** validaciones de configuración y versión. |
| `yarn build` con perfil de producción | Aprobado con TypeScript y fuentes locales; 34,06 s. |
| `yarn test:boundary` | Next.js rechaza infraestructura `server-only` desde un componente cliente en una copia aislada; 59,41 s. |
| `yarn check:secrets` | 36 recursos estáticos sin las claves privadas configuradas. |
| `yarn check:repository-secrets` | Comprobación final: 1063 archivos candidatos sin credenciales configuradas ni archivos privados versionados. No constituye una auditoría universal. |

Los recorridos completos comprueban catálogo/edición/soft delete, pedido invitado, borrador y WhatsApp simulado, alta de tarjeta sin SMS, permisos de atención/administración, sellos, canjes, correcciones, recuperación y restitución de premios. La simulación de WhatsApp no acredita recepción real por Roberto. El segundo contexto de Chrome no acredita otro dispositivo físico.

El ensayo de [restauración local](restauracion-local.json) recuperó identidad Auth, metadatos y bytes Storage con SHA-256 coincidente en 2445 ms. Utiliza el mismo clúster y recursos sintéticos; no acredita respaldo productivo, custodia externa ni RPO/RTO reales. El test escribió inicialmente en su ruta histórica fija: se conservó el resultado nuevo aquí y se repuso exactamente la evidencia anterior desde Git.

## Publicación y datos remotos

- [GitHub Actions](https://github.com/ZecarlosF07/fuegoybrasas/actions/runs/38518940751) terminó con `success` para el mismo SHA. [Consulta registrada](github-ci.json).
- [Vercel](https://fuegoybrasas.vercel.app) devuelve el SHA esperado en `/api/health`. La salud acredita proceso/configuración; el catálogo se comprobó por separado.
- [HTTP final](http-produccion-restablecido.json): inicio y catálogo 200; páginas públicas 200; rutas privadas redirigen al acceso; tarjeta sin sesión 401 con caché privada deshabilitada; ruta inexistente 404. Cabeceras de seguridad presentes y `X-Powered-By` ausente. Robots mantiene `Disallow: /`.
- [Preflight oficial](preflight-remoto.json): **18 tablas, 24 migraciones, 17 productos publicados, un administrador activo y cero diferencias entre saldos y eventos**. Ubicación verificada; 11 productos siguen en borrador, horario sin confirmar y ningún pago confirmado.
- Pedidos y fidelización siguen apagados. `configurationProblems` está vacío; `ready=false` por `PAYMENTS`, `REWARD_COST` y `LOYALTY_DOCUMENTS`. El comando de lanzamiento termina deliberadamente con código no cero cuando faltan condiciones comerciales; no es un error de compilación.

### Incidencia remota resuelta durante la revisión

La [primera consulta](http-produccion.json) encontró catálogo 503. El [diagnóstico](diagnostico-supabase.json) obtuvo `ENOTFOUND` y `NXDOMAIN` con dos resolutores independientes; el CLI no listaba el proyecto y su consulta devolvía 403. El propietario indicó que lo habilitó. Después, RPC pública y Vercel devolvieron 200 con 17 productos, y el CLI recuperó acceso. No se sustituyeron claves ni se cambió el destino remoto.

Se conserva la evidencia inicial para explicar la interrupción; **el resultado vigente es el de las consultas posteriores al restablecimiento**. No se afirma que una respuesta 200 del inicio, por sí sola, demuestre disponibilidad de la carta.

## UX/UI y fotografías en Vercel

Se aplicaron `ui-ux-pro-max`, [reglas UX/UI](../../../../../.agents/rules/ux-ui.md), [sistema canónico](../../../../../.agents/brand/sistema-visual.md) y MASTER. La consulta puntual `focus not obscured --domain ux` se usó para revisar foco visible; se conserva la exigencia del proyecto de foco completamente despejado sin atribuir certificación AAA.

La [revisión de la carta publicada](catalogo-activo/verificacion-navegador.json) comprobó **320, 360, 390, 768 y 1280 px**: 17 tarjetas y 21 imágenes cargadas por tamaño, sin desbordamiento de página ni de portada y **cero violaciones axe** en los tags WCAG seleccionados. Verificó fuentes locales, salto al contenido, filtro de alitas, detalle y regreso conservando categoría. Una imagen fallida interceptada solo en Chrome conserva precio y muestra el error correspondiente.

Se inspeccionaron las capturas de [móvil](catalogo-activo/inicio-390.png) y [escritorio](catalogo-activo/inicio-1280.png). Las imágenes generadas mantienen «Imagen referencial»; no se presentan como fotografías reales ni prueba de porciones. Los 16 WebP publicados respondieron 200. El helper inicial trataba incorrectamente HTTP 304 como fallo; se ajustó solo la herramienta de comprobación para admitir revalidación de caché, manteniendo la verificación de carga mediante `naturalWidth`.

También se revisaron tres páginas públicas en cinco tamaños mientras Supabase estaba inaccesible: [estado de error y accesos](navegador-produccion.json), sin errores JavaScript ni violaciones axe. Estas comprobaciones no sustituían la carta; la revisión posterior ya acredita el catálogo restablecido.

## Condiciones que siguen pendientes

| Pendiente | Quién debe completarlo / evidencia necesaria |
| --- | --- |
| Medios de pago reales | Propietario confirma los disponibles; administrador registra y verifica los datos comerciales. |
| Costo real del Mostrito de premio | Propietario calcula ingredientes, acompañamientos y empaque. El precio de carta no es ese costo. |
| Condiciones, privacidad y conservación | Responsable aprueba los textos y plazos antes de habilitar fidelización; no se marca aprobación automáticamente. |
| Piloto y accesibilidad humana | Personal/propietario prueban dispositivos físicos, lectura con Narrador, zoom real, atención, canjes y recepción de WhatsApp por Roberto. |
| Recuperación real del personal | Comprobar canal de recuperación/invitaciones si se utilizará; Mailpit local no demuestra recepción de correo real. |
| Respaldos y monitoreo productivos | Definir responsables, custodia externa y alertas; comprobar restauración en entorno separado según el servicio disponible. |

La [guía de piloto](../piloto-y-aceptacion.md) conserva sus casillas pendientes. Esta revisión permite continuar con el piloto de H8; **no declara H8 aceptado integralmente ni crea un H9**. No se enviaron mensajes reales, crearon identidades sintéticas en remoto ni activaron pedidos/fidelización.
