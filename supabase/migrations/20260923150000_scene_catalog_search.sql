-- Search the complete public catalogue, including artist and published metadata.
-- Secondary multicam sources remain addressable by ID but are not search hits.
create or replace function public.scene_search_catalog_v1(
  p_query text,
  p_limit integer default 48,
  p_offset integer default 0
)
returns setof public.published_media_files
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select media.*
  from public.published_media_files media
  left join public.public_profiles artist on artist.id = media.owner_profile_id
  where media.type in ('video', 'audio')
    and nullif(media.metadata -> 'scene_publication' ->> 'secondaryOf', '') is null
    and length(btrim(coalesce(p_query, ''))) between 2 and 120
    and (
      media.name ilike '%' || btrim(p_query) || '%'
      or coalesce(artist.display_name, '') ilike '%' || btrim(p_query) || '%'
      or coalesce(artist.username, '') ilike '%' || btrim(p_query) || '%'
      or coalesce(media.metadata ->> 'scene_content_type', '') ilike '%' || btrim(p_query) || '%'
      or coalesce(media.metadata ->> 'scene_city', '') ilike '%' || btrim(p_query) || '%'
      or coalesce(media.metadata -> 'scene_publication' ->> 'hashtags', '') ilike '%' || btrim(p_query) || '%'
    )
  order by media.published_at desc nulls last, media.id desc
  limit least(greatest(coalesce(p_limit, 48), 1), 48)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.scene_search_catalog_v1(text, integer, integer) from public;
grant execute on function public.scene_search_catalog_v1(text, integer, integer) to anon, authenticated;
