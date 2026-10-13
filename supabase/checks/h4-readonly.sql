select jsonb_build_object(
  'commercialTables',(select count(*) from pg_tables where schemaname='public' and tablename in('categories','catalog_items','catalog_prices','promotions','option_groups','option_choices')),
  'references',(select count(*) from public.catalog_items where source_ref is not null),
  'published',(select count(*) from public.catalog_items where publication_status='published' and deleted_at is null),
  'confirmedContent',(select count(*) from public.catalog_items where content_verified),
  'commercialRpcs',(select count(*) from pg_proc where pronamespace='public'::regnamespace and proname in('update_catalog_item','update_catalog_category','update_catalog_price','update_catalog_promotion','update_catalog_option_group','update_catalog_option_choice','create_catalog_entity','get_admin_catalog') and prosecdef),
  'noAnonymousEditor',not has_function_privilege('anon','public.update_catalog_item(uuid,integer,jsonb,uuid)','execute'),
  'noAuthenticatedTableWrite',not has_table_privilege('authenticated','public.catalog_items','update'),
  'mediaBucket',(select jsonb_build_object('public',public,'maxBytes',file_size_limit,'mimeTypes',allowed_mime_types) from storage.buckets where id='catalog-media'),
  'mediaPolicies',(select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'catalog_media_%'),
  'orderingEnabled',(select ordering_enabled from public.business_settings where id=1),
  'loyaltyEnabled',(select loyalty_enabled from public.business_settings where id=1),
  'migrationCount',(select count(*) from supabase_migrations.schema_migrations)
) as verification;
