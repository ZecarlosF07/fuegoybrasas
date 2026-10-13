begin;
grant create on schema public to app_owner;
set local role app_owner;

alter table app_private.loyalty_events add column reinstates_event_id uuid;
alter table app_private.loyalty_events add foreign key(reinstates_event_id,card_id) references app_private.loyalty_events(id,card_id) on delete restrict;
create unique index loyalty_one_reinstatement on app_private.loyalty_events(reinstates_event_id) where reinstates_event_id is not null;
alter table app_private.loyalty_events drop constraint loyalty_events_event_type_check;
alter table app_private.loyalty_events add constraint loyalty_events_event_type_check check(event_type in ('stamp_credited','stamp_reversed','reward_issued','reward_redeemed','reward_voided','reward_restored','reward_reinstated'));
alter table app_private.loyalty_events drop constraint loyalty_events_check2;
alter table app_private.loyalty_events add constraint loyalty_reason_and_reversal check(
  (event_type='stamp_reversed' and reverses_event_id is not null and reason is not null and reinstates_event_id is null) or
  (event_type='reward_reinstated' and reverses_event_id is null and reason is not null and reinstates_event_id is not null) or
  (event_type not in ('stamp_reversed','reward_reinstated') and reverses_event_id is null and reason is null and reinstates_event_id is null));
alter table app_private.operation_receipts drop constraint operation_receipts_operation_kind_check;
alter table app_private.operation_receipts add constraint operation_receipts_operation_kind_check check(operation_kind in
  ('update_business_config','update_staff_access','soft_delete_entity','restore_entity','create_catalog_entity','update_category','update_catalog_item','update_catalog_price','update_promotion','update_option_group','update_option_choice','prepare_catalog_image_cleanup',
   'credit_stamp','redeem_reward','open_incident','activate_loyalty_program','set_reward_availability','update_reward_cost','reverse_stamp','correct_customer_profile','close_incident','prepare_staff_invitation','complete_staff_invitation','reinstate_reward','recover_card_access','credit_contingency_stamp'));

create or replace function app_private.loyalty_row_guard() returns trigger language plpgsql set search_path='' as $$
begin
  if new is not distinct from old then return new; end if;
  if new.id<>old.id then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if tg_table_name='loyalty_program_versions' then
    if (old.status<>'draft' or exists(select 1 from app_private.loyalty_cards where program_version_id=old.id)) and (new.code<>old.code or new.target_stamps<>old.target_stamps or new.reward_name<>old.reward_name or
      new.reward_contents<>old.reward_contents or new.terms_version<>old.terms_version or new.status='draft') then raise exception using errcode='P0001',message='CONFLICT'; end if;
    if new.deleted_at is not null and (old.status='active' or exists(select 1 from app_private.loyalty_cards where program_version_id=old.id) or exists(select 1 from app_private.loyalty_rewards where program_version_id=old.id)) then raise exception using errcode='P0001',message='CONFLICT'; end if;
  elsif tg_table_name='loyalty_rewards' then
    if new.card_id<>old.card_id or new.program_version_id<>old.program_version_id or new.ordinal<>old.ordinal or new.issued_stamp_event_id<>old.issued_stamp_event_id or new.issued_at<>old.issued_at or
      new.reward_name_snapshot<>old.reward_name_snapshot or new.reward_contents_snapshot<>old.reward_contents_snapshot then raise exception using errcode='P0001',message='CONFLICT'; end if;
    if old.status='redeemed' and new.status<>'redeemed' then
      perform app_private.require_staff('manager');
      if new.status<>'available' or not exists(select 1 from app_private.loyalty_events restoration join app_private.loyalty_events redemption on redemption.id=restoration.reinstates_event_id
        where restoration.reward_id=old.id and restoration.card_id=old.card_id and restoration.event_type='reward_reinstated' and redemption.event_type='reward_redeemed'
        and redemption.reward_id=old.id and redemption.occurred_at=old.redeemed_at and restoration.recorded_at=transaction_timestamp()) then
        raise exception using errcode='P0001',message='CONFLICT'; end if;
    end if;
  elsif tg_table_name='loyalty_cards' then
    if new.customer_id<>old.customer_id or new.program_version_id<>old.program_version_id then raise exception using errcode='P0001',message='CONFLICT'; end if;
  elsif tg_table_name='customers' then
    if new.auth_user_id is distinct from old.auth_user_id and new.auth_user_id is not null then raise exception using errcode='P0001',message='CONFLICT'; end if;
  end if;
  if old.deleted_at is not null and new.deleted_at is null then
    if tg_table_name in ('customers','loyalty_cards') then new.status:='closed';
    elsif tg_table_name='loyalty_program_versions' then new.status:='draft'; new.reward_available:=false; end if;
  end if;
  new.revision:=old.revision+1; new.updated_at:=now(); return new;
end $$;

create function public.reinstate_reward(p_incident_id uuid,p_expected_revision integer,p_not_delivered_confirmed boolean,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; incident app_private.loyalty_incidents; card app_private.loyalty_cards; reward app_private.loyalty_rewards;
  customer_id_value uuid; redemption app_private.loyalty_events; fingerprint text; replay jsonb; event_id uuid; result jsonb;
begin
  actor:=app_private.require_staff('manager');
  if p_incident_id is null or p_expected_revision is null or p_expected_revision<1 or p_not_delivered_confirmed is distinct from true or p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','reinstate_reward','incidentId',p_incident_id,'revision',p_expected_revision,'notDelivered',true,'reason',btrim(p_reason)));
  replay:=app_private.loyalty_replay('reinstate_reward',fingerprint,p_operation_id);
  if replay is not null then return app_private.loyalty_with_card(replay); end if;
  select c.customer_id into customer_id_value from app_private.loyalty_incidents i join app_private.loyalty_cards c on c.id=i.card_id where i.id=p_incident_id;
  if not found then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  card:=app_private.lock_loyalty_card(customer_id_value,false);
  select * into incident from app_private.loyalty_incidents where id=p_incident_id;
  perform id from app_private.loyalty_program_versions where id=card.program_version_id for share;
  select * into reward from app_private.loyalty_rewards where id=incident.reward_id and card_id=card.id for update;
  if not found or reward.status<>'redeemed' or reward.deleted_at is not null then raise exception using errcode='P0001',message='CONFLICT'; end if;
  select * into incident from app_private.loyalty_incidents where id=p_incident_id for update;
  if incident.revision<>p_expected_revision or incident.status<>'open' or incident.type<>'reward_delivery_failed' or incident.deleted_at is not null then raise exception using errcode='P0001',message='CONFLICT'; end if;
  select * into redemption from app_private.loyalty_events where reward_id=reward.id and event_type='reward_redeemed' order by recorded_at desc,id desc limit 1;
  if not found or (incident.source_event_id is not null and incident.source_event_id<>redemption.id) or exists(select 1 from app_private.loyalty_events where reinstates_event_id=redemption.id) then raise exception using errcode='P0001',message='CONFLICT'; end if;
  insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,reward_id,reinstates_event_id,reason)
    values(card.id,actor.id,p_operation_id,'reward_reinstated',0,reward.id,redemption.id,btrim(p_reason)) returning id into event_id;
  update app_private.loyalty_rewards set status='available',redeemed_at=null,redeemed_by=null where id=reward.id;
  update app_private.loyalty_cards set revision=revision+1 where id=card.id returning * into card;
  update app_private.loyalty_incidents set source_event_id=redemption.id,status='closed',resolution_note=btrim(p_reason),closed_by=actor.id,closed_at=now() where id=incident.id;
  result:=app_private.loyalty_commit(actor.id,'reinstate_reward',fingerprint,p_operation_id,'loyalty_card',card.id,card.revision,
    jsonb_build_object('customerId',customer_id_value,'eventId',event_id,'rewardId',reward.id,'incidentId',incident.id));
  return app_private.loyalty_with_card(result);
end $$;

create function public.recover_card_access(p_customer_id uuid,p_expected_revision integer,p_new_key_hash text,p_reference text,p_history_event_id uuid,p_in_person_confirmed boolean,p_identity_checked_confirmed boolean,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; customer app_private.customers; fingerprint text; replay jsonb;
begin
  actor:=app_private.require_staff('manager');
  if p_customer_id is null or p_expected_revision is null or p_expected_revision<1 or p_new_key_hash is null or p_new_key_hash !~ '^[a-f0-9]{64}$' or p_reference is null or char_length(btrim(p_reference)) not between 1 and 80 or
    p_history_event_id is null or p_in_person_confirmed is distinct from true or p_identity_checked_confirmed is distinct from true or p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','recover_card_access','customerId',p_customer_id,'revision',p_expected_revision,'keyHash',p_new_key_hash,'reference',btrim(p_reference),'eventId',p_history_event_id,'reason',btrim(p_reason)));
  replay:=app_private.loyalty_replay('recover_card_access',fingerprint,p_operation_id);
  select * into customer from app_private.customers where id=p_customer_id for update;
  if not found or customer.status<>'active' or customer.deleted_at is not null or customer.access_key_hash is null then raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW'; end if;
  if replay is not null then
    if customer.access_key_hash<>p_new_key_hash then raise exception using errcode='P0001',message='CONFLICT'; end if;
    return replay;
  end if;
  if customer.revision<>p_expected_revision then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if not exists(select 1 from app_private.loyalty_events e join app_private.loyalty_cards c on c.id=e.card_id where c.customer_id=customer.id and e.id=p_history_event_id and e.event_type='stamp_credited' and
    e.visit_reference=btrim(p_reference) and not exists(select 1 from app_private.loyalty_events r where r.reverses_event_id=e.id)) then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  update app_private.customers set access_key_hash=p_new_key_hash,access_key_expires_at=now()+interval '365 days' where id=customer.id returning * into customer;
  return app_private.commit_staff_operation(actor.id,'recover_card_access',fingerprint,p_operation_id,'customer',customer.id::text,customer.revision,
    jsonb_build_object('accessRotated',true,'inPersonConfirmed',true,'identityCheckedConfirmed',true,'historyEventId',p_history_event_id),btrim(p_reason));
end $$;

-- Baja de clientes eliminada del producto por decisión expresa; metadatos SQL se conservan.
revoke all on function public.reinstate_reward(uuid,integer,boolean,text,uuid),public.recover_card_access(uuid,integer,text,text,uuid,boolean,boolean,text,uuid) from public,anon,service_role;
grant execute on function public.reinstate_reward(uuid,integer,boolean,text,uuid),public.recover_card_access(uuid,integer,text,text,uuid,boolean,boolean,text,uuid) to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
