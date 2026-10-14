# 09. Plan de implementación

**Actualización DC-22, 13/10/2026:** [personal sin MFA](19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Actualización del 10/10/2026:** [acceso privado sin SMS](16-acceso-a-tarjeta-sin-sms.md) sustituye OTP/phone_change e identidad telefónica del cliente; El acceso actual del personal se define en DC-22.

**Versión:** 1.1 · **Fecha:** 3 de octubre de 2026.  
**Relacionado:** [Índice](README.md), [Operación](07-despliegue-y-operacion.md), [Pruebas](08-pruebas-y-aceptacion.md).

## 1. Principios de ejecución

Este plan organiza el desarrollo posterior; no afirma que exista una aplicación de pedidos/fidelización implementada. Cada etapa entrega comportamiento revisable con verificación pertinente. No se fija una fecha de lanzamiento ni un presupuesto sin datos.

Conservar Next.js 16.3.8 y consultar sus guías instaladas antes de escribir código. Evitar cambios de framework, campañas, pasarela, POS o backend independiente. Un ajuste de alcance registra decisión y actualiza contratos/datos/pruebas.

## 2. Etapas y dependencias

| Etapa | Trabajo y entregables | Depende de | Condición para finalizar |
| --- | --- | --- | --- |
| E0. Preparación | Confirmar datos críticos, validar proveedor OTP/hosting y materiales; abrir entornos separados y completar registro de decisiones. | Paquete documental. | Pendientes clasificados; ninguna condición comercial inventada; entornos identificados. |
| E1. Base técnica | Instalar SDK/SSR/Zod y herramientas; clientes por petición, validación de env, DTO, DAL server-only y estructura de módulos; preparar Auth interno/permisos sin otorgar roles desde navegador. | E0 para cuentas; local puede avanzar con configuración sintética. | TypeScript/lint/build pasan; no claves privilegiadas en cliente; renovación/logout y estados de configuración verificables. |
| E2. Datos y permisos | Migraciones, constraints, catálogo/configuración, seed y RPC de lectura; proyección pública sin grants directos, helpers de autorización y tipos generados. | E1. | Reset local reproducible; grants/RPC/RLS probados; 29 referencias preservadas y C01 fuera de venta web; identidad telefónica única de Auth. |
| E3. Catálogo mantenible | Carta pública y panel privado mínimo; identidad/permisos de responsable para mantenimiento, revisión de versión y auditoría. | E2 y Auth interno de E1. | Cambiar precio/agotado se refleja; conflictos no sobrescriben; publicación valida datos. |
| E4. Carrito y checkout | Reducer, borrador dividido por sensibilidad, opciones, modalidad, importes, formulario y API de validación. | E2; E3 para datos publicables. | CA-04 a CA-19 pertinentes pasan; no solicitud guardada en Supabase; cambios conservan carrito. |
| E5. WhatsApp | Mensaje canónico, revisión/continuación, enlace, copia, URL larga y retorno. | E4. | CA-20 a CA-22 y pruebas móviles; destinatario correcto, sin estados de venta inventados. |
| E6. Cliente y tarjeta | Enlace privado sin SMS, activación con términos, perfil, tarjeta propia e indicaciones. | E2 y configuración de acceso privado probada de E0. | Acceso propio/ajeno comprobado; compra invitada independiente; preferencias no alteran pedidos ocultamente. |
| E7. Atención y transacciones | Búsqueda exacta, sello después de pago/entrega, premios, canje, diario de operaciones, idempotencia y concurrencia. | E6 y permisos internos. | 9→10→11 y 20 sellos; recarga/reintentos, pausas y canjes concurrentes pasan en base real. |
| E8. Responsable y contingencias | Reversión, incidencias, corrección de perfil por solicitud, cuentas individuales, desactivación, respaldo/restauración y registro posterior controlado. | E7; PT-13 para excepción de entrega del premio. | Corrección trazable, regalo entregado conservado, último responsable protegido y recuperación ensayada; excepción de canje resuelta según acuerdo. |
| E9. Piloto y lanzamiento | Revisión comercial final, accesibilidad, dispositivos reales, desempeño y ensayo con el personal; despliegue por flags. | E3 a E8 según función. | Evidencias críticas completas y configuración lista; aprobar operación real antes de activar cada función. |

La autenticación interna se introduce antes del panel, aunque la tarjeta del cliente aparezca después. La base se construye antes de UI de sellos; no existe contador de muestra presentado como fidelización operativa.

## 3. Entregas revisables

**Primer bloque, E1–E3:** base real y catálogo editable por responsable. Puede revisarse con fixtures y estados incompletos claramente identificados, sin publicar datos no confirmados.

**Segundo bloque, E4–E5:** pedido como invitado, recuperación y WhatsApp. Permite probar compra sin esperar al programa, con datos comerciales validados. Publicarlo antes que fidelización solo si se acuerda un lanzamiento parcial; la primera versión objetivo sigue incluyendo ambas funciones.

**Tercer bloque, E6–E8:** identidad, tarjeta y atención completa. Antes de hacerlo público validar costo del premio, SMS, permisos vigentes, permisos y procedimiento del personal. No mostrar tarjeta activa si el acceso sigue simulado.

**Último bloque, E9:** piloto de pedido individual/familiar, correcciones y visita/canje, revisión de fallos y activación controlada. Las operaciones de ensayo se registran en staging; no contaminar tarjetas reales con pruebas.

## 4. Consultas de negocio en el momento necesario

| Momento | Consultar / verificar | Trabajo que puede continuar |
| --- | --- | --- |
| Antes de publicar E3 | Inclusiones, modalidades, equivalencias, opciones y materiales oficiales. | Componentes, esquema y validación con fixtures. |
| Antes de cerrar E4 | Métodos reales, dirección/recojo, cobertura/cargos y horarios cuando se habiliten. | Borrador, mensajes pendientes y cálculos sintéticos. |
| Antes de activar E6 | Proveedor/costo OTP y condiciones de privacidad/participación. | Auth local, permisos y tarjeta con usuarios sintéticos. |
| Antes del piloto E7–E8 | Costo del Mostrito, personal, responsable y recuperación/contingencias. | Transacciones y pruebas de concurrencia. |

La regla de acreditación ya está resuelta: compra pagada y **pedido entregado** en visita presencial. No se vuelve a preguntar ni se adelanta el sello al cobro. Las alternativas de premio intermedio/puntos siguen fuera de la primera implementación.

## 5. Orden de pruebas y control de cambios

Ejecutar pruebas del cambio en cada etapa; no posponer permisos o concurrencia al final. Tras cambios de esquema generar tipos y revisar los contratos que consumen esos campos. Tras reglas comerciales revisar importes/mensajes y casos correspondientes. Tras Auth revisar accesos directos, sesiones y caché.

Validación final reúne RF-01–RF-18, CA-01–CA-36 y CT-01–CT-39; registra qué se ejecutó y en qué entorno. No repetir suites sin motivo después de pasar: ampliar cuando cambie código, aparezca un fallo o quede una duda material.

Cambios fuera de alcance se anotan para después: puntos por gasto, beneficio intermedio, historial de platos, marketing automático, integraciones de caja y analítica comercial. No añadirlos para resolver una limitación menor del MVP.

## 6. Definición de terminado

- Catálogo y promociones coinciden con fuentes confirmadas; responsables pueden mantenerlos de forma segura.
- Pedido invitado conserva borrador, valida condiciones y abre WhatsApp con mensaje completo sin almacenar la solicitud.
- Cliente verifica teléfono, ve exclusivamente su tarjeta y controla indicaciones.
- Personal autorizado acredita entrega pagada, registra canjes y resuelve reintentos sin duplicar.
- Responsable corrige con trazabilidad, revisa incidencias y administra permisos sin perder auditoría.
- Pruebas críticas, dispositivos reales, respaldo/restauración y piloto tienen evidencias; configuración/condiciones pendientes de publicación se han cerrado.
- Documentación refleja el comportamiento implementado y las limitaciones reales de operación.
