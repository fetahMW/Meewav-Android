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

CREATE OR REPLACE FUNCTION public.rooms_kick_user_v2(p_room_id uuid, p_user_id uuid, p_reason text DEFAULT 'host_kick'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_room public.rooms_v2%rowtype;
  v_reason text := coalesce(nullif(btrim(p_reason), ''), 'host_kick');
  v_is_active boolean;
begin
  v_room := public.rooms_assert_room_moderator_v2(p_room_id);
  perform public.rooms_assert_moderation_target_v2(p_room_id, p_user_id);

  if v_room.type = 'classe' then
    if length(v_reason) > 280 then
      raise exception using errcode = '22023', message = 'CLASSE_MODERATION_REASON_INVALID';
    end if;
    select
      exists (
        select 1 from public.room_participants_v2 participant
        where participant.room_id = p_room_id
          and participant.user_id = p_user_id
          and participant.left_at is null
      )
      or exists (
        select 1 from public.room_classe_participations_v1 participation
        where participation.room_id = p_room_id
          and participation.user_id = p_user_id
          and participation.status in ('applied', 'invited', 'backstage', 'onstage')
      )
      or exists (
        select 1 from public.room_classe_floor_requests_v1 request
        where request.room_id = p_room_id
          and request.user_id = p_user_id
          and request.status in ('requested', 'granted')
      )
    into v_is_active;
    if not v_is_active then
      return;
    end if;
  end if;

  insert into public.room_kicks_v2(room_id, user_id, kicked_by, reason)
  values (
    p_room_id, p_user_id, auth.uid(),
    case when v_room.type = 'classe' then v_reason else p_reason end
  );

  update public.room_invitations_v2
  set status = 'kicked', ended_at = coalesce(ended_at, now())
  where room_id = p_room_id
    and guest_id = p_user_id
    and ended_at is null
    and status in ('pending', 'accepted', 'ready', 'backstage', 'onstage');

  update public.room_queue_v2
  set removed_at = now()
  where room_id = p_room_id
    and user_id = p_user_id
    and removed_at is null;

  perform public.rooms_v2_clear_guest_runtime(p_room_id, p_user_id, true);

  insert into public.room_events_v2(room_id, triggered_by, event_type, payload)
  values (
    p_room_id,
    auth.uid(),
    'user_kicked',
    jsonb_build_object(
      'user_id', p_user_id,
      'reason', case
        when v_room.type = 'classe' then v_reason
        else coalesce(p_reason, 'host_kick')
      end
    )
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_leave_queue_v2(p_queue_entry_id uuid)
 RETURNS room_queue_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_entry public.room_queue_v2%rowtype;
  v_room public.rooms_v2%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Non authentifie';
  end if;

  select *
    into v_entry
  from public.room_queue_v2
  where id = p_queue_entry_id
    and removed_at is null
  for update;

  if not found then
    raise exception 'Entree de file introuvable';
  end if;

  select *
    into v_room
  from public.rooms_v2
  where id = v_entry.room_id;

  if v_entry.user_id <> auth.uid() and v_room.host_id <> auth.uid() then
    raise exception 'Action file refusee';
  end if;

  update public.room_queue_v2
  set removed_at = now()
  where id = p_queue_entry_id
  returning *
    into v_entry;

  return v_entry;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_set_host_mic_forced_muted_v2(p_room_id uuid, p_guest_id uuid, p_is_forced_muted boolean)
 RETURNS room_mixer_state_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_state public.room_mixer_state_v2%rowtype;
begin
  perform public.rooms_assert_room_host_v2(p_room_id);

  insert into public.room_mixer_state_v2 (
    room_id,
    guest_id,
    host_mic_forced_muted,
    is_mic_muted,
    updated_at
  )
  values (
    p_room_id,
    p_guest_id,
    p_is_forced_muted,
    p_is_forced_muted,
    now()
  )
  on conflict (room_id, guest_id)
  do update
    set host_mic_forced_muted = excluded.host_mic_forced_muted,
        is_mic_muted = case
          when excluded.host_mic_forced_muted then true
          else public.room_mixer_state_v2.self_mic_muted
        end,
        updated_at = now()
  returning * into v_state;

  return v_state;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_v2_assert_host(p_room_id uuid)
 RETURNS rooms_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_room public.rooms_v2%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Non authentifie';
  end if;

  select *
    into v_room
  from public.rooms_v2
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Room introuvable';
  end if;

  if v_room.host_id <> auth.uid() then
    raise exception 'Action reservee au host';
  end if;

  if v_room.status = 'ended' then
    raise exception 'Room terminee';
  end if;

  return v_room;
end;
$function$
