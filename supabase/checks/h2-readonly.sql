select jsonb_build_object(
  'migrations',(select jsonb_agg(version order by version) from supabase_migrations.schema_migrations),
  'tables',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,'owner',r.rolname) order by c.relname)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_roles r on r.oid=c.relowner
    where c.relkind='r' and (n.nspname='app_private' or (n.nspname='public' and c.relname='business_settings'))),
  'claimsBridgePrivate',not has_function_privilege('authenticated','app_private.request_claims()','execute'),
  'privateSchemaDenied',not has_schema_privilege('authenticated','app_private','usage'),
  'directConfigurationDenied',not has_table_privilege('authenticated','public.business_settings','select,insert,update,delete'),
  'anonymousStaffDenied',not has_function_privilege('anon','public.get_staff_access()','execute'),
  'anonymousConfigDenied',not has_function_privilege('anon','public.get_admin_config()','execute'),
  'flagsPaused',(select not ordering_enabled and not loyalty_enabled from public.business_settings where id=1),
  'activeManagers',(select count(*) from app_private.staff_accounts where active and deleted_at is null and role='manager')
) as readiness;
