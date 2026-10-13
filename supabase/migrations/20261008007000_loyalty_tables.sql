begin;
grant create on schema public to app_owner;

-- Puente mínimo de Auth: no se conceden lecturas de auth.users al rol de aplicación.
create function app_private.confirmed_phone(p_user_id uuid) returns text
language sql stable security definer set search_path='' as $$
  select '+' || ltrim(phone,'+') from auth.users
  where id=p_user_id and phone_confirmed_at is not null and phone ~ '^\+?519[0-9]{8}$';
$$;
create function app_private.confirmed_phone_user(p_phone text) returns uuid
language sql stable security definer set search_path='' as $$
  select id from auth.users where phone_confirmed_at is not null and ltrim(phone,'+')=ltrim(p_phone,'+');
$$;
create function app_private.lock_phone_identity(p_user_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare phone_value text;
begin
  select '+' || ltrim(phone,'+') into phone_value from auth.users
    where id=p_user_id and phone_confirmed_at is not null and phone ~ '^\+?519[0-9]{8}$' for update;
  if not found then raise exception using errcode='P0001',message='AUTH_REQUIRED'; end if;
  return phone_value;
end $$;
revoke all on function app_private.confirmed_phone(uuid),app_private.confirmed_phone_user(text),app_private.lock_phone_identity(uuid) from public,anon,authenticated,service_role;
grant execute on function app_private.confirmed_phone(uuid),app_private.confirmed_phone_user(text),app_private.lock_phone_identity(uuid) to app_owner;

create table app_private.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text check(display_name is null or char_length(btrim(display_name)) between 1 and 80),
  frequent_instructions text not null default '' check(char_length(frequent_instructions)<=500),
  status text not null default 'active' check(status in ('active','closed')),
  terms_version text not null check(char_length(terms_version) between 1 and 80),
  terms_accepted_at timestamptz not null default now(),
  revision integer not null default 1 check(revision>0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references app_private.staff_accounts(id) on delete restrict, delete_reason text,
  check(status<>'active' or (auth_user_id is not null and display_name is not null)),
  check(deleted_at is null or status='closed')
);
alter table app_private.customers owner to app_owner;
set local role app_owner;
create table app_private.loyalty_program_versions (
  id uuid primary key default gen_random_uuid(), code text not null unique check(char_length(code) between 1 and 80),
  target_stamps integer not null default 10 check(target_stamps=10),
  reward_name text not null check(char_length(btrim(reward_name)) between 1 and 120),
  reward_contents text[] not null check(cardinality(reward_contents) between 1 and 12 and app_private.valid_inclusions(reward_contents)),
  reward_cost_cents integer check(reward_cost_cents>=0), reward_available boolean not null default false,
  terms_version text not null check(char_length(terms_version) between 1 and 80),
  status text not null default 'draft' check(status in ('draft','active','retired')),
  revision integer not null default 1 check(revision>0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references app_private.staff_accounts(id) on delete restrict, delete_reason text
);
create unique index loyalty_one_active_program on app_private.loyalty_program_versions(status) where status='active' and deleted_at is null;
create table app_private.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references app_private.customers(id) on delete restrict,
  program_version_id uuid not null references app_private.loyalty_program_versions(id) on delete restrict,
  net_stamps integer not null default 0 check(net_stamps>=0),
  status text not null default 'active' check(status in ('active','suspended','closed')),
  revision integer not null default 1 check(revision>0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references app_private.staff_accounts(id) on delete restrict, delete_reason text,
  check(deleted_at is null or status='closed')
);
create index loyalty_card_program on app_private.loyalty_cards(program_version_id);
create table app_private.loyalty_events (
  id uuid primary key default gen_random_uuid(), card_id uuid not null references app_private.loyalty_cards(id) on delete restrict,
  actor_staff_id uuid not null references app_private.staff_accounts(id) on delete restrict,
  operation_id uuid not null,
  event_type text not null check(event_type in ('stamp_credited','stamp_reversed','reward_issued','reward_redeemed','reward_voided','reward_restored')),
  stamp_delta smallint not null,
  reward_id uuid, reverses_event_id uuid, visit_reference text check(visit_reference is null or char_length(btrim(visit_reference)) between 1 and 80),
  reward_cost_cents_snapshot integer check(reward_cost_cents_snapshot>=0),
  occurred_at timestamptz not null default now(), recorded_at timestamptz not null default now(),
  reason text check(reason is null or char_length(btrim(reason)) between 10 and 500),
  unique(id,card_id),
  foreign key(reverses_event_id,card_id) references app_private.loyalty_events(id,card_id) on delete restrict,
  check(occurred_at<=recorded_at),
  check((event_type='stamp_credited' and stamp_delta=1) or (event_type='stamp_reversed' and stamp_delta=-1) or
    (event_type not in ('stamp_credited','stamp_reversed') and stamp_delta=0)),
  check((event_type='stamp_reversed' and reverses_event_id is not null and reason is not null) or
    (event_type<>'stamp_reversed' and reverses_event_id is null and reason is null)),
  check((event_type like 'reward_%' and reward_id is not null) or (event_type like 'stamp_%' and reward_id is null)),
  check((event_type='reward_redeemed' and reward_cost_cents_snapshot is not null) or (event_type<>'reward_redeemed' and reward_cost_cents_snapshot is null))
);
create unique index loyalty_one_reversal on app_private.loyalty_events(reverses_event_id) where reverses_event_id is not null;
create index loyalty_event_history on app_private.loyalty_events(card_id,recorded_at desc,id);
create index loyalty_event_operation on app_private.loyalty_events(actor_staff_id,operation_id);
create index loyalty_visit_reference on app_private.loyalty_events(card_id,visit_reference) where event_type='stamp_credited' and visit_reference is not null;
create table app_private.loyalty_rewards (
  id uuid primary key default gen_random_uuid(), card_id uuid not null references app_private.loyalty_cards(id) on delete restrict,
  program_version_id uuid not null references app_private.loyalty_program_versions(id) on delete restrict,
  ordinal integer not null check(ordinal>=1), issued_stamp_event_id uuid not null,
  reward_name_snapshot text not null check(char_length(btrim(reward_name_snapshot)) between 1 and 120),
  reward_contents_snapshot text[] not null check(cardinality(reward_contents_snapshot) between 1 and 12 and app_private.valid_inclusions(reward_contents_snapshot)),
  status text not null default 'available' check(status in ('available','redeemed','voided')),
  issued_at timestamptz not null default now(), redeemed_at timestamptz,
  redeemed_by uuid references app_private.staff_accounts(id) on delete restrict,
  revision integer not null default 1 check(revision>0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references app_private.staff_accounts(id) on delete restrict, delete_reason text,
  unique(card_id,ordinal), unique(id,card_id),
  foreign key(issued_stamp_event_id,card_id) references app_private.loyalty_events(id,card_id) on delete restrict,
  check((status='redeemed' and redeemed_at is not null and redeemed_by is not null and redeemed_at>=issued_at) or
    (status<>'redeemed' and redeemed_at is null and redeemed_by is null)),
  check(deleted_at is null or status='voided')
);
alter table app_private.loyalty_events add foreign key(reward_id,card_id) references app_private.loyalty_rewards(id,card_id) on delete restrict;
create index loyalty_available_rewards on app_private.loyalty_rewards(card_id,status,ordinal) where deleted_at is null;
create table app_private.loyalty_incidents (
  id uuid primary key default gen_random_uuid(), card_id uuid not null references app_private.loyalty_cards(id) on delete restrict,
  source_event_id uuid, reward_id uuid, opened_by uuid not null references app_private.staff_accounts(id) on delete restrict,
  type text not null check(type in ('correction_requires_review','reward_delivery_failed','other')),
  description text not null check(char_length(btrim(description)) between 10 and 500),
  status text not null default 'open' check(status in ('open','closed')),
  resolution_note text, closed_by uuid references app_private.staff_accounts(id) on delete restrict, closed_at timestamptz,
  revision integer not null default 1 check(revision>0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references app_private.staff_accounts(id) on delete restrict, delete_reason text,
  foreign key(source_event_id,card_id) references app_private.loyalty_events(id,card_id) on delete restrict,
  foreign key(reward_id,card_id) references app_private.loyalty_rewards(id,card_id) on delete restrict,
  check((status='open' and resolution_note is null and closed_by is null and closed_at is null) or
    (status='closed' and resolution_note is not null and char_length(btrim(resolution_note)) between 10 and 500 and closed_by is not null and closed_at>=created_at)),
  check(deleted_at is null or status='closed')
);
create index loyalty_incident_history on app_private.loyalty_incidents(card_id,created_at,id);
create index loyalty_open_incidents on app_private.loyalty_incidents(status,created_at,id) where deleted_at is null;

create function app_private.loyalty_row_guard() returns trigger language plpgsql set search_path='' as $$
begin
  if new is not distinct from old then return new; end if;
  if new.id<>old.id then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if tg_table_name='loyalty_program_versions' then
    if (old.status<>'draft' or exists(select 1 from app_private.loyalty_cards where program_version_id=old.id)) and (new.code<>old.code or new.target_stamps<>old.target_stamps or new.reward_name<>old.reward_name or
      new.reward_contents<>old.reward_contents or new.terms_version<>old.terms_version or new.status='draft') then
      raise exception using errcode='P0001',message='CONFLICT'; end if;
    if new.deleted_at is not null and (old.status='active' or exists(select 1 from app_private.loyalty_cards where program_version_id=old.id) or
      exists(select 1 from app_private.loyalty_rewards where program_version_id=old.id)) then raise exception using errcode='P0001',message='CONFLICT'; end if;
  elsif tg_table_name='loyalty_rewards' then
    if new.card_id<>old.card_id or new.program_version_id<>old.program_version_id or new.ordinal<>old.ordinal or
      new.issued_stamp_event_id<>old.issued_stamp_event_id or new.issued_at<>old.issued_at or
      new.reward_name_snapshot<>old.reward_name_snapshot or new.reward_contents_snapshot<>old.reward_contents_snapshot or
      (old.status='redeemed' and new.status<>'redeemed') then raise exception using errcode='P0001',message='CONFLICT'; end if;
  elsif tg_table_name='loyalty_cards' then
    if new.customer_id<>old.customer_id or new.program_version_id<>old.program_version_id then raise exception using errcode='P0001',message='CONFLICT'; end if;
  elsif tg_table_name='customers' then
    if new.auth_user_id is distinct from old.auth_user_id and new.auth_user_id is not null then raise exception using errcode='P0001',message='CONFLICT'; end if;
  end if;
  if old.deleted_at is not null and new.deleted_at is null then
    if tg_table_name in ('customers','loyalty_cards') then new.status:='closed';
    elsif tg_table_name='loyalty_program_versions' then new.status:='draft'; new.reward_available:=false;
    end if;
  end if;
  new.revision:=old.revision+1; new.updated_at:=now(); return new;
end $$;
create function app_private.loyalty_reward_integrity() returns trigger language plpgsql set search_path='' as $$
begin
  if not exists(select 1 from app_private.loyalty_events where id=new.issued_stamp_event_id and card_id=new.card_id and event_type='stamp_credited') or
    not exists(select 1 from app_private.loyalty_cards where id=new.card_id and program_version_id=new.program_version_id) then
    raise exception using errcode='P0001',message='CONFLICT'; end if;
  return new;
end $$;
create trigger loyalty_reward_source before insert or update on app_private.loyalty_rewards for each row execute function app_private.loyalty_reward_integrity();
create trigger loyalty_events_immutable before update or delete on app_private.loyalty_events for each row execute function app_private.reject_history_mutation();
do $$ declare tbl text; begin
  foreach tbl in array array['customers','loyalty_program_versions','loyalty_cards','loyalty_rewards','loyalty_incidents'] loop
    execute format('alter table app_private.%I add constraint loyalty_deletion_metadata check ((deleted_at is null and deleted_by is null and delete_reason is null) or (deleted_at is not null and deleted_by is not null and delete_reason is not null and char_length(btrim(delete_reason)) between 10 and 500 and delete_reason=btrim(delete_reason)))',tbl);
    execute format('create trigger loyalty_revision before update on app_private.%I for each row execute function app_private.loyalty_row_guard()',tbl);
    execute format('create trigger loyalty_no_delete before delete on app_private.%I for each row execute function app_private.reject_history_mutation()',tbl);
  end loop;
  foreach tbl in array array['customers','loyalty_program_versions','loyalty_cards','loyalty_events','loyalty_rewards','loyalty_incidents'] loop
    execute format('alter table app_private.%I enable row level security',tbl);
    execute format('revoke all on app_private.%I from public,anon,authenticated,service_role',tbl);
  end loop;
end $$;
reset role;
create policy customer_own_read on app_private.customers for select to authenticated using(auth_user_id=auth.uid() and status='active' and deleted_at is null);
create policy card_own_read on app_private.loyalty_cards for select to authenticated using(deleted_at is null and status<>'closed' and exists(select 1 from app_private.customers where id=customer_id and auth_user_id=auth.uid() and status='active' and deleted_at is null));
create policy reward_own_read on app_private.loyalty_rewards for select to authenticated using(deleted_at is null and exists(select 1 from app_private.loyalty_cards c join app_private.customers u on u.id=c.customer_id where c.id=card_id and c.deleted_at is null and c.status<>'closed' and u.auth_user_id=auth.uid() and u.status='active' and u.deleted_at is null));
set local role app_owner;
alter table app_private.operation_receipts drop constraint operation_receipts_operation_kind_check;
alter table app_private.operation_receipts add constraint operation_receipts_operation_kind_check check(operation_kind in
  ('update_business_config','update_staff_access','soft_delete_entity','restore_entity','create_catalog_entity','update_category','update_catalog_item','update_catalog_price','update_promotion','update_option_group','update_option_choice','prepare_catalog_image_cleanup',
  'credit_stamp','redeem_reward','open_incident','activate_loyalty_program','set_reward_availability','update_reward_cost'));
alter table app_private.audit_entries drop constraint audit_entries_entity_type_check;
alter table app_private.audit_entries add constraint audit_entries_entity_type_check check(entity_type in
  ('staff_account','business_config','category','catalog_item','catalog_price','promotion','option_group','option_choice','catalog_image','payment_method','delivery_zone',
  'customer','loyalty_card','loyalty_program','loyalty_incident'));
-- Referencia acordada, sin costo supuesto, sin disponibilidad ni activación comercial.
insert into app_private.loyalty_program_versions(id,code,reward_name,reward_contents,terms_version)
values('f6000000-0000-4000-8000-000000000001','ten-visits-v1','Mostrito de ⅛',array['Chaufa','Papas fritas','Ensalada'],'fyb-loyalty-v1');
reset role;
revoke create on schema public from app_owner;
commit;
