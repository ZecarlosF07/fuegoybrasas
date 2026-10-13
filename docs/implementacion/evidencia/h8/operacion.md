# Operación diaria y contingencias

## Personas y acceso

Responsable inicial: propietario, cuenta confirmada y creada sin email; su MFA/entrenamiento deben comprobarse. Atención de WhatsApp: **Roberto Fuentes**, número **982 042 493**. El nombramiento no acredita recepción de un pedido ni uso del panel. No conceder rol de administrador a todo el personal por conveniencia.

- Atención entra a `/personal`, identifica la tarjeta y registra visita/canje.
- Administrador entra a `/administracion`: clientes, proximidad al premio, pendientes, incidencias e historial; también carta/configuración/personal.
- Cliente usa enlace/QR privado; número de teléfono identifica contacto, no autentica. Nunca solicitar SMS ni contraseña de Auth al cliente.

## Inicio del turno

1. Comprobar carta/precios/agotados y disponibilidad del Mostrito de premio.
2. Revisar incidencias abiertas y resultados inciertos antes de operar otra vez sobre la tarjeta afectada.
3. Comprobar WhatsApp oficial y asignación de atención. Horario/pagos provisionales no se anuncian como confirmados.
4. Acceder con cuenta individual y TOTP. No dejar sesión abierta en un dispositivo compartido.

## Solicitudes por WhatsApp

La web conserva carrito en el dispositivo y prepara texto; no almacena ventas. Roberto confirma recepción, disponibilidad, modalidad, importe/cargos y pago con el cliente. Abrir WhatsApp, copiar texto o recibir mensaje no son entrega ni venta confirmadas en la aplicación. Si WhatsApp/portapapeles falla, conservar texto completo seleccionable y el borrador.

## Sellos y premios

Un sello por visita presencial pagada **y entregada**, con referencia. No generar sello al recibir la solicitud, por cada plato ni por un regalo. En el décimo sello se obtiene premio independiente del nuevo ciclo; canje en visita posterior sin exigir compra. Verificar resultado final autorizado; si hay demora, control deshabilitado y carga contextual.

Agotamiento conserva premio. Pausa conserva consulta/progreso/derechos según el contrato. No habilitar cocina/disponibilidad mediante una promesa sin confirmación.

## Incertidumbre, errores y excepciones

- Respuesta perdida: consultar/reintentar el mismo UUID. Ausencia de recibo no demuestra que no se ejecutó; no crear otra operación para el mismo efecto.
- Sello erróneo: administrador revisa evento y motivo, registra reversión; no modifica el historial. Si afectaría canje entregado, revisar incidencia sin disminuir saldo automáticamente.
- Premio canjeado sin entrega: administrador confirma la falta, registra motivo y restituye el **mismo premio**. Se conserva canje y resolución; no se suma sello.
- Tarjeta perdida: recuperación presencial por administrador con referencia de compra e historial; rota clave, invalida acceso viejo y conserva UUID/saldo/premios. No recuperar únicamente por teléfono.
- Caída: registrar fecha real y referencia de compra pagada/entregada en un registro controlado del local, sin claves privadas. Al volver, administrador concilia una sola vez mediante función de contingencia. No simular entrega ni editar eventos.
- Clientes/tarjetas no se dan de baja. Restauración de catálogo/personal no publica ni activa acceso automáticamente. Incidentes se cierran antes de retirarlos.

## Salud, alertas y escalado

El equipo técnico revisa `/api/health` (configuración/proceso) y `/api/catalog` (Data API y respuesta `ok`). Un health verde no garantiza Auth, WhatsApp o recepción humana. En hosting configurar un monitor acordado para 503/tiempos elevados; el repositorio no contrata ni instala alertas externas. Guardar UUID/código/hora, nunca teléfono, dirección, URL privada, JWT o cuerpo del pedido en logs compartidos.

Si el catálogo no se valida, la web conserva borrador y explica fallo. La caída de fidelización no impide solicitud invitada cuando carta y configuración están disponibles. Alertar al responsable técnico; no desactivar MFA/RLS para recuperar servicio.

## Respaldo y recuperación

El responsable técnico debe definir custodio, frecuencia, cifrado, destino externo, retención y plan Supabase antes de declarar cobertura productiva. El dump SQL de Supabase **no guarda bytes de Storage**; respaldar archivos y metadatos, configuración Auth/callbacks/proveedores, variables y secretos por un canal seguro independiente. [Supabase: backups](https://supabase.com/docs/guides/platform/backups).

H7 probó dump/restore de SQL/Auth, permisos y conciliación de canje posterior. H8 probó adicionalmente metadata Storage/MFA y recuperación de un PNG sintético con hash. [Resultado](restauracion.json). Mismo clúster, roles existentes; servicios HTTP no se recrearon sobre otra plataforma. No acredita backup real contratado, recuperación fuera de la máquina, SMTP ni recuperación de dispositivo TOTP.

Restaurar aislado, comprobar 18 tablas, restricciones, claves/contadores/premios y acceso. Mantener atención pausada; comparar entregas posteriores al punto restaurado con registro controlado y conciliar antes de reactivar. No volver a regalar automáticamente premios que el respaldo muestra disponibles si ya se entregaron. Metas propuestas de recuperación/pérdida deben medirse y aprobarse, no prometerse a partir del tiempo de un fixture pequeño.
