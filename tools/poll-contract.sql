CREATE OR REPLACE FUNCTION public.rooms_create_poll_v2(p_room_id uuid, p_question text, p_options jsonb, p_duration_seconds integer)
 RETURNS room_polls_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_poll public.room_polls_v2%rowtype;
  v_options_count integer;
begin
  perform public.rooms_assert_room_host_v2(p_room_id);

  if length(btrim(coalesce(p_question, ''))) = 0 then
    raise exception 'Question required.';
  end if;

  if jsonb_typeof(p_options) <> 'array' then
    raise exception 'Poll options must be an array.';
  end if;

  v_options_count := jsonb_array_length(p_options);
  if v_options_count < 2 or v_options_count > 10 then
    raise exception 'Poll options count must be between 2 and 10.';
  end if;

  if p_duration_seconds not in (30, 60, 120) then
    raise exception 'Invalid poll duration.';
  end if;

  update public.room_polls_v2
  set
    is_active = false,
    ended_at = coalesce(ended_at, now())
  where room_id = p_room_id
    and is_active = true;

  insert into public.room_polls_v2 (
    room_id,
    host_id,
    question,
    options,
    duration_seconds,
    is_active
  )
  values (
    p_room_id,
    auth.uid(),
    btrim(p_question),
    p_options,
    p_duration_seconds,
    true
  )
  returning * into v_poll;

  return v_poll;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_stop_poll_v2(p_poll_id uuid)
 RETURNS room_polls_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_poll public.room_polls_v2%rowtype;
begin
  select *
    into v_poll
  from public.room_polls_v2
  where id = p_poll_id
  for update;

  if not found then
    raise exception 'Poll not found.';
  end if;

  perform public.rooms_assert_room_host_v2(v_poll.room_id);

  update public.room_polls_v2
  set
    is_active = false,
    ended_at = coalesce(ended_at, now())
  where id = p_poll_id
  returning * into v_poll;

  return v_poll;
end;
$function$
