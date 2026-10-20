-- PREPARED ONLY. Activate last, during the approved brief SSMT write cutover.
-- Protects the canonical row even if an older deployment still exposes a legacy save route.
begin;
create or replace function public.ssmt_require_audited_commit()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if TG_OP='DELETE' then
  if OLD.record_id='ssmt|workspace|current' then raise exception 'Canonical SSMT deletion is prohibited'; end if;
  return OLD;
 end if;
 if NEW.record_id='ssmt|workspace|current' or (TG_OP='UPDATE' and OLD.record_id='ssmt|workspace|current') then
  if TG_OP<>'UPDATE' or NEW.record_id is distinct from OLD.record_id or current_setting('ssmt.audited_commit',true) is distinct from 'on' then
   raise exception 'Canonical SSMT writes require the audited commit transaction';
  end if;
 end if;
 return NEW;
end; $$;
revoke all on function public.ssmt_require_audited_commit() from public,anon,authenticated;
drop trigger if exists ssmt_canonical_write_guard on public.app_records;
create trigger ssmt_canonical_write_guard before insert or update or delete on public.app_records for each row execute function public.ssmt_require_audited_commit();
commit;
-- No disabling/drop statement is provided: reverting this safeguard requires a separately approved recovery/cutover decision.
