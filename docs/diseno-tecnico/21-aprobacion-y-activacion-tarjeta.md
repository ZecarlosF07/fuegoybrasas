# Aprobación y activación pública de la tarjeta

**DC-26.** El 21/10/2026 el propietario respondió: «Apruebo los textos y autorizo habilitar la tarjeta», después de recibir las URLs de [condiciones](https://fuegoybrasas.vercel.app/condiciones-tarjeta) y [uso de datos](https://fuegoybrasas.vercel.app/privacidad). La ejecución se completa el 22/10/2026.

## Registro y configuración

La aprobación se conserva en [documents-approval.json](../../src/features/loyalty/config/documents-approval.json), con decisión, fecha, versión y hashes SHA-256 de los dos archivos publicados, normalizados a saltos LF. No contiene credenciales ni datos de clientes. `yarn test:release` comprueba que los textos correspondan a esa aprobación. Si cambian sustancialmente, revisar aprobación y versión; no sustituir los hashes para ocultar un cambio sin revisar.

El servidor consulta ese registro versionado y exige la clave privada configurada. Los indicadores antiguos `LOYALTY_TERMS_APPROVED` y `LOYALTY_PRIVACY_APPROVED` dejan de utilizarse y se retiran de las plantillas y exportaciones privadas. Si el hosting los conserva, ya no controlan este despliegue. Las pausas operativas siguen en la configuración de negocio y conservan historial/progreso.

Esta aprobación no inventa plazos de conservación, no certifica cumplimiento legal y no acredita entrenamiento de otras personas, Narrador o recepción real de WhatsApp. El aviso aprobado informa las definiciones aún pendientes; se conservan como seguimiento operativo sin inventar valores.

## Activación

Se utilizan `activate_loyalty_program` y `set_reward_availability`, autenticadas con la cuenta administrativa existente, revisión vigente y UUID de operación registrado antes de cada escritura. Se conservan recibos, auditoría y permisos; no hay SQL directo sobre los flags, clientes de prueba oficiales ni cambios en sellos o canjes.

El programa mantiene diez visitas presenciales con compra pagada y entregada por un Mostrito de ⅛ con chaufa, papas fritas y ensalada. El costo interno queda desconocido (`NULL`), permitido por [DC-24](20-pedido-whatsapp-y-costo-opcional.md). La disponibilidad inicial se basa en el Mostrito publicado y disponible; atención confirma cocina en cada canje y puede pausarla si se agota.

La comprobación publicada revisa formulario habilitado, ausencia de SMS, condiciones/datos y protección de tarjeta privada sin sesión. No se envía un alta sintética a producción. La regresión completa de altas, sellos y canjes corresponde al entorno aislado documentado.

## Evidencia y entrega

- [Activación oficial](../implementacion/evidencia/h8/whatsapp-sin-pago-2026-10-21/activacion-tarjeta.json).
- [Revisión y publicación H8](../implementacion/evidencia/h8/whatsapp-sin-pago-2026-10-21/README.md).
- [Guía para el cliente](../entrega-al-cliente/README.md).

La autorización permite activar la tarjeta revisada. Los controles humanos y operativos no ejecutados permanecen identificados; no se marca el piloto presencial completo como realizado por una prueba automatizada.
