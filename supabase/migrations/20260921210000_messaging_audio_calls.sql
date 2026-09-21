-- Additive call mode shared by Android, web and iOS. Existing start means video.
-- Preserve the deployed membership, block, locking and rate-limit guards.
begin;
alter table public.messaging_video_calls_v1
  add column media_kind text not null default 'video'
  constraint messaging_calls_media_kind_check check (media_kind in ('audio','video'));

CREATE OR REPLACE FUNCTION public.messaging_video_call_v1(p_action text, p_conversation_id uuid DEFAULT NULL::uuid, p_call_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  u uuid := auth.uid();
  peer uuid;
  c public.messaging_video_calls_v1;
  peer_name text;
  valid_members boolean;
begin
  if u is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  if p_action not in ('start','start_audio','sync','accept','decline','end','media') then
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  if p_action in ('start','start_audio') then
    select case when d.participant_low_id = u then d.participant_high_id else d.participant_low_id end into peer
    from public.messaging_direct_conversations_v1 d
    where d.id = p_conversation_id and u in (d.participant_low_id,d.participant_high_id);
    if peer is null then raise exception 'direct_conversation_required' using errcode = '42501'; end if;
    -- Deterministic locks also serialize crossed calls and calls to a busy peer.
    perform pg_advisory_xact_lock(hashtextextended(least(u,peer)::text, 109));
    perform pg_advisory_xact_lock(hashtextextended(greatest(u,peer)::text, 109));
  end if;

  update public.messaging_video_calls_v1 set status = 'missed', ended_at = now()
  where (u in (caller_id,callee_id) or peer in (caller_id,callee_id)) and status in ('ringing','accepted')
    and ((status = 'ringing' and created_at < now() - interval '45 seconds')
      or (status = 'accepted' and (caller_seen_at < now() - interval '35 seconds' or callee_seen_at < now() - interval '35 seconds')));

  if p_action in ('start','start_audio') then
    if exists (select 1 from public.messaging_video_calls_v1
      where (u in (caller_id,callee_id) or peer in (caller_id,callee_id)) and status in ('ringing','accepted')) then
      raise exception 'call_busy' using errcode = '55000';
    end if;
    select count(*) = 2 into valid_members from public.messaging_conversation_participants_v1
      where conversation_id = p_conversation_id and user_id in (u,peer);
    if not valid_members or public.messaging_profiles_blocked_v1(u,peer)
      or (select count(*) from public.messaging_conversation_members where conversation_id=p_conversation_id and profile_id in(u,peer) and membership_status='active' and left_at is null) <> 2 then
      raise exception 'call_not_allowed' using errcode = '42501';
    end if;
    if (select count(*) from public.messaging_video_calls_v1 where caller_id = u and created_at > now() - interval '1 minute') >= 4 then
      raise exception 'call_rate_limited' using errcode = '54000';
    end if;
    insert into public.messaging_video_calls_v1(conversation_id,caller_id,callee_id,media_kind)
      values(p_conversation_id,u,peer,case when p_action = 'start_audio' then 'audio' else 'video' end) returning * into c;
  else
    select * into c from public.messaging_video_calls_v1
      where u in (caller_id,callee_id) and (id = p_call_id or (p_call_id is null and status in ('ringing','accepted')))
      order by created_at desc limit 1 for update;
    if c.id is null then return null; end if;
    peer := case when c.caller_id = u then c.callee_id else c.caller_id end;
    select count(*) = 2 into valid_members from public.messaging_conversation_participants_v1
      where conversation_id = c.conversation_id and user_id in (u,peer);
    if c.status in ('ringing','accepted') and (not valid_members
      or public.messaging_profiles_blocked_v1(u,peer)
      or (select count(*) from public.messaging_conversation_members where conversation_id=c.conversation_id and profile_id in(u,peer) and membership_status='active' and left_at is null) <> 2
      or not exists(select 1 from public.messaging_direct_conversations_v1 where id = c.conversation_id)) then
      update public.messaging_video_calls_v1 set status = 'ended', ended_at = now() where id = c.id returning * into c;
    end if;
    if p_action = 'accept' and c.status = 'ringing' then
      if c.callee_id <> u then raise exception 'recipient_only' using errcode = '42501'; end if;
      update public.messaging_video_calls_v1 set status = 'accepted', answered_at = now(), caller_seen_at = now(), callee_seen_at = now()
        where id = c.id returning * into c;
    elsif p_action = 'decline' and c.status = 'ringing' then
      if c.callee_id <> u then raise exception 'recipient_only' using errcode = '42501'; end if;
      update public.messaging_video_calls_v1 set status = 'declined', ended_at = now() where id = c.id returning * into c;
    elsif p_action = 'end' and c.status in ('ringing','accepted') then
      update public.messaging_video_calls_v1 set status = 'ended', ended_at = now() where id = c.id returning * into c;
    elsif p_action in ('sync','media') and c.status = 'accepted' then
      update public.messaging_video_calls_v1 set
        caller_seen_at = case when caller_id = u then now() else caller_seen_at end,
        callee_seen_at = case when callee_id = u then now() else callee_seen_at end
        where id = c.id returning * into c;
    end if;
  end if;
  if p_action = 'media' and c.status <> 'accepted' then
    raise exception 'call_not_accepted' using errcode = '42501';
  end if;
  select coalesce(nullif(to_jsonb(p)->>'full_name',''),nullif(to_jsonb(p)->>'username',''),'Contact Meewav')
    into peer_name from public.profiles p where p.id = peer;
  return jsonb_build_object('kind',c.media_kind,'id',c.id,'conversationId',c.conversation_id,'status',c.status,
    'incoming',c.callee_id = u,'peerId',peer,'peerName',peer_name,'createdAt',c.created_at,
    'answeredAt',c.answered_at,'roomId','mw-call-' || c.id::text);
end $function$
;
commit;
