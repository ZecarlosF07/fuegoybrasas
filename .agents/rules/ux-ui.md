# Reglas UX/UI — Fuego y Brasas

**Versión:** 1.1 · **Fecha:** 4 de octubre de 2026.
**Alcance:** diseño, construcción y revisión de interfaces, componentes y documentación que determine su apariencia o interacción.

## Lectura y uso obligatorio de la skill

- **UI-01.** Leer [Sistema visual](../brand/sistema-visual.md), [Frontend y estado](../../docs/diseno-tecnico/06-frontend-y-estado.md), [Navegación](../../docs/diseno-tecnico/12-flujo-navegacion.md) y el hito afectado. Usar los wireframes W01–W13 del [análisis](../../docs/analisis-del-proyecto.md) como jerarquía funcional, complementados por las rutas privadas vigentes. Colores, fuentes, medidas y tiempos se definen únicamente en el sistema visual.
- **UI-02.** Usar **`ui-ux-pro-max`** en trabajo de interfaces, incluidos H1 como base visual y H8 como revisión. Localizar su `SKILL.md` mediante el catálogo de skills del agente; en este equipo existe en `C:/Users/ZeCarlos/.codex/skills/ui-ux-pro-max/SKILL.md`. Esa ruta es una referencia del entorno, no una dependencia portátil ni un enlace requerido por el proyecto. Leer el archivo antes de aplicarlo y localizar su script desde la carpeta real de la skill.
- **UI-03.** Para una nueva dirección visual usar `--design-system`; para un problema puntual, `--domain`; para implementación, `--stack nextjs`. Consultas de dos a cinco términos sobre un resultado concreto. Comprobar identidad del resultado, plataforma y encaje; reintentar una vez si no encaja. Si sigue sin encajar, declarar la recomendación propia o el fallback, sin atribuirlos a un resultado verificado. No enviar datos privados en consultas.
- **UI-04.** Antes de persistir o construir, leer [MASTER](../../design-system/fuego-y-brasas/MASTER.md), que remite a la fuente canónica. No ejecutar `--persist` para reemplazar decisiones del proyecto con una plantilla; no usar `--force` sin autorización explícita. Las propuestas de la skill requieren síntesis con estas reglas y el negocio. Las páginas específicas pueden detallar composición en el sistema canónico; no duplicar tokens ni introducir overrides contradictorios. Una futura excepción visual se registra allí con motivo y alcance.
- **UI-05.** Si la skill falta, buscarla en las ubicaciones disponibles. No presentar una búsqueda o revisión como ejecutada. Registrar el bloqueo del trabajo visual que la requiere y continuar trabajo independiente; no sustituir silenciosamente la dependencia ni instalarla como efecto de una tarea de diseño. Consultar guías Next.js instaladas cuando una recomendación técnica sea incompatible o esté desactualizada.

## Experiencia de compra y fidelización

- **UI-06.** La carta permite entender fotografía, nombre, porción, inclusiones, precio y acción sin registrarse. Usar una promoción destacada apta según el contrato, categorías visibles y acciones explícitas. No añadir carruseles automáticos, ventanas de venta adicional, ubicación obligatoria al entrar, filtros avanzados, favoritos o indicadores de popularidad sin requisito aprobado.
- **UI-07.** Conservar borrador, cantidades, observaciones, modalidad y posición al volver según el frontend. Mostrar agotados, incompatibilidades y precios cambiados para resolverlos expresamente. Mantener el importe de productos separado de cargos pendientes. Barra de pedido únicamente con contenido, reservando espacio y safe-area. No tapar controles ni mostrar instrucciones técnicas al comprador.
- **UI-08.** Formularios con etiquetas visibles, ayudas útiles y campos condicionales del contrato. Error junto al campo y resumen enlazado cuando haya varios; al enviar, llevar foco al resumen si existe y al primer campo inválido si no. No mover foco al validar por blur. Conservar entradas y permitir pegar/autocompletar OTP y usar gestores de contraseña. No crear autenticación distinta de la definida.
- **UI-09.** Distinguir mensaje preparado, intento de apertura y confirmación comercial posterior. Emplear «Continuar por WhatsApp» para la salida al chat; no afirmar «Pedido confirmado», «Pagado» o «En preparación» por abrirlo. Acceso a tarjeta secundario y opcional. Cierre de sesión y limpieza de datos respetan el borrador no sensible.
- **UI-10.** Mostrar posiciones de sellos y conteo textual; premios pendientes separados del progreso. Operaciones de personal muestran cliente, efecto previsto, confirmaciones requeridas y resultado autorizado. Nunca aumentar saldo de forma optimista. Resultado incierto exige consulta/reintento de la misma operación; no ofrecer una nueva acreditación o canje por falta de respuesta. Incidencia no equivale a corrección aplicada.

## Accesibilidad, comportamiento y rendimiento

- **UI-11.** Objetivo WCAG 2.2 AA con evidencia automática y manual, sin afirmar certificación. Teclado completo, etiquetas semánticas, orden de lectura, zoom habilitado, idioma español y enlaces con propósito claro. Estado combina texto/forma/icono; color nunca es su único significado. Objetivos táctiles, tamaños y pares de contraste son los del sistema visual, más exigentes que algunos mínimos normativos.
- **UI-12.** Foco visible y completamente despejado por barras, encabezados y diálogos. Diálogos accesibles limitan foco, permiten Escape cuando corresponde y lo devuelven al disparador. Usar una región de estado para feedback contextual, sin leer todo el carrito en cada cambio. Una operación pendiente conserva estado y previene duplicaciones, sin bloquear todo el producto innecesariamente.
- **UI-13.** Construir desde móvil con reflujo, sin desbordamiento involuntario ni información dependiente de hover. Categorías pueden desplazarse horizontalmente de forma explícita; el resto de la página debe refluir. Usar `next/font`/`next/image` según guías instaladas, dimensiones reservadas, imágenes adaptativas y carga diferida apropiada. Animación solo para feedback, respeta movimiento reducido y no demora acciones. No incorporar GSAP o efectos pesados por aparecer en una búsqueda.
- **UI-14.** Paneles privados comparten tokens, campos y botones con la carta, con composición orientada a trabajo. Distinguir guardado, publicación, foto subida/asociada, retiro, restauración y reactivación. Confirmación destructiva identifica entidad, consecuencia y motivo requerido. Ocultar botones no sustituye permisos del servidor.

## Evidencia requerida por hito

- **UI-15.** UI minimalista con Tailwind exclusivamente y acentos del sistema canónico; reutilizar primitivas antes de crear componentes. Aplicar las [Reglas de código](codigo.md).
- **UI-16.** Toda acción asíncrona iniciada por botón muestra carga visible dentro del mismo control, texto contextual y estado deshabilitado hasta finalizar. Prevenir también reentradas antes del siguiente render; conservar los datos y mostrar explícitamente el error.
- **UI-17.** Generar, exportar, descargar o consultar archivos mediante una acción controlada cuando necesite comunicar progreso o errores. Un enlace con aspecto de botón no usa `href` directo para esas operaciones. Los enlaces de navegación ordinaria mantienen semántica de enlace.
- **UI-18.** No mostrar carga en navegación normal, pestañas, filtros locales o controles instantáneos. El indicador representa trabajo asíncrono real; no añadir demoras artificiales para hacerlo visible.

Antes de aceptar trabajo visual, conservar un registro de revisión con:

1. Hito/tarea, pantallas, versión del sistema visual, consultas y resultados aplicados/descartados con motivo. Si no se necesitó una búsqueda nueva, indicar qué lectura y revisión de la skill se reutilizó.
2. Capturas de los anchos de aceptación definidos en el sistema visual; incluir estados relevantes del hito, no solo pantalla inicial.
3. Recorrido con teclado, foco despejado, zoom/reflujo y lector de pantalla; contraste de pares realmente renderizados, no solo tokens nominales.
4. Comprobación de navegación de vuelta, errores, carga y contexto de sesión; datos sintéticos y capturas sin teléfonos, nombres reales, OTP o secretos.
5. Defectos, correcciones, resultados y casos no ejecutados. Cumplimiento documental no es aceptación de una interfaz futura.

Guardar la evidencia junto al reporte de aceptación del hito cuando se ejecute; no crear reportes de pruebas ficticios. H8 añade dispositivos reales, conectividad limitada, WhatsApp y piloto con el personal conforme a su especificación. Los textos, tamaños y estados se comprueban contra [Sistema visual](../brand/sistema-visual.md).
