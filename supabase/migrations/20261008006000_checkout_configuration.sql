begin;
grant create on schema public to app_owner;
set local role app_owner;
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[a-z0-9_-]{1,80}$'),
  label text not null check(char_length(btrim(label)) between 1 and 120),
  instructions text check(instructions is null or char_length(instructions) between 1 and 500),
  needs_change boolean not null default false, enabled boolean not null default false, verified boolean not null default false,
  sort_order integer not null default 0 check(sort_order>=0),
  revision integer not null default 1 check(revision>=1),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references app_private.staff_accounts(id) on delete restrict, delete_reason text,
  check((deleted_at is null and deleted_by is null and delete_reason is null) or
    (deleted_at is not null and deleted_by is not null and delete_reason is not null and char_length(btrim(delete_reason)) between 10 and 500 and delete_reason=btrim(delete_reason)))
);
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(), name text not null check(char_length(btrim(name)) between 1 and 120),
  coverage text not null check(coverage in ('allowed','excluded')), fee_cents integer check(fee_cents>=0),
  minimum_subtotal_cents integer check(minimum_subtotal_cents>=0),
  enabled boolean not null default false, verified boolean not null default false,
  revision integer not null default 1 check(revision>=1),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, deleted_by uuid references app_private.staff_accounts(id) on delete restrict, delete_reason text,
  check((deleted_at is null and deleted_by is null and delete_reason is null) or
    (deleted_at is not null and deleted_by is not null and delete_reason is not null and char_length(btrim(delete_reason)) between 10 and 500 and delete_reason=btrim(delete_reason)))
);
create index payment_public_order on public.payment_methods(sort_order,id) where deleted_at is null and enabled and verified;
create index zone_public_order on public.delivery_zones(coverage,name,id) where deleted_at is null and enabled and verified;
alter table public.payment_methods enable row level security;
alter table public.delivery_zones enable row level security;
revoke all on public.payment_methods,public.delivery_zones from public,anon,authenticated,service_role;
alter table app_private.audit_entries drop constraint audit_entries_entity_type_check;
alter table app_private.audit_entries add constraint audit_entries_entity_type_check check(entity_type in
 ('staff_account','business_config','category','catalog_item','catalog_price','promotion','option_group','option_choice','catalog_image','payment_method','delivery_zone'));

create function app_private.checkout_row_change() returns trigger language plpgsql set search_path='' as $$
begin
  if new is not distinct from old then return new; end if;
  if new.id<>old.id then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if old.deleted_at is not null and new.deleted_at is null then new.enabled:=false; new.verified:=false; end if;
  new.revision:=old.revision+1; new.updated_at:=now(); return new;
end $$;
create function app_private.checkout_parent_change() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' then if new is not distinct from old then return new; end if; end if;
  update public.business_settings set revision=revision+1,updated_at=now() where id=1; return new;
end $$;
create function app_private.checkout_integrity() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.business_settings where ordering_enabled) and not exists(
    select 1 from public.payment_methods where enabled and verified and deleted_at is null) then
    raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  return null;
end $$;
create constraint trigger checkout_ready after insert or update on public.business_settings deferrable initially deferred for each row execute function app_private.checkout_integrity();
do $$ declare tbl text; begin
  foreach tbl in array array['payment_methods','delivery_zones'] loop
    execute format('create trigger checkout_revision before update on public.%I for each row execute function app_private.checkout_row_change()',tbl);
    execute format('create trigger checkout_parent after insert or update on public.%I for each row execute function app_private.checkout_parent_change()',tbl);
    execute format('create trigger catalog_no_delete before delete on public.%I for each row execute function app_private.reject_history_mutation()',tbl);
    execute format('create constraint trigger checkout_ready after insert or update on public.%I deferrable initially deferred for each row execute function app_private.checkout_integrity()',tbl);
  end loop;
end $$;

create function app_private.checkout_public() returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object(
    'paymentMethods',coalesce((select jsonb_agg(jsonb_build_object('id',id,'code',code,'label',label,'instructions',instructions,'needsChange',needs_change,'revision',revision) order by sort_order,id)
      from public.payment_methods where enabled and verified and deleted_at is null),'[]'::jsonb),
    'deliveryZones',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'coverage',coverage,'feeCents',fee_cents,'minimumSubtotalCents',minimum_subtotal_cents,'revision',revision) order by name,id)
      from public.delivery_zones where enabled and verified and deleted_at is null),'[]'::jsonb),
    'paymentsReady',exists(select 1 from public.payment_methods where enabled and verified and deleted_at is null),
    'deliveryZonesReady',exists(select 1 from public.delivery_zones where enabled and verified and deleted_at is null));
$$;
create or replace function public.get_admin_config() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  perform app_private.require_staff('manager');
  select app_private.config_projection() || jsonb_build_object(
    'paymentMethods',coalesce((select jsonb_agg(to_jsonb(p) order by sort_order,id) from public.payment_methods p),'[]'::jsonb),
    'deliveryZones',coalesce((select jsonb_agg(to_jsonb(z) order by name,id) from public.delivery_zones z),'[]'::jsonb)) into result;
  if result is null then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  return result;
end $$;
create or replace function app_private.catalog_entity_table(entity text) returns regclass
language plpgsql immutable set search_path='' as $$
begin
  case entity
    when 'category' then return 'public.categories'::regclass;
    when 'catalog_item' then return 'public.catalog_items'::regclass;
    when 'catalog_price' then return 'public.catalog_prices'::regclass;
    when 'promotion' then return 'public.promotions'::regclass;
    when 'option_group' then return 'public.option_groups'::regclass;
    when 'option_choice' then return 'public.option_choices'::regclass;
    when 'payment_method' then return 'public.payment_methods'::regclass;
    when 'delivery_zone' then return 'public.delivery_zones'::regclass;
    else raise exception using errcode='P0001',message='VALIDATION_ERROR';
  end case;
end $$;

create or replace function app_private.catalog_parent_live(entity text, value jsonb) returns boolean
language sql stable set search_path='' as $$
  select case entity
    when 'category' then true
    when 'payment_method' then true
    when 'delivery_zone' then true
    when 'catalog_item' then exists(select 1 from public.categories where id=(value->>'category_id')::uuid and deleted_at is null)
    when 'option_choice' then exists(select 1 from public.option_groups g join public.catalog_items i on i.id=g.item_id join public.categories c on c.id=i.category_id where g.id=(value->>'group_id')::uuid and g.deleted_at is null and i.deleted_at is null and c.deleted_at is null)
    else exists(select 1 from public.catalog_items i join public.categories c on c.id=i.category_id where i.id=(value->>'item_id')::uuid and i.deleted_at is null and c.deleted_at is null)
  end;
$$;

create or replace function app_private.normalize_config_patch(patch jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare entry record; normalized jsonb := '{}';
begin
  if patch is null or jsonb_typeof(patch) <> 'object' or patch = '{}'::jsonb then
    raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
  for entry in select key,value from jsonb_each(patch) loop
    if entry.key in ('displayName','whatsappE164','timezone') then
      if jsonb_typeof(entry.value) <> 'string' then raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
      normalized := normalized || jsonb_build_object(entry.key,btrim(entry.value#>>'{}'));
    elsif entry.key in ('address','mapsUrl') then
      if jsonb_typeof(entry.value) not in ('string','null') then raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
      normalized := normalized || jsonb_build_object(entry.key,nullif(btrim(entry.value#>>'{}'),''));
    elsif entry.key in ('locationVerified','scheduleConfirmed','pickupChargesVerified','orderingEnabled','loyaltyEnabled') then
      if jsonb_typeof(entry.value) <> 'boolean' then raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
      normalized := normalized || jsonb_build_object(entry.key,entry.value);
    elsif entry.key = 'openingPeriods' then
      if not app_private.valid_opening_periods(entry.value) then raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
      normalized := normalized || jsonb_build_object(entry.key,entry.value);
    elsif entry.key = 'pickupExtraCents' then
      if jsonb_typeof(entry.value) <> 'null' and (jsonb_typeof(entry.value) <> 'number' or entry.value::text !~ '^[0-9]+$') then
        raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
      normalized := normalized || jsonb_build_object(entry.key,entry.value);
    else raise exception using errcode='P0001', message='VALIDATION_ERROR';
    end if;
  end loop;
  -- H5 permite pedidos; fidelización continúa reservada a H6.
  if normalized->'loyaltyEnabled' = 'true'::jsonb then
    raise exception using errcode='P0001', message='CONFIG_NOT_READY'; end if;
  return normalized;
end; $$;

-- Conserva los recibos y normalización de campos escalares de H2.
alter function public.update_business_config(integer,jsonb,uuid) set schema app_private;
alter function app_private.update_business_config(integer,jsonb,uuid) rename to update_business_config_base;
revoke all on function app_private.update_business_config_base(integer,jsonb,uuid) from public,anon,authenticated,service_role;

create function app_private.checkout_patch(entity text,input jsonb) returns jsonb language plpgsql set search_path='' as $$
declare e record; result jsonb:='{}'; typ text;
begin
  if input is null or jsonb_typeof(input)<>'object' or input='{}'::jsonb then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  for e in select key,value from jsonb_each(input) loop
    if (entity='payment_method' and e.key not in ('code','label','instructions','needs_change','enabled','verified','sort_order')) or
       (entity='delivery_zone' and e.key not in ('name','coverage','fee_cents','minimum_subtotal_cents','enabled','verified')) then
      raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
    typ:=jsonb_typeof(e.value);
    if e.key in ('enabled','verified','needs_change') then
      if typ<>'boolean' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
    elsif e.key in ('fee_cents','minimum_subtotal_cents','sort_order') then
      if not(typ='number' and e.value::text ~ '^[0-9]+$') and not(typ='null' and e.key<>'sort_order') then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
    else
      if typ<>'string' and not(typ='null' and e.key='instructions') then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
      if typ='string' then e.value:=to_jsonb(btrim(e.value#>>'{}')); end if;
    end if;
    result:=result||jsonb_build_object(e.key,e.value);
  end loop;
  return result;
end $$;

create function public.update_business_config(p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; key text; entity text; change jsonb; patch jsonb; target uuid; expected integer;
  global_revision integer; tbl regclass; before_state jsonb; after_state jsonb; fingerprint text; replay jsonb; columns_sql text; values_sql text;
begin
  actor:=app_private.require_staff('manager');
  if not(p_patch ? 'paymentMethods' or p_patch ? 'deliveryZones') then
    return app_private.update_business_config_base(p_expected_revision,p_patch,p_operation_id); end if;
  if p_expected_revision is null or p_expected_revision<1 or jsonb_typeof(p_patch)<>'object' or (select count(*) from jsonb_object_keys(p_patch))<>1 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  key:=case when p_patch ? 'paymentMethods' then 'paymentMethods' else 'deliveryZones' end;
  if jsonb_typeof(p_patch->key)<>'array' or jsonb_array_length(p_patch->key)<>1 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  change:=p_patch->key->0;
  if jsonb_typeof(change)<>'object' or exists(select 1 from jsonb_object_keys(change) k where k not in ('id','expectedRevision','fields')) then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if jsonb_typeof(change->'id')<>'string' or jsonb_typeof(change->'expectedRevision')<>'number' or (change->'expectedRevision')::text !~ '^[0-9]+$' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  target:=(change->>'id')::uuid; expected:=(change->>'expectedRevision')::integer;
  if target is null or expected is null or expected<0 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  entity:=case when key='paymentMethods' then 'payment_method' else 'delivery_zone' end;
  patch:=app_private.checkout_patch(entity,change->'fields');
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','update_business_config','revision',p_expected_revision,'patch',jsonb_build_object(key,jsonb_build_array(jsonb_build_object('id',target,'expectedRevision',expected,'fields',patch)))));
  replay:=app_private.operation_replay('update_business_config',fingerprint,p_operation_id);
  if replay is not null then return replay; end if;
  select revision into global_revision from public.business_settings where id=1 for update;
  if global_revision is null then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  if global_revision<>p_expected_revision then raise exception using errcode='P0001',message='CONFLICT',detail=jsonb_build_object('entity','business_config','revision',global_revision)::text; end if;
  tbl:=app_private.catalog_entity_table(entity);
  execute format('select to_jsonb(t) from %s t where id=$1 for update',tbl) into before_state using target;
  if (expected=0 and before_state is not null) or (expected>0 and (before_state is null or (before_state->>'revision')::integer<>expected or before_state->>'deleted_at' is not null)) then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if expected>0 and patch ? 'code' and patch->'code' is distinct from before_state->'code' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if expected>0 and not exists(select 1 from jsonb_each(patch) e where before_state->e.key is distinct from e.value) then
    return app_private.commit_staff_operation(actor.id,'update_business_config',fingerprint,p_operation_id,'business_config','1',global_revision,null); end if;
  if expected>0 and not patch ? 'verified' then patch:=patch||'{"verified":false}'; end if;
  select string_agg(format('%I',k),',' order by k),string_agg(format('x.%I',k),',' order by k) into columns_sql,values_sql from jsonb_object_keys(patch) k;
  if expected=0 then execute format('insert into %s(id,%s) select $2,%s from jsonb_populate_record(null::%s,$1)x',tbl,columns_sql,values_sql,tbl) using patch,target;
  else execute format('update %s set(%s)=(select %s from jsonb_populate_record(null::%s,$1)x) where id=$2',tbl,columns_sql,values_sql,tbl) using patch,target; end if;
  set constraints all immediate;
  execute format('select to_jsonb(t) from %s t where id=$1',tbl) into after_state using target;
  select revision into global_revision from public.business_settings where id=1;
  return app_private.commit_staff_operation(actor.id,'update_business_config',fingerprint,p_operation_id,'business_config','1',global_revision,
    jsonb_build_object('entity',entity,'id',target,'fields',(select jsonb_agg(k) from jsonb_object_keys(patch) k),'entityRevision',after_state->'revision','previousRevision',p_expected_revision,'revision',global_revision));
exception when check_violation or not_null_violation or invalid_text_representation or numeric_value_out_of_range then raise exception using errcode='P0001',message='VALIDATION_ERROR';
when unique_violation then raise exception using errcode='P0001',message='CONFLICT';
end $$;
revoke all on function public.update_business_config(integer,jsonb,uuid) from public,anon,service_role;
grant execute on function public.update_business_config(integer,jsonb,uuid) to authenticated;
create or replace function public.read_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
  with clock as (select statement_timestamp() server_now),
  price_list as (
    select p.item_id,jsonb_agg(jsonb_build_object('mode',p.mode,'priceCents',p.price_cents,'revision',p.revision) order by p.mode) prices,
      max(p.price_cents) max_price
    from public.catalog_prices p where p.deleted_at is null and p.verified and p.mode in ('delivery','pickup') group by p.item_id
  ), choice_list as (
    select ch.group_id,jsonb_agg(jsonb_build_object('id',ch.id,'label',ch.label,'extraPriceCents',ch.extra_price_cents,'revision',ch.revision) order by ch.sort_order,ch.id) choices,
      count(*) choice_count
    from public.option_choices ch where ch.deleted_at is null and ch.available and ch.verified group by ch.group_id
  ), group_list as (
    select g.item_id,jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'minChoices',g.min_choices,'maxChoices',g.max_choices,
      'revision',g.revision,'choices',ch.choices) order by g.sort_order,g.id) groups
    from public.option_groups g join choice_list ch on ch.group_id=g.id
    where g.deleted_at is null and g.active and g.verified and ch.choice_count>=g.min_choices group by g.item_id
  ), visible_items as (
    select i.id,i.category_id,i.sort_order,jsonb_build_object('id',i.id,'categoryId',i.category_id,'slug',i.slug,'name',i.name,
      'kind',i.kind,'portionLabel',i.portion_label,'inclusions',i.inclusions,'description',i.description,'imagePath',i.image_path,
      'availability',i.availability,'revision',i.revision,'prices',price.prices,'optionGroups',coalesce(g.groups,'[]'::jsonb),
      'promotion',case when i.kind='promotion' then jsonb_build_object('startsAt',p.starts_at,'endsAt',p.ends_at,'weekdays',p.weekdays,
        'previousPriceCents',case when p.comparison_verified and p.previous_price_cents>price.max_price then p.previous_price_cents else null end) else null end) item
    from public.catalog_items i join public.categories c on c.id=i.category_id join price_list price on price.item_id=i.id
      cross join clock left join public.promotions p on p.item_id=i.id left join group_list g on g.item_id=i.id
    where i.deleted_at is null and i.online_enabled and i.publication_status='published' and c.deleted_at is null and c.active
      and (i.kind='regular' or (p.deleted_at is null and p.enabled
        and (p.starts_at is null or clock.server_now>=p.starts_at) and (p.ends_at is null or clock.server_now<p.ends_at)
        and (p.weekdays is null or extract(isodow from clock.server_now at time zone 'America/Lima')=any(p.weekdays))))
      and not exists(select 1 from public.option_groups required where required.item_id=i.id and required.deleted_at is null and required.active and required.min_choices>0
        and (not required.verified or required.min_choices>coalesce((select choice_count from choice_list where group_id=required.id),0)))
  )
  select jsonb_build_object('serverNow',clock.server_now,
    'configuration',jsonb_build_object('revision',b.revision,'displayName',b.display_name,'whatsappE164',b.whatsapp_e164,'timezone',b.timezone,
      'orderingEnabled',b.ordering_enabled,'loyaltyEnabled',b.loyalty_enabled,
      'locationVerified',b.location_verified,'address',case when b.location_verified then b.address else null end,
      'mapsUrl',case when b.location_verified then b.maps_url else null end,
      'scheduleConfirmed',b.schedule_confirmed,'openingPeriods',case when b.schedule_confirmed then b.opening_periods else '[]'::jsonb end,
      'pickupChargesVerified',b.pickup_charges_verified,'pickupExtraCents',case when b.pickup_charges_verified then b.pickup_extra_cents else null end,
      'paymentMethods',checkout.data->'paymentMethods','deliveryZones',checkout.data->'deliveryZones','paymentsReady',checkout.data->'paymentsReady','deliveryZonesReady',checkout.data->'deliveryZonesReady'),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name,'revision',c.revision) order by c.sort_order,c.id)
      from public.categories c where exists(select 1 from visible_items i where i.category_id=c.id)),'[]'::jsonb),
    'items',coalesce((select jsonb_agg(i.item order by c.sort_order,i.sort_order,i.id) from visible_items i join public.categories c on c.id=i.category_id),'[]'::jsonb))
  from public.business_settings b cross join clock cross join (select app_private.checkout_public() data) checkout where b.id=1;
$$;

reset role;
revoke create on schema public from app_owner;
commit;
