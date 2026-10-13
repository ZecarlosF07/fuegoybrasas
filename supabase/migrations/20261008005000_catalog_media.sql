begin;
-- Únicamente creación de bucket, grants y políticas; objetos por Storage API.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('catalog-media','catalog-media',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
grant usage on schema storage to app_owner;
grant select on storage.objects to app_owner;
create policy catalog_media_internal_read on storage.objects for select to app_owner using(bucket_id='catalog-media');
grant create on schema public to app_owner;
set local role app_owner;

create function public.catalog_media_upload_allowed(p_path text) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare item uuid;
begin
  perform app_private.require_staff('manager');
  if p_path is null or p_path !~ '^items/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then return false; end if;
  item:=split_part(p_path,'/',2)::uuid;
  return app_private.valid_catalog_image(p_path,item)
    and exists(select 1 from public.catalog_items i join public.categories c on c.id=i.category_id where i.id=item and i.deleted_at is null and c.deleted_at is null)
    and not exists(select 1 from app_private.operation_receipts where operation_kind='prepare_catalog_image_cleanup' and outcome->>'entityId'=p_path);
exception when invalid_text_representation then return false;
end $$;

create function app_private.catalog_image_association() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.image_path is null then return new; end if;
  if tg_op='UPDATE' then if new.image_path is not distinct from old.image_path then return new; end if; end if;
  if exists(select 1 from app_private.operation_receipts where operation_kind='prepare_catalog_image_cleanup' and outcome->>'entityId'=new.image_path)
    or not exists(select 1 from storage.objects where bucket_id='catalog-media' and name=new.image_path) then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  return new;
end $$;
create trigger catalog_image_exists before insert or update on public.catalog_items for each row execute function app_private.catalog_image_association();

create function public.get_catalog_image_upload(p_image_path text) returns boolean
language plpgsql stable security definer set search_path='' as $$
begin
  perform app_private.require_staff('manager');
  if p_image_path is null or p_image_path !~ '^items/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  return exists(select 1 from storage.objects where bucket_id='catalog-media' and name=p_image_path);
end $$;

-- Reserva permanente en el journal append-only. Comparte lock de configuración
-- con la asociación: una reserva impide que otra transacción asocie ese objeto.
-- La eliminación física puede reintentarse por API sin abrir una carrera SQL/red.
create function public.prepare_catalog_image_cleanup(p_image_path text,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare actor app_private.staff_accounts; fingerprint text; replay jsonb; item uuid;
begin
  actor:=app_private.require_staff('manager');
  if p_image_path is null or p_image_path !~ '^items/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then
    raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  item:=split_part(p_image_path,'/',2)::uuid;
  if not app_private.valid_catalog_image(p_image_path,item) then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
  fingerprint:=app_private.operation_hash(jsonb_build_object('kind','prepare_catalog_image_cleanup','path',p_image_path));
  replay:=app_private.operation_replay('prepare_catalog_image_cleanup',fingerprint,p_operation_id);
  if replay is not null then return replay; end if;
  perform 1 from public.business_settings where id=1 for update;
  if not found then raise exception using errcode='P0001',message='CONFIG_NOT_READY'; end if;
  if not exists(select 1 from public.catalog_items where id=item) then raise exception using errcode='P0001',message='NOT_FOUND'; end if;
  -- Incluye referencias retiradas que todavía se pueden restaurar.
  if exists(select 1 from public.catalog_items where image_path=p_image_path) then
    raise exception using errcode='P0001',message='CONFLICT'; end if;
  return app_private.commit_staff_operation(actor.id,'prepare_catalog_image_cleanup',fingerprint,p_operation_id,'catalog_image',p_image_path,1,
    jsonb_build_object('cleanupReserved',true));
exception when invalid_text_representation then raise exception using errcode='P0001',message='VALIDATION_ERROR';
end $$;
revoke all on function public.catalog_media_upload_allowed(text),public.prepare_catalog_image_cleanup(text,uuid),public.get_catalog_image_upload(text) from public,anon,service_role;
grant execute on function public.catalog_media_upload_allowed(text),public.prepare_catalog_image_cleanup(text,uuid),public.get_catalog_image_upload(text) to authenticated;
reset role;
create policy catalog_media_manager_insert on storage.objects for insert to authenticated
  with check(bucket_id='catalog-media' and public.catalog_media_upload_allowed(name));
-- Sin UPDATE/upsert/DELETE de objetos para sesiones de navegador.
revoke create on schema public from app_owner;
commit;
