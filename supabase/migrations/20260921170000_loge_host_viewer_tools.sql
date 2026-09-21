begin;
create table if not exists public.room_loge_tools_v1 (
 room_id uuid primary key references public.rooms_v2(id) on delete cascade,
 revision bigint not null default 1,
 state jsonb not null default '{"questionsOpen":true,"questions":[],"moments":[],"experiences":[]}',
 updated_at timestamptz not null default now(),
 check (pg_column_size(state)<524288)
);
alter table public.room_loge_tools_v1 enable row level security;
revoke all on public.room_loge_tools_v1 from anon,authenticated;
create or replace function public.rooms_loge_read_v1(p_room_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); h uuid; s jsonb; result jsonb; k text; people jsonb;
begin
 if u is null then raise exception 'Connexion requise' using errcode='42501'; end if;
 select host_id into h from public.rooms_v2 where id=p_room_id and type='loge' and status in ('live','ended');
 if h is null then raise exception 'Loge indisponible'; end if;
 if exists(select 1 from public.room_bans_v2 where room_id=p_room_id and user_id=u) then raise exception 'Accès révoqué' using errcode='42501'; end if;
 if u<>h and not exists(select 1 from public.room_participants_v2 where room_id=p_room_id and user_id=u and left_at is null) then raise exception 'Rejoignez la Loge' using errcode='42501'; end if;
 select state into s from public.room_loge_tools_v1 where room_id=p_room_id;
 s:=coalesce(s,'{"questionsOpen":true,"questions":[],"moments":[],"experiences":[]}'::jsonb);
 result:=s;
 if u<>h then
  foreach k in array array['questions','moments','experiences'] loop
   result:=jsonb_set(result,array[k],coalesce((select jsonb_agg(e) from jsonb_array_elements(coalesce(s->k,'[]')) e where e->>'personId'=u::text or (k='questions' and e->>'status'='selected')),'[]'));
  end loop;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',coalesce(p.display_name,p.username,'Membre'),'avatarUrl',coalesce(p.avatar_url,p.profile_image_url,''),'role',coalesce(p.primary_role_key,'Membre'))),'[]') into people from public.profiles p where p.id=u or (u=h and exists(select 1 from public.room_participants_v2 rp where rp.room_id=p_room_id and rp.user_id=p.id and rp.left_at is null));
 return result||jsonb_build_object('viewerId',u,'viewerName',(select coalesce(display_name,username,'Membre') from public.profiles where id=u),'people',people,'hostId',h);
end $$;
create or replace function public.rooms_loge_action_v1(p_room_id uuid,p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();h uuid;s jsonb;items jsonb;item jsonb;next_items jsonb;key text;target uuid;found_item boolean:=false;new_status text;
begin
 perform public.rooms_loge_read_v1(p_room_id);
 select host_id into h from public.rooms_v2 where id=p_room_id and status='live' for share;
 if h is null then raise exception 'La Loge est terminée'; end if;
 insert into public.room_loge_tools_v1(room_id) values(p_room_id) on conflict do nothing;
 select state into s from public.room_loge_tools_v1 where room_id=p_room_id for update;
 if p_action='question' then
  if not coalesce((s->>'questionsOpen')::boolean,true) then raise exception 'Questions fermées'; end if;
  if length(btrim(coalesce(p_payload->>'text',''))) not between 1 and 280 then raise exception 'Question invalide'; end if;
  if exists(select 1 from jsonb_array_elements(s->'questions') q where q->>'personId'=u::text and q->>'status' in ('pending','selected')) then raise exception 'Une question est déjà en attente'; end if;
  s:=jsonb_set(s,'{questions}',s->'questions'||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'personId',u,'text',btrim(p_payload->>'text'),'status','pending','supports',0)));
 elsif p_action='questions.open' then
  if u<>h then raise exception 'Réservé au host' using errcode='42501'; end if;
  if jsonb_typeof(p_payload->'open') is distinct from 'boolean' then raise exception 'Valeur invalide';end if;
  s:=jsonb_set(s,'{questionsOpen}',to_jsonb((p_payload->>'open')::boolean));
 elsif p_action in ('request','moment.add','experience.add') then
  if p_action='request' then target:=u;else
   if u<>h then raise exception 'Réservé au host' using errcode='42501'; end if;
   target:=(p_payload->>'personId')::uuid;
   if not exists(select 1 from public.room_participants_v2 where room_id=p_room_id and user_id=target and left_at is null) then raise exception 'Membre absent de la Loge'; end if;
  end if;
  key:=case when p_action='experience.add' then 'experiences' else 'moments' end;
  if p_action='experience.add' then
   if coalesce(p_payload->>'type','') not in ('Concert','Sur scène','Rencontre','Session studio') or length(btrim(coalesce(p_payload->>'detail',''))) not between 1 and 240 then raise exception 'Invitation invalide'; end if;
   item:=jsonb_build_object('id',coalesce(nullif(p_payload->>'id','')::uuid,gen_random_uuid()),'personId',target,'type',p_payload->>'type','detail',btrim(p_payload->>'detail'),'status','pending');
  else
   if coalesce(p_payload->>'format','live') not in ('live','audio','video') then raise exception 'Format invalide'; end if;
   if exists(select 1 from jsonb_array_elements(s->'moments') m where m->>'personId'=target::text and m->>'format'=coalesce(p_payload->>'format','live') and m->>'status' in ('pending','scheduled','accepted','live')) then raise exception 'Un moment est déjà en attente'; end if;
   item:=jsonb_build_object('id',coalesce(nullif(p_payload->>'id','')::uuid,gen_random_uuid()),'personId',target,'format',coalesce(p_payload->>'format','live'),'minutes',case when (p_payload->>'minutes')::int in (5,10,15) then (p_payload->>'minutes')::int else 5 end,'status',case when p_action='request' then 'pending' else 'scheduled' end,'file','','seconds',0);
  end if;
  if not exists(select 1 from jsonb_array_elements(s->key) e where e->>'id'=item->>'id') then s:=jsonb_set(s,array[key],s->key||jsonb_build_array(item));end if;
 elsif p_action in ('moment','experience','cancel-request','moment.status','experience.status','question.status') then
  key:=case when p_action like 'experience%' then 'experiences' when p_action='question.status' then 'questions' else 'moments' end;
  next_items:='[]';
  for item in select value from jsonb_array_elements(s->key) loop
   if item->>'id'=p_payload->>'id' then
    found_item:=true;
    if p_action in ('moment','experience','cancel-request') then
     if item->>'personId'<>u::text then raise exception 'Ce message ne vous est pas destiné' using errcode='42501'; end if;
     if p_action<>'cancel-request' and jsonb_typeof(p_payload->'accept') is distinct from 'boolean' then raise exception 'Valeur invalide';end if;
     new_status:=case when p_action='cancel-request' then 'cancelled' when (p_payload->>'accept')::boolean then 'accepted' else 'declined' end;
     if item->>'status'=new_status then null;
     elsif item->>'status'<>(case when p_action='moment' then 'scheduled' else 'pending' end) then raise exception 'La demande a déjà changé';end if;
    else
     if u<>h then raise exception 'Réservé au host' using errcode='42501'; end if;
     new_status:=coalesce(p_payload->>'status','');
     if key='questions' then
      if new_status not in ('pending','selected','answered','rejected') then raise exception 'Statut invalide';end if;
     elsif not ((item->>'status'='pending' and new_status in ('scheduled','declined','cancelled')) or (item->>'status'='scheduled' and new_status='cancelled') or (item->>'status'='accepted' and new_status in ('live','completed','cancelled')) or (item->>'status'='live' and new_status='completed') or item->>'status'=new_status) then raise exception 'Transition invalide';end if;
    end if;
    item:=item||jsonb_build_object('status',new_status);
    if new_status='live' then item:=item||jsonb_build_object('startedAt',floor(extract(epoch from now())*1000));end if;
   elsif key='questions' and p_payload->>'status'='selected' and item->>'status'='selected' then item:=item||'{"status":"pending"}';
   end if;
   next_items:=next_items||jsonb_build_array(item);
  end loop;
  if not found_item then raise exception 'Élément introuvable';end if;
  s:=jsonb_set(s,array[key],next_items);
 else raise exception 'Action inconnue';end if;
 update public.room_loge_tools_v1 set state=s,revision=revision+1,updated_at=now() where room_id=p_room_id;
 return public.rooms_loge_read_v1(p_room_id);
end $$;
revoke all on function public.rooms_loge_read_v1(uuid) from public,anon;
revoke all on function public.rooms_loge_action_v1(uuid,text,jsonb) from public,anon;
grant execute on function public.rooms_loge_read_v1(uuid) to authenticated;
grant execute on function public.rooms_loge_action_v1(uuid,text,jsonb) to authenticated;
create or replace function public.rooms_loge_launch_v1(p_title text,p_room_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null then raise exception 'Connexion requise' using errcode='42501';end if;
 if length(btrim(coalesce(p_title,''))) not between 1 and 160 or p_room_id is null then raise exception 'Titre invalide';end if;
 if exists(select 1 from public.rooms_v2 where id=p_room_id and (host_id<>u or type<>'loge' or status<>'live')) then raise exception 'Room indisponible' using errcode='42501';end if;
 insert into public.rooms_v2(id,host_id,type,title,status,livekit_room_name,queue_open) values(p_room_id,u,'loge',btrim(p_title),'live','room-'||p_room_id::text,true) on conflict(id) do nothing;
 insert into public.room_loge_tools_v1(room_id) values(p_room_id) on conflict do nothing;
 return jsonb_build_object('id',p_room_id,'title',btrim(p_title));
end $$;
revoke all on function public.rooms_loge_launch_v1(text,uuid) from public,anon;
grant execute on function public.rooms_loge_launch_v1(text,uuid) to authenticated;
commit;
