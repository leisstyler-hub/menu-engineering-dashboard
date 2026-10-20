-- ONE-TIME INITIAL ADMIN ENROLLMENT. Prepared only; requires approval.
-- Run after ssmt-accounts.sql and after the Auth service has issued the requested invitation.
begin;
do $$
declare target_id uuid; target_count integer;
begin
 perform pg_advisory_xact_lock(771204106);
 if exists(select 1 from public.ssmt_members) then raise exception 'Initial SSMT enrollment already exists; use admin account management'; end if;
 select count(*),min(id::text)::uuid into target_count,target_id from auth.users where lower(email)='tyler.leiss@compass-usa.com' and deleted_at is null;
 if target_count<>1 then raise exception 'Exactly one Auth user record for the requested email is required'; end if;
 insert into public.ssmt_members(user_id,email,display_name,work_role,is_admin,active) values(target_id,'tyler.leiss@compass-usa.com','Tyler','Chef',true,true);
 insert into public.ssmt_audit(actor_id,actor_name,actor_email,events) values(target_id,'Tyler','tyler.leiss@compass-usa.com',jsonb_build_array(jsonb_build_object('kind','account','entityId',target_id,'label','Tyler initial admin','action','initial admin enrolled','approvedByBuzzId','12fc010ae7314bd1bf75d7a74c296a93629c12a464ba2aaa406fee08a57d794d','requestEvent','efa9b429e4cd520447f8c2a40557e9916bec16985057798fce8708f14dddd68c')));
end; $$;
commit;
