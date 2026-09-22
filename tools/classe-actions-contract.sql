CREATE OR REPLACE FUNCTION public.rooms_classe_cancel_floor_v1(p_request_id uuid)
 RETURNS room_classe_floor_requests_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room_id uuid;
  v_request public.room_classe_floor_requests_v1%rowtype;
  v_was_granted boolean;
begin
  select request.room_id into v_room_id
  from public.room_classe_floor_requests_v1 request
  where request.id = p_request_id and request.user_id = auth.uid();
  if not found then
    raise exception using errcode = 'P0002', message = 'CLASSE_FLOOR_REQUEST_NOT_FOUND';
  end if;
  perform public.rooms_classe_assert_live_v1(v_room_id, false);
  perform 1 from public.room_classe_settings_v1 where room_id = v_room_id for update;
  select request.* into v_request
  from public.room_classe_floor_requests_v1 request
  where request.id = p_request_id and request.user_id = auth.uid()
  for update;
  if v_request.status = 'ended' then return v_request; end if;
  if v_request.status not in ('requested', 'granted') then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_REQUEST_NOT_CANCELLABLE';
  end if;
  v_was_granted := v_request.status = 'granted';

  update public.room_classe_floor_requests_v1
  set status = 'ended', ended_at = now(), ended_by = auth.uid(),
      end_reason = 'student_cancelled', revision = revision + 1
  where id = p_request_id returning * into v_request;
  update public.room_classe_settings_v1
  set access_generation = access_generation + 1
  where room_id = v_room_id;
  perform public.rooms_classe_emit_v1(
    v_room_id, 'classe.floor.cancelled',
    case when v_was_granted then 'room' else 'host' end,
    null,
    jsonb_build_object('request_id', v_request.id, 'user_id', v_request.user_id),
    null, now()
  );
  if not v_was_granted then
    perform public.rooms_classe_emit_v1(
      v_room_id, 'classe.floor.changed', 'user', v_request.user_id,
      jsonb_build_object(
        'request_id', v_request.id,
        'revision', v_request.revision
      ), null, now()
    );
  end if;
  return v_request;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_grant_floor_v1(p_request_id uuid)
 RETURNS room_classe_floor_requests_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room_id uuid;
  v_request public.room_classe_floor_requests_v1%rowtype;
  v_previous public.room_classe_floor_requests_v1%rowtype;
  v_target_user_id uuid;
begin
  select request.room_id, request.user_id into v_room_id, v_target_user_id
  from public.room_classe_floor_requests_v1 request where request.id = p_request_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'CLASSE_FLOOR_REQUEST_NOT_FOUND';
  end if;
  perform public.rooms_classe_assert_live_v1(v_room_id, true);
  perform 1 from public.room_classe_settings_v1 where room_id = v_room_id for update;
  perform 1 from public.room_classe_participations_v1 participation
  where participation.room_id = v_room_id and participation.user_id = v_target_user_id
  for update;
  if exists (
    select 1 from public.room_classe_participations_v1 participation
    where participation.room_id = v_room_id and participation.user_id = v_target_user_id
      and participation.status in ('applied', 'backstage', 'onstage')
  ) then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_CONFLICTS_WITH_PARTICIPATION';
  end if;
  perform 1 from public.room_classe_floor_requests_v1 request
  where request.room_id = v_room_id
    and (request.id = p_request_id or request.status = 'granted')
  order by request.id for update;
  select request.* into v_request
  from public.room_classe_floor_requests_v1 request where request.id = p_request_id;
  if v_request.status = 'granted' then return v_request; end if;
  if v_request.status <> 'requested' then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_REQUEST_NOT_GRANTABLE';
  end if;
  if not exists (
    select 1 from public.room_participants_v2 participant
    where participant.room_id = v_room_id and participant.user_id = v_request.user_id
      and participant.left_at is null
  ) or exists (
    select 1 from public.room_bans_v2 ban
    where ban.room_id = v_room_id and ban.user_id = v_request.user_id
  ) then
    raise exception using errcode = '42501', message = 'CLASSE_FLOOR_STUDENT_UNAVAILABLE';
  end if;

  select request.* into v_previous
  from public.room_classe_floor_requests_v1 request
  where request.room_id = v_room_id and request.status = 'granted'
    and request.id <> p_request_id;
  if found then
    update public.room_classe_floor_requests_v1
    set status = 'ended', ended_at = now(), ended_by = auth.uid(),
        end_reason = 'speaker_replaced', revision = revision + 1
    where id = v_previous.id;
    perform public.rooms_classe_emit_v1(
      v_room_id, 'classe.floor.released', 'room', null,
      jsonb_build_object(
        'request_id', v_previous.id,
        'user_id', v_previous.user_id,
        'reason', 'speaker_replaced'
      ),
      v_previous.user_id, now()
    );
  end if;

  update public.room_classe_floor_requests_v1
  set status = 'granted', granted_at = now(), revision = revision + 1
  where id = p_request_id returning * into v_request;
  update public.room_classe_settings_v1
  set access_generation = access_generation + 1
  where room_id = v_room_id;
  perform public.rooms_classe_emit_v1(
    v_room_id, 'classe.floor.granted', 'room', null,
    jsonb_build_object(
      'request_id', v_request.id,
      'user_id', v_request.user_id,
      'reason', v_request.reason,
      'revision', v_request.revision
    ), v_request.user_id, now()
  );
  return v_request;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_profile_projection_v1(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'user_id', p_user_id,
    'username', coalesce(profile.username, 'meewaver'),
    'avatar_url', coalesce(profile.profile_image_url, profile.avatar_url),
    'artist_type', profile.artist_type
  )
  from (values (p_user_id)) as requested(id)
  left join public.profiles profile on profile.id = requested.id;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_set_hands_open_v1(p_room_id uuid, p_hands_open boolean)
 RETURNS room_classe_settings_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_settings public.room_classe_settings_v1%rowtype;
  v_request_id uuid;
begin
  perform public.rooms_classe_assert_live_v1(p_room_id, true);
  if p_hands_open is null then
    raise exception using errcode = '22023', message = 'CLASSE_SETTINGS_INVALID';
  end if;
  select * into v_settings from public.room_classe_settings_v1
    where room_id = p_room_id for update;
  if v_settings.hands_open = p_hands_open then return v_settings; end if;
  update public.room_classe_settings_v1
    set hands_open = p_hands_open, revision = revision + 1
    where room_id = p_room_id returning * into v_settings;
  -- Même verrou Room que request_floor : aucune demande ne passe pendant la fermeture.
  -- La parole déjà accordée reste active, seules les demandes en attente sont retirées.
  if not p_hands_open then
    for v_request_id in select id from public.room_classe_floor_requests_v1
      where room_id = p_room_id and status = 'requested' order by id
    loop
      perform public.rooms_classe_dismiss_floor_v1(v_request_id, 'Demandes de parole fermées par le professeur.');
    end loop;
  end if;
  perform public.rooms_classe_emit_v1(p_room_id, 'classe.settings.changed', 'room', null,
    jsonb_build_object('hands_open', p_hands_open, 'revision', v_settings.revision), null, now());
  return v_settings;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_toggle_question_like_v1(p_question_id uuid, p_should_like boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room_id uuid;
  v_question public.room_classe_questions_v1%rowtype;
  v_has_liked boolean;
  v_limit public.room_classe_question_like_limits_v1%rowtype;
  v_now timestamptz;
  v_changed_rows integer := 0;
begin
  select question.room_id into v_room_id from public.room_classe_questions_v1 question
  where question.id = p_question_id;
  if not found then raise exception using errcode = 'P0002', message = 'CLASSE_QUESTION_NOT_FOUND'; end if;
  perform public.rooms_classe_assert_live_v1(v_room_id, false);
  if not public.rooms_classe_current_user_is_member_v1(v_room_id) then
    raise exception using errcode = '42501', message = 'CLASSE_ACTIVE_MEMBER_REQUIRED';
  end if;
  if p_should_like is null then
    raise exception using errcode = '22023', message = 'CLASSE_QUESTION_LIKE_INVALID';
  end if;
  select question.* into v_question from public.room_classe_questions_v1 question
  where question.id = p_question_id for update;
  if v_question.status <> 'open' or v_question.user_id = auth.uid() then
    raise exception using errcode = '42501', message = 'CLASSE_QUESTION_LIKE_DENIED';
  end if;
  select exists (
    select 1 from public.room_classe_question_likes_v1 like_row
    where like_row.question_id = p_question_id and like_row.user_id = auth.uid()
  ) into v_has_liked;
  -- Desired-state retries are free.  Only an effective toggle consumes the
  -- per-user/question budget and creates a public invalidation.
  if v_has_liked = p_should_like then
    return jsonb_build_object(
      'question_id', v_question.id,
      'like_count', v_question.like_count,
      'current_user_has_liked', v_has_liked,
      'revision', v_question.revision
    );
  end if;

  v_now := clock_timestamp();
  select limit_row.* into v_limit
  from public.room_classe_question_like_limits_v1 limit_row
  where limit_row.question_id = p_question_id and limit_row.user_id = auth.uid()
  for update;
  if found and v_limit.last_changed_at > v_now - interval '1 second' then
    raise exception using errcode = 'P0001', message = 'CLASSE_QUESTION_LIKE_RATE_LIMITED';
  end if;
  if found and v_limit.window_started_at > v_now - interval '1 hour'
     and v_limit.change_count >= 60 then
    raise exception using errcode = 'P0001', message = 'CLASSE_QUESTION_LIKE_QUOTA_REACHED';
  end if;
  if p_should_like then
    insert into public.room_classe_question_likes_v1(question_id, user_id, created_at)
    values (p_question_id, auth.uid(), v_now) on conflict do nothing;
    get diagnostics v_changed_rows = row_count;
  else
    delete from public.room_classe_question_likes_v1
    where question_id = p_question_id and user_id = auth.uid();
    get diagnostics v_changed_rows = row_count;
  end if;
  select exists (
    select 1 from public.room_classe_question_likes_v1 like_row
    where like_row.question_id = p_question_id and like_row.user_id = auth.uid()
  ) into v_has_liked;
  if v_changed_rows > 0 then
    insert into public.room_classe_question_like_limits_v1(
      question_id, user_id, last_changed_at, window_started_at, change_count
    ) values (
      p_question_id, auth.uid(), v_now, v_now, 1
    ) on conflict (question_id, user_id) do update
      set last_changed_at = excluded.last_changed_at,
          window_started_at = case
            when public.room_classe_question_like_limits_v1.window_started_at
                   <= excluded.last_changed_at - interval '1 hour'
              then excluded.last_changed_at
            else public.room_classe_question_like_limits_v1.window_started_at
          end,
          change_count = case
            when public.room_classe_question_like_limits_v1.window_started_at
                   <= excluded.last_changed_at - interval '1 hour'
              then 1
            else public.room_classe_question_like_limits_v1.change_count + 1
          end;
    update public.room_classe_questions_v1
    set like_count = (
          select count(*)::integer from public.room_classe_question_likes_v1 like_row
          where like_row.question_id = p_question_id
        ),
        revision = revision + 1
    where id = p_question_id returning * into v_question;
    perform public.rooms_classe_emit_v1(
      v_room_id, 'classe.question.like_changed', 'room', null,
      jsonb_build_object(
        'question_id', v_question.id,
        'like_count', v_question.like_count,
        'revision', v_question.revision
      ), null, now()
    );
  end if;
  return jsonb_build_object(
    'question_id', v_question.id,
    'like_count', v_question.like_count,
    'current_user_has_liked', v_has_liked,
    'revision', v_question.revision
  );
end;
$function$
