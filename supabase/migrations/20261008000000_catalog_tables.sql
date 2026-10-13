begin;
grant create on schema public to app_owner;
set local role app_owner;

create function app_private.valid_inclusions(values_array text[]) returns boolean
language sql immutable set search_path='' as $$
  select coalesce(cardinality(values_array) <= 12 and not exists (
    select 1 from unnest(values_array) value where value is null or char_length(btrim(value)) not between 1 and 120
  ), false);
$$;
create function app_private.valid_weekdays(days smallint[]) returns boolean
language sql immutable set search_path='' as $$
  select days is null or (cardinality(days) between 1 and 7
    and not exists(select 1 from unnest(days) day where day is null or day not between 1 and 7)
    and cardinality(days)=(select count(distinct day) from unnest(days) day));
$$;
create function app_private.valid_catalog_image(path text, item uuid) returns boolean
language sql immutable set search_path='' as $$
  select path is null or (char_length(path) <= 512 and path ~
    ('^items/' || item::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'));
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug)<=120),
  name text not null check(char_length(btrim(name)) between 1 and 120),
  sort_order integer not null default 0 check(sort_order>=0),
  active boolean not null default false
);
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  source_ref text unique check(source_ref is null or char_length(btrim(source_ref)) between 1 and 80),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug)<=120),
  name text not null check(char_length(btrim(name)) between 1 and 120),
  kind text not null check(kind in ('regular','promotion')),
  portion_label text check(portion_label is null or char_length(btrim(portion_label)) between 1 and 80),
  inclusions text[] not null default '{}' check(app_private.valid_inclusions(inclusions)),
  description text check(description is null or char_length(btrim(description)) between 1 and 500),
  image_path text check(app_private.valid_catalog_image(image_path,id)),
  source_price_cents integer check(source_price_cents>=0),
  online_enabled boolean not null default false,
  publication_status text not null default 'draft' check(publication_status in ('draft','published','archived')),
  availability text not null default 'available' check(availability in ('available','sold_out')),
  sort_order integer not null default 0 check(sort_order>=0),
  check(source_ref is distinct from 'C01' or not online_enabled)
);
create table public.catalog_prices (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete restrict,
  mode text not null check(mode in ('delivery','pickup','dine_in')),
  price_cents integer not null check(price_cents>0),
  verified boolean not null default false,
  unique(item_id,mode)
);
create table public.promotions (
  item_id uuid primary key references public.catalog_items(id) on delete restrict,
  enabled boolean not null default false,
  starts_at timestamptz, ends_at timestamptz,
  weekdays smallint[] check(app_private.valid_weekdays(weekdays)),
  previous_price_cents integer check(previous_price_cents>0),
  comparison_verified boolean not null default false,
  check(starts_at is null or ends_at is null or ends_at>starts_at),
  check(not comparison_verified or previous_price_cents is not null)
);
create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete restrict,
  name text not null check(char_length(btrim(name)) between 1 and 120),
  min_choices integer not null default 0 check(min_choices>=0),
  max_choices integer not null default 1 check(max_choices>=1 and max_choices>=min_choices),
  active boolean not null default false, verified boolean not null default false,
  sort_order integer not null default 0 check(sort_order>=0)
);
create table public.option_choices (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.option_groups(id) on delete restrict,
  label text not null check(char_length(btrim(label)) between 1 and 120),
  extra_price_cents integer not null default 0 check(extra_price_cents>=0),
  available boolean not null default false, verified boolean not null default false,
  sort_order integer not null default 0 check(sort_order>=0)
);

-- Lista interna y fija de migración; nunca recibe nombres desde una petición.
do $$ declare table_name text; begin
  foreach table_name in array array['categories','catalog_items','catalog_prices','promotions','option_groups','option_choices'] loop
    execute format('alter table public.%I add column revision integer not null default 1 check(revision>0),
      add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now(),
      add column deleted_at timestamptz, add column deleted_by uuid references app_private.staff_accounts(id) on delete restrict,
      add column delete_reason text,
      add constraint soft_delete_consistency check(
        (deleted_at is null and deleted_by is null and delete_reason is null) or
        (deleted_at is not null and deleted_by is not null and delete_reason is not null and char_length(btrim(delete_reason)) between 10 and 500))', table_name);
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from public,anon,authenticated,service_role',table_name);
    execute format('create trigger catalog_no_delete before delete on public.%I for each row execute function app_private.reject_history_mutation()',table_name);
  end loop;
end $$;

create index categories_live_order on public.categories(sort_order,id) where deleted_at is null and active;
create index catalog_items_category on public.catalog_items(category_id);
create index catalog_items_public_order on public.catalog_items(category_id,sort_order,id) where deleted_at is null and online_enabled and publication_status='published';
create index catalog_prices_live on public.catalog_prices(item_id,mode) where deleted_at is null and verified;
create index promotions_live_period on public.promotions(starts_at,ends_at,item_id) where deleted_at is null and enabled;
create index option_groups_item on public.option_groups(item_id);
create index option_groups_live_order on public.option_groups(item_id,sort_order,id) where deleted_at is null and active and verified;
create index option_choices_group on public.option_choices(group_id);
create index option_choices_live_order on public.option_choices(group_id,sort_order,id) where deleted_at is null and available and verified;

reset role;
revoke create on schema public from app_owner;
commit;
