CREATE OR REPLACE FUNCTION public.rooms_classe_accept_applications_v1(p_room_id uuid, p_participation_ids uuid[])
 RETURNS SETOF room_classe_participations_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_settings public.room_classe_settings_v1%rowtype;
  v_id uuid;
  v_row public.room_classe_participations_v1%rowtype;
  v_active_count integer;
  v_new_count integer;
  v_requested_count integer := coalesce(array_length(p_participation_ids, 1), 0);
begin
  perform public.rooms_classe_assert_live_v1(p_room_id, true);
  select * into v_settings from public.room_classe_settings_v1
  where room_id = p_room_id for update;
  if v_requested_count not between 1 and 50
     or (select count(*) from unnest(p_participation_ids) as target(id)) <>
        (select count(distinct id) from unnest(p_participation_ids) as target(id)) then
    raise exception using errcode = '22023', message = 'CLASSE_SELECTION_INVALID';
  end if;

  perform 1 from public.room_classe_participations_v1 participation
  where participation.id = any(p_participation_ids)
  order by participation.id for update;

  if (select count(*) from public.room_classe_participations_v1 participation
      where participation.id = any(p_participation_ids)
        and participation.room_id = p_room_id
        and participation.source = 'application'
        and participation.status in ('applied', 'backstage')) <> v_requested_count then
    raise exception using errcode = 'P0001', message = 'CLASSE_APPLICATION_SELECTION_INVALID';
  end if;

  select count(*) into v_active_count
  from public.room_classe_participations_v1 participation
  where participation.room_id = p_room_id
    and participation.status in ('backstage', 'onstage');
  select count(*) into v_new_count
  from public.room_classe_participations_v1 participation
  where participation.id = any(p_participation_ids)
    and participation.status = 'applied';
  if v_active_count + v_new_count > v_settings.max_backstage then
    raise exception using errcode = 'P0001', message = 'CLASSE_BACKSTAGE_FULL';
  end if;

  foreach v_id in array p_participation_ids loop
    select * into v_row from public.room_classe_participations_v1 where id = v_id;
    if v_row.status = 'applied' then
      perform public.rooms_classe_end_floor_for_user_v1(
        p_room_id, v_row.user_id, 'entered_backstage'
      );
      update public.room_classe_participations_v1
      set status = 'backstage', backstage_at = now(), revision = revision + 1
      where id = v_id returning * into v_row;
      perform public.rooms_classe_upsert_room_member_v1(p_room_id, v_row.user_id, 'guest');
      update public.room_classe_private_rtc_v1
      set access_generation = access_generation + 1 where participation_id = v_id;
      perform public.rooms_classe_emit_v1(
        p_room_id, 'classe.application.accepted', 'user', v_row.user_id,
        jsonb_build_object('participation_id', v_row.id, 'revision', v_row.revision),
        v_row.user_id, now()
      );
      perform public.rooms_classe_emit_v1(
        p_room_id, 'classe.participation.changed', 'host', null,
        jsonb_build_object(
          'participation_id', v_row.id,
          'revision', v_row.revision
        ), null, now()
      );
    end if;
    return next v_row;
  end loop;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_course_projection_v1(p_room_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'id', course.id,
    'title', course.title,
    'subtitle', course.subtitle,
    'duration_minutes', course.duration_minutes,
    'current_page_id', course.current_page_id,
    'revision', course.revision,
    'pages', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', page.id,
          'position', page.position,
          'title', page.title,
          'revision', page.revision,
          'blocks', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', block.id,
                'client_block_id', block.client_block_id,
                'position', block.position,
                'kind', block.kind,
                'text', block.text_content,
                'asset_object_path', block.asset_object_path,
                'link_url', block.link_url,
                'metadata', block.metadata
              ) order by block.position
            )
            from public.room_classe_course_blocks_v1 block
            where block.page_id = page.id
          ), '[]'::jsonb)
        ) order by page.position
      )
      from public.room_classe_course_pages_v1 page
      where page.course_id = course.id
    ), '[]'::jsonb)
  )
  from public.room_classe_courses_v1 course
  where course.room_id = p_room_id;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_invite_v1(p_room_id uuid, p_user_ids uuid[], p_client_request_id uuid)
 RETURNS SETOF room_classe_participations_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room public.rooms_v2%rowtype;
  v_user_id uuid;
  v_participation public.room_classe_participations_v1%rowtype;
  v_request public.room_classe_participation_requests_v1%rowtype;
  v_participation_exists boolean;
  v_invited_count integer;
  v_target_user_ids uuid[];
begin
  v_room := public.rooms_classe_assert_live_v1(p_room_id, true);
  if p_client_request_id is null then
    raise exception using errcode = '22023', message = 'CLASSE_REQUEST_ID_REQUIRED';
  end if;
  if coalesce(array_length(p_user_ids, 1), 0) not between 1 and 50
     or (select count(*) from unnest(p_user_ids) as target(id)) <>
        (select count(distinct id) from unnest(p_user_ids) as target(id)) then
    raise exception using errcode = '22023', message = 'CLASSE_INVITE_TARGETS_INVALID';
  end if;
  select array_agg(target.id order by target.id)
  into v_target_user_ids
  from unnest(p_user_ids) as target(id);
  perform 1 from public.room_classe_settings_v1 settings
  where settings.room_id = p_room_id for update;

  select request.* into v_request
  from public.room_classe_participation_requests_v1 request
  where request.room_id = p_room_id
    and request.actor_id = auth.uid()
    and request.client_request_id = p_client_request_id;
  if found then
    if v_request.operation <> 'invite'
       or v_request.target_user_ids is distinct from v_target_user_ids then
      raise exception using errcode = '22023', message = 'CLASSE_REQUEST_ID_REUSED';
    end if;
    if (
      select count(*)
      from public.room_classe_participations_v1 participation
      where participation.room_id = p_room_id
        and participation.user_id = any(v_target_user_ids)
    ) <> cardinality(v_target_user_ids) then
      raise exception using errcode = 'P0001', message = 'CLASSE_IDEMPOTENCY_STATE_MISSING';
    end if;
    return query
      select participation.*
      from unnest(v_target_user_ids) with ordinality as target(user_id, position)
      join public.room_classe_participations_v1 participation
        on participation.room_id = p_room_id
       and participation.user_id = target.user_id
      order by target.position;
    return;
  end if;

  -- Process the canonical set in a stable order so the first response and an
  -- idempotent replay return rows in the same order.
  foreach v_user_id in array v_target_user_ids loop
    if v_user_id = auth.uid()
       or not exists (select 1 from auth.users account where account.id = v_user_id)
       or (not exists (
         select 1 from public.follows follow
         where follow.follower_id = v_user_id and follow.following_id = auth.uid()
       ) and not exists (
         select 1 from public.room_participants_v2 member
         where member.room_id = p_room_id and member.user_id = v_user_id
           and member.left_at is null
       ))
       or exists (
         select 1 from public.room_bans_v2 ban
         where ban.room_id = p_room_id and ban.user_id = v_user_id
       ) then
      raise exception using errcode = '42501', message = 'CLASSE_INVITE_TARGET_INVALID';
    end if;

    select participation.* into v_participation
    from public.room_classe_participations_v1 participation
    where participation.room_id = p_room_id and participation.user_id = v_user_id
    for update;
    v_participation_exists := found;

    if v_participation_exists
       and v_participation.status in ('applied', 'invited', 'backstage', 'onstage') then
      raise exception using errcode = 'P0001', message = 'CLASSE_PARTICIPATION_ALREADY_ACTIVE';
    end if;
    if v_participation_exists and v_participation.source = 'host_invite'
       and v_participation.invited_at is not null
       and v_participation.invited_at
         > clock_timestamp() - interval '5 minutes' then
      raise exception using errcode = 'P0001', message = 'CLASSE_INVITATION_COOLDOWN';
    end if;

    select count(*) into v_invited_count
    from public.room_classe_participations_v1 participation
    where participation.room_id = p_room_id and participation.status = 'invited';
    if v_invited_count >= 50 then
      raise exception using errcode = 'P0001', message = 'CLASSE_INVITATIONS_FULL';
    end if;

    if v_participation_exists then
      update public.room_classe_participations_v1
      set source = 'host_invite', status = 'invited', application_reason = null,
          camera_ready = false, microphone_ready = false, media_ready_at = null,
          media_consent = false, consent_version = null, consent_granted_at = null,
          client_request_id = p_client_request_id, revision = revision + 1,
          applied_at = null, invited_at = now(), backstage_at = null,
          onstage_at = null, ended_at = null
      where id = v_participation.id returning * into v_participation;
    else
      insert into public.room_classe_participations_v1(
        room_id, user_id, source, status, client_request_id, invited_at
      ) values (
        p_room_id, v_user_id, 'host_invite', 'invited', p_client_request_id, now()
      ) returning * into v_participation;
    end if;

    perform public.rooms_classe_ensure_private_rtc_v1(v_participation.id);
    perform public.rooms_classe_emit_v1(
      p_room_id, 'classe.invitation.created', 'user', v_user_id,
      jsonb_build_object(
        'participation_id', v_participation.id,
        'host_id', v_room.host_id,
        'revision', v_participation.revision
      ), v_user_id, now()
    );
    perform public.rooms_classe_emit_v1(
      p_room_id, 'classe.participation.changed', 'host', null,
      jsonb_build_object(
        'participation_id', v_participation.id,
        'revision', v_participation.revision
      ), null, now()
    );
    return next v_participation;
  end loop;

  insert into public.room_classe_participation_requests_v1(
    room_id, actor_id, client_request_id, operation, target_user_ids
  ) values (
    p_room_id, auth.uid(), p_client_request_id, 'invite', v_target_user_ids
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_reject_applications_v1(p_room_id uuid, p_participation_ids uuid[], p_reason text DEFAULT 'host_rejected'::text)
 RETURNS SETOF room_classe_participations_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid;
  v_row public.room_classe_participations_v1%rowtype;
  v_requested_count integer := coalesce(array_length(p_participation_ids, 1), 0);
begin
  perform public.rooms_classe_assert_live_v1(p_room_id, true);
  if v_requested_count not between 1 and 50
     or length(coalesce(p_reason, '')) > 280
     or (select count(*) from unnest(p_participation_ids) as target(id)) <>
        (select count(distinct id) from unnest(p_participation_ids) as target(id)) then
    raise exception using errcode = '22023', message = 'CLASSE_SELECTION_INVALID';
  end if;
  perform 1 from public.room_classe_participations_v1 participation
  where participation.id = any(p_participation_ids)
  order by participation.id for update;
  if (select count(*) from public.room_classe_participations_v1 participation
      where participation.id = any(p_participation_ids)
        and participation.room_id = p_room_id
        and participation.source = 'application'
        and participation.status in ('applied', 'rejected')) <> v_requested_count then
    raise exception using errcode = 'P0001', message = 'CLASSE_APPLICATION_SELECTION_INVALID';
  end if;

  foreach v_id in array p_participation_ids loop
    select * into v_row from public.room_classe_participations_v1 where id = v_id;
    if v_row.status = 'applied' then
      update public.room_classe_participations_v1
      set status = 'rejected', ended_at = now(), revision = revision + 1
      where id = v_id returning * into v_row;
      update public.room_classe_private_rtc_v1
      set access_generation = access_generation + 1 where participation_id = v_id;
      perform public.rooms_classe_emit_v1(
        p_room_id, 'classe.application.rejected', 'user', v_row.user_id,
        jsonb_build_object(
          'participation_id', v_row.id,
          'reason', coalesce(nullif(btrim(p_reason), ''), 'host_rejected')
        ), v_row.user_id, now()
      );
      perform public.rooms_classe_emit_v1(
        p_room_id, 'classe.participation.changed', 'host', null,
        jsonb_build_object(
          'participation_id', v_row.id,
          'revision', v_row.revision
        ), null, now()
      );
    end if;
    return next v_row;
  end loop;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_reserve_course_asset_v1(p_room_id uuid, p_byte_count bigint, p_mime_type text, p_checksum_sha256 text, p_client_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_mime_type text := lower(btrim(coalesce(p_mime_type, '')));
  v_checksum text := lower(btrim(coalesce(p_checksum_sha256, '')));
  v_extension text;
  v_path text;
  v_existing public.room_classe_course_asset_reservations_v1%rowtype;
  v_room_count integer;
  v_user_count integer;
  v_recent_count integer;
  v_room_bytes bigint;
  v_user_bytes bigint;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'CLASSE_AUTH_REQUIRED';
  end if;
  if p_room_id is null or p_client_request_id is null
     or p_byte_count is null or p_byte_count not between 1 and 104857600
     or v_checksum !~ '^[0-9a-f]{64}$'
     or v_mime_type not in (
       'image/jpeg', 'image/png', 'image/heic',
       'video/mp4', 'video/quicktime', 'application/pdf'
     ) then
    raise exception using errcode = '22023', message = 'CLASSE_ASSET_RESERVATION_INVALID';
  end if;
  v_extension := case v_mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/heic' then 'heic'
    when 'video/mp4' then 'mp4'
    when 'video/quicktime' then 'mov'
    when 'application/pdf' then 'pdf'
  end;
  v_path := p_room_id::text || '/course/' || p_client_request_id::text
    || '-' || left(v_checksum, 16) || '.' || v_extension;

  -- Serialize the cross-Room account cap, then use the normal Room lifecycle
  -- lock.  No other code takes this advisory key while holding a Room lock.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('classe-course-assets:' || v_user_id::text, 3)
  );
  perform public.rooms_classe_assert_live_v1(p_room_id, true);

  select reservation.* into v_existing
  from public.room_classe_course_asset_reservations_v1 reservation
  where reservation.room_id = p_room_id
    and reservation.user_id = v_user_id
    and reservation.client_request_id = p_client_request_id
  for update;
  if found then
    if v_existing.released_at is not null
       or v_existing.cleanup_started_at is not null then
      raise exception using errcode = 'P0001', message = 'CLASSE_ASSET_REQUEST_TOMBSTONED';
    end if;
    if v_existing.byte_count is distinct from p_byte_count
       or v_existing.mime_type is distinct from v_mime_type
       or v_existing.checksum_sha256 is distinct from v_checksum then
      raise exception using errcode = 'P0001', message = 'CLASSE_ASSET_REQUEST_CONFLICT';
    end if;
    return jsonb_build_object(
      'object_path', v_existing.object_path,
      'byte_count', v_existing.byte_count,
      'mime_type', v_existing.mime_type,
      'checksum_sha256', v_existing.checksum_sha256
    );
  end if;

  select count(*), coalesce(sum(reservation.byte_count), 0)
  into v_room_count, v_room_bytes
  from public.room_classe_course_asset_reservations_v1 reservation
  where reservation.room_id = p_room_id and reservation.released_at is null;
  if v_room_count >= 64 or v_room_bytes + p_byte_count > 1073741824 then
    raise exception using errcode = 'P0001', message = 'CLASSE_ASSET_ROOM_QUOTA_REACHED';
  end if;

  select count(*), coalesce(sum(reservation.byte_count), 0)
  into v_user_count, v_user_bytes
  from public.room_classe_course_asset_reservations_v1 reservation
  where reservation.user_id = v_user_id and reservation.released_at is null;
  if v_user_count >= 256 or v_user_bytes + p_byte_count > 4294967296 then
    raise exception using errcode = 'P0001', message = 'CLASSE_ASSET_USER_QUOTA_REACHED';
  end if;
  select count(*) into v_recent_count
  from public.room_classe_course_asset_reservations_v1 reservation
  where reservation.user_id = v_user_id
    and reservation.created_at > clock_timestamp() - interval '24 hours';
  if v_recent_count >= 256 then
    raise exception using errcode = 'P0001', message = 'CLASSE_ASSET_DAILY_QUOTA_REACHED';
  end if;

  insert into public.room_classe_course_asset_reservations_v1(
    room_id, user_id, client_request_id, object_path,
    byte_count, mime_type, checksum_sha256
  ) values (
    p_room_id, v_user_id, p_client_request_id, v_path,
    p_byte_count, v_mime_type, v_checksum
  ) returning * into v_existing;
  insert into public.room_classe_outbox_v1(
    room_id, topic, payload, idempotency_key, available_at, max_attempts
  ) values (
    p_room_id,
    'classe.course.asset.cleanup',
    jsonb_build_object(
      'reservation_id', v_existing.id,
      'room_id', p_room_id,
      'object_path', v_existing.object_path,
      'reason', 'reservation_ttl'
    ),
    'classe-course-asset-cleanup:ttl:' || v_existing.id::text,
    clock_timestamp() + interval '24 hours',
    20
  ) on conflict (idempotency_key) do nothing;
  return jsonb_build_object(
    'object_path', v_existing.object_path,
    'byte_count', v_existing.byte_count,
    'mime_type', v_existing.mime_type,
    'checksum_sha256', v_existing.checksum_sha256
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_update_course_v1(p_room_id uuid, p_title text, p_subtitle text, p_duration_minutes integer, p_expected_revision bigint)
 RETURNS room_classe_courses_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_course public.room_classe_courses_v1%rowtype;
  v_title text := btrim(coalesce(p_title, ''));
begin
  perform public.rooms_classe_assert_live_v1(p_room_id, true);
  select * into v_course from public.room_classe_courses_v1
  where room_id = p_room_id for update;
  if p_expected_revision is null or v_course.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'CLASSE_COURSE_REVISION_CONFLICT';
  end if;
  if length(v_title) not between 1 and 200
     or length(coalesce(p_subtitle, '')) > 500
     or p_duration_minutes is null or p_duration_minutes not between 0 and 1440 then
    raise exception using errcode = '22023', message = 'CLASSE_COURSE_INVALID';
  end if;
  update public.room_classe_courses_v1
  set title = v_title, subtitle = coalesce(p_subtitle, ''),
      duration_minutes = p_duration_minutes, revision = revision + 1
  where id = v_course.id returning * into v_course;
  perform public.rooms_classe_emit_v1(
    p_room_id, 'classe.course.updated', 'room', null,
    jsonb_build_object('course_id', v_course.id, 'revision', v_course.revision), null, now()
  );
  return v_course;
end;
$function$
