-- Culinary Tools Platform - Recipe Library Backbone
-- Run this after the main storage backbone. Supabase becomes the editable
-- source for item library cards and future file attachments.

create extension if not exists pgcrypto;

create table if not exists public.recipe_items (
  item_key text primary key,
  mrn text not null default '',
  source_row_id text not null default '',
  menu text not null default '',
  station text not null default '',
  meal text not null default '',
  category text not null default '',
  recipe_category text not null default '',
  recipe_name text not null default '',
  display_name text not null,
  short_name text not null default '',
  description text not null default '',
  ingredients text not null default '',
  ingredients_common_name text not null default '',
  menu_item_notes text not null default '',
  portion text not null default '',
  portion_oz numeric(10, 3),
  price numeric(10, 2),
  true_cost numeric(10, 4),
  calories integer,
  protein_g numeric(10, 2),
  sodium_mg numeric(10, 2),
  carbs_g numeric(10, 2),
  fiber_g numeric(10, 2),
  sugars_g numeric(10, 2),
  added_sugars_g numeric(10, 2),
  total_fat_g numeric(10, 2),
  saturated_fat_g numeric(10, 2),
  trans_fat_g numeric(10, 2),
  cholesterol_mg numeric(10, 2),
  potassium_mg numeric(10, 2),
  calcium_mg numeric(10, 2),
  iron_mg numeric(10, 2),
  serving_size text not null default '',
  allergens text[] not null default '{}',
  allergen_summary text not null default '',
  allergen_details jsonb not null default '{}'::jsonb,
  vegan_tag text not null default '',
  vegetarian_tag text not null default '',
  compass_fit text not null default '',
  ghg_emissions text not null default '',
  source_system text not null default 'menuworks',
  source_data_version text not null default '',
  source_file_name text not null default '',
  source_truth_name text not null default '',
  menuworks_description text not null default '',
  primary_description_source text not null default '',
  effective_date date,
  effective_note text not null default '',
  station_status text not null default '',
  nutrition_payload jsonb not null default '{}'::jsonb,
  menuworks_raw jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  visible_in_library boolean not null default true,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipe_item_documents (
  id uuid primary key default gen_random_uuid(),
  item_key text not null references public.recipe_items(item_key) on delete cascade,
  document_type text not null check (document_type in ('item-photo', 'plating-guide', 'recipe-file', 'source-document')),
  storage_bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null default '',
  file_size_bytes bigint,
  uploaded_by text not null default '',
  version_label text not null default '',
  notes text not null default '',
  is_active boolean not null default true,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipe_items_menu_idx on public.recipe_items (menu, station, category);
create index if not exists recipe_items_mrn_idx on public.recipe_items (mrn);
create index if not exists recipe_items_payload_idx on public.recipe_items using gin (source_payload);
create index if not exists recipe_item_documents_item_idx on public.recipe_item_documents (item_key, document_type, is_active);

insert into storage.buckets (id, name, public)
values
  ('recipe-files', 'recipe-files', false),
  ('plating-guides', 'plating-guides', false),
  ('item-photos', 'item-photos', false),
  ('source-documents', 'source-documents', false)
on conflict (id) do nothing;

drop trigger if exists recipe_items_touch_updated_at on public.recipe_items;
create trigger recipe_items_touch_updated_at
before update on public.recipe_items
for each row
execute function public.touch_updated_at();

drop trigger if exists recipe_item_documents_touch_updated_at on public.recipe_item_documents;
create trigger recipe_item_documents_touch_updated_at
before update on public.recipe_item_documents
for each row
execute function public.touch_updated_at();

alter table public.recipe_items enable row level security;
alter table public.recipe_item_documents enable row level security;

-- No public policies are created here. Browser edits and uploads should go
-- through Vercel server endpoints using the Supabase service role key.
