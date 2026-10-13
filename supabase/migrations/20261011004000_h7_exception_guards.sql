begin;
grant create on schema public to app_owner;
set local role app_owner;

alter function public.reinstate_reward(uuid,integer,boolean,text,uuid) rename to reinstate_reward_approved;
alter function public.reinstate_reward_approved(uuid,integer,boolean,text,uuid) set schema app_private;
revoke all on function app_private.reinstate_reward_approved(uuid,integer,boolean,text,uuid) from public,anon,authenticated,service_role;
create function public.reinstate_reward(p_incident_id uuid,p_expected_revision integer,p_not_delivered_confirmed boolean,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare fingerprint text; replay jsonb; customer uuid; incident app_private.loyalty_incidents;
begin
  perform app_private.require_staff('manager');
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','reinstate_reward','incidentId',p_incident_id,'revision',p_expected_revision,'notDelivered',true,'reason',btrim(p_reason)));
  replay:=app_private.loyalty_replay('reinstate_reward',fingerprint,p_operation_id);
  if replay is null then
    select c.customer_id into customer from app_private.loyalty_incidents i join app_private.loyalty_cards c on c.id=i.card_id where i.id=p_incident_id;
    if not found then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
    perform app_private.lock_loyalty_card(customer,false);
    select * into incident from app_private.loyalty_incidents where id=p_incident_id;
    -- Una incidencia antigua no puede devolver un canje posterior del mismo premio.
    if exists(select 1 from app_private.loyalty_events where reward_id=incident.reward_id and event_type='reward_redeemed' and recorded_at>incident.created_at) then
      raise exception using errcode='P0001',message='CONFLICT'; end if;
  end if;
  return app_private.reinstate_reward_approved(p_incident_id,p_expected_revision,p_not_delivered_confirmed,p_reason,p_operation_id);
end $$;

create or replace function public.soft_delete_entity(p_entity_type text,p_entity_id uuid,p_expected_revision integer,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
begin
  if p_entity_type in ('customer','loyalty_card') then perform app_private.require_staff('manager'); raise exception using errcode='P0001',message='FORBIDDEN'; end if;
  if p_entity_type in ('loyalty_program','loyalty_reward','loyalty_incident') then return app_private.conserve_loyalty(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,false); end if;
  return app_private.conserve_existing_delete(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id);
end $$;
create or replace function public.restore_entity(p_entity_type text,p_entity_id uuid,p_expected_revision integer,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
begin
  if p_entity_type in ('customer','loyalty_card') then perform app_private.require_staff('manager'); raise exception using errcode='P0001',message='FORBIDDEN'; end if;
  if p_entity_type in ('loyalty_program','loyalty_reward','loyalty_incident') then return app_private.conserve_loyalty(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,true); end if;
  return app_private.conserve_existing_restore(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id);
end $$;

alter function public.get_customer_history(uuid,uuid,integer) rename to get_history_before_reinstatement;
alter function public.get_history_before_reinstatement(uuid,uuid,integer) set schema app_private;
revoke all on function app_private.get_history_before_reinstatement(uuid,uuid,integer) from public,anon,authenticated,service_role;
create function public.get_customer_history(p_customer_id uuid,p_cursor uuid default null,p_limit integer default 20) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  result:=app_private.get_history_before_reinstatement(p_customer_id,p_cursor,p_limit);
  return result || jsonb_build_object('events',coalesce((select jsonb_agg(entry.value || jsonb_build_object('reinstatesEventId',e.reinstates_event_id) order by entry.ordinality)
    from jsonb_array_elements(result->'events') with ordinality entry join app_private.loyalty_events e on e.id=(entry.value->>'id')::uuid),'[]'));
end $$;

alter function public.get_loyalty_dashboard(date,date) rename to get_dashboard_before_reinstatement;
alter function public.get_dashboard_before_reinstatement(date,date) set schema app_private;
revoke all on function app_private.get_dashboard_before_reinstatement(date,date) from public,anon,authenticated,service_role;
create function public.get_loyalty_dashboard(p_from date,p_until date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  result:=app_private.get_dashboard_before_reinstatement(p_from,p_until);
  return result || jsonb_build_object('reinstatedRewards',(select count(*) from app_private.loyalty_events where event_type='reward_reinstated'
    and occurred_at>=p_from::timestamp at time zone 'America/Lima' and occurred_at<(p_until+1)::timestamp at time zone 'America/Lima'));
end $$;
revoke all on function public.reinstate_reward(uuid,integer,boolean,text,uuid),public.get_customer_history(uuid,uuid,integer),public.get_loyalty_dashboard(date,date) from public,anon,service_role;
grant execute on function public.reinstate_reward(uuid,integer,boolean,text,uuid),public.get_customer_history(uuid,uuid,integer),public.get_loyalty_dashboard(date,date) to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
