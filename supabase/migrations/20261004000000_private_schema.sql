-- H1: únicamente objetos propios. Auth y Storage conservan sus permisos administrados.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_owner') then
    create role app_owner nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
  end if;
end;
$$;
grant app_owner to postgres;
create schema if not exists app_private authorization app_owner;

revoke all on schema app_private from public, anon, authenticated, service_role;
alter default privileges for role app_owner in schema app_private
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role app_owner in schema app_private
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role app_owner in schema app_private
  revoke execute on functions from public, anon, authenticated, service_role;

-- PostgreSQL concede EXECUTE a PUBLIC por defecto. Una revocación global al rol
-- creador es necesaria: revocar solo por esquema no elimina ese permiso global.
-- app_owner solo posee objetos propios; no cambia defaults de postgres/Auth/Storage.
alter default privileges for role app_owner revoke execute on functions from public;

comment on schema app_private is 'Datos de aplicación privados; acceso futuro mediante RPC autorizadas.';
