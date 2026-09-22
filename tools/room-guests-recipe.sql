begin;
-- Extensions around the existing iOS invitation state machine, not a second roster.
create or replace function public.rooms_set_queue_open_v3(p_room_id uuid, p_open boolean)
returns public.rooms_v2 language plpgsql security definer set search_path='' as $$
declare r public.rooms_v2;
begin
 r := public.rooms_v2_assert_host(p_room_id);
 if r.type='classe' then raise exception 'Use Classe admission settings'; end if;
 if p_open is null then raise exception 'Queue state required'; end if;
 update public.rooms_v2 set queue_open=p_open where id=p_room_id returning * into r;
 return r;
end $$;
create or replace function public.rooms_guest_command_v1(p_room_id uuid,p_user_ids uuid[],p_action text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.rooms_v2; u uuid; inv public.room_invitations_v2; q uuid;
begin
 r := public.rooms_v2_assert_host(p_room_id);
 if r.type='classe' then raise exception 'Use Classe participation commands'; end if;
 if coalesce(cardinality(p_user_ids),0) not between 1 and 64
 or exists(select 1 from unnest(p_user_ids) x where x is null or x=r.host_id)
 or p_action not in ('invite','backstage','stage','remove','refuse') or p_action is null then
 raise exception using errcode='22023',message='Invalid guest command'; end if;
 -- Room lock above serializes capacity checks and makes multi-selection all-or-nothing.
 for u in select distinct x from unnest(p_user_ids) x order by x loop
  select * into inv from public.room_invitations_v2 where room_id=p_room_id and guest_id=u and ended_at is null for update;
  select id into q from public.room_queue_v2 where room_id=p_room_id and user_id=u and removed_at is null;
  if p_action='invite' then
   if inv.id is null then
    if q is null then raise exception 'Guest is not in the queue'; end if;
    perform public.rooms_invite_from_queue_v2(q);
   end if;
  elsif p_action in ('stage','backstage') then
   if inv.id is null then raise exception 'Accepted invitation required'; end if;
   if p_action='stage' and inv.status<>'onstage' then perform public.rooms_move_invitation_to_stage_v2(inv.id);
   elsif p_action='backstage' and inv.status<>'backstage' then perform public.rooms_move_invitation_to_backstage_v2(inv.id); end if;
  elsif p_action='refuse' then
   if inv.id is not null then
    if inv.status not in ('pending','accepted','ready') then raise exception 'Guest is already admitted'; end if;
    perform public.rooms_cancel_invitation_v2(inv.id);
   end if;
   if q is not null then perform public.rooms_leave_queue_v2(q); end if;
  else
   if inv.id is not null then perform public.rooms_kick_invitation_v2(inv.id,'host_remove');
   elsif q is not null then perform public.rooms_leave_queue_v2(q); end if;
  end if;
 end loop;
end $$;
revoke all on function public.rooms_set_queue_open_v3(uuid,boolean) from public,anon;
revoke all on function public.rooms_guest_command_v1(uuid,uuid[],text) from public,anon;
grant execute on function public.rooms_set_queue_open_v3(uuid,boolean) to authenticated;
grant execute on function public.rooms_guest_command_v1(uuid,uuid[],text) to authenticated;
commit;
create extension if not exists pgtap with schema extensions;
select plan(9);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('7f000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','guest-recipe-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,5)n;
insert into public.rooms_v2(id,host_id,type,title,status,livekit_room_name) values('7f100000-0000-0000-0000-000000000001','7f000000-0000-0000-0000-000000000001','wave','Guest test','live','guest-test');
insert into public.room_invitations_v2(room_id,host_id,guest_id,status)
select '7f100000-0000-0000-0000-000000000001','7f000000-0000-0000-0000-000000000001',('7f000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,case when n=5 then 'pending' else 'backstage' end from generate_series(2,5)n;
select set_config('request.jwt.claim.sub','7f000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.rooms_set_queue_open_v3('7f100000-0000-0000-0000-000000000001',false)$$,'host can close queue');
select is((select queue_open from public.rooms_v2 where id='7f100000-0000-0000-0000-000000000001'),false,'queue state persisted');
select lives_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000002','7f000000-0000-0000-0000-000000000003']::uuid[],'stage')$$,'duo promoted atomically');
select lives_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000002','7f000000-0000-0000-0000-000000000003']::uuid[],'stage')$$,'promotion retry is safe');
select throws_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000004','7f000000-0000-0000-0000-000000000005']::uuid[],'stage')$$,'P0001','Seules les coulisses peuvent monter sur scene','pending invitation cannot bypass preparation');
select is((select status from public.room_invitations_v2 where guest_id='7f000000-0000-0000-0000-000000000004'),'backstage','failed batch leaves first participant untouched');
select lives_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000002']::uuid[],'backstage')$$,'participant can return to backstage');
select set_config('request.jwt.claim.sub','7f000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.rooms_set_queue_open_v3('7f100000-0000-0000-0000-000000000001',true)$$,'P0001','Action reservee au host','viewer cannot change admission');
select throws_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000004']::uuid[],'stage')$$,'P0001','Action reservee au host','viewer cannot promote');
reset role;
select * from finish();
