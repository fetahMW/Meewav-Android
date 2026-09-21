begin;
-- Additive retry contract for all clients. Existing iOS send functions stay unchanged.
create table if not exists public.room_message_requests_v1 (
 actor_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 room_id uuid not null references public.rooms_v2(id) on delete cascade,
 content text not null,
 message_id uuid references public.room_messages_v2(id) on delete set null,
 created_at timestamptz not null default now(),
 primary key(actor_id,request_id)
);
alter table public.room_message_requests_v1 enable row level security;
revoke all on public.room_message_requests_v1 from public,anon,authenticated;
create or replace function public.rooms_send_message_idempotent_v1(p_room_id uuid,p_content text,p_client_request_id uuid)
returns public.room_messages_v2 language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid();
 content_value text:=btrim(coalesce(p_content,''));
 prior public.room_message_requests_v1%rowtype;
 message public.room_messages_v2%rowtype;
 room_type text;
begin
 if actor is null then raise exception using errcode='42501',message='Authentication required'; end if;
 if p_client_request_id is null or char_length(content_value) not between 1 and 1000 then
  raise exception using errcode='22023',message='Invalid message';
 end if;
 select type::text into room_type from public.rooms_v2 where id=p_room_id and status='live';
 if not found or exists(select 1 from public.room_bans_v2 where room_id=p_room_id and user_id=actor)
 or not exists(select 1 from public.room_participants_v2 where room_id=p_room_id and user_id=actor and left_at is null) then
  raise exception using errcode='42501',message='Room access denied';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':'||p_client_request_id::text,23));
 select * into prior from public.room_message_requests_v1 where actor_id=actor and request_id=p_client_request_id;
 if found then
  if prior.room_id<>p_room_id or prior.content<>content_value then raise exception using errcode='23505',message='Message request conflict';end if;
  select * into message from public.room_messages_v2 where id=prior.message_id;
  if not found then raise exception using errcode='55000',message='Message already removed';end if;
  return message;
 end if;
 if room_type='classe' then
  select * into message from public.rooms_classe_send_message_v1(p_room_id,content_value,p_client_request_id);
 else
  select * into message from public.rooms_send_message_v2(p_room_id,content_value);
 end if;
 insert into public.room_message_requests_v1(actor_id,request_id,room_id,content,message_id)
 values(actor,p_client_request_id,p_room_id,content_value,message.id);
 return message;
end;
$$;
revoke all on function public.rooms_send_message_idempotent_v1(uuid,text,uuid) from public,anon;
grant execute on function public.rooms_send_message_idempotent_v1(uuid,text,uuid) to authenticated;
commit;
