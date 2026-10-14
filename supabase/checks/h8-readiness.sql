select jsonb_build_object(
  'migrations',(select count(*) from supabase_migrations.schema_migrations),
  'applicationTables',(select count(*) from information_schema.tables where table_schema in ('public','app_private') and table_type='BASE TABLE'),
  'publicProducts',jsonb_array_length(public.read_catalog()->'items'),
  'draftProducts',(select count(*) from public.catalog_items where publication_status='draft' and source_ref<>'C01' and deleted_at is null),
  'confirmedPayments',(select count(*) from public.payment_methods where enabled and verified and deleted_at is null),
  'activeManagers',(select count(*) from app_private.staff_accounts where role='manager' and active and deleted_at is null),
  'locationVerified',(select location_verified from public.business_settings where id=1),
  'scheduleConfirmed',(select schedule_confirmed from public.business_settings where id=1),
  'orderingEnabled',(select ordering_enabled from public.business_settings where id=1),
  'loyaltyEnabled',(select loyalty_enabled from public.business_settings where id=1),
  'rewardCostCents',(select reward_cost_cents from app_private.loyalty_program_versions where deleted_at is null and status in ('draft','active') order by created_at desc limit 1),
  'balanceMismatches',(select count(*) from app_private.loyalty_cards c where c.net_stamps<>(select coalesce(sum(e.stamp_delta),0) from app_private.loyalty_events e where e.card_id=c.id))
) as readiness;
