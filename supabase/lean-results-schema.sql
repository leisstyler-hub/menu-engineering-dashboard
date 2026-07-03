-- Culinary Tools Platform - Supabase Storage Backbone
-- Run this in Supabase SQL Editor to activate structured app storage.
-- Supabase becomes the primary data layer; Smartsheet remains the readable mirror/fallback.

create extension if not exists pgcrypto;

create table if not exists public.app_records (
  record_id text primary key,
  parent_record_id text not null default '',
  tool text not null check (tool in ('rotation', 'lean', 'menuProjects')),
  record_type text not null default '',
  status text not null default '',
  district text not null default '',
  cafe_unit text not null default '',
  date_range_label text not null default '',
  station_key text not null default '',
  submitted_at_text text not null default '',
  updated_at_text text not null default '',
  source_system text not null default 'culinary-tools-app',
  visible_in_dashboard boolean not null default true,
  is_test_record boolean not null default false,
  record_payload jsonb not null default '{}'::jsonb,
  retain_until timestamptz not null default (now() + interval '2 years'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.app_records drop constraint if exists app_records_tool_check;
  alter table public.app_records
    add constraint app_records_tool_check check (tool in ('rotation', 'lean', 'menuProjects'));
end
$$;

create table if not exists public.app_retention_events (
  id uuid primary key default gen_random_uuid(),
  cleanup_name text not null,
  deleted_record_count integer not null default 0,
  retention_cutoff timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lean_observations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  district text not null,
  cafe_unit text not null,
  observation_area text,
  observer_role text,
  business_date date not null default current_date,
  started_at timestamptz,
  completed_at timestamptz,
  observed_seconds numeric(10, 2) not null default 0,
  total_marks integer not null default 0,
  top_activity text,
  top_waste_code text,
  top_waste_label text,
  report_summary text,
  report_recipients text[] not null default '{}',
  smartsheet_record_id text,
  sync_status text not null default 'pending',
  visible_in_dashboard boolean not null default true,
  is_test_record boolean not null default false,
  voided_at timestamptz,
  voided_by text,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lean_observation_marks (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.lean_observations(id) on delete cascade,
  elapsed_seconds numeric(10, 2) not null,
  activity text not null,
  waste_code text,
  waste_label text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_sync_events (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  target_system text not null,
  entity_type text not null,
  entity_id text not null,
  status text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists app_records_tool_scope_idx
  on public.app_records (tool, district, cafe_unit, date_range_label);

create index if not exists app_records_parent_idx
  on public.app_records (parent_record_id);

create index if not exists app_records_retention_idx
  on public.app_records (retain_until);

create index if not exists app_records_payload_idx
  on public.app_records using gin (record_payload);

create index if not exists lean_observations_scope_idx
  on public.lean_observations (district, cafe_unit, business_date desc);

create index if not exists lean_observations_visibility_idx
  on public.lean_observations (visible_in_dashboard, is_test_record, voided_at);

create index if not exists lean_marks_observation_idx
  on public.lean_observation_marks (observation_id, elapsed_seconds);

create index if not exists app_sync_events_entity_idx
  on public.app_sync_events (entity_type, entity_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_records_touch_updated_at on public.app_records;
create trigger app_records_touch_updated_at
before update on public.app_records
for each row
execute function public.touch_updated_at();

create or replace function public.cleanup_expired_app_records()
returns table(deleted_record_count integer, retention_cutoff timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz := now();
  deleted_count integer := 0;
begin
  delete from public.app_records
  where retain_until < cutoff;

  get diagnostics deleted_count = row_count;

  insert into public.app_retention_events (cleanup_name, deleted_record_count, retention_cutoff)
  values ('two_year_app_record_retention', deleted_count, cutoff);

  return query select deleted_count, cutoff;
end;
$$;

alter table public.app_records enable row level security;
alter table public.app_retention_events enable row level security;
alter table public.lean_observations enable row level security;
alter table public.lean_observation_marks enable row level security;
alter table public.app_sync_events enable row level security;

-- No public policies are created in this first backbone step.
-- Browser writes go through Vercel API routes that use the service role key server-side.
