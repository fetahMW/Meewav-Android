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

CREATE OR REPLACE FUNCTION public.rooms_vote_poll_v2(p_poll_id uuid, p_option_index integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_poll public.room_polls_v2%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select poll.*
  into v_poll
  from public.room_polls_v2 poll
  where poll.id = p_poll_id
  for update;

  if not found then
    raise exception 'Poll not found.';
  end if;

  if not v_poll.is_active
     or v_poll.created_at + make_interval(secs => v_poll.duration_seconds) <= now()
  then
    raise exception 'Poll is closed.';
  end if;

  if v_poll.host_id = v_user_id then
    raise exception 'Host cannot vote.';
  end if;

  if p_option_index < 0
     or p_option_index >= jsonb_array_length(v_poll.options)
  then
    raise exception 'Invalid poll option.';
  end if;

  if not exists (
    select 1
    from public.rooms_v2 room
    join public.room_participants_v2 participant
      on participant.room_id = room.id
     and participant.user_id = v_user_id
     and participant.left_at is null
    where room.id = v_poll.room_id
      and room.status <> 'ended'
  ) then
    raise exception 'Current user is not an active room participant.';
  end if;

  if exists (
    select 1
    from public.room_bans_v2 ban
    where ban.room_id = v_poll.room_id
      and ban.user_id = v_user_id
  ) then
    raise exception 'Current user is banned from this room.';
  end if;

  insert into public.room_poll_votes_v2 (
    poll_id,
    user_id,
    option_index
  )
  values (
    p_poll_id,
    v_user_id,
    p_option_index
  )
  on conflict (poll_id, user_id) do nothing;

  -- Realtime listens to the poll row. Touching it makes every accepted vote
  -- immediately refresh the aggregate on Host and Viewer clients.
  update public.room_polls_v2
  set updated_at = now()
  where id = p_poll_id;
end;
$function$
