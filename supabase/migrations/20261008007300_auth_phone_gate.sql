begin;
-- Invoker sin tablas: solo Auth puede ejecutar este filtro de altas públicas.
-- Activar el hook ANTES de habilitar signup para SMS. No modifica la configuración remota de Auth.
create function public.before_customer_created(event jsonb) returns jsonb
language sql immutable set search_path='' as $$
  select case when event->'user'->'app_metadata'->>'provider'='phone'
    and coalesce(event->'user'->>'phone','') ~ '^\+?519[0-9]{8}$'
    and coalesce(event->'user'->>'email','')=''
    then '{}'::jsonb
    else '{"error":{"http_code":403,"message":"signup_disabled"}}'::jsonb end;
$$;
revoke all on function public.before_customer_created(jsonb) from public,anon,authenticated,service_role,app_owner;
grant execute on function public.before_customer_created(jsonb) to supabase_auth_admin;
commit;
