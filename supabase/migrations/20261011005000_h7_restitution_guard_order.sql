begin;
set local role app_owner;
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
      if new.status<>'available' or not exists(select 1 from app_private.loyalty_events restoration join app_private.loyalty_events redemption on redemption.id=restoration.reinstates_event_id
        where restoration.reward_id=old.id and restoration.card_id=old.card_id and restoration.event_type='reward_reinstated' and redemption.event_type='reward_redeemed'
        and redemption.reward_id=old.id and redemption.occurred_at=old.redeemed_at and restoration.recorded_at=transaction_timestamp()) then
        raise exception using errcode='P0001',message='CONFLICT'; end if;
      perform app_private.require_staff('manager');
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
reset role;
commit;
