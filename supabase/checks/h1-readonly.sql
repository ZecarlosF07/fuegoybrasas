-- Consulta de solo lectura; no crea usuarios ni objetos de prueba en remoto.
select
  n.nspname as schema_name,
  r.rolname as owner,
  not has_schema_privilege('anon', n.oid, 'usage') as anon_blocked,
  not has_schema_privilege('authenticated', n.oid, 'usage') as authenticated_blocked,
  not has_schema_privilege('service_role', n.oid, 'usage') as secret_key_blocked,
  not r.rolcanlogin as no_login,
  not r.rolsuper as no_superuser,
  not r.rolbypassrls as no_rls_bypass,
  exists (
    select 1 from pg_default_acl d
    where d.defaclrole = r.oid and d.defaclobjtype = 'f'
      and d.defaclnamespace = 0
      and not exists (
        select 1 from aclexplode(d.defaclacl) p
        where p.grantee = 0 and p.privilege_type = 'EXECUTE'
      )
  ) as future_functions_private
from pg_namespace n
join pg_roles r on r.oid = n.nspowner
where n.nspname = 'app_private';
