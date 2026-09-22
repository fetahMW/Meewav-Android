begin;
create table if not exists public.artist_group_presentation_v1 (
 group_id uuid primary key references public.artist_groups(id) on delete cascade,
 theme text not null default 'violet' check(theme in ('violet','blue','emerald'))
);
create table if not exists public.artist_group_project_links_v1 (
 group_id uuid references public.artist_groups(id) on delete cascade,
 project_id uuid references public.creative_projects(id) on delete cascade,
 created_by uuid references public.profiles(id) on delete set null,created_at timestamptz not null default now(),
 primary key(group_id,project_id)
);
alter table public.artist_group_presentation_v1 enable row level security;
alter table public.artist_group_project_links_v1 enable row level security;
revoke all on public.artist_group_presentation_v1,public.artist_group_project_links_v1 from public,anon,authenticated;
create or replace function public.artist_group_connections_v1(p_group_id uuid,p_action text default 'read',p_project_id uuid default null,p_theme text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); lifecycle text; manage boolean; projects jsonb; candidates jsonb; theme text;
begin
 select lifecycle_status into lifecycle from public.artist_groups where id=p_group_id for update;
 if actor is null or not public.artist_group_is_active_member_v1(p_group_id,actor) then raise exception using errcode='42501',message='group_access_denied'; end if;
 manage:=coalesce(public.artist_group_authority_v1(p_group_id,actor),'member') in ('owner','admin') and lifecycle='active';
 if p_action<>'read' then
  if not manage then raise exception using errcode='42501',message='group_manage_denied'; end if;
  if p_action='theme' then
   if p_theme is null or p_theme not in ('violet','blue','emerald') then raise exception using errcode='22023',message='invalid_theme'; end if;
   insert into public.artist_group_presentation_v1(group_id,theme) values(p_group_id,p_theme) on conflict(group_id) do update set theme=excluded.theme;
  elsif p_action='link' then
   if not exists(select 1 from public.creative_projects p join public.creative_project_members m on m.project_id=p.id
     where p.id=p_project_id and p.deleted_at is null and m.profile_id=actor and m.left_at is null and m.authority_role in ('owner','admin')) then
     raise exception using errcode='42501',message='project_manage_denied'; end if;
   insert into public.artist_group_project_links_v1(group_id,project_id,created_by) values(p_group_id,p_project_id,actor) on conflict do nothing;
  elsif p_action='unlink' then
   delete from public.artist_group_project_links_v1 where group_id=p_group_id and project_id=p_project_id;
  else raise exception using errcode='22023',message='invalid_connection_action'; end if;
 end if;
 -- Linking never grants project membership or reveals a private project to other group members.
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'status',p.status) order by p.name,p.id),'[]') into projects
 from public.artist_group_project_links_v1 l join public.creative_projects p on p.id=l.project_id
 join public.creative_project_members m on m.project_id=p.id and m.profile_id=actor and m.left_at is null
 where l.group_id=p_group_id and p.deleted_at is null;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) order by p.name,p.id),'[]') into candidates
 from public.creative_projects p join public.creative_project_members m on m.project_id=p.id and m.profile_id=actor and m.left_at is null
 where manage and m.authority_role in ('owner','admin') and p.deleted_at is null
 and not exists(select 1 from public.artist_group_project_links_v1 l where l.group_id=p_group_id and l.project_id=p.id);
 select presentation.theme into theme from public.artist_group_presentation_v1 presentation where group_id=p_group_id;
 return jsonb_build_object('projects',projects,'candidates',candidates,'canManage',manage,'theme',coalesce(theme,'violet'));
end $$;
revoke all on function public.artist_group_connections_v1(uuid,text,uuid,text) from public,anon;
grant execute on function public.artist_group_connections_v1(uuid,text,uuid,text) to authenticated;
commit;
create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('81000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','group-recipe-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,3)n;
insert into public.messaging_conversations(id,kind,created_by_profile_id,creation_idempotency_key,title,metadata)
values('81010000-0000-0000-0000-000000000001','group','81000000-0000-0000-0000-000000000001','recipe-group-tools','Test','{}');
insert into public.artist_groups(id,name,created_by_profile_id,conversation_id)
values('81020000-0000-0000-0000-000000000001','Test','81000000-0000-0000-0000-000000000001','81010000-0000-0000-0000-000000000001');
insert into public.artist_group_members(group_id,profile_id,authority_role) values
('81020000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','owner'),
('81020000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000002','member');
insert into public.creative_projects(id,owner_profile_id,name) values('81040000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','Projet privé');
insert into public.creative_project_members(project_id,profile_id,authority_role) values('81040000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','owner');
insert into public.creative_projects(id,owner_profile_id,name) values('81040000-0000-0000-0000-000000000002','81000000-0000-0000-0000-000000000003','Autre projet');
insert into public.creative_project_members(project_id,profile_id,authority_role) values('81040000-0000-0000-0000-000000000002','81000000-0000-0000-0000-000000000003','owner');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select throws_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','link','81040000-0000-0000-0000-000000000002')$$,'42501','project_manage_denied','group ownership grants no authority on another project');
select is(jsonb_array_length(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')->'candidates'),1,'candidates contain only administrable projects');
select lives_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','link','81040000-0000-0000-0000-000000000001')$$,'owner links project');
select lives_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','link','81040000-0000-0000-0000-000000000001')$$,'link retry is safe');
select is(jsonb_array_length(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')->'projects'),1,'one persisted link');
select is(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','theme',null,'blue')->>'theme','blue','theme persisted');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000002',true);
select is(jsonb_array_length(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')->'projects'),0,'private project not disclosed to group-only member');
select throws_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','theme',null,'emerald')$$,'42501','group_manage_denied','member cannot change shared theme');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000003',true);
select throws_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')$$,'42501','group_access_denied','outsider cannot read');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','unlink','81040000-0000-0000-0000-000000000001')$$,'unlink persisted');
select is(jsonb_array_length(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')->'projects'),0,'link removed');
reset role;
select is((select count(*)::integer from public.creative_project_members where project_id='81040000-0000-0000-0000-000000000001'),1,'link did not grant project access');
select * from finish();
