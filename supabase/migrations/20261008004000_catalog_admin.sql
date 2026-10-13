begin;
grant create on schema public to app_owner;
set local role app_owner;

alter table app_private.operation_receipts drop constraint operation_receipts_operation_kind_check;
alter table app_private.operation_receipts add constraint operation_receipts_operation_kind_check check(operation_kind in
  ('update_business_config','update_staff_access','soft_delete_entity','restore_entity','create_catalog_entity','update_category','update_catalog_item','update_catalog_price','update_promotion','update_option_group','update_option_choice','prepare_catalog_image_cleanup'));
alter table app_private.audit_entries drop constraint audit_entries_entity_type_check;
alter table app_private.audit_entries add constraint audit_entries_entity_type_check check(entity_type in
  ('staff_account','business_config','category','catalog_item','catalog_price','promotion','option_group','option_choice','catalog_image'));

alter table public.catalog_items add column content_verified boolean not null default false;
-- Único contenido online ya confirmado por el propietario en H3.
update public.catalog_items set content_verified=true where source_ref='P05' and publication_status='published';

create function app_private.catalog_entity_table(entity text) returns regclass
language plpgsql immutable set search_path='' as $$
begin
  case entity
    when 'category' then return 'public.categories'::regclass;
    when 'catalog_item' then return 'public.catalog_items'::regclass;
    when 'catalog_price' then return 'public.catalog_prices'::regclass;
    when 'promotion' then return 'public.promotions'::regclass;
    when 'option_group' then return 'public.option_groups'::regclass;
    when 'option_choice' then return 'public.option_choices'::regclass;
    else raise exception using errcode='P0001',message='VALIDATION_ERROR';
  end case;
end $$;

create function app_private.catalog_patch(entity text, patch jsonb, creating boolean) returns jsonb
language plpgsql immutable set search_path='' as $$
declare allowed text[]; required text[]; entry record; result jsonb:='{}'; typ text;
begin
  case entity
    when 'category' then allowed:=array['slug','name','sort_order','active']; required:=array['slug','name'];
    when 'catalog_item' then allowed:=array['slug','name','kind','portion_label','inclusions','description','image_path','online_enabled','publication_status','availability','sort_order','content_verified']; required:=array['category_id','slug','name','kind'];
    when 'catalog_price' then allowed:=array['price_cents','verified']; required:=array['item_id','mode','price_cents'];
    when 'promotion' then allowed:=array['enabled','starts_at','ends_at','weekdays','previous_price_cents','comparison_verified']; required:=array[]::text[];
    when 'option_group' then allowed:=array['name','min_choices','max_choices','active','verified','sort_order']; required:=array['item_id','name'];
    when 'option_choice' then allowed:=array['label','extra_price_cents','available','verified','sort_order']; required:=array['group_id','label'];
    else raise exception using errcode='P0001',message='VALIDATION_ERROR';
  end case;
  if patch is null or jsonb_typeof(patch)<>'object' or patch='{}'::jsonb or octet_length(patch::text)>16384 then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  if creating and not patch ?& required then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  for entry in select key,value from jsonb_each(patch) loop
    if not (entry.key=any(allowed) or (creating and entry.key=any(required))) then
      raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
    typ:=jsonb_typeof(entry.value);
    if entry.key in ('active','online_enabled','content_verified','verified','enabled','comparison_verified','available') then
      if typ<>'boolean' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
    elsif entry.key in ('sort_order','min_choices','max_choices','price_cents','extra_price_cents','previous_price_cents') then
      if not (entry.key='previous_price_cents' and typ='null') and (typ<>'number' or entry.value::text !~ '^[0-9]+$' or (entry.value::text)::numeric>2147483647) then
        raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
    elsif entry.key in ('inclusions','weekdays') then
      if not (entry.key='weekdays' and typ='null') and typ<>'array' then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
      if entry.key='inclusions' and exists(select 1 from jsonb_array_elements(entry.value) value where jsonb_typeof(value)<>'string' or value#>>'{}'<>btrim(value#>>'{}')) then
        raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
      if entry.key='weekdays' and typ='array' and exists(select 1 from jsonb_array_elements(entry.value) value where jsonb_typeof(value)<>'number' or value::text !~ '^[1-7]$') then
        raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
    else
      if not (entry.key in ('portion_label','description','image_path','starts_at','ends_at') and typ='null') and typ<>'string' then
        raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
      if typ='string' then entry.value:=to_jsonb(btrim(entry.value#>>'{}')); end if;
    end if;
    result:=result||jsonb_build_object(entry.key,entry.value);
  end loop;
  return result;
end $$;

-- Todos los escritores comerciales toman configuración primero. H4 serializa
-- este catálogo pequeño, evitando inversiones de locks entre descendientes.
create function app_private.lock_catalog_entity(entity text, target uuid, patch jsonb default null) returns jsonb
language plpgsql set search_path='' as $$
declare tbl regclass; column_name text; current_row jsonb; category uuid; item uuid; grp uuid;
begin
  tbl:=app_private.catalog_entity_table(entity);
  column_name:=case when entity='promotion' then 'item_id' else 'id' end;
  perform 1 from public.business_settings where id=1 for update;
  if not found then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  execute format('select to_jsonb(t) from %s t where %I=$1',tbl,column_name) into current_row using target;
  if entity='category' then category:=target;
  elsif entity='catalog_item' then item:=target; category:=coalesce((current_row->>'category_id')::uuid,(patch->>'category_id')::uuid);
  elsif entity='option_choice' then grp:=coalesce((current_row->>'group_id')::uuid,(patch->>'group_id')::uuid); select item_id into item from public.option_groups where id=grp;
  else item:=case when entity='promotion' then target else coalesce((current_row->>'item_id')::uuid,(patch->>'item_id')::uuid) end;
  end if;
  if category is null and item is not null then select category_id into category from public.catalog_items where id=item; end if;
  perform 1 from public.categories where id=category for update;
  perform 1 from public.catalog_items where id=item for update;
  perform 1 from public.catalog_prices where item_id=item order by id for update;
  perform 1 from public.promotions where item_id=item for update;
  perform 1 from public.option_groups where item_id=item order by id for update;
  perform 1 from public.option_choices where group_id in(select id from public.option_groups where item_id=item) order by id for update;
  execute format('select to_jsonb(t) from %s t where %I=$1 for update',tbl,column_name) into current_row using target;
  return current_row;
end $$;

create function app_private.catalog_parent_live(entity text, value jsonb) returns boolean
language sql stable set search_path='' as $$
  select case entity
    when 'category' then true
    when 'catalog_item' then exists(select 1 from public.categories where id=(value->>'category_id')::uuid and deleted_at is null)
    when 'option_choice' then exists(select 1 from public.option_groups g join public.catalog_items i on i.id=g.item_id join public.categories c on c.id=i.category_id where g.id=(value->>'group_id')::uuid and g.deleted_at is null and i.deleted_at is null and c.deleted_at is null)
    else exists(select 1 from public.catalog_items i join public.categories c on c.id=i.category_id where i.id=(value->>'item_id')::uuid and i.deleted_at is null and c.deleted_at is null)
  end;
$$;

create function app_private.catalog_content_verification() returns trigger
language plpgsql set search_path='' as $$
begin
  if (new.name,new.kind,new.portion_label,new.inclusions,new.description,new.category_id) is distinct from
    (old.name,old.kind,old.portion_label,old.inclusions,old.description,old.category_id) then new.content_verified:=false; end if;
  if old.deleted_at is not null and new.deleted_at is null then new.content_verified:=false; end if;
  return new;
end $$;
create trigger catalog_content_verified before update on public.catalog_items for each row execute function app_private.catalog_content_verification();
create function app_private.catalog_verified_guard() returns trigger
language plpgsql set search_path='' as $$
begin
  if exists(select 1 from public.catalog_items i join public.categories c on c.id=i.category_id
    where i.deleted_at is null and c.deleted_at is null and c.active and i.publication_status='published'
      and (not i.content_verified or i.portion_label is null)) then
    raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  return null;
end $$;
create constraint trigger catalog_content_complete after insert or update on public.catalog_items
  deferrable initially deferred for each row execute function app_private.catalog_verified_guard();
create constraint trigger catalog_category_content_complete after insert or update on public.categories
  deferrable initially deferred for each row execute function app_private.catalog_verified_guard();

create function app_private.mutate_catalog(entity text, target uuid, expected integer, input jsonb, operation uuid, creating boolean default false)
returns jsonb language plpgsql set search_path='' as $$
declare actor app_private.staff_accounts; tbl regclass; column_name text; patch jsonb; before_state jsonb; after_state jsonb;
  kind text; fingerprint text; replay jsonb; columns_sql text; values_sql text; changed jsonb;
begin
  actor:=app_private.require_staff('manager');
  if target is null or expected is null or expected<>0 and creating or expected<1 and not creating then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  patch:=app_private.catalog_patch(entity,input,creating);
  kind:=case when creating then 'create_catalog_entity' else 'update_'||entity end;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind',kind,'entityType',entity,'entityId',target,'revision',expected,'patch',patch));
  replay:=app_private.operation_replay(kind,fingerprint,operation);
  if replay is not null then return replay; end if;
  before_state:=app_private.lock_catalog_entity(entity,target,patch);
  if creating and before_state is not null then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if not creating and before_state is null then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if not creating and ((before_state->>'revision')::integer<>expected or before_state->>'deleted_at' is not null) then
    raise exception using errcode='P0001',message='CONFLICT',detail=jsonb_build_object('entity',entity,'id',target,'revision',before_state->'revision')::text; end if;
  if not app_private.catalog_parent_live(entity,coalesce(before_state,patch)||case when entity='promotion' then jsonb_build_object('item_id',target) else '{}'::jsonb end) then
    raise exception using errcode='P0001',message='CONFLICT'; end if;
  tbl:=app_private.catalog_entity_table(entity);
  column_name:=case when entity='promotion' then 'item_id' else 'id' end;
  if not creating and not exists(select 1 from jsonb_each(patch) where before_state->key is distinct from value) then
    return app_private.commit_staff_operation(actor.id,kind,fingerprint,operation,entity,target::text,expected,null); end if;
  if not creating and entity in ('catalog_price','option_group','option_choice') and not patch ? 'verified' and exists(
    select 1 from jsonb_each(patch) where key in ('price_cents','name','min_choices','max_choices','label','extra_price_cents') and before_state->key is distinct from value
  ) then patch:=patch||'{"verified":false}'::jsonb; end if;
  select string_agg(format('%I',key),',' order by key),string_agg(format('x.%I',key),',' order by key)
    into columns_sql,values_sql from jsonb_object_keys(patch) key;
  if creating then
    execute format('insert into %s (%I,%s) select $2,%s from jsonb_populate_record(null::%s,$1) x',tbl,column_name,columns_sql,values_sql,tbl) using patch,target;
  else
    execute format('update %s set (%s)=(select %s from jsonb_populate_record(null::%s,$1) x) where %I=$2',tbl,columns_sql,values_sql,tbl,column_name) using patch,target;
  end if;
  -- Confirmación expresa después de que el trigger invalide contenido editado.
  if entity='catalog_item' and patch->'content_verified'='true'::jsonb then
    update public.catalog_items set content_verified=true where id=target and not content_verified;
  end if;
  set constraints all immediate;
  execute format('select to_jsonb(t) from %s t where %I=$1',tbl,column_name) into after_state using target;
  -- Fechas con distinto formato pueden representar el mismo instante.
  if not creating and after_state=before_state then
    return app_private.commit_staff_operation(actor.id,kind,fingerprint,operation,entity,target::text,expected,null); end if;
  select jsonb_agg(key order by key) into changed from jsonb_each(after_state)
    where key not in ('created_at','updated_at','revision') and before_state->key is distinct from value;
  return app_private.commit_staff_operation(actor.id,kind,fingerprint,operation,entity,target::text,(after_state->>'revision')::integer,
    jsonb_build_object('fields',changed,'previousRevision',expected,'revision',after_state->'revision'));
exception when check_violation or not_null_violation or invalid_text_representation or numeric_value_out_of_range or datetime_field_overflow then
  raise exception using errcode='P0001',message='VALIDATION_ERROR';
when unique_violation or foreign_key_violation then raise exception using errcode='P0001',message='CONFLICT';
end $$;

create function public.update_catalog_item(p_item_id uuid,p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
  select app_private.mutate_catalog('catalog_item',p_item_id,p_expected_revision,p_patch,p_operation_id);
$$;
create function public.update_catalog_category(p_entity_id uuid,p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$ select app_private.mutate_catalog('category',p_entity_id,p_expected_revision,p_patch,p_operation_id); $$;
create function public.update_catalog_price(p_entity_id uuid,p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$ select app_private.mutate_catalog('catalog_price',p_entity_id,p_expected_revision,p_patch,p_operation_id); $$;
create function public.update_catalog_promotion(p_entity_id uuid,p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$ select app_private.mutate_catalog('promotion',p_entity_id,p_expected_revision,p_patch,p_operation_id); $$;
create function public.update_catalog_option_group(p_entity_id uuid,p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$ select app_private.mutate_catalog('option_group',p_entity_id,p_expected_revision,p_patch,p_operation_id); $$;
create function public.update_catalog_option_choice(p_entity_id uuid,p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$ select app_private.mutate_catalog('option_choice',p_entity_id,p_expected_revision,p_patch,p_operation_id); $$;
create function public.create_catalog_entity(p_entity_type text,p_entity_id uuid,p_patch jsonb,p_operation_id uuid)
returns jsonb language sql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$ select app_private.mutate_catalog(p_entity_type,p_entity_id,0,p_patch,p_operation_id,true); $$;

create function app_private.conserve_catalog(entity text,target uuid,expected integer,reason text,operation uuid,restoring boolean)
returns jsonb language plpgsql set search_path='' as $$
declare actor app_private.staff_accounts; tbl regclass; col text; before_state jsonb; after_state jsonb; kind text; fingerprint text; replay jsonb; justification text;
begin
  actor:=app_private.require_staff('manager');
  justification:=btrim(reason);
  if target is null or expected is null or expected<1 or justification is null or char_length(justification) not between 10 and 500 then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  tbl:=app_private.catalog_entity_table(entity); col:=case when entity='promotion' then 'item_id' else 'id' end;
  kind:=case when restoring then 'restore_entity' else 'soft_delete_entity' end;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind',kind,'entityType',entity,'entityId',target,'revision',expected,'reason',justification));
  replay:=app_private.operation_replay(kind,fingerprint,operation);
  if replay is not null then return replay; end if;
  before_state:=app_private.lock_catalog_entity(entity,target);
  if before_state is null then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  if (before_state->>'revision')::integer<>expected or restoring<>(before_state->>'deleted_at' is not null) then
    raise exception using errcode='P0001',message='CONFLICT',detail=jsonb_build_object('entity',entity,'id',target,'revision',before_state->'revision')::text; end if;
  if restoring and not app_private.catalog_parent_live(entity,before_state) then raise exception using errcode='P0001',message='CONFLICT'; end if;
  execute format('update %s set deleted_at=$2,deleted_by=$3,delete_reason=$4 where %I=$1',tbl,col)
    using target,case when restoring then null::timestamptz else now() end,case when restoring then null::uuid else actor.id end,case when restoring then null::text else justification end;
  if restoring and entity='category' then
    update public.catalog_items set publication_status='draft',online_enabled=false,content_verified=false where category_id=target and deleted_at is null;
  end if;
  if restoring and entity='catalog_item' then
    update public.catalog_prices set verified=false where item_id=target and verified;
    update public.promotions set enabled=false,comparison_verified=false where item_id=target and (enabled or comparison_verified);
    update public.option_groups set active=false,verified=false where item_id=target and (active or verified);
    update public.option_choices set available=false,verified=false where group_id in(select id from public.option_groups where item_id=target) and (available or verified);
  end if;
  set constraints all immediate;
  execute format('select to_jsonb(t) from %s t where %I=$1',tbl,col) into after_state using target;
  return app_private.commit_staff_operation(actor.id,kind,fingerprint,operation,entity,target::text,(after_state->>'revision')::integer,
    jsonb_build_object('conservation',case when restoring then 'restored_inactive' else 'deleted' end,'previousRevision',expected,'revision',after_state->'revision','reviewDescendants',restoring and entity in ('category','catalog_item')),justification);
end $$;

create or replace function public.soft_delete_entity(p_entity_type text,p_entity_id uuid,p_expected_revision integer,p_reason text,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
begin
  if p_entity_type='staff_account' then return app_private.conserve_staff(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,false); end if;
  return app_private.conserve_catalog(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,false);
end $$;
create or replace function public.restore_entity(p_entity_type text,p_entity_id uuid,p_expected_revision integer,p_reason text,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
begin
  if p_entity_type='staff_account' then return app_private.conserve_staff(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,true); end if;
  return app_private.conserve_catalog(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,true);
end $$;

create function public.get_admin_catalog(p_include_deleted boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' set statement_timeout='5s' as $$
declare result jsonb;
begin
  perform app_private.require_staff('manager');
  if p_include_deleted is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  select jsonb_build_object('categories',coalesce((select jsonb_agg(to_jsonb(c) order by sort_order,id) from public.categories c where p_include_deleted or deleted_at is null),'[]'),
    'items',coalesce((select jsonb_agg(to_jsonb(i) order by sort_order,id) from public.catalog_items i where p_include_deleted or deleted_at is null),'[]'),
    'prices',coalesce((select jsonb_agg(to_jsonb(p) order by item_id,mode) from public.catalog_prices p where p_include_deleted or deleted_at is null),'[]'),
    'promotions',coalesce((select jsonb_agg(to_jsonb(p) order by item_id) from public.promotions p where p_include_deleted or deleted_at is null),'[]'),
    'groups',coalesce((select jsonb_agg(to_jsonb(g) order by sort_order,id) from public.option_groups g where p_include_deleted or deleted_at is null),'[]'),
    'choices',coalesce((select jsonb_agg(to_jsonb(ch) order by sort_order,id) from public.option_choices ch where p_include_deleted or deleted_at is null),'[]')) into result;
  return result;
end $$;

create or replace function public.get_operation(p_operation_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare receipt app_private.operation_receipts; current_state jsonb; entity text; tbl regclass; col text;
begin
  perform app_private.require_staff('manager');
  if p_operation_id is null then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  select * into receipt from app_private.operation_receipts where actor_user_id=app_private.actor_user_id() and operation_id=p_operation_id;
  if not found then return jsonb_build_object('status','not_found','operationId',p_operation_id); end if;
  entity:=receipt.outcome->>'entityType';
  if entity='business_config' then current_state:=jsonb_build_object('entity',entity,'revision',(select revision from public.business_settings where id=1));
  elsif entity='staff_account' then select jsonb_build_object('entity',entity,'id',id,'revision',revision,'active',active,'deleted',deleted_at is not null) into current_state from app_private.staff_accounts where id=(receipt.outcome->>'entityId')::uuid;
  elsif entity='catalog_image' then current_state:=jsonb_build_object('entity',entity,'revision',1);
  else
    tbl:=app_private.catalog_entity_table(entity); col:=case when entity='promotion' then 'item_id' else 'id' end;
    execute format('select jsonb_build_object(''entity'',$2,''id'',%I,''revision'',revision,''deleted'',deleted_at is not null) from %s where %I=$1',col,tbl,col) into current_state using (receipt.outcome->>'entityId')::uuid,entity;
  end if;
  return jsonb_build_object('status','recorded','operationId',p_operation_id,'operationKind',receipt.operation_kind,'result',receipt.outcome,'currentState',current_state);
end $$;

revoke all on function public.update_catalog_item(uuid,integer,jsonb,uuid),public.update_catalog_category(uuid,integer,jsonb,uuid),public.update_catalog_price(uuid,integer,jsonb,uuid),public.update_catalog_promotion(uuid,integer,jsonb,uuid),public.update_catalog_option_group(uuid,integer,jsonb,uuid),public.update_catalog_option_choice(uuid,integer,jsonb,uuid),public.create_catalog_entity(text,uuid,jsonb,uuid),public.get_admin_catalog(boolean) from public,anon,service_role;
grant execute on function public.update_catalog_item(uuid,integer,jsonb,uuid),public.update_catalog_category(uuid,integer,jsonb,uuid),public.update_catalog_price(uuid,integer,jsonb,uuid),public.update_catalog_promotion(uuid,integer,jsonb,uuid),public.update_catalog_option_group(uuid,integer,jsonb,uuid),public.update_catalog_option_choice(uuid,integer,jsonb,uuid),public.create_catalog_entity(text,uuid,jsonb,uuid),public.get_admin_catalog(boolean) to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
