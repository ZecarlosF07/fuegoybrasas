# Hito 1 — Preparar el proyecto

**Actualización DC-22, 13/10/2026:** [personal sin MFA](../diseno-tecnico/19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Versión:** 1.3 · **Fecha:** 7 de octubre de 2026.
**Destinatarios:** equipo de desarrollo y responsable del proyecto.  
**Estado:** en revisión; base implementada y verificaciones automáticas aprobadas, registradas en el [reporte de H1](evidencia/h1/README.md). Reproducción por otro desarrollador, registro de la entrega en Git, zoom real, lector de pantalla y aceptación del equipo pendientes.
**Guía general:** [Hitos del proyecto](hitos-del-proyecto.md).

## 1. Descripción del objetivo

Dejar una base técnica organizada, conectada a Supabase y reproducible para que el equipo empiece a construir funcionalidades sin depender de configuraciones manuales desconocidas. Al terminar, un desarrollador debe poder obtener el proyecto, instalarlo, iniciar la aplicación y la base local, comprobar la conexión y ejecutar los controles básicos siguiendo instrucciones versionadas.

H1 establece cómo se organiza el código, cómo se configura cada entorno, cómo se accede a Supabase y cómo se crean cambios de base de datos. El resultado es una aplicación base ejecutable y verificable, lista para desarrollar el acceso privado de H2 y el catálogo de H3.

El repositorio ya utiliza Next.js 16.3.8, React 19.2.8, TypeScript estricto y Tailwind 4. Se conserva ese punto de partida. Esta especificación no presenta el catálogo, el panel, los pedidos o la fidelización como implementados.

### Alcance del hito

- Organización inicial de Next.js y sus módulos compartidos.
- Herramientas y entorno local de Supabase, proceso de migraciones y pruebas de infraestructura.
- Configuración por entorno y protección de secretos.
- Clientes SDK por contexto, contratos comunes y manejo seguro de errores.
- Inicio de la aplicación, comprobación de comunicación y documentación de uso para desarrolladores.

El login/permisos del personal, bootstrap del responsable, tablas comerciales, auditoría de negocio y recibos transaccionales se implementan desde H2 y los hitos funcionales correspondientes. El carrito, WhatsApp, OTP de clientes y reglas de premios se entregan en H5/H6. H1 prepara sus dependencias comunes sin crear pantallas o tablas vacías para todas esas funciones.

## 2. Tareas del hito

| ID | Tarea | Trabajo concreto | Resultado esperado |
| --- | --- | --- | --- |
| H1-T01 | Revisar el diseño y las convenciones | Leer arquitectura, contratos, estructura y operación; consultar `AGENTS.md` y las guías instaladas de Next.js relevantes antes de escribir código. | Alcance y límites compartidos por el equipo; sin cambiar el stack por suposiciones. |
| H1-T02 | Preparar herramientas | Verificar Node/Yarn, Docker operativo y Supabase CLI; instalar/configurar lo que falta y registrar versiones utilizadas. | Herramientas disponibles y pasos de arranque documentados. |
| H1-T03 | Organizar el código inicial | Mantener `src/app`, root layout y alias `@/*`; preparar contratos, infraestructura y módulos que se utilicen en H1 siguiendo el documento 13. | Separación clara entre rutas, componentes, lógica pura e infraestructura de servidor. |
| H1-T04 | Incorporar dependencias base | Instalar SDK Supabase, SSR, Zod y protección `server-only`; configurar las herramientas mínimas de pruebas y fijar versiones resueltas en lockfile. | Instalación reproducible y dependencias compatibles con Next.js existente. |
| H1-T05 | Preparar Supabase local | Inicializar configuración de CLI, comprobar arranque con Docker y preparar directorio de migraciones/fixtures. | Base local accesible, aislada de producción. |
| H1-T06 | Establecer migraciones y permisos iniciales | Crear la migración de base para el esquema privado y permisos iniciales de objetos propios; probar su aplicación desde cero. Documentar generación futura de tipos desde el esquema real. | Historial SQL reproducible y acceso cerrado a futuras entidades privadas. |
| H1-T07 | Preparar variables por entorno | Crear configuración de ejemplo sin secretos; validar variables necesarias; separar configuración pública y de servidor y documentar local/staging/producción. | Errores comprensibles al faltar configuración, sin imprimir sus valores. |
| H1-T08 | Crear clientes Supabase por contexto | Cliente público sin sesión, cliente SSR de servidor por petición, cliente Auth de navegador y fábrica administrativa aislada. Comprobar comunicación en el entorno local. | Cada consumidor utiliza el contexto correcto y no hereda sesiones ajenas. |
| H1-T09 | Definir contratos y utilidades comunes | Preparar `Result`, códigos de error y metadatos de mutación según contratos existentes; validación de primitivas y dinero entero en PEN. | Entradas/salidas consistentes y utilidades puras utilizables por los próximos módulos. |
| H1-T10 | Preparar controles de calidad | Configurar lint, TypeScript, build y pruebas pertinentes de configuración, límites servidor/cliente y comunicación local. | Comprobaciones ejecutables con resultados verificables. |
| H1-T11 | Documentar y presentar la entrega | Escribir instrucciones de instalación/arranque/reset local/verificación, registrar evidencia de pruebas y mostrar la aplicación base funcionando. | Otro desarrollador puede reproducir el resultado y el responsable puede revisar el cierre. |
| H1-T12 | Preparar la base visual compartida | Leer reglas .agents y sistema canónico; aplicar ui-ux-pro-max a la base visual. Integrar tokens, fuentes, campos, botones, mensajes y foco necesarios para la aplicación base, sin adelantar pantallas comerciales. | Base visual reutilizable y lectura de la skill documentada. |

Orden recomendado: T01–T02 → T03–T07 → T08–T09 → T10–T11. Los contratos compartidos pueden prepararse mientras se configura el entorno; su aceptación incluye pruebas de integración, no solo existencia de archivos.

Ejecutar H1-T12 durante T03 y antes del cierre de T10–T11. Su identificador añadido conserva los anteriores; no posterga el diseño hasta después de la implementación. Las tareas exclusivamente de backend mantienen sus pruebas y no requieren búsqueda visual.

## 3. Requerimientos técnicos

### 3.1. Stack y estructura

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H1-RT01 | Conservar el stack del proyecto | Next.js 16.3.8, React 19.2.8, App Router, TypeScript estricto y Tailwind 4. Actualizaciones distintas requieren justificación y revisión de compatibilidad. |
| H1-RT02 | Runtime reproducible | Usar la línea Node 22 compatible indicada en operación; registrar versión de Node/Yarn y fijar la configuración para desarrollo y verificaciones. Confirmar requisitos con los paquetes instalados. |
| H1-RT03 | Separación de responsabilidades | Rutas en `src/app`; contratos y helpers compartidos separados de infraestructura. Alias `@/*` conserva `./src/*`. Crear las carpetas utilizadas, siguiendo la estructura objetivo. |
| H1-RT04 | Frontera servidor/navegador | SDK de servidor, secretos y futuras DAL usan protección `server-only`; contratos y lógica pura no dependen de cookies ni claves privilegiadas. Componentes cliente se limitan a interacción necesaria. |
| H1-RT05 | Gestión de dependencias | Yarn 1.22.22 y `yarn.lock` versionado; `yarn install --frozen-lockfile` reproduce la instalación. No añadir ORM, backend independiente, colas o motores de campañas para esta base. |

### 3.2. Supabase, configuración y migraciones

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H1-RT06 | Entorno local operativo | Docker y CLI pueden iniciar Supabase local; las pruebas de infraestructura usan datos sintéticos. Identificar local/staging/producción en configuración y documentación. |
| H1-RT07 | Migraciones como fuente de verdad | SQL versionado en `supabase/migrations`; aplicación ordenada desde una base local vacía. La migración inicial prepara `app_private` y permisos restrictivos de objetos propios, sin modificar tablas administradas de Auth/Storage. |
| H1-RT08 | Seguridad desde la creación | `app_private` no se expone por Data API ni recibe acceso directo de visitantes/usuarios. Objetos de aplicación futuros se crean con sus grants/RLS antes de usarlos; no esperar al panel para protegerlos. |
| H1-RT09 | Tipos derivados del esquema | Documentar y verificar el proceso de generación de tipos contra el esquema local existente. No escribir a mano tipos que aparenten tablas todavía no migradas. Regenerar cuando H2/H3 añadan entidades. |
| H1-RT10 | Validación de entorno | Validadores separados para variables públicas y del servidor. Las variables de uso diferido se exigen al activar su capacidad, sin bloquear H1 por OTP/permisos que todavía pertenecen a otros hitos. |
| H1-RT11 | Clientes SDK diferenciados | Cliente público sin Auth/cookies; SSR server nuevo por petición; browser para Auth permitido; cliente secreto exclusivamente server-only para administración autorizada de Auth posterior. |
| H1-RT12 | Sesiones y caché | No singleton autenticado compartido entre peticiones. SDK de datos con no-store conforme arquitectura; no caché compartida de sesión y `cacheComponents` deshabilitado inicialmente. Preparar cliente SSR compatible con cookies de la versión instalada. |
| H1-RT13 | Secretos protegidos | Clave secreta solo servidor, nunca `NEXT_PUBLIC_*`, JSON público, logs o Git. `.env.example` lleva nombres/placeholders; archivos con credenciales quedan ignorados. |

**Variables y momento de exigencia:**

| Variable | Uso | Condición en H1 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del entorno Supabase seleccionado. | Obligatoria para iniciar la integración. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | SDK público/SSR sujeto a permisos. | Obligatoria; en local usar la credencial equivalente que entregue la CLI y verificar compatibilidad del SDK. |
| `APP_SITE_URL` | URL propia usada por servicios y futuros callbacks. | Obligatoria para configuración base; local puede usar la URL de desarrollo. |
| `SUPABASE_SECRET_KEY` | Administración aislada de Auth. | Exigida solo al utilizar la fábrica administrativa; no habilita operaciones públicas ni bootstrap en H1. |
| `NEXT_PUBLIC_CAPTCHA_SITE_KEY` | Widget CAPTCHA configurado para Auth. | Reservada; se exige cuando se implemente el flujo que la necesita. |

Credenciales SMS/SMTP y secreto CAPTCHA se configuran en Supabase/proveedor al implementar esos servicios. Credenciales de despliegue pertenecen a CI/operador; no se incluyen en configuración pública. Dirección, precios, WhatsApp y horarios son datos comerciales del modelo, no secretos que se trasladan a variables de H1.

La prueba de conectividad usa el entorno local y una respuesta esperada del servicio Supabase mediante SDK, distinguiendo un fallo de configuración de un permiso denegado. Puede emplear una identidad Auth sintética local para probar contexto; no crea autorización staff ni cuentas reales. La conexión al PostgreSQL local se comprueba además mediante herramientas de la CLI. H1 no añade tablas públicas de prueba ni una RPC anónima para eludir el contrato de catálogo.

### 3.3. Contratos, errores y pruebas

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H1-RT14 | Convenciones de contratos | DTO camelCase, SQL snake_case; UUID como texto y fechas ISO 8601 UTC. Reutilizar `Result`, `ErrorCode` y `MutationMeta` del documento 05 sin redefinir respuestas incompatibles. |
| H1-RT15 | Validación efectiva | Zod o los esquemas acordados validan configuración y entradas de red aplicables; TypeScript no sustituye validación en ejecución. Primitivas compartidas con límites claros. |
| H1-RT16 | Representación monetaria | Céntimos enteros de PEN; utilidades puras de conversión/formato exactos. Valor desconocido permanece nulo y no se convierte a cero. |
| H1-RT17 | Errores seguros | Códigos estables y requestId donde corresponda; diagnóstico técnico restringido. No incluir claves, tokens, SQL interno, teléfonos o cuerpos personales en respuestas/logs. |
| H1-RT18 | Controles automáticos | Mantener lint/build; añadir comprobación TypeScript y scripts de pruebas usados por H1. Configuración/contratos con Vitest; comunicación e aislamiento en integración local; arranque de página mediante comprobación E2E/smoke. |

Los requisitos de autenticación efectiva, rol, permisos vigentes, bloqueo e idempotencia de las mutaciones comerciales se verifican en H2/H6. H1 define sus interfaces comunes y separación técnica; no afirma que esos permisos o transacciones de negocio ya funcionen.

### 3.4. Diseño UX/UI y sistema visual

| ID | Requerimiento | Criterio técnico |
| --- | --- | --- |
| H1-RT19 | Reglas y skill aplicables | Leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual](../../.agents/brand/sistema-visual.md); usar `ui-ux-pro-max` y registrar encaje/recomendaciones, sin depender de una ruta personal ni sustituir decisiones por una plantilla. |
| H1-RT20 | Patrón visual del hito | Tema Tailwind 4 configurado sin selectores CSS personalizados y fuentes next/font según guías instaladas; primitivas usadas y sin dependencia Supabase. Sin HEX o medidas alternativas por componente. |

Los valores visuales se consultan en el sistema canónico. La aceptación exige estados reales del alcance, anchos definidos allí y evidencia manual/automática pertinente; los recursos originales siguen pendientes en PT-09 cuando no estén disponibles. Esta ampliación no crea interfaces ni afirma pruebas ejecutadas.

## 4. Requerimientos funcionales de H1

Estos requisitos describen comportamientos de la base técnica para desarrolladores y operadores. Usan prefijo **H1-RF** para distinguirlos de RF-01–RF-18 del producto completo.

| ID | Requerimiento funcional | Comportamiento observable |
| --- | --- | --- |
| H1-RF01 | Instalar el proyecto desde un checkout limpio | Un desarrollador sigue las instrucciones, instala dependencias y obtiene un entorno ejecutable. |
| H1-RF02 | Iniciar y detener el entorno local | El equipo inicia aplicación y servicios locales con pasos documentados, y puede detenerlos sin depender de una sesión previa. |
| H1-RF03 | Abrir la aplicación base | La ruta inicial responde y muestra la aplicación base sin exigir cuenta del cliente o personal. La presentación comercial definitiva llega en H3. |
| H1-RF04 | Detectar configuración inválida | Al faltar una variable requerida o tener formato inválido, el equipo recibe un error comprensible que identifica la configuración afectada sin revelar valores. |
| H1-RF05 | Seleccionar el entorno correcto | La configuración conecta al entorno previsto; desarrollo/pruebas no utilizan perfiles o credenciales productivos. Cambiar entorno sigue un procedimiento explícito. |
| H1-RF06 | Comprobar comunicación con Supabase | Una verificación controlada desde el código de integración obtiene el resultado esperado de Supabase local; distingue servicio inaccesible, configuración inválida y denegación esperada. |
| H1-RF07 | Reconstruir la base local | El equipo aplica migraciones desde cero y obtiene el mismo esquema de aplicación inicial; las fixtures de H1 son exclusivamente sintéticas. |
| H1-RF08 | Obtener errores y resultados consistentes | Operaciones técnicas aplicables responden con contratos compartidos; el consumidor puede reconocer error/configuración sin inspeccionar una excepción interna. |
| H1-RF09 | Ejecutar controles de calidad | Un desarrollador ejecuta los comandos documentados y reconoce qué pasó, falló o quedó pendiente. |
| H1-RF10 | Reconocer y reutilizar la base visual | El equipo puede abrir la aplicación base y comprobar tipografía, controles y estados compartidos conforme a la especificación; todavía no se presenta la carta como implementada. |

No se crean pantallas públicas de diagnóstico con claves, nombres internos o datos privados. Las comprobaciones técnicas se realizan mediante pruebas y herramientas de desarrollo. El endpoint de salud previsto en navegación puede implementarse cuando corresponda al monitoreo, sin convertirlo en una interfaz de administración.

## 5. Definition of Done

H1 se considera aceptado cuando **todos** los puntos siguientes tienen evidencia verificable. El [reporte](evidencia/h1/README.md) distingue comprobaciones ejecutadas y revisiones pendientes; la aceptación por otro desarrollador no se sustituye por checks automáticos.

### Instalación y funcionamiento

- [ ] Otro desarrollador puede instalar el proyecto desde un checkout limpio usando `yarn install --frozen-lockfile` e instrucciones versionadas.
- [x] Node/Yarn, Docker y Supabase CLI utilizados quedan identificados; Supabase local y Next.js inician correctamente.
- [x] La ruta inicial puede abrirse en el navegador y ejecutarse también con el build de producción en el entorno de prueba.
- [x] La conexión del SDK y la base PostgreSQL local se comprueban con resultados esperados y sin abrir acceso a tablas comerciales.

### Estructura y configuración

- [x] Se conserva App Router, TypeScript estricto y alias `@/*`; los módulos iniciales respetan las responsabilidades acordadas.
- [ ] Las dependencias resueltas y el lockfile están versionados; no se necesita editar código para elegir el entorno.
- [x] `.env.example` e instrucciones describen variables obligatorias, públicas, secretas y de uso diferido.
- [x] Casos de variable ausente/formato incorrecto producen errores seguros y comprobados.
- [x] No hay secretos en Git, contenido servido al navegador, DTO o registros de pruebas.

### Base de datos y límites de acceso

- [x] Las migraciones iniciales se aplican desde cero en local; el resultado esperado de esquema/permisos está documentado.
- [x] `app_private` permanece fuera de Data API y sin acceso directo de roles públicos; no se alteran esquemas administrados de Auth/Storage.
- [x] Existe un procedimiento verificado para generar tipos a partir del esquema real; no se simulan tablas futuras en el archivo generado.
- [x] Cliente público y autenticado están separados; las peticiones SSR no comparten sesión mutable.
- [x] Una importación indebida de infraestructura `server-only` desde cliente es detectada por las comprobaciones del proyecto.

### Calidad y entrega al equipo

- [x] `lint`, chequeo TypeScript y `build` pasan para el código entregado.
- [x] Pasan pruebas pertinentes de variables, contratos/helpers puros y comunicación local; el arranque se verifica mediante smoke/E2E.
- [x] Los resultados registran commit, entorno, comandos/casos y limitaciones pendientes; «no ejecutado» no aparece como aprobado.
- [x] La documentación explica instalación, arranque, reset local, generación de tipos y comprobaciones sin pasos ocultos.
- [ ] El equipo revisa la entrega y queda identificada la transición a H2, con cualquier bloqueo externo registrado.

### Diseño UX/UI y marca

- [x] Se leyeron reglas del proyecto, UX/UI y sistema canónico; se aplicó `ui-ux-pro-max` al trabajo visual y se registraron consultas/recomendaciones aplicadas o descartadas con motivo.
- [x] La aplicación base demuestra tokens/fuentes y los componentes comunes realmente usados, con foco, estados y contraste revisados; el alias y la frontera servidor/cliente se conservan.
- [x] Se revisaron los anchos de evidencia del sistema visual, sin desbordamiento involuntario ni acciones esenciales ocultas; no hay colores/medidas alternativos duplicados en componentes.
- [ ] Teclado, foco completamente visible, labels/errores, contraste renderizado, zoom/reflujo y lector se comprobaron en el alcance; resultado y casos no ejecutados están identificados.
- [x] Capturas y reporte identifican versión/entorno y datos sintéticos. Evidencia específica: Vista base y controles compartidos; errores/foco, sin datos comerciales o pantallas futuras simuladas.

Los checks marcados corresponden a las comprobaciones enlazadas. La instalación aislada con lockfile pasó, pero falta reproducir el checkout con otro desarrollador y registrar los archivos nuevos en Git. Teclado, contraste y reflujo tienen evidencia automática; lector de pantalla y zoom real siguen pendientes. No se ha creado un commit de esta entrega ni se declara aceptación global de H1.

### Evidencia mínima sugerida

| Evidencia | Qué demuestra |
| --- | --- |
| Registro de instalación desde checkout limpio | Dependencias y configuración reproducibles. |
| Resultado de arranque y apertura de la ruta inicial | Next.js funciona en el entorno preparado. |
| Resultado de integración SDK y comprobación PostgreSQL local | Comunicación con servicios correctos, no solo variables con formato válido. |
| Resultado de migraciones/reset local | Esquema y permisos reproducibles desde cero. |
| Salidas de lint, TypeScript, build y pruebas de H1 | Estado real de los controles de calidad. |
| Revisión de imports y contenido cliente/logs | Frontera de secretos y separación servidor/navegador. |
| Instrucciones seguidas por otro desarrollador | El equipo puede continuar sin depender de quien configuró inicialmente. |

No se requiere información productiva para demostrar H1. La creación/contratación de entornos remotos, dominio o proveedor SMS puede quedar pendiente con responsable y alcance identificados, mientras la base local esté completamente operativa. Una conexión local todavía simulada, migraciones que no se pueden reproducir o checks básicos fallidos sí impiden dar H1 por terminado.

## 6. Dependencias y transición a H2

Para empezar se necesita acceso al repositorio, diseño disponible y un equipo capaz de ejecutar Node/Docker. El equipo debe verificar las herramientas actuales; este documento no da por instalado lo que todavía se debe comprobar. Cuentas/proyectos remotos y sus credenciales se gestionan por un canal autorizado, fuera del Markdown.

H2 utilizará esta base para añadir personal autorizado, permisos vigentes, configuración del negocio, auditoría y recibos de operaciones. Las tablas editables incorporarán desde su creación `deleted_at`, `deleted_by` y `delete_reason` según el documento 10; `staff_accounts` debe existir antes de añadir FKs de borrado que la referencian. Eventos/recibos/auditoría conservan sus reglas especiales de inmutabilidad.

PT-13 afecta el tratamiento de un canje sin entrega y no bloquea H1. No se resuelve en infraestructura por medio de una suposición sobre premios.

## 7. Referencias

- [Reglas generales](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md).
- [Identidad visual y cobertura por vistas](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md) e [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md).

- [Guía general de hitos](hitos-del-proyecto.md).
- [Arquitectura y clientes Supabase](../diseno-tecnico/01-arquitectura.md).
- [Autenticación, permisos y secretos](../diseno-tecnico/04-autenticacion-seguridad.md).
- [Contratos, errores y convenciones](../diseno-tecnico/05-contratos-y-operaciones.md).
- [Entornos y variables](../diseno-tecnico/07-despliegue-y-operacion.md).
- [Pruebas y evidencia de aceptación](../diseno-tecnico/08-pruebas-y-aceptacion.md).
- [Plan técnico](../diseno-tecnico/09-plan-de-implementacion.md).
- [Tablas y soft delete](../diseno-tecnico/10-tablas-db.md).
- [Estructura de carpetas](../diseno-tecnico/13-estructura-carpetas.md).

Las comprobaciones ejecutadas y sus límites se documentan en el [reporte de evidencia](evidencia/h1/README.md). La actualización de esta especificación no acredita por sí sola tareas de los demás hitos.
