begin;
-- Additive client-neutral contract. Existing media ownership/publication remains authoritative.
create table if not exists public.scene_comments_v1 (
 id uuid primary key default gen_random_uuid(), media_id uuid not null references public.media_files(id) on delete cascade,
 author_id uuid not null references public.profiles(id), parent_id uuid references public.scene_comments_v1(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 800), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), pinned boolean not null default false
);
create index if not exists scene_comments_media_v1 on public.scene_comments_v1(media_id,created_at);
create table if not exists public.scene_comment_likes_v1 (
 comment_id uuid references public.scene_comments_v1(id) on delete cascade, user_id uuid references public.profiles(id),
 primary key(comment_id,user_id)
);
create table if not exists public.scene_media_reports_v1 (
 id uuid primary key default gen_random_uuid(), media_id uuid not null references public.media_files(id),
 reporter_id uuid not null references public.profiles(id), reason text not null check(char_length(reason) between 1 and 1000),
 created_at timestamptz not null default now(), status text not null default 'pending', unique(media_id,reporter_id)
);
alter table public.scene_comments_v1 enable row level security;
alter table public.scene_comment_likes_v1 enable row level security;
alter table public.scene_media_reports_v1 enable row level security;
revoke all on public.scene_comments_v1,public.scene_comment_likes_v1,public.scene_media_reports_v1 from anon,authenticated;
grant all on public.scene_comments_v1,public.scene_comment_likes_v1,public.scene_media_reports_v1 to service_role;
create or replace function public.scene_interaction_v1(p_action text,p_media_id uuid,p_comment_id uuid default null,p_body text default null,p_parent_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid(); owner_id uuid; row_comment public.scene_comments_v1; result jsonb; new_id uuid;
begin
 if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
 select user_id into owner_id from public.media_files where id=p_media_id and deleted_at is null;
 if owner_id is null or (owner_id<>uid and not exists(select 1 from public.published_media_files where id=p_media_id)) then
  raise exception 'media_not_accessible' using errcode='42501';
 end if;
 if p_action='list' then
  select coalesce(jsonb_agg(to_jsonb(x) order by x."createdAt"),'[]'::jsonb) into result from (
   select c.id,c.media_id as "videoId",c.parent_id as "parentId",c.author_id as "authorId",
    coalesce(p.display_name,p.username,'Artiste') as "authorName",coalesce(p.profile_image_url,p.avatar_url,'/avatars/utilisateur.png') as "authorAvatarUrl",
    c.body,c.created_at as "createdAt",c.pinned,false as reported,
    (select count(*) from public.scene_comment_likes_v1 l where l.comment_id=c.id) as "likeCount",
    exists(select 1 from public.scene_comment_likes_v1 l where l.comment_id=c.id and l.user_id=uid) as "likedByViewer"
   from public.scene_comments_v1 c left join public.public_profiles p on p.id=c.author_id where c.media_id=p_media_id order by c.created_at limit 1000
  ) x; return result;
 elsif p_action='add' then
  perform pg_advisory_xact_lock(hashtextextended('scene-comment:'||uid::text,0));
  if exists(select 1 from public.scene_comments_v1 where author_id=uid and created_at>now()-interval '5 seconds') then raise exception 'COMMENT_RATE_LIMITED'; end if;
  if p_parent_id is not null and not exists(select 1 from public.scene_comments_v1 where id=p_parent_id and media_id=p_media_id and parent_id is null) then raise exception 'invalid_parent'; end if;
  insert into public.scene_comments_v1(media_id,author_id,parent_id,body) values(p_media_id,uid,p_parent_id,trim(p_body)) returning id into new_id;
  return jsonb_build_object('id',new_id);
 elsif p_action='report' then
  perform pg_advisory_xact_lock(hashtextextended('scene-report:'||uid::text,0));
  if (select count(*) from public.scene_media_reports_v1 where reporter_id=uid and created_at>now()-interval '1 hour') >= 20 then raise exception 'report_rate_limit'; end if;
  insert into public.scene_media_reports_v1(media_id,reporter_id,reason) values(p_media_id,uid,left(coalesce(nullif(trim(p_body),''),'À examiner'),1000))
   on conflict(media_id,reporter_id) do nothing;
  return jsonb_build_object('ok',true);
 end if;
 select * into row_comment from public.scene_comments_v1 where id=p_comment_id and media_id=p_media_id for update;
 if row_comment.id is null then raise exception 'comment_not_found'; end if;
 if p_action='like' then
  if exists(select 1 from public.scene_comment_likes_v1 where comment_id=p_comment_id and user_id=uid) then
   delete from public.scene_comment_likes_v1 where comment_id=p_comment_id and user_id=uid;
  else insert into public.scene_comment_likes_v1 values(p_comment_id,uid); end if;
 elsif p_action='edit' and row_comment.author_id=uid then
  update public.scene_comments_v1 set body=trim(p_body),updated_at=now() where id=p_comment_id;
 elsif p_action='delete' and (row_comment.author_id=uid or owner_id=uid) then
  delete from public.scene_comments_v1 where id=p_comment_id;
 elsif p_action='pin' and owner_id=uid then
  update public.scene_comments_v1 set pinned=not pinned where id=p_comment_id;
 else raise exception 'action_forbidden' using errcode='42501'; end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.scene_interaction_v1(text,uuid,uuid,text,uuid) from public,anon;
grant execute on function public.scene_interaction_v1(text,uuid,uuid,text,uuid) to authenticated;
create or replace function public.scene_owner_stats_v1(p_days integer default 28)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('impressions',(select count(*) from public.analytics_events e join public.media_files m on m.id::text=e.properties->>'media_id' where m.user_id=auth.uid() and e.event_name='short_impression' and e.occurred_at>now()-make_interval(days=>greatest(1,least(p_days,365)))),
 'comments',(select count(*) from public.scene_comments_v1 c join public.media_files m on m.id=c.media_id where m.user_id=auth.uid() and c.created_at>now()-make_interval(days=>greatest(1,least(p_days,365)))),
 'likes',(select count(*) from public.media_reactions r join public.media_files m on m.id=r.media_id where m.user_id=auth.uid() and r.created_at>now()-make_interval(days=>greatest(1,least(p_days,365))))) where auth.uid() is not null;
$$;
revoke all on function public.scene_owner_stats_v1(integer) from public,anon;
grant execute on function public.scene_owner_stats_v1(integer) to authenticated;
notify pgrst,'reload schema';
commit;
