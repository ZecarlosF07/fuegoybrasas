begin;
grant create on schema public to app_owner;
set local role app_owner;

-- Vincular el canje al abrir el caso evita depender del orden de timestamps/UUID.
create function app_private.bind_failed_redemption() returns trigger
language plpgsql set search_path='' as $$
declare candidates uuid[];
begin
  if new.type<>'reward_delivery_failed' then return new; end if;
  select array_agg(e.id) into candidates from app_private.loyalty_events e
    join app_private.loyalty_rewards r on r.id=e.reward_id and r.card_id=e.card_id
    where r.id=new.reward_id and r.card_id=new.card_id and r.status='redeemed'
      and e.event_type='reward_redeemed' and e.occurred_at=r.redeemed_at
      and not exists(select 1 from app_private.loyalty_events restored where restored.reinstates_event_id=e.id);
  if coalesce(cardinality(candidates),0)<>1 then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if new.source_event_id is not null and new.source_event_id<>candidates[1] then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  new.source_event_id:=candidates[1];
  return new;
end $$;
revoke all on function app_private.bind_failed_redemption() from public,anon,authenticated,service_role;
create trigger incident_redemption_binding before insert on app_private.loyalty_incidents
  for each row execute function app_private.bind_failed_redemption();

create or replace function app_private.reinstate_reward_approved(p_incident_id uuid,p_expected_revision integer,p_not_delivered_confirmed boolean,p_reason text,p_operation_id uuid) returns jsonb
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
  select * into redemption from app_private.loyalty_events where id=incident.source_event_id
    and card_id=card.id and reward_id=reward.id and event_type='reward_redeemed' and occurred_at=reward.redeemed_at;
  if not found or exists(select 1 from app_private.loyalty_events where reinstates_event_id=redemption.id) then raise exception using errcode='P0001',message='CONFLICT'; end if;
  insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,reward_id,reinstates_event_id,reason)
    values(card.id,actor.id,p_operation_id,'reward_reinstated',0,reward.id,redemption.id,btrim(p_reason)) returning id into event_id;
  update app_private.loyalty_rewards set status='available',redeemed_at=null,redeemed_by=null where id=reward.id;
  update app_private.loyalty_cards set revision=revision+1 where id=card.id returning * into card;
  update app_private.loyalty_incidents set status='closed',resolution_note=btrim(p_reason),closed_by=actor.id,closed_at=now() where id=incident.id;
  result:=app_private.loyalty_commit(actor.id,'reinstate_reward',fingerprint,p_operation_id,'loyalty_card',card.id,card.revision,
    jsonb_build_object('customerId',customer_id_value,'eventId',event_id,'rewardId',reward.id,'incidentId',incident.id));
  return app_private.loyalty_with_card(result);
end $$;

create or replace function public.reinstate_reward(p_incident_id uuid,p_expected_revision integer,p_not_delivered_confirmed boolean,p_reason text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
begin
  return app_private.reinstate_reward_approved(p_incident_id,p_expected_revision,p_not_delivered_confirmed,p_reason,p_operation_id);
end $$;
reset role;
revoke create on schema public from app_owner;
commit;
