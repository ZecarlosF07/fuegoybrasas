# H6 — Revisión manual con Chrome y Narrador

**Fecha:** 11 de octubre de 2026.  
**Resultado humano:** pendiente. La preparación de ventanas y las pruebas automáticas no aprueban esta revisión.

**Última respuesta del propietario (11/10/2026):** «Todavía no hice la revisión». Se cerraron las dos ventanas de preparación y el recorrido ejecutó su limpieza correctamente. Se comprobó en Supabase local: fidelización pausada y cero clientes, cuentas de personal, usuarios Auth, eventos y premios sintéticos. No se modificó Supabase remoto. Las cinco comprobaciones humanas siguientes siguen pendientes; para retomarlas se prepara una nueva sesión.

**Intento del agente autorizado el 11/10/2026:** el propietario solicitó «puedes probarlo tu mejor?». Se prepararon nuevamente las dos ventanas locales y se aplicó la lectura de `computer-use` y `ui-ux-pro-max` (consulta `screen reader announcements`, semántica y resumen de errores). La herramienta detuvo el primer intento de inspección porque no pudo determinar la URL actual de Chrome con suficiente confianza para aplicar sus controles de seguridad. No se ejecutaron acciones de revisión ni se verificó Narrador/zoom. Se finalizó el recorrido de preparación correctamente (57,57 s), sin sumar su resultado a la aceptación funcional. Se limpiaron sus datos sintéticos locales; las comprobaciones siguientes permanecen pendientes.

## Preparación

`yarn test:manual:h6` abre dos ventanas de Chrome contra **http://127.0.0.1:3100** y Supabase **local**. Una muestra el alta; la otra tiene personal sintético con MFA y una tarjeta con nueve sellos. Las credenciales del personal se preparan automáticamente y no se imprimen. `yarn dev` habitual conserva Supabase remoto.

La activación y el costo de S/ 6,50 son fixtures, sin aprobación comercial. No utilizar nombres, teléfonos, visitas ni cuentas reales. Para el alta usar **Cliente de revisión H6** y **999000004**; ese contacto se reserva para esta sesión aislada. No compartir ni capturar enlaces/QR privados.

El recorrido espera hasta treinta minutos. Al recibir tus resultados, el agente finaliza la sesión y restaura la configuración local, eliminando solo los UUID sintéticos de este recorrido. Cerrar la sesión o agotar el tiempo no aprueba accesibilidad. No ejecutar otras suites que modifiquen la base mientras estas ventanas estén abiertas.

La sesión utiliza una compilación de producción separada en `.test-fixtures/h6-manual-next`, conforme a la guía `distDir` del Next instalado. No reemplaza la compilación remota ni el servidor habitual. Preparación y navegación tienen esperas acotadas; los treinta minutos se reservan para tu revisión. Si se mata el proceso antes de finalizar, no se garantiza `finally`: hay que limpiar la base aislada antes de repetir, como se hizo tras la preparación interrumpida del 11/10. Nunca ejecutar esa limpieza contra remoto.

## Recorrido del propietario

1. Activa Narrador con **Windows + Ctrl + Enter**. En la ventana de alta usa **Tab**, **Shift + Tab**, **Espacio** y **Enter**. Comprueba que se leen nombre, celular, explicación de contacto, condiciones y propósito de los botones en un orden comprensible; el foco debe verse completo.
2. Envía el formulario vacío. Comprueba que el lector anuncia el error y que el foco llega al resumen. Usa sus enlaces para llegar a los campos; llena los datos sintéticos, acepta las condiciones y crea la tarjeta. Debes ver **0 de 10**, sin pedir SMS.
3. En la tarjeta comprueba que el conteo y los premios tienen texto comprensible. Guarda unas indicaciones sintéticas. Narrador debe anunciar el resultado contextual. Borra el nombre e intenta guardar: el error debe leerse y permitir corregirlo, conservando las indicaciones. Restaura el nombre.
4. Pasa a la ventana del personal. Comprueba el nombre del cliente sintético, **9 de 10**, etiquetas y ayudas. Pulsa **Registrar un sello** sin marcar las confirmaciones: debe anunciar el error. Marca compra pagada y pedido entregado y vuelve a registrar, una sola vez. Debe mostrar **0 de 10** y **un premio disponible** separado del progreso, con confirmación del resultado. Todo ocurre en la fixture local.
5. En ambas ventanas maximiza Chrome. Desde su menú cambia el **zoom real a 200 % y luego 400 %**. Recorre con Tab y desplazamiento vertical: no deben perderse texto, campos, confirmaciones, premios ni botones; el foco debe quedar visible y no aparecer desplazamiento horizontal de toda la página. Vuelve a **100 %** con **Ctrl + 0** y apaga Narrador con el mismo atajo.

La pantalla personal puede requerir desplazamiento vertical; esto no es un fallo. Un estado anunciado una sola vez y con contexto es preferible a releer toda la tarjeta. Si encuentras un problema, indica pantalla, acción y lo que ocurrió; el agente lo corregirá antes de cerrar H6.

## Registro de resultados

| Comprobación humana | Resultado | Observación |
| --- | --- | --- |
| Alta: etiquetas, ayudas, orden y error enfocado | Pendiente | — |
| Tarjeta: progreso/premios, guardado y error anunciado | Pendiente | — |
| Personal: confirmaciones, error y décimo sello anunciado | Pendiente | — |
| Teclado y foco completo en ambos contextos | Pendiente | — |
| Chrome al 200 % y 400 %: contenido y acciones utilizables | Pendiente | — |

Registrar quién revisó, fecha, navegador y cualquier problema corregido. La automatización entre contextos representa sesiones distintas; el QR y la conectividad en teléfonos físicos se prueban en H8. Esta revisión humana no constituye certificación WCAG.

## Repetir o finalizar

Con Docker y Supabase local disponibles, ejecutar `yarn test:manual:h6`. El script conserva guardas de loopback y no acepta un destino remoto. Los enlaces de proyecto y los contratos no necesitan cambios para repetirlo.

El agente crea `.test-fixtures/h6-manual.complete` después de recibir los resultados o si decide cerrar la preparación; esto libera las ventanas y ejecuta la limpieza. El archivo está ignorado por Git. Su existencia **no significa aprobación humana**: esta tabla y el [reporte](README.md) contienen el resultado explícito.
