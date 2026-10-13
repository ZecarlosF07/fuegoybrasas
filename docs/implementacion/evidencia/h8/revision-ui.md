# Revisión UI de H8

Sistema canónico 1.0, MASTER, reglas UX/UI y skill `ui-ux-pro-max`. Se revisó el producto implementado; no se creó otra paleta ni se reemplazaron recursos de marca.

Consulta: `focus not obscured --domain ux -n 3`. Resultados de `ux-guidelines.csv`: **Focus Not Obscured (Minimum), Web, AA** exige parcialmente visible; **Enhanced, Web, AAA** exige completo; **Focus Appearance, AAA** trata área/contraste. Se conserva la regla del proyecto de foco completamente despejado; no se atribuye el criterio mejorado a AA ni se afirma certificación.

## Comprobación automática y visual

Los 50 E2E aprobados incluyen axe WCAG 2.2 AA, overflow, etiquetas/errores, teclado/foco, carga contextual, reintentos y estados de cliente/personal/admin. Anchos 360, 390, 768 y 1280, con reflujo 320. Primitivas verifican contraste renderizado y objetivo de control. No hay otra identidad/color directo añadido por H8.

| Área | Evidencia |
| --- | --- |
| Inicio/carta/detalle/fotos | [H3](capturas/h3/capturas/), incluyendo agotado, fallo y reflujo. |
| Acceso/MFA/configuración | [H2](capturas/h2/capturas/) y [primitivas](capturas/h1/capturas/). |
| Editor/soft delete/restauración | [H4](capturas/h4/capturas/). |
| Carrito/datos/continuación | [H5](capturas/h5/capturas/). |
| Alta/tarjeta/atención/premio/pausa | [H6 sin SMS](capturas/h6/acceso-sin-sms/capturas/). |
| Métricas/historial/incidencias/personal | [H7](capturas/h7/capturas/). |

Inspección visual directa de [alta móvil 390](capturas/h6/acceso-sin-sms/capturas/alta-sin-sms-390.png) y [historial de administrador 1280](capturas/h7/capturas/historial-correccion-1280.png): textos/etiquetas legibles, superficies/fuentes/acento coherentes, formularios alineados, saldo y premio separados, confirmaciones y efecto de corrección visibles. Datos exclusivamente sintéticos. No se inspecciona un QR/contraseña real ni se reconstruye logo desde anuncio.

## Pendiente humano

Narrador/lectura de resultados, zoom real 200/400 %, Android/iOS, QR en otro teléfono y regreso real de WhatsApp quedan en [piloto](piloto-y-aceptacion.md). Reflujo/contexts de Chrome simulan dimensiones/sesiones; no reemplazan esos dispositivos. Las capturas corresponden a la regresión nueva y no acreditan por sí solas capacitación o conversión.
