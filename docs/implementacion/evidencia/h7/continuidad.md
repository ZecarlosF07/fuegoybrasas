# H7 — Respaldo, recuperación y contingencias

**Estado:** ensayo SQL/Auth aislado ejecutado y aprobado el 11/10/2026. Ensayo integral de Storage/configuración/MFA, servicios productivos y capacitación corresponden a H8/PT-12. No se afirma restauración productiva; PT-11 conserva textos/plazos pendientes y DC-15 excluye baja de clientes.

## Inventario y preparación

Conservar Git, migraciones SQL, versiones de dependencias, configuración Auth (SMTP, redirects, CAPTCHA, MFA, hooks) y configuración de hosting/secrets mediante el mecanismo privado del operador. No incluir secretos en este documento ni en capturas. Confirmar qué cubre el plan contratado antes de atribuirle backups o PITR.

Un respaldo PostgreSQL no garantiza copia de los bytes de Storage ni de configuración externa. Inventariar buckets, objetos/rutas y sus versiones; copiar los recursos por un mecanismo aprobado y comprobar su recuperación. Verificar también que el mecanismo elegido restaura las identidades Auth referenciadas y MFA sin degradar permisos.

## Secuencia de un incidente

1. Responsable pausa escrituras mediante flags y evita operaciones de personal; catálogo/pedido invitado pueden continuar cuando su fuente comercial sea validable. No reiniciar contadores para ocultar discrepancias.
2. Operador identifica el punto de recuperación y restaura primero en un proyecto aislado, con SMTP/envíos externos deshabilitados. No ensayar sobre `geazxsvjkqpzbghlywbw` ni reutilizar credenciales productivas en pruebas.
3. Ejecutar [comprobación de integridad](../../../../supabase/checks/h7-readonly.sql): dieciocho tablas, saldo igual a suma de eventos, ordinales coherentes, invitaciones parciales inactivas, incidencias abiertas visibles y premios protegidos. Los resultados son agregados sin datos personales.
4. Revisar entregas y compras posteriores al respaldo con las referencias del registro interno DC-14. La pausa bloquea nuevas acreditaciones/canjes: no intentar eludirla. Preparar conciliación con atención detenida y acceso limitado al administrador; habilitar esa intervención controlada solo tras verificar inventario, historial y entrega física. Usar mismo UUID/entrada cuando se conoce, consultar recibo y registrar resultado antes de reabrir al personal. Distinguir `occurred_at` de `recorded_at`; sin prueba suficiente, abrir revisión y conservar derechos, sin volver a entregar el premio.
5. Revisar personal activo, MFA, recuperación de enlaces y revocaciones posteriores al punto restaurado. Las claves perdidas o restauradas antiguas requieren el procedimiento PT-08; no rotarlas ni habilitarlas indiscriminadamente.
6. Validar archivos Storage y estado comercial. Responsable habilita escrituras solo después de aprobar la conciliación; registrar operador, punto restaurado, resultados agregados y pendientes en evidencia privada.

## Ensayo SQL/Auth ejecutado en H7

Comando: `yarn test:integration tests/integration/management-backup.test.ts`. Una prueba real aprobada; ninguna copia se publica. Fuente: base `postgres` del contenedor local `supabase_db_polleria-parcona`; destino nuevo `h7_restore_<uuid>` con guardas de loopback/nombre/base vacía. `pg_dump -Fc` conserva public/app_private/auth, datos y ACL; `pg_restore --exit-on-error` usa operador local `supabase_admin` para conservar propietarios. Dependencias pgcrypto/uuid-ossp se preparan en extensions; roles ya existen en el clúster local.

Se acreditaron diez visitas sintéticas, se obtuvo archivo de respaldo en `/tmp` del contenedor y se canjeó después. El destino restaurado recuperó el premio disponible, diez sellos, identidad Auth, ACL y las 18 tablas. La comprobación devolvió cero discrepancias de saldo/ordinales, invitaciones parciales activas, incidencias abiertas ocultas o premios protegidos ocultos. La pausa rechazó el canje con LOYALTY_PAUSED. Tras verificar la entrega sintética posterior se habilitó conciliación controlada en el destino aislado: mismo UUID, un evento de canje, replay confirmado y diez sellos intactos, sin entregar otra vez. Destino/archivo y fixtures se retiraron al terminar.

Primeros intentos detectaron que `postgres` local no puede asignar propietario `supabase_admin`, y que la pausa impide nuevos canjes; se corrigieron el operador del ensayo y su secuencia, sin relajar permisos ni cambiar SQL del producto. Claims de manager/MFA se simulan exclusivamente en esta prueba de SQL restaurado; Auth real y MFA en navegador se comprueban por separado.

`yarn db:reset` prueba reconstrucción; el ensayo anterior prueba recuperación desde un backup real. No acredita restaurar a otro clúster, roles globales, secretos, configuración SMTP/hosting, MFA operativo ni bytes de Storage. H8 debe probar ese conjunto con servicios contratados, tiempos y responsables reales. Las identidades de clientes no se dan de baja; PT-11 conserva términos/aviso/plazos pendientes. [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html) explica el alcance por base/esquemas y la dependencia de roles; [Supabase Backups](https://supabase.com/docs/guides/platform/backups) detalla límites de la copia DB y Storage.

## Atención durante una caída

El personal comunica que no pudo confirmar el sello/canje y consulta al responsable. DC-14 autoriza registro interno restringido de referencia, tarjeta y fecha real de compra presencial pagada/entregada, para conciliación posterior por administrador. No sincroniza escrituras offline ni promete saldo registrado. Una referencia incierta se conserva en el diario; comprobar resultado antes de repetir mismo UUID. Diario ilegible bloquea nuevas mutaciones hasta revisión.

H8 debe comprobar dispositivos reales, tiempos de recuperación y competencia del personal, además de confirmar plan/servicios y responsables reales. La prueba no activa el programa público ni autoriza purgas; recuperación y restitución solo siguen las operaciones y comprobaciones aprobadas DC-13/DC-14.
