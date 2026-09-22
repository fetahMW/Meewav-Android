CREATE OR REPLACE FUNCTION public.rooms_end_room_v1(p_room_id uuid)
 RETURNS rooms_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms_v2%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select room.*
  into v_room
  from public.rooms_v2 room
  where room.id = p_room_id
  for update;

  if not found then
    raise exception 'Room not found.';
  end if;

  if v_room.host_id <> v_user_id then
    raise exception 'Current user is not the room host.';
  end if;

  if v_room.status = 'ended' then
    return v_room;
  end if;

  update public.rooms_v2
  set
    status = 'ended',
    ended_at = coalesce(ended_at, now()),
    queue_open = false
  where id = p_room_id
  returning * into v_room;

  update public.room_participants_v2
  set left_at = coalesce(left_at, now())
  where room_id = p_room_id
    and left_at is null;

  update public.room_queue_v2
  set removed_at = coalesce(removed_at, now())
  where room_id = p_room_id
    and removed_at is null;

  update public.room_invitations_v2
  set
    status = 'ended',
    ended_at = coalesce(ended_at, now())
  where room_id = p_room_id
    and ended_at is null
    and status in ('pending', 'accepted', 'ready', 'backstage', 'onstage');

  update public.room_polls_v2
  set
    is_active = false,
    ended_at = coalesce(ended_at, now())
  where room_id = p_room_id
    and is_active;

  update public.room_pinned_items_v2
  set
    is_active = false,
    updated_at = now()
  where room_id = p_room_id
    and is_active;

  update public.room_broadcasts_v2
  set
    mux_status = case
      when mux_status in ('starting', 'active') then 'stopped'
      else mux_status
    end,
    byteplus_status = case
      when byteplus_status in ('starting', 'active') then 'stopped'
      else byteplus_status
    end,
    stopped_at = coalesce(stopped_at, now())
  where room_id = p_room_id;

  return v_room;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_poll_state_v1(p_poll_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_poll public.room_polls_v2%rowtype;
  v_room_type text;
  v_vote_counts jsonb := '[]'::jsonb;
  v_current_user_vote integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'ROOM_AUTH_REQUIRED';
  end if;
  select poll.* into v_poll
  from public.room_polls_v2 poll
  where poll.id = p_poll_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ROOM_POLL_NOT_FOUND';
  end if;
  select room.type into v_room_type
  from public.rooms_v2 room
  where room.id = v_poll.room_id;
  if v_room_type = 'classe'
     and not public.rooms_classe_current_user_is_member_v1(v_poll.room_id) then
    raise exception using errcode = '42501', message = 'ROOM_POLL_ACCESS_DENIED';
  end if;

  select coalesce(jsonb_agg(option_count.vote_count order by option_count.option_index), '[]'::jsonb)
  into v_vote_counts
  from (
    select generated.option_index, count(vote.id)::integer as vote_count
    from generate_series(
      0,
      pg_catalog.jsonb_array_length(v_poll.options) - 1
    ) as generated(option_index)
    left join public.room_poll_votes_v2 vote
      on vote.poll_id = p_poll_id
     and vote.option_index = generated.option_index
    group by generated.option_index
  ) option_count;

  select vote.option_index into v_current_user_vote
  from public.room_poll_votes_v2 vote
  where vote.poll_id = p_poll_id and vote.user_id = v_user_id;

  return jsonb_build_object(
    'poll_id', p_poll_id,
    'vote_counts', v_vote_counts,
    'current_user_vote_index', v_current_user_vote
  );
end;
$function$
