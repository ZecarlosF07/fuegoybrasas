# H7 — Administración y operación

**Fecha:** 11 de octubre de 2026. **Estado:** implementación y verificación técnica terminadas, migraciones remotas aplicadas. Aceptación humana/operativa pendiente; no se declara capacitación, piloto ni publicación del programa.

## Alcance construido

- Panel `/administracion`: clientes registrados, progreso próximo al premio, premios pendientes, incidencias y actividad por periodo; filtros paginados exclusivos del responsable.
- `/administracion/clientes/[id]`: historial completo paginado, actor/fechas/referencias, corrección expresa de nombre/indicaciones y reversión de sello. Canje afectado conserva saldo y registra revisión.
- `/administracion/incidencias`: consulta, cierre ordinario, retiro/restauración de casos closed y restitución supervisada por falta de entrega; mismo premio y saldo, canje original inmutable.
- `/administracion/personal`: invitación Auth real por etapas, cuenta parcial inactiva, conciliación de respuesta perdida, roles, retirada y restauración sin reactivar. Último responsable protegido.
- Recuperación presencial con comprobante/historial y rotación de clave; acceso antiguo inválido, sin duplicar tarjeta ni cambiar progreso. Enlace/QR solo por respuesta expresa, nunca diario, recibo o capturas.
- Conciliación de compras presenciales pagadas/entregadas durante caídas, solo manager con fecha real y referencia obligatoria. Misma transacción de crédito, sin edición de eventos.
- Sin baja de clientes/tarjetas por decisión expresa del propietario. Metadatos SQL previos conservados; operaciones denegadas. Sin purgas ni baja Auth.

## Decisiones y contratos

[DC-12–15 y contratos](../../../diseno-tecnico/17-administracion-y-operacion-h7.md): panel autorizado, premio restituido al confirmar no entrega, recuperación/contingencia por administrador y exclusión de baja de clientes. No hay SMS, ventas registradas ni campañas nuevas. Diez visitas/Mostrito⅛/WhatsApp conservados.

Las propuestas iniciales no se tomaron como aprobación: se implementaron las excepciones después de recibir respuestas. PT-11 conserva textos/plazos de privacidad para lanzamiento; autorizados reales, recuperación de MFA, SMTP productivo y respaldos contratados requieren preparación H8/PT-08/PT-12.

## Entornos y resultados

Windows, Node 22.16, Yarn 1.22.22, Next 16.3.8. Desarrollo habitual remoto geazxsvjkqpzbghlywbw; fixtures SQL/Auth/correo/navegador estrictamente locales y sintéticas, con guardas de loopback. Ninguna prueba destructiva se ejecuta en remoto.

| Comprobación | Resultado actual |
| --- | --- |
| Reconstrucción local | Migraciones H7 aplicadas y seed reconstruido; cada ajuste SQL posterior usa migración nueva. |
| SQL | 124 comprobaciones, ocho archivos aprobados. |
| Integración | 112 casos / 16 archivos aprobados en verificación final, incluido backup y caso de incidencia ligado al canje exacto con timestamps iguales. |
| Unitarias | 114 casos / 24 archivos aprobados en verificación final. |
| Navegador | 49 casos distintos aprobados: regresión H1–H6 (38), H7 (9) y caída de catálogo (2); véase ejecución por etapas abajo. |
| Lint/tipos/build | Lint completo aprobado; lint adicional de los tres archivos de backup aprobado. Typecheck y builds local/remoto aprobados. |
| Servidor/cliente | `yarn test:boundary` rechaza importar infraestructura privada desde componente cliente. |
| Secretos | `yarn check:secrets`: 46 recursos estáticos de build remoto sin claves secretas configuradas. No es auditoría universal de secretos. |
| Restauración | `pg_dump`/`pg_restore` reales en otra base local; 18 tablas, Auth/ACL, contador/premio, pausa y conciliación/replay conservados. |
| Remoto | Destino/historial/dry-run verificados; siete migraciones H7 aplicadas. 22 migraciones y 18 tablas; cero clientes/eventos, ACL restringidas y bandera pública false en consulta posterior. |

Resultados y hashes en [verificacion.json](verificacion.json); consulta remota agregada en [remote-check.json](remote-check.json). Base HEAD `86e156a4215329090b973c0c295fecf889881431`, árbol con cambios de H1–H7 sin commit/PR solicitados. Los hashes identifican el contenido probado; HEAD por sí solo no representa la versión actual.

### Ejecución y trazabilidad

- `yarn test:db`: ocho archivos / 124 pgTAP, incluidas 14 comprobaciones H7; migra/reconstruye solo local.
- `yarn test:integration`: 112/16; `management.test.ts` (10), `management-staff.test.ts` (5), `management-exceptions.test.ts` (6) y 90 de regresión. `management-backup.test.ts`: 1/1 incluido.
- `yarn test`: 114/24. Lint completo y `yarn typecheck` aprobados; lint adicional de backup después de añadir el ensayo.
- `yarn test:e2e` compiló y aprobó 42 casos, falló en una expectativa textual antigua y dejó seis sin ejecutar. La denegación del mozo funcionaba; el test esperaba «Acceso restringido» cuando el componente muestra «Acceso no disponible». La suite ya había cargado su versión anterior al corregirla. Se ejecutó `yarn playwright test --project=management --no-deps` sin editar archivos durante la ejecución: **9/9**, y `--project=catalog-failure --no-deps`: **2/2**. La regresión anterior tiene **38 casos distintos** aprobados en el mismo código de aplicación. Después de reforzar SQL se repitieron fidelización (8/8) y H7 (9/9). Una selección conjunta con --no-deps inició ambos proyectos en paralelo y chocó al activar el programa compartido: fue un fallo de preparación, corregido ejecutando H7 por separado con --workers=1. Las dependencias de la suite completa ya serializan esos proyectos. El total 49 se obtiene por proyectos, no se afirma una única ejecución completa verde.
- CLI verificó proyecto `geazxsvjkqpzbghlywbw`, historial y `db push --linked --dry-run`, después `db push --linked`; consultas `db query --linked --file ... --output json` solo agregados. `yarn db:types` regeneró tipos desde remoto y `yarn build` terminó con su configuración habitual.
- `yarn test:boundary` y `yarn check:secrets` aprobados tras el build remoto; desarrollo habitual no cambia a Supabase local.

| Criterios | Evidencia principal |
| --- | --- |
| CA-33 / CT-07–09; H7-RT01–04 | Integración `management.test.ts`: 10→9, premio voided oculto restaurado con mismo UUID, canje afectado en review_required, concurrencia/replay. E2E corrección y respuesta perdida. |
| CT-24/35; H7-RT05–11 | Historial paginado, revisión/solicitud de perfil, auditoría mínima, conservación protegida, baja customer/card denegada, integridad local/remota. |
| CT-11/12/38; H7-RT12–13 | SQL/H2 regresión, `management-staff.test.ts`, Auth local real/invitación/MFA E2E; última cuenta protegida, parcial inactiva, restauración inactiva. SMTP productivo no probado. |
| DC-13 / H7-RT16 | `management-exceptions.test.ts`: restitución y canje posterior mismo UUID, actor no autorizado, doble restitución concurrente y caso antiguo rechazados; E2E restitución desde incidencia. |
| DC-14 / H7-RT14/17 | Integración y E2E recuperación presencial/rotación, pruebas de presencia/historial, clave anterior inválida; contingencia fecha real/referencia/replay/duplicado/futuro. |
| CT-23/25/28; H7-RT18–20 | Diario sin datos sensibles, respuesta perdida/recarga con único efecto y ensayo de continuidad desde backup con conciliación del canje posterior. |
| DC-12 / H7-T15 | Dashboard/listado/filtros paginados con fechas peruanas, manager/AAL2 y denegación al mozo por URL/RPC. Canjes digitales no se presentan como ventas ni entrega física. |

## Hallazgos corregidos

- La expectativa E2E decía Sello revertido y el texto vigente es Sello corregido; se corrigió la prueba, manteniendo el comportamiento.
- Correo largo del editor de personal desbordaba móvil; título ahora divide el texto. Revisión repetida aprobada en los cinco anchos y axe.
- Historial y proyección de tarjeta admiten reward_reinstated sin fallo de DTO. Restitución solo junto a evento autorizado; original canje protegido.
- Incidencia antigua no devuelve un canje posterior del mismo premio: se añadió migración nueva 060 que fija source_event_id al abrir el caso y usa ese canje exacto al restituir. Protege también timestamps iguales/invertidos por inicio de transacciones; no depende de ordenar fechas o UUID. Integración verifica dos canjes/casos dentro de una misma transacción, sin doble restitución. Índice y locks conservan efecto único.
- Vitest aislado falló al leer caché temporal del sandbox antes de cargar suites; ejecución autorizada fuera de ese aislamiento pasó. No se atribuyó el fallo de entorno a la aplicación ni se declararon suites no cargadas como aprobadas.

## UX/UI y revisión pendiente

Skill ui-ux-pro-max, MASTER y sistema canónico vigentes. Consulta inicial admin dashboard actionable metrics sin resultados; retry data table filtering devolvió Table Handling/Web (fichas móviles) y Bulk Actions (descartado: cada intervención exige contexto/motivo). Server actions authorization/nextjs devolvió validar y autorizar Actions, comprobado con guías instaladas Forms/Data Security/Link. No se impuso una plantilla ni una paleta nueva.

Veinte [capturas sintéticas](capturas/resumen-360.png), cuatro vistas por cinco anchos: 360/390/768/1280/320. Axe con reglas WCAG 2/2.1/2.2 A/AA sin violaciones en esas vistas y anchos; reflujo sin scroll horizontal involuntario. Error de periodo enfocado y feedback accesible comprobados en E2E. Inspección visual directa de resumen móvil, personal móvil e historial/corrección escritorio: etiquetas/consecuencias legibles, correo largo sin desbordamiento y marca canónica conservada. No hay capturas del enlace/QR de recuperación ni trazas Auth. Los emails/contactos visibles son generados sintéticamente. Teclado integral, Narrador y zoom real permanecen pendientes; reflujo/axe no los sustituyen ni certifican accesibilidad o dispositivos físicos.

## Continuidad y aceptación

[Continuidad](continuidad.md) documenta el ensayo SQL/Auth aislado aprobado y el inventario restante: roles en otro clúster, MFA operativo, configuración/secretos y bytes Storage. Capacitación, personal real, revisión humana y piloto siguen pendientes; H8 debe prepararlos y comprobar servicios/producto antes de lanzamiento. PT-13 resuelto; PT-08 conserva autorizados/MFA reales, PT-11 condiciones/aviso/plazos y PT-12 cobertura contratada.

H7 no se acepta íntegramente por pasar pruebas automáticas: faltan evidencias manuales/operativas según el [hito](../../07-hito-7-correcciones-y-operacion.md). H6 conserva revisión humana pendiente; la sesión de preparación expiró y se reconstruyó exclusivamente la base local antes de H7, sin confundir ese timeout con una prueba funcional aprobada.
