begin;
create index if not exists scene_comments_cursor_v1 on public.scene_comments_v1(media_id,created_at,id);
create or replace function public.scene_comments_page_v1(p_media_id uuid,p_after_time timestamptz default null,p_after_id uuid default null,p_limit integer default 200)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); owner_id uuid; result jsonb; size integer:=greatest(1,least(coalesce(p_limit,200),200));
begin
 if uid is null then raise exception using errcode='42501',message='authentication_required'; end if;
 select user_id into owner_id from public.media_files where id=p_media_id and deleted_at is null;
 if owner_id is null or (owner_id<>uid and not exists(select 1 from public.published_media_files where id=p_media_id)) then
 raise exception using errcode='42501',message='media_not_accessible'; end if;
 if (p_after_time is null)<>(p_after_id is null) then raise exception using errcode='22023',message='invalid_cursor'; end if;
 with page as (
  select c.id,c.media_id as "videoId",c.parent_id as "parentId",c.author_id as "authorId",
  coalesce(p.display_name,p.username,'Artiste') as "authorName",coalesce(p.profile_image_url,p.avatar_url,'/avatars/utilisateur.png') as "authorAvatarUrl",
  c.body,c.created_at as "createdAt",c.pinned,false as reported,
  (select count(*) from public.scene_comment_likes_v1 l where l.comment_id=c.id) as "likeCount",
  exists(select 1 from public.scene_comment_likes_v1 l where l.comment_id=c.id and l.user_id=uid) as "likedByViewer"
  from public.scene_comments_v1 c left join public.public_profiles p on p.id=c.author_id
  where c.media_id=p_media_id and (p_after_time is null or (c.created_at,c.id)>(p_after_time,p_after_id))
  order by c.created_at,c.id limit size+1
 ), visible as (select * from page order by "createdAt",id limit size)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(v) order by "createdAt",id) from visible v),'[]'::jsonb),
 'next',case when (select count(*) from page)>size then (select jsonb_build_object('time',"createdAt",'id',id) from visible order by "createdAt" desc,id desc limit 1) else null end) into result;
 return result;
end $$;
revoke all on function public.scene_comments_page_v1(uuid,timestamptz,uuid,integer) from public,anon;
grant execute on function public.scene_comments_page_v1(uuid,timestamptz,uuid,integer) to authenticated;
create table if not exists public.scene_comment_requests_v1 (
 actor_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null,media_id uuid not null references public.media_files(id) on delete cascade,
 parent_id uuid,body text not null,comment_id uuid references public.scene_comments_v1(id) on delete set null,
 primary key(actor_id,request_id)
);
alter table public.scene_comment_requests_v1 enable row level security;
revoke all on public.scene_comment_requests_v1 from public,anon,authenticated;
create or replace function public.scene_submit_comment_v1(p_media_id uuid,p_body text,p_parent_id uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); previous public.scene_comment_requests_v1; result jsonb; owner_id uuid;
begin
 if actor is null then raise exception using errcode='42501',message='authentication_required'; end if;
 if p_request_id is null or p_body is null or length(btrim(p_body)) not between 1 and 800 then raise exception using errcode='22023',message='invalid_comment'; end if;
 select user_id into owner_id from public.media_files where id=p_media_id and deleted_at is null;
 if owner_id is null or (owner_id<>actor and not exists(select 1 from public.published_media_files where id=p_media_id)) then raise exception using errcode='42501',message='media_not_accessible'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('scene-request:'||actor::text||':'||p_request_id::text,0));
 select * into previous from public.scene_comment_requests_v1 where actor_id=actor and request_id=p_request_id;
 if found then
  if previous.media_id<>p_media_id or previous.body<>btrim(p_body) or previous.parent_id is distinct from p_parent_id then raise exception using errcode='23505',message='comment_request_conflict'; end if;
  if previous.comment_id is null then raise exception using errcode='55000',message='comment_removed'; end if;
  return jsonb_build_object('id',previous.comment_id);
 end if;
 result:=public.scene_interaction_v1('add',p_media_id,null,p_body,p_parent_id);
 insert into public.scene_comment_requests_v1 values(actor,p_request_id,p_media_id,p_parent_id,btrim(p_body),(result->>'id')::uuid);
 return result;
end $$;
revoke all on function public.scene_submit_comment_v1(uuid,text,uuid,uuid) from public,anon;
grant execute on function public.scene_submit_comment_v1(uuid,text,uuid,uuid) to authenticated;
commit;
create extension if not exists pgtap with schema extensions;
select plan(9);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','82000000-0000-0000-0000-000000000001','authenticated','authenticated','comment-pages@example.test','',now(),'{}','{}',now(),now());
insert into public.media_files(id,user_id,type,name,status,visibility,is_public)
values('82010000-0000-0000-0000-000000000001','82000000-0000-0000-0000-000000000001','video','pagination','published','public',true);
insert into public.scene_comments_v1(id,media_id,author_id,body,created_at)
select ('82020000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'82010000-0000-0000-0000-000000000001','82000000-0000-0000-0000-000000000001','Commentaire '||n,now() from generate_series(1,1005)n;
select set_config('request.jwt.claim.sub','82000000-0000-0000-0000-000000000001',true);
set local role authenticated;
create temporary table recipe_pages as
with recursive pages(n,data) as (
 select 1,public.scene_comments_page_v1('82010000-0000-0000-0000-000000000001')
 union all
 select n+1,public.scene_comments_page_v1('82010000-0000-0000-0000-000000000001',(data->'next'->>'time')::timestamptz,(data->'next'->>'id')::uuid)
 from pages where data->'next'<>'null'::jsonb and n<10
) select * from pages;
select is((select sum(jsonb_array_length(data->'items'))::integer from recipe_pages),1005,'all comments beyond former 1000 limit');
select is((select count(distinct item->>'id')::integer from recipe_pages,jsonb_array_elements(data->'items')item),1005,'timestamp ties neither duplicate nor skip comments');
select is((select count(*)::integer from recipe_pages),6,'bounded pages');
select throws_ok($$select public.scene_comments_page_v1('82010000-0000-0000-0000-000000000001',now(),null)$$,'22023','invalid_cursor','partial cursor rejected');
select ok(not has_function_privilege('anon','public.scene_comments_page_v1(uuid,timestamptz,uuid,integer)','execute'),'anonymous denied');
reset role;
update public.scene_comments_v1 set created_at=now()-interval '1 minute' where media_id='82010000-0000-0000-0000-000000000001';
set local role authenticated;
select lives_ok($$select public.scene_submit_comment_v1('82010000-0000-0000-0000-000000000001','Nouveau',null,'82030000-0000-0000-0000-000000000001')$$,'idempotent submit');
select lives_ok($$select public.scene_submit_comment_v1('82010000-0000-0000-0000-000000000001','Nouveau',null,'82030000-0000-0000-0000-000000000001')$$,'retry returns original despite rate limit');
select throws_ok($$select public.scene_submit_comment_v1('82010000-0000-0000-0000-000000000001','Autre',null,'82030000-0000-0000-0000-000000000001')$$,'23505','comment_request_conflict','changed request rejected');
reset role;
select is((select count(*)::integer from public.scene_comments_v1 where media_id='82010000-0000-0000-0000-000000000001'),1006,'retry does not duplicate comment');
select * from finish();
