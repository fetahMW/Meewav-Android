begin;
create or replace function public.rooms_invite_profile_v1(p_room_id uuid,p_profile_id uuid)
returns public.room_invitations_v2 language plpgsql security definer set search_path='' as $$
declare room public.rooms_v2; invitation public.room_invitations_v2;
begin
 room:=public.rooms_v2_assert_host(p_room_id);
 if room.type='classe' then raise exception 'Use Classe participation invitations'; end if;
 if p_profile_id is null or p_profile_id=room.host_id
 or public.messaging_profiles_blocked_v1(room.host_id,p_profile_id)
 or exists(select 1 from public.room_bans_v2 where room_id=p_room_id and user_id=p_profile_id)
 or not exists(select 1 from public.profiles p where p.id=p_profile_id and coalesce(p.show_on_public_profile,false) and not coalesce(p.is_ghost_mode,true)) then
  raise exception using errcode='42501',message='profile_not_invitable';
 end if;
 select * into invitation from public.room_invitations_v2 where room_id=p_room_id and guest_id=p_profile_id for update;
 if found then
  if invitation.ended_at is null and invitation.status in ('pending','accepted','ready','backstage','onstage') then return invitation; end if;
  raise exception using errcode='55000',message='invitation_already_ended';
 end if;
 if (select count(*) from public.room_invitations_v2 where host_id=room.host_id and created_at>now()-interval '1 hour')>=100 then
  raise exception using errcode='54000',message='invitation_rate_limit'; end if;
 insert into public.room_invitations_v2(room_id,host_id,guest_id,status) values(p_room_id,room.host_id,p_profile_id,'pending') returning * into invitation;
 -- Do not join or promote the recipient: only their canonical acceptance grants membership.
 return invitation;
end $$;
revoke all on function public.rooms_invite_profile_v1(uuid,uuid) from public,anon;
grant execute on function public.rooms_invite_profile_v1(uuid,uuid) to authenticated;
commit;

create extension if not exists pgtap with schema extensions;
select plan(8);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('83000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','invite-recipe-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,3)n;
update public.profiles set show_on_public_profile=true,is_ghost_mode=false where id in ('83000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000002');
update public.profiles set show_on_public_profile=false where id='83000000-0000-0000-0000-000000000003';
insert into public.rooms_v2(id,host_id,type,title,status,livekit_room_name) values('83010000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000001','wave','Invite test','live','invite-test');
select set_config('request.jwt.claim.sub','83000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.rooms_invite_profile_v1('83010000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000002')$$,'host invites public profile');
select lives_ok($$select public.rooms_invite_profile_v1('83010000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000002')$$,'retry safe');
select is((select count(*)::int from public.room_invitations_v2 where room_id='83010000-0000-0000-0000-000000000001'),1,'single invitation');
select is((select count(*)::int from public.room_participants_v2 where room_id='83010000-0000-0000-0000-000000000001' and user_id='83000000-0000-0000-0000-000000000002'),0,'no implicit join');
select throws_ok($$select public.rooms_invite_profile_v1('83010000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000003')$$,'42501','profile_not_invitable','private profile protected');
select throws_ok($$select public.rooms_invite_profile_v1('83010000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000001')$$,'42501','profile_not_invitable','cannot invite self');
select set_config('request.jwt.claim.sub','83000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.rooms_invite_profile_v1('83010000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000003')$$,'P0001','Action reservee au host','nonhost rejected');
reset role;
update public.room_invitations_v2 set status='declined',ended_at=now() where room_id='83010000-0000-0000-0000-000000000001';
select set_config('request.jwt.claim.sub','83000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select throws_ok($$select public.rooms_invite_profile_v1('83010000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000002')$$,'55000','invitation_already_ended','no reinvitation after refusal');
reset role;
select * from finish();
