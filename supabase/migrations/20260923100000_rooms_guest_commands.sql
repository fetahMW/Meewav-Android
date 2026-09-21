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
