CREATE OR REPLACE FUNCTION public.list_artist_group_tools_v1(p_group_id uuid, p_kind text, p_before uuid DEFAULT NULL::uuid)
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare cursor_date timestamptz;
begin
  if not public.artist_group_is_active_member_v1(p_group_id,auth.uid()) then
    raise exception using errcode='42501',message='group_access_denied'; end if;
  if p_kind not in ('session','decision') or p_kind is null then
    raise exception using errcode='22023',message='invalid_tool_kind'; end if;
  if p_before is not null then
    select created_at into cursor_date from public.artist_group_tools_v1 where id=p_before and group_id=p_group_id and kind=p_kind;
    if not found then raise exception using errcode='22023',message='invalid_cursor'; end if;
  end if;
  return query select jsonb_build_object(
    'id',t.id,'kind',t.kind,'title',t.title,'startsAt',t.starts_at,'place',t.place,'options',t.options,
    'status',t.status,'createdAt',t.created_at,'closedAt',t.closed_at,
    'canManage',t.created_by=auth.uid() or public.artist_group_authority_v1(p_group_id,auth.uid()) in ('owner','admin'),
    'memberCount',(select count(*) from public.artist_group_members m where m.group_id=p_group_id and m.membership_status='active'),
    'responseCount',(select count(*) from public.artist_group_tool_responses_v1 r where r.item_id=t.id),
    'confirmedCount',(select count(*) from public.artist_group_tool_responses_v1 r where r.item_id=t.id and r.attending),
    'myChoice',(select choice from public.artist_group_tool_responses_v1 r where r.item_id=t.id and r.profile_id=auth.uid()),
    'myAttendance',(select attending from public.artist_group_tool_responses_v1 r where r.item_id=t.id and r.profile_id=auth.uid()),
    'counts',coalesce((select jsonb_object_agg(v.choice,v.total) from
      (select r.choice,count(*) total from public.artist_group_tool_responses_v1 r where r.item_id=t.id and r.choice is not null group by r.choice) v),'{}'::jsonb)
  ) from public.artist_group_tools_v1 t
  where t.group_id=p_group_id and t.kind=p_kind and (p_before is null or (t.created_at,t.id)<(cursor_date,p_before))
  order by t.created_at desc,t.id desc limit 51;
end;
$function$

CREATE OR REPLACE FUNCTION public.mutate_artist_group_tool_v1(p_group_id uuid, p_item_id uuid, p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare actor uuid:=auth.uid(); group_state text; item public.artist_group_tools_v1%rowtype;
  item_kind text; label text; starts timestamptz; choices jsonb; selected integer; attendance boolean;
begin
  if actor is null then raise exception using errcode='42501',message='authentication_required'; end if;
  select lifecycle_status into group_state from public.artist_groups where id=p_group_id for update;
  if not public.artist_group_is_active_member_v1(p_group_id,actor) then
    raise exception using errcode='42501',message='group_access_denied'; end if;
  if group_state <> 'active' then raise exception using errcode='55000',message='group_not_active'; end if;
  if p_item_id is null or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>8192 then
    raise exception using errcode='22023',message='invalid_tool_request'; end if;
  if p_action='create' then
    select * into item from public.artist_group_tools_v1 where id=p_item_id;
    if found then
      if item.group_id<>p_group_id or item.created_by is distinct from actor or item.create_request<>p_payload then
        raise exception using errcode='23505',message='idempotency_conflict'; end if;
      return jsonb_build_object('id',item.id,'idempotent',true);
    end if;
    item_kind:=p_payload->>'kind'; label:=btrim(p_payload->>'title');
    if item_kind is null or item_kind not in ('session','decision') or label is null or char_length(label) not between 2 and 160 then
      raise exception using errcode='22023',message='invalid_tool_request'; end if;
    if item_kind='session' then
      starts:=(p_payload->>'startsAt')::timestamptz;
      if starts is null or starts < now() or starts > now()+interval '5 years' or char_length(coalesce(p_payload->>'place',''))>240 then
        raise exception using errcode='22023',message='invalid_session'; end if;
    else
      choices:=p_payload->'options';
      if choices is null or jsonb_typeof(choices)<>'array' then
        raise exception using errcode='22023',message='invalid_options'; end if;
      if jsonb_array_length(choices) not between 2 and 8 or exists(
        select 1 from jsonb_array_elements(choices) o where jsonb_typeof(o)<>'string' or char_length(btrim(o#>>'{}')) not between 1 and 120
      ) or (select count(distinct lower(btrim(o))) from jsonb_array_elements_text(choices) o)<>jsonb_array_length(choices) then
        raise exception using errcode='22023',message='invalid_options'; end if;
    end if;
    if (select count(*) from public.artist_group_tools_v1 where group_id=p_group_id and created_at>now()-interval '1 day')>=100 then
      raise exception using errcode='54000',message='group_tools_daily_limit'; end if;
    insert into public.artist_group_tools_v1(id,group_id,created_by,kind,title,starts_at,place,options,create_request)
    values(p_item_id,p_group_id,actor,item_kind,label,starts,case when item_kind='session' then nullif(btrim(p_payload->>'place'),'') end,choices,p_payload);
  else
    select * into item from public.artist_group_tools_v1 where id=p_item_id and group_id=p_group_id for update;
    if not found then raise exception using errcode='42501',message='tool_not_accessible'; end if;
    if p_action in ('close','cancel') then
      if item.created_by is distinct from actor and public.artist_group_authority_v1(p_group_id,actor) not in ('owner','admin') then
        raise exception using errcode='42501',message='tool_manage_denied'; end if;
      update public.artist_group_tools_v1 set status=case when p_action='close' then 'closed' else 'cancelled' end,closed_at=now()
      where id=p_item_id and status='open';
    elsif p_action='respond' then
      if item.status<>'open' then raise exception using errcode='55000',message='tool_closed'; end if;
      if item.kind='decision' then
        selected:=(p_payload->>'choice')::integer;
        if selected is null or selected<0 or selected>=jsonb_array_length(item.options) then
          raise exception using errcode='22023',message='invalid_choice'; end if;
      else
        if item.starts_at<now() then raise exception using errcode='55000',message='session_started'; end if;
        if jsonb_typeof(p_payload->'attending') is distinct from 'boolean' then
          raise exception using errcode='22023',message='invalid_attendance'; end if;
        attendance:=(p_payload->>'attending')::boolean;
      end if;
      insert into public.artist_group_tool_responses_v1(item_id,group_id,profile_id,choice,attending)
      values(p_item_id,p_group_id,actor,selected,attendance)
      on conflict(item_id,profile_id) do update set choice=excluded.choice,attending=excluded.attending,updated_at=now();
    else raise exception using errcode='22023',message='invalid_tool_action'; end if;
  end if;
  return jsonb_build_object('id',p_item_id,'ok',true);
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_send_message_v1(p_room_id uuid, p_content text, p_client_request_id uuid)
 RETURNS room_messages_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms_v2%rowtype;
  v_content text := btrim(coalesce(p_content, ''));
  v_room_delay integer := 0;
  v_user_delay integer := 0;
  v_effective_delay integer := 0;
  v_last_message_at timestamptz;
  v_remaining_seconds integer;
  v_message public.room_messages_v2%rowtype;
  v_existing_message_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'CLASSE_AUTH_REQUIRED';
  end if;
  if p_room_id is null or p_client_request_id is null
     or length(v_content) not between 1 and 1000 then
    raise exception using errcode = '22023', message = 'CLASSE_MESSAGE_INVALID';
  end if;
  select room.* into v_room from public.rooms_v2 room where room.id = p_room_id;
  if not found or v_room.type <> 'classe' then
    raise exception using errcode = 'P0002', message = 'CLASSE_ROOM_NOT_FOUND';
  end if;
  if v_room.status <> 'live' then
    raise exception using errcode = 'P0001', message = 'CLASSE_ROOM_NOT_LIVE';
  end if;
  if not public.rooms_classe_current_user_is_member_v1(p_room_id) then
    raise exception using errcode = '42501', message = 'CLASSE_ACTIVE_MEMBER_REQUIRED';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_room_id::text || ':' || v_user_id::text, 1)
  );
  select request.message_id into v_existing_message_id
  from public.room_classe_message_requests_v1 request
  where request.room_id = p_room_id
    and request.user_id = v_user_id
    and request.client_request_id = p_client_request_id;
  if found then
    if v_existing_message_id is null then
      raise exception using errcode = 'P0001',
        message = 'CLASSE_MESSAGE_REQUEST_TOMBSTONED';
    end if;
    select message.* into v_message
    from public.room_messages_v2 message
    where message.id = v_existing_message_id;
    if found then return v_message; end if;
    -- The FK normally makes this branch unreachable.  It also fails closed if
    -- a concurrent moderation delete becomes visible between both statements.
    raise exception using errcode = 'P0001',
      message = 'CLASSE_MESSAGE_REQUEST_TOMBSTONED';
  end if;

  v_room_delay := greatest(coalesce(v_room.slow_mode_delay, 0), 0);
  select coalesce(slow.delay_seconds, 0) into v_user_delay
  from public.room_user_slow_modes_v2 slow
  where slow.room_id = p_room_id and slow.user_id = v_user_id
    and slow.delay_seconds > 0
    and (slow.expires_at is null or slow.expires_at > clock_timestamp())
  order by slow.updated_at desc limit 1;
  v_effective_delay := greatest(v_room_delay, coalesce(v_user_delay, 0));
  if v_effective_delay > 0 then
    select max(message.created_at) into v_last_message_at
    from public.room_messages_v2 message
    where message.room_id = p_room_id and message.user_id = v_user_id
      and not message.is_system;
    if v_last_message_at is not null
       and v_last_message_at > clock_timestamp()
         - make_interval(secs => v_effective_delay) then
      v_remaining_seconds := greatest(
        1,
        ceil(extract(epoch from (
          v_last_message_at + make_interval(secs => v_effective_delay)
          - clock_timestamp()
        )))::integer
      );
      raise exception using errcode = 'P0001',
        message = 'CLASSE_MESSAGE_SLOW_MODE',
        detail = v_remaining_seconds::text;
    end if;
  end if;

  insert into public.room_messages_v2(
    room_id, user_id, content, created_at
  ) values (
    p_room_id, v_user_id, v_content, clock_timestamp()
  ) returning * into v_message;
  insert into public.room_classe_message_requests_v1(
    room_id, user_id, client_request_id, message_id
  ) values (
    p_room_id, v_user_id, p_client_request_id, v_message.id
  );
  return v_message;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_delete_message_v2(p_room_id uuid, p_message_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.rooms_assert_room_host_v2(p_room_id);

  delete from public.room_messages_v2
  where room_id = p_room_id
    and id = p_message_id;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_pin_message_item_v2(p_room_id uuid, p_message_id uuid, p_expiration_seconds integer DEFAULT NULL::integer)
 RETURNS room_pinned_items_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_message public.room_messages_v2%rowtype;
  v_item public.room_pinned_items_v2%rowtype;
  v_expires_at timestamp with time zone;
begin
  perform public.rooms_assert_room_host_v2(p_room_id);

  select *
    into v_message
  from public.room_messages_v2
  where id = p_message_id
    and room_id = p_room_id;

  if not found then
    raise exception 'Message not found.';
  end if;

  if p_expiration_seconds is not null and p_expiration_seconds not in (30, 60, 300, 900) then
    raise exception 'Invalid pinned item expiration.';
  end if;

  if p_expiration_seconds is not null then
    v_expires_at := now() + make_interval(secs => p_expiration_seconds);
  end if;

  update public.room_pinned_items_v2
  set
    is_active = false,
    updated_at = now()
  where room_id = p_room_id
    and is_active = true;

  insert into public.room_pinned_items_v2 (
    room_id,
    host_id,
    source_message_id,
    source_user_id,
    content,
    expires_at
  )
  values (
    p_room_id,
    auth.uid(),
    v_message.id,
    v_message.user_id,
    v_message.content,
    v_expires_at
  )
  returning * into v_item;

  return v_item;
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

CREATE OR REPLACE FUNCTION public.rooms_send_message_v2(p_room_id uuid, p_content text)
 RETURNS room_messages_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms_v2%rowtype;
  v_content text := btrim(coalesce(p_content, ''));
  v_room_delay integer := 0;
  v_user_delay integer := 0;
  v_effective_delay integer := 0;
  v_last_message_at timestamptz;
  v_remaining_seconds integer;
  v_message public.room_messages_v2%rowtype;
begin
  if v_user_id is null then raise exception 'Non authentifie'; end if;
  if length(v_content) = 0 then raise exception 'Message vide'; end if;
  if length(v_content) > 1000 then raise exception 'Message trop long'; end if;

  select room.* into v_room from public.rooms_v2 room where room.id = p_room_id;
  if not found or v_room.status = 'ended' then raise exception 'Room terminee'; end if;
  if v_room.type = 'classe' then
    raise exception using errcode = '42501', message = 'CLASSE_IDEMPOTENT_CHAT_REQUIRED';
  end if;
  if exists (
    select 1 from public.room_bans_v2 ban
    where ban.room_id = p_room_id and ban.user_id = v_user_id
  ) then raise exception 'Acces refuse a cette room'; end if;
  if not exists (
    select 1 from public.room_participants_v2 participant
    where participant.room_id = p_room_id
      and participant.user_id = v_user_id and participant.left_at is null
  ) then raise exception 'Tu n''es plus dans cette room'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_room_id::text || ':' || v_user_id::text, 1)
  );
  v_room_delay := greatest(coalesce(v_room.slow_mode_delay, 0), 0);
  select coalesce(slow.delay_seconds, 0) into v_user_delay
  from public.room_user_slow_modes_v2 slow
  where slow.room_id = p_room_id and slow.user_id = v_user_id
    and slow.delay_seconds > 0
    and (slow.expires_at is null or slow.expires_at > clock_timestamp())
  order by slow.updated_at desc limit 1;
  v_effective_delay := greatest(v_room_delay, coalesce(v_user_delay, 0));
  if v_effective_delay > 0 then
    select max(message.created_at) into v_last_message_at
    from public.room_messages_v2 message
    where message.room_id = p_room_id and message.user_id = v_user_id
      and not message.is_system;
    if v_last_message_at is not null
       and v_last_message_at > clock_timestamp()
         - make_interval(secs => v_effective_delay) then
      v_remaining_seconds := greatest(
        1,
        ceil(extract(epoch from (
          v_last_message_at + make_interval(secs => v_effective_delay)
          - clock_timestamp()
        )))::integer
      );
      raise exception 'Slow mode actif. Attends %s.', v_remaining_seconds;
    end if;
  end if;
  insert into public.room_messages_v2(room_id, user_id, content, created_at)
  values (p_room_id, v_user_id, v_content, clock_timestamp())
  returning * into v_message;
  return v_message;
end;
$function$
