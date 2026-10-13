begin;
grant create on schema public to app_owner;
set local role app_owner;

create function app_private.operation_hash(payload jsonb) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(payload::text,'UTF8')),'hex');
$$;

create function app_private.operation_replay(kind text, fingerprint text, operation uuid) returns jsonb
language plpgsql set search_path = '' as $$
declare receipt app_private.operation_receipts;
begin
  if operation is null then raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
  perform pg_advisory_xact_lock(hashtextextended(app_private.actor_user_id()::text || ':' || operation::text,0));
  perform app_private.require_staff('manager');
  select * into receipt from app_private.operation_receipts where actor_user_id=app_private.actor_user_id() and operation_id=operation;
  if not found then return null; end if;
  if receipt.operation_kind <> kind or receipt.request_hash <> fingerprint then
    raise exception using errcode='P0001', message='IDEMPOTENCY_CONFLICT'; end if;
  return receipt.outcome || jsonb_build_object('replayed',true);
end; $$;

create function app_private.commit_staff_operation(
  actor uuid, kind text, fingerprint text, operation uuid, entity text,
  target text, new_revision integer, changes jsonb, justification text default null
) returns jsonb language plpgsql set search_path = '' as $$
declare result jsonb;
begin
  result := jsonb_build_object('operationId',operation,'replayed',false,'outcome','applied',
    'entityType',entity,'entityId',target,'revision',new_revision);
  if changes is not null then
    insert into app_private.audit_entries(actor_staff_id,actor_user_id,action,entity_type,entity_id,changed_fields,reason,operation_id)
      values(actor,app_private.actor_user_id(),kind,entity,target,changes,justification,operation);
  end if;
  insert into app_private.operation_receipts(actor_user_id,operation_id,operation_kind,request_hash,outcome)
    values(app_private.actor_user_id(),operation,kind,fingerprint,result);
  return result;
end; $$;

create function app_private.normalize_config_patch(patch jsonb) returns jsonb
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
  -- H2 no puede activar funcionalidades todavía no construidas.
  if normalized->'orderingEnabled' = 'true'::jsonb or normalized->'loyaltyEnabled' = 'true'::jsonb then
    raise exception using errcode='P0001', message='CONFIG_NOT_READY'; end if;
  return normalized;
end; $$;

create function public.update_business_config(p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path = '' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; current_row public.business_settings;
  patch jsonb; fingerprint text; replay jsonb; before_state jsonb; after_state jsonb; changed jsonb;
begin
  actor := app_private.require_staff('manager');
  if p_expected_revision is null or p_expected_revision < 1 then raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
  patch := app_private.normalize_config_patch(p_patch);
  fingerprint := app_private.operation_hash(jsonb_build_object('kind','update_business_config','revision',p_expected_revision,'patch',patch));
  replay := app_private.operation_replay('update_business_config',fingerprint,p_operation_id);
  if replay is not null then return replay; end if;
  select * into current_row from public.business_settings where id=1 for update;
  if not found then raise exception using errcode='P0001', message='CONFIG_NOT_READY'; end if;
  if current_row.revision <> p_expected_revision then
    raise exception using errcode='P0001', message='CONFLICT', detail=jsonb_build_object('entity','business_config','revision',current_row.revision)::text; end if;
  before_state := app_private.config_projection();
  update public.business_settings set
    display_name=case when patch ? 'displayName' then patch->>'displayName' else display_name end,
    whatsapp_e164=case when patch ? 'whatsappE164' then patch->>'whatsappE164' else whatsapp_e164 end,
    timezone=case when patch ? 'timezone' then patch->>'timezone' else timezone end,
    address=case when patch ? 'address' then patch->>'address' else address end,
    maps_url=case when patch ? 'mapsUrl' then patch->>'mapsUrl' else maps_url end,
    location_verified=case when patch ? 'locationVerified' then (patch->>'locationVerified')::boolean else location_verified end,
    schedule_confirmed=case when patch ? 'scheduleConfirmed' then (patch->>'scheduleConfirmed')::boolean else schedule_confirmed end,
    opening_periods=case when patch ? 'openingPeriods' then patch->'openingPeriods' else opening_periods end,
    pickup_extra_cents=case when patch ? 'pickupExtraCents' then (patch->>'pickupExtraCents')::integer else pickup_extra_cents end,
    pickup_charges_verified=case when patch ? 'pickupChargesVerified' then (patch->>'pickupChargesVerified')::boolean else pickup_charges_verified end,
    ordering_enabled=case when patch ? 'orderingEnabled' then (patch->>'orderingEnabled')::boolean else ordering_enabled end,
    loyalty_enabled=case when patch ? 'loyaltyEnabled' then (patch->>'loyaltyEnabled')::boolean else loyalty_enabled end
  where id=1;
  after_state := app_private.config_projection();
  if before_state = after_state then
    return app_private.commit_staff_operation(actor.id,'update_business_config',fingerprint,p_operation_id,'business_config','1',current_row.revision,null); end if;
  select jsonb_agg(key order by key) into changed from jsonb_each(after_state) where before_state->key is distinct from value;
  update public.business_settings set revision=revision+1,updated_at=now() where id=1 returning * into current_row;
  return app_private.commit_staff_operation(actor.id,'update_business_config',fingerprint,p_operation_id,'business_config','1',current_row.revision,
    jsonb_build_object('fields',changed,'previousRevision',p_expected_revision,'revision',current_row.revision));
exception when check_violation or not_null_violation or invalid_text_representation or numeric_value_out_of_range then
  raise exception using errcode='P0001', message='VALIDATION_ERROR';
end; $$;

create function public.update_staff_access(p_staff_id uuid,p_expected_revision integer,p_patch jsonb,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path = '' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; target app_private.staff_accounts;
  fingerprint text; replay jsonb; proposed_role text; proposed_active boolean; fields jsonb;
begin
  actor := app_private.require_staff('manager');
  if p_staff_id is null or p_expected_revision is null or p_expected_revision < 1 or p_patch is null or
    jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb or
    exists(select 1 from jsonb_object_keys(p_patch) key where key not in ('role','active')) or
    (p_patch ? 'role' and (jsonb_typeof(p_patch->'role') <> 'string' or p_patch->>'role' not in ('manager','attendant'))) or
    (p_patch ? 'active' and jsonb_typeof(p_patch->'active') <> 'boolean') then
    raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
  fingerprint := app_private.operation_hash(jsonb_build_object('kind','update_staff_access','staffId',p_staff_id,'revision',p_expected_revision,'patch',p_patch));
  replay := app_private.operation_replay('update_staff_access',fingerprint,p_operation_id);
  if replay is not null then return replay; end if;
  perform pg_advisory_xact_lock(hashtextextended('fyb:staff-administration',0));
  actor := app_private.require_staff('manager');
  select * into target from app_private.staff_accounts where id=p_staff_id for update;
  if not found then raise exception using errcode='P0001', message='NOT_FOUND'; end if;
  if target.revision <> p_expected_revision or target.deleted_at is not null then
    raise exception using errcode='P0001', message='CONFLICT', detail=jsonb_build_object('entity','staff_account','id',target.id,'revision',target.revision)::text; end if;
  proposed_role := coalesce(p_patch->>'role',target.role);
  proposed_active := case when p_patch ? 'active' then (p_patch->>'active')::boolean else target.active end;
  if target.active and target.role='manager' and (not proposed_active or proposed_role <> 'manager') and
    not exists(select 1 from app_private.staff_accounts where active and deleted_at is null and role='manager' and id <> target.id) then
    raise exception using errcode='P0001', message='CONFLICT', detail=jsonb_build_object('entity','staff_account','id',target.id,'revision',target.revision)::text; end if;
  if proposed_role=target.role and proposed_active=target.active then
    return app_private.commit_staff_operation(actor.id,'update_staff_access',fingerprint,p_operation_id,'staff_account',target.id::text,target.revision,null); end if;
  fields := jsonb_build_object('roleChanged',proposed_role<>target.role,'activeChanged',proposed_active<>target.active,
    'previousRevision',target.revision,'revision',target.revision+1);
  update app_private.staff_accounts set role=proposed_role,active=proposed_active,revision=revision+1,updated_at=now() where id=target.id returning * into target;
  return app_private.commit_staff_operation(actor.id,'update_staff_access',fingerprint,p_operation_id,'staff_account',target.id::text,target.revision,fields);
end; $$;

create function app_private.conserve_staff(
  entity_type text, entity_id uuid, expected_revision integer, reason text, operation_id uuid, restoring boolean
) returns jsonb language plpgsql set search_path = '' as $$
declare actor app_private.staff_accounts; target app_private.staff_accounts;
  kind text; fingerprint text; replay jsonb; justification text;
begin
  actor := app_private.require_staff('manager');
  justification := btrim(reason);
  if entity_type <> 'staff_account' or entity_type is null or entity_id is null or expected_revision is null or expected_revision < 1 or
    justification is null or char_length(justification) not between 10 and 500 then
    raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
  kind := case when restoring then 'restore_entity' else 'soft_delete_entity' end;
  fingerprint := app_private.operation_hash(jsonb_build_object('kind',kind,'entityType',entity_type,'entityId',entity_id,'revision',expected_revision,'reason',justification));
  replay := app_private.operation_replay(kind,fingerprint,operation_id);
  if replay is not null then return replay; end if;
  perform pg_advisory_xact_lock(hashtextextended('fyb:staff-administration',0));
  actor := app_private.require_staff('manager');
  select * into target from app_private.staff_accounts where id=entity_id for update;
  if not found then raise exception using errcode='P0001', message='NOT_FOUND'; end if;
  if target.revision <> expected_revision or restoring <> (target.deleted_at is not null) then
    raise exception using errcode='P0001', message='CONFLICT', detail=jsonb_build_object('entity','staff_account','id',target.id,'revision',target.revision)::text; end if;
  if not restoring and target.active and target.role='manager' and
    not exists(select 1 from app_private.staff_accounts where active and deleted_at is null and role='manager' and id <> target.id) then
    raise exception using errcode='P0001', message='CONFLICT', detail=jsonb_build_object('entity','staff_account','id',target.id,'revision',target.revision)::text; end if;
  update app_private.staff_accounts set active=false, revision=revision+1,updated_at=now(),
    deleted_at=case when restoring then null else now() end,
    deleted_by=case when restoring then null else actor.id end,
    delete_reason=case when restoring then null else justification end
  where id=target.id returning * into target;
  return app_private.commit_staff_operation(actor.id,kind,fingerprint,operation_id,'staff_account',target.id::text,target.revision,
    jsonb_build_object('conservation',case when restoring then 'restored_inactive' else 'deleted' end,'previousRevision',expected_revision,'revision',target.revision),justification);
end; $$;

create function public.soft_delete_entity(p_entity_type text,p_entity_id uuid,p_expected_revision integer,p_reason text,p_operation_id uuid)
returns jsonb language sql security definer set search_path = '' set statement_timeout='5s' set lock_timeout='2s' as $$
  select app_private.conserve_staff(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,false);
$$;
create function public.restore_entity(p_entity_type text,p_entity_id uuid,p_expected_revision integer,p_reason text,p_operation_id uuid)
returns jsonb language sql security definer set search_path = '' set statement_timeout='5s' set lock_timeout='2s' as $$
  select app_private.conserve_staff(p_entity_type,p_entity_id,p_expected_revision,p_reason,p_operation_id,true);
$$;

create function public.get_operation(p_operation_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare receipt app_private.operation_receipts; current_state jsonb;
begin
  perform app_private.require_staff('manager');
  if p_operation_id is null then raise exception using errcode='P0001', message='VALIDATION_ERROR'; end if;
  select * into receipt from app_private.operation_receipts where actor_user_id=app_private.actor_user_id() and operation_id=p_operation_id;
  if not found then return jsonb_build_object('status','not_found','operationId',p_operation_id); end if;
  if receipt.outcome->>'entityType'='business_config' then
    current_state := jsonb_build_object('entity','business_config','revision',(select revision from public.business_settings where id=1));
  else
    select jsonb_build_object('entity','staff_account','id',id,'revision',revision,'active',active,'deleted',deleted_at is not null)
      into current_state from app_private.staff_accounts where id=(receipt.outcome->>'entityId')::uuid;
  end if;
  return jsonb_build_object('status','recorded','operationId',p_operation_id,'operationKind',receipt.operation_kind,
    'result',receipt.outcome,'currentState',current_state);
end; $$;

revoke all on function public.update_business_config(integer,jsonb,uuid),public.update_staff_access(uuid,integer,jsonb,uuid),
  public.soft_delete_entity(text,uuid,integer,text,uuid),public.restore_entity(text,uuid,integer,text,uuid),public.get_operation(uuid)
  from public,anon,service_role;
grant execute on function public.update_business_config(integer,jsonb,uuid),public.update_staff_access(uuid,integer,jsonb,uuid),
  public.soft_delete_entity(text,uuid,integer,text,uuid),public.restore_entity(text,uuid,integer,text,uuid),public.get_operation(uuid)
  to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
