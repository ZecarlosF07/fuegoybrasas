# 13. Estructura base de carpetas para Next.js

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. MFA del personal se conserva.

**Versión:** 1.0 · **Fecha:** 3 de octubre de 2026.  
**Estado:** árbol propuesto para implementación; este documento no crea esas carpetas o archivos.  
**Base:** [Arquitectura](01-arquitectura.md), [Contratos](05-contratos-y-operaciones.md), [Frontend](06-frontend-y-estado.md) y [Plan de implementación](09-plan-de-implementacion.md).  
**Complementos:** [Tablas y soft delete](10-tablas-db.md), [Flujos](11-diagrama-flujo.md), [Rutas](12-flujo-navegacion.md).

## 1. Compatibilidad y estado actual

El proyecto utiliza Next.js **16.3.8**, React **19.2.8**, TypeScript estricto, Tailwind 4 y App Router en `src/app`. El alias existente `@/*` apunta a `./src/*`. Actualmente hay un root layout, página inicial, estilos, favicon y recursos de la plantilla; no se presume que estén construidas las funcionalidades de negocio.

Se consultó la guía instalada `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`. El árbol conserva convenciones de esa versión: grupos `(nombre)` fuera de la URL, `page.tsx` para páginas, `route.ts` para handlers, `layout.tsx` para envolturas y `src/proxy.ts` al nivel de `app`. Las elecciones de módulos por funcionalidad son decisiones del proyecto, no carpetas obligatorias del framework.

El árbol es un destino de organización. Añadir módulos cuando su etapa de implementación los necesite; no generar archivos vacíos ni reinstalar dependencias durante esta documentación. Las dependencias de Supabase, Zod y pruebas descritas en el diseño se instalarán después.

## 2. Árbol propuesto

```text
polleria-parcona/
├── docs/
│   ├── analisis-del-proyecto.md
│   ├── resumen-ejecutivo.md
│   └── diseno-tecnico/                 # Documentos 01–13 e índice existente
├── public/
│   └── brand/                          # Logo/recursos oficiales estáticos cuando existan
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root común; sin lectura privada global
│   │   ├── globals.css
│   │   ├── favicon.ico
│   │   ├── global-error.tsx            # Error inesperado de root
│   │   ├── not-found.tsx
│   │   ├── robots.ts                   # No indexar pedido/áreas privadas
│   │   ├── sitemap.ts                 # Solo URLs públicas publicables
│   │   ├── (public)/
│   │   │   ├── layout.tsx              # Carta y navegación pública, sin Auth
│   │   │   ├── page.tsx                # /
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   ├── productos/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx         # /productos/[slug]
│   │   │   ├── pedido/
│   │   │   │   ├── layout.tsx          # Shell de pedido; sin exigir registro
│   │   │   │   ├── page.tsx            # /pedido
│   │   │   │   ├── datos/
│   │   │   │   │   └── page.tsx        # /pedido/datos
│   │   │   │   └── continuar/
│   │   │   │       └── page.tsx        # /pedido/continuar
│   │   │   ├── condiciones-tarjeta/
│   │   │   │   └── page.tsx
│   │   │   └── privacidad/
│   │   │       └── page.tsx
│   │   ├── (customer-access)/
│   │   │   └── mi-tarjeta/
│   │   │       └── acceso/
│   │   │           └── page.tsx        # OTP/activación; fuera del layout protegido
│   │   ├── (customer)/
│   │   │   ├── layout.tsx              # Identidad propia y control de estado
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── mi-tarjeta/
│   │   │       ├── page.tsx            # /mi-tarjeta
│   │   │       └── telefono/
│   │   │           └── page.tsx        # /mi-tarjeta/telefono
│   │   ├── (staff-access)/
│   │   │   └── personal/
│   │   │       ├── acceso/
│   │   │       │   └── page.tsx
│   │   │       ├── mfa/
│   │   │       │   └── page.tsx        # AAL1 permitido para completar MFA
│   │   │       ├── recuperar/
│   │   │       │   └── page.tsx
│   │   │       └── restablecer/
│   │   │           └── page.tsx        # Sesión de callback autorizada, luego MFA
│   │   ├── (staff)/
│   │   │   ├── layout.tsx              # Staff vigente + AAL2
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── personal/
│   │   │       ├── page.tsx            # /personal
│   │   │       └── clientes/
│   │   │           └── [id]/
│   │   │               └── page.tsx    # /personal/clientes/[id]
│   │   ├── (admin)/
│   │   │   ├── layout.tsx              # Manager vigente + AAL2
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── administracion/
│   │   │       ├── page.tsx            # /administracion: indicadores y clientes
│   │   │       ├── clientes/
│   │   │       │   └── [id]/page.tsx    # Supervisión privada; DC-12/H7
│   │   │       ├── carta/
│   │   │       │   └── page.tsx
│   │   │       ├── configuracion/
│   │   │       │   └── page.tsx
│   │   │       ├── incidencias/
│   │   │       │   └── page.tsx
│   │   │       └── personal/
│   │   │           └── page.tsx
│   │   ├── auth/
│   │   │   └── confirm/
│   │   │       └── route.ts            # GET /auth/confirm; no page.tsx
│   │   └── api/
│   │       ├── catalog/
│   │       │   └── route.ts            # GET /api/catalog
│   │       ├── cart/
│   │       │   └── validate/
│   │       │       └── route.ts        # POST /api/cart/validate
│   │       ├── me/
│   │       │   └── card/
│   │       │       └── route.ts        # GET /api/me/card
│   │       ├── admin/
│   │       │   └── catalog/
│   │       │       └── images/
│   │       │           └── route.ts    # POST /api/admin/catalog/images
│   │       └── health/
│   │           └── route.ts            # GET /api/health
│   ├── features/
│   │   ├── management/                # H7: componentes, hooks, server, services, types y validation
│   │   ├── catalog/
│   │   │   ├── components/            # CategoryNav, ProductCard, ProductOptionsDialog
│   │   │   ├── domain/                # Reglas puras de presentación/publicación
│   │   │   └── server/                # DAL de catálogo: queries, commands y actions
│   │   ├── cart/
│   │   │   ├── components/            # CartLine, CartSummary, CartDock
│   │   │   ├── domain/                # Reducer, líneas y cálculo entero de importes
│   │   │   ├── state/                 # CartProvider y adaptadores de persistencia
│   │   │   └── server/                # Validación canónica con lectura fresca
│   │   ├── checkout/
│   │   │   ├── components/            # Formulario y revisión de diferencias
│   │   │   ├── domain/                # Datos según modalidad y mensaje validado
│   │   │   └── state/                 # Datos sensibles de sesión; sin pedidos en DB
│   │   ├── whatsapp/
│   │   │   ├── components/            # PreparedMessage y copia con resultado real
│   │   │   └── domain/                # Constructor puro de mensaje/enlace
│   │   ├── identity/
│   │   │   ├── components/            # OTP, login, MFA, recuperación y phone_change
│   │   │   └── server/                # Actions Auth y callback compartido
│   │   ├── customers/
│   │   │   ├── components/            # Perfil e indicaciones habituales
│   │   │   └── server/                # Alta, consulta/corrección propia autorizada
│   │   ├── loyalty/
│   │   │   ├── components/            # StampCard y RewardList
│   │   │   ├── domain/                # Proyecciones de visualización; sin saldo editable
│   │   │   └── server/                # RPC de sello, canje y reversión
│   │   ├── staff/
│   │   │   ├── components/            # Búsqueda, ficha y confirmaciones de atención
│   │   │   ├── state/                 # Diario mínimo de operaciones pendientes
│   │   │   └── server/                # Ficha autorizada, accesos e invitaciones
│   │   ├── business/
│   │   │   ├── components/            # Configuración operativa del responsable
│   │   │   ├── domain/                # Horarios, cobertura y cargos conocidos/pendientes
│   │   │   └── server/                # Configuración/activación/costo del programa
│   │   ├── incidents/
│   │   │   ├── components/            # Registro y revisión de incidencias
│   │   │   └── server/                # Apertura/cierre; PT-13 no implementado por defecto
│   │   └── retention/
│   │       └── server/                # Conservación autorizada; SQL estático por entidad
│   ├── components/
│   │   ├── ui/                        # Botones, campos, diálogos y estados accesibles
│   │   └── layout/                    # Shell público/privado, navegación y fallback
│   ├── contracts/
│   │   ├── result.ts                  # Result, ErrorCode, MutationMeta
│   │   ├── catalog.ts                 # CatalogDTO y entradas de edición
│   │   ├── cart.ts                    # CartValidationInput y respuesta canónica
│   │   ├── checkout.ts                # Datos locales y validadores condicionales
│   │   ├── identity.ts                # Entradas OTP, login y cambio de teléfono
│   │   ├── customers.ts               # Perfil, preferencias y revisiones
│   │   ├── loyalty.ts                 # CardDTO y entradas sello/canje/reversión
│   │   ├── business.ts                # Configuración, horarios, cargos y versiones
│   │   ├── staff.ts                   # Accesos, ficha autorizada y resultados de operación
│   │   ├── incidents.ts               # Apertura/cierre paginados
│   │   └── retention.ts               # Lista cerrada de conservación y revisiones
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── public.ts              # SDK sin Auth/cookies, solo read_catalog
│   │   │   ├── server.ts              # SSR por petición y JWT propio
│   │   │   ├── browser.ts             # SSR Auth en navegador; sin clave privilegiada
│   │   │   └── admin.ts               # server-only, administración aislada de Auth
│   │   ├── auth/
│   │   │   ├── session.server.ts      # Identidad validada y sesión actual
│   │   │   ├── authorization.server.ts # Cuenta vigente, rol, MFA y borrado
│   │   │   └── refresh.server.ts      # Renovación compatible con proxy/cookies SSR
│   │   ├── env/
│   │   │   ├── client.ts              # Únicamente variables públicas
│   │   │   └── server.ts              # Variables/secretos server-only validados
│   │   ├── validation/                # Primitivas compartidas: UUID, teléfono, texto
│   │   ├── money/                     # Conversión/formatos exactos de céntimos PEN
│   │   └── observability/             # requestId y errores seguros, sin cuerpos/PII
│   ├── content/
│   │   ├── loyalty-terms/             # Condiciones aprobadas por versión
│   │   └── privacy/                   # Aviso aprobado, no textos legales inventados
│   ├── types/
│   │   └── database.generated.ts      # Generado del esquema migrado, sin edición manual
│   └── proxy.ts                       # Renovación de sesión; no autorización exclusiva
├── supabase/
│   ├── config.toml                    # Futuro entorno local, sin secretos
│   ├── migrations/                    # SQL ordenado, restricciones/RPC/RLS/soft delete
│   ├── seed.sql                       # Catálogo comercial reproducible y sin usuarios reales
│   └── tests/                         # pgTAP: grants, RLS, funciones e integridad
├── tests/
│   ├── fixtures/                      # Identidades/horarios/cargos sintéticos
│   ├── integration/                   # SDK, handlers/Auth y transacciones reales
│   └── e2e/                           # Playwright: pedido, tarjeta y personal
├── scripts/
│   ├── bootstrap-manager.ts           # Operación administrada, auditada y protegida
│   └── generate-db-types.mjs          # Tipos desde esquema local migrado
├── .env.example                       # Solo nombres/placeholders futuros
├── .env.local                         # No versionar; aún no configurado
├── .gitignore
├── AGENTS.md
├── next.config.ts
├── next-env.d.ts                       # Archivo generado por Next.js
├── eslint.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── package-lock.json
├── vitest.config.ts                   # Futuro, con pruebas necesarias
└── playwright.config.ts               # Futuro, recorridos completos
```

Mover la página inicial a `(public)/page.tsx` al construir esa etapa; no conservar además `src/app/page.tsx` exponiendo la misma URL. Los recursos demostrativos de la plantilla se revisarán entonces. No se hacen esos cambios ahora.

## 3. Responsabilidades y dependencias permitidas

| Zona | Responsabilidad | Puede depender de |
| --- | --- | --- |
| `app` | Rutas, layouts, metadata, loading/error y adaptación HTTP. Mantener wrappers breves. | Componentes/features, contratos y servicios server apropiados. |
| `features/*/components` | UI de una capacidad, componentes server/client según interacción real. | Contratos, dominio puro y UI común; cliente solo importa actions admitidas, no DAL. |
| `features/*/domain` | Funciones puras y reglas sin efectos: reducer, mensaje, horarios y dinero aplicado. | Contratos/primitivas; sin Next.js, SDK, cookies o Storage del navegador. |
| `features/*/state` | Estado cliente y adaptadores de persistencia con sensibilidad definida. | Dominio/contratos y APIs del navegador, con hidratación tras montar. |
| `features/*/server` | DAL de lecturas, comandos y actions autorizadas del módulo. | SDK server, auth guards, contratos y dominio puro. |
| `contracts` | Entrada/salida pública de operaciones; tipos y esquemas Zod reutilizables. | Primitivas compartidas; no secrets, componentes ni SDK. |
| `components/ui` | Controles compartidos, accesibilidad y estados visuales. | React y helpers puros; sin negocio ni consultas propias. |
| `lib` | Infraestructura concreta compartida: clientes SDK, identidad, env y helpers. | Bibliotecas externas y contratos/primitivas cuando haga falta; no rutas o UI. |
| `supabase/migrations` | Fuente de verdad SQL: tablas, FKs, CHECK, RPC, permisos y triggers. | Migraciones previas; no runtime del navegador. |
| `types` | Tipos de base generados usados en DAL. | Esquema real; los DTO se adaptan antes de salir al cliente. |

La DAL vive dentro de cada feature, no en dos carpetas paralelas que repitan queries. `queries.ts` puede agrupar lecturas, `commands.ts` mutaciones y `actions.ts` exportar Server Actions cuando el módulo las necesite. Aplicar `server-only` a SDK/DAL/env privilegiados; módulos de actions usan `use server` y exportan solo funciones async admitidas. Los DTO de salida no serializan filas completas privadas.

Dependencias entre features son explícitas y acotadas: checkout coordina carrito y WhatsApp; staff coordina customer/loyalty/incidents; business mantiene configuración; retention coordina operaciones estrechas de conservación. No importaciones circulares ni componentes clientes consumiendo comandos SQL. El módulo de fidelización delega contador, premios y concurrencia a RPC: no mantiene otra implementación de saldo en React.

No crear un «repositorio genérico» que permita CRUD de cualquier tabla ni exportar todo mediante un barrel global. Importaciones directas muestran si se cruza la frontera del servidor. Compartir una abstracción cuando exista repetición real, no para anticipar capacidades fuera del MVP.

## 4. Límites servidor/cliente y DRY

| Necesidad | Ubicación única y regla |
| --- | --- |
| Obtener catálogo | DAL pública de catalog; SSR y handler usan la misma consulta `read_catalog`. |
| Validar petición | Contratos/esquemas compartidos; action/handler validan en el servidor aunque UI valide antes. |
| Preparar mensaje | Función pura en whatsapp/domain; recibe datos canónicos y datos locales, sin persistir solicitud. |
| Calcular dinero | Helpers enteros compartidos; no duplicar conversión decimal con float en formularios. |
| Identidad y roles | Helpers server verifican contexto; cada RPC vuelve a comprobar autorización SQL vigente. |
| Otorgar sello/canje | RPC PostgreSQL transaccional; Next.js adapta entrada/salida, no hace read-modify-write. |
| Borrado/restauración | retention/server llama funciones SQL estáticas de lista cerrada; restricciones por entidad del documento 10. |
| Capturar estado del pedido | CartProvider situado en shell público/pedido; no incluir personal ni información privada. |
| Recuperar mutación incierta | Diario staff mínimo, mismo UUID/huella y `get_operation`; no saldo optimista. |
| Guardar imagen | Handler dedicado verifica bytes/permiso y sube; action comercial posterior asocia con revisión. |
| Errores y trazas | `Result`/ErrorCode y observability comunes, sin teléfono, dirección, OTP/JWT o cuerpos. |

DRY no elimina validación en distintas fronteras de confianza: navegador ayuda al usuario, servidor valida la petición y SQL protege invariantes aunque se omita Next.js. Se reutilizan esquemas/helpers donde es posible; contadores y permisos definitivos quedan en SQL.

Los componentes son Server Components por defecto. Marcar `use client` solo en formularios, diálogo, carrito, Clipboard y estados de interacción. Un provider cliente puede envolver children server sin convertir su lectura en consulta del navegador. No hacer HTTP de un Server Component a una API local propia.

El cliente publicable de Supabase no comparte Auth/cookies; el SSR server se crea por petición. Browser SDK se limita a Auth/operaciones permitidas, sin grants directos a tablas. El cliente admin secreto se reserva para Auth administrado y nunca se usa para consultar todas las tarjetas o acreditar sellos.

## 5. Layouts, acceso y manejo de estado

El root layout comparte documento y estilos. `(public)` no consulta sesión y contiene carrito sin registro. `(customer-access)` permite OTP/activación sin heredar protección de `(customer)`. `(staff-access)` permite login/recuperación y verifica el contexto mínimo específico de MFA/restablecimiento, sin exigir AAL2 antes de obtenerlo.

`(customer)` exige identidad telefónica propia; `(staff)` exige staff vigente/AAL2; `(admin)` además manager. Los layouts mejoran navegación, pero queries/actions/handlers/RPC repiten sus comprobaciones. Proxy refresca cookies en rutas privadas; no sustituye autorización.

Publicar `/personal/mfa` dentro del grupo protegido de staff causaría una dependencia circular de acceso: necesitar MFA para llegar al desafío. La separación del árbol evita ese error y también deja activación de tarjeta fuera del guard de perfil ya activado.

El borrador tiene una única definición lógica en memoria y serializadores separados: productos sin PII en localStorage; checkout/indicaciones en sessionStorage; respuestas canónicas en memoria. No guardar tokens de Auth, tarjetas ajenas o mensajes completos en el store del carrito. `hadInstructions` fuerza revisión si se perdió el texto, y no se fusionan líneas sin confirmarlo.

Para privado, no-store y limpieza al cerrar sesión. No crear caché compartida de perfiles ni activar `cacheComponents` en esta estructura inicial. Imágenes con rutas versionadas pueden usar caché de assets. Mostrar errores funcionales en la vista y reservar boundaries para fallos inesperados.

## 6. SQL, tipos y pruebas futuras

Migraciones numeradas por timestamp en `supabase/migrations`, con esquemas/tablas primero y FKs/índices/funciones después. FKs de soft delete se añaden después de existir staff; restricciones de eventos/premios después de crear ambas tablas. Cada función se crea y restringe sin una ventana de ejecución por PUBLIC. No modificar tablas administradas de Auth/Storage.

`seed.sql` carga referencias comerciales estables sin inventar verificaciones, usuarios reales o secretos. Fixtures sintéticas se reservan para tests/entorno local. `generate-db-types.mjs` producirá tipos de public/app_private cuando exista el esquema; tener tipos privados no concede acceso a Data API. Revisar diff de tipos y contratos en cada migración.

Pruebas unitarias pertinentes pueden colocarse junto a la lógica pura con sufijo `.test.ts`/`.test.tsx`, sin crear una carpeta paralela que replique todo `src`. Casos centrales: reducer/persistencia sensible, cálculo entero, opciones, mensaje, vigencia de validación e instrucciones perdidas. No escribir tests que solo repitan la implementación.

`supabase/tests` verifica grants/RLS/RPC y reglas de conservación; integration prueba Auth/SDK y concurrencia en base real; e2e verifica invitado, tarjeta y personal. Simular funciones no demuestra un canje único bajo concurrencia. Los datos de ensayo nunca contaminan tarjetas productivas.

Bootstrap de manager es script administrado, sin endpoint público, credenciales literales o roles otorgados por metadata del visitante. No crear scripts para purgar historial ni resolver PT-13 sin cerrar sus condiciones de negocio.

## 7. Orden de adopción y comprobación

1. E1: contratos, SDK por contexto, env server/client y autorización; mover wrappers a grupos sin duplicar URLs.
2. E2: migraciones, RLS/RPC, seed, tipos y soft delete de documento 10.
3. E3–E5: catálogo, mantenimiento, carrito, checkout y WhatsApp; datos personales locales.
4. E6–E8: identidad cliente, tarjeta, staff, incidencias, conservación y contingencias; PT-13 condiciona su resolución específica.
5. E9: recorridos completos, revisión comercial y piloto con flags.

Aceptar la estructura cuando las 20 páginas y seis handlers del [mapa de navegación](12-flujo-navegacion.md) tengan una sola ubicación, acceso/MFA no estén bajo guards incompatibles y los imports cliente no incluyan DAL/secrets. Revisar alias TypeScript, permisos vigentes y límites de módulos antes de construir.

Este árbol no exige nuevas capas como ORM, backend separado, Realtime, Edge Functions, colas, campañas o POS. Los cuatro documentos nuevos completan el diseño; las carpetas, contratos y pruebas aquí propuestos se crearán en sus etapas de implementación.
