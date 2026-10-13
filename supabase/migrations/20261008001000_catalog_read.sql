begin;
grant create on schema public to app_owner;
set local role app_owner;

create function app_private.catalog_row_change() returns trigger
language plpgsql set search_path='' as $$
declare safe_patch jsonb := '{}'::jsonb; parent_deleted boolean := false;
begin
  if new is not distinct from old then return new; end if;
  if old.deleted_at is not null and new.deleted_at is null then
    if tg_table_name='catalog_items' then
      select deleted_at is not null into parent_deleted from public.categories where id=new.category_id;
    elsif tg_table_name in ('catalog_prices','promotions','option_groups') then
      select i.deleted_at is not null or c.deleted_at is not null into parent_deleted
        from public.catalog_items i join public.categories c on c.id=i.category_id where i.id=new.item_id;
    elsif tg_table_name='option_choices' then
      select g.deleted_at is not null or i.deleted_at is not null or c.deleted_at is not null into parent_deleted
        from public.option_groups g join public.catalog_items i on i.id=g.item_id join public.categories c on c.id=i.category_id where g.id=new.group_id;
    end if;
    if parent_deleted then raise exception using errcode='P0001',message='CONFLICT'; end if;
    if tg_table_name='categories' then safe_patch:='{"active":false}';
    elsif tg_table_name='catalog_items' then safe_patch:='{"online_enabled":false,"publication_status":"draft"}';
    elsif tg_table_name='catalog_prices' then safe_patch:='{"verified":false}';
    elsif tg_table_name='promotions' then safe_patch:='{"enabled":false,"comparison_verified":false}';
    elsif tg_table_name='option_groups' then safe_patch:='{"active":false,"verified":false}';
    elsif tg_table_name='option_choices' then safe_patch:='{"available":false,"verified":false}'; end if;
    new := jsonb_populate_record(new,safe_patch);
  end if;
  if tg_table_name='catalog_items' then
    if new.source_ref is distinct from old.source_ref or new.id<>old.id then raise exception using errcode='P0001',message='CONFLICT'; end if;
    if new.deleted_at is null and new.publication_status='published' and old.publication_status<>'published'
      and not exists(select 1 from public.categories where id=new.category_id and active and deleted_at is null) then
      raise exception using errcode='P0001',message='CONFIG_NOT_READY';
    end if;
  end if;
  new.revision:=old.revision+1;
  new.updated_at:=now();
  return new;
end $$;

create function app_private.catalog_publication_guard() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.deleted_at is not null or new.publication_status<>'published' then return new; end if;
  if tg_op='UPDATE' then
    if old.publication_status='published' then return new; end if;
  end if;
  if not exists(select 1 from public.categories where id=new.category_id and active and deleted_at is null) then
    raise exception using errcode='P0001',message='CONFIG_NOT_READY';
  end if;
  return new;
end $$;
create trigger catalog_publish before insert or update on public.catalog_items
  for each row execute function app_private.catalog_publication_guard();

create function app_private.catalog_content_change() returns trigger
language plpgsql set search_path='' as $$
begin
  -- Una comparación anterior deja de ser válida si cambia el producto comparable.
  if (new.name,new.kind,new.portion_label,new.inclusions,new.description,new.category_id) is distinct from
    (old.name,old.kind,old.portion_label,old.inclusions,old.description,old.category_id) then
    update public.promotions set comparison_verified=false where item_id=new.id and comparison_verified;
  end if;
  return new;
end $$;
create trigger catalog_comparison_content after update on public.catalog_items
  for each row execute function app_private.catalog_content_change();

create function app_private.catalog_parent_change() returns trigger
language plpgsql set search_path='' as $$
declare parent_id uuid;
begin
  if tg_op='UPDATE' and new is not distinct from old then return new; end if;
  if tg_table_name='option_choices' then
    if tg_op='UPDATE' and new.group_id<>old.group_id then raise exception using errcode='P0001',message='CONFLICT'; end if;
    update public.option_groups set revision=revision+1 where id=new.group_id;
    return new;
  end if;
  if tg_op='UPDATE' and new.item_id<>old.item_id then raise exception using errcode='P0001',message='CONFLICT'; end if;
  parent_id:=new.item_id;
  update public.catalog_items set revision=revision+1 where id=parent_id;
  if tg_table_name in ('catalog_prices','option_groups') then
    update public.promotions set comparison_verified=false where item_id=parent_id and comparison_verified;
  end if;
  return new;
end $$;

create function app_private.catalog_integrity_guard() returns trigger
language plpgsql set search_path='' as $$
begin
  if exists(select 1 from public.promotions p join public.catalog_items i on i.id=p.item_id where i.kind<>'promotion')
    or exists(select 1 from public.catalog_prices p join public.catalog_items i on i.id=p.item_id
      where (i.source_ref='P05' and p.mode='pickup') or (i.source_ref='C01' and p.mode<>'dine_in')) then
    raise exception using errcode='P0001',message='VALIDATION_ERROR';
  end if;
  if exists(select 1 from public.catalog_items i join public.categories c on c.id=i.category_id
    where i.publication_status='published' and i.deleted_at is null and c.deleted_at is null and c.active and (
      not i.online_enabled or not exists(select 1 from public.catalog_prices p where p.item_id=i.id and p.mode in ('delivery','pickup') and p.verified and p.deleted_at is null)
      or (i.kind='promotion' and not exists(select 1 from public.promotions p where p.item_id=i.id and p.deleted_at is null))
      or exists(select 1 from public.option_groups g where g.item_id=i.id and g.active and g.deleted_at is null and g.min_choices>0
        and (not g.verified or g.min_choices>(select count(*) from public.option_choices ch where ch.group_id=g.id and ch.available and ch.verified and ch.deleted_at is null)))
    )) then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  if exists(select 1 from public.promotions p join public.catalog_prices price on price.item_id=p.item_id
    where p.comparison_verified and p.deleted_at is null and price.verified and price.deleted_at is null
      and price.mode in ('delivery','pickup') and p.previous_price_cents<=price.price_cents) then
    raise exception using errcode='P0001',message='VALIDATION_ERROR';
  end if;
  return null;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['categories','catalog_items','catalog_prices','promotions','option_groups','option_choices'] loop
    execute format('create trigger catalog_revision before update on public.%I for each row execute function app_private.catalog_row_change()',table_name);
    execute format('create constraint trigger catalog_integrity after insert or update on public.%I deferrable initially deferred for each row execute function app_private.catalog_integrity_guard()',table_name);
  end loop;
  foreach table_name in array array['catalog_prices','promotions','option_groups','option_choices'] loop
    execute format('create trigger catalog_parent_revision after insert or update on public.%I for each row execute function app_private.catalog_parent_change()',table_name);
  end loop;
end $$;

create function public.read_catalog() returns jsonb
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
      'paymentMethods','[]'::jsonb,'deliveryZones','[]'::jsonb,'paymentsReady',false,'deliveryZonesReady',false),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name,'revision',c.revision) order by c.sort_order,c.id)
      from public.categories c where exists(select 1 from visible_items i where i.category_id=c.id)),'[]'::jsonb),
    'items',coalesce((select jsonb_agg(i.item order by c.sort_order,i.sort_order,i.id) from visible_items i join public.categories c on c.id=i.category_id),'[]'::jsonb))
  from public.business_settings b cross join clock where b.id=1;
$$;
revoke all on function public.read_catalog() from public,anon,authenticated,service_role;
grant execute on function public.read_catalog() to anon,authenticated;

reset role;
revoke create on schema public from app_owner;
commit;
