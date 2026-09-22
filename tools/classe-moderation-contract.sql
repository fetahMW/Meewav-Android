CREATE OR REPLACE FUNCTION public.rooms_classe_configure_v1(p_room_id uuid, p_applications_open boolean, p_questions_open boolean)
 RETURNS room_classe_settings_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_before public.room_classe_settings_v1%rowtype;
  v_settings public.room_classe_settings_v1%rowtype;
begin
  perform public.rooms_classe_assert_live_v1(p_room_id, true);
  if p_applications_open is null or p_questions_open is null then
    raise exception using errcode = '22023', message = 'CLASSE_SETTINGS_INVALID';
  end if;
  select * into v_before from public.room_classe_settings_v1
  where room_id = p_room_id for update;

  update public.room_classe_settings_v1
  set applications_open = p_applications_open,
      questions_open = p_questions_open,
      revision = revision + case
        when applications_open is distinct from p_applications_open
          or questions_open is distinct from p_questions_open then 1 else 0 end
  where room_id = p_room_id
  returning * into v_settings;

  if v_before.applications_open is distinct from p_applications_open
     or v_before.questions_open is distinct from p_questions_open then
    perform public.rooms_classe_emit_v1(
      p_room_id, 'classe.settings.changed', 'room', null,
      jsonb_build_object(
        'applications_open', p_applications_open,
        'questions_open', p_questions_open,
        'revision', v_settings.revision
      ), null, now()
    );
  end if;
  return v_settings;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_moderation_kick_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_participation public.room_classe_participations_v1%rowtype;
  v_room public.rooms_v2%rowtype;
  v_access_generation bigint;
  v_banned boolean;
  v_reason text;
  v_was_public boolean;
begin
  select room.* into v_room
  from public.rooms_v2 room
  where room.id = new.room_id and room.type = 'classe'
  for update;
  if found then
    perform 1 from public.room_classe_settings_v1 settings
    where settings.room_id = new.room_id for update;
    v_reason := left(
      coalesce(nullif(btrim(new.reason), ''), 'moderation_kick'),
      280
    );
    select exists (
      select 1 from public.room_classe_participations_v1 participation
      where participation.room_id = new.room_id and participation.user_id = new.user_id
        and participation.status = 'onstage'
    ) or exists (
      select 1 from public.room_classe_floor_requests_v1 request
      where request.room_id = new.room_id and request.user_id = new.user_id
        and request.status = 'granted'
    ) into v_was_public;
    update public.room_classe_participations_v1
    set status = 'removed', ended_at = coalesce(ended_at, now()), revision = revision + 1
    where room_id = new.room_id and user_id = new.user_id
      and status in ('applied', 'invited', 'backstage', 'onstage')
    returning * into v_participation;
    update public.room_classe_private_rtc_v1
    set access_generation = access_generation + 1
    where room_id = new.room_id and user_id = new.user_id;
    update public.room_classe_settings_v1
    set access_generation = access_generation + 1 where room_id = new.room_id
    returning access_generation into v_access_generation;
    update public.room_classe_floor_requests_v1
    set status = 'dismissed', ended_at = coalesce(ended_at, now()),
        ended_by = new.kicked_by, end_reason = v_reason,
        revision = revision + 1
    where room_id = new.room_id and user_id = new.user_id
      and status in ('requested', 'granted');
    select exists (
      select 1 from public.room_bans_v2 ban
      where ban.room_id = new.room_id and ban.user_id = new.user_id
    ) into v_banned;
    if v_participation.id is null and v_banned then
      select participation.* into v_participation
      from public.room_classe_participations_v1 participation
      where participation.room_id = new.room_id
        and participation.user_id = new.user_id;
    end if;
    insert into public.room_classe_outbox_v1(
      room_id, topic, payload, idempotency_key
    ) values (
      new.room_id,
      'classe.rtc.user.eject',
      jsonb_build_object(
        'room_id', new.room_id,
        'channel_name', v_room.livekit_room_name,
        'user_id', new.user_id,
        'forbidden_interval', case when v_banned then 259200 else 0 end,
        'access_generation', v_access_generation
      ),
      'classe-rtc-user-eject:' || new.id::text
    ) on conflict (idempotency_key) do nothing;
    perform public.rooms_classe_emit_v1(
      new.room_id,
      case
        when v_banned and v_participation.id is not null
          then 'classe.participant.banned'
        when v_participation.id is null
          then 'classe.member.kicked'
        else 'classe.participant.removed'
      end,
      'user',
      new.user_id,
      jsonb_strip_nulls(jsonb_build_object(
        'participation_id', v_participation.id,
        'user_id', new.user_id,
        'reason', v_reason
      )),
      new.user_id,
      now()
    );
    perform public.rooms_classe_emit_v1(
      new.room_id, 'classe.participation.changed', 'host', null,
      jsonb_strip_nulls(jsonb_build_object(
        'participation_id', v_participation.id,
        'user_id', new.user_id,
        'revision', v_participation.revision
      )), null, now()
    );
    if v_was_public then
      perform public.rooms_classe_emit_v1(
        new.room_id, 'classe.publication.changed', 'room', null,
        jsonb_build_object('user_id', new.user_id), null, now()
      );
    end if;
  end if;
  return new;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_resolve_question_v1(p_question_id uuid, p_resolution text)
 RETURNS room_classe_questions_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room_id uuid;
  v_question public.room_classe_questions_v1%rowtype;
begin
  select question.room_id into v_room_id from public.room_classe_questions_v1 question
  where question.id = p_question_id;
  if not found then raise exception using errcode = 'P0002', message = 'CLASSE_QUESTION_NOT_FOUND'; end if;
  perform public.rooms_classe_assert_live_v1(v_room_id, true);
  if p_resolution is null or p_resolution not in ('answered', 'dismissed') then
    raise exception using errcode = '22023', message = 'CLASSE_QUESTION_RESOLUTION_INVALID';
  end if;
  select question.* into v_question from public.room_classe_questions_v1 question
  where question.id = p_question_id for update;
  if v_question.status = p_resolution then return v_question; end if;
  if v_question.status <> 'open' then
    raise exception using errcode = 'P0001', message = 'CLASSE_QUESTION_NOT_RESOLVABLE';
  end if;
  update public.room_classe_questions_v1
  set status = p_resolution, resolved_at = now(), resolved_by = auth.uid(), revision = revision + 1
  where id = p_question_id returning * into v_question;
  perform public.rooms_classe_emit_v1(
    v_room_id, 'classe.question.' || p_resolution, 'room', null,
    jsonb_build_object('question_id', v_question.id, 'revision', v_question.revision),
    v_question.user_id, now()
  );
  return v_question;
end;
$function$
