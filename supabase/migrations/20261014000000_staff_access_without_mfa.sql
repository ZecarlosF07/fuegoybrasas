-- DC-22: quitar el segundo factor conserva identidad, autorización actual y roles.
begin;
set local role app_owner;

create or replace function app_private.require_staff(
  required_role text default 'attendant', require_mfa boolean default false
) returns app_private.staff_accounts
language plpgsql stable security definer set search_path = '' as $$
declare account app_private.staff_accounts;
begin
  if app_private.actor_user_id() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;
  if required_role not in ('attendant','manager') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select * into account from app_private.staff_accounts
    where auth_user_id = app_private.actor_user_id() and active and deleted_at is null;
  if not found or (required_role = 'manager' and account.role <> 'manager') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  -- Argumento histórico conservado por compatibilidad con RPC y políticas existentes.
  -- Ya no interviene en la autorización: nunca se exige AAL2.
  return account;
end;
$$;

comment on function app_private.require_staff(text,boolean) is
  'DC-22: identidad Auth y cuenta activa/rol vigente; require_mfa se conserva solo por compatibilidad y se ignora.';

reset role;
commit;
