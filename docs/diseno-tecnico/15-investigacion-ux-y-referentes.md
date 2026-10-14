# 15. Investigación de identidad y referentes UX/UI

**Actualización DC-22, 13/10/2026:** [personal sin MFA](19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. El acceso actual del personal se define en DC-22.

**Versión:** 1.0 · **Fecha de consulta:** 3 de octubre de 2026.  
**Estado:** evidencia pública e interpretación de diseño; sin métricas de conversión propias ni pruebas de usuarios ejecutadas.

## 1. Método y alcance

Se revisaron el material visual aportado, la página de Facebook identificada por el propietario, páginas oficiales de restaurantes y búsquedas locales de `ui-ux-pro-max`. La observación de sitios dinámicos se limita a lo visible durante la consulta. No se enviaron pedidos, se inició sesión ni se comprobó el checkout completo de competidores.

La inspección visual pública incluyó Facebook, Pardos, Don Belisario, Tori y La Leña. Norkys, Club Roky's y la explicación de identidad de Nando's aportaron información accesible en sus páginas oficiales. No se afirma una auditoría integral de accesibilidad, rendimiento móvil o resultados comerciales de ninguna referencia. Una inspección parcial no permite calificarlas como «las mejores» ni prometer sus resultados aquí.

| Tipo de evidencia | Qué permite concluir | Qué no permite concluir |
| --- | --- | --- |
| Imágenes y galería | Recursos visuales, tonos, jerarquías y motivos presentes. | HEX oficiales, archivos originales o derechos de reutilización. |
| Páginas oficiales | Patrones visibles y explicación del propio programa/marca. | Conversión, accesibilidad integral, facilidad de todo el checkout. |
| Skill local | Recomendaciones y resultados de búsquedas concretas. | Preferencias del propietario o éxito de negocio garantizado. |
| Guías y normas | Comportamiento técnico y criterios de accesibilidad aplicables. | Que una pantalla todavía sin construir los cumpla. |

## 2. Facebook y materiales de Fuego y Brasas

El propietario confirmó [esta galería](https://www.facebook.com/profile.php?id=61585453973558&sk=photos); la navegación pública presentó [Fuego y Brasas](https://www.facebook.com/people/Fuego-y-Brasas/61585453973558/?sk=photos). Esa identificación evita confundir locales de nombre similar.

| Observación | Aplicación propuesta | Límite |
| --- | --- | --- |
| Sello circular con llama/leños, letras y aro dorados sobre oscuro. | Mantener emblema y pequeños arcos/motivos propios. | Necesitamos originales aptos; no redibujar ni extraer un logo definitivo de captura. |
| Anuncios crema con titulares oscuros y precios rojizos. | Superficies claras y contraste de texto/precio. | Las composiciones varían; no existe un código de color oficial deducible. |
| Anuncios oscuros de madera/fuego con detalles dorados. | Carbón y acentos para marca, sin cubrir la zona de compra con texturas. | Decoración distinta de jerarquía funcional. |
| Fotografías grandes de pollo/acompañamientos y trazos manuscritos promocionales. | Comida protagonista y voz cercana; texto funcional legible. | No garantizar autenticidad de porciones por un anuncio ni usar manuscritas en formularios. |

El [anuncio de Mostrito y pollo entero](https://www.facebook.com/photo.php?fbid=122137052583181799&set=pb.61585453973558.-2207520000&type=3) coincide visualmente con material aportado. Su publicación incluye un teléfono distinto del confirmado posteriormente por el propietario. Se conserva **982 042 493**, conforme [DC-02](README.md); Facebook no reemplaza esa instrucción.

La galería también contiene precios/ofertas que no coinciden con el catálogo de referencia acordado. No se incorporan a carga inicial, nuevas categorías ni condiciones. La investigación rescata identidad visual, no revalida automáticamente vigencia, porciones, horarios o disponibilidad. PT-09 queda parcialmente aclarado respecto de la red oficial; originales y procedencia siguen pendientes.

## 3. Referentes y adaptación crítica

| Referencia y fuente | Patrón observado | Qué se adapta | Qué requiere otro alcance o no encaja |
| --- | --- | --- | --- |
| [Pardos Chicken](https://www.pardoschicken.pe/) | Categorías, promociones y acceso visible a «Mi pedido», con imágenes de comida. | Categorías reconocibles y pedido accesible; feedback de agregado propio. | Selector de ubicación inicial, cuenta/campañas y carrusel grande no son necesarios para nuestro pedido invitado. |
| [Carta Don Belisario](https://www.donbelisario.com.pe/menu) | Categorías ilustradas y tarjetas con nombre, inclusiones, precio y agregado. | Producto/porción/precio/acción visibles en la misma unidad; no recortar información esencial. | Favoritos, cupones, seguimiento y selección de local no pertenecen al MVP. Precios comparativos solo con respaldo propio. |
| [Tori](https://www.tori.pe/) | Colores de marca distintivos, fotografía protagonista y destinos explícitos para pedir. | Consistencia de pocas familias visuales y llamada a acción clara. | Su amarillo, gallo y tipografía son su identidad; no se copian. Su home no acredita rendimiento de checkout. |
| [La Leña](https://www.lalena.com.pe/) | Fotografías cálidas, discurso familiar y acciones de ordenar. | Cercanía y coherencia entre comida y marca, con invitación secundaria a fidelización. | No incorporar promesa de envío gratis, beneficios propios de su cuenta ni introducción que retrase ver la carta. |
| [Norkys](https://norkys.pe/) | Familias de productos y presentación de platos destacados con contenido/precio. | Organización reconocible del catálogo. | No inventar un ranking propio ni etiquetas de venta sin evidencia. |
| [Club Roky's](https://rokys.com/club-rokys) | Comunicación de participar, acumular y canjear beneficios. | Explicar alta, progreso y premio como pasos distintos. | No trasladar reglas de puntos o incentivos; Fuego y Brasas conserva sellos acordados. |
| [Nando's: Our Look](https://www.nandos.com/heritage/our-look/) | Explica relación de su logotipo, tipografía, color y motivos con su origen. | Construir identidad coherente desde el sello y las brasas propias. | No copiar sus motivos culturales, fuentes o activos; es una referencia de coherencia, no de identidad equivalente. |

Se utiliza cada página para el patrón que respalda; no se deduce que todas sus pantallas compartan esa calidad. Las decisiones concretas están en [Sistema visual](../../.agents/brand/sistema-visual.md), con justificación ampliada en [Documento 14](14-identidad-visual-y-sistema-ui.md).

## 4. Uso de UI/UX Pro Max

Skill leída: `ui-ux-pro-max`, disponible en este entorno en `C:/Users/ZeCarlos/.codex/skills/ui-ux-pro-max/SKILL.md`. Para otros equipos localizarla mediante su catálogo, no asumir esa ruta. Los comandos siguientes representan consultas efectuadas en esta investigación; su script se invoca desde la carpeta de la skill. No se persistieron plantillas automáticas como diseño definitivo.

| Consulta/modo | Resultado pertinente | Síntesis y decisión |
| --- | --- | --- |
| `restaurant rotisserie warm premium` · `--design-system` | Propuesta de relato por scroll y efectos tipo Liquid Glass. | No encaja con carta y pedido primero; se reescribió una vez. |
| `restaurant food ordering` · `--design-system` | Dirección de bloques vivos, rojo/dorado y tipografía Restaurant Menu. | Aprovechar jerarquía/comida; descartar relato genérico de marketing, scroll-snap y adopción literal de colores. |
| `restaurant food photography` · `--domain style` | Vintage Analog/Organic Biophilic/Nature Distilled. | Calidez y fotografía como orientación limitada; no estilo verde de bienestar. |
| `warm serif hospitality` · `--domain typography` | Restaurant Menu: Playfair Display SC/Karla. | Referencia tipográfica de contraste entre carácter y legibilidad; no es la pareja adoptada. |
| `Fraunces Manrope` · `--domain typography` | Fashion Forward con otra pareja. | No validó nuestra combinación; no atribuirla a ese resultado. |
| `Fraunces warm serif` · `--domain google-fonts` | Familia Fraunces, variable y subconjuntos latinos. | Verificación individual de la familia elegida. |
| `Manrope interface legibility` · `--domain google-fonts` | Familia Manrope, variable y subconjuntos latinos. | Verificación individual; su combinación con Fraunces es recomendación de diseño propia adoptada por el plan. |
| `focus not obscured` · `--domain ux` | Distingue mínimo AA y visibilidad completa reforzada. | Control enfocado completamente visible como criterio del producto; no atribuirlo literalmente al mínimo AA. |
| `accessible authentication` · `--domain ux` | Gestores de contraseña y pegado de códigos. | Aplicar a contraseña/rol vigente/OTP existentes, sin añadir passkeys u OAuth. |
| `error summary validation` · `--domain ux` | Resumen enlazado y errores asociados. | Al enviar enfocar resumen cuando existe; en otro caso primer campo inválido. Sin foco automático por blur. |
| `images fonts mobile` · `--stack nextjs` | Fuentes e imágenes optimizadas, con consejo de `priority` desactualizado. | Guías del Next.js instalado prevalecen; no copiar esa API deprecada. |

La generación automática sugirió patrones generales, no un diseño validado de Fuego y Brasas. La paleta, combinación tipográfica y composición final son síntesis propia con el material del negocio y las restricciones del producto. [Fuentes Fraunces](https://fonts.google.com/specimen/Fraunces), [Manrope](https://fonts.google.com/specimen/Manrope).

## 5. Accesibilidad y integración verificadas como especificación

- [WCAG: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): contrastes de texto y límites de dorado/naranja claros. Ratios calculados en la fuente canónica; la futura pantalla necesita revisión de sus pares renderizados.
- [WCAG: foco no oculto](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): las barras y diálogos no deben ocultar el foco. El proyecto refuerza la visibilidad completa.
- [WCAG: autenticación accesible](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html): permitir pegado, gestores y ayudas; sin imponer nuevos métodos fuera del contrato.
- [WCAG: tamaño del objetivo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): distinguir mínimo normativo y objetivo táctil del producto, definido en el sistema visual.
- Guías instaladas: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` e `image.md`. Se confirmó autoalojamiento mediante `next/font` y deprecación de `priority` en favor de opciones vigentes; elección exacta según imagen/LCP al implementar.
- [AGENTS.md oficial](https://learn.chatgpt.com/docs/agent-configuration/agents-md) y [skills oficiales](https://learn.chatgpt.com/docs/build-skills): entrada de instrucciones y descubrimiento de skills son mecanismos diferentes. Nuestras reglas tienen referencia explícita desde el archivo raíz.

## 6. Qué falta comprobar con la aplicación

El diseño todavía debe probarse con fotos/recursos definitivos, dispositivos y usuarios. El primer agregado y la preparación de una solicitud tendrán medición de tiempos en piloto, sin afirmar mejoras porcentuales. Se observarán errores, comprensión de porciones/importes, regreso desde WhatsApp, progresos/premios y reconocimiento de resultados inciertos por el personal.

Esta investigación no ejecutó esos recorridos ni demuestra conformidad de una web que todavía no existe. La [guía de hitos](../implementacion/hitos-del-proyecto.md) exige las evidencias futuras. Los datos pendientes y PT-08/PT-11/PT-13 siguen en el [registro central](README.md).

