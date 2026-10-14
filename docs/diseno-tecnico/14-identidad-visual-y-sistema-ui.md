# 14. Identidad visual y sistema UI

**Aplicación visual del 14/10/2026:** [revisión de portada y carta](../implementacion/evidencia/h8/renovacion-visual/README.md) registra componentes, recursos referenciales identificados, prioridad de fotos propias y comprobaciones reales. La implementación conserva tokens y tipografías canónicos; el estado de especificación inicial de los párrafos siguientes corresponde a su fecha.

**Actualización DC-22, 13/10/2026:** [personal sin MFA](19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. El acceso actual del personal se define en DC-22.

**Versión:** 1.0 · **Fecha:** 3 de octubre de 2026.  
**Estado:** diseño documentado; interfaz y pruebas pendientes de implementación.  
**Audiencia:** equipo de desarrollo, diseño y responsable del negocio.

## 1. Objetivo y fuente única

Dar a la web una identidad reconocible de Fuego y Brasas y un comportamiento coherente entre compra, tarjeta y paneles. La propuesta traduce la marca existente a un producto usable; no reproduce los afiches como pantallas.

La definición obligatoria de colores, fuentes, tamaños, bordes, movimiento y patrones está en [Sistema visual canónico](../../.agents/brand/sistema-visual.md). Este documento explica su aplicación, sin duplicar sus valores. El equipo y los agentes consultan la misma fuente.

| Capa | Documento | Cómo se usa |
| --- | --- | --- |
| Entrada del agente | [AGENTS.md](../../AGENTS.md) | Indica lecturas según tipo de trabajo; conserva instrucciones Next.js. |
| Reglas generales | [Proyecto](../../.agents/rules/proyecto.md) | Stack, seguridad, acuerdos y verificación. |
| Reglas de interfaces | [UX/UI](../../.agents/rules/ux-ui.md) | Skill obligatoria, interacción, accesibilidad y evidencia. |
| Especificación visual | [Sistema visual](../../.agents/brand/sistema-visual.md) | Tokens y patrones vigentes, única ubicación de sus valores. |
| Entrada de la skill | [MASTER](../../design-system/fuego-y-brasas/MASTER.md) | Remite al sistema; no mantiene otra paleta. |
| Fundamento | [Investigación](15-investigacion-ux-y-referentes.md) | Fuentes, observaciones y decisiones razonadas. |

La carpeta `.agents/rules` es una organización del proyecto, no un mecanismo de carga automática de todos sus Markdown. `AGENTS.md` exige leerlos explícitamente. Las skills de repositorio pueden descubrirse en `.agents/skills`, pero estos archivos son reglas, no una copia de `ui-ux-pro-max`. [Instrucciones oficiales](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [skills locales](https://learn.chatgpt.com/docs/build-skills).

## 2. Dirección visual

Crema y superficies claras sostienen lectura y compra. Carbón, rojo brasa y dorado mantienen conexión con el sello. El carácter se concentra en logo, títulos breves, fotografías y motivos discretos; no se coloca detrás de campos o importes.

La combinación tipográfica elegida separa títulos de marca con carácter de lectura funcional sencilla. Nombres, porciones, precios y formularios se leen como texto, sin manuscritas o letras incrustadas en fotos. Los colores de estado conservan significado acompañado por palabras e iconos.

El sistema visual distingue observaciones de Facebook, decisiones de interfaz y materiales pendientes. No afirma que el negocio haya proporcionado HEX oficiales, archivos fuente o aprobación de todas las variantes.

## 3. Cobertura por páginas y recorrido

Las rutas proceden de [Navegación](12-flujo-navegacion.md); los wireframes de [Análisis, W01–W13](../analisis-del-proyecto.md) fijan la jerarquía. No se crean rutas nuevas por diseñar confirmaciones o diálogos.

| Rutas/patrón | Jerarquía y decisiones de diseño | Estados que se deben especificar |
| --- | --- | --- |
| `/`, `/productos/[slug]` | Marca compacta, destacado apto, categorías, foto/nombre/porción/inclusiones/precio/acción; detalle conserva volver. | Carga, vacío, agotado, sin foto, no encontrado y error de catálogo. |
| `/pedido` | Líneas editables, cantidades, modalidad, importes y dock sin tapar contenido. | Vacío, incompatibilidad, opción retirada, indicaciones que requieren revisión. |
| `/pedido/datos` | Resumen, campos necesarios y condicionales, errores asociados y revisión explícita de cambios. | Importe/cobertura pendientes, validación expirada, cambios comerciales, fallo temporal. |
| `/pedido/continuar` | Revisar/enviar en WhatsApp, abrir/copiar y recuperar borrador. | Enlace no abierto, copia fallida, regreso y datos que ya requieren revisión. |
| `/condiciones-tarjeta`, `/privacidad` | Lectura clara, versión vigente y regreso; contenido real pendiente antes de lanzamiento. | Documento disponible/no disponible; no publicar texto legal inventado. |
| `/mi-tarjeta/acceso` | Explicar participación opcional, teléfono, OTP y activación válida. | Espera, código inválido/vencido, límites y servicio no disponible. |
| `/mi-tarjeta`, `/mi-tarjeta/telefono` | Progreso y premio separados, indicaciones guardadas expresamente y cambio verificado de identidad. | Perfil no activo, tarjeta pausada, premio pendiente, verificación fallida/conflicto. |
| `/personal/acceso`, `/personal/mfa`, `/personal/recuperar`, `/personal/restablecer` | Formularios claros, recuperación/permisos separados y salidas autorizadas. | No autorizado, sesión insuficiente, credencial inválida, token vencido y espera. |
| `/personal`, `/personal/clientes/[id]` | Búsqueda exacta, ficha mínima y confirmación de sello/canje como componentes de la ficha. | Sin coincidencia, premio agotado/canjeado, operación pendiente/incierta y permiso revocado. |
| `/administracion/carta` | Listado/editor y separación de guardado, publicación y disponibilidad. | Foto subida no asociada, revisión antigua, retiro, restauración sin publicación. |
| `/administracion/configuracion` | Campos/flags permitidos, efecto y estado actuales; activación de programa conserva su contrato específico. | Datos pendientes, conflicto, guardado incierto, función pausada. |
| `/administracion/incidencias` | Lista/revisión/cierre e historial autorizado, correcciones con actor/motivo. | Incidencia abierta/cerrada, revisión requerida y excepción PT-13 pendiente. |
| `/administracion/personal` | Invitación, permisos, bajas y restauración sin acceso implícito. | Invitación parcial, último responsable protegido, cuenta inactiva/eliminada. |

Son veinte páginas. Route Handlers de Auth/API no se diseñan como páginas; sus resultados se muestran mediante los estados de las vistas correspondientes. La entrada del público no convierte el panel interno en parte de la compra.

## 4. Cómo consume el diseño la implementación

H1 prepara tokens, fuentes y primitivas compartidas. Rutas coordinan datos y composición; módulos funcionales consumen contratos y componentes UI; las primitivas no consultan Supabase. [Estructura](13-estructura-carpetas.md) conserva separación servidor/cliente y alias existente.

Las fuentes y las imágenes usan las APIs de Next.js instalado, verificadas en sus guías; una recomendación desactualizada de la skill no se copia al código. Los recursos de competidores sirven para aprender patrones, no como assets de Fuego y Brasas.

No se elige una biblioteca completa de componentes ni un motor de animación en esta entrega. La propuesta de iconos y los patrones compartidos están en el sistema canónico; su incorporación se hace cuando la interfaz del hito los necesita, con dependencia versionada.

## 5. Relación con los hitos

| Hito | Resultado visual que debe demostrar |
| --- | --- |
| H1 | Base reutilizable del sistema sin construir por anticipado pantallas comerciales. |
| H2 | Acceso, permisos vigentes y recuperación privados legibles y accesibles. |
| H3 | Carta/detalle reconocibles y claros en móvil. |
| H4 | Editor que diferencia guardar/publicar/asociar/restaurar. |
| H5 | Pedido invitado conservado y continuidad comercial bien explicada. |
| H6 | Tarjeta comprensible y operaciones sin saldo optimista. |
| H7 | Correcciones, permisos e incidencias con consecuencias explícitas. |
| H8 | Revisión integral de consistencia y uso real con el personal. |

Cada [especificación de hito](../implementacion/hitos-del-proyecto.md) contiene tarea/requerimiento y DoD para lectura de reglas, uso de la skill y evidencia. Las dimensiones y pares de aceptación se consultan en la fuente canónica, no se mantienen como copias aquí.

## 6. Evidencia, control de cambios y pendientes

La aceptación futura requiere revisar estados reales, móvil/escritorio, teclado, foco, contraste, zoom y lector, más navegación de vuelta y fallos relevantes. H8 añade celulares reales, retorno de WhatsApp y piloto. Capturas solo con datos sintéticos; registrar resultados sin identificar clientes.

Se verificaron documentalmente las reglas y sus referencias al preparar este paquete; la app sigue pendiente. No se marca ningún DoD como completado por existir esta especificación.

Un cambio de valor se hace en el sistema visual, con versión/motivo/alcance, y se revisan consumidores y evidencias. Un cambio funcional exige modificar documentos de negocio/contratos pertinentes; no se introduce mediante una elección de diseño.

PT-09: Facebook oficial confirmado, recursos originales pendientes. PT-08, PT-11 y PT-13 continúan según [Registro central](README.md). Se conservan compra invitada, WhatsApp oficial, premio por diez sellos y reglas de entrega; la identidad visual no inventa productos, tarifas, reseñas o procedimientos.

