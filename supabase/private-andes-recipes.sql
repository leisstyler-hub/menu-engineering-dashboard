-- REVIEW DRAFT ONLY. Not executed. No operational tables are modified.
-- Server-side authenticated viewer authorization is additionally required.
begin;
create schema if not exists culinary_private;
revoke all on schema culinary_private from public, anon, authenticated;
create table culinary_private.recipe_import_batches (
 id uuid primary key default gen_random_uuid(), source_sha256 text not null,
 source_file_name text not null, source_date date, concept text not null check (concept = 'AMZ: Andes'),
 is_active boolean not null default false,
 imported_by_verified_identity text not null, created_at timestamptz not null default now()
);
create table culinary_private.recipe_variants (
 id uuid primary key default gen_random_uuid(),
 batch_id uuid not null references culinary_private.recipe_import_batches(id),
 mrn text not null, recipe_name text not null, revision_label text,
 category text not null default '', serving_size_text text not null,
 serving_mass_oz numeric check (serving_mass_oz > 0),
 serving_cost numeric check (serving_cost >= 0),
 batch_servings numeric check (batch_servings > 0), serving_pan text default null,
 source_pages integer[] not null,
 reconciliation_status text not null default 'needs-review'
  check (reconciliation_status in ('needs-review','validated','conflict')),
 private_source_payload jsonb not null, variant_key text not null,
 unique (batch_id, mrn, variant_key)
);
create table culinary_private.recipe_components (
 id uuid primary key default gen_random_uuid(),
 parent_variant_id uuid not null references culinary_private.recipe_variants(id),
 child_variant_id uuid references culinary_private.recipe_variants(id),
 component_mrn text, component_name text not null, source_quantity_text text not null,
 prep_basis text, source_step text, source_page integer not null, position integer not null,
 check (parent_variant_id <> child_variant_id), unique (parent_variant_id, position)
);
-- Separate W&P associations; no public Menu Library foreign key or write.
create table culinary_private.wp_item_recipe_links (
 menu_item_identity text primary key,
 recipe_variant_id uuid not null references culinary_private.recipe_variants(id),
 matched_by text not null, approved_at timestamptz
);
alter table culinary_private.recipe_import_batches enable row level security;
alter table culinary_private.recipe_import_batches force row level security;
alter table culinary_private.recipe_variants enable row level security;
alter table culinary_private.recipe_variants force row level security;
alter table culinary_private.recipe_components enable row level security;
alter table culinary_private.recipe_components force row level security;
alter table culinary_private.wp_item_recipe_links enable row level security;
alter table culinary_private.wp_item_recipe_links force row level security;
revoke all on all tables in schema culinary_private from public, anon, authenticated;
-- No browser grants or policies. Backend access still requires scoped design
-- and independent security verification before migration authorization.
-- Backend service gets explicit access; anon/authenticated receive none.
grant usage on schema culinary_private to service_role;
grant select, insert on all tables in schema culinary_private to service_role;
create unique index recipe_import_one_active_andes on culinary_private.recipe_import_batches (concept) where is_active;
create or replace function public.read_andes_private_recipes()
returns jsonb language sql stable security definer
set search_path = pg_catalog, culinary_private
as $$
  with batch as (select id from culinary_private.recipe_import_batches where concept='AMZ: Andes' and is_active),
  variants as (select v.* from culinary_private.recipe_variants v join batch b on b.id=v.batch_id),
  components as (select c.* from culinary_private.recipe_components c join variants v on v.id=c.parent_variant_id)
  select jsonb_build_object(
    'variants', coalesce((select jsonb_agg(to_jsonb(v)) from variants v),'[]'::jsonb),
    'components', coalesce((select jsonb_agg(to_jsonb(c)) from components c),'[]'::jsonb),
    'links', coalesce((select jsonb_agg(to_jsonb(l)) from culinary_private.wp_item_recipe_links l join variants v on v.id=l.recipe_variant_id where l.approved_at is not null),'[]'::jsonb)
  );
$$;
revoke all on function public.read_andes_private_recipes() from public, anon, authenticated;
grant execute on function public.read_andes_private_recipes() to service_role;
commit;
