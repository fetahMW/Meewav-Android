begin;

-- One owner-only transition for public listings. Payments and orders remain
-- outside this contract; clients on Android, Web and iOS can share it.
create or replace function public.marketplace_set_listing_status_v1(
  p_listing_id uuid,
  p_expected_version bigint,
  p_status text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.marketplace_require_profile_v1();
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_replay jsonb;
  v_listing public.marketplace_listings%rowtype;
  v_result jsonb;
begin
  if p_listing_id is null or p_expected_version is null or p_expected_version < 1
     or p_status not in ('published', 'paused', 'archived')
     or char_length(v_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_status_request';
  end if;

  v_hash := encode(extensions.digest(
    concat_ws('|', p_listing_id::text, p_expected_version::text, p_status), 'sha256'
  ), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:key:' || v_actor::text || ':listing_status:' || v_key, 0
  ));
  v_replay := public.marketplace_idempotency_replay_v1(
    v_actor, 'listing_status', v_key, v_hash
  );
  if v_replay is not null then return v_replay; end if;

  select listing.* into v_listing
  from public.marketplace_listings listing
  where listing.id = p_listing_id
  for update;
  if not found or v_listing.seller_profile_id is distinct from v_actor then
    raise exception using errcode = 'P0002', message = 'marketplace_listing_not_found';
  end if;
  if v_listing.version <> p_expected_version then
    raise exception using errcode = '40001', message = 'marketplace_listing_version_conflict';
  end if;
  if not (
    (p_status = 'published' and v_listing.status in ('draft', 'paused'))
    or (p_status = 'paused' and v_listing.status = 'published')
    or (p_status = 'archived' and v_listing.status in ('draft', 'published', 'paused'))
  ) then
    raise exception using errcode = '22023', message = 'marketplace_listing_transition_invalid';
  end if;

  if p_status = 'published' then
    if not exists (
      select 1 from public.marketplace_seller_profiles seller
      where seller.profile_id = v_actor and seller.seller_status = 'active'
    ) then
      raise exception using errcode = '42501', message = 'marketplace_seller_not_active';
    end if;
    if v_listing.max_quantity = 0
       or not exists (
         select 1 from public.marketplace_listing_prices price
         where price.listing_id = p_listing_id and price.price_kind = 'primary'
       )
       or not exists (
         select 1 from public.marketplace_listing_media media
         join public.media_files file on file.id = media.media_file_id
         where media.listing_id = p_listing_id and media.media_role = 'cover'
           and file.user_id = v_actor and file.deleted_at is null
           and file.source_pillar = 'marketplace'
           and file.status in ('draft', 'ready', 'published')
       ) then
      raise exception using errcode = '22023', message = 'marketplace_listing_incomplete';
    end if;
  end if;

  update public.marketplace_listings listing
  set status = p_status,
      published_at = case when p_status = 'published'
        then coalesce(listing.published_at, now()) else listing.published_at end
  where listing.id = p_listing_id;

  select jsonb_build_object(
    'listing_id', listing.id,
    'status', listing.status,
    'version', listing.version
  ) into v_result
  from public.marketplace_listings listing
  where listing.id = p_listing_id;

  return public.marketplace_store_idempotency_v1(
    v_actor, 'listing_status', v_key, v_hash, p_listing_id, v_result
  );
end;
$$;

create or replace function public.list_my_marketplace_listings_v1(p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.marketplace_require_profile_v1();
begin
  if p_limit is null or p_limit not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_limit';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(item) order by item.updated_at desc, item.id desc)
    from (
      select listing.id, listing.title, listing.pillar, listing.status,
        listing.version, listing.updated_at, listing.published_at
      from public.marketplace_listings listing
      where listing.seller_profile_id = v_actor and listing.status <> 'archived'
      order by listing.updated_at desc, listing.id desc
      limit p_limit
    ) item
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.marketplace_set_listing_status_v1(uuid,bigint,text,text) from public,anon;
revoke all on function public.list_my_marketplace_listings_v1(integer) from public,anon;
grant execute on function public.marketplace_set_listing_status_v1(uuid,bigint,text,text) to authenticated;
grant execute on function public.list_my_marketplace_listings_v1(integer) to authenticated;

notify pgrst, 'reload schema';
commit;
