-- DC-23/24: solicitud por WhatsApp sin pago; costo interno del premio opcional.
begin;
grant create on schema public to app_owner;
set local role app_owner;

-- Se conserva el historial/configuración antigua de pagos, sin condicionar el pedido.
drop trigger checkout_ready on public.business_settings;
drop trigger checkout_ready on public.payment_methods;
drop trigger checkout_ready on public.delivery_zones;
drop function app_private.checkout_integrity();

-- NULL significa costo desconocido, nunca costo cero. Los eventos previos no cambian.
do $$ declare constraint_name text;
begin
  select conname into strict constraint_name from pg_constraint
  where conrelid='app_private.loyalty_events'::regclass and contype='c'
    and pg_get_constraintdef(oid) like '%reward_cost_cents_snapshot%'
    and pg_get_constraintdef(oid) like '%event_type%';
  execute format('alter table app_private.loyalty_events drop constraint %I',constraint_name);
end $$;
alter table app_private.loyalty_events add constraint loyalty_event_optional_reward_cost
  check(event_type='reward_redeemed' or reward_cost_cents_snapshot is null);

create or replace function app_private.change_loyalty_program(p_kind text,p_program_id uuid,p_revision integer,p_cost integer,p_available boolean,p_terms text,p_checks jsonb,p_operation uuid) returns jsonb
language plpgsql set search_path='' as $$
declare actor app_private.staff_accounts; version app_private.loyalty_program_versions; fingerprint text; replay jsonb;
begin
  actor:=app_private.require_staff('manager');
  if p_program_id is null or p_revision is null or p_revision<1 or p_kind not in ('activate_loyalty_program','set_reward_availability','update_reward_cost') then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if p_kind in ('activate_loyalty_program','update_reward_cost') and p_cost<0 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if p_kind='set_reward_availability' and p_available is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if p_kind='activate_loyalty_program' and (p_checks is null or (p_checks-'costConfirmed') is distinct from
    '{"termsApproved":true,"privacyApproved":true,"accessTested":true,"staffReady":true}'::jsonb) then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind',p_kind,'programId',p_program_id,'revision',p_revision,'cost',p_cost,'available',p_available,'terms',p_terms,'checks',p_checks));
  replay:=app_private.loyalty_replay(p_kind,fingerprint,p_operation);
  if replay is not null then return replay; end if;
  if p_kind='activate_loyalty_program' then perform id from public.business_settings where id=1 for update; end if;
  select * into version from app_private.loyalty_program_versions where id=p_program_id for update;
  if not found or version.deleted_at is not null then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if version.revision<>p_revision then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if p_kind='activate_loyalty_program' then
    if version.status<>'draft' then raise exception using errcode='P0001',message='CONFLICT'; end if;
    if p_terms is distinct from version.terms_version then raise exception using errcode='P0001',message='TERMS_CHANGED'; end if;
    update app_private.loyalty_program_versions set status='active',reward_cost_cents=p_cost where id=version.id returning * into version;
    update public.business_settings set loyalty_enabled=true,revision=revision+1,updated_at=now() where id=1;
  elsif p_kind='set_reward_availability' then
    update app_private.loyalty_program_versions set reward_available=p_available where id=version.id returning * into version;
  else
    update app_private.loyalty_program_versions set reward_cost_cents=p_cost where id=version.id returning * into version;
  end if;
  return app_private.loyalty_commit(actor.id,p_kind,fingerprint,p_operation,'loyalty_program',version.id,version.revision,jsonb_build_object('fields',case when p_kind='set_reward_availability' then array['reward_available'] else array['reward_cost_cents','status'] end));
end $$;

create or replace function app_private.loyalty_enable_guard() returns trigger language plpgsql set search_path='' as $$
begin
  if new.loyalty_enabled then
    perform id from app_private.loyalty_program_versions where status='active' and deleted_at is null for share;
    if not found then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  end if;
  return new;
end $$;

create or replace function public.redeem_reward(p_customer_id uuid,p_reward_id uuid,p_operation_id uuid,p_later_visit_confirmed boolean,p_product_available_confirmed boolean) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; card app_private.loyalty_cards; version app_private.loyalty_program_versions; reward app_private.loyalty_rewards;
  fingerprint text; replay jsonb; event_id uuid; result jsonb;
begin
  actor:=app_private.require_staff();
  if p_customer_id is null or p_reward_id is null or p_product_available_confirmed is distinct from true then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if p_later_visit_confirmed is distinct from true then raise exception using errcode='P0001',message='LATER_VISIT_REQUIRED'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','redeem_reward','customerId',p_customer_id,'rewardId',p_reward_id,'laterVisitConfirmed',true,'productAvailableConfirmed',true));
  replay:=app_private.loyalty_replay('redeem_reward',fingerprint,p_operation_id);
  if replay is not null then return app_private.loyalty_with_card(replay); end if;
  card:=app_private.lock_loyalty_card(p_customer_id);
  select * into version from app_private.loyalty_program_versions where id=card.program_version_id for share;
  if version.status='draft' or version.deleted_at is not null then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  select * into reward from app_private.loyalty_rewards where id=p_reward_id and card_id=card.id for update;
  if not found or reward.deleted_at is not null or reward.status='voided' then raise exception using errcode='P0001',message='REWARD_UNAVAILABLE'; end if;
  if reward.status='redeemed' then raise exception using errcode='P0001',message='REWARD_ALREADY_REDEEMED'; end if;
  if not version.reward_available then raise exception using errcode='P0001',message='REWARD_UNAVAILABLE'; end if;
  if exists(select 1 from app_private.loyalty_events where id=reward.issued_stamp_event_id and operation_id=p_operation_id) then raise exception using errcode='P0001',message='LATER_VISIT_REQUIRED'; end if;
  update app_private.loyalty_rewards set status='redeemed',redeemed_at=now(),redeemed_by=actor.id where id=reward.id;
  update app_private.loyalty_cards set revision=revision+1 where id=card.id returning * into card;
  insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,reward_id,reward_cost_cents_snapshot)
    values(card.id,actor.id,p_operation_id,'reward_redeemed',0,reward.id,version.reward_cost_cents) returning id into event_id;
  result:=app_private.loyalty_commit(actor.id,'redeem_reward',fingerprint,p_operation_id,'loyalty_card',card.id,card.revision,
    jsonb_build_object('customerId',p_customer_id,'eventId',event_id,'rewardId',reward.id));
  return app_private.loyalty_with_card(result);
end $$;

-- Compatibilidad con tarjetas Auth anteriores, sin reintroducir SMS.
create or replace function public.ensure_customer_profile(p_display_name text,p_terms_version text,p_terms_accepted boolean) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare customer app_private.customers; version app_private.loyalty_program_versions; settings public.business_settings; card_id uuid;
begin
  if app_private.actor_user_id() is null then raise exception using errcode='P0001',message='AUTH_REQUIRED'; end if;
  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 80 or p_terms_accepted is distinct from true then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  select * into settings from public.business_settings where id=1 for share;
  perform app_private.lock_phone_identity(app_private.actor_user_id());
  select * into customer from app_private.customers where auth_user_id=app_private.actor_user_id() for update;
  if found then
    if app_private.card_projection(customer.id) is null then raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW'; end if;
    return app_private.card_projection(customer.id);
  end if;
  if not settings.loyalty_enabled then raise exception using errcode='P0001',message='LOYALTY_PAUSED'; end if;
  select * into version from app_private.loyalty_program_versions where status='active' and deleted_at is null for share;
  if not found then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  if p_terms_version is distinct from version.terms_version then raise exception using errcode='P0001',message='TERMS_CHANGED'; end if;
  insert into app_private.customers(auth_user_id,display_name,terms_version) values(app_private.actor_user_id(),btrim(p_display_name),version.terms_version) returning * into customer;
  insert into app_private.loyalty_cards(customer_id,program_version_id) values(customer.id,version.id) returning id into card_id;
  insert into app_private.audit_entries(actor_user_id,action,entity_type,entity_id,changed_fields)
    values(app_private.actor_user_id(),'ensure_customer_profile','customer',customer.id::text,jsonb_build_object('fields',array['profile_created','card_created','terms_accepted']));
  return app_private.card_projection(customer.id);
end $$;

-- Omitir el argumento opcional permite enviar NULL con los tipos generados del CLI.
create or replace function public.activate_loyalty_program(
  p_program_id uuid,p_expected_revision integer,p_cost_cents integer default null,
  p_terms_version text default null,p_checks jsonb default null,p_operation_id uuid default null
) returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
  select app_private.change_loyalty_program('activate_loyalty_program',p_program_id,p_expected_revision,p_cost_cents,null,p_terms_version,p_checks,p_operation_id);
$$;
create or replace function public.update_reward_cost(
  p_program_id uuid,p_expected_revision integer,p_cost_cents integer default null,p_operation_id uuid default null
) returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
  select app_private.change_loyalty_program('update_reward_cost',p_program_id,p_expected_revision,p_cost_cents,null,null,null,p_operation_id);
$$;

reset role;
revoke create on schema public from app_owner;
commit;
