begin;
grant create on schema public to app_owner;
set local role app_owner;

alter table app_private.operation_receipts drop constraint operation_receipts_operation_kind_check;
alter table app_private.operation_receipts add constraint operation_receipts_operation_kind_check check(operation_kind in
  ('update_business_config','update_staff_access','soft_delete_entity','restore_entity','create_catalog_entity','update_category','update_catalog_item','update_catalog_price','update_promotion','update_option_group','update_option_choice','prepare_catalog_image_cleanup',
   'credit_stamp','redeem_reward','open_incident','activate_loyalty_program','set_reward_availability','update_reward_cost','reverse_stamp','correct_customer_profile','close_incident'));
alter table app_private.audit_entries drop constraint audit_entries_entity_type_check;
alter table app_private.audit_entries add constraint audit_entries_entity_type_check check(entity_type in
  ('staff_account','business_config','category','catalog_item','catalog_price','promotion','option_group','option_choice','catalog_image','payment_method','delivery_zone','customer','loyalty_card','loyalty_program','loyalty_incident','loyalty_reward'));

create function public.reverse_stamp(p_customer_id uuid,p_event_id uuid,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; card app_private.loyalty_cards; original app_private.loyalty_events;
  reward app_private.loyalty_rewards; fingerprint text; replay jsonb; event_id uuid; incident_id uuid; result jsonb; target_count integer;
begin
  actor:=app_private.require_staff('manager');
  if p_customer_id is null or p_event_id is null or p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','reverse_stamp','customerId',p_customer_id,'eventId',p_event_id,'reason',btrim(p_reason)));
  replay:=app_private.loyalty_replay('reverse_stamp',fingerprint,p_operation_id);
  if replay is not null then return app_private.loyalty_with_card(replay); end if;
  card:=app_private.lock_loyalty_card(p_customer_id,false);
  select * into original from app_private.loyalty_events where id=p_event_id and card_id=card.id and event_type='stamp_credited';
  if not found then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if card.net_stamps<1 or exists(select 1 from app_private.loyalty_events where reverses_event_id=original.id) then
    raise exception using errcode='P0001',message='CONFLICT'; end if;
  select target_stamps into target_count from app_private.loyalty_program_versions where id=card.program_version_id for share;
  perform id from app_private.loyalty_rewards where card_id=card.id and ordinal>(card.net_stamps-1)/target_count order by ordinal for update;
  if exists(select 1 from app_private.loyalty_rewards where card_id=card.id and ordinal>(card.net_stamps-1)/target_count and status='redeemed') then
    select id into incident_id from app_private.loyalty_incidents where card_id=card.id and source_event_id=original.id and type='correction_requires_review' and status='open' and deleted_at is null;
    if incident_id is null then
      insert into app_private.loyalty_incidents(card_id,source_event_id,opened_by,type,description)
        values(card.id,original.id,actor.id,'correction_requires_review',btrim(p_reason)) returning id into incident_id;
    end if;
    result:=app_private.loyalty_commit(actor.id,'reverse_stamp',fingerprint,p_operation_id,'loyalty_card',card.id,card.revision,
      jsonb_build_object('customerId',p_customer_id,'incidentId',incident_id,'outcome','review_required'));
    return app_private.loyalty_with_card(result);
  end if;
  update app_private.loyalty_cards set net_stamps=net_stamps-1 where id=card.id returning * into card;
  insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,reverses_event_id,reason)
    values(card.id,actor.id,p_operation_id,'stamp_reversed',-1,original.id,btrim(p_reason)) returning id into event_id;
  for reward in select * from app_private.loyalty_rewards where card_id=card.id and ordinal>card.net_stamps/target_count and status='available' order by ordinal loop
    update app_private.loyalty_rewards set status='voided' where id=reward.id;
    insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,reward_id)
      values(card.id,actor.id,p_operation_id,'reward_voided',0,reward.id);
  end loop;
  result:=app_private.loyalty_commit(actor.id,'reverse_stamp',fingerprint,p_operation_id,'loyalty_card',card.id,card.revision,
    jsonb_build_object('customerId',p_customer_id,'eventId',event_id));
  return app_private.loyalty_with_card(result);
end $$;

create function public.correct_customer_profile(p_customer_id uuid,p_expected_revision integer,p_display_name text,p_frequent_instructions text,p_customer_request_confirmed boolean,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; customer app_private.customers; fingerprint text; replay jsonb;
begin
  actor:=app_private.require_staff('manager');
  if p_customer_id is null or p_expected_revision is null or p_expected_revision<1 or p_customer_request_confirmed is distinct from true or
    p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 80 or p_frequent_instructions is null or char_length(p_frequent_instructions)>500 or
    p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','correct_customer_profile','customerId',p_customer_id,'revision',p_expected_revision,'name',btrim(p_display_name),'instructions',p_frequent_instructions,'reason',btrim(p_reason)));
  replay:=app_private.loyalty_replay('correct_customer_profile',fingerprint,p_operation_id);
  if replay is not null then return replay; end if;
  select * into customer from app_private.customers where id=p_customer_id for update;
  if not found or customer.deleted_at is not null or customer.status<>'active' then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if customer.revision<>p_expected_revision then raise exception using errcode='P0001',message='CONFLICT'; end if;
  update app_private.customers set display_name=btrim(p_display_name),frequent_instructions=p_frequent_instructions where id=customer.id returning * into customer;
  return app_private.commit_staff_operation(actor.id,'correct_customer_profile',fingerprint,p_operation_id,'customer',customer.id::text,customer.revision,
    jsonb_build_object('fields',array['display_name','frequent_instructions'],'customerRequestConfirmed',true,'previousRevision',p_expected_revision),btrim(p_reason));
end $$;

create function public.close_incident(p_incident_id uuid,p_expected_revision integer,p_resolution_note text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; incident app_private.loyalty_incidents; fingerprint text; replay jsonb;
begin
  actor:=app_private.require_staff('manager');
  if p_incident_id is null or p_expected_revision is null or p_expected_revision<1 or p_resolution_note is null or char_length(btrim(p_resolution_note)) not between 10 and 500 then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','close_incident','incidentId',p_incident_id,'revision',p_expected_revision,'note',btrim(p_resolution_note)));
  replay:=app_private.loyalty_replay('close_incident',fingerprint,p_operation_id);
  if replay is not null then return replay; end if;
  select * into incident from app_private.loyalty_incidents where id=p_incident_id for update;
  if not found or incident.deleted_at is not null then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if incident.revision<>p_expected_revision or incident.status<>'open' then raise exception using errcode='P0001',message='CONFLICT'; end if;
  -- Una nota no resuelve un premio no entregado: PT-13 requiere procedimiento aprobado.
  if incident.type='reward_delivery_failed' then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  update app_private.loyalty_incidents set status='closed',resolution_note=btrim(p_resolution_note),closed_by=actor.id,closed_at=now() where id=incident.id returning * into incident;
  return app_private.commit_staff_operation(actor.id,'close_incident',fingerprint,p_operation_id,'loyalty_incident',incident.id::text,incident.revision,
    jsonb_build_object('status','closed','balanceChanged',false),btrim(p_resolution_note));
end $$;

create function public.get_customer_history(p_customer_id uuid,p_cursor uuid default null,p_limit integer default 20) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare card app_private.loyalty_cards; cursor_row app_private.loyalty_events; data jsonb;
begin
  perform app_private.require_staff('manager');
  if p_customer_id is null or p_limit is null or p_limit not between 1 and 50 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  select * into card from app_private.loyalty_cards where customer_id=p_customer_id;
  if not found then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if p_cursor is not null then
    select * into cursor_row from app_private.loyalty_events where id=p_cursor and card_id=card.id;
    if not found then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  end if;
  with page as (select e.*,s.role actor_role from app_private.loyalty_events e join app_private.staff_accounts s on s.id=e.actor_staff_id
    where e.card_id=card.id and (p_cursor is null or (e.recorded_at,e.id)<(cursor_row.recorded_at,cursor_row.id)) order by e.recorded_at desc,e.id desc limit p_limit+1),
    visible as (select * from page order by recorded_at desc,id desc limit p_limit)
  select jsonb_build_object('customerId',p_customer_id,'events',coalesce((select jsonb_agg(jsonb_build_object(
    'id',id,'type',event_type,'delta',stamp_delta,'occurredAt',occurred_at,'recordedAt',recorded_at,'actorStaffId',actor_staff_id,'actorRole',actor_role,
    'operationId',operation_id,'rewardId',reward_id,'reversesEventId',reverses_event_id,'reason',reason,'visitReference',visit_reference,
    'reversed',exists(select 1 from app_private.loyalty_events r where r.reverses_event_id=visible.id)) order by recorded_at desc,id desc) from visible),'[]'),
    'nextCursor',case when (select count(*) from page)>p_limit then (select id from visible order by recorded_at,id limit 1) else null end) into data;
  return data;
end $$;

create function public.get_admin_customers(p_filter text default 'all',p_cursor uuid default null,p_limit integer default 20) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  perform app_private.require_staff('manager');
  if p_filter is null or p_filter not in ('all','near_reward','available_reward') or p_limit is null or p_limit not between 1 and 50 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  return (with page as (select u.id,u.display_name,u.contact_phone,c.net_stamps,c.status,
    (select count(*) from app_private.loyalty_rewards r where r.card_id=c.id and r.status='available' and r.deleted_at is null) rewards,
    (select max(e.occurred_at) from app_private.loyalty_events e where e.card_id=c.id and e.event_type='stamp_credited' and not exists(select 1 from app_private.loyalty_events x where x.reverses_event_id=e.id)) last_visit
    from app_private.customers u join app_private.loyalty_cards c on c.customer_id=u.id
    where u.deleted_at is null and u.status='active' and c.deleted_at is null and c.status<>'closed' and (p_cursor is null or u.id>p_cursor)
    and (p_filter<>'near_reward' or c.net_stamps%10 in (8,9))
    and (p_filter<>'available_reward' or exists(select 1 from app_private.loyalty_rewards r where r.card_id=c.id and r.status='available' and r.deleted_at is null))
    order by u.id limit p_limit+1), visible as (select * from page order by id limit p_limit)
    select jsonb_build_object('customers',coalesce((select jsonb_agg(jsonb_build_object('id',id,'displayName',display_name,'phone',contact_phone,'progress',net_stamps%10,'netStamps',net_stamps,'availableRewards',rewards,'lastVisit',last_visit,'cardStatus',status) order by id) from visible),'[]'),
      'nextCursor',case when (select count(*) from page)>p_limit then (select id from visible order by id desc limit 1) else null end));
end $$;

create function public.get_loyalty_dashboard(p_from date,p_until date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare start_time timestamptz; end_time timestamptz;
begin
  perform app_private.require_staff('manager');
  if p_from is null or p_until is null or p_until<p_from or p_until-p_from>366 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  start_time:=p_from::timestamp at time zone 'America/Lima'; end_time:=(p_until+1)::timestamp at time zone 'America/Lima';
  return jsonb_build_object('from',p_from,'until',p_until,'generatedAt',statement_timestamp(),
    'registeredCustomers',(select count(*) from app_private.customers where deleted_at is null and status='active'),
    'nearReward',(select count(*) from app_private.loyalty_cards c join app_private.customers u on u.id=c.customer_id where u.deleted_at is null and u.status='active' and c.deleted_at is null and c.status<>'closed' and c.net_stamps%10 in (8,9)),
    'availableRewards',(select count(*) from app_private.loyalty_rewards where status='available' and deleted_at is null),
    'openIncidents',(select count(*) from app_private.loyalty_incidents where status='open' and deleted_at is null),
    'creditedVisits',(select count(*) from app_private.loyalty_events where event_type='stamp_credited' and occurred_at>=start_time and occurred_at<end_time),
    'reversedStamps',(select count(*) from app_private.loyalty_events where event_type='stamp_reversed' and occurred_at>=start_time and occurred_at<end_time),
    'issuedRewards',(select count(*) from app_private.loyalty_events where event_type='reward_issued' and occurred_at>=start_time and occurred_at<end_time),
    'registeredRedemptions',(select count(*) from app_private.loyalty_events where event_type='reward_redeemed' and occurred_at>=start_time and occurred_at<end_time));
end $$;

create function public.get_loyalty_incidents(p_status text default 'open',p_cursor uuid default null,p_limit integer default 20,p_include_deleted boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  perform app_private.require_staff('manager');
  if p_status is null or p_status not in ('open','closed','all') or p_limit is null or p_limit not between 1 and 50 or p_include_deleted is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  return (with page as (select i.*,c.customer_id,u.display_name from app_private.loyalty_incidents i join app_private.loyalty_cards c on c.id=i.card_id join app_private.customers u on u.id=c.customer_id
    where (p_status='all' or i.status=p_status) and (p_include_deleted or i.deleted_at is null) and (p_cursor is null or i.id>p_cursor) order by i.id limit p_limit+1), visible as (select * from page order by id limit p_limit)
    select jsonb_build_object('incidents',coalesce((select jsonb_agg(jsonb_build_object('id',id,'customerId',customer_id,'displayName',display_name,'type',type,'description',description,'status',status,'revision',revision,
      'rewardId',reward_id,'sourceEventId',source_event_id,'openedBy',opened_by,'createdAt',created_at,'resolutionNote',resolution_note,'closedBy',closed_by,'closedAt',closed_at,'deleted',deleted_at is not null) order by id) from visible),'[]'),
      'nextCursor',case when (select count(*) from page)>p_limit then (select id from visible order by id desc limit 1) else null end));
end $$;

-- Conservar las rutas anteriores de catálogo/personal sin ampliar SQL dinámico.
alter function public.soft_delete_entity(text,uuid,integer,text,uuid) rename to conserve_existing_delete;
alter function public.conserve_existing_delete(text,uuid,integer,text,uuid) set schema app_private;
alter function public.restore_entity(text,uuid,integer,text,uuid) rename to conserve_existing_restore;
alter function public.conserve_existing_restore(text,uuid,integer,text,uuid) set schema app_private;
revoke all on function app_private.conserve_existing_delete(text,uuid,integer,text,uuid),app_private.conserve_existing_restore(text,uuid,integer,text,uuid) from public,anon,authenticated,service_role;

create function app_private.conserve_loyalty(p_entity text,p_id uuid,p_revision integer,p_reason text,p_operation uuid,p_restoring boolean) returns jsonb
language plpgsql set search_path='' as $$
declare actor app_private.staff_accounts; target_revision integer; deleted timestamptz; target_status text; fingerprint text; replay jsonb; kind text; table_name regclass;
begin
  actor:=app_private.require_staff('manager');
  if p_id is null or p_revision is null or p_revision<1 or p_reason is null or char_length(btrim(p_reason)) not between 10 and 500 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  -- Baja de clientes/tarjetas sigue bloqueada por PT-11, sin purgas ni supuestos legales.
  if p_entity in ('customer','loyalty_card') then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  table_name:=case p_entity when 'loyalty_incident' then 'app_private.loyalty_incidents'::regclass when 'loyalty_reward' then 'app_private.loyalty_rewards'::regclass when 'loyalty_program' then 'app_private.loyalty_program_versions'::regclass else null end;
  if table_name is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  kind:=case when p_restoring then 'restore_entity' else 'soft_delete_entity' end;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind',kind,'entityType',p_entity,'entityId',p_id,'revision',p_revision,'reason',btrim(p_reason)));
  replay:=app_private.operation_replay(kind,fingerprint,p_operation);
  if replay is not null then return replay; end if;
  if p_entity='loyalty_reward' then
    -- Perfil/tarjeta antes del premio: mismo orden que crédito/reversión.
    perform u.id from app_private.customers u join app_private.loyalty_cards c on c.customer_id=u.id join app_private.loyalty_rewards r on r.card_id=c.id where r.id=p_id for share of u;
    perform c.id from app_private.loyalty_cards c join app_private.loyalty_rewards r on r.card_id=c.id where r.id=p_id for update of c;
  end if;
  execute format('select revision,deleted_at,status from %s where id=$1 for update',table_name) into target_revision,deleted,target_status using p_id;
  if target_revision is null then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if target_revision<>p_revision or p_restoring<>(deleted is not null) then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if (p_entity='loyalty_incident' and target_status<>'closed') or (p_entity='loyalty_reward' and (target_status<>'voided' or p_restoring)) or
    (p_entity='loyalty_program' and (target_status='active' or exists(select 1 from app_private.loyalty_cards where program_version_id=p_id))) then
    raise exception using errcode='P0001',message='CONFLICT'; end if;
  execute format('update %s set deleted_at=$2,deleted_by=$3,delete_reason=$4 where id=$1 returning revision',table_name)
    into target_revision using p_id,case when p_restoring then null else now() end,case when p_restoring then null else actor.id end,case when p_restoring then null else btrim(p_reason) end;
  return app_private.commit_staff_operation(actor.id,kind,fingerprint,p_operation,p_entity,p_id::text,target_revision,
    jsonb_build_object('conservation',case when p_restoring then 'restored_without_reactivation' else 'deleted' end),btrim(p_reason));
end $$;
create function public.soft_delete_entity(p_entity_type text,p_entity_id uuid,p_expected_revision integer,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
begin
  if p_entity_type in ('customer','loyalty_card','loyalty_program','loyalty_reward','loyalty_incident') then
    return app_private.conserve_loyalty(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,false); end if;
  return app_private.conserve_existing_delete(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id);
end $$;
create function public.restore_entity(p_entity_type text,p_entity_id uuid,p_expected_revision integer,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
begin
  if p_entity_type in ('customer','loyalty_card','loyalty_program','loyalty_reward','loyalty_incident') then
    return app_private.conserve_loyalty(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,true); end if;
  return app_private.conserve_existing_restore(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id);
end $$;

create or replace function public.get_operation(p_operation_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare receipt app_private.operation_receipts; current_state jsonb; entity text;
begin
  perform app_private.require_staff();
  if p_operation_id is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  select * into receipt from app_private.operation_receipts where actor_user_id=app_private.actor_user_id() and operation_id=p_operation_id;
  if not found then return jsonb_build_object('status','not_found','operationId',p_operation_id); end if;
  if receipt.operation_kind not in ('credit_stamp','redeem_reward','open_incident') then perform app_private.require_staff('manager'); end if;
  entity:=receipt.outcome->>'entityType';
  if entity='loyalty_card' and receipt.outcome ? 'customerId' then current_state:=jsonb_build_object('entity','card','value',app_private.card_projection((receipt.outcome->>'customerId')::uuid,true));
  elsif entity='customer' then select jsonb_build_object('entity',entity,'id',id,'revision',revision,'deleted',deleted_at is not null) into current_state from app_private.customers where id=(receipt.outcome->>'entityId')::uuid;
  elsif entity='loyalty_incident' then select jsonb_build_object('entity',entity,'id',id,'revision',revision,'deleted',deleted_at is not null) into current_state from app_private.loyalty_incidents where id=(receipt.outcome->>'entityId')::uuid;
  elsif entity='loyalty_reward' then select jsonb_build_object('entity',entity,'id',id,'revision',revision,'deleted',deleted_at is not null) into current_state from app_private.loyalty_rewards where id=(receipt.outcome->>'entityId')::uuid;
  elsif entity='loyalty_program' then select jsonb_build_object('entity',entity,'id',id,'revision',revision) into current_state from app_private.loyalty_program_versions where id=(receipt.outcome->>'entityId')::uuid;
  else return app_private.get_management_operation(p_operation_id);
  end if;
  return jsonb_build_object('status','recorded','operationId',p_operation_id,'operationKind',receipt.operation_kind,'result',receipt.outcome,'currentState',current_state);
end $$;

revoke all on function public.reverse_stamp(uuid,uuid,text,uuid),public.correct_customer_profile(uuid,integer,text,text,boolean,text,uuid),public.close_incident(uuid,integer,text,uuid),public.get_customer_history(uuid,uuid,integer),public.get_admin_customers(text,uuid,integer),public.get_loyalty_dashboard(date,date),public.get_loyalty_incidents(text,uuid,integer,boolean),public.soft_delete_entity(text,uuid,integer,text,uuid),public.restore_entity(text,uuid,integer,text,uuid) from public,anon,service_role;
grant execute on function public.reverse_stamp(uuid,uuid,text,uuid),public.correct_customer_profile(uuid,integer,text,text,boolean,text,uuid),public.close_incident(uuid,integer,text,uuid),public.get_customer_history(uuid,uuid,integer),public.get_admin_customers(text,uuid,integer),public.get_loyalty_dashboard(date,date),public.get_loyalty_incidents(text,uuid,integer,boolean),public.soft_delete_entity(text,uuid,integer,text,uuid),public.restore_entity(text,uuid,integer,text,uuid) to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
