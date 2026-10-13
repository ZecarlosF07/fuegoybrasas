# H3 — Matriz comercial de carga inicial

**Revisión:** 8 de octubre de 2026.  
**Fuentes:** [Análisis](../../../analisis-del-proyecto.md), imágenes del propietario y [H3](../../03-hito-3-catalogo-publico.md).  
**Estado:** precios fuente conservados; PT-05 pendiente de confirmar modalidades/inclusiones faltantes. La carga inicial no autoriza la venta de todos los artículos.

## Referencias conservadas

Todos los precios siguientes son referencias internas en PEN. Solo P05 tiene precio online verificado. C01 está excluido de la web; las demás referencias quedan en borrador, sin usar su precio fuente como precio de compra. UUID, `source_ref` y slug se conservan.

| Referencia | Artículo | Porción conocida | Inclusiones conocidas | Precio fuente | Publicación inicial |
| --- | --- | --- | --- | --- | --- |
| C01 | Pollo a la brasa | ¼ de pollo — para mesa | Papas fritas · Cremas | S/10.00 | Excluido; consumo en mesa |
| C02 | Pollo a la brasa | ¼ de pollo — para llevar | Papas fritas · Cremas | S/13.90 | Borrador; PT-05 |
| C03 | Pollo a la brasa | ½ pollo | Papas fritas · Cremas | S/32.90 | Borrador; PT-05 |
| C04 | Pollo a la brasa | Pollo entero | Papas fritas · Cremas | S/59.90 | Borrador; PT-05 |
| C05 | Salchipapa | No indicada en la fuente | Sin confirmar | S/10.00 | Borrador; PT-05 |
| C06 | Broaster | No indicada en la fuente | Sin confirmar | S/10.00 | Borrador; PT-05 |
| C07 | Alitas clásicas | 4 alitas | Papas fritas | S/15.00 | Borrador; PT-05 |
| C08 | Alitas dulces | 4 alitas | Papas fritas | S/15.00 | Borrador; PT-05 |
| C09 | Alitas picantes | 4 alitas | Papas fritas | S/15.00 | Borrador; PT-05 |
| C10 | Alitas acevichadas | 4 alitas | Papas fritas | S/15.00 | Borrador; PT-05 |
| C11 | Alitas en salsa de maracuyá | 4 alitas | Papas fritas | S/15.00 | Borrador; PT-05 |
| C12 | Lomo saltado | No indicada en la fuente | Sin confirmar | S/15.00 | Borrador; PT-05 |
| C13 | Tallarín saltado | No indicada en la fuente | Sin confirmar | S/15.00 | Borrador; PT-05 |
| C14 | Chaufa de pollo | No indicada en la fuente | Sin confirmar | S/14.00 | Borrador; PT-05 |
| C15 | Chaufa de carne | No indicada en la fuente | Sin confirmar | S/16.00 | Borrador; PT-05 |
| C16 | Mollejitas | No indicada en la fuente | Sin confirmar | S/15.00 | Borrador; PT-05 |
| C17 | Caldo de gallina | No indicada en la fuente | Sin confirmar | S/12.00 | Borrador; PT-05 |
| C18 | Chicharrón de pollo | ¼ de pollo | Sin confirmar | S/19.90 | Borrador; PT-05 |
| C19 | Chicharrón de pollo | ½ pollo | Sin confirmar | S/32.90 | Borrador; PT-05 |
| C20 | Chicharrón de pollo | Pollo entero | Sin confirmar | S/59.90 | Borrador; PT-05 |
| C21 | Mostrito | ⅛ de pollo | Sin confirmar | S/15.00 | Borrador; PT-05 |
| C22 | Mostrito | ¼ de pollo | Sin confirmar | S/20.00 | Borrador; PT-05 |
| C23 | Mostrito | ½ pollo | Sin confirmar | S/36.90 | Borrador; PT-05 |
| C24 | Mostrito | Pollo entero | Sin confirmar | S/69.90 | Borrador; PT-05 |
| P01 | Mostrito | ⅛ de pollo a la brasa | Chaufa · Papas fritas · Ensalada | S/14.90 | Borrador; PT-05 |
| P02 | Pollo entero a la brasa | Pollo entero | Papas fritas · Ensalada · Cremas | S/44.90 | Borrador; PT-05 |
| P03 | Ronda de alitas | 16 alitas | Papas familiares · Ensalada · Cremas | S/44.90 | Borrador; PT-05 |
| P04 | Combo Mostrito | Pollo entero | Papas fritas · Arroz chaufa · Ensalada · Cremas · Gaseosa de 1.5 L | S/59.90 | Borrador; PT-05 |
| P05 | Gran Promoción | Pollo entero + ½ pollo | Papas fritas · Arroz chaufa · Ensalada · Cremas · Gaseosa de 1.5 L | S/89.90 | Publicado; entrega confirmada |

## Decisiones de carga

- Categorías: promociones, pollo a la brasa, mostritos, alitas, platos criollos, chicharrón de pollo y clásicos. Una categoría sin artículos publicables no aparece en la lectura pública.
- P05: precio verificado de S/89.90 para entrega, comparación S/110.00 tomada del mismo anuncio; sin precio de recojo ni la leyenda retirada. El campo de comparación se invalida ante cambios de precio, composición o grupos/opciones.
- Alitas C07–C11: cuatro unidades con papas; P03: dieciséis con papas familiares, ensalada y cremas. No se inventan combinaciones de sabores.
- No heredar las inclusiones de P01 a C21–C24 ni las promociones al catálogo regular. Descripciones, marcas de gaseosa intercambiables y opciones pendientes no se inventan.
- Las fechas de promoción permanecen nulas: el propietario confirmó que siguen vigentes, sin dar una fecha de caducidad.
- No hay fotografías ni logo originales preparados para Storage; se utiliza el fallback del sistema visual (PT-09).
- Horario, ubicación y cargos no verificados se ocultan o muestran como desconocidos. Pedidos y fidelización siguen pausados.

## Cómo confirmar y publicar después

El responsable debe confirmar modalidad aplicable y completar las inclusiones/porciones afectadas. Registrar la decisión con su origen; incorporar un cambio versionado o utilizar el mantenimiento auditado de H4. Añadir precios verificados por modalidad y después publicar. Nunca deducir entrega/recojo del término «para llevar» ni confirmar pendientes mediante una fixture.

La migración de referencia utiliza `ON CONFLICT ... DO NOTHING`: repetirla no sobrescribe ediciones ni vuelve a publicar artículos retirados. Los cambios comerciales posteriores se hacen mediante nuevas migraciones o las operaciones de H4; no se reescribe una migración aplicada.

[Evidencia de H3](README.md).
