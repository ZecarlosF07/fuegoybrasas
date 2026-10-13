select jsonb_build_object(
  'migrations',(select jsonb_agg(version order by version) from supabase_migrations.schema_migrations),
  'commercialTables',(select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'owner',r.rolname,
    'anonymousCrudDenied',not has_table_privilege('anon',c.oid,'select,insert,update,delete'),
    'authenticatedCrudDenied',not has_table_privilege('authenticated',c.oid,'select,insert,update,delete')) order by c.relname)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_roles r on r.oid=c.relowner
    where n.nspname='public' and c.relkind='r' and c.relname in ('categories','catalog_items','catalog_prices','promotions','option_groups','option_choices')),
  'categories',(select count(*) from public.categories),
  'references',(select count(*) from public.catalog_items),
  'trimmedReasonConstraints',(select count(*) from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and c.conname='delete_reason_trimmed'),
  'promotions',(select count(*) from public.promotions),
  'drafts',(select count(*) from public.catalog_items where publication_status='draft'),
  'publicItems',jsonb_array_length(public.read_catalog()->'items'),
  'anonymousReadGranted',has_function_privilege('anon','public.read_catalog()','execute'),
  'authenticatedReadGranted',has_function_privilege('authenticated','public.read_catalog()','execute'),
  'flagsPaused',(select not ordering_enabled and not loyalty_enabled from public.business_settings where id=1),
  'dineInExcluded',(select not online_enabled from public.catalog_items where source_ref='C01'),
  'p05PickupExcluded',not exists(select 1 from public.catalog_prices p join public.catalog_items i on i.id=p.item_id where i.source_ref='P05' and p.mode='pickup')
) as catalog_readiness;
