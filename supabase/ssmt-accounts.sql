-- PREPARED ONLY. Requires concrete approval and a verified canonical-row backup before execution.
-- Additive: never recreates, reseeds, deletes, or rewrites existing app_records data during setup.
begin;
create table if not exists public.ssmt_members (
 user_id uuid primary key references auth.users(id), email text not null,
 display_name text not null default '', work_role text not null check(work_role in ('Chef','Experience','IT')),
 is_admin boolean not null default false, active boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.ssmt_audit (
 id bigint generated always as identity primary key, created_at timestamptz not null default now(),
 actor_id uuid not null, actor_name text not null, actor_email text not null,
 events jsonb not null check(jsonb_typeof(events)='array')
);
create table if not exists public.ssmt_workspace_backups (
 id bigint generated always as identity primary key, created_at timestamptz not null default now(),
 actor_id uuid not null, record_payload jsonb not null
);
alter table public.ssmt_members enable row level security;
alter table public.ssmt_audit enable row level security;
alter table public.ssmt_workspace_backups enable row level security;
revoke all on public.ssmt_members,public.ssmt_audit,public.ssmt_workspace_backups from public,anon,authenticated,service_role;
grant select on public.ssmt_members,public.ssmt_audit,public.ssmt_workspace_backups to service_role;

create or replace function public.ssmt_commit_workspace(p_actor uuid,p_expected jsonb,p_next jsonb,p_events jsonb,p_role text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare current_payload jsonb; member public.ssmt_members;
begin
 select * into member from public.ssmt_members where user_id=p_actor and active for share;
 if member.user_id is null or member.work_role is distinct from p_role then raise exception 'SSMT membership changed'; end if;
 select record_payload into current_payload from public.app_records where record_id='ssmt|workspace|current' for update;
 if current_payload is null then raise exception 'Canonical workspace missing'; end if;
 if current_payload is distinct from p_expected then raise sqlstate 'PT409' using message='Workspace changed; reload and reconcile'; end if;
 if p_next->>'Record ID' is distinct from 'ssmt|workspace|current' or p_next->>'ssmtPayloadEncoding' is distinct from 'gzip-base64-json-v1' or jsonb_typeof(p_events) is distinct from 'array' then raise exception 'Invalid commit'; end if;
 insert into public.ssmt_workspace_backups(actor_id,record_payload) values(p_actor,current_payload);
 if jsonb_array_length(p_events)>0 then
  insert into public.ssmt_audit(actor_id,actor_name,actor_email,events) values(p_actor,member.display_name,member.email,p_events);
 end if;
 perform set_config('ssmt.audited_commit','on',true);
 update public.app_records set record_payload=p_next,updated_at=now(),updated_at_text=now()::text where record_id='ssmt|workspace|current';
 perform set_config('ssmt.audited_commit','off',true);
end; $$;
revoke all on function public.ssmt_commit_workspace(uuid,jsonb,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.ssmt_commit_workspace(uuid,jsonb,jsonb,jsonb,text) to service_role;

create or replace function public.ssmt_set_member(p_actor uuid,p_user uuid,p_email text,p_name text,p_role text,p_admin boolean,p_active boolean)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.ssmt_members; prior public.ssmt_members; updated public.ssmt_members;
begin
 -- Serialize admin changes, including the last-admin check.
 perform pg_advisory_xact_lock(771204106);
 select * into actor from public.ssmt_members where user_id=p_actor and active and is_admin;
 if actor.user_id is null then raise exception 'Active admin required'; end if;
 select * into prior from public.ssmt_members where user_id=p_user for update;
 if prior.is_admin and prior.active and (not p_admin or not p_active) and not exists(select 1 from public.ssmt_members where user_id<>p_user and is_admin and active) then raise exception 'Cannot revoke the last active admin'; end if;
 insert into public.ssmt_members(user_id,email,display_name,work_role,is_admin,active) values(p_user,coalesce(p_email,prior.email),p_name,p_role,p_admin,p_active)
 on conflict(user_id) do update set display_name=excluded.display_name,work_role=excluded.work_role,is_admin=excluded.is_admin,active=excluded.active,updated_at=now()
 returning * into updated;
 insert into public.ssmt_audit(actor_id,actor_name,actor_email,events) values(p_actor,actor.display_name,actor.email,jsonb_build_array(jsonb_build_object('kind','account','entityId',p_user,'label',updated.email,'action',case when prior.user_id is null then 'invited' else 'access changed' end,'before',case when prior.user_id is null then null else to_jsonb(prior) end,'after',to_jsonb(updated))));
end; $$;
revoke all on function public.ssmt_set_member(uuid,uuid,text,text,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.ssmt_set_member(uuid,uuid,text,text,text,boolean,boolean) to service_role;
commit;
-- First-admin bootstrap is deliberately separate: use the verified invitation's auth user UUID,
-- then insert exactly one approved admin membership in a transaction with its audit event.
-- Never hard-code a password or derive an auth UUID from email text.
