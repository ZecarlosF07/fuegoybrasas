# H1 — Evidencia de implementación y verificación

**Fecha de revisión:** 7 de octubre de 2026.  
**Estado:** base técnica y visual implementada; verificaciones automáticas aprobadas. Aceptación manual del equipo pendiente.  
**Alcance:** [Hito 1](../../01-hito-1-preparacion-del-proyecto.md), sin adelantar funcionalidades de H2–H8.

## 1. Versión y entorno revisados

Las pruebas corresponden al árbol de trabajo de `C:/Proyectos/polleria-parcona`. Su commit base es `86e156a4215329090b973c0c295fecf889881431`; los cambios de esta entrega **todavía no tienen commit**. Ese SHA identifica el punto de partida, no una revisión que contenga H1. Registrar el commit de entrega cuando el equipo incorpore los archivos al control de versiones.

Implementación y aplicación inicial de la migración: 4 de octubre. Verificación final y capturas: 7 de octubre. Entorno Windows, PowerShell, contenedores Linux de Docker Desktop y datos sintéticos locales; zona comercial prevista `America/Lima`.

| Herramienta | Versión utilizada |
| --- | --- |
| Node / Yarn | 22.16.0 / 1.22.22 |
| Next.js / React | 16.3.8 / 19.2.8 |
| TypeScript / Tailwind | 5.9.3 / 4.3.3 |
| Supabase JS / SSR / CLI | 2.117.2 / 0.12.7 / 2.119.0 |
| Docker Desktop / motor / PostgreSQL local | 4.31.1 / 26.1.4 / 17.11 |
| Vitest / Playwright | 5.0.3 / 1.63.0 |
| Chrome de las pruebas | 154.0.8037.95 |

## 2. Entrega concreta

- [Reglas de código](../../../../.agents/rules/codigo.md) integradas en las lecturas de [AGENTS.md](../../../../AGENTS.md): Yarn, Tailwind, tipos separados, componentes pequeños, funciones con poca anidación y separación por dominio. Las [reglas UX/UI](../../../../.agents/rules/ux-ui.md) incorporan carga contextual, prevención de dobles ejecuciones y errores explícitos.
- [Manifiesto](../../../../package.json), `yarn.lock` y runtime fijados. Lint comprueba límites de componentes, anidación, tipos separados, orden de imports y ciclos; TypeScript conserva modo estricto y alias `@/*`.
- Configuración validada en [env](../../../../src/lib/env/schemas.ts); clientes público, SSR por petición, Auth de navegador y administración de Auth aislados en [Supabase](../../../../src/lib/supabase/server.ts). Secretos protegidos con `server-only`.
- [Proxy](../../../../src/proxy.ts) para contextos de identidad y privados, con renovación mediante cookies y respuesta segura ante fallos. La página pública no depende de consultar Auth. Proxy todavía no concede roles ni reemplaza las autorizaciones de H2.
- [Contratos](../../../../src/contracts/types/result.ts), códigos de error, validaciones y [dinero en céntimos](../../../../src/lib/money/utils.ts). Importes desconocidos permanecen desconocidos; no se inventan entidades futuras en los tipos generados.
- [Página base](../../../../src/features/foundation/components/foundation-page.tsx) en español y [primitivas compartidas](../../../../src/components/ui/button.tsx), con fuentes de marca, foco, ayudas, mensajes y estados de carga. El nombre textual es el fallback mientras falta el logo original.
- [Instrucciones de operación](../../../../README.md) para instalación, entornos, migraciones, generación de tipos y pruebas. Los estilos usan Tailwind; `globals.css` conserva únicamente las directivas de entrada del compilador.

La página inicial es temporal. H1 no entrega carta comercial, registro/MFA del personal, carrito, salida de pedidos por WhatsApp ni tarjeta de fidelización. Tampoco crea las 18 tablas de negocio. El borrado lógico se incorporará desde la creación de cada tabla editable, conforme al [documento 10](../../../diseno-tecnico/10-tablas-db.md).

## 3. Base de datos y configuración remota

La [migración `20261004000000`](../../../../supabase/migrations/20261004000000_private_schema.sql) crea `app_private` y su propietario `app_owner`: sin login, sin superusuario y sin bypass de RLS. Revoca acceso directo a visitantes, usuarios autenticados y `service_role`; los defaults de objetos futuros corresponden exclusivamente a ese propietario. No modifica tablas ni defaults de los propietarios administrados de Auth/Storage.

La reconstrucción local y la generación de tipos se ejecutaron el 4 de octubre. Los tipos de aplicación están vacíos porque no existen tablas de negocio. Las futuras migraciones privadas deben usar `SET LOCAL ROLE app_owner` dentro de una transacción y definir permisos/RLS antes de habilitar consumidores.

Proyecto remoto autorizado: **`geazxsvjkqpzbghlywbw`**. La migración se aplicó el 4 de octubre después de revisar historial y dry run. El 7 de octubre se comprobó de nuevo, mediante operaciones de solo lectura:

- Historial local y remoto con la misma migración.
- [Consulta de permisos](../../../../supabase/checks/h1-readonly.sql): propietario correcto, roles externos bloqueados, rol sin privilegios administrativos y ejecución de funciones futuras privada.
- Petición Data API a `/rest/v1/__h1_absent__`, con `Accept-Profile: app_private`: rechazo esperado **HTTP 406 / `PGRST106`**. No se crearon objetos ni identidades de prueba en remoto.

`.env.local` contiene el entorno local y `.env.remote.local` el remoto; ambos están ignorados por Git. No se imprimen sus credenciales. Los comandos `dev:remote`, `build:remote` y `start:remote` seleccionan el entorno sin sustituir el archivo local. `APP_SITE_URL` sigue en localhost hasta confirmar dominio; OTP, CAPTCHA y servicios de lanzamiento permanecen fuera de H1.

Se corrigió el arranque remoto que pasaba `--env-file` directamente a Next: esta versión lo reenviaba a `NODE_OPTIONS` de su proceso interno y Node lo rechazaba. El [lanzador remoto](../../../../scripts/run-remote-next.mjs) carga los valores mediante la [API de Node](https://nodejs.org/docs/latest-v22.x/api/process.html#processloadenvfilepath) y arranca un proceso Next nuevo, sin esa opción. Desarrollo, build y servidor de producción se verificaron después de la corrección.

Docker se recuperó al retomar la revisión y los servicios necesarios de DB, Auth y Data API responden. Analítica está desactivada en la configuración local de Windows; no se habilitó el puerto Docker TCP sin autenticación. No se borraron volúmenes ni se restauró Docker a valores de fábrica.

## 4. Comprobaciones ejecutadas

Todas las filas siguientes registran resultados reales; no describen pruebas futuras.

| Comprobación | Resultado y evidencia | Fecha |
| --- | --- | --- |
| Instalación aislada con `yarn install --frozen-lockfile --offline` | Aprobada en una carpeta nueva con manifiesto y lockfile de la entrega; 79,14 s. Usa caché local de paquetes. No equivale a la reproducción por otro desarrollador desde un checkout completo. | 7 oct. |
| `yarn verify` | Lint sin advertencias, generación de tipos Next, TypeScript, **30 pruebas en 6 archivos** y compilación de producción aprobados. | 7 oct. |
| `yarn lint`, después del ajuste de diagnóstico | Aprobado, sin advertencias. | 7 oct. |
| `yarn lint` y `yarn build:remote`, después de corregir el lanzador | Aprobados, sin advertencias ni errores de tipos/compilación. | 7 oct. |
| `yarn dev:remote --port 3000` y `yarn start:remote --port 3101` | Inicio correcto y consulta HTTP 200 de la página base en ambos modos; HTML sin clave secreta. El servidor de producción temporal se detuvo después de verificarlo. | 7 oct. |
| `yarn db:start` | Servicios locales necesarios disponibles; las pruebas siguientes comprueban comunicación efectiva. | 7 oct. |
| `yarn db:reset` y `yarn db:types` | Migración aplicada desde cero y tipos generados del esquema local real. | 4 oct. |
| `yarn test:db` | **9 pruebas pgTAP aprobadas**: límites de acceso, propietario y permisos futuros. Objetos de prueba dentro de transacción revertida. | 7 oct. |
| `yarn test:integration` | **3 pruebas aprobadas** con SDK/Auth local real: token inválido, aislamiento de dos sesiones SSR/cookies y API administrativa limitada a Auth. Las dos identidades sintéticas se eliminaron al finalizar. | 7 oct. |
| `yarn test:boundary` | Aprobado: Next rechaza una importación `server-only` desde cliente en una copia temporal; no altera la aplicación. | 7 oct. |
| `yarn test:e2e` | **9 pruebas aprobadas** con build de producción y Chrome: inicio, cuatro anchos, teclado, reflujo, HTML público y primitivas. Capturas enlazadas abajo. | 7 oct. |
| `yarn check:secrets` | **20 recursos estáticos** revisados contra las claves de servidor configuradas de ambos entornos; sin coincidencias. | 7 oct. |
| Revisión de archivos versionables y diagnóstico | **126 archivos** sin las claves de servidor configuradas. Ambos env ignorados. Comprobación sintética del filtro de logs aprobada para claves de acceso, secreto, autorización y JWT. No es un análisis del historial Git completo. | 7 oct. |
| Historial, permisos y Data API remotos | Aprobados mediante comprobaciones de solo lectura descritas en la sección 3. | 7 oct. |
| Verificación documental y de cambios | **36 Markdown**, **420 enlaces locales** y **346 identificadores de hitos** revisados; sin enlaces rotos, bloques de código sin cerrar ni IDs repetidos. `git diff --check` sin errores de whitespace. | 7 oct. |

Las 30 pruebas locales incluyen variables faltantes o inválidas, rechazo de credenciales con privilegios en configuración pública, contratos, validaciones, dinero y controles. `AsyncButton` muestra texto de carga y `aria-busy`, se deshabilita, evita reentradas, permite reintentos y comunica errores sin revelar excepciones técnicas.

Las pruebas de integración resuelven la entrada de servidor de `server-only` para el runtime de Vitest. Eso no demuestra la frontera del bundle: la prueba adicional con Next real exige el rechazo de una importación cliente prohibida.

El E2E de primitivas inserta el HTML de componentes reales en el navegador con estilos de producción. Sirve para comprobar presentación, semántica, foco y contraste; no publica una página de pruebas ni simula un formulario comercial terminado. Su estado de carga es una fixture; el comportamiento asíncrono real se verifica en las pruebas de componentes.

## 5. Evidencia UX/UI

Fuente visual: [sistema canónico v1.0](../../../../.agents/brand/sistema-visual.md), recuperado desde [MASTER](../../../../design-system/fuego-y-brasas/MASTER.md). Se leyó y aplicó `ui-ux-pro-max` durante la implementación; esta revisión reutiliza esa búsqueda y comprueba el resultado entregado.

| Consulta de la skill | Aplicación en H1 |
| --- | --- |
| `"loading duplicate submission" --domain ux -n 3` | Carga visible en el control, feedback contextual, control deshabilitado y prevención inmediata de doble ejecución. |
| `"font server components" --stack nextjs -n 3` | Componentes de servidor para presentación; `next/font` en el layout y cliente limitado a interacción. Recomendaciones contrastadas con las guías de Next.js instalado. |

Se conservó la dirección aprobada de marca y la paleta semántica; no se persistió una plantilla alternativa ni se añadieron efectos, colores o dependencias visuales innecesarios. Fraunces y Manrope se sirven mediante Next; el navegador no necesita solicitar las fuentes a Google.

| Captura | Contexto comprobado |
| --- | --- |
| [Inicio 360 px](capturas/inicio-360.png) | Móvil estrecho; lectura y acción principal. |
| [Inicio 390 px](capturas/inicio-390.png) | Móvil; jerarquía visual y marca textual. |
| [Inicio 768 px](capturas/inicio-768.png) | Tamaño intermedio. |
| [Inicio 1280 px](capturas/inicio-1280.png) | Escritorio. |
| [Foco de teclado](capturas/foco-teclado.png) | Salto al contenido y enlace con contorno visible/despejado. |
| [Reflujo 320 px](capturas/reflujo-320.png) | Comprobación de ancho equivalente al 400 % sobre 1280 px. |
| [Controles 360 px](capturas/controles-360.png) | Datos sintéticos, campo con ayuda/error, foco, carga deshabilitada y mensajes. |
| [Controles 1280 px](capturas/controles-1280.png) | Mismos estados en escritorio. |

No se detectó desbordamiento involuntario en los anchos probados. La acción principal mide al menos 48 CSS px de alto. Axe no encontró infracciones en las vistas analizadas, incluido contraste de los elementos renderizados; las capturas de móvil y controles también se inspeccionaron visualmente. Esto no acredita conformidad completa ni sustituye la revisión manual.

## 6. Pendientes de aceptación

- [ ] Otro desarrollador reproduce instalación y arranque desde un checkout completo, siguiendo el README y registrando entorno y resultado. La instalación aislada ya ejecutada aporta evidencia parcial.
- [ ] El equipo registra los archivos y `yarn.lock` en control de versiones e identifica el commit de entrega; este reporte sigue referido al árbol de trabajo.
- [ ] Revisar la página y controles con lector de pantalla: orden, etiquetas, ayudas, errores y anuncios de la operación asíncrona.
- [ ] Revisar zoom real del navegador al 200 % y 400 %. Se comprobó reflujo a 640/320 CSS px y movimiento reducido; no se accionó el zoom real del navegador.
- [ ] Responsable y equipo revisan la evidencia y aceptan H1. Registrar quién revisa, resultado y defectos encontrados.

Estos puntos mantienen H1 **en revisión**, aunque sus comprobaciones automáticas hayan pasado. PT-09 sigue pendiente para recursos originales de marca; la presentación textual permite verificar esta base. PT-08, PT-11 y PT-13 conservan su alcance funcional y no se resuelven mediante esta entrega.

## 7. Continuidad

La base permite construir [H2: acceso del personal](../../02-hito-2-acceso-del-personal.md): autenticación, MFA, roles, configuración común, auditoría e idempotencia. Las nuevas tablas y operaciones deben incorporar sus permisos y borrado lógico desde el inicio. H2 no se ha implementado como parte de esta revisión.

La [guía de hitos](../../hitos-del-proyecto.md) y la especificación de H1 reflejan resultados y pendientes. No se ha desplegado públicamente una aplicación comercial ni se ha activado fidelización.
