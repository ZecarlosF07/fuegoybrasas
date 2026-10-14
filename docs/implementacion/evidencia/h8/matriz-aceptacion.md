# Matriz de aceptación H8

**Actualización DC-22:** [personal sin MFA](personal-sin-mfa/README.md) sustituye la exigencia de segundo factor. Evidencia previa conserva su fecha; el preflight actual ya no exige ADMINISTRATOR_MFA.

**Base:** [RF/CA/CT vigentes](../../../diseno-tecnico/08-pruebas-y-aceptacion.md), DC-11 acceso sin SMS y DC-12–19. **Resultado de comandos:** [reporte H8](README.md). «Local aprobado» significa fixtures/mocks según el nivel; nunca servicio productivo o piloto aprobado.

## RF-01–RF-18 y criterios funcionales

| Requisito | CA vinculados | Fuente de pruebas / condición restante |
| --- | --- | --- |
| RF-01 | 01,02 | [Catálogo][catalog] y [navegación pública][catalog-e2e]; piloto de visitante pendiente. |
| RF-02 | 02,03,36 | pgTAP H3/H8; 29 fuentes, C01 excluido, porciones 4/16, 17 publicados y 11 incompletos. |
| RF-03 | 10,18 | [Catálogo][catalog], [administración][catalog-admin]; comparación confirmada y cambios de versión. |
| RF-04 | 11,12,17,18 | [Pedido][checkout] y [configuración][checkout-db]. |
| RF-05 | 04,05 | [Carrito][cart] y [Pedido][checkout]; opciones obligatorias/canonización. |
| RF-06 | 06,07,08 | [Carrito][cart] y [Pedido][checkout]; líneas, cambios y dock. |
| RF-07 | 09,10,15,16 | [Carrito][cart], validador de pedido y [configuración][checkout-db]. |
| RF-08 | 13–17,36 | [Pedido][checkout] y [configuración][checkout-db]; pagos reales siguen pendientes. |
| RF-09 | 20,21 | Constructor de WhatsApp y [Pedido][checkout]; recepción real pendiente. |
| RF-10 | 07,12,21,22 | [Pedido][checkout]; persistencia/retorno y fallback, retorno móvil real pendiente. |
| RF-11 | 22 | [Pedido][checkout]; portapapeles denegado/texto seleccionable. |
| RF-12 | 23,24 | [Clave privada][access] y [Tarjeta][card-e2e]; cliente sin SMS. |
| RF-13 | 24,27,32 | [Fidelización][loyalty] y [Tarjeta][card-e2e]. |
| RF-14 | 25 | [Clave privada][access] y [Tarjeta][card-e2e]; preferencias explícitas. |
| RF-15 | 26,31 | pgTAP H2/H6/H7, [Permisos][permissions] y [Fidelización][loyalty]. |
| RF-16 | 27–30 | [Fidelización][loyalty]; conexiones distintas y [Tarjeta][card-e2e]. |
| RF-17 | 33 | [Excepciones][exceptions] y [Administración][management-e2e]; entrenamiento pendiente. |
| RF-18 | 17–19,22,23,32,34–36 | Pruebas de fallos/E2E/axe; [revisión humana][pilot] pendiente. |

## CA-01–CA-36

| CA | Comprobación disponible | Estado de aceptación |
| --- | --- | --- |
| 01 | Visitante sin Auth compra/prepara; checkout E2E. | Local aprobado; piloto pendiente. |
| 02 | Inventario 24+5 y C01 fuera de web, pgTAP H3. | Local aprobado; publicación deliberada solo de datos completos. |
| 03 | Alitas 4/16, pgTAP H3. | Local aprobado. |
| 04 | Agregado simple con aviso sin redirección obligatoria. | Unitario/E2E aprobado. |
| 05 | Opciones obligatorias y precio seleccionado. | Unitario/integración/E2E aprobado. |
| 06 | Agrupar iguales, distinguir indicaciones/opciones. | Unitario/E2E aprobado. |
| 07 | Cantidades/edición/borrado conservan líneas/importes. | Unitario/E2E aprobado. |
| 08 | Dock y contador solo con artículos. | Unitario/E2E aprobado. |
| 09 | Cálculo entero de subtotal y combinaciones comerciales. | Unitario aprobado; revisar carta real en piloto. |
| 10 | Comparación P05 validada, no comparaciones inventadas. | Unitario/integración aprobado. |
| 11 | P05 sin leyenda retirada, rechaza recojo. | Unitario/integración aprobado. |
| 12 | Modalidad conserva borrador y señala incompatibles. | Unitario/E2E aprobado. |
| 13 | Entrega exige dirección; recojo la omite. | Unitario/E2E aprobado. |
| 14 | Opcionales vacíos no bloquean ni se incluyen. | Unitario/E2E aprobado. |
| 15 | Cargos/total desconocidos permanecen pendientes. | Unitario/E2E aprobado. |
| 16 | Tarifa sintética conocida calculada sin publicarla. | Unitario/integración/E2E aprobado. |
| 17 | Zona excluida bloquea entrega, permite revisión. | Integración/E2E aprobado. |
| 18 | Precio/versión/disponibilidad cambiados requieren revisión. | Integración/E2E aprobado. |
| 19 | Horario confirmado sintético cerrado conserva borrador. | Unitario/integración aprobado; horario real pendiente. |
| 20 | URL/número/texto íntegro de WhatsApp. | Local aprobado; recepción por Roberto pendiente. |
| 21 | Retorno conserva borrador sin venta confirmada. | E2E aprobado; retorno en teléfono real pendiente. |
| 22 | Copia denegada/texto seleccionable/expiración. | Unitario/E2E aprobado. |
| 23 | Fallo de tarjeta independiente del invitado. | E2E aprobado. |
| 24 | Clave propia, ajena/inválida, sin escritura cliente. | SQL/integración/E2E aprobado; QR físico pendiente. |
| 25 | Preferencia explícita, no sobrescritura automática. | Unitario/integración/E2E aprobado. |
| 26 | Personal con MFA, pagado **y entregado**. | SQL/integración/E2E aprobado; preparación real pendiente. |
| 27 | Umbrales 9/10/11/20, premio separado. | Integración/E2E aprobado. |
| 28 | UUID/referencia/reintento no duplica. | SQL/integración/E2E aprobado. |
| 29 | Visitas concurrentes acumulan ambas. | PostgreSQL con conexiones distintas aprobado. |
| 30 | Canje concurrente único. | PostgreSQL con conexiones distintas aprobado. |
| 31 | Canje gratuito sin nueva compra, cero sello. | Integración/E2E aprobado. |
| 32 | Agotado/pausa conserva derechos/progreso. | Integración/E2E aprobado. |
| 33 | Corrección auditada y restitución supervisada, historial. | Integración/E2E aprobado; capacitación pendiente. |
| 34 | Axe/teclado/foco/estados textuales. | Automático aprobado; Narrador/zoom real pendientes. |
| 35 | Reflujo/dock/fotos ausentes. | Automático aprobado; revisión manual de controles/zoom pendiente. |
| 36 | Proyección pública oculta estimados/incompletos. | SQL/integración/E2E aprobado. |

## CT-01–CT-39

| CT | Prueba principal | Resultado / límite |
| --- | --- | --- |
| 01 | [Fidelización][loyalty] | Rechaza falta de pago o entrega, aprobado. |
| 02 | [Fidelización][loyalty] | Cancelación previa sin acreditación, aprobado por falta de entrega. |
| 03 | [Fidelización][loyalty], operaciones de personal | UUID con entrada distinta rechazado. |
| 04 | [Tarjeta][card-e2e], [Administración][management-e2e] | Pérdida/reload/consulta/replay aprobado. |
| 05 | [Fidelización][loyalty] | Referencia duplicada rechazada. |
| 06 | [Fidelización][loyalty] | Veinte sellos/dos premios aprobado. |
| 07 | [Fidelización][loyalty], [Excepciones][exceptions] | Reversión/restauración mismo ordinal aprobado. |
| 08 | [Excepciones][exceptions] | Incidente conserva canje/saldo, aprobado. |
| 09 | [Excepciones][exceptions] | Una reversión por evento, aprobado. |
| 10 | [Permisos][permissions], [Clave privada][access] | Metadata/actor no eleva permisos, aprobado. |
| 11 | [Permisos][permissions] | AAL1/inactivo rechazados incluso SDK, aprobado. |
| 12 | Operaciones/personal y management-staff | Último administrador concurrente protegido, aprobado. |
| 13 | [Clave privada][access] | Alta concurrente por clave sin Auth, aprobado. |
| 14 | [Clave privada][access] | Colisión/clave ajena/teléfono sin autorización, aprobado. |
| 15 | [Administración de carta][catalog-admin] | Revisión vieja rechazada, aprobado. |
| 16 | [Catálogo][catalog], [Administración de carta][catalog-admin] | Publicación incompleta rechazada. |
| 17 | [Pedido][checkout] | Revalidación obligatoria, aprobado. |
| 18 | [Pedido][checkout] | Storage bloqueado/corrupto/edición otra pestaña, aprobado. |
| 19 | [Tarjeta][card-e2e], sesión privada | `no-store` y sesiones separadas locales aprobados; CDN productivo pendiente. |
| 20 | Storage media/integración y editor E2E | Tipos/límites/rol protegidos, aprobado. |
| 21 | [Pedido][checkout], constructor WhatsApp | Texto largo/copia denegada sin truncar, aprobado local. |
| 22 | Catálogo/schedule unitarios | America/Lima y medianoche, aprobado. |
| 23 | [Excepciones][exceptions], [Administración][management-e2e] | Fecha real/referencia/UUID de contingencia, aprobado. |
| 24 | Fidelización, SQL H6/H7 y preflight | Balance/ordinal/historial coherentes; cero diferencias oficiales. |
| 25 | [Restauración H7][backup] | Pausa/conciliación de canje posterior, aprobado aislado; recovery productivo pendiente. |
| 26 | Telemetry unitario, inspección de bundles/repositorio | Allowlist sin cuerpos/errores/PII, aprobado; logs hosting reales pendientes. |
| 27 | [Catálogo][catalog], pgTAP H3/H8 | CRUD denegado/DTO confirmado, aprobado. |
| 28 | [Tarjeta][card-e2e], [Administración][management-e2e] | UUID/identidad/permisos vigentes, aprobado. |
| 29 | [Fidelización][loyalty] | Locks/pausa/stock con conexiones distintas, aprobado. |
| 30 | [Clave privada][access], [Tarjeta][card-e2e] | Contacto conserva identidad/progreso/premios, aprobado. |
| 31 | [Clave privada][access] | Sin clave/colisión/revisión vieja rechazados. |
| 32 | [Clave privada][access] | Términos/pausa bajo bloqueo, sin fila parcial. |
| 33 | [Pedido][checkout] | Indicaciones no recuperadas exigen revisión, aprobado. |
| 34 | Validador/hooks de carrito | Respuesta vieja/plazo monotónico, aprobado unitario. |
| 35 | [Excepciones][exceptions] y [Administración][management-e2e] | Perfil por manager con solicitud/revisión/motivo, aprobado. |
| 36 | Storage media/integración y editor E2E | Asociación separada/versionada/huérfanos, aprobado. |
| 37 | Tarjeta/loyalty/E2E | Pausa/estados y logout independientes del carrito; baja administrativa excluida por DC-15, no «prueba pendiente» para añadirla. |
| 38 | Auth-mail local y staff-access E2E | Tokens/MFA/destino reales locales aprobados; SMTP productivo y recuperación humana pendientes. Bootstrap inicial sin email por DC-17; CAPTCHA retirado por DC-20. |
| 39 | Handler unitario/editor E2E | Límite 3 MiB/4 MiB acotado sin Content-Length aprobado local; comportamiento hosting pendiente. |

## Conservación y soft delete

pgTAP H2/H3/H4/H5/H6/H7 comprueba grants, historial y campos/restricciones. Integración catálogo/checkout/personal verifica retirada/restauración con UUID/versiones e idempotencia, sin publicar/reactivar. Fidelización protege versiones utilizadas y premios; H7 exige cierre antes de ocultar incidencias, conserva último manager y deniega bajas de clientes por DC-15. El preflight oficial comprueba balance; no ejecuta borrados reales para producir evidencia.

Documentos/términos/piloto y recuperación fuera de la máquina permanecen [pendientes](piloto-y-aceptacion.md). No se reemplazan por el total de pruebas aprobadas.

[catalog]: ../../../../tests/integration/catalog.test.ts
[catalog-e2e]: ../../../../tests/e2e/catalog.spec.ts
[catalog-admin]: ../../../../tests/integration/catalog-admin.test.ts
[checkout]: ../../../../tests/e2e/checkout.spec.ts
[checkout-db]: ../../../../tests/integration/checkout-config.test.ts
[cart]: ../../../../src/features/cart/services/cart.test.ts
[access]: ../../../../tests/integration/card-access.test.ts
[card-e2e]: ../../../../tests/e2e/loyalty.spec.ts
[loyalty]: ../../../../tests/integration/loyalty.test.ts
[permissions]: ../../../../tests/integration/staff-permissions.test.ts
[exceptions]: ../../../../tests/integration/management-exceptions.test.ts
[management-e2e]: ../../../../tests/e2e/management.spec.ts
[backup]: ../../../../tests/integration/management-backup.test.ts
[pilot]: piloto-y-aceptacion.md
