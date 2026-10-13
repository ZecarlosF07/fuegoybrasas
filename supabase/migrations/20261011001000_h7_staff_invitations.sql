begin;
grant create on schema public to app_owner;

-- Puentes mínimos de Auth administrados por postgres; no grants sobre auth.users.
create function app_private.staff_auth_info(p_user_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('id',id,'email',email,'confirmed',email_confirmed_at is not null,'invitedAt',invited_at)
  from auth.users where id=p_user_id;
$$;
create function app_private.invitation_auth_target(p_email text,p_invitation_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare target auth.users;
begin
  select * into target from auth.users where lower(email)=lower(p_email);
  if not found then return null; end if;
  if target.raw_app_meta_data->>'fybInvitation' is distinct from p_invitation_id::text then
    raise exception using errcode='P0001',message='CONFLICT'; end if;
  return jsonb_build_object('id',target.id,'invitedAt',target.invited_at);
end $$;
revoke all on function app_private.staff_auth_info(uuid),app_private.invitation_auth_target(text,uuid) from public,anon,authenticated,service_role;
grant execute on function app_private.staff_auth_info(uuid),app_private.invitation_auth_target(text,uuid) to app_owner;
set local role app_owner;
alter table app_private.staff_accounts add column invitation_status text not null default 'ready' check(invitation_status in ('pending','sent','ready'));
alter table app_private.staff_accounts add column invitation_send_started_at timestamptz;
alter table app_private.staff_accounts add constraint staff_invitation_inactive check(invitation_status<>'pending' or not active);
alter table app_private.operation_receipts drop constraint operation_receipts_operation_kind_check;
alter table app_private.operation_receipts add constraint operation_receipts_operation_kind_check check(operation_kind in
  ('update_business_config','update_staff_access','soft_delete_entity','restore_entity','create_catalog_entity','update_category','update_catalog_item','update_catalog_price','update_promotion','update_option_group','update_option_choice','prepare_catalog_image_cleanup',
   'credit_stamp','redeem_reward','open_incident','activate_loyalty_program','set_reward_availability','update_reward_cost','reverse_stamp','correct_customer_profile','close_incident','prepare_staff_invitation','complete_staff_invitation'));

create function public.get_managed_staff() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  perform app_private.require_staff('manager');
  return jsonb_build_object('staff',coalesce((select jsonb_agg(jsonb_build_object('id',id,'authUserId',auth_user_id,'role',role,'active',active,'revision',revision,
    'deleted',deleted_at is not null,'invitationStatus',invitation_status,'email',app_private.staff_auth_info(auth_user_id)->>'email') order by created_at,id)
    from app_private.staff_accounts),'[]'));
end $$;

create function public.prepare_staff_invitation(p_email text,p_role text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; fingerprint text; replay jsonb; result jsonb; target uuid;
begin
  actor:=app_private.require_staff('manager');
  if p_email is null or char_length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_role is null or p_role not in ('attendant','manager') then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','prepare_staff_invitation','email',lower(btrim(p_email)),'role',p_role));
  replay:=app_private.operation_replay('prepare_staff_invitation',fingerprint,p_operation_id);
  if replay is not null then return replay; end if;
  -- Un mismo correo no puede tener dos reservas, ni siquiera por actores distintos.
  perform pg_advisory_xact_lock(hashtextextended('fyb:invite:' || lower(btrim(p_email)),0));
  if exists(select 1 from app_private.operation_receipts where operation_kind='prepare_staff_invitation' and request_hash in (
    app_private.operation_hash(jsonb_build_object('kind','prepare_staff_invitation','email',lower(btrim(p_email)),'role','attendant')),
    app_private.operation_hash(jsonb_build_object('kind','prepare_staff_invitation','email',lower(btrim(p_email)),'role','manager')))) then
    raise exception using errcode='P0001',message='CONFLICT'; end if;
  target:=gen_random_uuid();
  result:=jsonb_build_object('operationId',p_operation_id,'replayed',false,'outcome','review_required','entityType','staff_invitation','entityId',target,'revision',1);
  insert into app_private.operation_receipts(actor_user_id,operation_id,operation_kind,request_hash,outcome) values(actor.auth_user_id,p_operation_id,'prepare_staff_invitation',fingerprint,result);
  insert into app_private.audit_entries(actor_staff_id,actor_user_id,action,entity_type,entity_id,changed_fields,operation_id)
    values(actor.id,actor.auth_user_id,'prepare_staff_invitation','staff_account',target::text,jsonb_build_object('state','reserved','role',p_role),p_operation_id);
  return result;
end $$;

create function public.get_staff_invitation_context(p_email text,p_role text,p_operation_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare receipt app_private.operation_receipts; target app_private.staff_accounts; auth_target jsonb; fingerprint text;
begin
  perform app_private.require_staff('manager');
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','prepare_staff_invitation','email',lower(btrim(p_email)),'role',p_role));
  select * into receipt from app_private.operation_receipts where actor_user_id=app_private.actor_user_id() and operation_id=p_operation_id and operation_kind='prepare_staff_invitation';
  if not found or receipt.request_hash<>fingerprint then raise exception using errcode='P0001',message='IDEMPOTENCY_CONFLICT'; end if;
  auth_target:=app_private.invitation_auth_target(lower(btrim(p_email)),(receipt.outcome->>'entityId')::uuid);
  select * into target from app_private.staff_accounts where id=(receipt.outcome->>'entityId')::uuid;
  return jsonb_build_object('staffId',receipt.outcome->>'entityId','userId',auth_target->>'id','invitedAt',auth_target->>'invitedAt','state',coalesce(target.invitation_status,'reserved'));
end $$;

create function public.stage_staff_invitation(p_email text,p_role text,p_operation_id uuid,p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; context jsonb; target app_private.staff_accounts; send_allowed boolean:=false;
begin
  actor:=app_private.require_staff('manager');
  perform pg_advisory_xact_lock(hashtextextended(actor.auth_user_id::text || ':' || p_operation_id::text,0));
  context:=public.get_staff_invitation_context(p_email,p_role,p_operation_id);
  if p_user_id is null or context->>'userId' is distinct from p_user_id::text then raise exception using errcode='P0001',message='CONFLICT'; end if;
  perform pg_advisory_xact_lock(hashtextextended('fyb:staff-administration',0));
  actor:=app_private.require_staff('manager');
  select * into target from app_private.staff_accounts where id=(context->>'staffId')::uuid for update;
  if not found then
    insert into app_private.staff_accounts(id,auth_user_id,role,active,created_by,invitation_status)
      values((context->>'staffId')::uuid,p_user_id,p_role,false,actor.id,'pending') returning * into target;
  end if;
  if target.auth_user_id<>p_user_id or target.role<>p_role or target.deleted_at is not null then raise exception using errcode='P0001',message='CONFLICT'; end if;
  if target.invitation_status='pending' and context->>'invitedAt' is null and
    (target.invitation_send_started_at is null or target.invitation_send_started_at<now()-interval '90 seconds') then
    update app_private.staff_accounts set invitation_send_started_at=now(),revision=revision+1,updated_at=now() where id=target.id returning * into target;
    send_allowed:=true;
  end if;
  return jsonb_build_object('staffId',target.id,'revision',target.revision,'state',target.invitation_status,'sendAllowed',send_allowed,'alreadyInvited',context->>'invitedAt' is not null);
end $$;

create function public.complete_staff_invitation(p_email text,p_role text,p_reservation_id uuid,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; context jsonb; target app_private.staff_accounts; fingerprint text; replay jsonb;
begin
  actor:=app_private.require_staff('manager');
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','complete_staff_invitation','reservationId',p_reservation_id));
  replay:=app_private.operation_replay('complete_staff_invitation',fingerprint,p_operation_id);
  if replay is not null then return replay; end if;
  context:=public.get_staff_invitation_context(p_email,p_role,p_reservation_id);
  if context->>'invitedAt' is null then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  perform pg_advisory_xact_lock(hashtextextended('fyb:staff-administration',0));
  actor:=app_private.require_staff('manager');
  select * into target from app_private.staff_accounts where id=(context->>'staffId')::uuid for update;
  if not found or target.invitation_status<>'pending' or target.deleted_at is not null then raise exception using errcode='P0001',message='CONFLICT'; end if;
  update app_private.staff_accounts set active=true,invitation_status='sent',revision=revision+1,updated_at=now() where id=target.id returning * into target;
  return app_private.commit_staff_operation(actor.id,'complete_staff_invitation',fingerprint,p_operation_id,'staff_account',target.id::text,target.revision,jsonb_build_object('invitationStatus','sent','active',true));
end $$;

-- La reserva se conserva inmutable; su consulta indica si la etapa externa ya terminó.
alter function public.get_operation(uuid) rename to get_h7_ordinary_operation;
alter function public.get_h7_ordinary_operation(uuid) set schema app_private;
revoke all on function app_private.get_h7_ordinary_operation(uuid) from public,anon,authenticated,service_role;
create function public.get_operation(p_operation_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare receipt app_private.operation_receipts; target app_private.staff_accounts; result jsonb;
begin
  perform app_private.require_staff();
  select * into receipt from app_private.operation_receipts where actor_user_id=app_private.actor_user_id() and operation_id=p_operation_id;
  if not found or receipt.operation_kind<>'prepare_staff_invitation' then return app_private.get_h7_ordinary_operation(p_operation_id); end if;
  perform app_private.require_staff('manager');
  select * into target from app_private.staff_accounts where id=(receipt.outcome->>'entityId')::uuid;
  result:=receipt.outcome;
  if target.invitation_status in ('sent','ready') then result:=result || jsonb_build_object('outcome','applied','revision',target.revision); end if;
  return jsonb_build_object('status','recorded','operationId',p_operation_id,'operationKind',receipt.operation_kind,'result',result,
    'currentState',jsonb_build_object('entity','staff_invitation','id',receipt.outcome->>'entityId','revision',coalesce(target.revision,1),'state',coalesce(target.invitation_status,'reserved')));
end $$;

revoke all on function public.get_managed_staff(),public.prepare_staff_invitation(text,text,uuid),public.get_staff_invitation_context(text,text,uuid),public.stage_staff_invitation(text,text,uuid,uuid),public.complete_staff_invitation(text,text,uuid,uuid),public.get_operation(uuid) from public,anon,service_role;
grant execute on function public.get_managed_staff(),public.prepare_staff_invitation(text,text,uuid),public.get_staff_invitation_context(text,text,uuid),public.stage_staff_invitation(text,text,uuid,uuid),public.complete_staff_invitation(text,text,uuid,uuid),public.get_operation(uuid) to authenticated;
reset role;
revoke create on schema public from app_owner;
commit;
