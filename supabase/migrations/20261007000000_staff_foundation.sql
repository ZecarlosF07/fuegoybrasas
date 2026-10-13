begin;
grant usage, create on schema public to app_owner;
-- Supabase administra Auth. El puente no recibe IDs libres ni expone claims completos.
create function app_private.request_claims() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('uid',auth.uid(),'aal',coalesce(auth.jwt()->>'aal','aal1'));
$$;
revoke all on function app_private.request_claims() from public,anon,authenticated,service_role;
grant execute on function app_private.request_claims() to app_owner;

create table app_private.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  role text not null check (role in ('attendant', 'manager')),
  active boolean not null default false,
  created_by uuid references app_private.staff_accounts(id) on delete restrict,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references app_private.staff_accounts(id) on delete restrict,
  delete_reason text,
  constraint staff_deletion_metadata check (
    (deleted_at is null and deleted_by is null and delete_reason is null) or
    (deleted_at is not null and deleted_by is not null and not active and
      delete_reason is not null and delete_reason = btrim(delete_reason) and
      char_length(delete_reason) between 10 and 500)
  )
);
alter table app_private.staff_accounts owner to app_owner;
create policy staff_own_access on app_private.staff_accounts for select to authenticated
  using (auth_user_id = auth.uid());
set local role app_owner;
create index staff_active_managers on app_private.staff_accounts(role, id)
  where deleted_at is null and active;
alter table app_private.staff_accounts enable row level security;
create function app_private.actor_user_id() returns uuid
language sql stable set search_path = '' as $$
  select (app_private.request_claims()->>'uid')::uuid;
$$;

create function app_private.valid_opening_periods(periods jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  entry jsonb; other jsonb; start_min integer; end_min integer;
  other_start integer; other_end integer; position integer; other_position integer;
begin
  if jsonb_typeof(periods) <> 'array' or jsonb_array_length(periods) > 28 then return false; end if;
  for entry in select value from jsonb_array_elements(periods) loop
    if jsonb_typeof(entry) <> 'object' or
      (select count(*) from jsonb_object_keys(entry)) <> 4 or
      not (entry ?& array['day','opensAt','closesAt','closesNextDay']) or
      coalesce(entry->>'day','') !~ '^[1-7]$' or
      coalesce(entry->>'opensAt','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or
      coalesce(entry->>'closesAt','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or
      jsonb_typeof(entry->'day') <> 'number' or
      jsonb_typeof(entry->'closesNextDay') <> 'boolean' then return false; end if;
  end loop;
  for entry, position in select value, ordinality::integer from jsonb_array_elements(periods) with ordinality loop
    start_min := ((entry->>'day')::integer-1)*1440 + extract(hour from (entry->>'opensAt')::time)::integer*60 + extract(minute from (entry->>'opensAt')::time)::integer;
    end_min := ((entry->>'day')::integer-1 + (entry->>'closesNextDay')::boolean::integer)*1440 + extract(hour from (entry->>'closesAt')::time)::integer*60 + extract(minute from (entry->>'closesAt')::time)::integer;
    if end_min <= start_min then return false; end if;
    for other, other_position in select value, ordinality::integer from jsonb_array_elements(periods) with ordinality loop
      if other_position <= position then continue; end if;
      other_start := ((other->>'day')::integer-1)*1440 + extract(hour from (other->>'opensAt')::time)::integer*60 + extract(minute from (other->>'opensAt')::time)::integer;
      other_end := ((other->>'day')::integer-1 + (other->>'closesNextDay')::boolean::integer)*1440 + extract(hour from (other->>'closesAt')::time)::integer*60 + extract(minute from (other->>'closesAt')::time)::integer;
      if (start_min < other_end and other_start < end_min) or
        (start_min < other_end+10080 and other_start+10080 < end_min) or
        (start_min < other_end-10080 and other_start-10080 < end_min) then return false; end if;
    end loop;
  end loop;
  return true;
end; $$;

create table public.business_settings (
  id smallint primary key default 1 check (id = 1),
  display_name text not null default 'Fuego y Brasas' check (char_length(btrim(display_name)) between 1 and 120),
  whatsapp_e164 text not null default '+51982042493' check (whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  timezone text not null default 'America/Lima' check (timezone = 'America/Lima'),
  address text check (address is null or char_length(btrim(address)) between 1 and 250),
  maps_url text check (maps_url is null or (char_length(maps_url) <= 2048 and maps_url ~ '^https://((www\.)?google\.com/maps([/?]|$)|maps\.google\.com(/|$)|maps\.app\.goo\.gl/[A-Za-z0-9]+(\?.*)?$)')),
  location_verified boolean not null default false,
  schedule_confirmed boolean not null default false,
  opening_periods jsonb not null default '[]'::jsonb check (app_private.valid_opening_periods(opening_periods)),
  pickup_extra_cents integer check (pickup_extra_cents >= 0),
  pickup_charges_verified boolean not null default false,
  ordering_enabled boolean not null default false,
  loyalty_enabled boolean not null default false,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not location_verified or address is not null),
  check (not schedule_confirmed or jsonb_array_length(opening_periods) > 0),
  check (not pickup_charges_verified or pickup_extra_cents is not null)
);
alter table public.business_settings enable row level security;
revoke all on public.business_settings from public, anon, authenticated, service_role;
insert into public.business_settings(id) values (1);

create table app_private.operation_receipts (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  operation_id uuid not null,
  operation_kind text not null check (operation_kind in ('update_business_config','update_staff_access','soft_delete_entity','restore_entity')),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  outcome jsonb not null check (jsonb_typeof(outcome) = 'object' and outcome ? 'outcome' and outcome->>'outcome' in ('applied','review_required')),
  created_at timestamptz not null default now(),
  unique(actor_user_id, operation_id)
);
alter table app_private.operation_receipts enable row level security;

create table app_private.audit_entries (
  id uuid primary key default gen_random_uuid(),
  actor_staff_id uuid references app_private.staff_accounts(id) on delete restrict,
  actor_user_id uuid not null,
  action text not null check (char_length(action) between 1 and 80),
  entity_type text not null check (entity_type in ('staff_account','business_config')),
  entity_id text not null check (char_length(entity_id) between 1 and 160),
  changed_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(changed_fields) = 'object'),
  reason text check (reason is null or char_length(btrim(reason)) between 10 and 500),
  operation_id uuid,
  created_at timestamptz not null default now()
);
create index audit_entity_history on app_private.audit_entries(entity_type,entity_id,created_at desc,id);
create index audit_actor_history on app_private.audit_entries(actor_staff_id,created_at desc);
create index audit_operation on app_private.audit_entries(actor_user_id,operation_id);
alter table app_private.audit_entries enable row level security;

create function app_private.reject_history_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin raise exception using errcode = 'P0001', message = 'FORBIDDEN'; end; $$;
create trigger receipts_immutable before update or delete on app_private.operation_receipts
  for each row execute function app_private.reject_history_mutation();
create trigger audit_immutable before update or delete on app_private.audit_entries
  for each row execute function app_private.reject_history_mutation();
create trigger config_not_deletable before delete on public.business_settings
  for each row execute function app_private.reject_history_mutation();
create trigger staff_not_deletable before delete on app_private.staff_accounts
  for each row execute function app_private.reject_history_mutation();

create function app_private.require_staff(required_role text default 'attendant', require_mfa boolean default true)
returns app_private.staff_accounts language plpgsql stable security definer set search_path = '' as $$
declare account app_private.staff_accounts;
begin
  if app_private.actor_user_id() is null then raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED'; end if;
  if required_role not in ('attendant','manager') then raise exception using errcode = 'P0001', message = 'FORBIDDEN'; end if;
  select * into account from app_private.staff_accounts where auth_user_id = app_private.actor_user_id() and active and deleted_at is null;
  if not found or (required_role = 'manager' and account.role <> 'manager') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN'; end if;
  if require_mfa and app_private.request_claims()->>'aal' <> 'aal2' then
    raise exception using errcode = 'P0001', message = 'MFA_REQUIRED'; end if;
  return account;
end; $$;

create function public.get_staff_access() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare account app_private.staff_accounts;
begin
  account := app_private.require_staff('attendant',false);
  return jsonb_build_object('id',account.id,'authUserId',account.auth_user_id,'role',account.role,
    'revision',account.revision,'assuranceLevel',app_private.request_claims()->>'aal');
end; $$;

create function public.has_staff_role(required_role text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.require_staff(required_role,true);
  return true;
exception when sqlstate 'P0001' then return false;
end; $$;

create function app_private.config_projection() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('revision',revision,'displayName',display_name,'whatsappE164',whatsapp_e164,
    'timezone',timezone,'address',address,'mapsUrl',maps_url,'locationVerified',location_verified,
    'scheduleConfirmed',schedule_confirmed,'openingPeriods',opening_periods,
    'pickupExtraCents',pickup_extra_cents,'pickupChargesVerified',pickup_charges_verified,
    'orderingEnabled',ordering_enabled,'loyaltyEnabled',loyalty_enabled)
  from public.business_settings where id=1;
$$;
create function public.get_admin_config() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare configuration jsonb;
begin
  perform app_private.require_staff('manager');
  configuration := app_private.config_projection();
  if configuration is null then raise exception using errcode = 'P0001', message = 'CONFIG_NOT_READY'; end if;
  return configuration;
end; $$;

revoke all on function public.get_staff_access(), public.has_staff_role(text), public.get_admin_config() from public, anon, service_role;
grant execute on function public.get_staff_access(), public.has_staff_role(text), public.get_admin_config() to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
