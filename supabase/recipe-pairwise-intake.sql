-- Additive private recipe intake v2. Never changes original Andes tables, catalog, or SSMT.
begin;
create table culinary_recipe_intake.packet_books (
 source_sha256 text primary key check(source_sha256 ~ '^[a-f0-9]{64}$'),
 menu_source text not null, menu_name text not null, report_date_text text not null,
 service_range_text text not null, source_pages integer not null check(source_pages>0),
 source_bucket text not null check(source_bucket='culinary-recipe-packets'), source_path text not null,
 manifest jsonb not null, validated boolean not null,
 approval_event text not null, published boolean not null default false check(published=false),
 created_at timestamptz not null default now()
);
create table culinary_recipe_intake.packet_variants (
 source_sha256 text not null references culinary_recipe_intake.packet_books(source_sha256),
 variant_key text not null, mrn text not null, recipe_name text not null, portion_text text not null,
 batch_servings_text text not null, source_pages integer[] not null,
 is_subrecipe boolean not null, parent_mrns text[] not null, culinary_profile jsonb not null,
 primary key(source_sha256,variant_key)
);
create table culinary_recipe_intake.packet_ingredients (
 source_sha256 text not null, variant_key text not null, position integer not null check(position>0),
 ingredient_name text not null, source_code text, source_namespace text,
 quantity_text text, prep_basis text, source_page integer not null check(source_page>0),
 kind text not null check(kind in ('ingredient','subrecipe')),
 purchasing_mit text check(purchasing_mit is null), child_variant_keys text[] not null,
 review_status text not null,
 check((source_code is null and source_namespace is null) or (source_code is not null and source_namespace='menuworks-recipe-report')),
 primary key(source_sha256,variant_key,position),
 foreign key(source_sha256,variant_key) references culinary_recipe_intake.packet_variants(source_sha256,variant_key)
);
create table culinary_recipe_intake.packet_catalog_links (
 source_sha256 text not null,variant_key text not null,catalog_item_key text not null,
 match_basis text not null check(match_basis='exact-mrn-compatible-portion'),
 review_status text not null default 'Proposed',
 primary key(source_sha256,variant_key,catalog_item_key),
 foreign key(source_sha256,variant_key) references culinary_recipe_intake.packet_variants(source_sha256,variant_key)
);
create table culinary_recipe_intake.pairwise_presence_releases (
 release_key text primary key check(release_key ~ '^[a-f0-9]{64}$'),
 presence jsonb not null, source_hashes text[] not null, approval_event text not null,
 active boolean not null default false, created_at timestamptz not null default now()
);
create unique index pairwise_one_active_release on culinary_recipe_intake.pairwise_presence_releases(active) where active;
alter table culinary_recipe_intake.packet_books enable row level security;
alter table culinary_recipe_intake.packet_books force row level security;
alter table culinary_recipe_intake.packet_variants enable row level security;
alter table culinary_recipe_intake.packet_variants force row level security;
alter table culinary_recipe_intake.packet_ingredients enable row level security;
alter table culinary_recipe_intake.packet_ingredients force row level security;
alter table culinary_recipe_intake.packet_catalog_links enable row level security;
alter table culinary_recipe_intake.packet_catalog_links force row level security;
alter table culinary_recipe_intake.pairwise_presence_releases enable row level security;
alter table culinary_recipe_intake.pairwise_presence_releases force row level security;
revoke all on culinary_recipe_intake.packet_books,culinary_recipe_intake.packet_variants,culinary_recipe_intake.packet_ingredients,culinary_recipe_intake.packet_catalog_links,culinary_recipe_intake.pairwise_presence_releases from public,anon,authenticated;
grant select,insert on culinary_recipe_intake.packet_books,culinary_recipe_intake.packet_variants,culinary_recipe_intake.packet_ingredients,culinary_recipe_intake.packet_catalog_links,culinary_recipe_intake.pairwise_presence_releases to service_role;
create function public.read_recipe_pairwise_presence() returns jsonb
language sql stable security definer set search_path=pg_catalog
as $$ select presence || jsonb_build_object('releaseVersion',release_key) from culinary_recipe_intake.pairwise_presence_releases where active limit 1 $$;
revoke all on function public.read_recipe_pairwise_presence() from public,anon,authenticated;
grant execute on function public.read_recipe_pairwise_presence() to service_role;
commit;
