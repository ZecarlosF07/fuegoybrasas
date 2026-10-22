# Fuego y Brasas — Hitos de implementación

**Actualización 21/10 — DC-23–25:** [pedido sin pago y costo de premio opcional](../diseno-tecnico/20-pedido-whatsapp-y-costo-opcional.md) sustituye los campos de pago/vuelto, la dependencia de pagos y el costo obligatorio de premio. La revisión técnica se delega al agente; ver [guía de entrega](../entrega-al-cliente/README.md).

**Actualización DC-22, 13/10/2026:** [personal sin MFA](../diseno-tecnico/19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Versión:** 1.14
**Fecha:** 20 de octubre de 2026

**Destinatarios:** equipo de desarrollo y responsable del negocio.  
**Estado:** H1–H7 implementados. [Verificación H8 del 20/10](evidencia/h8/verificacion-2026-10-20/README.md): 132 unitarias, 132 DB, 113 integración y 50 E2E aprobadas; CI y Vercel comprobados para el mismo SHA, carta e imágenes disponibles. Piloto, pagos/costo/textos, accesibilidad humana y operación productiva siguen pendientes. [H6 vigente](evidencia/h6/acceso-sin-sms/README.md) conserva Narrador/zoom real pendientes. PT-13 resuelto; programa/pedidos públicos apagados; personal sin MFA conforme a DC-22.

## 1. Objetivo y forma de trabajo

Construir la web de Fuego y Brasas con Next.js y Supabase, incluyendo carta pública, preparación de pedidos por WhatsApp, mantenimiento privado y tarjeta de fidelización.

Los ocho hitos siguientes organizan el trabajo en resultados que el equipo puede demostrar al propietario. Cada hito reúne los cambios de base de datos, servicios, pantallas y pruebas necesarios para que su funcionalidad sea utilizable.

El desarrollo empieza con una base común y después avanza por funcionalidades completas. Dentro de cada bloque, seguir este orden:

1. Revisar requisitos, entradas, respuestas y condiciones de negocio.
2. Crear las migraciones necesarias con restricciones, índices, permisos y borrado lógico cuando corresponda.
3. Comprobar integridad y permisos; generar los tipos de base de datos.
4. Implementar los servicios, Server Actions o Route Handlers necesarios en Next.js.
5. Construir las pantallas y conectar sus estados reales.
6. Probar el recorrido completo y presentar evidencias para aceptar el hito.

Las migraciones se agrupan por cambios coherentes. Una funcionalidad puede necesitar varias tablas; no se impone una migración o una pantalla por cada tabla. Los cambios quedan versionados y la base local debe poder reconstruirse desde cero.

### Reglas que todo el equipo debe conservar

- Comprar no exige registro. La web prepara una solicitud para el WhatsApp oficial **+51 982 042 493**; abrir el chat no confirma envío, pago ni venta.
- El carrito y los datos del pedido permanecen en el dispositivo; las solicitudes no se guardan en Supabase.
- La fidelización es opcional. Un fallo de acceso a tarjeta no impide pedir como invitado si el catálogo puede validarse.
- Cada visita presencial con compra pagada y pedido entregado genera un sello, confirmado por el personal. Varios platos en una visita no generan varios sellos.
- Diez sellos generan un Mostrito de ⅛ con chaufa, papas fritas y ensalada. El canje es en una visita posterior, sin exigir otra compra; canjear no suma sello ni reinicia el progreso siguiente.
- El borrado lógico se incorpora desde las primeras tablas editables. Los eventos, recibos de operaciones y auditoría conservan su historial inmutable.
- Los datos comerciales pendientes no se reemplazan por suposiciones. Los datos sintéticos de pruebas se mantienen separados de producción.

### Reglas de diseño y uso de UI/UX Pro Max

Para el trabajo visual de cada hito es obligatorio leer [Reglas del proyecto](../../.agents/rules/proyecto.md), [Reglas UX/UI](../../.agents/rules/ux-ui.md) y [Sistema visual canónico](../../.agents/brand/sistema-visual.md), enlazados desde [AGENTS.md](../../AGENTS.md). El sistema es la única fuente de colores, fuentes, medidas y patrones; [MASTER](../../design-system/fuego-y-brasas/MASTER.md) permite recuperarlo en el flujo de la skill.

Usar **`ui-ux-pro-max`** al diseñar, construir o revisar interfaces y documentación que defina su diseño. Localizarla mediante el catálogo del entorno, leer sus instrucciones y registrar recomendaciones aplicadas/descartadas con motivo. No depender de una ruta personal ni persistir una plantilla sin comprobar su encaje. Trabajo exclusivamente de backend conserva sus verificaciones sin requerir una búsqueda visual.

El diseño y la consulta de la skill ocurren antes de construir la interfaz; la revisión ocurre antes de presentar el hito. Los nuevos identificadores se añaden al final de las tablas para conservar los anteriores, sin obligar a ejecutar esas tareas después de la verificación.

| Hito | Tarea visual añadida | Resultado y evidencia esperados |
| --- | --- | --- |
| H1 | H1-T12 | Tokens, fuentes y primitivas necesarias de la aplicación base; contraste/foco/estados compartidos. |
| H2 | H2-T11 | Login, permisos vigentes, recuperación y navegación privada con labels, pegado, errores y denegación accesibles. |
| H3 | H3-T11 | Carta/detalle con marca, fotografía, porción, precio, categorías y estados sin imagen/agotado/error. |
| H4 | H4-T10 | Editor que distingue guardar/publicar, subir/asociar y restaurar/activar; conflictos y consecuencias claras. |
| H5 | H5-T11 | Carrito, dock y formulario conservan foco/borrador; revisión de cambios y continuidad WhatsApp sin falsa confirmación. |
| H6 | H6-T12 | Progreso y premios separados; alta/enlace privado y atención accesibles, sin saldo optimista ni reintento duplicado. |
| H7 | H7-T14 | Correcciones, incidencias y personal con efecto/motivo/estado; excepciones pendientes no se resuelven mediante copy. |
| H8 | H8-T13 | Auditoría de marca/UX/UI, estados críticos y piloto; defectos bloqueantes corregidos antes de activar. |

Cada especificación añade dos requerimientos técnicos, un requerimiento funcional y DoD de UX/UI. La evidencia identifica pantallas, estados, versión/entorno y consultas; comprueba anchos canónicos, teclado, foco despejado, contraste renderizado, zoom/reflujo y lector. H8 añade dispositivos reales y piloto. Capturas con datos sintéticos; casillas se marcan únicamente con evidencia ejecutada y las comprobaciones manuales no realizadas permanecen pendientes.

Explicación para el equipo: [Identidad visual y sistema UI](../diseno-tecnico/14-identidad-visual-y-sistema-ui.md). Fundamento: [Investigación y referentes](../diseno-tecnico/15-investigacion-ux-y-referentes.md). Originales de logo/fotos pendientes según PT-09; los HEX de interfaz son propuestas. PT-08 conserva personas reales/permisos y PT-11 textos/plazos de lanzamiento; procedimientos DC-14 y restitución DC-13 ya están aprobados y probados.

## 2. Resumen de hitos y dependencias

| Hito | Resultado principal | Depende de |
| --- | --- | --- |
| [H1. Preparar el proyecto](01-hito-1-preparacion-del-proyecto.md) | Entorno organizado y aplicación conectada a Supabase. | Diseño y configuración disponible. |
| [H2. Preparar el acceso del personal](02-hito-2-acceso-del-personal.md) | Acceso privado seguro y base común para registrar cambios. | H1. |
| [H3. Mostrar la carta](03-hito-3-catalogo-publico.md) | Productos y promociones consultables desde la base de datos. | H1 y la base de H2. |
| [H4. Actualizar la carta](04-hito-4-administracion-del-catalogo.md) | El responsable mantiene el catálogo desde el panel. | H2 y H3. |
| [H5. Completar el pedido por WhatsApp](05-hito-5-pedido-por-whatsapp.md) | Pedido invitado completo, validado y recuperable. | H3 y H4. |
| [H6. Implementar fidelización](06-hito-6-fidelizacion.md) | Tarjeta propia, sellos y canjes con reglas verificadas. | H2; H5 como orden recomendado de entrega. |
| [H7. Resolver errores y situaciones especiales](07-hito-7-correcciones-y-operacion.md) | Correcciones, accesos y contingencias trazables. | H2, H4 y H6; decisiones pendientes de negocio. |
| [H8. Probar y publicar](08-hito-8-piloto-y-lanzamiento.md) | Piloto completado y producto operativo publicado. | H1–H7 y configuración de lanzamiento confirmada. |

El pedido y la fidelización son capacidades independientes. H6 se entrega después de H5 para comprobar primero la compra invitada; la fidelización continúa formando parte de la primera versión prevista. Los prototipos visuales pueden adelantarse, pero la aceptación exige integración y pruebas reales.

## 3. H1 — Preparar el proyecto

**Especificación detallada:** [Objetivo, tareas, requerimientos y Definition of Done de H1](01-hito-1-preparacion-del-proyecto.md).

**Objetivo:** dejar una base sobre la que el equipo pueda trabajar de forma reproducible.

**Puntos de trabajo:**

- Organizar las carpetas de Next.js siguiendo la estructura acordada, creando cada módulo cuando se necesite.
- Configurar la conexión con Supabase y validar las variables necesarias, separando configuración pública y secretos del servidor.
- Preparar el entorno local de base de datos, migraciones y datos de prueba; separar las configuraciones de desarrollo, pruebas y producción.
- Incorporar las dependencias de integración, validación y pruebas necesarias para las primeras funcionalidades.
- Preparar los contratos compartidos y el manejo de errores, dinero y clientes Supabase por contexto.
- Documentar cómo instalar, iniciar y comprobar el proyecto desde un checkout limpio.
- Preparar la base visual compartida con la skill y el sistema canónico, sin construir pantallas comerciales anticipadamente.

**Entregables:** aplicación que inicia y conecta con el entorno correspondiente; estructura inicial, configuración de ejemplo sin secretos e instrucciones de desarrollo reproducibles.

**Se termina cuando:** el equipo puede instalar e iniciar el proyecto, comprobar conexión, ejecutar las comprobaciones básicas y reconstruir la base local disponible sin pasos manuales ocultos. TypeScript, lint y build pasan para el trabajo realizado. Las claves privilegiadas quedan fuera del navegador y del repositorio.

**Referencias:** [Arquitectura](../diseno-tecnico/01-arquitectura.md), [Despliegue y operación](../diseno-tecnico/07-despliegue-y-operacion.md), [Estructura de carpetas](../diseno-tecnico/13-estructura-carpetas.md).

## 4. H2 — Preparar el acceso del personal

**Especificación detallada:** [Objetivo, tareas, requerimientos y Definition of Done de H2](02-hito-2-acceso-del-personal.md).

**Objetivo:** permitir que únicamente el personal autorizado entre a sus funciones y que los cambios queden registrados.

**Puntos de trabajo:**

- Crear la base de autorización del personal y el procedimiento protegido para el primer responsable.
- Implementar inicio de sesión individual, segunda verificación MFA, cierre de sesión y recuperación de contraseña.
- Definir los permisos de atención y responsable; comprobarlos en páginas, servicios y funciones de base de datos.
- Crear la configuración única del negocio y la base común de auditoría y recibos de operaciones.
- Preparar el mecanismo que reconoce una operación repetida para que un reintento no duplique su efecto.
- Aplicar permisos restrictivos y protección de registros; incorporar el borrado lógico de personal y la protección del último responsable activo.
- Diseñar y revisar acceso/permisos/recuperación con la skill, incluyendo estados de espera, error y denegación.

**Entregables:** acceso privado funcional, cuentas con roles, configuración común y mecanismos de trazabilidad e idempotencia listos para las mutaciones posteriores.

**Se termina cuando:** una cuenta autorizada entra con autorización vigente y una cuenta sin permiso, inactiva o eliminada no puede operar, incluso mediante llamadas directas. Un JWT vigente no evita revisar la autorización actual. La base común permite comprobar auditoría y repetición de una operación controlada; nunca queda el negocio sin responsable activo por una baja.

La gestión completa de altas/bajas desde el panel se entrega en H7; la comprobación de permisos y los mecanismos necesarios existen desde H2.

**Referencias:** [Autenticación y seguridad](../diseno-tecnico/04-autenticacion-seguridad.md), [Contratos](../diseno-tecnico/05-contratos-y-operaciones.md), [Tablas y soft delete](../diseno-tecnico/10-tablas-db.md).

## 5. H3 — Mostrar la carta

**Especificación detallada:** [Objetivo, tareas, requerimientos y Definition of Done de H3](03-hito-3-catalogo-publico.md).

**Objetivo:** permitir que cualquier visitante consulte la carta desde datos almacenados y controlados en Supabase.

**Puntos de trabajo:**

- Crear las tablas de categorías, artículos, precios por modalidad, promociones y opciones que necesita el catálogo.
- Cargar las 24 entradas y cinco promociones de referencia, conservando su identidad y los datos pendientes de verificación.
- Implementar la lectura pública mediante `read_catalog`, con campos y filas publicables; las tablas no quedan abiertas para consultas directas del visitante.
- Construir la página principal, navegación por categorías y detalle de producto.
- Mostrar porciones, inclusiones, fotografías disponibles y estados de agotamiento o falta de imagen.
- Filtrar registros eliminados y sus padres; evaluar activación, vigencia y datos confirmados antes de publicar.
- Aplicar la identidad y revisar carta/detalle con la skill: jerarquía comercial, fotografías/fallback y categorías accesibles.

**Entregables:** carta y detalle conectados a la base real del entorno, con datos publicables y estados claros.

**Se termina cuando:** un invitado consulta la carta sin iniciar sesión, los datos coinciden con las fuentes autorizadas y no aparecen borradores o información sin verificar. Las alitas regulares indican cuatro unidades y la ronda dieciséis. C01 queda fuera de venta web. Cambios en los datos se reflejan al consultar la carta nuevamente.

**Referencias:** [Análisis funcional](../analisis-del-proyecto.md), [Modelo de datos](../diseno-tecnico/03-modelo-de-datos.md), [Tablas DB](../diseno-tecnico/10-tablas-db.md), [Navegación](../diseno-tecnico/12-flujo-navegacion.md).

## 6. H4 — Permitir que el responsable actualice la carta

**Especificación detallada:** [Objetivo, tareas, requerimientos y Definition of Done de H4](04-hito-4-administracion-del-catalogo.md).

**Entrega técnica:** [Evidencia H4](evidencia/h4/README.md) y [contratos/operación del panel](evidencia/h4/operacion.md). Panel `/administracion/carta`, migraciones remotas, fotografías y conservación implementados; aceptación manual y datos comerciales afectados siguen pendientes.

**Objetivo:** mantener productos y promociones desde un panel privado sencillo.

**Puntos de trabajo:**

- Crear el editor de productos, inclusiones y precios por modalidad para el responsable.
- Permitir activar/desactivar promociones y revisar sus condiciones y vigencia.
- Marcar productos y opciones como disponibles o agotados.
- Implementar subida validada de fotografías y asociación posterior con el producto.
- Incorporar retiro mediante borrado lógico y restauración supervisada, conservando relaciones e historial.
- Proteger formularios antiguos mediante revisión de versión y registrar cambios con actor y motivo cuando corresponda.
- Revisar con la skill formularios y estados distintos de guardado/publicación, imágenes y retirada/restauración.

**Entregables:** panel de catálogo con cambios persistidos, auditados y visibles en la carta pública cuando cumplen condiciones de publicación.

**Se termina cuando:** el responsable puede cambiar un precio, disponibilidad o foto y comprobar el resultado. Atención y visitantes no pueden editar. Dos formularios antiguos no sobrescriben cambios silenciosamente. Subir una foto no se confunde con publicarla; restaurar un producto lo mantiene en estado seguro hasta revisarlo y publicarlo explícitamente.

**Referencias:** [Contratos y operaciones](../diseno-tecnico/05-contratos-y-operaciones.md), [Tablas y conservación](../diseno-tecnico/10-tablas-db.md), [Flujos](../diseno-tecnico/11-diagrama-flujo.md).

## 7. H5 — Completar el pedido por WhatsApp

**Especificación detallada:** [Objetivo, tareas, requerimientos y Definition of Done de H5](05-hito-5-pedido-por-whatsapp.md).

**Entrega técnica:** [Evidencia H5](evidencia/h5/README.md) y [contratos/operación](evidencia/h5/operacion.md). Carrito, formulario, validación y WhatsApp implementados, con repetición final de navegador aprobada; pagos/zonas migrados a remoto, vacíos y pedidos pausados hasta confirmación comercial.

**Objetivo:** permitir preparar una solicitud como invitado y continuar su atención en el WhatsApp oficial.

**Puntos de trabajo:**

- Implementar agregar, editar y retirar artículos del carrito, incluyendo cantidades, opciones e indicaciones.
- Conservar productos en almacenamiento local y datos personales del formulario en almacenamiento de sesión, según su sensibilidad.
- Permitir elegir entrega o recojo y completar nombre, dirección cuando corresponde, pago e indicaciones opcionales.
- Incorporar configuración de pagos, cobertura y cargos confirmados, mostrando como pendientes los importes desconocidos.
- Validar de nuevo precios, modalidades, disponibilidad, vigencia y opciones antes de preparar el mensaje; presentar cambios para aceptación explícita.
- Construir el mensaje con los datos validados, ofrecer apertura/copia y conservar el borrador al regresar de WhatsApp.
- Revisar con la skill foco, dock, cantidades, campos condicionales, errores y explicación de la continuidad comercial.

**Entregables:** recorrido completo desde carta hasta mensaje preparado, con recuperación ante cambios, recarga o fallo de apertura/copia.

**Se termina cuando:** el invitado prepara la solicitud sin registrarse y abre el chat de **982 042 493** con el contenido completo. El borrador se conserva al regresar. Un cargo pendiente no aparece como cero; una opción retirada no se reemplaza silenciosamente. P05 mantiene su incompatibilidad con recojo, sin la leyenda retirada. Abrir WhatsApp no crea una venta confirmada ni almacena la solicitud en Supabase.

**Referencias:** [Contratos](../diseno-tecnico/05-contratos-y-operaciones.md), [Frontend y persistencia](../diseno-tecnico/06-frontend-y-estado.md), [Diagramas de flujo](../diseno-tecnico/11-diagrama-flujo.md).

## 8. H6 — Implementar la tarjeta de fidelización

**Especificación detallada:** [Objetivo, tareas, requerimientos y Definition of Done de H6](06-hito-6-fidelizacion.md).

**Entrega técnica:** [Evidencia vigente H6](evidencia/h6/acceso-sin-sms/README.md) y [contratos/operación](evidencia/h6/operacion.md). Alta/enlace privado, perfil, preferencias, contacto, sellos/premios/canjes/incidencias comprobados; 18 tablas remotas y programa draft. Docker exclusivo de pruebas aisladas, completadas. Falta [revisión humana de Narrador y zoom real](evidencia/h6/acceso-sin-sms/revision-manual.md) para aceptar H6; no se activa el programa público.

**Objetivo:** ofrecer tarjeta propia al cliente y registrar sellos y premios de forma consistente.

**Puntos de trabajo:**

- Crear como conjunto las tablas relacionadas de clientes, reglas del programa, tarjetas, eventos, premios e incidencias, con sus permisos y restricciones.
- Implementar y probar primero las transacciones de sello y canje: bloqueo, idempotencia, premios y conservación del historial.
- Permitir alta con nombre/contacto/términos y acceso por enlace privado/QR, sin SMS; conservar una sola tarjeta por cliente.
- Mostrar progreso, premios disponibles e indicaciones habituales; permitir revisar preferencias y cambiar el teléfono de contacto con acceso privado y revisión, conservando la tarjeta.
- Crear búsqueda exacta y ficha mínima del cliente para el personal; exigir confirmación de compra pagada y pedido entregado durante visita presencial.
- Generar un Mostrito de ⅛ al completar diez sellos y permitir canje posterior sin compra obligatoria, respetando disponibilidad.
- Recuperar resultados inciertos con el mismo identificador de operación y evitar incrementos optimistas de saldo.
- Diseñar y revisar con la skill acceso, tarjeta, premios y confirmaciones de atención, con progreso textual y estados inciertos claros.

**Entregables:** tarjeta propia, acceso privado por clave/enlace/QR, preferencias y atención de acreditación/canje conectados a transacciones reales.

**Se termina cuando:** el cliente solo ve su tarjeta y no puede alterar sellos. Las visitas 9, 10 y 11 producen 9/10, 0/10 con un premio y 1/10 conservando ese premio. Veinte sellos generan dos premios. Reintentar una operación no duplica efectos; dos visitas distintas se acumulan y dos empleados no canjean el mismo premio. Canjear no suma sello ni reduce el progreso. Producto agotado conserva el premio disponible y una caída de fidelización no bloquea el pedido invitado si el catálogo puede validarse.

La excepción de canje registrado sin entrega física se resuelve en H7 mediante PT-13; no se presume restitución automática ni se considera resuelto ese caso al terminar las transacciones ordinarias de H6.

**Referencias:** [Reglas de fidelización](../diseno-tecnico/02-fidelizacion.md), [Seguridad](../diseno-tecnico/04-autenticacion-seguridad.md), [Contratos](../diseno-tecnico/05-contratos-y-operaciones.md), [Tablas DB](../diseno-tecnico/10-tablas-db.md).

## 9. H7 — Resolver errores y situaciones especiales

**Ampliación aprobada del 11/10:** [DC-12–15 y contratos](../diseno-tecnico/17-administracion-y-operacion-h7.md). Añade panel privado de indicadores/clientes, restitución de premio sin entrega, recuperación presencial y conciliación por administrador. Se excluye baja de clientes/tarjetas. [Evidencia de implementación](evidencia/h7/README.md); aceptación/piloto se registran aparte.

**Especificación detallada:** [Objetivo, tareas, requerimientos y Definition of Done de H7](07-hito-7-correcciones-y-operacion.md).

**Objetivo:** dar al responsable herramientas y procedimientos para corregir errores y sostener la operación diaria.

**Puntos de trabajo:**

- Permitir revertir sellos erróneos con selección del evento original, motivo y responsable, conservando el historial.
- Registrar, revisar y cerrar incidencias; una nota de cierre no modifica automáticamente el saldo o un premio.
- Completar el panel de invitaciones, permisos, bajas y restauración de personal con sus protecciones.
- Recuperar tarjeta presencialmente con comprobante/historial, sin fusionar identidades ni transferir saldos. DC-15 excluye baja de clientes/tarjetas.
- Preparar contingencia ante caída del servicio y acreditación posterior por responsable con fecha real, referencia y revisión de duplicados.
- Restituir el mismo premio tras confirmación administrativa de no entrega, motivo e historial, según DC-13; PT-13 resuelto.
- Supervisar clientes, tarjetas próximas a premio y movimientos mediante indicadores privados por periodo, sin confundirlos con ventas.
- Completar los controles administrativos de conservación y los procedimientos de respaldo/recuperación necesarios para la operación.
- Revisar con la skill correcciones, incidencias y accesos; identificar consecuencias y no diseñar resoluciones funcionales todavía pendientes.

**Entregables:** correcciones trazables, gestión de incidencias/accesos y procedimientos operativos aceptados por el negocio.

**Se termina cuando:** correcciones, restitución, recuperación, contingencia e invitaciones tienen pruebas y personal preparado. Originales y premios conservan identidad/historial, clientes no se dan de baja, incidentes abiertos y último administrador están protegidos. La verificación automática H7 está en su reporte; capacitación y revisión humana se distinguen de ella.

DC-13/DC-14/DC-15 determinan las excepciones ya implementadas. PT-08 conserva personas reales y recuperación de MFA; PT-11 términos/aviso/plazos para lanzamiento. No se inventan purgas ni nuevas reglas comerciales.

**Revisión previa del 11/10/2026:** [Preparación de H7](evidencia/h6/acceso-sin-sms/revision-para-h7.md) y [revalidación actual de H6](evidencia/h6/acceso-sin-sms/README.md). Pruebas aisladas del nuevo acceso aprobadas; revisión humana de H6 y decisiones PT-08/PT-11/PT-13 pendientes. No se cierra H6/H7 ni se habilita fidelización pública.

**Referencias:** [Pendientes del diseño](../diseno-tecnico/README.md), [Fidelización](../diseno-tecnico/02-fidelizacion.md), [Operación](../diseno-tecnico/07-despliegue-y-operacion.md), [Conservación](../diseno-tecnico/10-tablas-db.md).

## 10. H8 — Probar y publicar

**Especificación detallada:** [Objetivo, tareas, requerimientos y Definition of Done de H8](08-hito-8-piloto-y-lanzamiento.md).

**Preparación vigente:** [Reporte/evidencia H8](evidencia/h8/README.md), [importación en Vercel](evidencia/h8/despliegue.md), [operación](evidencia/h8/operacion.md), [matriz RF/CA/CT](evidencia/h8/matriz-aceptacion.md) y [piloto pendiente](evidencia/h8/piloto-y-aceptacion.md). Push no equivale a aceptación del piloto ni activación de flags.

**Objetivo:** comprobar el producto con el personal y ponerlo en funcionamiento con datos y servicios confirmados.

**Puntos de trabajo:**

- Ejecutar los recorridos completos de pedido individual/familiar, acceso a tarjeta, sello, canje, corrección y mantenimiento con cuentas de prueba.
- Probar celulares y computadoras, teclado, foco, estados de error, imágenes ausentes y retorno desde WhatsApp.
- Confirmar los datos comerciales que se publicarán: precios, inclusiones, horarios, ubicación/recojo, pagos y tratamiento de cobertura/cargos.
- Comprobar alta sin SMS, enlace/QR y cambio de contacto; confirmar costo del premio, personal autorizado, recuperación asistida, condiciones y aviso de datos antes de activar fidelización.
- Ensayar respaldo y restauración, comprobar configuración/secretos y preparar monitoreo sin datos personales innecesarios.
- Completar el piloto con el personal, corregir problemas y dejar instrucciones de uso y contingencia.
- Auditar marca, UX/UI y accesibilidad con la skill; registrar evidencia de estados críticos y comprensión durante el piloto.
- Desplegar la aplicación y migraciones verificadas; activar funciones mediante configuración tras aceptación del propietario.

**Entregables:** evidencias de pruebas/piloto, procedimientos de operación, configuración confirmada y producto publicado con pedido y fidelización dentro del alcance acordado.

**Se termina cuando:** pasan los casos críticos de permisos, precios, persistencia, sellos/canjes concurrentes y recuperación; el personal puede operar los recorridos sin depender del desarrollador. Los pendientes que bloquean funciones públicas están cerrados o tienen el tratamiento permitido documentado. Se ha ensayado recuperación, el propietario acepta el piloto y se comprueba la versión desplegada. Los datos de ensayo no contaminan tarjetas reales.

Cargos o cobertura pueden seguir pendientes cuando el contrato permite informar esa condición y coordinarla por WhatsApp. Esto no autoriza inventar pagos, precios o condiciones necesarias para habilitar una funcionalidad. El lanzamiento parcial requiere acuerdo explícito; construir H5 primero no cambia por sí solo el alcance público previsto.

**Referencias:** [Pruebas y aceptación](../diseno-tecnico/08-pruebas-y-aceptacion.md), [Despliegue y operación](../diseno-tecnico/07-despliegue-y-operacion.md), [Plan técnico](../diseno-tecnico/09-plan-de-implementacion.md).

## 11. Seguimiento, aceptación y pendientes

Para cada hito, el equipo registra tareas concretas, responsable de implementación, dependencias, pruebas pertinentes y evidencia de revisión. Estado sugerido: **pendiente → en curso → en revisión → aceptado**. Una dependencia sin respuesta se identifica por su código PT y efecto sobre el trabajo, sin presentar una funcionalidad incompleta como terminada.

Un hito se acepta con su comportamiento integrado, evidencias del entorno y documentación actualizada. La verificación incluye controles de acceso directo y reglas de base de datos, no solamente demostración visual. Las pruebas se realizan durante cada hito; H8 reúne la validación de conjunto y el piloto.

| Decisión o dato pendiente | Cuándo hace falta | Trabajo que puede avanzar |
| --- | --- | --- |
| PT-01 a PT-05: ubicación, horarios, cobertura/cargos, pagos, precios/inclusiones/modalidades | Antes de publicar los datos o funciones afectados en H3–H5/H8. | Implementación con fixtures separados y estados pendientes explícitos. |
| PT-06: costo real del Mostrito; PT-07 comprobado automáticamente | Antes de activar públicamente fidelización: costo y aceptación humana todavía pendientes. | Acceso privado sin SMS probado; datos/permisos/transacciones/UI con identidades sintéticas. |
| PT-08/PT-11: personas reales/permisos, condiciones, aviso y plazos | Antes de operar públicamente. Recuperación/contingencia aprobadas y probadas por DC-14; DC-15 excluye baja de clientes. | Pruebas técnicas con datos sintéticos y procedimientos aprobados. |
| PT-09/PT-10: materiales oficiales y atención de WhatsApp | Presentación final, procedimiento de atención y piloto. | Interfaz con fallback y recorrido en pruebas. |
| PT-12: dominio, hosting y respaldos contratados | Despliegue público en H8. | Desarrollo local y pruebas de integración. |
| PT-13: resuelto por DC-13 | Restitución supervisada aprobada, implementada y probada en H7; ensayar con el personal en H8. | No conserva bloqueo funcional. |

Este documento organiza los acuerdos de hitos; no vuelve a aprobar reglas de negocio pendientes ni fija fechas, presupuesto o duración sin estimación del equipo.

## 12. Relación con los documentos anteriores

Los hitos H1–H8 agrupan el [plan técnico E0–E9](../diseno-tecnico/09-plan-de-implementacion.md) en resultados comprensibles para el equipo y el negocio:

| Hitos de este documento | Etapas técnicas relacionadas |
| --- | --- |
| H1 | E0/E1 y preparación del proceso de migraciones de E2. |
| H2 | Autenticación interna de E1, base común de E2 y protecciones que deben existir antes del panel. |
| H3/H4 | Catálogo/permisos de E2 y catálogo mantenible de E3. |
| H5 | E4/E5: carrito, checkout y WhatsApp. |
| H6 | E6/E7: cliente, tarjeta y transacciones de atención. |
| H7 | E8 y procedimientos administrativos/contingencias. |
| H8 | E9: piloto y lanzamiento. |

El modelo completo ya está diseñado, pero sus migraciones se implementan por conjuntos funcionales según dependencias. H2 prepara `staff_accounts`, auditoría y recibos; los conjuntos comerciales/fidelización se incorporan en sus hitos. No esperar a H7 para proteger permisos, auditoría o idempotencia de las primeras mutaciones.

Los documentos de diseño definen tablas, permisos, contratos y rutas. [Tablas DB y soft delete](../diseno-tecnico/10-tablas-db.md) amplía las reglas anteriores de conservación; [Navegación](../diseno-tecnico/12-flujo-navegacion.md) y [Carpetas](../diseno-tecnico/13-estructura-carpetas.md) son la referencia detallada para organizar páginas y módulos. El equipo debe consultar las guías instaladas de Next.js indicadas en `AGENTS.md` antes de escribir código, especialmente si cambia la versión.

La creación de esta guía no modifica los documentos anteriores ni implica que se hayan ejecutado pruebas de la aplicación.
