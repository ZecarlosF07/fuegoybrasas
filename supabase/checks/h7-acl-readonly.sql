select jsonb_build_object(
  'migrations',(select count(*) from supabase_migrations.schema_migrations),
  'tables',(select count(*) from information_schema.tables where table_schema in ('public','app_private') and table_type='BASE TABLE'),
  'customers',(select count(*) from app_private.customers),
  'events',(select count(*) from app_private.loyalty_events),
  'publicLoyaltyEnabled',(select loyalty_enabled from public.business_settings where id=1),
  'privateSchemaDenied',not has_schema_privilege('authenticated','app_private','usage'),
  'anonymousDashboardDenied',not has_function_privilege('anon','public.get_loyalty_dashboard(date,date)','execute'),
  'privilegedRestitutionDenied',not has_function_privilege('service_role','public.reinstate_reward(uuid,integer,boolean,text,uuid)','execute'),
  'authBridgeDenied',not has_function_privilege('authenticated','app_private.staff_auth_info(uuid)','execute'),
  'ordinaryCustomerTableDenied',not has_table_privilege('authenticated','app_private.customers','select'),
  'incidentBindingTrigger',(select count(*)=1 from pg_trigger where tgrelid='app_private.loyalty_incidents'::regclass and tgname='incident_redemption_binding' and not tgisinternal),
  'managementFunctions',(select jsonb_agg(jsonb_build_object('name',p.proname,'owner',r.rolname,'securityDefiner',p.prosecdef) order by p.proname)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_roles r on r.oid=p.proowner
    where n.nspname='public' and p.proname in ('reverse_stamp','reinstate_reward','recover_card_access','credit_contingency_stamp','get_loyalty_dashboard','get_admin_customers','get_customer_history','get_loyalty_incidents','get_managed_staff','prepare_staff_invitation','stage_staff_invitation','complete_staff_invitation'))
) as result;
