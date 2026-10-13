begin;
grant create on schema public to app_owner;
set local role app_owner;

create function app_private.credit_stamp_at(p_customer_id uuid,p_operation_id uuid,p_paid_confirmed boolean,p_delivered_confirmed boolean,p_visit_reference text,p_occurred_at timestamptz,p_reason text,p_kind text) returns jsonb
language plpgsql set search_path='' as $$
declare actor app_private.staff_accounts; card app_private.loyalty_cards; version app_private.loyalty_program_versions; reward app_private.loyalty_rewards;
  fingerprint text; replay jsonb; reference text; event_id uuid; result jsonb; reward_event text; payload jsonb;
begin
  if p_kind not in ('credit_stamp','credit_contingency_stamp') or p_kind is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  actor:=app_private.require_staff(case when p_kind='credit_stamp' then 'attendant' else 'manager' end);
  reference:=nullif(btrim(p_visit_reference),'');
  if p_customer_id is null or p_paid_confirmed is distinct from true or p_delivered_confirmed is distinct from true or char_length(reference)>80 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if p_kind='credit_contingency_stamp' and (reference is null or p_occurred_at is null or p_occurred_at>statement_timestamp() or p_reason is null or char_length(btrim(p_reason)) not between 10 and 500) then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  payload:=jsonb_build_object('kind',p_kind,'customerId',p_customer_id,'paidConfirmed',true,'deliveredConfirmed',true,'visitReference',reference);
  if p_kind='credit_contingency_stamp' then payload:=payload || jsonb_build_object('occurredAt',p_occurred_at,'reason',btrim(p_reason)); end if;
  fingerprint:=app_private.operation_hash(payload);
  replay:=app_private.loyalty_replay(p_kind,fingerprint,p_operation_id);
  if replay is not null then return app_private.loyalty_with_card(replay); end if;
  card:=app_private.lock_loyalty_card(p_customer_id);
  select * into version from app_private.loyalty_program_versions where id=card.program_version_id for share;
  if version.status='draft' or version.deleted_at is not null then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  if p_kind='credit_contingency_stamp' and p_occurred_at<card.created_at then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if reference is not null and exists(select 1 from app_private.loyalty_events e where e.card_id=card.id and e.event_type='stamp_credited' and e.visit_reference=reference and not exists(select 1 from app_private.loyalty_events r where r.reverses_event_id=e.id)) then raise exception using errcode='P0001',message='DUPLICATE_VISIT_REFERENCE'; end if;
  update app_private.loyalty_cards set net_stamps=net_stamps+1 where id=card.id returning * into card;
  insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,visit_reference,occurred_at)
    values(card.id,actor.id,p_operation_id,'stamp_credited',1,reference,p_occurred_at) returning id into event_id;
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
    if reward_event is not null then insert into app_private.loyalty_events(card_id,actor_staff_id,operation_id,event_type,stamp_delta,reward_id) values(card.id,actor.id,p_operation_id,reward_event,0,reward.id); end if;
  end if;
  result:=app_private.loyalty_commit(actor.id,p_kind,fingerprint,p_operation_id,'loyalty_card',card.id,card.revision,jsonb_build_object('customerId',p_customer_id,'eventId',event_id,'rewardId',reward.id));
  if p_kind='credit_contingency_stamp' then
    insert into app_private.audit_entries(actor_staff_id,actor_user_id,action,entity_type,entity_id,changed_fields,reason,operation_id)
      values(actor.id,actor.auth_user_id,'contingency_reconciled','loyalty_card',card.id::text,jsonb_build_object('eventId',event_id,'occurredAt',p_occurred_at),btrim(p_reason),p_operation_id);
  end if;
  return app_private.loyalty_with_card(result);
end $$;
create or replace function public.credit_stamp(p_customer_id uuid,p_operation_id uuid,p_paid_confirmed boolean,p_delivered_confirmed boolean,p_visit_reference text default null) returns jsonb
language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
  select app_private.credit_stamp_at(p_customer_id,p_operation_id,p_paid_confirmed,p_delivered_confirmed,p_visit_reference,now(),null,'credit_stamp');
$$;
create function public.credit_contingency_stamp(p_customer_id uuid,p_occurred_at timestamptz,p_visit_reference text,p_reason text,p_paid_confirmed boolean,p_delivered_confirmed boolean,p_operation_id uuid) returns jsonb
language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
  select app_private.credit_stamp_at(p_customer_id,p_operation_id,p_paid_confirmed,p_delivered_confirmed,p_visit_reference,p_occurred_at,p_reason,'credit_contingency_stamp');
$$;
revoke all on function public.credit_contingency_stamp(uuid,timestamptz,text,text,boolean,boolean,uuid) from public,anon,service_role;
grant execute on function public.credit_contingency_stamp(uuid,timestamptz,text,text,boolean,boolean,uuid) to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
