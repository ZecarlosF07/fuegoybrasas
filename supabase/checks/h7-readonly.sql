-- Solo agregados: ninguna identidad, teléfono, correo, clave ni descripción.
select
  (select count(*) from information_schema.tables where table_schema in ('public','app_private') and table_type='BASE TABLE') application_tables,
  (select count(*) from app_private.loyalty_cards c where c.net_stamps<>(select coalesce(sum(e.stamp_delta),0) from app_private.loyalty_events e where e.card_id=c.id)) balance_mismatches,
  (select count(*) from app_private.loyalty_rewards r join app_private.loyalty_cards c on c.id=r.card_id where r.status='available' and r.ordinal>c.net_stamps/10) invalid_available_ordinals,
  (select count(*) from app_private.staff_accounts where invitation_status='pending' and active) active_partial_invitations,
  (select count(*) from app_private.loyalty_incidents where status='open' and deleted_at is not null) hidden_open_incidents,
  (select count(*) from app_private.loyalty_rewards where status in ('available','redeemed') and deleted_at is not null) hidden_protected_rewards,
  (select loyalty_enabled from public.business_settings where id=1) public_loyalty_enabled;
