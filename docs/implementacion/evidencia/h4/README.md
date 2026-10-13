# H4 — Evidencia de implementación

**Revisión:** 8 de octubre de 2026.  
**Estado:** mantenimiento del catálogo implementado, verificación técnica aprobada y migraciones aplicadas al Supabase remoto. Aceptación manual y preparación con personal/datos comerciales reales pendientes.  
**Referencia:** [Hito 4](../../04-hito-4-administracion-del-catalogo.md), [guía](../../hitos-del-proyecto.md), [contratos y operación](operacion.md).  
**Versión verificable:** árbol de trabajo sobre `86e156a4215329090b973c0c295fecf889881431`, sin commit ni despliegue del sitio solicitados. Sistema visual canónico 1.0; especificación H4 1.2.

## Resultado

- `/administracion/carta` para responsable activo con MFA: categorías, productos, precios por modalidad, promociones, grupos y opciones. Creación, borradores, publicación, disponibilidad, fotografías, retiro y restauración con campos y estados explícitos. Atención no puede acceder al mantenimiento.
- Seis RPC de edición acotadas, creación con tipo cerrado y lectura privada validada. Servidor y SQL comprueban permisos actuales; RLS y grants impiden CRUD directo. No se habilitan endpoints de edición pública ni se utiliza clave privilegiada para modificar filas comerciales.
- `content_verified` confirma porción/inclusiones y se invalida al editar contenido o restaurar. Precios y composición de opciones requieren reconfirmación; la fuente comercial no se transforma en confirmación automática. P05 conserva la confirmación existente, C01 sigue excluido y las 27 referencias afectadas por PT-05 permanecen en borrador.
- Revisión optimista, propagación de revisiones hijas, bloqueo ordenado, UUID/hash por operación y auditoría/recibo atómicos. Reintentos no duplican efectos; no-op conserva revisión y no genera auditoría de cambio, incluidas fechas con formato equivalente.
- Retiro con motivo y autor derivado del servidor, sin DELETE físico ni pérdida de claves/FK. Restauración con flags seguros y revisión de rama; no republica contenido ni reactiva automáticamente precios, promociones u opciones.
- Handler Node para JPEG/PNG/WebP reales, límites de archivo/cuerpo/dimensiones, decodificación completa y reencodificación sin EXIF. Bucket público `catalog-media`, namespace por artículo y UUID nuevo, sin overwrite/upsert de navegador. Subida y asociación SQL son efectos separados.
- Consulta de subida incierta y limpieza controlada con reserva auditada. Referencias vigentes o retiradas recuperables impiden eliminar el archivo. La reserva y la asociación se serializan; eliminación Storage sucede fuera de SQL y permite repetir la misma operación.
- Formularios conservan entrada ante conflicto, muestran errores con foco y requieren consulta de recibo ante respuesta perdida. Journals mínimos por sesión, sin texto comercial, motivo, archivo ni credenciales; las acciones reales muestran carga contextual y evitan doble ejecución.
- Reutilización de campos, botones, feedback y layout privado; SelectField compartido. Módulo por dominio, lógica pura, schemas y tipos separados, Tailwind y componentes pequeños. Fechas/días del editor se presentan en Lima y precios en soles.

## Entornos y resultados

Windows, Node 22.16.0, Yarn 1.22.22, Next 16.3.8, React 19.2.8, TypeScript 5.9.3, Tailwind 4.3.3, Supabase SDK 2.117.2 / SSR 0.12.7 / CLI 2.119.0 y Sharp 0.35.5. Pruebas destructivas exclusivamente en PostgreSQL 17/Auth/Storage local; navegador Chrome sin ventana contra build de producción en puerto 3100. Desarrollo habitual conectado al Supabase remoto autorizado.

| Comprobación | Resultado obtenido |
| --- | --- |
| Reconstrucción | `yarn db:reset` aplicó desde cero las nueve migraciones acumuladas. Tipos finales generados mediante `yarn db:types` desde el remoto. |
| PostgreSQL | `yarn test:db`: **57 aprobadas**, cuatro archivos. Incluye 13 de H4: confirmación, ACL/RLS, funciones restringidas y políticas/límites Storage; regresión H1–H3. |
| Dominio/componentes | `yarn test`: **56 aprobadas**, 13 archivos. Incluye diez de H4: dinero exacto, Lima/días, publicación, journal mínimo, JPEG/PNG/WebP reales, MIME falso, truncamiento, dimensiones, bytes y stream sin longitud fiable. |
| Integración | `yarn test:integration`: **58 aprobadas**, ocho archivos. Incluye 14 de administración y cinco de Storage H4 con PostgreSQL/Auth/MFA/Storage reales, permisos actuales, publicación, replay/concurrencia, conflicto, no-op, confirmación, propagación, conservación y carrera asociación/limpieza. |
| Navegador | `yarn test:e2e`: **24 aprobadas**, regresión completa H1–H4. Cuatro recorridos H4: publicación y reflejo público, editor antiguo y respuesta perdida tras commit, handler/subida/asociación/limpieza reales, retiro/restauración segura. Se ejecutan después de core y antes de los dos fallos públicos de H3. |
| Accesibilidad automática | Axe sin violaciones en el editor comprobado en 360/390/768/1280 y 320 px. Foco en resumen de error, etiquetas, teclado, orden de tabulación y reflujo 640 px comprobados en el alcance. |
| Código/compilación | `yarn lint`, `yarn typecheck`, build local de E2E y **`yarn build` remoto aprobados**. Tipos strict desde esquema remoto; rutas de administración y handler incluidos. |
| Frontera de servidor | `yarn test:boundary`: Next rechaza infraestructura `server-only` importada desde Client Component. |
| Secretos | `yarn check:secrets`: **33 recursos estáticos** de producción sin secretos locales/remotos. No se guardaron OTP, claves, cookies ni trazas de autenticación en capturas. |
| Supabase remoto | Dry-run mostró exactamente las dos migraciones H4; push y comprobación posterior aprobados en `geazxsvjkqpzbghlywbw`. Resultado detallado abajo. |
| Documentación/estructura | Ocho documentos revisados sin enlaces locales rotos; 51 archivos TSX propios dentro del límite de 170 líneas. `git diff --check` sin errores de formato. |

La aceptación técnica no equivale a aceptación del propietario ni a lanzamiento público.

Se corrigieron durante la verificación una transición de colores que reducía el contraste al rehabilitar botones y una colisión de dos versiones nativas de Sharp en el servidor de producción. Los botones mantienen los colores de su variante al deshabilitarse; Sharp está fijado a la misma versión usada por Next. Las pruebas finales comprobaron el handler real, sin sustituir la validación de imágenes por un mock. Se corrigió además el selector del test de conflicto para distinguir el resumen del formulario del anunciador de rutas de Next.

## UX/UI y marca

Se aplicó `ui-ux-pro-max`, MASTER y el [sistema visual canónico](../../../../.agents/brand/sistema-visual.md), conservando la fuente única de tokens y las primitivas existentes.

| Consulta ejecutada | Resultado y decisión |
| --- | --- |
| `restaurant catalog admin forms` / `--design-system` | Minimalism & Swiss Style con claridad/jerarquía y bajo costo visual aprovechables. Hero/Features/CTA, paleta azul/naranja y fuentes alternativas no encajan con este editor ni la marca; descartadas. |
| `restaurant inventory management dashboard` / `--design-system` | Reintento: Flat Design, pero showcase/promoción y fuentes académicas siguen sin encajar. Se mantiene composición propia del panel, no se atribuye su layout a esa plantilla. No se persiste ni reemplaza MASTER. |
| `error summary validation` / `--domain ux -n 2` | Focusable Error Summary y Error Messages: resumen con foco después de enviar, enlaces a campos y errores anunciados. Aplicados mediante FormFeedback compartido y ayudas junto a controles. |
| `forms server actions validation` / `--stack nextjs -n 2` | Server Actions/validación de entrada, comprobadas contra las guías instaladas: formularios validados, autorización de cada mutación y errores explícitos. |

Se revisaron `quick-reference.md` y `pro-rules.md` de la skill. La composición propia utiliza selector plegable de categorías/productos, editor y elementos relacionados; cambia a una columna en móvil. Guardar y publicar son decisiones distintas; subir/asociar y restaurar/reactivar se explican por separado. La confirmación de retiro identifica el registro, consecuencia y motivo. Filtros locales y enlaces de navegación no generan loading; guardado, recarga, consulta y fotos sí.

Capturas de pruebas sintéticas en [capturas](capturas/): editor en cinco anchos, [publicación denegada](capturas/publicacion-denegada.png), [conflicto](capturas/conflicto.png), [foto subida sin asociar](capturas/foto-subida.png), [retiro](capturas/retirado.png) y [restauración](capturas/restaurado.png). Se inspeccionaron visualmente editor de 390 y 1280 px: controles y acciones refluyen y conservan jerarquía. Contraste de los pares efectivamente renderizados comprobado mediante axe, incluyendo botones rehabilitados tras una operación. No se agregaron colores, fuentes ni estilos CSS propios.

**Pendiente manual:** lector de pantalla real, zoom real del navegador y dispositivos físicos del personal; revisión de fotografías originales y aceptación del propietario. Reflujo/axe y capturas no sustituyen esas pruebas. La pestaña existente del navegador integrado no se controló: su selección fue rechazada por política de URL; la evidencia procede del entorno automatizado local de pruebas y de sus PNG guardados.

## Resultado remoto

Proyecto `geazxsvjkqpzbghlywbw`. Migraciones añadidas: `20261008004000_catalog_admin.sql` y `20261008005000_catalog_media.sql`; total acumulado **nueve**. No hubo reset, reparación de historial, fixtures ni cuentas sintéticas en remoto. H4 reutiliza las diez tablas propias ya existentes; Auth/Storage siguen administrados por Supabase.

Comprobación mediante [h4-readonly.sql](../../../../supabase/checks/h4-readonly.sql), sin datos personales ni secretos:

- Seis tablas comerciales y ocho RPC comerciales nuevas restringidas, además de conservación/recibos ampliados y operaciones de fotografía.
- 29 referencias fuente, un artículo publicado y un contenido confirmado: P05. 28 borradores en total, incluido C01 excluido de venta online y 27 entradas pendientes.
- Editor anónimo denegado y escritura directa autenticada en `catalog_items` denegada.
- Bucket público `catalog-media`, máximo 3.145.728 bytes y MIME JPEG/PNG/WebP; dos políticas específicas, lectura interna e INSERT autorizado. Ninguna política de overwrite/eliminación para sesiones de navegador.
- `ordering_enabled=false` y `loyalty_enabled=false`. H4 no activa capacidades futuras.

`yarn dev`, `yarn build` y `yarn start` utilizan `.env.remote.local` y no necesitan Docker. Los scripts locales se reservan a pruebas. Las migraciones quedan versionadas en `supabase/migrations`; una corrección posterior se añade como nueva migración. Las credenciales continúan ignoradas por Git y no aparecen en este reporte.

## Trazabilidad y cierre

| Requerimientos/escenarios | Evidencia principal |
| --- | --- |
| H4-RT01–RT11, RF01–RF05; CT-03/15/16/39 y CA-10/18 | `tests/integration/catalog-admin.test.ts`, pgTAP H4 y regresión de proyección pública H3. Permisos, patches cerrados, publicación, comparación, disponibilidad, versión e idempotencia. |
| H4-RT12–RT14, RF06; CT-20/36 | `media.test.ts`, `catalog-media.test.ts` y recorrido real de handler en `catalog-admin.spec.ts`. Decodificación/límites, Storage JWT/MFA, asociación y limpieza segura. |
| H4-RF07–RF10; conservación del documento 10 | Integración por entidad, motivos, UUID retenido, bloqueo de padres, replay de retiro/restauración, reserva de imágenes retiradas y E2E de restauración. |
| H4-RT15–RT18, RF09–RF11; mecanismo de CT-28 | E2E de conflicto/abort tras commit, recibo único, journal mínimo, axe/teclado/capturas y controles de carga. Casos manuales pendientes arriba. |

H4-T01–T10 tienen implementación y evidencia técnica. H5 puede construir el carrito sobre el catálogo mantenible y sus revisiones; una nueva validación deberá detectar cambios de precio, retirada o agotamiento antes de preparar WhatsApp. H4 conserva pedido invitado futuro, WhatsApp 982 042 493 y regla de diez sellos sin añadir pedidos ni fidelización.

PT-05 continúa bloqueando publicación de datos comerciales incompletos; PT-09 bloquea utilizar originales sin autorización. PT-08 y preparación real de personal/SMTP/CAPTCHA de H2 siguen pendientes: no se generó una identidad real ni se concedió rol por inferencia. PT-11 y PT-13 se resolverán en su alcance de operación/fidelización, sin purgas ni restituciones inventadas en H4.
