begin;
grant create on schema public to app_owner;
set local role app_owner;

alter table app_private.customers
  add column contact_phone text check(contact_phone is null or contact_phone ~ '^[+]519[0-9]{8}$'),
  add column access_key_hash text unique check(access_key_hash is null or access_key_hash ~ '^[a-f0-9]{64}$'),
  add column access_key_expires_at timestamptz;
alter table app_private.customers drop constraint customers_check;
alter table app_private.customers add constraint customer_active_identity
  check(status<>'active' or (display_name is not null and
    (auth_user_id is not null or (contact_phone is not null and access_key_hash is not null and access_key_expires_at is not null))));
alter table app_private.customers add constraint customer_key_pair
  check((access_key_hash is null)=(access_key_expires_at is null));
create unique index customer_contact_phone on app_private.customers(contact_phone) where contact_phone is not null;

create function app_private.card_key_customer(p_key_hash text) returns app_private.customers
language plpgsql stable set search_path='' as $$
declare customer app_private.customers;
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception using errcode='P0001',message='AUTH_REQUIRED';
  end if;
  select * into customer from app_private.customers where access_key_hash=p_key_hash and access_key_expires_at>now();
  if not found then raise exception using errcode='P0001',message='AUTH_REQUIRED'; end if;
  if app_private.card_projection(customer.id) is null then
    raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW';
  end if;
  return customer;
end $$;

create function public.get_card_by_key(p_key_hash text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare customer app_private.customers;
begin
  customer:=app_private.card_key_customer(p_key_hash);
  return app_private.card_projection(customer.id);
end $$;

create function public.ensure_card_by_key(p_key_hash text,p_display_name text,p_phone text,p_terms_version text,p_terms_accepted boolean) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare customer app_private.customers; version app_private.loyalty_program_versions;
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$' or p_display_name is null
    or char_length(btrim(p_display_name)) not between 1 and 80 or p_phone is null or p_phone !~ '^[+]519[0-9]{8}$' then
    raise exception using errcode='P0001',message='VALIDATION_ERROR';
  end if;
  if p_terms_accepted is distinct from true then raise exception using errcode='P0001',message='TERMS_CHANGED'; end if;
  perform id from public.business_settings where id=1 for share;
  -- Serializa altas nuevas y su límite de abuso; replay por clave no crea otra tarjeta.
  perform pg_advisory_xact_lock(hashtextextended('card-self-registration',0));
  select * into customer from app_private.customers where access_key_hash=p_key_hash;
  if found then return public.get_card_by_key(p_key_hash); end if;
  if not (select loyalty_enabled from public.business_settings where id=1) then
    raise exception using errcode='P0001',message='LOYALTY_PAUSED';
  end if;
  if (select count(*) from app_private.customers where access_key_hash is not null and created_at>now()-interval '1 minute')>=20 then
    raise exception using errcode='P0001',message='RATE_LIMITED';
  end if;
  select * into version from app_private.loyalty_program_versions where status='active' and deleted_at is null for share;
  if not found then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  if p_terms_version is distinct from version.terms_version then raise exception using errcode='P0001',message='TERMS_CHANGED'; end if;
  if exists(select 1 from app_private.customers where contact_phone=p_phone or
    (contact_phone is null and auth_user_id=app_private.confirmed_phone_user(p_phone))) then
    raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW';
  end if;
  insert into app_private.customers(display_name,contact_phone,terms_version,access_key_hash,access_key_expires_at)
    values(btrim(p_display_name),p_phone,version.terms_version,p_key_hash,now()+interval '365 days') returning * into customer;
  insert into app_private.loyalty_cards(customer_id,program_version_id) values(customer.id,version.id);
  insert into app_private.audit_entries(actor_user_id,action,entity_type,entity_id,changed_fields)
    values(customer.id,'ensure_card_by_key','customer',customer.id::text,
      jsonb_build_object('actorKind','customer_card','fields',array['profile_created','card_created','terms_accepted']));
  return app_private.card_projection(customer.id);
end $$;

create function public.update_card_profile_by_key(p_key_hash text,p_display_name text,p_frequent_instructions text,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare customer app_private.customers;
begin
  customer:=app_private.card_key_customer(p_key_hash);
  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 80
    or p_frequent_instructions is null or char_length(p_frequent_instructions)>500 or p_expected_revision is null then
    raise exception using errcode='P0001',message='VALIDATION_ERROR';
  end if;
  select * into customer from app_private.customers where id=customer.id for update;
  perform app_private.card_key_customer(p_key_hash);
  if customer.revision<>p_expected_revision then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if customer.display_name=btrim(p_display_name) and customer.frequent_instructions=p_frequent_instructions then
    return app_private.card_projection(customer.id);
  end if;
  update app_private.customers set display_name=btrim(p_display_name),frequent_instructions=p_frequent_instructions where id=customer.id;
  insert into app_private.audit_entries(actor_user_id,action,entity_type,entity_id,changed_fields)
    values(customer.id,'update_card_profile','customer',customer.id::text,
      jsonb_build_object('actorKind','customer_card','fields',array['display_name','frequent_instructions']));
  return app_private.card_projection(customer.id);
end $$;

create function public.update_card_phone_by_key(p_key_hash text,p_phone text,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare customer app_private.customers;
begin
  customer:=app_private.card_key_customer(p_key_hash);
  if p_phone is null or p_phone !~ '^[+]519[0-9]{8}$' or p_expected_revision is null then
    raise exception using errcode='P0001',message='VALIDATION_ERROR';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('card-self-registration',0));
  select * into customer from app_private.customers where id=customer.id for update;
  perform app_private.card_key_customer(p_key_hash);
  if customer.revision<>p_expected_revision then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if customer.contact_phone=p_phone then return app_private.card_projection(customer.id); end if;
  if exists(select 1 from app_private.customers where id<>customer.id and
    (contact_phone=p_phone or (contact_phone is null and auth_user_id=app_private.confirmed_phone_user(p_phone)))) then
    raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW';
  end if;
  update app_private.customers set contact_phone=p_phone where id=customer.id;
  insert into app_private.audit_entries(actor_user_id,action,entity_type,entity_id,changed_fields)
    values(customer.id,'update_card_phone','customer',customer.id::text,jsonb_build_object('actorKind','customer_card','fields',array['contact_phone']));
  return app_private.card_projection(customer.id);
end $$;

revoke all on function public.get_card_by_key(text),public.ensure_card_by_key(text,text,text,text,boolean),
  public.update_card_profile_by_key(text,text,text,integer),public.update_card_phone_by_key(text,text,integer)
  from public,anon,authenticated;
grant execute on function public.get_card_by_key(text),public.ensure_card_by_key(text,text,text,text,boolean),
  public.update_card_profile_by_key(text,text,text,integer),public.update_card_phone_by_key(text,text,integer) to service_role;

-- Las definiciones siguientes sustituyen proyección/lookup/gates sin editar migraciones anteriores.
create or replace function app_private.card_projection(p_customer_id uuid,p_staff boolean default false) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_build_object(
    'customerId',u.id,'displayName',u.display_name,'phoneMasked','+51 ••• ••• ' || right(coalesce(u.contact_phone,app_private.confirmed_phone(u.auth_user_id)),3),
    'frequentInstructions',u.frequent_instructions,'profileRevision',u.revision,
    'cardId',c.id,'cardRevision',c.revision,'cardStatus',c.status,
    'programEnabled',b.loyalty_enabled and v.status in ('active','retired') and v.deleted_at is null,
    'progress',c.net_stamps % v.target_stamps,'netStamps',c.net_stamps,'target',v.target_stamps,
    'programLabel',v.reward_name,'rewardProductAvailable',v.reward_available,'termsVersion',u.terms_version,
    'availableRewards',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',r.reward_name_snapshot,'contents',r.reward_contents_snapshot,'issuedAt',r.issued_at,'ordinal',r.ordinal) order by r.ordinal)
      from app_private.loyalty_rewards r where r.card_id=c.id and r.status='available' and r.deleted_at is null),'[]'),
    'recentEvents',coalesce((select jsonb_agg(e.projection order by e.recorded_at desc,e.id desc) from (
      select id,recorded_at,jsonb_build_object('type',event_type,'date',occurred_at,'delta',stamp_delta) ||
        case when p_staff then jsonb_build_object('id',id,'operationId',operation_id,'visitReference',visit_reference,'rewardId',reward_id) else '{}'::jsonb end projection
      from app_private.loyalty_events where card_id=c.id order by recorded_at desc,id desc limit 10) e),'[]')
  ) || case when p_staff then jsonb_build_object('phone',coalesce(u.contact_phone,app_private.confirmed_phone(u.auth_user_id)),
    'openIncidents',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'type',i.type,'createdAt',i.created_at) order by i.created_at)
      from app_private.loyalty_incidents i where i.card_id=c.id and i.status='open' and i.deleted_at is null),'[]')) else '{}'::jsonb end
  from app_private.customers u join app_private.loyalty_cards c on c.customer_id=u.id
    join app_private.loyalty_program_versions v on v.id=c.program_version_id cross join public.business_settings b
  where u.id=p_customer_id and u.status='active' and u.deleted_at is null and c.status<>'closed' and c.deleted_at is null;
$$;
create or replace function public.get_loyalty_offer() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  return coalesce((select jsonb_build_object('enabled',b.loyalty_enabled,'termsVersion',v.terms_version,'target',v.target_stamps,'rewardName',v.reward_name)
    from app_private.loyalty_program_versions v cross join public.business_settings b where v.status='active' and v.deleted_at is null),
    jsonb_build_object('enabled',false,'termsVersion',null,'target',10,'rewardName','Mostrito de ⅛'));
end $$;
create or replace function public.lookup_customer(p_phone text) returns jsonb
language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare customer_id uuid;
begin
  perform app_private.require_staff();
  if p_phone is null or p_phone !~ '^\+519[0-9]{8}$' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  select id into customer_id from app_private.customers where contact_phone=p_phone or (contact_phone is null and auth_user_id=app_private.confirmed_phone_user(p_phone));
  if not found then return jsonb_build_object('found',false); end if;
  return jsonb_build_object('found',true,'card',public.get_staff_customer(customer_id));
end $$;
create or replace function app_private.change_loyalty_program(p_kind text,p_program_id uuid,p_revision integer,p_cost integer,p_available boolean,p_terms text,p_checks jsonb,p_operation uuid) returns jsonb

language plpgsql set search_path='' as $$

declare actor app_private.staff_accounts; version app_private.loyalty_program_versions; fingerprint text; replay jsonb;

begin

  actor:=app_private.require_staff('manager');

  if p_program_id is null or p_revision is null or p_revision<1 or p_kind not in ('activate_loyalty_program','set_reward_availability','update_reward_cost') then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  if p_kind in ('activate_loyalty_program','update_reward_cost') and (p_cost is null or p_cost<0) then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  if p_kind='set_reward_availability' and p_available is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  if p_kind='activate_loyalty_program' and (p_checks is null or p_checks is distinct from

    '{"costConfirmed":true,"termsApproved":true,"privacyApproved":true,"accessTested":true,"staffReady":true}'::jsonb) then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;

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


revoke all on function public.get_loyalty_offer() from public;
grant execute on function public.get_loyalty_offer() to anon,authenticated,service_role;
reset role;
-- Mantener el alta pública de Auth cerrada: la tarjeta no usa cuentas telefónicas.
create or replace function public.before_customer_created(event jsonb) returns jsonb
language sql immutable set search_path='' as $$
  select '{"error":{"http_code":403,"message":"signup_disabled"}}'::jsonb;
$$;
revoke create on schema public from app_owner;
commit;
