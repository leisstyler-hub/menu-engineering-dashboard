-- Culinary Tools Platform - Lean Results Backbone
-- Run this in Supabase SQL Editor when we are ready to turn Lean Tool saves into database records.
-- The app currently treats Supabase as the primary future source of truth and Smartsheet as the mirror.

create extension if not exists pgcrypto;

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

create index if not exists lean_observations_scope_idx
  on public.lean_observations (district, cafe_unit, business_date desc);

create index if not exists lean_observations_visibility_idx
  on public.lean_observations (visible_in_dashboard, is_test_record, voided_at);

create index if not exists lean_marks_observation_idx
  on public.lean_observation_marks (observation_id, elapsed_seconds);

create index if not exists app_sync_events_entity_idx
  on public.app_sync_events (entity_type, entity_id, created_at desc);

alter table public.lean_observations enable row level security;
alter table public.lean_observation_marks enable row level security;
alter table public.app_sync_events enable row level security;

-- No public policies are created in this first backbone step.
-- We will add app-specific write/read policies when authentication or server-side API routes are ready.
