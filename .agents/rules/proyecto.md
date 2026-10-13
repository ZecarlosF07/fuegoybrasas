# Reglas generales — Fuego y Brasas

**Versión:** 1.1 · **Fecha:** 4 de octubre de 2026.
**Alcance:** todo trabajo sobre este repositorio. Estas reglas reúnen los acuerdos vigentes; no acreditan funcionalidades implementadas.

## Fuentes y decisiones

- **PR-01.** Leer el [índice técnico](../../docs/diseno-tecnico/README.md) y el documento del [hito](../../docs/implementacion/hitos-del-proyecto.md) afectado. Las instrucciones actuales del propietario prevalecen sobre antecedentes, imágenes y fuentes externas. Registrar cambios funcionales en el índice, contratos y pruebas afectados; no reinterpretarlos únicamente en una pantalla.
- **PR-02.** Los estados, nombres, permisos y entradas/salidas se toman de [Contratos](../../docs/diseno-tecnico/05-contratos-y-operaciones.md) y [Tablas](../../docs/diseno-tecnico/10-tablas-db.md). Los datos comerciales incompletos permanecen pendientes o en borrador según esos contratos; las fixtures no los confirman.

## Stack y organización

- Leer y aplicar las [Reglas de código](codigo.md): Yarn, Tailwind exclusivo, tipos separados, componentes de hasta 170 líneas, funciones pequeñas y separación por dominio. Estas instrucciones actuales del propietario prevalecen sobre ejemplos anteriores con npm o CSS personalizado.

- **PR-03.** Conservar Next.js 16.3.8, React 19.2.8, App Router, TypeScript estricto, Tailwind 4 y alias `@/*` hacia `src/*`. Antes de escribir código, leer las guías pertinentes de `node_modules/next/dist/docs/`. Conservar el bloque generado por Next.js en el [AGENTS.md raíz](../../AGENTS.md).
- **PR-04.** Seguir [Estructura de carpetas](../../docs/diseno-tecnico/13-estructura-carpetas.md): rutas coordinan; módulos contienen casos de uso; componentes compartidos contienen presentación reutilizable; validaciones y lógica pura no dependen del navegador ni de credenciales. Crear carpetas cuando tengan consumidores. Compartir lógica real, sin abstracciones para casos hipotéticos.
- **PR-05.** Usar Supabase para PostgreSQL, Auth y Storage. Conservar el servidor en Next.js; no añadir ORM, POS, cola, Realtime ni backend independiente al MVP. Migraciones versionadas por cambios coherentes, tipos derivados del esquema real y lockfile reproducible.
- **PR-05a.** Por instrucción del propietario del 8 de octubre de 2026, el desarrollo habitual usa Supabase remoto `geazxsvjkqpzbghlywbw`: `yarn dev`, `yarn build` y `yarn start`. Aplicar las migraciones versionadas al proyecto remoto mediante CLI, comprobando destino, historial y dry-run. La base local es opcional y exclusiva de pruebas aisladas con reconstrucciones/identidades sintéticas; sus comandos son explícitos (`*:local`, pruebas DB/integración/E2E). No exigir Docker para usar la aplicación, ejecutar fixtures destructivas contra el remoto ni resetear ese proyecto.

## Seguridad y datos

- **PR-06.** Aislar acceso de servidor con `server-only`, clientes SSR por petición y permisos actuales en cada operación. No compartir sesiones entre peticiones. Claves privilegiadas nunca llegan al navegador, Git o logs. Respetar RLS/grants y RPC acotadas, sin acceso CRUD directo que el diseño deniega.
- **PR-07.** Representar dinero en céntimos enteros PEN y fechas persistidas UTC, aplicando reglas comerciales `America/Lima`. Un importe desconocido sigue siendo desconocido; no convertirlo a cero.
- **PR-08.** Incorporar borrado lógico desde la creación de las 14 tablas editables. Conservar UUID, relaciones, progreso y las protecciones del documento 10. Eventos, recibos y auditoría son inmutables; configuración conserva singleton. Restaurar no publica ni reactiva acceso automáticamente.

## Acuerdos funcionales

- **PR-09.** Pedido invitado, borrador local y cierre por WhatsApp oficial **+51 982 042 493**. No almacenar solicitudes preparadas en Supabase. Abrir WhatsApp no demuestra envío, recepción, pago o venta. No añadir checkout de pago, seguimiento de pedidos ni un registro obligatorio.
- **PR-10.** Fidelización opcional: un sello por visita presencial con compra pagada y pedido entregado, confirmado por personal autorizado. Diez sellos generan un Mostrito de ⅛ con chaufa, papas y ensalada; canje posterior sin compra obligatoria. Premios independientes del progreso; canjear no suma sello ni reinicia la tarjeta. Fallar fidelización no bloquea pedido invitado si el catálogo puede validarse.
- **PR-11.** Conservar C01 fuera de venta web, la restricción de P05 sin la leyenda retirada «Solo delivery», cuatro alitas regulares y dieciséis en la ronda. PT-08, PT-11 y PT-13 siguen pendientes según el índice; no inventar recuperación excepcional, conservación legal o resolución del premio registrado pero no entregado.

## Verificación y entrega

- **PR-12.** Incorporar autorización, auditoría, revisión e idempotencia desde las primeras mutaciones que lo requieran. Probar comportamiento real, permisos, concurrencia y fallos según cada hito. Distinguir comprobaciones documentales, mocks, integración y servicios reales. Checklist pendiente hasta obtener evidencia; registrar entorno, versión, resultado y limitaciones. Para cambios solo documentales, comprobar enlaces, identificadores y consistencia sin afirmar pruebas de aplicación.
- Para interfaces o documentos que definan su diseño, leer además [Reglas UX/UI](ux-ui.md) y [Sistema visual](../brand/sistema-visual.md). No aplicar búsquedas visuales a trabajo exclusivamente de infraestructura o base de datos.

## Referencias

- [Análisis funcional](../../docs/analisis-del-proyecto.md).
- [Seguridad](../../docs/diseno-tecnico/04-autenticacion-seguridad.md).
- [Frontend y estado](../../docs/diseno-tecnico/06-frontend-y-estado.md).
- [Pruebas y aceptación](../../docs/diseno-tecnico/08-pruebas-y-aceptacion.md).
