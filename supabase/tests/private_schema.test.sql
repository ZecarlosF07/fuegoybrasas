begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_schema('app_private', 'Existe el esquema de aplicación');
select ok(not has_schema_privilege('anon', 'app_private', 'usage'), 'Anon sin USAGE');
select ok(not has_schema_privilege('authenticated', 'app_private', 'usage'), 'Autenticado sin USAGE');
select ok(not has_schema_privilege('service_role', 'app_private', 'usage'), 'Clave secreta sin USAGE');

set local role app_owner;
create table app_private.h1_permission_probe(id integer);
create sequence app_private.h1_sequence_probe;
create function app_private.h1_function_probe() returns integer language sql as 'select 1';
reset role;
select ok(not has_table_privilege('anon', 'app_private.h1_permission_probe', 'select'), 'Nueva tabla no legible para anon');
select ok(not has_table_privilege('authenticated', 'app_private.h1_permission_probe', 'insert'), 'Nueva tabla no editable por cliente');
select ok(not has_sequence_privilege('anon', 'app_private.h1_sequence_probe', 'usage'), 'Secuencia privada');
select ok(not has_function_privilege('anon', 'app_private.h1_function_probe()', 'execute'), 'RPC privada no ejecutable por anon');
select ok(not has_function_privilege('authenticated', 'app_private.h1_function_probe()', 'execute'), 'RPC privada no ejecutable por cliente');

select * from finish();
rollback;
