CREATE OR REPLACE FUNCTION public.rooms_cancel_invitation_v2(p_invitation_id uuid)
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

  perform public.rooms_v2_assert_host(v_invitation.room_id);

  if v_invitation.status not in ('pending', 'accepted', 'ready') then
    raise exception 'Invitation non annulable dans cet etat';
  end if;

  update public.room_invitations_v2
  set
    status = 'cancelled',
    ended_at = now()
  where id = p_invitation_id
  returning *
    into v_invitation;

  perform public.rooms_v2_clear_guest_runtime(v_invitation.room_id, v_invitation.guest_id, false);
  return v_invitation;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_set_stage_v1(p_room_id uuid, p_participation_ids uuid[], p_onstage boolean)
 RETURNS SETOF room_classe_participations_v1
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_settings public.room_classe_settings_v1%rowtype;
  v_id uuid;
  v_row public.room_classe_participations_v1%rowtype;
  v_onstage_count integer;
  v_promote_count integer;
  v_requested_count integer := coalesce(array_length(p_participation_ids, 1), 0);
begin
  perform public.rooms_classe_assert_live_v1(p_room_id, true);
  select * into v_settings from public.room_classe_settings_v1
  where room_id = p_room_id for update;
  if p_onstage is null or v_requested_count not between 1 and 16
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
        and participation.status in ('backstage', 'onstage')) <> v_requested_count then
    raise exception using errcode = 'P0001', message = 'CLASSE_STAGE_SELECTION_INVALID';
  end if;

  if p_onstage then
    select count(*) into v_onstage_count
    from public.room_classe_participations_v1 participation
    where participation.room_id = p_room_id and participation.status = 'onstage';
    select count(*) into v_promote_count
    from public.room_classe_participations_v1 participation
    where participation.id = any(p_participation_ids) and participation.status = 'backstage';
    if v_onstage_count + v_promote_count > v_settings.max_onstage then
      raise exception using errcode = 'P0001', message = 'CLASSE_STAGE_FULL';
    end if;
  end if;

  foreach v_id in array p_participation_ids loop
    select * into v_row from public.room_classe_participations_v1 where id = v_id;
    if p_onstage and v_row.status = 'backstage' then
      perform public.rooms_classe_end_floor_for_user_v1(
        p_room_id, v_row.user_id, 'entered_stage'
      );
      update public.room_classe_participations_v1
      set status = 'onstage', onstage_at = now(), revision = revision + 1
      where id = v_id returning * into v_row;
      update public.room_classe_private_rtc_v1
      set access_generation = access_generation + 1 where participation_id = v_id;
      update public.room_classe_settings_v1
      set access_generation = access_generation + 1 where room_id = p_room_id;
      perform public.rooms_classe_emit_v1(
        p_room_id, 'classe.stage.promoted', 'room', null,
        jsonb_build_object('participation_id', v_row.id, 'user_id', v_row.user_id),
        v_row.user_id, now()
      );
    elsif not p_onstage and v_row.status = 'onstage' then
      update public.room_classe_participations_v1
      set status = 'backstage', backstage_at = now(), revision = revision + 1
      where id = v_id returning * into v_row;
      update public.room_classe_private_rtc_v1
      set access_generation = access_generation + 1 where participation_id = v_id;
      update public.room_classe_settings_v1
      set access_generation = access_generation + 1 where room_id = p_room_id;
      perform public.rooms_classe_emit_v1(
        p_room_id, 'classe.stage.demoted', 'room', null,
        jsonb_build_object('participation_id', v_row.id, 'user_id', v_row.user_id),
        v_row.user_id, now()
      );
    end if;
    return next v_row;
  end loop;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_invite_from_queue_v2(p_queue_entry_id uuid)
 RETURNS room_invitations_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_entry public.room_queue_v2%rowtype;
  v_room public.rooms_v2%rowtype;
  v_invitation public.room_invitations_v2%rowtype;
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

  v_room := public.rooms_v2_assert_host(v_entry.room_id);

  if exists (
    select 1
    from public.room_bans_v2 b
    where b.room_id = v_entry.room_id
      and b.user_id = v_entry.user_id
  ) then
    raise exception 'Invite banni';
  end if;

  if exists (
    select 1
    from public.room_invitations_v2 i
    where i.room_id = v_entry.room_id
      and i.guest_id = v_entry.user_id
      and i.status in ('declined', 'kicked')
  ) then
    raise exception 'Invitation deja terminee pour cette room';
  end if;

  insert into public.room_invitations_v2 (
    room_id,
    host_id,
    guest_id,
    status,
    accepted_at,
    ready_at,
    backstage_at,
    onstage_at,
    ended_at
  )
  values (
    v_entry.room_id,
    v_room.host_id,
    v_entry.user_id,
    'pending',
    null,
    null,
    null,
    null,
    null
  )
  on conflict (room_id, guest_id)
  do update set
    host_id = excluded.host_id,
    status = 'pending',
    accepted_at = null,
    ready_at = null,
    backstage_at = null,
    onstage_at = null,
    ended_at = null
  where public.room_invitations_v2.status not in ('declined', 'kicked')
  returning *
    into v_invitation;

  if v_invitation.id is null then
    raise exception 'Invitation deja terminee pour cette room';
  end if;

  perform public.rooms_v2_upsert_participant(v_entry.room_id, v_entry.user_id, 'viewer');
  return v_invitation;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_kick_invitation_v2(p_invitation_id uuid, p_reason text DEFAULT 'host_kick'::text)
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

  perform public.rooms_kick_user_v2(v_invitation.room_id, v_invitation.guest_id, p_reason);

  select *
    into v_invitation
  from public.room_invitations_v2
  where id = p_invitation_id;

  return v_invitation;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_move_invitation_to_backstage_v2(p_invitation_id uuid)
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

  perform public.rooms_v2_assert_host(v_invitation.room_id);

  if v_invitation.status not in ('ready', 'onstage') then
    raise exception 'Invite non pret pour les coulisses';
  end if;

  update public.room_invitations_v2
  set
    status = 'backstage',
    backstage_at = coalesce(backstage_at, now())
  where id = p_invitation_id
  returning *
    into v_invitation;

  perform public.rooms_v2_upsert_participant(v_invitation.room_id, v_invitation.guest_id, 'guest');
  return v_invitation;
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_move_invitation_to_stage_v2(p_invitation_id uuid)
 RETURNS room_invitations_v2
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_invitation public.room_invitations_v2%rowtype;
  v_onstage_count integer;
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

  perform public.rooms_v2_assert_host(v_invitation.room_id);

  if v_invitation.status <> 'backstage' then
    raise exception 'Seules les coulisses peuvent monter sur scene';
  end if;

  select count(*)
    into v_onstage_count
  from public.room_invitations_v2
  where room_id = v_invitation.room_id
    and status = 'onstage'
    and ended_at is null
    and id <> p_invitation_id;

  if v_onstage_count >= 3 then
    raise exception 'Scene limitee a trois invites';
  end if;

  update public.room_invitations_v2
  set
    status = 'onstage',
    onstage_at = coalesce(onstage_at, now())
  where id = p_invitation_id
  returning *
    into v_invitation;

  perform public.rooms_v2_upsert_participant(v_invitation.room_id, v_invitation.guest_id, 'guest');
  return v_invitation;
end;
$function$
