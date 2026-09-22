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
create extension if not exists pgtap with schema extensions;
select plan(7);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('7b000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','chat-recipe-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,2)n;
insert into public.rooms_v2(id,host_id,type,title,status,livekit_room_name) values('7c000000-0000-0000-0000-000000000001','7b000000-0000-0000-0000-000000000001','wave','Chat test','live','chat-test');
insert into public.room_participants_v2(room_id,user_id,role) values('7c000000-0000-0000-0000-000000000001','7b000000-0000-0000-0000-000000000001','host');
select set_config('request.jwt.claim.sub','7b000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.rooms_send_message_idempotent_v1('7c000000-0000-0000-0000-000000000001','Bonjour','7d000000-0000-0000-0000-000000000001')$$,'send confirmed');
select lives_ok($$select public.rooms_send_message_idempotent_v1('7c000000-0000-0000-0000-000000000001','Bonjour','7d000000-0000-0000-0000-000000000001')$$,'retry confirmed');
select is((select count(*)::integer from public.room_messages_v2 where room_id='7c000000-0000-0000-0000-000000000001'),1,'retry produces one message');
select throws_ok($$select public.rooms_send_message_idempotent_v1('7c000000-0000-0000-0000-000000000001','Autre','7d000000-0000-0000-0000-000000000001')$$,'23505','Message request conflict','changed retry rejected');
select ok(not has_table_privilege('authenticated','public.room_message_requests_v1','INSERT'),'client cannot forge requests');
select set_config('request.jwt.claim.sub','7b000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.rooms_send_message_idempotent_v1('7c000000-0000-0000-0000-000000000001','Bonjour','7d000000-0000-0000-0000-000000000002')$$,'42501','Room access denied','outsider denied');
reset role;
update public.rooms_v2 set status='ended' where id='7c000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claim.sub','7b000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select throws_ok($$select public.rooms_send_message_idempotent_v1('7c000000-0000-0000-0000-000000000001','Bonjour','7d000000-0000-0000-0000-000000000003')$$,'42501','Room access denied','ended room rejects send');
reset role;
select * from finish();
