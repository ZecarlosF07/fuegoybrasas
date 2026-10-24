# Catálogo y pedido solo de platos — 22/10/2026

**Estado:** implementación verificada en entorno local; nueva publicación todavía no comprobada. Base del trabajo: `c1465bd` más cambios sin commit de esta revisión. Referencia: [DC-27](../../../../diseno-tecnico/22-catalogo-y-pedido-solo-platos.md).

## Cambios

- Detalle y carrito sin selector de modalidad ni formulario logístico. Indicaciones generales opcionales desplegables; dos pasos hasta WhatsApp.
- Precio único compartido por ficha, compra y validación; si los precios fuente difieren, «Precio por confirmar» e incompatibilidad expresa.
- Carta con acción directa en artículos sin opciones obligatorias; opciones requeridas conservan acceso al detalle.
- API estricta solo con líneas; subtotal sin tarifas/zonas/pagos. Mensaje de productos e indicaciones y coordinación de entrega/envío por chat.
- Recuperación de formatos anteriores descarta modalidad/PII y conserva productos e indicaciones. `/pedido/datos` redirige a `/pedido`.
- Aviso de datos del invitado alineado con la retirada de campos; registro de aprobación conserva DC-26 y añade la modificación descriptiva autorizada por DC-27.

## Comprobaciones ejecutadas

| Comando / entorno | Resultado real |
| --- | --- |
| `yarn test --maxWorkers=2` | 135 pruebas aprobadas, 30 archivos. |
| `yarn typecheck` | Aprobado antes de la repetición final de navegador. |
| `yarn lint` | Revisión final aprobada, 82,21 segundos. |
| `yarn build` | Build final con perfil remoto autorizado aprobado, incluidos TypeScript y generación de rutas. Restaura el perfil habitual después de las pruebas locales. |
| `yarn test:release` | 9 pruebas aprobadas, incluida correspondencia de hashes de textos. |
| `yarn db:start` + `yarn db:reset` | Supabase local reconstruido con 25 migraciones. El comando fija `--local`; no se reseteó el proyecto oficial. |
| `yarn test:e2e` | **52 pruebas aprobadas**, 3,3 minutos de navegador; build local y generación TypeScript aprobados. Capturas en [capturas](capturas/). |
| `yarn check:secrets` | 36 recursos estáticos sin claves secretas configuradas. |
| `yarn check:repository-secrets` | 1343 archivos candidatos sin credenciales configuradas ni archivos privados versionados. |

E2E: Chrome instalado, dos workers, servidor de pruebas y Supabase en loopback. `E2E_EVIDENCE_ROOT` apunta a esta carpeta. Incluye catálogo, administración, pedido invitado a cinco anchos, API estricta, cambios comerciales, recuperación, enlace antiguo, agregado directo, tarjeta, canjes y operación administrativa. No se crearon clientes sintéticos en Supabase oficial ni se envió un mensaje real por WhatsApp.

Los primeros intentos de navegador fallaron por desconexión del motor Docker y rechazo de conexiones locales. Se repitió con el motor disponible y una reconstrucción local limpia: las 52 pruebas finalizaron aprobadas. Se observaron avisos de `NO_COLOR` y streams cerrados al navegar; no produjeron fallos de la suite.

## Marca y límites

Se revisaron referentes oficiales y `ui-ux-pro-max`. La paleta vigente de la aplicación se conserva: el amarillo fue aceptado, pero el rojo de la [propuesta 06 de marca](../../../../marca/manual-propuesto-06-rojo-profundo.md) está pendiente de aprobación y no está incluido en estas pruebas. Las láminas son propuestas estáticas, no pantallas desplegadas.

No se atribuyen pruebas humanas de Narrador, dispositivos físicos, recepción de WhatsApp ni certificación de accesibilidad a esta ejecución. Axe, teclado y reflujo automatizado conservan su alcance. Aún falta verificar la nueva versión publicada y la aplicación de marca que se apruebe.
