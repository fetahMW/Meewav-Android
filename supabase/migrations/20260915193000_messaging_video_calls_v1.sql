begin;

create policy messaging_calls_private_broadcast_v1 on realtime.messages for select to authenticated
using (extension = 'broadcast' and realtime.topic() = 'messaging:calls:' || (select auth.uid())::text);

create table public.messaging_video_calls_v1 (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.messaging_direct_conversations_v1(id) on delete cascade,
  caller_id uuid not null references public.profiles(id) on delete cascade,
  callee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'ringing' check (status in ('ringing','accepted','declined','ended','missed')),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz,
  caller_seen_at timestamptz not null default now(),
  callee_seen_at timestamptz not null default now(),
  check (caller_id <> callee_id)
);
create index on public.messaging_video_calls_v1(caller_id, created_at desc);
create index on public.messaging_video_calls_v1(callee_id, created_at desc);
alter table public.messaging_video_calls_v1 enable row level security;
revoke all on public.messaging_video_calls_v1 from anon, authenticated;

-- Invalidation only, on each participant's existing private messaging channel.
create function public.messaging_video_call_broadcast_v1() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if TG_OP = 'INSERT' or NEW.status is distinct from OLD.status then
    perform realtime.send(jsonb_build_object('callId',NEW.id), 'call_changed', 'messaging:calls:' || NEW.caller_id::text, true);
    perform realtime.send(jsonb_build_object('callId',NEW.id), 'call_changed', 'messaging:calls:' || NEW.callee_id::text, true);
  end if;
  return NEW;
end $$;
revoke all on function public.messaging_video_call_broadcast_v1() from public, anon, authenticated;
create trigger messaging_video_call_changed_v1 after insert or update on public.messaging_video_calls_v1
for each row execute function public.messaging_video_call_broadcast_v1();

create function public.messaging_video_call_v1(
  p_action text, p_conversation_id uuid default null, p_call_id uuid default null
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  u uuid := auth.uid();
  peer uuid;
  c public.messaging_video_calls_v1;
  peer_name text;
  valid_members boolean;
begin
  if u is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  if p_action not in ('start','sync','accept','decline','end','media') then
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  if p_action = 'start' then
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

  if p_action = 'start' then
    if exists (select 1 from public.messaging_video_calls_v1
      where (u in (caller_id,callee_id) or peer in (caller_id,callee_id)) and status in ('ringing','accepted')) then
      raise exception 'call_busy' using errcode = '55000';
    end if;
    select count(*) = 2 into valid_members from public.messaging_conversation_participants_v1
      where conversation_id = p_conversation_id and user_id in (u,peer);
    if not valid_members then
      raise exception 'call_not_allowed' using errcode = '42501';
    end if;
    if (select count(*) from public.messaging_video_calls_v1 where caller_id = u and created_at > now() - interval '1 minute') >= 4 then
      raise exception 'call_rate_limited' using errcode = '54000';
    end if;
    insert into public.messaging_video_calls_v1(conversation_id,caller_id,callee_id)
      values(p_conversation_id,u,peer) returning * into c;
  else
    select * into c from public.messaging_video_calls_v1
      where u in (caller_id,callee_id) and (id = p_call_id or (p_call_id is null and status in ('ringing','accepted')))
      order by created_at desc limit 1 for update;
    if c.id is null then return null; end if;
    peer := case when c.caller_id = u then c.callee_id else c.caller_id end;
    select count(*) = 2 into valid_members from public.messaging_conversation_participants_v1
      where conversation_id = c.conversation_id and user_id in (u,peer);
    if c.status in ('ringing','accepted') and (not valid_members
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
  return jsonb_build_object('id',c.id,'conversationId',c.conversation_id,'status',c.status,
    'incoming',c.callee_id = u,'peerId',peer,'peerName',peer_name,'createdAt',c.created_at,
    'answeredAt',c.answered_at,'roomId','mw-call-' || c.id::text);
end $$;
revoke all on function public.messaging_video_call_v1(text,uuid,uuid) from public, anon;
grant execute on function public.messaging_video_call_v1(text,uuid,uuid) to authenticated;

comment on table public.messaging_video_calls_v1 is 'Private direct-call signalling. RPC-only; no SDP, tokens or recorded media stored.';
commit;
