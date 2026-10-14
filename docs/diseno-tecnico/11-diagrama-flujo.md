# 11. Diagramas de flujo de la aplicación

**Actualización DC-22, 13/10/2026:** [personal sin MFA](19-acceso-del-personal-sin-mfa.md) sustituye los requisitos de segundo factor, enrolamiento y AAL2 de este documento. Acceso con correo/contraseña, cuenta activa y rol vigente; cliente sin SMS. Evidencia histórica conserva las reglas comprobadas en su fecha.

**Actualización del 10/10/2026:** el acceso del cliente es por enlace privado/QR, sin SMS; nombre y teléfono son datos declarados. [Diseño vigente](16-acceso-a-tarjeta-sin-sms.md) sustituye las menciones anteriores a OTP, identidad telefónica Auth y `phone_change` del cliente. El acceso actual del personal se define en DC-22.

**Versión:** 1.0 · **Fecha:** 3 de octubre de 2026.  
**Estado:** flujos vigentes; implementación y comprobaciones en [H7](../implementacion/evidencia/h7/README.md). La evidencia distingue aprobación técnica de revisión humana/piloto.  
**Base:** [Análisis](../analisis-del-proyecto.md), [Fidelización](02-fidelizacion.md), [Contratos](05-contratos-y-operaciones.md) y [Tablas/soft delete](10-tablas-db.md).  
**Complementos:** [Navegación](12-flujo-navegacion.md), [Carpetas](13-estructura-carpetas.md).

## 1. Lectura de los diagramas

Los rectángulos representan acciones y los rombos decisiones. Los subgrupos señalan responsabilidades; las flechas discontinuas indican continuidad opcional, recuperación o trabajo manual fuera de la web. Son flujos de comportamiento: las URLs se detallan en el [documento de navegación](12-flujo-navegacion.md).

Hay tres recorridos independientes: pedido como invitado, tarjeta opcional del cliente y operación privada del personal. Autenticarse no es requisito para comprar. Un fallo de fidelización permite seguir el pedido si el catálogo puede validarse; una caída de la base que impide validar precios permite conservar el borrador y contactar al local, sin presentar una cotización vigente.

## 2. Flujo general

```mermaid
flowchart TD
    INICIO([Entrada a Fuego y Brasas]) --> CARTA[Consultar carta pública]
    INICIO --> ACCESO_CLIENTE[Acceso opcional a Mi tarjeta]
    INICIO --> ACCESO_STAFF[Acceso privado del personal]

    subgraph PEDIDO[Pedido como invitado]
        CARTA --> CONSULTA{Catálogo disponible}
        CONSULTA -->|Sí| ELEGIR[Seleccionar producto y opciones confirmadas]
        CONSULTA -->|No| CONSERVAR[Conservar borrador y ofrecer contacto del local]
        ELEGIR --> CARRITO[Editar carrito y modalidad]
        CARRITO --> DATOS[Completar datos mínimos según recepción]
        DATOS --> VALIDAR[Next.js valida carrito con catálogo fresco]
        VALIDAR --> RESULTADO{Resultado}
        RESULTADO -->|Cambios o incompatibilidades| REVISAR[Mostrar diferencias sin perder selecciones]
        REVISAR --> CARRITO
        RESULTADO -->|Pausa o cierre confirmado| ESPERAR[Conservar pedido e informar atención pendiente]
        RESULTADO -->|Dependencia caída| CONSERVAR
        RESULTADO -->|Listo| MENSAJE[Preparar mensaje canónico en el navegador]
        MENSAJE --> ENLACE[Mostrar enlace real y alternativa de copia]
        ENLACE --> WA[WhatsApp externo: envío manual]
        WA -.-> COORDINAR[Personal confirma disponibilidad, importe y atención]
        WA -.-> RETORNO[Volver a la web con el borrador conservado]
        RETORNO --> CARRITO
    end

    subgraph CLIENTE[Tarjeta opcional]
        ACCESO_CLIENTE --> OPCION{Crear tarjeta o abrir enlace}
        OPCION -->|Crear| ALTA[Nombre, contacto y condiciones aceptadas]
        ALTA --> CREAR[Crear perfil y tarjeta una vez, guardar clave privada]
        OPCION -->|Enlace privado| CLAVE[Retirar fragmento y abrir expresamente]
        CLAVE --> IDENTIDAD{Clave vigente y perfil activo}
        IDENTIDAD -->|Sí| TARJETA[Consultar tarjeta propia e indicaciones]
        IDENTIDAD -->|No| RECUPERACION[Error seguro o revisión del responsable]
        CREAR --> TARJETA
        TARJETA --> PREFERENCIAS[Editar indicaciones o contacto con revisión]
        TARJETA -.-> CARTA
    end

    subgraph PERSONAL[Operación autorizada]
        ACCESO_STAFF --> AUTH_STAFF[Correo, contraseña y rol vigente]
        AUTH_STAFF --> ROL{Cuenta vigente y rol autorizado}
        ROL -->|No| DENEGAR[Denegar operaciones privadas]
        ROL -->|Atención o responsable| BUSCAR[Buscar contacto declarado y confirmar tarjeta]
        BUSCAR --> FICHA[Consultar ficha mínima y movimientos recientes]
        FICHA --> ACCION{Acción de atención}
        ACCION -->|Compra pagada y entregada presencialmente| SELLO[Acreditar un sello en transacción]
        SELLO --> UMBRAL{Completa diez sellos}
        UMBRAL -->|Sí| PREMIO[Emitir o restaurar premio y avanzar ciclo]
        UMBRAL -->|No| PROGRESO[Mostrar progreso confirmado]
        PREMIO --> PROGRESO
        ACCION -->|Premio disponible en visita posterior| CANJE[Registrar un canje y entregar el Mostrito]
        CANJE --> SALDO[Conservar progreso del siguiente ciclo]
        ROL -->|Responsable| ADMIN[Mantener carta, configuración, incidencias y accesos]
    end

    COORDINAR -.-> VISITA{Finaliza como visita presencial elegible}
    VISITA -->|Sí, pagada y entregada| BUSCAR
    VISITA -->|No| SIN_SELLO[Sin acreditación automática]
```

La coordinación por WhatsApp es externa. La web no observa si el visitante envió el mensaje, pagó o recibió el pedido; abrir el enlace no genera orden, sello ni estado de venta confirmada. La compra iniciada allí solo puede originar sello si termina como visita presencial elegible confirmada por el personal.

## 3. Preparación, revisión y recuperación del pedido

```mermaid
flowchart TD
    BORRADOR[Restaurar borrador del dispositivo] --> STORAGE{Persistencia disponible}
    STORAGE -->|Sí| RESTAURAR[Hidratar antes de guardar cambios]
    STORAGE -->|No| MEMORIA[Continuar en memoria con aviso de conservación limitada]
    RESTAURAR --> INDICACIONES{Faltan indicaciones marcadas previamente}
    INDICACIONES -->|Sí| REESCRIBIR[Reescribir o confirmar seguir sin esas indicaciones]
    INDICACIONES -->|No| EDITAR[Editar productos y datos]
    REESCRIBIR --> EDITAR
    MEMORIA --> EDITAR
    EDITAR --> LOCAL[Validar nombre, recepción y campos condicionales localmente]
    LOCAL --> LOCAL_OK{Datos completos y válidos}
    LOCAL_OK -->|No| CAMPOS[Mostrar errores de campo y conservar contenido]
    CAMPOS --> EDITAR
    LOCAL_OK -->|Sí| SNAPSHOT[Capturar revisión local y enviar IDs, cantidades, opciones y modalidad]
    SNAPSHOT --> SERVIDOR[Validar flags, horario, publicación, borrado, stock, precios y opciones]
    SERVIDOR --> TARIFA[Calcular subtotal y cargos conocidos o pendientes]
    TARIFA --> MISMA_REVISION{La respuesta corresponde al borrador actual}
    MISMA_REVISION -->|No| DESCARTAR[Descartar respuesta anterior y revalidar]
    DESCARTAR --> SNAPSHOT
    MISMA_REVISION -->|Sí| VALIDO{Carrito compatible}
    VALIDO -->|No| LINEAS[Mostrar problemas de línea, modalidad, cobertura o configuración]
    LINEAS --> EDITAR
    VALIDO -->|Sí| CAMBIOS{Cambió precio o revisión observada}
    CAMBIOS -->|Sí| ACEPTAR[Presentar diferencias para aceptación explícita]
    ACEPTAR --> SNAPSHOT
    CAMBIOS -->|No| CANONICO[Construir mensaje con datos canónicos y datos personales locales]
    CANONICO --> VIGENCIA{Validación vigente y borrador sin cambios}
    VIGENCIA -->|No| SNAPSHOT
    VIGENCIA -->|Sí| LONGITUD{URL codificada dentro del límite técnico}
    LONGITUD -->|Sí| TEXTO[Ofrecer Abrir WhatsApp con mensaje]
    LONGITUD -->|No| COPIA[Mostrar mensaje completo para copiar y abrir chat sin texto]
    TEXTO --> EXTERNO[Envío manual en WhatsApp]
    COPIA --> CLIPBOARD{Copia confirmada por el navegador}
    CLIPBOARD -->|Sí| CHAT[Confirmar copia y ofrecer chat]
    CLIPBOARD -->|No| SELECCION[Permitir seleccionar y copiar el texto visible]
    CHAT --> EXTERNO
    SELECCION --> EXTERNO
    EXTERNO -.-> VUELTA[Volver sin vaciar ni confirmar el pedido]
    VUELTA --> EDITAR
```

Reglas del contrato: validación dura como máximo 60 segundos, con plazo monotónico desde el inicio de la petición; edición/recarga obliga a revalidar. El límite técnico de URL codificada es 7.000 caracteres; superar el límite no trunca artículos. Nombre, dirección, referencias y observaciones no viajan a Supabase para validar el carrito.

Persistencia: `localStorage` conserva artículos/opciones/cantidades/modalidad y marcador sin texto de indicaciones; `sessionStorage` conserva datos personales e indicaciones por línea. La falta de una indicación requiere revisión y evita fusionar líneas silenciosamente. Costos desconocidos y total final son pendientes, nunca cero inventado. Se muestran solo medios de pago confirmados; recojo requiere ubicación confirmada.

Un producto/opción/precio eliminado o con padre eliminado invalida la línea. No se reemplaza por otro. P05 es incompatible con recojo; retirar la leyenda no cambia esa restricción. Catálogo agotado o fuera de vigencia, negocio cerrado y programa pausado son estados distintos.

## 4. Sello, premio y canje

```mermaid
flowchart TD
    FICHA[Personal identifica cliente y tarjeta vigente] --> ELECCION{Operación}
    ELECCION -->|Sello| VISITA{Compra presencial pagada y pedido entregado}
    VISITA -->|No| NO_CREDITAR[No acreditar]
    VISITA -->|Sí| PREPARAR[Guardar diario mínimo y UUID de operación]
    PREPARAR --> DIARIO{Diario guardado}
    DIARIO -->|No| CONTINGENCIA[Usar contingencia sin anunciar sello registrado]
    DIARIO -->|Sí| RPC_SELLO[credit_stamp con JWT del personal]
    RPC_SELLO --> GUARDS[SQL comprueba actor, rol vigente, perfil, tarjeta, programa e idempotencia]
    GUARDS --> PERMITIDO{Operación permitida}
    PERMITIDO -->|No| ERROR[Mostrar error funcional o de servicio]
    PERMITIDO -->|Sí| BLOQUEAR[Bloquear recursos en orden y comprobar visita repetida]
    BLOQUEAR --> SUMAR[Insertar sello y aumentar net_stamps una vez]
    SUMAR --> UMBRAL{Se completa un umbral de diez}
    UMBRAL -->|No| COMMIT_SELLO[Confirmar eventos, proyección, auditoría y recibo]
    UMBRAL -->|Sí| ORDINAL{Ya existe el ordinal anulado}
    ORDINAL -->|No| EMITIR[Crear premio available y evento reward_issued]
    ORDINAL -->|Sí| RESTAURAR[Restaurar mismo UUID y registrar reward_restored]
    EMITIR --> COMMIT_SELLO
    RESTAURAR --> COMMIT_SELLO
    COMMIT_SELLO --> MOSTRAR[Mostrar resultado confirmado y premios independientes]

    ELECCION -->|Canje| DERECHO{Premio available y visita posterior confirmada}
    DERECHO -->|No| NO_CANJE[No consumir premio]
    DERECHO -->|Sí| STOCK{Producto del premio disponible}
    STOCK -->|No| CONSERVAR_PREMIO[Conservar premio para otra visita]
    STOCK -->|Sí| PREPARAR_CANJE[Guardar diario y UUID de canje]
    PREPARAR_CANJE --> DIARIO_CANJE{Diario guardado}
    DIARIO_CANJE -->|No| CONTINGENCIA
    DIARIO_CANJE -->|Sí| RPC_CANJE[redeem_reward valida y bloquea tarjeta y premio]
    RPC_CANJE --> LIBRE{Premio aún disponible al obtener bloqueo}
    LIBRE -->|No| CONSUMIDO[Informar canje ya realizado y estado actual]
    LIBRE -->|Sí| COMMIT_CANJE[Marcar redeemed, evento con costo de referencia y recibo]
    COMMIT_CANJE --> ENTREGA[Personal entrega el Mostrito]
    ENTREGA --> ENTREGADO{Entrega física completada}
    ENTREGADO -->|Sí| FIN_CANJE[Premio consumido; progreso conservado]
    ENTREGADO -->|No| INCIDENCIA[Registrar incidencia y revisión del responsable]
    INCIDENCIA --> VERIFICAR_NO_ENTREGA{Administrador confirma no entrega y motivo}
    VERIFICAR_NO_ENTREGA -->|No confirmado| MANTENER_REVISION[Conservar incidencia y escalar]
    VERIFICAR_NO_ENTREGA -->|Confirmado| RESTITUIR[reinstate_reward: mismo premio available y evento enlazado al canje]
    RESTITUIR --> CERRAR_CASO[Cerrar incidencia; saldo y canje original conservados]
```

El décimo sello deja progreso 0/10 y un premio disponible; el undécimo, 1/10 conservando ese premio. Veinte sellos originan dos premios. El canje no reduce `net_stamps`, no reinicia el ciclo y no suma sello por sí mismo. Una compra adicional elegible en la visita del canje tiene otra operación explícita.

Solo cuentan visitas reales distintas, aunque sean el mismo día; varios platos en una visita no multiplican sellos. UUID evita repetir una petición, pero no demuestra que dos UUID representen visitas distintas. Personal revisa últimos movimientos y referencia de visita, cuando existe.

Versiones retiradas conservan la regla de sus tarjetas. Pausa del programa bloquea nuevas altas/sellos/canjes y conserva consulta de progreso. Perfil/tarjeta eliminados no se reactivan al login; personal eliminado no opera con su JWT anterior. Un premio voided oculto sigue existiendo para restaurar su ordinal con el mismo UUID.

El diagrama mantiene el orden de canje acordado: confirmar registro digital y después entregar físicamente. DC-13 resuelve PT-13 con restitución supervisada por administrador, motivo y evento inmutable; no introduce transacción entre cocina y base ni restitución automática. Dos resoluciones concurrentes solo restituyen una vez.

## 5. Correcciones, reintentos y caídas

```mermaid
flowchart TD
    REVISAR[Responsable autorizado revisa evento original] --> MOTIVO[Seleccionar sello erróneo y motivo de 10 a 500 caracteres]
    MOTIVO --> REVERSION[reverse_stamp: UUID, permiso y bloqueo de tarjeta]
    REVERSION --> ORIGINAL{Original vigente y no revertido}
    ORIGINAL -->|No| DUPLICADO[Rechazar segunda reversión]
    ORIGINAL -->|Sí| CALCULAR[Calcular saldo posterior y premios afectados]
    CALCULAR --> CANJEADOS{Algún premio afectado ya está redeemed}
    CANJEADOS -->|Sí| REVIEW[Crear incidencia y recibo review_required]
    REVIEW --> SIN_CAMBIOS[Conservar contador y canje; revisión comercial]
    CANJEADOS -->|No| APLICAR[Agregar stamp_reversed y actualizar proyección]
    APLICAR --> ANULAR[Anular premios afectados available con reward_voided]
    ANULAR --> CONFIRMAR[Commit atómico y resultado aplicado]
    SIN_CAMBIOS --> NOTA[Cierre autorizado con nota no cambia saldo]

    ENVIO[Mutación enviada] --> RESPUESTA{Resultado conocido}
    RESPUESTA -->|Commit confirmado| EXITO[Aplicar resultado real y retirar diario pendiente]
    RESPUESTA -->|Rechazo confirmado| FALLO[Mostrar causa sin efecto optimista]
    RESPUESTA -->|Red perdida o timeout| INCIERTO[Conservar UUID y huella; estado uncertain]
    INCIERTO --> CONSULTAR[get_operation en primario y permiso vigente]
    CONSULTAR --> RECIBO{Recibo encontrado}
    RECIBO -->|Sí| RECUPERAR[Recuperar efecto original y estado actual autorizado]
    RECUPERAR --> EXITO
    RECIBO -->|No| MISMA_ENTRADA{Puede reconstruirse la misma entrada y huella}
    MISMA_ENTRADA -->|Sí| REINTENTO[Reintentar mismo UUID y entrada]
    REINTENTO --> ENVIO
    MISMA_ENTRADA -->|No| SUPERVISION[Responsable revisa referencia y movimientos antes de otra operación]

    CAIDA[Servicio de fidelización caído] --> COMPRA[Continuar compra independiente si catálogo validable]
    CAIDA --> REGISTRO[Anotar contingencia interna con referencia y fecha real de entrega]
    REGISTRO --> VOLVER[Responsable revisa duplicados al recuperar servicio]
    VOLVER --> DIFERIDO[Acreditación diferida autorizada con misma referencia de contingencia]
```

`not_found` significa que no se ve un recibo confirmado en esa lectura; la petición original aún podría estar en curso. Nunca permite sustituir el UUID. Un replay comprueba permiso actual: no habilita operaciones a personal eliminado o degradado. Tras recarga se revisa el diario antes de permitir otra acreditación/canje sobre esa tarjeta; no se guardan motivos libres o PII solo para automatizar reintentos.

Correcciones agregan hechos y conservan originales. Borrado lógico no corrige sellos ni canjes. Incidencias abiertas no se ocultan; versiones utilizadas y premios redeemed/available están protegidos. Cancelación anterior a entrega no origina sello; devolución posterior se revisa como incidencia, sin inventar política comercial.

## 6. Mantenimiento y conservación

```mermaid
flowchart TD
    ADMIN[Responsable activo] --> OPERACION{Mantenimiento}
    OPERACION -->|Edición| PATCH[Validar campos permitidos y revisión esperada]
    PATCH --> VALIDAR[Comprobar publicación, padres vigentes y datos confirmados]
    VALIDAR --> EDICION[Aplicar cambios y aumentar revisiones correspondientes]
    EDICION --> AUDITAR[Auditoría y recibo en la misma transacción]
    OPERACION -->|Borrado lógico| RESTRICCIONES[Verificar entidad, referencias, estado y motivo]
    RESTRICCIONES --> SE_PUEDE{Entidad eliminable sin violar protecciones}
    SE_PUEDE -->|No| RECHAZAR[CONFLICT sin modificar datos]
    SE_PUEDE -->|Sí| DELETE[Asignar deleted_at, deleted_by y delete_reason]
    DELETE --> OCULTAR[Retirar acceso operativo y conservar relaciones]
    OCULTAR --> AUDITAR
    OPERACION -->|Restauración| PADRES[Verificar padres y entidad restaurable]
    PADRES --> RESTAURABLE{Restauración permitida}
    RESTAURABLE -->|No| RECHAZAR
    RESTAURABLE -->|Sí| RESTORE[Limpiar metadatos y mantener estado seguro]
    RESTORE --> AUDITAR
    AUDITAR --> RECARGAR[Volver a consultar proyección autorizada]
    RECARGAR --> REVISION[Revisión explícita antes de publicar o reautorizar]
```

Premios tienen una restauración especial dentro de la acreditación; no pasan por el botón genérico del diagrama. Staff eliminado queda inactivo; cliente/tarjeta, cerrados; catálogo vuelve a borrador/deshabilitado. Eventos, recibos, auditoría y singleton no pasan por eliminación. Los detalles de restricciones y bloqueos están en [Tablas DB](10-tablas-db.md).

## 7. Comprobaciones previstas

| Recorrido | Resultado verificable |
| --- | --- |
| Invitado y Auth caído | Continúa hasta WhatsApp si se puede validar catálogo. |
| Cambio comercial/borrado durante selección | Revisión explícita sin pérdida del borrador. |
| Regreso, recarga y URL larga | Borrador conservado, revalidación y mensaje completo. |
| Novena, décima y undécima visita | 9/10, premio con 0/10, luego 1/10 conservando premio. |
| Dos acreditaciones reales concurrentes | Ambas se suman; misma operación repetida aplica una vez. |
| Dos canjes sobre un premio | Un solo canje confirmado. |
| Agotamiento o falta de visita posterior | Premio permanece available. |
| Reversión con premio canjeado | review_required y saldo sin cambios. |
| Soft delete y restauración | Acceso/selección bloqueados, historia y UUID preservados. |
| Entrega física fallida después de canje | Incidencia y restitución supervisada DC-13 tras confirmar no entrega; mismo premio/saldo, original conservado. |

Se enlazan con [Pruebas y aceptación](08-pruebas-y-aceptacion.md). Son criterios de diseño; no se afirma haber probado todavía estos comportamientos en una aplicación.
