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
