begin;
set local role app_owner;
-- Conservar el motivo recortado también en PostgreSQL, sin depender del futuro formulario.
do $$ declare table_name text; begin
  foreach table_name in array array['categories','catalog_items','catalog_prices','promotions','option_groups','option_choices'] loop
    execute format('alter table public.%I add constraint delete_reason_trimmed check(delete_reason is null or delete_reason=btrim(delete_reason))',table_name);
  end loop;
end $$;
reset role;
commit;
