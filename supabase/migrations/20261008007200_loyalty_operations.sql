begin;

grant create on schema public to app_owner;

set local role app_owner;

create function app_private.loyalty_replay(kind text,fingerprint text,operation uuid) returns jsonb

language plpgsql set search_path='' as $$

declare receipt app_private.operation_receipts;

begin

  perform app_private.require_staff(case when kind in ('credit_stamp','redeem_reward','open_incident') then 'attendant' else 'manager' end);

  if operation is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  perform pg_advisory_xact_lock(hashtextextended(app_private.actor_user_id()::text || ':' || operation::text,0));

  select * into receipt from app_private.operation_receipts where actor_user_id=app_private.actor_user_id() and operation_id=operation;

  if not found then return null; end if;

  if receipt.operation_kind<>kind or receipt.request_hash<>fingerprint then raise exception using errcode='P0001',message='IDEMPOTENCY_CONFLICT'; end if;

  return receipt.outcome || jsonb_build_object('replayed',true);

end $$;

create function app_private.loyalty_commit(actor uuid,kind text,fingerprint text,operation uuid,entity text,target uuid,revision integer,effect jsonb) returns jsonb

language plpgsql set search_path='' as $$

declare result jsonb;

begin

  result:=jsonb_build_object('operationId',operation,'replayed',false,'outcome','applied','entityType',entity,'entityId',target,'revision',revision) || effect;

  insert into app_private.audit_entries(actor_staff_id,actor_user_id,action,entity_type,entity_id,changed_fields,operation_id)

    values(actor,app_private.actor_user_id(),kind,entity,target::text,jsonb_build_object('effect',effect,'revision',revision),operation);

  insert into app_private.operation_receipts(actor_user_id,operation_id,operation_kind,request_hash,outcome)

    values(app_private.actor_user_id(),operation,kind,fingerprint,result);

  return result;

end $$;

create function app_private.loyalty_with_card(result jsonb) returns jsonb language sql stable set search_path='' as $$

  select result || jsonb_build_object('card',app_private.card_projection((result->>'customerId')::uuid,true));

$$;

create function app_private.lock_loyalty_card(p_customer_id uuid,p_enabled_required boolean default true) returns app_private.loyalty_cards

language plpgsql set search_path='' as $$

declare settings public.business_settings; customer app_private.customers; card app_private.loyalty_cards;

begin

  select * into settings from public.business_settings where id=1 for share;

  if p_enabled_required and not settings.loyalty_enabled then raise exception using errcode='P0001',message='LOYALTY_PAUSED'; end if;

  select * into customer from app_private.customers where id=p_customer_id for share;

  if not found then raise exception using errcode='P0001',message='NOT_FOUND'; end if;

  if customer.status<>'active' or customer.deleted_at is not null then raise exception using errcode='P0001',message='CUSTOMER_RECOVERY_REVIEW'; end if;

  select * into card from app_private.loyalty_cards where customer_id=p_customer_id for update;

  if not found or card.deleted_at is not null or card.status='closed' or (p_enabled_required and card.status<>'active') then

    raise exception using errcode='P0001',message='CARD_UNAVAILABLE'; end if;

  return card;

end $$;

create function public.credit_stamp(p_customer_id uuid,p_operation_id uuid,p_paid_confirmed boolean,p_delivered_confirmed boolean,p_visit_reference text default null) returns jsonb

language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$

declare actor app_private.staff_accounts; card app_private.loyalty_cards; version app_private.loyalty_program_versions;

  reward app_private.loyalty_rewards; fingerprint text; replay jsonb; reference text; event_id uuid; result jsonb; reward_event text;

begin

  actor:=app_private.require_staff();

  reference:=nullif(btrim(p_visit_reference),'');

  if p_customer_id is null or p_paid_confirmed is distinct from true or p_delivered_confirmed is distinct from true or char_length(reference)>80 then

    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','credit_stamp','customerId',p_customer_id,'paidConfirmed',true,'deliveredConfirmed',true,'visitReference',reference));

  replay:=app_private.loyalty_replay('credit_stamp',fingerprint,p_operation_id);

  if replay is not null then return app_private.loyalty_with_card(replay); end if;

  card:=app_private.lock_loyalty_card(p_customer_id);

  select * into version from app_private.loyalty_program_versions where id=card.program_version_id for share;

  if version.status='draft' or version.deleted_at is not null then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;

  if reference is not null and exists(select 1 from app_private.loyalty_events e where e.card_id=card.id and e.event_type='stamp_credited' and e.visit_reference=reference and

    not exists(select 1 from app_private.loyalty_events reversal where reversal.reverses_event_id=e.id)) then raise exception using errcode='P0001',message='DUPLICATE_VISIT_REFERENCE'; end if;

  update app_private.loyalty_cards set net_stamps=net_stamps+1 where id=card.id returning * into card;

  insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,visit_reference)

    values(card.id,actor.id,p_operation_id,'stamp_credited',1,reference) returning id into event_id;

  if card.net_stamps % version.target_stamps=0 then

    select * into reward from app_private.loyalty_rewards where card_id=card.id and ordinal=card.net_stamps/version.target_stamps for update;

    if not found then

      insert into app_private.loyalty_rewards(card_id,program_version_id,ordinal,issued_stamp_event_id,reward_name_snapshot,reward_contents_snapshot)

        values(card.id,version.id,card.net_stamps/version.target_stamps,event_id,version.reward_name,version.reward_contents) returning * into reward;

      reward_event:='reward_issued';

    elsif reward.status='voided' then

      update app_private.loyalty_rewards set status='available',deleted_at=null,deleted_by=null,delete_reason=null where id=reward.id returning * into reward;

      reward_event:='reward_restored';

    end if;

    if reward_event is not null then

      insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,reward_id)

        values(card.id,actor.id,p_operation_id,reward_event,0,reward.id);

    end if;

  end if;

  result:=app_private.loyalty_commit(actor.id,'credit_stamp',fingerprint,p_operation_id,'loyalty_card',card.id,card.revision,

    jsonb_build_object('customerId',p_customer_id,'eventId',event_id,'rewardId',reward.id));

  return app_private.loyalty_with_card(result);

end $$;

create function public.redeem_reward(p_customer_id uuid,p_reward_id uuid,p_operation_id uuid,p_later_visit_confirmed boolean,p_product_available_confirmed boolean) returns jsonb

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

  if version.status='draft' or version.deleted_at is not null or version.reward_cost_cents is null then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;

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

create function public.open_incident(p_customer_id uuid,p_type text,p_description text,p_operation_id uuid,p_reward_id uuid default null,p_source_event_id uuid default null) returns jsonb

language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$

declare actor app_private.staff_accounts; card app_private.loyalty_cards; fingerprint text; replay jsonb; incident_id uuid; result jsonb;

begin

  actor:=app_private.require_staff();

  if p_customer_id is null or p_type not in ('reward_delivery_failed','other') or p_type is null or p_description is null or char_length(btrim(p_description)) not between 10 and 500 then

    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','open_incident','customerId',p_customer_id,'type',p_type,'description',btrim(p_description),'rewardId',p_reward_id,'sourceEventId',p_source_event_id));

  replay:=app_private.loyalty_replay('open_incident',fingerprint,p_operation_id);

  if replay is not null then return app_private.loyalty_with_card(replay); end if;

  card:=app_private.lock_loyalty_card(p_customer_id,false);

  if p_reward_id is not null and not exists(select 1 from app_private.loyalty_rewards where id=p_reward_id and card_id=card.id) then raise exception using errcode='P0001',message='NOT_FOUND'; end if;

  if p_source_event_id is not null and not exists(select 1 from app_private.loyalty_events where id=p_source_event_id and card_id=card.id) then raise exception using errcode='P0001',message='NOT_FOUND'; end if;

  if p_type='reward_delivery_failed' and (p_reward_id is null or not exists(select 1 from app_private.loyalty_rewards where id=p_reward_id and card_id=card.id and status='redeemed')) then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  insert into app_private.loyalty_incidents(card_id,opened_by,type,description,reward_id,source_event_id)

    values(card.id,actor.id,p_type,btrim(p_description),p_reward_id,p_source_event_id) returning id into incident_id;

  result:=app_private.loyalty_commit(actor.id,'open_incident',fingerprint,p_operation_id,'loyalty_card',card.id,card.revision,

    jsonb_build_object('customerId',p_customer_id,'incidentId',incident_id));

  return app_private.loyalty_with_card(result);

end $$;



create function app_private.change_loyalty_program(p_kind text,p_program_id uuid,p_revision integer,p_cost integer,p_available boolean,p_terms text,p_checks jsonb,p_operation uuid) returns jsonb

language plpgsql set search_path='' as $$

declare actor app_private.staff_accounts; version app_private.loyalty_program_versions; fingerprint text; replay jsonb;

begin

  actor:=app_private.require_staff('manager');

  if p_program_id is null or p_revision is null or p_revision<1 or p_kind not in ('activate_loyalty_program','set_reward_availability','update_reward_cost') then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  if p_kind in ('activate_loyalty_program','update_reward_cost') and (p_cost is null or p_cost<0) then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  if p_kind='set_reward_availability' and p_available is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  if p_kind='activate_loyalty_program' and (p_checks is null or p_checks is distinct from

    '{"costConfirmed":true,"termsApproved":true,"privacyApproved":true,"smsTested":true,"staffReady":true}'::jsonb) then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;

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

create function public.activate_loyalty_program(p_program_id uuid,p_expected_revision integer,p_cost_cents integer,p_terms_version text,p_checks jsonb,p_operation_id uuid) returns jsonb

language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$

  select app_private.change_loyalty_program('activate_loyalty_program',p_program_id,p_expected_revision,p_cost_cents,null,p_terms_version,p_checks,p_operation_id);

$$;

create function public.set_reward_availability(p_program_id uuid,p_expected_revision integer,p_available boolean,p_operation_id uuid) returns jsonb

language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$

  select app_private.change_loyalty_program('set_reward_availability',p_program_id,p_expected_revision,null,p_available,null,null,p_operation_id);

$$;

create function public.update_reward_cost(p_program_id uuid,p_expected_revision integer,p_cost_cents integer,p_operation_id uuid) returns jsonb

language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$

  select app_private.change_loyalty_program('update_reward_cost',p_program_id,p_expected_revision,p_cost_cents,null,null,null,p_operation_id);

$$;

-- Mantener la consulta existente de catálogo/configuración; solo ampliar la autorización por tipo.

alter function public.get_operation(uuid) rename to get_management_operation;

alter function public.get_management_operation(uuid) set schema app_private;

revoke all on function app_private.get_management_operation(uuid) from public,anon,authenticated,service_role;

create function public.get_operation(p_operation_id uuid) returns jsonb

language plpgsql stable security definer set search_path='' as $$

declare receipt app_private.operation_receipts; current_state jsonb;

begin

  perform app_private.require_staff();

  if p_operation_id is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  select * into receipt from app_private.operation_receipts where actor_user_id=app_private.actor_user_id() and operation_id=p_operation_id;

  if not found then return jsonb_build_object('status','not_found','operationId',p_operation_id); end if;

  if receipt.operation_kind not in ('credit_stamp','redeem_reward','open_incident') then

    perform app_private.require_staff('manager');

    if receipt.outcome->>'entityType'='loyalty_program' then

      select jsonb_build_object('entity','loyalty_program','id',id,'revision',revision) into current_state from app_private.loyalty_program_versions where id=(receipt.outcome->>'entityId')::uuid;

    else return app_private.get_management_operation(p_operation_id);

    end if;

  else

    current_state:=jsonb_build_object('entity','card','value',app_private.card_projection((receipt.outcome->>'customerId')::uuid,true));

  end if;

  return jsonb_build_object('status','recorded','operationId',p_operation_id,'operationKind',receipt.operation_kind,'result',receipt.outcome,'currentState',current_state);

end $$;

revoke all on function public.credit_stamp(uuid,uuid,boolean,boolean,text),public.redeem_reward(uuid,uuid,uuid,boolean,boolean),public.open_incident(uuid,text,text,uuid,uuid,uuid),

  public.activate_loyalty_program(uuid,integer,integer,text,jsonb,uuid),public.set_reward_availability(uuid,integer,boolean,uuid),public.update_reward_cost(uuid,integer,integer,uuid),public.get_operation(uuid) from public,anon,service_role;

grant execute on function public.credit_stamp(uuid,uuid,boolean,boolean,text),public.redeem_reward(uuid,uuid,uuid,boolean,boolean),public.open_incident(uuid,text,text,uuid,uuid,uuid),

  public.activate_loyalty_program(uuid,integer,integer,text,jsonb,uuid),public.set_reward_availability(uuid,integer,boolean,uuid),public.update_reward_cost(uuid,integer,integer,uuid),public.get_operation(uuid) to authenticated;

-- Reanudar utiliza la operación común versionada, nunca crea otra versión.

alter function app_private.normalize_config_patch(jsonb) rename to normalize_config_patch_h5;

create function app_private.normalize_config_patch(patch jsonb) returns jsonb

language plpgsql immutable set search_path='' as $$

declare normalized jsonb;

begin

  if patch is null or jsonb_typeof(patch)<>'object' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

  normalized:=app_private.normalize_config_patch_h5(case when patch ? 'loyaltyEnabled' then patch||'{"loyaltyEnabled":false}'::jsonb else patch end);

  if patch ? 'loyaltyEnabled' then

    if jsonb_typeof(patch->'loyaltyEnabled')<>'boolean' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;

    normalized:=normalized||jsonb_build_object('loyaltyEnabled',patch->'loyaltyEnabled');

  end if;

  return normalized;

end $$;

create function app_private.loyalty_enable_guard() returns trigger language plpgsql set search_path='' as $$

begin

  if new.loyalty_enabled then

    perform id from app_private.loyalty_program_versions where status='active' and deleted_at is null and reward_cost_cents is not null for share;

    if not found then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;

  end if;

  return new;

end $$;

create trigger loyalty_ready before update on public.business_settings for each row execute function app_private.loyalty_enable_guard();

create function app_private.loyalty_balance_guard() returns trigger language plpgsql security definer set search_path='' as $$

declare card_id_value uuid; expected bigint; actual integer;

begin

  if tg_table_name='loyalty_cards' then card_id_value:=new.id; else card_id_value:=new.card_id; end if;

  select net_stamps into actual from app_private.loyalty_cards where id=card_id_value;

  select coalesce(sum(stamp_delta),0) into expected from app_private.loyalty_events where card_id=card_id_value;

  if actual is distinct from expected then raise exception using errcode='P0001',message='CONFLICT'; end if;

  return null;

end $$;

create constraint trigger loyalty_balance_events after insert on app_private.loyalty_events deferrable initially deferred for each row execute function app_private.loyalty_balance_guard();

create constraint trigger loyalty_balance_cards after insert or update on app_private.loyalty_cards deferrable initially deferred for each row execute function app_private.loyalty_balance_guard();

reset role;

revoke create on schema public from app_owner;

commit;

