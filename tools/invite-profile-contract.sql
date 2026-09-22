CREATE OR REPLACE FUNCTION public.messaging_find_contact_by_username_v1(p_username text)
 RETURNS TABLE(id uuid, username text, is_self boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_username text := btrim(p_username);
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = 'P0001';
  end if;

  if v_username is null or char_length(v_username) not between 1 and 50 then
    return;
  end if;

  return query
  select
    profile.id,
    profile.username,
    profile.id = v_user_id
  from public.profiles as profile
  where lower(profile.username) = lower(v_username)
  limit 1;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_accept_invitation_v2(p_invitation_id uuid)
 RETURNS room_invitations_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_invitation public.room_invitations_v2%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Non authentifie';
  end if;

  select *
    into v_invitation
  from public.room_invitations_v2
  where id = p_invitation_id
    and ended_at is null
  for update;

  if not found then
    raise exception 'Invitation introuvable';
  end if;

  if v_invitation.guest_id <> auth.uid() then
    raise exception 'Invitation reservee au guest';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Invitation non acceptables dans cet etat';
  end if;

  update public.room_invitations_v2
  set
    status = 'accepted',
    accepted_at = coalesce(accepted_at, now())
  where id = p_invitation_id
  returning *
    into v_invitation;

  update public.room_queue_v2
  set removed_at = now()
  where room_id = v_invitation.room_id
    and user_id = v_invitation.guest_id
    and removed_at is null;

  perform public.rooms_v2_upsert_participant(v_invitation.room_id, v_invitation.guest_id, 'viewer');
  return v_invitation;
end;
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

CREATE OR REPLACE FUNCTION public.search_messageable_profiles_v1(p_query text, p_limit integer DEFAULT 20)
 RETURNS TABLE(profile_id uuid, username text, display_name text, avatar_url text, avatar_style_key text, primary_role_key text, city text, country_code text, is_verified boolean, grade_level smallint, grade_code text, grade_label text, grade_visual_key text, recognitions jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_query text := trim(coalesce(p_query, ''));
  v_pattern text;
  v_limit integer := least(50, greatest(1, coalesce(p_limit, 20)));
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if char_length(v_query) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'invalid_profile_search';
  end if;
  v_pattern := replace(
    replace(
      replace(v_query, chr(92), chr(92) || chr(92)),
      '%', chr(92) || '%'
    ),
    '_', chr(92) || '_'
  );

  return query
  select
    profile.id,
    profile.username,
    coalesce(
      nullif(profile.display_name, ''),
      nullif(profile.username, ''),
      'Membre Meewav'
    ),
    profile.avatar_url,
    profile.avatar_style_key,
    profile.primary_role_key,
    profile.city,
    profile.country_code::text,
    profile.is_verified,
    case
      when coalesce(profile.public_profile_preferences ->> 'show_grade', 'true') <> 'false'
        then grade.level
      else null
    end,
    case
      when coalesce(profile.public_profile_preferences ->> 'show_grade', 'true') <> 'false'
        then grade.code
      else null
    end,
    case
      when coalesce(profile.public_profile_preferences ->> 'show_grade', 'true') <> 'false'
        then grade.label
      else null
    end,
    case
      when coalesce(profile.public_profile_preferences ->> 'show_grade', 'true') <> 'false'
        then grade.visual_key
      else null
    end,
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', definition.code,
        'label', definition.label,
        'visual_key', definition.visual_key,
        'accent_hex', definition.accent_hex,
        'earned_at', recognition.earned_at
      ) order by definition.sort_order, definition.code), '[]'::jsonb)
      from public.profile_recognition_state recognition
      join public.recognition_definitions definition
        on definition.code = recognition.recognition_code
       and definition.is_active
      where recognition.profile_id = profile.id
        and recognition.status = 'earned'
        and recognition.is_public
    )
  from public.profiles profile
  left join public.profile_grade_state grade_state
    on grade_state.profile_id = profile.id
  left join public.grade_levels grade
    on grade.level = grade_state.level and grade.is_active
  where profile.id <> v_user_id
    and coalesce(profile.show_on_public_profile, false)
    and not coalesce(profile.is_ghost_mode, true)
    and not public.messaging_profiles_blocked_v1(v_user_id, profile.id)
    and (
      profile.username ilike '%' || v_pattern || '%' escape E'\\'
      or profile.display_name ilike '%' || v_pattern || '%' escape E'\\'
    )
  order by
    case
      when profile.username ilike v_pattern || '%' escape E'\\' then 0
      when profile.display_name ilike v_pattern || '%' escape E'\\' then 1
      else 2
    end,
    lower(coalesce(nullif(profile.display_name, ''), profile.username)),
    profile.id
  limit v_limit;
end;
$function$
