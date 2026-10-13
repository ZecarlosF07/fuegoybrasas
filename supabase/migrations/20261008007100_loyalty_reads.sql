begin;
grant create on schema public to app_owner;
set local role app_owner;
create function app_private.card_projection(p_customer_id uuid,p_staff boolean default false) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_build_object(
    'customerId',u.id,'displayName',u.display_name,'phoneMasked','+51 ••• ••• ' || right(app_private.confirmed_phone(u.auth_user_id),3),
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
  ) || case when p_staff then jsonb_build_object('phone',app_private.confirmed_phone(u.auth_user_id),
    'openIncidents',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'type',i.type,'createdAt',i.created_at) order by i.created_at)
      from app_private.loyalty_incidents i where i.card_id=c.id and i.status='open' and i.deleted_at is null),'[]')) else '{}'::jsonb end
  from app_private.customers u join app_private.loyalty_cards c on c.customer_id=u.id
    join app_private.loyalty_program_versions v on v.id=c.program_version_id cross join public.business_settings b
  where u.id=p_customer_id and u.status='active' and u.deleted_at is null and c.status<>'closed' and c.deleted_at is null;
$$;
create function public.get_my_card() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare customer app_private.customers; result jsonb;
begin
  if app_private.confirmed_phone(app_private.actor_user_id()) is null then raise exception using errcode='P0001',message='AUTH_REQUIRED'; end if;
  select * into customer from app_private.customers where auth_user_id=app_private.actor_user_id();
  if not found then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  result:=app_private.card_projection(customer.id);
  if result is null then raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW'; end if;
  return result;
end $$;
create function public.get_staff_customer(p_customer_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  perform app_private.require_staff();
  result:=app_private.card_projection(p_customer_id,true);
  if result is null then
    if exists(select 1 from app_private.customers where id=p_customer_id) then raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW'; end if;
    raise exception using errcode='P0001',message='NOT_FOUND';
  end if;
  return result;
end $$;
create function public.lookup_customer(p_phone text) returns jsonb
language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare customer_id uuid;
begin
  perform app_private.require_staff();
  if p_phone is null or p_phone !~ '^\+519[0-9]{8}$' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  select id into customer_id from app_private.customers where auth_user_id=app_private.confirmed_phone_user(p_phone);
  if not found then return jsonb_build_object('found',false); end if;
  return jsonb_build_object('found',true,'card',public.get_staff_customer(customer_id));
end $$;
create function public.get_loyalty_offer() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if app_private.confirmed_phone(app_private.actor_user_id()) is null then raise exception using errcode='P0001',message='AUTH_REQUIRED'; end if;
  return coalesce((select jsonb_build_object('enabled',b.loyalty_enabled,'termsVersion',v.terms_version,'target',v.target_stamps,'rewardName',v.reward_name)
    from app_private.loyalty_program_versions v cross join public.business_settings b where v.status='active' and v.deleted_at is null),
    jsonb_build_object('enabled',false,'termsVersion',null,'target',10,'rewardName','Mostrito de ⅛'));
end $$;
create function public.get_loyalty_programs() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  perform app_private.require_staff('manager');
  return jsonb_build_object('enabled',(select loyalty_enabled from public.business_settings where id=1),
    'programs',coalesce((select jsonb_agg(jsonb_build_object('id',id,'code',code,'target',target_stamps,'rewardName',reward_name,'rewardContents',reward_contents,
      'costCents',reward_cost_cents,'available',reward_available,'termsVersion',terms_version,'status',status,'revision',revision) order by created_at)
      from app_private.loyalty_program_versions where deleted_at is null),'[]'));
end $$;

create function public.ensure_customer_profile(p_display_name text,p_terms_version text,p_terms_accepted boolean) returns jsonb
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
  if not found or version.reward_cost_cents is null then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  if p_terms_version is distinct from version.terms_version then raise exception using errcode='P0001',message='TERMS_CHANGED'; end if;
  insert into app_private.customers(auth_user_id,display_name,terms_version) values(app_private.actor_user_id(),btrim(p_display_name),version.terms_version) returning * into customer;
  insert into app_private.loyalty_cards(customer_id,program_version_id) values(customer.id,version.id) returning id into card_id;
  insert into app_private.audit_entries(actor_user_id,action,entity_type,entity_id,changed_fields)
    values(app_private.actor_user_id(),'ensure_customer_profile','customer',customer.id::text,jsonb_build_object('fields',array['profile_created','card_created','terms_accepted']));
  return app_private.card_projection(customer.id);
end $$;
create function public.update_my_profile(p_display_name text,p_frequent_instructions text,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare customer app_private.customers;
begin
  if app_private.confirmed_phone(app_private.actor_user_id()) is null then raise exception using errcode='P0001',message='AUTH_REQUIRED'; end if;
  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 80 or p_frequent_instructions is null or
    char_length(p_frequent_instructions)>500 or p_expected_revision is null or p_expected_revision<1 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  select * into customer from app_private.customers where auth_user_id=app_private.actor_user_id() for update;
  if not found then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if app_private.card_projection(customer.id) is null then raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW'; end if;
  if customer.revision<>p_expected_revision then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if customer.display_name=btrim(p_display_name) and customer.frequent_instructions=p_frequent_instructions then return app_private.card_projection(customer.id); end if;
  update app_private.customers set display_name=btrim(p_display_name),frequent_instructions=p_frequent_instructions where id=customer.id;
  insert into app_private.audit_entries(actor_user_id,action,entity_type,entity_id,changed_fields)
    values(app_private.actor_user_id(),'update_my_profile','customer',customer.id::text,
      jsonb_build_object('fields',array['display_name','frequent_instructions'],'previousRevision',customer.revision,'revision',customer.revision+1));
  return app_private.card_projection(customer.id);
end $$;
revoke all on function public.get_my_card(),public.get_staff_customer(uuid),public.lookup_customer(text),public.get_loyalty_offer(),public.get_loyalty_programs(),
  public.ensure_customer_profile(text,text,boolean),public.update_my_profile(text,text,integer) from public,anon,service_role;
grant execute on function public.get_my_card(),public.get_staff_customer(uuid),public.lookup_customer(text),public.get_loyalty_offer(),public.get_loyalty_programs(),
  public.ensure_customer_profile(text,text,boolean),public.update_my_profile(text,text,integer) to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
