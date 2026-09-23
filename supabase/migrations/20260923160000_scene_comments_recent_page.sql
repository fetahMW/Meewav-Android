begin;

-- v1 is retained for existing clients. This cursor starts with the newest
-- comments, so a mobile screen can render its first page without waiting for
-- the complete thread history.
create or replace function public.scene_comments_recent_page_v2(
  p_media_id uuid,
  p_before_time timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 200
)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  owner_id uuid;
  result jsonb;
  size integer := greatest(1, least(coalesce(p_limit, 200), 200));
begin
  if uid is null then raise exception using errcode='42501',message='authentication_required'; end if;
  select user_id into owner_id from public.media_files where id=p_media_id and deleted_at is null;
  if owner_id is null or (owner_id<>uid and not exists(select 1 from public.published_media_files where id=p_media_id)) then
    raise exception using errcode='42501',message='media_not_accessible';
  end if;
  if (p_before_time is null)<>(p_before_id is null) then
    raise exception using errcode='22023',message='invalid_cursor';
  end if;
  with page as (
    select c.id,c.media_id as "videoId",c.parent_id as "parentId",c.author_id as "authorId",
      coalesce(p.display_name,p.username,'Artiste') as "authorName",
      coalesce(p.profile_image_url,p.avatar_url,'/avatars/utilisateur.png') as "authorAvatarUrl",
      c.body,c.created_at as "createdAt",c.pinned,false as reported,
      (select count(*) from public.scene_comment_likes_v1 l where l.comment_id=c.id) as "likeCount",
      exists(select 1 from public.scene_comment_likes_v1 l where l.comment_id=c.id and l.user_id=uid) as "likedByViewer"
    from public.scene_comments_v1 c left join public.public_profiles p on p.id=c.author_id
    where c.media_id=p_media_id and (p_before_time is null or (c.created_at,c.id)<(p_before_time,p_before_id))
    order by c.created_at desc,c.id desc limit size+1
  ), visible as (select * from page order by "createdAt" desc,id desc limit size)
  select jsonb_build_object(
    'items',coalesce((select jsonb_agg(to_jsonb(v) order by "createdAt" desc,id desc) from visible v),'[]'::jsonb),
    'next',case when (select count(*) from page)>size then
      (select jsonb_build_object('time',"createdAt",'id',id) from visible order by "createdAt",id limit 1)
      else null end
  ) into result;
  return result;
end $$;

revoke all on function public.scene_comments_recent_page_v2(uuid,timestamptz,uuid,integer) from public,anon;
grant execute on function public.scene_comments_recent_page_v2(uuid,timestamptz,uuid,integer) to authenticated;
notify pgrst,'reload schema';
commit;
