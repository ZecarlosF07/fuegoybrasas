select jsonb_build_object(
  'migrationApplied',exists(select 1 from supabase_migrations.schema_migrations where version='20261010000000'),
  'customerCount',(select count(*) from app_private.customers),
  'cardCount',(select count(*) from app_private.loyalty_cards),
  'eventCount',(select count(*) from app_private.loyalty_events),
  'rewardCount',(select count(*) from app_private.loyalty_rewards),
  'loyaltyEnabled',(select loyalty_enabled from public.business_settings where id=1),
  'contactPhoneColumnPresent',exists(select 1 from information_schema.columns where table_schema='app_private' and table_name='customers' and column_name='contact_phone'),
  'ownTableCount',(select count(*) from information_schema.tables where table_schema in ('public','app_private') and table_type='BASE TABLE'),
  'migrationCount',(select count(*) from supabase_migrations.schema_migrations),
  'keyRpcPermissions',(select jsonb_agg(jsonb_build_object('function',p.proname,
    'anonDenied',not has_function_privilege('anon',p.oid,'EXECUTE'),
    'authenticatedDenied',not has_function_privilege('authenticated',p.oid,'EXECUTE'),
    'serverAllowed',has_function_privilege('service_role',p.oid,'EXECUTE'),
    'securityDefiner',p.prosecdef,'owner',pg_get_userbyid(p.proowner)))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('get_card_by_key','ensure_card_by_key','update_card_profile_by_key','update_card_phone_by_key')),
  'keyNotInProjection',position('access_key' in pg_get_functiondef('app_private.card_projection(uuid,boolean)'::regprocedure))=0,
  'activeProgramCount',(select count(*) from app_private.loyalty_program_versions where status='active' and deleted_at is null),
  'customerConstraints',(select jsonb_agg(conname) from pg_constraint where conrelid='app_private.customers'::regclass),
  'privateSchemaDenied',not has_schema_privilege('anon','app_private','USAGE') and not has_schema_privilege('authenticated','app_private','USAGE')
) as access_check;
