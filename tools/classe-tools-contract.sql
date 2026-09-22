CREATE OR REPLACE FUNCTION public.rooms_classe_host_state_v1(p_room_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms_v2%rowtype;
  v_settings public.room_classe_settings_v1%rowtype;
  v_sequence bigint;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'CLASSE_AUTH_REQUIRED';
  end if;
  select room.* into v_room from public.rooms_v2 room
  where room.id = p_room_id and room.type = 'classe';
  if not found then raise exception using errcode = 'P0002', message = 'CLASSE_ROOM_NOT_FOUND'; end if;
  if v_room.host_id <> v_user_id then
    raise exception using errcode = '42501', message = 'CLASSE_HOST_REQUIRED';
  end if;
  select * into v_settings from public.room_classe_settings_v1 where room_id = p_room_id;
  select coalesce(max(event.sequence), 0) into v_sequence
  from public.room_classe_events_v1 event where event.room_id = p_room_id;

  return jsonb_build_object(
    'state_revision', v_sequence,
    'room', jsonb_build_object(
      'id', v_room.id,
      'host_id', v_room.host_id,
      'title', v_room.title,
      'status', v_room.status,
      'applications_open', v_settings.applications_open,
      'hands_open', v_settings.hands_open,
      'questions_open', v_settings.questions_open,
      'media_consent_version', v_settings.media_consent_version,
      'max_pending_applications', v_settings.max_pending_applications,
      'max_backstage', v_settings.max_backstage,
      'max_onstage', v_settings.max_onstage,
      'access_generation', v_settings.access_generation,
      'settings_revision', v_settings.revision
    ),
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', participation.id,
        'user', public.rooms_classe_profile_projection_v1(participation.user_id),
        'source', participation.source,
        'status', participation.status,
        'application_reason', participation.application_reason,
        'camera_ready', participation.camera_ready,
        'microphone_ready', participation.microphone_ready,
        'media_ready_at', participation.media_ready_at,
        'applied_at', participation.applied_at,
        'revision', participation.revision
      ) order by participation.applied_at)
      from public.room_classe_participations_v1 participation
      where participation.room_id = p_room_id and participation.status = 'applied'
    ), '[]'::jsonb),
    'invitations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', participation.id,
        'user', public.rooms_classe_profile_projection_v1(participation.user_id),
        'source', participation.source,
        'status', participation.status,
        'invited_at', participation.invited_at,
        'revision', participation.revision
      ) order by participation.invited_at)
      from public.room_classe_participations_v1 participation
      where participation.room_id = p_room_id and participation.status = 'invited'
    ), '[]'::jsonb),
    'backstage', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', participation.id,
        'user', public.rooms_classe_profile_projection_v1(participation.user_id),
        'source', participation.source,
        'status', participation.status,
        'camera_ready', participation.camera_ready,
        'microphone_ready', participation.microphone_ready,
        'backstage_at', participation.backstage_at,
        'revision', participation.revision
      ) order by participation.backstage_at)
      from public.room_classe_participations_v1 participation
      where participation.room_id = p_room_id and participation.status = 'backstage'
    ), '[]'::jsonb),
    'onstage', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', participation.id,
        'user', public.rooms_classe_profile_projection_v1(participation.user_id),
        'source', participation.source,
        'status', participation.status,
        'onstage_at', participation.onstage_at,
        'revision', participation.revision
      ) order by participation.onstage_at)
      from public.room_classe_participations_v1 participation
      where participation.room_id = p_room_id and participation.status = 'onstage'
    ), '[]'::jsonb),
    'floor_requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', request.id,
        'user', public.rooms_classe_profile_projection_v1(request.user_id),
        'reason', request.reason,
        'status', request.status,
        'requested_at', request.requested_at,
        'granted_at', request.granted_at,
        'revision', request.revision
      ) order by (request.status = 'granted') desc, request.requested_at)
      from public.room_classe_floor_requests_v1 request
      where request.room_id = p_room_id and request.status in ('requested', 'granted')
    ), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', question.id,
        'user', public.rooms_classe_profile_projection_v1(question.user_id),
        'body', question.body,
        'status', question.status,
        'like_count', question.like_count,
        'current_user_has_liked', exists (
          select 1 from public.room_classe_question_likes_v1 like_row
          where like_row.question_id = question.id and like_row.user_id = v_user_id
        ),
        'created_at', question.created_at,
        'revision', question.revision
      ) order by question.like_count desc, question.created_at)
      from public.room_classe_questions_v1 question
      where question.room_id = p_room_id and question.status = 'open'
    ), '[]'::jsonb),
    'course', public.rooms_classe_course_projection_v1(p_room_id)
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_release_floor_v1(p_request_id uuid, p_reason text DEFAULT 'host_released'::text)
 RETURNS room_classe_floor_requests_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room_id uuid;
  v_room public.rooms_v2%rowtype;
  v_request public.room_classe_floor_requests_v1%rowtype;
  v_reason text := coalesce(nullif(btrim(p_reason), ''), 'host_released');
begin
  select request.room_id into v_room_id
  from public.room_classe_floor_requests_v1 request where request.id = p_request_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'CLASSE_FLOOR_REQUEST_NOT_FOUND';
  end if;
  v_room := public.rooms_classe_assert_live_v1(v_room_id, false);
  if length(v_reason) > 280 then
    raise exception using errcode = '22023', message = 'CLASSE_FLOOR_REASON_INVALID';
  end if;
  if v_room.host_id <> auth.uid() and not exists (
    select 1 from public.room_classe_floor_requests_v1 request
    where request.id = p_request_id and request.user_id = auth.uid()
  ) then
    raise exception using errcode = '42501', message = 'CLASSE_FLOOR_RELEASE_DENIED';
  end if;
  perform 1 from public.room_classe_settings_v1 where room_id = v_room_id for update;
  select request.* into v_request from public.room_classe_floor_requests_v1 request
  where request.id = p_request_id for update;
  if v_request.status = 'ended' then return v_request; end if;
  if v_request.status <> 'granted' then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_NOT_GRANTED';
  end if;
  update public.room_classe_floor_requests_v1
  set status = 'ended', ended_at = now(), ended_by = auth.uid(),
      end_reason = v_reason, revision = revision + 1
  where id = p_request_id returning * into v_request;
  update public.room_classe_settings_v1
  set access_generation = access_generation + 1 where room_id = v_room_id;
  perform public.rooms_classe_emit_v1(
    v_room_id, 'classe.floor.released', 'room', null,
    jsonb_build_object('request_id', v_request.id, 'user_id', v_request.user_id, 'reason', v_reason),
    v_request.user_id, now()
  );
  return v_request;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_request_floor_v1(p_room_id uuid, p_microphone_ready boolean, p_audio_consent boolean, p_consent_version text, p_client_request_id uuid)
 RETURNS room_classe_floor_requests_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room public.rooms_v2%rowtype;
  v_settings public.room_classe_settings_v1%rowtype;
  v_request public.room_classe_floor_requests_v1%rowtype;
begin
  v_room := public.rooms_classe_assert_live_v1(p_room_id, false);
  if v_room.host_id = auth.uid() then
    raise exception using errcode = '42501', message = 'CLASSE_HOST_CANNOT_REQUEST_FLOOR';
  end if;
  if not public.rooms_classe_current_user_is_member_v1(p_room_id) then
    raise exception using errcode = '42501', message = 'CLASSE_ACTIVE_MEMBER_REQUIRED';
  end if;
  select * into v_settings from public.room_classe_settings_v1
  where room_id = p_room_id for update;
  perform 1 from public.room_classe_participations_v1 participation
  where participation.room_id = p_room_id and participation.user_id = auth.uid()
  for update;
  if exists (
    select 1 from public.room_classe_participations_v1 participation
    where participation.room_id = p_room_id and participation.user_id = auth.uid()
      and participation.status in ('applied', 'backstage', 'onstage')
  ) then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_CONFLICTS_WITH_PARTICIPATION';
  end if;
  if p_client_request_id is null then
    raise exception using errcode = '22023', message = 'CLASSE_FLOOR_REQUEST_INVALID';
  end if;
  if not coalesce(p_microphone_ready, false)
     or not coalesce(p_audio_consent, false)
     or p_consent_version is distinct from v_settings.media_consent_version then
    raise exception using errcode = '22023', message = 'CLASSE_AUDIO_PREPARATION_REQUIRED';
  end if;

  select request.* into v_request
  from public.room_classe_floor_requests_v1 request
  where request.room_id = p_room_id
    and request.user_id = auth.uid()
    and request.client_request_id = p_client_request_id;
  if found then return v_request; end if;

  if not v_settings.hands_open then
    raise exception using errcode = 'P0001', message = 'CLASSE_HANDS_CLOSED';
  end if;

  if (
    select count(*) from public.room_classe_floor_requests_v1 request
    where request.room_id = p_room_id
      and request.user_id = auth.uid()
      and request.requested_at > clock_timestamp() - interval '1 hour'
  ) >= 20 then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_REQUEST_QUOTA_REACHED';
  end if;

  if exists (
    select 1 from public.room_classe_floor_requests_v1 request
    where request.room_id = p_room_id and request.user_id = auth.uid()
      and request.status in ('requested', 'granted')
  ) then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_REQUEST_ALREADY_ACTIVE';
  end if;
  if exists (
    select 1 from public.room_classe_floor_requests_v1 request
    where request.room_id = p_room_id and request.user_id = auth.uid()
      and request.status in ('ended', 'dismissed')
      and request.updated_at > now() - interval '3 seconds'
  ) then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_REQUEST_RATE_LIMITED';
  end if;
  if (
    select count(*) from public.room_classe_floor_requests_v1 request
    where request.room_id = p_room_id and request.status in ('requested', 'granted')
  ) >= 100 then
    raise exception using errcode = 'P0001', message = 'CLASSE_FLOOR_QUEUE_FULL';
  end if;

  insert into public.room_classe_floor_requests_v1(
    room_id, user_id, status, microphone_ready, audio_consent,
    consent_version, consent_granted_at, client_request_id
  ) values (
    p_room_id, auth.uid(), 'requested', true, true,
    p_consent_version, now(), p_client_request_id
  ) returning * into v_request;

  perform public.rooms_classe_emit_v1(
    p_room_id, 'classe.floor.requested', 'host', null,
    jsonb_build_object(
      'request_id', v_request.id,
      'user_id', v_request.user_id,
      'revision', v_request.revision
    ), v_room.host_id, now()
  );
  perform public.rooms_classe_emit_v1(
    p_room_id, 'classe.floor.changed', 'user', v_request.user_id,
    jsonb_build_object(
      'request_id', v_request.id,
      'revision', v_request.revision
    ), null, now()
  );
  return v_request;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_request_floor_v1(p_room_id uuid, p_reason text, p_microphone_ready boolean, p_audio_consent boolean, p_consent_version text, p_client_request_id uuid)
 RETURNS room_classe_floor_requests_v1
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select public.rooms_classe_request_floor_v1(p_room_id,p_microphone_ready,p_audio_consent,p_consent_version,p_client_request_id);
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_submit_question_v1(p_room_id uuid, p_body text, p_client_request_id uuid)
 RETURNS room_classe_questions_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room public.rooms_v2%rowtype;
  v_settings public.room_classe_settings_v1%rowtype;
  v_question public.room_classe_questions_v1%rowtype;
  v_body text := btrim(coalesce(p_body, ''));
begin
  v_room := public.rooms_classe_assert_live_v1(p_room_id, false);
  if not public.rooms_classe_current_user_is_member_v1(p_room_id) then
    raise exception using errcode = '42501', message = 'CLASSE_ACTIVE_MEMBER_REQUIRED';
  end if;
  select * into v_settings from public.room_classe_settings_v1
  where room_id = p_room_id for update;
  if not v_settings.questions_open then
    raise exception using errcode = 'P0001', message = 'CLASSE_QUESTIONS_CLOSED';
  end if;
  if p_client_request_id is null or length(v_body) not between 1 and 500 then
    raise exception using errcode = '22023', message = 'CLASSE_QUESTION_INVALID';
  end if;
  select question.* into v_question from public.room_classe_questions_v1 question
  where question.room_id = p_room_id and question.user_id = auth.uid()
    and question.client_request_id = p_client_request_id;
  if found then return v_question; end if;
  if (
    select count(*) from public.room_classe_questions_v1 question
    where question.room_id = p_room_id
      and question.user_id = auth.uid()
      and question.created_at > clock_timestamp() - interval '1 hour'
  ) >= 20 then
    raise exception using errcode = 'P0001', message = 'CLASSE_QUESTION_QUOTA_REACHED';
  end if;
  if (
    select count(*) from public.room_classe_questions_v1 question
    where question.room_id = p_room_id and question.user_id = auth.uid()
      and question.status = 'open'
  ) >= 1 then
    raise exception using errcode = 'P0001', message = 'CLASSE_QUESTION_USER_LIMIT';
  end if;
  if (
    select count(*) from public.room_classe_questions_v1 question
    where question.room_id = p_room_id and question.status = 'open'
  ) >= 100 then
    raise exception using errcode = 'P0001', message = 'CLASSE_QUESTION_ROOM_LIMIT';
  end if;
  if exists (
    select 1 from public.room_classe_questions_v1 question
    where question.room_id = p_room_id and question.user_id = auth.uid()
      and question.created_at > now() - interval '3 seconds'
  ) then
    raise exception using errcode = 'P0001', message = 'CLASSE_QUESTION_RATE_LIMITED';
  end if;
  insert into public.room_classe_questions_v1(
    room_id, user_id, body, client_request_id
  ) values (p_room_id, auth.uid(), v_body, p_client_request_id)
  returning * into v_question;
  perform public.rooms_classe_emit_v1(
    p_room_id, 'classe.question.created', 'room', null,
    jsonb_build_object('question_id', v_question.id, 'revision', v_question.revision),
    v_room.host_id, now()
  );
  return v_question;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_viewer_state_v1(p_room_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms_v2%rowtype;
  v_settings public.room_classe_settings_v1%rowtype;
  v_sequence bigint;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'CLASSE_AUTH_REQUIRED'; end if;
  select room.* into v_room from public.rooms_v2 room
  where room.id = p_room_id and room.type = 'classe';
  if not found then raise exception using errcode = 'P0002', message = 'CLASSE_ROOM_NOT_FOUND'; end if;
  if not (
    (v_room.status = 'live' and public.rooms_classe_current_user_is_member_v1(p_room_id))
    or (
      v_room.status = 'ended'
      and public.rooms_classe_current_user_can_read_events_v1(p_room_id)
    )
  ) then
    raise exception using errcode = '42501', message = 'CLASSE_ACTIVE_MEMBER_REQUIRED';
  end if;
  select * into v_settings from public.room_classe_settings_v1 where room_id = p_room_id;
  -- Match the event RLS cursor.  A periodic Viewer snapshot must not reveal a
  -- Host-only or another user's event merely because the global sequence
  -- advanced; a later visible row remains a valid global backfill cursor.
  select coalesce(max(event.sequence), 0) into v_sequence
  from public.room_classe_events_v1 event
  where event.room_id = p_room_id
    and (
      event.audience = 'room'
      or (event.audience = 'user' and event.target_user_id = v_user_id)
      or (event.audience = 'host' and v_room.host_id = v_user_id)
    );

  return jsonb_build_object(
    'state_revision', v_sequence,
    'room', jsonb_build_object(
      'id', v_room.id,
      'host_id', v_room.host_id,
      'title', v_room.title,
      'status', v_room.status,
      'applications_open', v_settings.applications_open,
      'hands_open', v_settings.hands_open,
      'questions_open', v_settings.questions_open,
      'media_consent_version', v_settings.media_consent_version,
      'max_onstage', v_settings.max_onstage,
      'settings_revision', v_settings.revision
    ),
    'self_participation', (
      select jsonb_build_object(
        'id', participation.id,
        'source', participation.source,
        'status', participation.status,
        'application_reason', participation.application_reason,
        'camera_ready', participation.camera_ready,
        'microphone_ready', participation.microphone_ready,
        'applied_at', participation.applied_at,
        'invited_at', participation.invited_at,
        'backstage_at', participation.backstage_at,
        'onstage_at', participation.onstage_at,
        'revision', participation.revision
      )
      from public.room_classe_participations_v1 participation
      where participation.room_id = p_room_id and participation.user_id = v_user_id
    ),
    'onstage', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', participation.id,
        'user', public.rooms_classe_profile_projection_v1(participation.user_id),
        'status', participation.status,
        'onstage_at', participation.onstage_at,
        'revision', participation.revision
      ) order by participation.onstage_at)
      from public.room_classe_participations_v1 participation
      where participation.room_id = p_room_id and participation.status = 'onstage'
    ), '[]'::jsonb),
    'self_floor_request', (
      select jsonb_build_object(
        'id', request.id,
        'reason', request.reason,
        'status', request.status,
        'requested_at', request.requested_at,
        'granted_at', request.granted_at,
        'revision', request.revision
      )
      from public.room_classe_floor_requests_v1 request
      where request.room_id = p_room_id and request.user_id = v_user_id
        and request.status in ('requested', 'granted')
      order by request.requested_at desc limit 1
    ),
    'floor_speaker', (
      select jsonb_build_object(
        'id', request.id,
        'user', public.rooms_classe_profile_projection_v1(request.user_id),
        'reason', request.reason,
        'status', request.status,
        'granted_at', request.granted_at,
        'revision', request.revision
      )
      from public.room_classe_floor_requests_v1 request
      where request.room_id = p_room_id and request.status = 'granted'
      limit 1
    ),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', question.id,
        'user', public.rooms_classe_profile_projection_v1(question.user_id),
        'body', question.body,
        'status', question.status,
        'like_count', question.like_count,
        'current_user_has_liked', exists (
          select 1 from public.room_classe_question_likes_v1 like_row
          where like_row.question_id = question.id and like_row.user_id = v_user_id
        ),
        'created_at', question.created_at,
        'revision', question.revision
      ) order by question.like_count desc, question.created_at)
      from public.room_classe_questions_v1 question
      where question.room_id = p_room_id and question.status = 'open'
    ), '[]'::jsonb),
    -- A final Viewer snapshot is only an end-state acknowledgement.  Course
    -- assets remain private once the live ends, so do not return durable
    -- object paths that the Viewer can no longer resolve through Storage.
    'course', case
      when v_room.status = 'live'
        then public.rooms_classe_course_projection_v1(p_room_id)
      else null
    end
  );
end;
$function$
