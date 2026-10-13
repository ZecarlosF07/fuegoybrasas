select jsonb_build_object(
  'projectExpected','geazxsvjkqpzbghlywbw',
  'migrationCount',(select count(*) from supabase_migrations.schema_migrations),
  'h5MigrationApplied',exists(select 1 from supabase_migrations.schema_migrations where version='20261008006000'),
  'ownTables',(select jsonb_agg(n.nspname||'.'||c.relname order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in('public','app_private')),
  'checkoutRls',(select bool_and(relrowsecurity) from pg_class where oid in('public.payment_methods'::regclass,'public.delivery_zones'::regclass)),
  'checkoutDirectAccessDenied',not has_table_privilege('anon','public.payment_methods','select,insert,update,delete') and not has_table_privilege('authenticated','public.delivery_zones','select,insert,update,delete'),
  'internalBaseDenied',not has_function_privilege('authenticated','app_private.update_business_config_base(integer,jsonb,uuid)','execute'),
  'paymentCount',(select count(*) from public.payment_methods),
  'zoneCount',(select count(*) from public.delivery_zones),
  'catalogReferenceCount',(select count(*) from public.catalog_items),
  'orderingEnabled',(select ordering_enabled from public.business_settings where id=1),
  'loyaltyEnabled',(select loyalty_enabled from public.business_settings where id=1),
  'publicProjection',(select jsonb_build_object('paymentCount',jsonb_array_length(read_catalog->'configuration'->'paymentMethods'),'zoneCount',jsonb_array_length(read_catalog->'configuration'->'deliveryZones'),'paymentsReady',read_catalog->'configuration'->'paymentsReady','whatsappE164',read_catalog->'configuration'->'whatsappE164') from public.read_catalog()),
  'noOrders',to_regclass('public.orders') is null
) as h5;
