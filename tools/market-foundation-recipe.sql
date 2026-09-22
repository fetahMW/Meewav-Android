begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Marketplace v1 — catalogue and intent foundation (Phase A)
--
-- This phase deliberately stops before orders, payments, payouts and ledgers.
-- It owns seller catalogue metadata, listings, server-owned prices, media
-- references, favorites, a mono-seller/mono-currency cart and non-financial
-- rental/service/collective intents. Browser clients use the versioned RPCs;
-- raw tables are private and protected by RLS.
-- ---------------------------------------------------------------------------

create table if not exists public.marketplace_seller_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  rating_basis_points integer not null default 0
    check (rating_basis_points between 0 and 50000),
  rating_count integer not null default 0 check (rating_count >= 0),
  completed_orders_count integer not null default 0
    check (completed_orders_count >= 0),
  response_time_bucket text
    check (response_time_bucket is null or response_time_bucket in (
      'under_1h', 'under_4h', 'same_day', 'under_48h', 'over_48h'
    )),
  seller_status text not null default 'active'
    check (seller_status in ('active', 'paused', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null
    references public.marketplace_seller_profiles(profile_id) on delete cascade,
  slug text not null unique,
  pillar text not null
    check (pillar in ('new', 'used', 'rental', 'services', 'collective')),
  category_code text not null,
  title text not null,
  short_description text not null,
  description text not null,
  brand text,
  model text,
  condition_code text,
  condition_label text,
  status text not null default 'draft'
    check (status in (
      'draft', 'pending_review', 'published', 'paused', 'sold_out',
      'rejected', 'archived'
    )),
  badge_label text,
  city_label text,
  area_label text,
  pickup_enabled boolean not null default false,
  shipping_enabled boolean not null default false,
  remote_enabled boolean not null default false,
  preparation_days integer not null default 0
    check (preparation_days between 0 and 365),
  max_quantity integer not null default 1 check (max_quantity between 0 and 100000),
  terms jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  check (char_length(category_code) between 1 and 80),
  check (char_length(title) between 3 and 140),
  check (char_length(short_description) between 3 and 280),
  check (char_length(description) between 3 and 5000),
  check (brand is null or char_length(brand) <= 120),
  check (model is null or char_length(model) <= 120),
  check (condition_code is null or char_length(condition_code) <= 80),
  check (condition_label is null or char_length(condition_label) <= 120),
  check (badge_label is null or char_length(badge_label) <= 80),
  check (city_label is null or char_length(city_label) <= 120),
  check (area_label is null or char_length(area_label) <= 120),
  check (pickup_enabled or shipping_enabled or remote_enabled),
  check (octet_length(terms::text) <= 8192),
  check (
    (status = 'published' and published_at is not null)
    or status <> 'published'
  )
);

create index if not exists marketplace_listings_catalog_idx
  on public.marketplace_listings(published_at desc, id desc)
  where status = 'published';
create index if not exists marketplace_listings_seller_idx
  on public.marketplace_listings(seller_profile_id, status, updated_at desc);
create index if not exists marketplace_listings_pillar_category_idx
  on public.marketplace_listings(pillar, category_code, published_at desc, id desc)
  where status = 'published';

create table if not exists public.marketplace_listing_prices (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  price_kind text not null
    check (price_kind in (
      'primary', 'compare_at', 'shipping', 'deposit', 'weekend', 'weekly',
      'collective_retail', 'collective_unlocked'
    )),
  currency_code text not null default 'EUR' check (currency_code = 'EUR'),
  amount_minor bigint not null
    check (amount_minor between 0 and 1000000000000),
  price_unit text not null
    check (price_unit in ('item', 'day', 'session', 'ticket', 'participant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, price_kind)
);

create index if not exists marketplace_listing_prices_listing_idx
  on public.marketplace_listing_prices(listing_id, price_kind);

create table if not exists public.marketplace_listing_media (
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  media_file_id uuid not null references public.media_files(id) on delete cascade,
  media_role text not null default 'gallery'
    check (media_role in ('cover', 'gallery')),
  position integer not null check (position between 0 and 11),
  alt_text text,
  created_at timestamptz not null default now(),
  primary key (listing_id, media_file_id),
  unique (listing_id, position),
  check (alt_text is null or char_length(alt_text) <= 240)
);

create unique index if not exists marketplace_listing_one_cover_idx
  on public.marketplace_listing_media(listing_id)
  where media_role = 'cover';

create table if not exists public.marketplace_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, listing_id)
);

create index if not exists marketplace_favorites_profile_idx
  on public.marketplace_favorites(profile_id, created_at desc);

create table if not exists public.marketplace_cart_items (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, listing_id)
);

create index if not exists marketplace_cart_items_profile_idx
  on public.marketplace_cart_items(profile_id, updated_at desc);

create table if not exists public.marketplace_intents (
  id uuid primary key default gen_random_uuid(),
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  seller_profile_id uuid references public.profiles(id) on delete set null,
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  kind text not null
    check (kind in ('rental_request', 'service_booking', 'collective_join')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  requested_quantity integer not null default 1
    check (requested_quantity between 1 and 20),
  starts_on date,
  ends_on date,
  requested_for timestamptz,
  note text,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  check (note is null or char_length(note) <= 1000),
  check (octet_length(pricing_snapshot::text) <= 8192),
  check (ends_on is null or starts_on is not null),
  check (ends_on is null or ends_on > starts_on)
);

create unique index if not exists marketplace_one_active_intent_idx
  on public.marketplace_intents(buyer_profile_id, listing_id, kind)
  where status in ('pending', 'accepted');
create index if not exists marketplace_intents_buyer_idx
  on public.marketplace_intents(buyer_profile_id, status, created_at desc);
create index if not exists marketplace_intents_seller_idx
  on public.marketplace_intents(seller_profile_id, status, created_at desc);

create table if not exists public.marketplace_idempotency (
  actor_profile_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  request_hash text not null,
  result jsonb not null,
  listing_id uuid
    references public.marketplace_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor_profile_id, operation, idempotency_key),
  check (char_length(operation) between 3 and 80),
  check (char_length(idempotency_key) between 8 and 128),
  check (request_hash ~ '^[0-9a-f]{64}$'),
  check (octet_length(result::text) <= 16384)
);

create index if not exists marketplace_idempotency_created_idx
  on public.marketplace_idempotency(created_at);

-- ---------------------------------------------------------------------------
-- Internal invariants and idempotency helpers.
-- ---------------------------------------------------------------------------

create or replace function public.marketplace_touch_updated_at_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  if tg_table_name in ('marketplace_seller_profiles', 'marketplace_listings') then
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_seller_profiles_touch_v1
  on public.marketplace_seller_profiles;
create trigger marketplace_seller_profiles_touch_v1
before update on public.marketplace_seller_profiles
for each row execute function public.marketplace_touch_updated_at_v1();

drop trigger if exists marketplace_listings_touch_v1
  on public.marketplace_listings;
create trigger marketplace_listings_touch_v1
before update on public.marketplace_listings
for each row execute function public.marketplace_touch_updated_at_v1();

drop trigger if exists marketplace_listing_prices_touch_v1
  on public.marketplace_listing_prices;
create trigger marketplace_listing_prices_touch_v1
before update on public.marketplace_listing_prices
for each row execute function public.marketplace_touch_updated_at_v1();

drop trigger if exists marketplace_cart_items_touch_v1
  on public.marketplace_cart_items;
create trigger marketplace_cart_items_touch_v1
before update on public.marketplace_cart_items
for each row execute function public.marketplace_touch_updated_at_v1();

drop trigger if exists marketplace_intents_touch_v1
  on public.marketplace_intents;
create trigger marketplace_intents_touch_v1
before update on public.marketplace_intents
for each row execute function public.marketplace_touch_updated_at_v1();

-- Keep media ownership and purpose as database invariants, not only RPC
-- validation. This also protects the public catalogue if a privileged
-- maintenance job attaches media directly.
create or replace function public.marketplace_validate_listing_media_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seller_profile_id uuid;
  v_media public.media_files%rowtype;
begin
  select listing.seller_profile_id
    into v_seller_profile_id
  from public.marketplace_listings listing
  where listing.id = new.listing_id;

  select file.*
    into v_media
  from public.media_files file
  where file.id = new.media_file_id;

  if v_seller_profile_id is null
     or not found
     or v_media.user_id is distinct from v_seller_profile_id
     or v_media.deleted_at is not null
     or coalesce(v_media.status, '') not in ('draft', 'ready', 'published')
     or coalesce(v_media.source_pillar, '') <> 'marketplace'
     or coalesce(v_media.mime_type, '') not in (
       'image/jpeg', 'image/png', 'image/webp', 'image/avif',
       'video/mp4', 'video/quicktime', 'video/webm'
     ) then
    raise exception using
      errcode = '42501',
      message = 'marketplace_media_not_owned_or_unavailable';
  end if;

  if coalesce(v_media.size_bytes, v_media.file_size::bigint, 0) <= 0 then
    raise exception using
      errcode = '22023',
      message = 'marketplace_media_size_required';
  end if;

  if coalesce(v_media.size_bytes, v_media.file_size::bigint) > 12 * 1024 * 1024 then
    raise exception using
      errcode = '22023',
      message = 'marketplace_media_too_large';
  end if;

  if new.media_role = 'cover'
     and coalesce(v_media.mime_type, '') not in (
       'image/jpeg', 'image/png', 'image/webp', 'image/avif'
     ) then
    raise exception using
      errcode = '22023',
      message = 'marketplace_cover_must_be_image';
  end if;

  return new;
end;
$$;

drop trigger if exists marketplace_listing_media_validate_v1
  on public.marketplace_listing_media;
create trigger marketplace_listing_media_validate_v1
before insert or update of listing_id, media_file_id, media_role
on public.marketplace_listing_media
for each row execute function public.marketplace_validate_listing_media_v1();

create or replace function public.marketplace_require_profile_v1()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if not exists (select 1 from public.profiles profile where profile.id = v_user_id) then
    raise exception using errcode = '42501', message = 'profile_required';
  end if;
  return v_user_id;
end;
$$;

create or replace function public.marketplace_idempotency_replay_v1(
  p_actor_profile_id uuid,
  p_operation text,
  p_idempotency_key text,
  p_request_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_record public.marketplace_idempotency%rowtype;
begin
  select idempotency.* into v_record
  from public.marketplace_idempotency idempotency
  where idempotency.actor_profile_id = p_actor_profile_id
    and idempotency.operation = p_operation
    and idempotency.idempotency_key = p_idempotency_key
  for update;
  if not found then return null; end if;
  if v_record.request_hash <> p_request_hash then
    raise exception using errcode = '23505', message = 'idempotency_conflict';
  end if;
  return v_record.result || jsonb_build_object('idempotent', true);
end;
$$;

create or replace function public.marketplace_store_idempotency_v1(
  p_actor_profile_id uuid,
  p_operation text,
  p_idempotency_key text,
  p_request_hash text,
  p_listing_id uuid,
  p_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.marketplace_idempotency (
    actor_profile_id, operation, idempotency_key, request_hash, listing_id, result
  ) values (
    p_actor_profile_id, p_operation, p_idempotency_key, p_request_hash,
    case
      when exists (
        select 1 from public.marketplace_listings listing
        where listing.id = p_listing_id
      ) then p_listing_id
      else null
    end,
    p_result
  );
  return p_result || jsonb_build_object('idempotent', false);
end;
$$;

create or replace function public.marketplace_jsonb_integer_v1(
  p_payload jsonb,
  p_key text,
  p_minimum bigint,
  p_maximum bigint,
  p_required boolean default true
)
returns bigint
language plpgsql
immutable
security definer
set search_path = public, pg_temp
as $$
declare
  v_value_text text := p_payload ->> p_key;
  v_value numeric;
begin
  if v_value_text is null then
    if p_required then
      raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
    end if;
    return null;
  end if;
  if jsonb_typeof(p_payload -> p_key) is distinct from 'number'
     or v_value_text !~ '^-?[0-9]+$'
     or char_length(v_value_text) > 20 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
  end if;
  v_value := v_value_text::numeric;
  if v_value < p_minimum or v_value > p_maximum then
    raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
  end if;
  return v_value::bigint;
end;
$$;

-- ---------------------------------------------------------------------------
-- Safe public catalogue projection.
-- ---------------------------------------------------------------------------

create or replace function public.list_marketplace_catalog_v1(
  p_cursor_published_at timestamptz default null,
  p_cursor_listing_id uuid default null,
  p_limit integer default 48,
  p_pillar text default null,
  p_category_code text default null,
  p_search text default null,
  p_listing_ids uuid[] default null
)
returns table (
  listing_id uuid,
  seller_profile_id uuid,
  seller_display_name text,
  seller_username text,
  seller_avatar_url text,
  seller_grade_level smallint,
  seller_verified boolean,
  seller_rating_basis_points integer,
  seller_rating_count integer,
  seller_completed_orders_count integer,
  seller_response_time_bucket text,
  slug text,
  pillar text,
  category_code text,
  title text,
  short_description text,
  description text,
  brand text,
  model text,
  condition_code text,
  condition_label text,
  cover_url text,
  cover_storage_bucket text,
  cover_storage_path text,
  cover_alt text,
  badge_label text,
  city_label text,
  area_label text,
  pickup_enabled boolean,
  shipping_enabled boolean,
  shipping_amount_minor bigint,
  currency_code text,
  unit_amount_minor bigint,
  compare_at_amount_minor bigint,
  price_unit text,
  max_quantity integer,
  preparation_days integer,
  new_terms jsonb,
  used_terms jsonb,
  rental_terms jsonb,
  service_terms jsonb,
  collective_terms jsonb,
  published_at timestamptz,
  next_cursor_published_at timestamptz,
  next_cursor_listing_id uuid
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer := coalesce(p_limit, 48);
  v_pillar text := nullif(trim(coalesce(p_pillar, '')), '');
  v_category text := nullif(trim(coalesce(p_category_code, '')), '');
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_listing_ids uuid[];
begin
  if p_listing_ids is not null then
    if cardinality(p_listing_ids) not between 1 and 100
       or p_cursor_published_at is not null
       or p_cursor_listing_id is not null
       or v_pillar is not null
       or v_category is not null
       or v_search is not null then
      raise exception using errcode = '22023', message = 'invalid_marketplace_listing_ids';
    end if;
    select array_agg(distinct requested.listing_id order by requested.listing_id)
      into v_listing_ids
    from unnest(p_listing_ids) requested(listing_id);
    v_limit := cardinality(v_listing_ids);
  end if;
  if v_limit not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_limit';
  end if;
  if (p_cursor_published_at is null) <> (p_cursor_listing_id is null) then
    raise exception using errcode = '22023', message = 'invalid_marketplace_cursor';
  end if;
  if v_pillar is not null and v_pillar not in (
    'new', 'used', 'rental', 'services', 'collective'
  ) then
    raise exception using errcode = '22023', message = 'invalid_marketplace_pillar';
  end if;
  if v_category is not null and char_length(v_category) > 80 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_category';
  end if;
  if v_search is not null and char_length(v_search) > 120 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_search';
  end if;

  return query
  with ranked as (
    select
      listing.*,
      row_number() over (
        order by listing.published_at desc, listing.id desc
      ) as ordinal
    from public.marketplace_listings listing
    join public.marketplace_seller_profiles seller
      on seller.profile_id = listing.seller_profile_id
     and seller.seller_status = 'active'
    join public.profiles profile on profile.id = listing.seller_profile_id
    where listing.status = 'published'
      and listing.published_at is not null
      and coalesce(profile.show_on_public_profile, false)
      and not coalesce(profile.is_ghost_mode, true)
      and (v_listing_ids is null or listing.id = any(v_listing_ids))
      and (
        p_cursor_published_at is null
        or (listing.published_at, listing.id)
           < (p_cursor_published_at, p_cursor_listing_id)
      )
      and (v_pillar is null or listing.pillar = v_pillar)
      and (v_category is null or listing.category_code = v_category)
      and (
        v_search is null
        or strpos(
          lower(concat_ws(' ', listing.title, listing.short_description,
            listing.brand, listing.model, listing.category_code,
            listing.city_label, listing.area_label,
            profile.display_name, profile.full_name, profile.username)),
          lower(v_search)
        ) > 0
      )
    order by listing.published_at desc, listing.id desc
    limit v_limit + 1
  ),
  page_meta as (
    select exists(select 1 from ranked where ordinal = v_limit + 1) as has_more
  )
  select
    listing.id,
    listing.seller_profile_id,
    coalesce(profile.display_name, profile.full_name, profile.username, 'Artiste'),
    profile.username,
    coalesce(profile.profile_image_url, profile.avatar_url),
    case
      when coalesce(profile.public_profile_preferences ->> 'show_grade', 'true') <> 'false'
        then grade_state.level
      else null
    end,
    coalesce(profile.is_verified, false),
    seller.rating_basis_points,
    seller.rating_count,
    seller.completed_orders_count,
    seller.response_time_bucket,
    listing.slug,
    listing.pillar,
    listing.category_code,
    listing.title,
    listing.short_description,
    listing.description,
    listing.brand,
    listing.model,
    listing.condition_code,
    listing.condition_label,
    media.cover_url,
    media.storage_bucket,
    media.storage_path,
    media.cover_alt,
    listing.badge_label,
    listing.city_label,
    listing.area_label,
    listing.pickup_enabled,
    listing.shipping_enabled,
    case when listing.shipping_enabled
      then coalesce(shipping_price.amount_minor, 0)
      else 0
    end,
    primary_price.currency_code,
    primary_price.amount_minor,
    compare_price.amount_minor,
    primary_price.price_unit,
    listing.max_quantity,
    listing.preparation_days,
    case when listing.pillar = 'new' then listing.terms else null end,
    case when listing.pillar = 'used' then listing.terms else null end,
    case when listing.pillar = 'rental' then listing.terms else null end,
    case when listing.pillar = 'services' then listing.terms else null end,
    case when listing.pillar = 'collective' then collective_metrics.terms else null end,
    listing.published_at,
    case
      when listing.ordinal = v_limit and page_meta.has_more
        then listing.published_at
      else null
    end,
    case
      when listing.ordinal = v_limit and page_meta.has_more then listing.id
      else null
    end
  from ranked listing
  cross join page_meta
  join public.marketplace_seller_profiles seller
    on seller.profile_id = listing.seller_profile_id
  join public.profiles profile on profile.id = listing.seller_profile_id
  left join public.profile_grade_state grade_state
    on grade_state.profile_id = listing.seller_profile_id
  join lateral (
    select price.currency_code, price.amount_minor, price.price_unit
    from public.marketplace_listing_prices price
    where price.listing_id = listing.id and price.price_kind = 'primary'
  ) primary_price on true
  left join lateral (
    select price.amount_minor
    from public.marketplace_listing_prices price
    where price.listing_id = listing.id and price.price_kind = 'compare_at'
  ) compare_price on true
  left join lateral (
    select price.amount_minor
    from public.marketplace_listing_prices price
    where price.listing_id = listing.id and price.price_kind = 'shipping'
  ) shipping_price on true
  left join lateral (
    select
      max(price.amount_minor) filter (
        where price.price_kind = 'collective_retail'
      ) as retail_amount_minor,
      max(price.amount_minor) filter (
        where price.price_kind = 'collective_unlocked'
      ) as unlocked_amount_minor
    from public.marketplace_listing_prices price
    where price.listing_id = listing.id
  ) collective_prices on listing.pillar = 'collective'
  left join lateral (
    select coalesce(sum(intent.requested_quantity), 0)::integer as joined
    from public.marketplace_intents intent
    where intent.listing_id = listing.id
      and intent.kind = 'collective_join'
      and intent.status in ('pending', 'accepted')
  ) collective_state on listing.pillar = 'collective'
  left join lateral (
    select jsonb_build_object(
      'joined', least(listing.max_quantity, coalesce(collective_state.joined, 0)),
      'target_participants', greatest(listing.max_quantity, 1),
      'progress_percent', case
        when listing.max_quantity > 0 then least(100, floor(
          least(listing.max_quantity, coalesce(collective_state.joined, 0))
          * 100.0 / listing.max_quantity
        )::integer)
        else 0
      end,
      'days_remaining', greatest(0, ceil(extract(epoch from (
        listing.published_at + make_interval(days => case
          when coalesce(listing.terms ->> 'campaign_days', '') ~ '^\d{1,3}$'
            then (listing.terms ->> 'campaign_days')::integer
          else 0
        end) - now()
      )) / 86400.0)::integer),
      'retail_unit_amount_minor', coalesce(
        collective_prices.retail_amount_minor,
        primary_price.amount_minor
      ),
      'unlocked_unit_amount_minor', coalesce(
        collective_prices.unlocked_amount_minor,
        primary_price.amount_minor
      ),
      'savings_percent', case
        when coalesce(collective_prices.retail_amount_minor, primary_price.amount_minor) > 0
          then least(100, greatest(0, round(
            (
              coalesce(collective_prices.retail_amount_minor, primary_price.amount_minor)
              - coalesce(collective_prices.unlocked_amount_minor, primary_price.amount_minor)
            ) * 100.0
            / coalesce(collective_prices.retail_amount_minor, primary_price.amount_minor)
          )::integer))
        else 0
      end
    ) as terms
  ) collective_metrics on listing.pillar = 'collective'
  left join lateral (
    select
      coalesce(file.file_url, file.cover_url) as cover_url,
      file.storage_bucket,
      file.storage_path,
      listing_media.alt_text as cover_alt
    from public.marketplace_listing_media listing_media
    join public.media_files file on file.id = listing_media.media_file_id
    where listing_media.listing_id = listing.id
      and listing_media.media_role = 'cover'
      and file.user_id = listing.seller_profile_id
      and file.source_pillar = 'marketplace'
      and file.mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
      and coalesce(file.size_bytes, file.file_size::bigint)
        between 0 and 12 * 1024 * 1024
      and file.status = 'published'
      and file.visibility = 'public'
      and file.deleted_at is null
    limit 1
  ) media on true
  where listing.ordinal <= v_limit
  order by listing.published_at desc, listing.id desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Authenticated viewer state and idempotent mutations.
-- ---------------------------------------------------------------------------

create or replace function public.get_my_marketplace_state_v1()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
begin
  return jsonb_build_object(
    'favorite_listing_ids', coalesce((
      select jsonb_agg(favorite.listing_id order by favorite.created_at desc)
      from public.marketplace_favorites favorite
      where favorite.profile_id = v_user_id
    ), '[]'::jsonb),
    'cart_items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'listing_id', cart.listing_id,
          'quantity', cart.quantity
        ) order by cart.updated_at desc
      )
      from public.marketplace_cart_items cart
      where cart.profile_id = v_user_id
    ), '[]'::jsonb),
    'joined_collective_listing_ids', coalesce((
      select jsonb_agg(intent.listing_id order by intent.created_at desc)
      from public.marketplace_intents intent
      where intent.buyer_profile_id = v_user_id
        and intent.kind = 'collective_join'
        and intent.status in ('pending', 'accepted')
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.set_marketplace_favorite_v1(
  p_listing_id uuid,
  p_favorite boolean,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_replay jsonb;
  v_result jsonb;
begin
  if p_listing_id is null or p_favorite is null
     or char_length(v_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_request';
  end if;
  v_hash := encode(extensions.digest(
    concat_ws('|', p_listing_id, p_favorite), 'sha256'
  ), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:key:' || v_user_id::text || ':favorite:' || v_key, 0
  ));
  v_replay := public.marketplace_idempotency_replay_v1(
    v_user_id, 'favorite', v_key, v_hash
  );
  if v_replay is not null then return v_replay; end if;

  if p_favorite and not exists (
    select 1
    from public.marketplace_listings listing
    join public.marketplace_seller_profiles seller
      on seller.profile_id = listing.seller_profile_id
    join public.profiles profile on profile.id = listing.seller_profile_id
    where listing.id = p_listing_id
      and listing.status = 'published'
      and seller.seller_status = 'active'
      and coalesce(profile.show_on_public_profile, false)
      and not coalesce(profile.is_ghost_mode, true)
  ) then
    raise exception using errcode = 'P0002', message = 'marketplace_listing_not_found';
  end if;

  if p_favorite then
    insert into public.marketplace_favorites(profile_id, listing_id)
    values (v_user_id, p_listing_id)
    on conflict (profile_id, listing_id) do nothing;
  else
    delete from public.marketplace_favorites
    where profile_id = v_user_id and listing_id = p_listing_id;
  end if;
  v_result := jsonb_build_object(
    'listing_id', p_listing_id, 'favorite', p_favorite
  );
  return public.marketplace_store_idempotency_v1(
    v_user_id, 'favorite', v_key, v_hash,
    case when p_favorite then p_listing_id else null end,
    v_result
  );
end;
$$;

create or replace function public.set_marketplace_cart_item_v1(
  p_listing_id uuid,
  p_quantity integer,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_replay jsonb;
  v_seller_profile_id uuid;
  v_listing_max_quantity integer;
  v_currency text;
  v_conflicting_item boolean;
  v_result jsonb;
begin
  if p_listing_id is null or p_quantity is null
     or p_quantity not between 0 and 99
     or char_length(v_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_request';
  end if;
  v_hash := encode(extensions.digest(
    concat_ws('|', p_listing_id, p_quantity), 'sha256'
  ), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:key:' || v_user_id::text || ':cart:' || v_key, 0
  ));
  v_replay := public.marketplace_idempotency_replay_v1(
    v_user_id, 'cart_item', v_key, v_hash
  );
  if v_replay is not null then return v_replay; end if;
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:cart:' || v_user_id::text, 0
  ));

  if p_quantity = 0 then
    delete from public.marketplace_cart_items
    where profile_id = v_user_id and listing_id = p_listing_id;
  else
    select listing.seller_profile_id, listing.max_quantity, price.currency_code
      into v_seller_profile_id, v_listing_max_quantity, v_currency
    from public.marketplace_listings listing
    join public.marketplace_listing_prices price
      on price.listing_id = listing.id and price.price_kind = 'primary'
    join public.marketplace_seller_profiles seller
      on seller.profile_id = listing.seller_profile_id
     and seller.seller_status = 'active'
    join public.profiles profile on profile.id = listing.seller_profile_id
    where listing.id = p_listing_id
      and listing.status = 'published'
      and listing.pillar in ('new', 'used')
      and coalesce(profile.show_on_public_profile, false)
      and not coalesce(profile.is_ghost_mode, true)
    for update of listing;
    if not found then
      raise exception using errcode = 'P0002', message = 'marketplace_listing_not_found';
    end if;
    if v_seller_profile_id = v_user_id then
      raise exception using errcode = '22023', message = 'cannot_purchase_own_listing';
    end if;
    if p_quantity > v_listing_max_quantity then
      raise exception using errcode = '22023', message = 'marketplace_quantity_unavailable';
    end if;

    select exists (
      select 1
      from public.marketplace_cart_items cart
      join public.marketplace_listings existing_listing
        on existing_listing.id = cart.listing_id
      join public.marketplace_listing_prices existing_price
        on existing_price.listing_id = existing_listing.id
       and existing_price.price_kind = 'primary'
      where cart.profile_id = v_user_id
        and cart.listing_id <> p_listing_id
        and (
          existing_listing.seller_profile_id <> v_seller_profile_id
          or existing_price.currency_code <> v_currency
        )
    ) into v_conflicting_item;
    if v_conflicting_item then
      raise exception using errcode = '22023', message = 'marketplace_cart_scope_conflict';
    end if;

    insert into public.marketplace_cart_items(profile_id, listing_id, quantity)
    values (v_user_id, p_listing_id, p_quantity)
    on conflict (profile_id, listing_id) do update
      set quantity = excluded.quantity;
  end if;

  v_result := jsonb_build_object(
    'listing_id', p_listing_id, 'quantity', p_quantity
  );
  return public.marketplace_store_idempotency_v1(
    v_user_id, 'cart_item', v_key, v_hash,
    case when p_quantity > 0 then p_listing_id else null end,
    v_result
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Listing draft creation. All accepted input is normalized into explicit
-- columns/terms; arbitrary client JSON is never persisted.
-- ---------------------------------------------------------------------------

create or replace function public.create_marketplace_listing_draft_v1(
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_replay jsonb;
  v_pillar text := trim(coalesce(p_payload ->> 'pillar', ''));
  v_category text := trim(coalesce(p_payload ->> 'category_code', ''));
  v_title text := trim(coalesce(p_payload ->> 'title', ''));
  v_short text := trim(coalesce(p_payload ->> 'short_description', ''));
  v_description text := trim(coalesce(p_payload ->> 'description', ''));
  v_brand text := nullif(trim(coalesce(p_payload ->> 'brand', '')), '');
  v_model text := nullif(trim(coalesce(p_payload ->> 'model', '')), '');
  v_condition text := nullif(trim(coalesce(p_payload ->> 'condition_code', '')), '');
  v_city text := nullif(trim(coalesce(p_payload ->> 'city', '')), '');
  v_area text := nullif(trim(coalesce(p_payload ->> 'area', '')), '');
  v_currency text := trim(coalesce(p_payload ->> 'currency_code', ''));
  v_price_unit text := trim(coalesce(p_payload ->> 'price_unit', ''));
  v_pickup boolean;
  v_shipping boolean;
  v_remote boolean;
  v_amount bigint;
  v_shipping_amount bigint;
  v_preparation_days bigint;
  v_terms_input jsonb := p_payload -> 'terms';
  v_terms jsonb;
  v_max_quantity integer;
  v_compare_amount bigint;
  v_listing_id uuid := gen_random_uuid();
  v_slug_base text;
  v_media_count integer;
  v_result jsonb;
begin
  if p_payload is null or jsonb_typeof(p_payload) is distinct from 'object'
     or char_length(v_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
  end if;
  v_hash := encode(extensions.digest(p_payload::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:key:' || v_user_id::text || ':listing_draft:' || v_key, 0
  ));
  v_replay := public.marketplace_idempotency_replay_v1(
    v_user_id, 'listing_draft', v_key, v_hash
  );
  if v_replay is not null then return v_replay; end if;

  if v_pillar not in ('new', 'used', 'rental', 'services', 'collective')
     or char_length(v_category) not between 1 and 80
     or char_length(v_title) not between 3 and 140
     or char_length(v_short) not between 3 and 280
     or char_length(v_description) not between 3 and 5000
     or char_length(coalesce(v_brand, '')) > 120
     or char_length(coalesce(v_model, '')) > 120
     or char_length(coalesce(v_condition, '')) > 80
     or char_length(coalesce(v_city, '')) > 120
     or char_length(coalesce(v_area, '')) > 120
     or v_currency <> 'EUR'
     or v_price_unit not in ('item', 'day', 'session', 'ticket', 'participant')
     or jsonb_typeof(v_terms_input) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
  end if;

  if jsonb_typeof(p_payload -> 'pickup') is distinct from 'boolean'
     or jsonb_typeof(p_payload -> 'shipping') is distinct from 'boolean'
     or jsonb_typeof(p_payload -> 'remote') is distinct from 'boolean' then
    raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
  end if;
  v_pickup := (p_payload ->> 'pickup')::boolean;
  v_shipping := (p_payload ->> 'shipping')::boolean;
  v_remote := (p_payload ->> 'remote')::boolean;
  if not (v_pickup or v_shipping or v_remote) then
    raise exception using errcode = '22023', message = 'marketplace_fulfillment_required';
  end if;

  v_amount := public.marketplace_jsonb_integer_v1(
    p_payload, 'unit_amount_minor', 0, 1000000000000
  );
  v_shipping_amount := coalesce(public.marketplace_jsonb_integer_v1(
    p_payload, 'shipping_amount_minor', 0, 1000000000000, false
  ), 0);
  v_preparation_days := coalesce(public.marketplace_jsonb_integer_v1(
    p_payload, 'preparation_days', 0, 365, false
  ), 0);

  if (v_pillar in ('new', 'used') and v_price_unit <> 'item')
     or (v_pillar = 'rental' and v_price_unit <> 'day')
     or (v_pillar = 'services' and v_price_unit not in ('session', 'ticket'))
     or (v_pillar = 'collective' and v_price_unit <> 'participant') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_price_unit';
  end if;

  if coalesce(p_payload -> 'media_file_ids', '[]'::jsonb) = 'null'::jsonb then
    p_payload := jsonb_set(p_payload, '{media_file_ids}', '[]'::jsonb);
  end if;
  if jsonb_typeof(coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)) is distinct from 'array'
     or jsonb_array_length(coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)) not between 1 and 8 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_media';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)) value
    where jsonb_typeof(value) is distinct from 'string'
       or trim(both '"' from value::text) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ) then
    raise exception using errcode = '22023', message = 'invalid_marketplace_media';
  end if;
  if (
    select count(distinct media_id.value)
    from jsonb_array_elements_text(
      coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)
    ) media_id(value)
  ) <> jsonb_array_length(coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)) then
    raise exception using errcode = '22023', message = 'marketplace_duplicate_media';
  end if;
  select count(*) into v_media_count
  from (
    select distinct value::uuid as media_id
    from jsonb_array_elements_text(coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)) value
  ) requested
  join public.media_files file
    on file.id = requested.media_id
   and file.user_id = v_user_id
   and file.deleted_at is null
   and file.status in ('draft', 'ready', 'published')
   and file.source_pillar = 'marketplace'
   and file.mime_type in (
     'image/jpeg', 'image/png', 'image/webp', 'image/avif',
     'video/mp4', 'video/quicktime', 'video/webm'
   );
  if v_media_count <> jsonb_array_length(coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)) then
    raise exception using errcode = '42501', message = 'marketplace_media_not_owned_or_unavailable';
  end if;
  if exists (
    select 1
    from jsonb_array_elements_text(
      coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)
    ) requested(media_id)
    join public.media_files file on file.id = requested.media_id::uuid
    where file.user_id = v_user_id
      and file.deleted_at is null
      and file.status in ('draft', 'ready', 'published')
      and file.source_pillar = 'marketplace'
      and coalesce(file.size_bytes, file.file_size::bigint, 0) <= 0
  ) then
    raise exception using errcode = '22023', message = 'marketplace_media_size_required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements_text(
      coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)
    ) requested(media_id)
    join public.media_files file on file.id = requested.media_id::uuid
    where file.user_id = v_user_id
      and file.deleted_at is null
      and file.status in ('draft', 'ready', 'published')
      and file.source_pillar = 'marketplace'
      and coalesce(file.size_bytes, file.file_size::bigint) > 12 * 1024 * 1024
  ) then
    raise exception using errcode = '22023', message = 'marketplace_media_too_large';
  end if;
  if not exists (
    select 1
    from public.media_files cover
    where cover.id = (p_payload -> 'media_file_ids' ->> 0)::uuid
      and cover.user_id = v_user_id
      and cover.deleted_at is null
      and cover.status in ('draft', 'ready', 'published')
      and cover.source_pillar = 'marketplace'
      and cover.mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
  ) then
    raise exception using errcode = '22023', message = 'marketplace_cover_must_be_image';
  end if;

  if v_pillar = 'new' then
    v_max_quantity := public.marketplace_jsonb_integer_v1(
      v_terms_input, 'stock', 0, 100000
    )::integer;
    perform public.marketplace_jsonb_integer_v1(
      v_terms_input, 'warranty_months', 0, 240
    );
    v_compare_amount := public.marketplace_jsonb_integer_v1(
      v_terms_input, 'compare_at_amount_minor', 0, 1000000000000, false
    );
    if v_compare_amount is not null and v_compare_amount < v_amount then
      raise exception using errcode = '22023', message = 'invalid_marketplace_compare_price';
    end if;
    v_terms := jsonb_build_object(
      'stock', v_max_quantity,
      'warranty_months', (v_terms_input ->> 'warranty_months')::integer,
      'compare_at_amount_minor', v_compare_amount
    );
  elsif v_pillar = 'used' then
    v_max_quantity := 1;
    if v_terms_input ? 'purchase_year'
       and v_terms_input -> 'purchase_year' <> 'null'::jsonb then
      perform public.marketplace_jsonb_integer_v1(
        v_terms_input, 'purchase_year', 1900,
        extract(year from current_date)::bigint + 1
      );
    end if;
    if jsonb_typeof(v_terms_input -> 'negotiable') is distinct from 'boolean'
       or char_length(coalesce(v_terms_input ->> 'condition_notes', '')) > 2000 then
      raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
    end if;
    v_terms := jsonb_build_object(
      'purchase_year', case
        when v_terms_input -> 'purchase_year' is null
          or v_terms_input -> 'purchase_year' = 'null'::jsonb then null
        else (v_terms_input ->> 'purchase_year')::integer
      end,
      'negotiable', (v_terms_input ->> 'negotiable')::boolean,
      'condition_notes', nullif(trim(coalesce(
        v_terms_input ->> 'condition_notes', ''
      )), '')
    );
  elsif v_pillar = 'rental' then
    if public.marketplace_jsonb_integer_v1(
      v_terms_input, 'daily_amount_minor', 0, 1000000000000
    ) <> v_amount then
      raise exception using errcode = '22023', message = 'marketplace_primary_price_mismatch';
    end if;
    perform public.marketplace_jsonb_integer_v1(
      v_terms_input, 'weekend_amount_minor', 0, 1000000000000, false
    );
    perform public.marketplace_jsonb_integer_v1(
      v_terms_input, 'weekly_amount_minor', 0, 1000000000000, false
    );
    perform public.marketplace_jsonb_integer_v1(
      v_terms_input, 'deposit_amount_minor', 0, 1000000000000
    );
    v_max_quantity := 1;
    perform public.marketplace_jsonb_integer_v1(
      v_terms_input, 'minimum_days', 1, 365
    );
    if coalesce(v_terms_input ->> 'available_from', '') !~ '^\d{4}-\d{2}-\d{2}$'
       or jsonb_typeof(v_terms_input -> 'instant_book') is distinct from 'boolean' then
      raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
    end if;
    begin
      perform (v_terms_input ->> 'available_from')::date;
    exception
      when datetime_field_overflow or invalid_datetime_format then
        raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
    end;
    v_terms := jsonb_build_object(
      'daily_amount_minor', v_amount,
      'weekend_amount_minor', public.marketplace_jsonb_integer_v1(
        v_terms_input, 'weekend_amount_minor', 0, 1000000000000, false
      ),
      'weekly_amount_minor', public.marketplace_jsonb_integer_v1(
        v_terms_input, 'weekly_amount_minor', 0, 1000000000000, false
      ),
      'deposit_amount_minor', public.marketplace_jsonb_integer_v1(
        v_terms_input, 'deposit_amount_minor', 0, 1000000000000
      ),
      'minimum_days', (v_terms_input ->> 'minimum_days')::integer,
      'available_from', v_terms_input ->> 'available_from',
      'instant_book', (v_terms_input ->> 'instant_book')::boolean
    );
  elsif v_pillar = 'services' then
    if coalesce(v_terms_input ->> 'service_kind', '') not in (
      'production', 'coaching', 'ticket', 'room'
    )
       or char_length(trim(coalesce(v_terms_input ->> 'service_format', ''))) not between 1 and 120
       or char_length(trim(coalesce(v_terms_input ->> 'duration_label', ''))) not between 1 and 120
       or char_length(coalesce(v_terms_input ->> 'delivery_label', '')) > 160
       or char_length(trim(coalesce(v_terms_input ->> 'next_availability', ''))) not between 1 and 160
       or char_length(coalesce(v_terms_input ->> 'venue_name', '')) > 180
       or char_length(coalesce(v_terms_input ->> 'included_equipment', '')) > 2000 then
      raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
    end if;
    if v_terms_input ? 'capacity' and v_terms_input -> 'capacity' <> 'null'::jsonb then
      v_max_quantity := public.marketplace_jsonb_integer_v1(
        v_terms_input, 'capacity', 1, 100000
      )::integer;
    else
      v_max_quantity := 1;
    end if;
    if v_terms_input ? 'event_date' and v_terms_input -> 'event_date' <> 'null'::jsonb then
      if (v_terms_input ->> 'event_date')
           !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}([.]\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$' then
        raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
      end if;
      begin
        perform (v_terms_input ->> 'event_date')::timestamptz;
      exception
        when datetime_field_overflow
          or invalid_datetime_format
          or invalid_time_zone_displacement_value then
          raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
      end;
    end if;
    v_terms := jsonb_build_object(
      'service_kind', v_terms_input ->> 'service_kind',
      'service_format', trim(v_terms_input ->> 'service_format'),
      'duration_label', trim(v_terms_input ->> 'duration_label'),
      'delivery_label', nullif(trim(coalesce(v_terms_input ->> 'delivery_label', '')), ''),
      'next_availability', trim(v_terms_input ->> 'next_availability'),
      'event_date', case
        when v_terms_input -> 'event_date' is null
          or v_terms_input -> 'event_date' = 'null'::jsonb then null
        else (v_terms_input ->> 'event_date')::timestamptz
      end,
      'capacity', v_max_quantity,
      'venue_name', nullif(trim(coalesce(v_terms_input ->> 'venue_name', '')), ''),
      'included_equipment', nullif(trim(coalesce(
        v_terms_input ->> 'included_equipment', ''
      )), '')
    );
  else
    perform public.marketplace_jsonb_integer_v1(
      v_terms_input, 'retail_unit_amount_minor', 0, 1000000000000
    );
    if public.marketplace_jsonb_integer_v1(
      v_terms_input, 'unlocked_unit_amount_minor', 0, 1000000000000
    ) <> v_amount then
      raise exception using errcode = '22023', message = 'marketplace_primary_price_mismatch';
    end if;
    v_max_quantity := public.marketplace_jsonb_integer_v1(
      v_terms_input, 'target_participants', 2, 100000
    )::integer;
    perform public.marketplace_jsonb_integer_v1(
      v_terms_input, 'campaign_days', 1, 365
    );
    if (v_terms_input ->> 'retail_unit_amount_minor')::bigint < v_amount then
      raise exception using errcode = '22023', message = 'invalid_marketplace_collective_price';
    end if;
    v_terms := jsonb_build_object(
      'retail_unit_amount_minor', (v_terms_input ->> 'retail_unit_amount_minor')::bigint,
      'unlocked_unit_amount_minor', v_amount,
      'target_participants', v_max_quantity,
      'campaign_days', (v_terms_input ->> 'campaign_days')::integer
    );
  end if;

  insert into public.marketplace_seller_profiles(profile_id)
  values (v_user_id)
  on conflict (profile_id) do nothing;

  v_slug_base := trim(both '-' from regexp_replace(
    lower(v_title), '[^a-z0-9]+', '-', 'g'
  ));
  if v_slug_base = '' then v_slug_base := 'annonce'; end if;

  insert into public.marketplace_listings (
    id, seller_profile_id, slug, pillar, category_code, title,
    short_description, description, brand, model, condition_code,
    condition_label, city_label, area_label, pickup_enabled,
    shipping_enabled, remote_enabled, preparation_days, max_quantity, terms
  ) values (
    v_listing_id, v_user_id,
    left(v_slug_base, 90) || '-' || left(replace(v_listing_id::text, '-', ''), 12),
    v_pillar, v_category, v_title, v_short, v_description, v_brand, v_model,
    v_condition,
    case lower(replace(coalesce(v_condition, ''), '_', '-'))
      when 'new' then 'Neuf'
      when 'mint' then 'Comme neuf'
      when 'excellent' then 'Excellent'
      when 'very-good' then 'Très bon'
      else null
    end,
    v_city, v_area, v_pickup, v_shipping, v_remote,
    v_preparation_days::integer, v_max_quantity, v_terms
  );

  insert into public.marketplace_listing_prices (
    listing_id, price_kind, currency_code, amount_minor, price_unit
  ) values (v_listing_id, 'primary', 'EUR', v_amount, v_price_unit);

  if v_compare_amount is not null then
    insert into public.marketplace_listing_prices (
      listing_id, price_kind, currency_code, amount_minor, price_unit
    ) values (v_listing_id, 'compare_at', 'EUR', v_compare_amount, v_price_unit);
  end if;
  if v_shipping and v_shipping_amount > 0 then
    insert into public.marketplace_listing_prices (
      listing_id, price_kind, currency_code, amount_minor, price_unit
    ) values (v_listing_id, 'shipping', 'EUR', v_shipping_amount, 'item');
  end if;
  if v_pillar = 'rental' then
    insert into public.marketplace_listing_prices (
      listing_id, price_kind, currency_code, amount_minor, price_unit
    )
    select v_listing_id, price.price_kind, 'EUR', price.amount_minor, price.price_unit
    from (values
      ('deposit', (v_terms ->> 'deposit_amount_minor')::bigint, 'item'),
      ('weekend', (v_terms ->> 'weekend_amount_minor')::bigint, 'day'),
      ('weekly', (v_terms ->> 'weekly_amount_minor')::bigint, 'day')
    ) price(price_kind, amount_minor, price_unit)
    where price.amount_minor is not null;
  elsif v_pillar = 'collective' then
    insert into public.marketplace_listing_prices (
      listing_id, price_kind, currency_code, amount_minor, price_unit
    ) values
      (v_listing_id, 'collective_retail', 'EUR',
        (v_terms ->> 'retail_unit_amount_minor')::bigint, 'participant'),
      (v_listing_id, 'collective_unlocked', 'EUR',
        (v_terms ->> 'unlocked_unit_amount_minor')::bigint, 'participant');
  end if;

  insert into public.marketplace_listing_media (
    listing_id, media_file_id, media_role, position, alt_text
  )
  select
    v_listing_id,
    media.value::uuid,
    case when media.ordinality = 1 then 'cover' else 'gallery' end,
    media.ordinality::integer - 1,
    v_title
  from jsonb_array_elements_text(
    coalesce(p_payload -> 'media_file_ids', '[]'::jsonb)
  ) with ordinality media(value, ordinality);

  v_result := jsonb_build_object(
    'listing_id', v_listing_id,
    'status', 'draft',
    'version', 1
  );
  return public.marketplace_store_idempotency_v1(
    v_user_id, 'listing_draft', v_key, v_hash, v_listing_id, v_result
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Owner draft workspace. Drafts stay private and non-financial: the browser
-- can list its own normalized payloads and replace one draft atomically, but
-- it cannot change status or create an order/payment from this surface.
-- ---------------------------------------------------------------------------

create or replace function public.list_my_marketplace_listing_drafts_v1(
  p_limit integer default 50
)
returns table (
  listing_id uuid,
  status text,
  version bigint,
  payload jsonb,
  media jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
begin
  if p_limit is null or p_limit not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_draft_limit';
  end if;

  return query
  select
    listing.id,
    listing.status,
    listing.version,
    jsonb_build_object(
      'pillar', listing.pillar,
      'category_code', listing.category_code,
      'title', listing.title,
      'short_description', listing.short_description,
      'description', listing.description,
      'brand', listing.brand,
      'model', listing.model,
      'condition_code', listing.condition_code,
      'currency_code', primary_price.currency_code,
      'unit_amount_minor', primary_price.amount_minor,
      'price_unit', primary_price.price_unit,
      'city', listing.city_label,
      'area', listing.area_label,
      'pickup', listing.pickup_enabled,
      'shipping', listing.shipping_enabled,
      'remote', listing.remote_enabled,
      'shipping_amount_minor', coalesce(shipping_price.amount_minor, 0),
      'preparation_days', listing.preparation_days,
      'media_file_ids', coalesce(media.media_file_ids, '[]'::jsonb),
      'terms', listing.terms
    ),
    coalesce(media.media_items, '[]'::jsonb),
    listing.created_at,
    listing.updated_at
  from public.marketplace_listings listing
  join public.marketplace_listing_prices primary_price
    on primary_price.listing_id = listing.id
   and primary_price.price_kind = 'primary'
  left join public.marketplace_listing_prices shipping_price
    on shipping_price.listing_id = listing.id
   and shipping_price.price_kind = 'shipping'
  left join lateral (
    select
      jsonb_agg(media_row.media_file_id order by media_row.position) as media_file_ids,
      jsonb_agg(jsonb_build_object(
        'media_file_id', media_row.media_file_id,
        'role', media_row.media_role,
        'position', media_row.position,
        'name', file.name,
        'mime_type', file.mime_type,
        'size_bytes', coalesce(file.size_bytes, file.file_size::bigint),
        'storage_bucket', file.storage_bucket,
        'storage_path', file.storage_path,
        'file_url', file.file_url
      ) order by media_row.position) as media_items
    from public.marketplace_listing_media media_row
    join public.media_files file
      on file.id = media_row.media_file_id
     and file.user_id = v_user_id
     and file.deleted_at is null
     and file.source_pillar = 'marketplace'
    where media_row.listing_id = listing.id
  ) media on true
  where listing.seller_profile_id = v_user_id
    and listing.status = 'draft'
  order by listing.updated_at desc, listing.id desc
  limit p_limit;
end;
$$;

create or replace function public.update_marketplace_listing_draft_v1(
  p_listing_id uuid,
  p_expected_version bigint,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_replay jsonb;
  v_target public.marketplace_listings%rowtype;
  v_seed public.marketplace_listings%rowtype;
  v_seed_id uuid;
  v_seed_key text;
  v_new_version bigint;
  v_result jsonb;
begin
  if p_listing_id is null
     or p_expected_version is null
     or p_expected_version < 1
     or p_payload is null
     or jsonb_typeof(p_payload) is distinct from 'object'
     or char_length(v_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_payload';
  end if;

  v_hash := encode(extensions.digest(
    concat_ws('|', p_listing_id::text, p_expected_version::text, p_payload::text),
    'sha256'
  ), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:key:' || v_user_id::text || ':listing_draft_update:' || v_key,
    0
  ));
  v_replay := public.marketplace_idempotency_replay_v1(
    v_user_id, 'listing_draft_update', v_key, v_hash
  );
  if v_replay is not null then return v_replay; end if;

  select listing.* into v_target
  from public.marketplace_listings listing
  where listing.id = p_listing_id
  for update;

  if not found or v_target.seller_profile_id is distinct from v_user_id then
    raise exception using errcode = 'P0002', message = 'marketplace_draft_not_found';
  end if;
  if v_target.status <> 'draft' then
    raise exception using errcode = '22023', message = 'marketplace_draft_not_editable';
  end if;
  if v_target.version <> p_expected_version then
    raise exception using errcode = '40001', message = 'marketplace_draft_version_conflict';
  end if;

  -- The create RPC is the canonical validator/normalizer for pillar terms,
  -- prices, logistics and owned media. Its temporary draft is removed in the
  -- same transaction after its normalized rows replace the target rows.
  v_seed_key := 'draft-update-seed:' || encode(extensions.digest(
    concat_ws('|', v_user_id::text, p_listing_id::text, v_key), 'sha256'
  ), 'hex');
  v_seed_id := (
    public.create_marketplace_listing_draft_v1(p_payload, v_seed_key)
      ->> 'listing_id'
  )::uuid;

  select listing.* into strict v_seed
  from public.marketplace_listings listing
  where listing.id = v_seed_id
    and listing.seller_profile_id = v_user_id
    and listing.status = 'draft';

  update public.marketplace_listings target
  set
    pillar = v_seed.pillar,
    category_code = v_seed.category_code,
    title = v_seed.title,
    short_description = v_seed.short_description,
    description = v_seed.description,
    brand = v_seed.brand,
    model = v_seed.model,
    condition_code = v_seed.condition_code,
    condition_label = v_seed.condition_label,
    badge_label = null,
    city_label = v_seed.city_label,
    area_label = v_seed.area_label,
    pickup_enabled = v_seed.pickup_enabled,
    shipping_enabled = v_seed.shipping_enabled,
    remote_enabled = v_seed.remote_enabled,
    preparation_days = v_seed.preparation_days,
    max_quantity = v_seed.max_quantity,
    terms = v_seed.terms,
    published_at = null
  where target.id = p_listing_id;

  delete from public.marketplace_listing_prices price
  where price.listing_id = p_listing_id;
  insert into public.marketplace_listing_prices (
    listing_id, price_kind, currency_code, amount_minor, price_unit
  )
  select p_listing_id, price.price_kind, price.currency_code,
    price.amount_minor, price.price_unit
  from public.marketplace_listing_prices price
  where price.listing_id = v_seed_id;

  delete from public.marketplace_listing_media media
  where media.listing_id = p_listing_id;
  insert into public.marketplace_listing_media (
    listing_id, media_file_id, media_role, position, alt_text
  )
  select p_listing_id, media.media_file_id, media.media_role,
    media.position, media.alt_text
  from public.marketplace_listing_media media
  where media.listing_id = v_seed_id
  order by media.position;

  delete from public.marketplace_listings listing
  where listing.id = v_seed_id;

  select listing.version into strict v_new_version
  from public.marketplace_listings listing
  where listing.id = p_listing_id;

  v_result := jsonb_build_object(
    'listing_id', p_listing_id,
    'status', 'draft',
    'version', v_new_version
  );
  return public.marketplace_store_idempotency_v1(
    v_user_id, 'listing_draft_update', v_key, v_hash,
    p_listing_id, v_result
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Non-financial request intents. Price snapshots are always read from the
-- canonical price rows and never accepted from a browser payload.
-- ---------------------------------------------------------------------------

create or replace function public.marketplace_create_intent_v1(
  p_listing_id uuid,
  p_kind text,
  p_quantity integer,
  p_starts_on date,
  p_ends_on date,
  p_requested_for timestamptz,
  p_note text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_hash text;
  v_replay jsonb;
  v_listing public.marketplace_listings%rowtype;
  v_minimum_days integer;
  v_campaign_days integer;
  v_joined_quantity bigint;
  v_reserved_quantity bigint;
  v_service_kind text;
  v_event_date timestamptz;
  v_requested_for timestamptz := p_requested_for;
  v_intent_id uuid := gen_random_uuid();
  v_snapshot jsonb;
  v_result jsonb;
begin
  if p_listing_id is null
     or p_kind not in ('rental_request', 'service_booking', 'collective_join')
     or p_quantity is null
     or p_quantity not between 1 and 20
     or char_length(coalesce(v_note, '')) > 1000
     or char_length(v_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_request';
  end if;
  v_hash := encode(extensions.digest(jsonb_build_object(
    'listing_id', p_listing_id,
    'kind', p_kind,
    'quantity', p_quantity,
    'starts_on', p_starts_on,
    'ends_on', p_ends_on,
    'requested_for', p_requested_for,
    'note', v_note
  )::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:key:' || v_user_id::text || ':' || p_kind || ':' || v_key, 0
  ));
  v_replay := public.marketplace_idempotency_replay_v1(
    v_user_id, p_kind, v_key, v_hash
  );
  if v_replay is not null then return v_replay; end if;

  select listing.* into v_listing
  from public.marketplace_listings listing
  join public.marketplace_seller_profiles seller
    on seller.profile_id = listing.seller_profile_id
   and seller.seller_status = 'active'
  join public.profiles profile on profile.id = listing.seller_profile_id
  where listing.id = p_listing_id
    and listing.status = 'published'
    and coalesce(profile.show_on_public_profile, false)
    and not coalesce(profile.is_ghost_mode, true)
  for update of listing;
  if not found then
    raise exception using errcode = 'P0002', message = 'marketplace_listing_not_found';
  end if;
  if v_listing.seller_profile_id = v_user_id then
    raise exception using errcode = '22023', message = 'cannot_request_own_listing';
  end if;
  if exists (
    select 1 from public.marketplace_intents intent
    where intent.buyer_profile_id = v_user_id
      and intent.listing_id = p_listing_id
      and intent.kind = p_kind
      and intent.status in ('pending', 'accepted')
  ) then
    raise exception using errcode = '23505', message = 'marketplace_intent_already_active';
  end if;

  if p_kind = 'rental_request' then
    if v_listing.pillar <> 'rental' or p_starts_on is null or p_ends_on is null
       or p_ends_on <= p_starts_on then
      raise exception using errcode = '22023', message = 'invalid_marketplace_rental_request';
    end if;
    v_minimum_days := coalesce((v_listing.terms ->> 'minimum_days')::integer, 1);
    if (p_ends_on - p_starts_on) < v_minimum_days
       or p_starts_on < greatest(
         coalesce((v_listing.terms ->> 'available_from')::date, current_date),
         current_date
       ) then
      raise exception using errcode = '22023', message = 'invalid_marketplace_rental_dates';
    end if;
  elsif p_kind = 'service_booking' then
    if v_listing.pillar <> 'services'
       or p_starts_on is not null or p_ends_on is not null
       or p_quantity <> 1
       or (p_requested_for is not null and p_requested_for < now() - interval '5 minutes') then
      raise exception using errcode = '22023', message = 'invalid_marketplace_service_booking';
    end if;
    v_service_kind := v_listing.terms ->> 'service_kind';
    if nullif(v_listing.terms ->> 'event_date', '') is not null then
      v_event_date := (v_listing.terms ->> 'event_date')::timestamptz;
      v_requested_for := coalesce(p_requested_for, v_event_date);
      if v_requested_for <> v_event_date then
        raise exception using errcode = '22023', message = 'marketplace_service_slot_mismatch';
      end if;
    end if;
    if v_requested_for is not null
       and v_requested_for < now() - interval '5 minutes' then
      raise exception using errcode = '22023', message = 'invalid_marketplace_service_booking';
    end if;
    if v_service_kind in ('ticket', 'room') then
      perform pg_advisory_xact_lock(hashtextextended(
        'marketplace:capacity:' || p_listing_id::text, 0
      ));
      select coalesce(sum(intent.requested_quantity), 0)
        into v_reserved_quantity
      from public.marketplace_intents intent
      where intent.listing_id = p_listing_id
        and intent.kind = 'service_booking'
        and intent.status in ('pending', 'accepted');
      if v_reserved_quantity + p_quantity > v_listing.max_quantity then
        raise exception using errcode = '22023', message = 'marketplace_service_capacity_full';
      end if;
    end if;
  else
    if v_listing.pillar <> 'collective'
       or p_starts_on is not null or p_ends_on is not null
       or p_requested_for is not null then
      raise exception using errcode = '22023', message = 'invalid_marketplace_collective_join';
    end if;
    v_campaign_days := public.marketplace_jsonb_integer_v1(
      v_listing.terms, 'campaign_days', 1, 365
    )::integer;
    if v_listing.published_at is null
       or v_listing.published_at + (v_campaign_days * interval '1 day') <= now() then
      raise exception using errcode = '22023', message = 'marketplace_collective_closed';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(
      'marketplace:capacity:' || p_listing_id::text, 0
    ));
    select coalesce(sum(intent.requested_quantity), 0)
      into v_joined_quantity
    from public.marketplace_intents intent
    where intent.listing_id = p_listing_id
      and intent.kind = 'collective_join'
      and intent.status in ('pending', 'accepted');
    if v_joined_quantity + p_quantity > v_listing.max_quantity then
      raise exception using errcode = '22023', message = 'marketplace_collective_full';
    end if;
  end if;

  select coalesce(jsonb_object_agg(
    price.price_kind,
    jsonb_build_object(
      'currency_code', price.currency_code,
      'amount_minor', price.amount_minor,
      'price_unit', price.price_unit
    )
  ), '{}'::jsonb)
  into v_snapshot
  from public.marketplace_listing_prices price
  where price.listing_id = p_listing_id;

  insert into public.marketplace_intents (
    id, buyer_profile_id, seller_profile_id, listing_id, kind,
    requested_quantity, starts_on, ends_on, requested_for, note,
    pricing_snapshot
  ) values (
    v_intent_id, v_user_id, v_listing.seller_profile_id, p_listing_id, p_kind,
    p_quantity, p_starts_on, p_ends_on, v_requested_for, v_note, v_snapshot
  );

  v_result := jsonb_build_object(
    'intent_id', v_intent_id,
    'status', 'pending',
    'listing_id', p_listing_id,
    'kind', p_kind
  );
  return public.marketplace_store_idempotency_v1(
    v_user_id, p_kind, v_key, v_hash, p_listing_id, v_result
  );
end;
$$;

create or replace function public.create_marketplace_rental_request_v1(
  p_listing_id uuid,
  p_starts_on date,
  p_ends_on date,
  p_note text,
  p_idempotency_key text
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.marketplace_create_intent_v1(
    p_listing_id, 'rental_request', 1, p_starts_on, p_ends_on,
    null, p_note, p_idempotency_key
  );
$$;

create or replace function public.create_marketplace_service_booking_v1(
  p_listing_id uuid,
  p_requested_for timestamptz,
  p_note text,
  p_idempotency_key text
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.marketplace_create_intent_v1(
    p_listing_id, 'service_booking', 1, null, null,
    p_requested_for, p_note, p_idempotency_key
  );
$$;

create or replace function public.join_marketplace_collective_v1(
  p_listing_id uuid,
  p_quantity integer,
  p_idempotency_key text
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.marketplace_create_intent_v1(
    p_listing_id, 'collective_join', p_quantity, null, null,
    null, null, p_idempotency_key
  );
$$;

-- Private intent workspace. It deliberately exposes no contact details and
-- no payment/order semantics: Phase A remains a request workflow only.
create or replace function public.list_my_marketplace_intents_v1(
  p_role text default 'buyer',
  p_status text default null,
  p_limit integer default 50
)
returns table (
  intent_id uuid,
  listing_id uuid,
  listing_title text,
  listing_pillar text,
  kind text,
  status text,
  requested_quantity integer,
  starts_on date,
  ends_on date,
  requested_for timestamptz,
  note text,
  pricing_snapshot jsonb,
  buyer_profile_id uuid,
  buyer_display_name text,
  seller_profile_id uuid,
  seller_display_name text,
  created_at timestamptz,
  updated_at timestamptz,
  responded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
  v_role text := trim(coalesce(p_role, ''));
  v_status text := nullif(trim(coalesce(p_status, '')), '');
  v_limit integer := coalesce(p_limit, 50);
begin
  if v_role not in ('buyer', 'seller')
     or (v_status is not null and v_status not in (
       'pending', 'accepted', 'declined', 'cancelled', 'expired'
     ))
     or v_limit not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_intent_filter';
  end if;

  return query
  select
    intent.id,
    intent.listing_id,
    listing.title,
    listing.pillar,
    intent.kind,
    intent.status,
    intent.requested_quantity,
    intent.starts_on,
    intent.ends_on,
    intent.requested_for,
    intent.note,
    intent.pricing_snapshot,
    intent.buyer_profile_id,
    coalesce(
      buyer.display_name, buyer.full_name, buyer.username, 'Membre Meewav'
    ),
    intent.seller_profile_id,
    coalesce(
      seller.display_name, seller.full_name, seller.username, 'Artiste'
    ),
    intent.created_at,
    intent.updated_at,
    intent.responded_at
  from public.marketplace_intents intent
  join public.marketplace_listings listing on listing.id = intent.listing_id
  join public.profiles buyer on buyer.id = intent.buyer_profile_id
  left join public.profiles seller on seller.id = intent.seller_profile_id
  where (
      (v_role = 'buyer' and intent.buyer_profile_id = v_user_id)
      or (v_role = 'seller' and intent.seller_profile_id = v_user_id)
    )
    and (v_status is null or intent.status = v_status)
  order by intent.created_at desc, intent.id desc
  limit v_limit;
end;
$$;

create or replace function public.update_marketplace_intent_status_v1(
  p_intent_id uuid,
  p_status text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_status text := trim(coalesce(p_status, ''));
  v_hash text;
  v_replay jsonb;
  v_intent public.marketplace_intents%rowtype;
  v_result jsonb;
begin
  if p_intent_id is null or v_status not in ('accepted', 'declined')
     or char_length(v_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_intent_update';
  end if;
  select intent.* into v_intent
  from public.marketplace_intents intent
  where intent.id = p_intent_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'marketplace_intent_not_found';
  end if;
  if v_intent.seller_profile_id is distinct from v_user_id then
    raise exception using errcode = '42501', message = 'marketplace_intent_owner_required';
  end if;
  v_hash := encode(extensions.digest(
    concat_ws('|', p_intent_id, v_status), 'sha256'
  ), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:key:' || v_user_id::text || ':intent_owner_status:' || v_key, 0
  ));
  v_replay := public.marketplace_idempotency_replay_v1(
    v_user_id, 'intent_owner_status', v_key, v_hash
  );
  if v_replay is not null then return v_replay; end if;
  if v_intent.status <> 'pending' and v_intent.status <> v_status then
    raise exception using errcode = '22023', message = 'invalid_marketplace_intent_transition';
  end if;
  if v_intent.status = 'pending'
     and v_status = 'accepted'
     and v_intent.kind = 'rental_request' then
    perform pg_advisory_xact_lock(hashtextextended(
      'marketplace:capacity:' || v_intent.listing_id::text, 0
    ));
    if exists (
      select 1
      from public.marketplace_intents competing
      where competing.listing_id = v_intent.listing_id
        and competing.kind = 'rental_request'
        and competing.status = 'accepted'
        and competing.id <> v_intent.id
        and competing.starts_on < v_intent.ends_on
        and competing.ends_on > v_intent.starts_on
    ) then
      raise exception using
        errcode = '22023',
        message = 'marketplace_rental_slot_unavailable';
    end if;
  end if;
  if v_intent.status = 'pending' then
    update public.marketplace_intents
    set status = v_status, responded_at = now()
    where id = p_intent_id;
  end if;
  v_result := jsonb_build_object(
    'intent_id', v_intent.id,
    'listing_id', v_intent.listing_id,
    'kind', v_intent.kind,
    'status', v_status
  );
  return public.marketplace_store_idempotency_v1(
    v_user_id, 'intent_owner_status', v_key, v_hash,
    v_intent.listing_id, v_result
  );
end;
$$;

create or replace function public.cancel_marketplace_intent_v1(
  p_intent_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := public.marketplace_require_profile_v1();
  v_key text := trim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_replay jsonb;
  v_intent public.marketplace_intents%rowtype;
  v_result jsonb;
begin
  if p_intent_id is null or char_length(v_key) not between 8 and 128 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_intent_cancel';
  end if;
  select intent.* into v_intent
  from public.marketplace_intents intent
  where intent.id = p_intent_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'marketplace_intent_not_found';
  end if;
  if v_intent.buyer_profile_id <> v_user_id then
    raise exception using errcode = '42501', message = 'marketplace_intent_buyer_required';
  end if;
  v_hash := encode(extensions.digest(p_intent_id::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    'marketplace:key:' || v_user_id::text || ':intent_buyer_cancel:' || v_key, 0
  ));
  v_replay := public.marketplace_idempotency_replay_v1(
    v_user_id, 'intent_buyer_cancel', v_key, v_hash
  );
  if v_replay is not null then return v_replay; end if;
  if v_intent.status not in ('pending', 'accepted', 'cancelled') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_intent_transition';
  end if;
  if v_intent.status <> 'cancelled' then
    update public.marketplace_intents
    set status = 'cancelled'
    where id = p_intent_id;
  end if;
  v_result := jsonb_build_object(
    'intent_id', v_intent.id,
    'listing_id', v_intent.listing_id,
    'kind', v_intent.kind,
    'status', 'cancelled'
  );
  return public.marketplace_store_idempotency_v1(
    v_user_id, 'intent_buyer_cancel', v_key, v_hash,
    v_intent.listing_id, v_result
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Least privilege. No authenticated policy exists on raw Marketplace tables;
-- clients receive only the stable projections above.
-- ---------------------------------------------------------------------------

alter table public.marketplace_seller_profiles enable row level security;
alter table public.marketplace_seller_profiles force row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_listings force row level security;
alter table public.marketplace_listing_prices enable row level security;
alter table public.marketplace_listing_prices force row level security;
alter table public.marketplace_listing_media enable row level security;
alter table public.marketplace_listing_media force row level security;
alter table public.marketplace_favorites enable row level security;
alter table public.marketplace_favorites force row level security;
alter table public.marketplace_cart_items enable row level security;
alter table public.marketplace_cart_items force row level security;
alter table public.marketplace_intents enable row level security;
alter table public.marketplace_intents force row level security;
alter table public.marketplace_idempotency enable row level security;
alter table public.marketplace_idempotency force row level security;

revoke all on public.marketplace_seller_profiles from anon, authenticated;
revoke all on public.marketplace_listings from anon, authenticated;
revoke all on public.marketplace_listing_prices from anon, authenticated;
revoke all on public.marketplace_listing_media from anon, authenticated;
revoke all on public.marketplace_favorites from anon, authenticated;
revoke all on public.marketplace_cart_items from anon, authenticated;
revoke all on public.marketplace_intents from anon, authenticated;
revoke all on public.marketplace_idempotency from anon, authenticated;

grant all on public.marketplace_seller_profiles to service_role;
grant all on public.marketplace_listings to service_role;
grant all on public.marketplace_listing_prices to service_role;
grant all on public.marketplace_listing_media to service_role;
grant all on public.marketplace_favorites to service_role;
grant all on public.marketplace_cart_items to service_role;
grant all on public.marketplace_intents to service_role;
grant all on public.marketplace_idempotency to service_role;

revoke execute on function public.marketplace_touch_updated_at_v1()
  from public, anon, authenticated;
revoke execute on function public.marketplace_validate_listing_media_v1()
  from public, anon, authenticated;
revoke execute on function public.marketplace_require_profile_v1()
  from public, anon, authenticated;
revoke execute on function public.marketplace_idempotency_replay_v1(uuid, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.marketplace_store_idempotency_v1(uuid, text, text, text, uuid, jsonb)
  from public, anon, authenticated;
revoke execute on function public.marketplace_jsonb_integer_v1(jsonb, text, bigint, bigint, boolean)
  from public, anon, authenticated;
revoke execute on function public.marketplace_create_intent_v1(uuid, text, integer, date, date, timestamptz, text, text)
  from public, anon, authenticated;

revoke execute on function public.list_marketplace_catalog_v1(timestamptz, uuid, integer, text, text, text, uuid[])
  from public;
grant execute on function public.list_marketplace_catalog_v1(timestamptz, uuid, integer, text, text, text, uuid[])
  to anon, authenticated, service_role;

revoke execute on function public.get_my_marketplace_state_v1()
  from public, anon;
grant execute on function public.get_my_marketplace_state_v1()
  to authenticated, service_role;
revoke execute on function public.set_marketplace_favorite_v1(uuid, boolean, text)
  from public, anon;
grant execute on function public.set_marketplace_favorite_v1(uuid, boolean, text)
  to authenticated, service_role;
revoke execute on function public.set_marketplace_cart_item_v1(uuid, integer, text)
  from public, anon;
grant execute on function public.set_marketplace_cart_item_v1(uuid, integer, text)
  to authenticated, service_role;
revoke execute on function public.create_marketplace_listing_draft_v1(jsonb, text)
  from public, anon;
grant execute on function public.create_marketplace_listing_draft_v1(jsonb, text)
  to authenticated, service_role;
revoke execute on function public.list_my_marketplace_listing_drafts_v1(integer)
  from public, anon;
grant execute on function public.list_my_marketplace_listing_drafts_v1(integer)
  to authenticated, service_role;
revoke execute on function public.update_marketplace_listing_draft_v1(uuid, bigint, jsonb, text)
  from public, anon;
grant execute on function public.update_marketplace_listing_draft_v1(uuid, bigint, jsonb, text)
  to authenticated, service_role;
revoke execute on function public.create_marketplace_rental_request_v1(uuid, date, date, text, text)
  from public, anon;
grant execute on function public.create_marketplace_rental_request_v1(uuid, date, date, text, text)
  to authenticated, service_role;
revoke execute on function public.create_marketplace_service_booking_v1(uuid, timestamptz, text, text)
  from public, anon;
grant execute on function public.create_marketplace_service_booking_v1(uuid, timestamptz, text, text)
  to authenticated, service_role;
revoke execute on function public.join_marketplace_collective_v1(uuid, integer, text)
  from public, anon;
grant execute on function public.join_marketplace_collective_v1(uuid, integer, text)
  to authenticated, service_role;
revoke execute on function public.list_my_marketplace_intents_v1(text, text, integer)
  from public, anon;
grant execute on function public.list_my_marketplace_intents_v1(text, text, integer)
  to authenticated, service_role;
revoke execute on function public.update_marketplace_intent_status_v1(uuid, text, text)
  from public, anon;
grant execute on function public.update_marketplace_intent_status_v1(uuid, text, text)
  to authenticated, service_role;
revoke execute on function public.cancel_marketplace_intent_v1(uuid, text)
  from public, anon;
grant execute on function public.cancel_marketplace_intent_v1(uuid, text)
  to authenticated, service_role;

commit;
begin;

-- Marketplace catalogue filters v2.
--
-- This migration is additive: v1 remains available for deployed clients. The
-- browser still receives only the safe v1 projection; filters are evaluated
-- behind a SECURITY DEFINER RPC and raw Marketplace tables remain private.

alter table public.marketplace_seller_profiles
  add column if not exists seller_kind text;

update public.marketplace_seller_profiles seller
set seller_kind = case
  when lower(coalesce(profile.primary_role_key, profile.artist_type, '')) = 'studio'
    then 'studio'
  else 'artist'
end
from public.profiles profile
where seller.profile_id = profile.id
  and seller.seller_kind is null;

update public.marketplace_seller_profiles
set seller_kind = 'artist'
where seller_kind is null;

alter table public.marketplace_seller_profiles
  alter column seller_kind set default 'artist',
  alter column seller_kind set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.marketplace_seller_profiles'::regclass
      and conname = 'marketplace_seller_profiles_kind_check'
  ) then
    alter table public.marketplace_seller_profiles
      add constraint marketplace_seller_profiles_kind_check
      check (seller_kind in ('store', 'studio', 'artist'));
  end if;
end;
$$;

create index if not exists marketplace_seller_profiles_kind_idx
  on public.marketplace_seller_profiles(seller_kind, seller_status);

create index if not exists marketplace_listing_prices_primary_amount_idx
  on public.marketplace_listing_prices(amount_minor, listing_id)
  where price_kind = 'primary';

create index if not exists marketplace_listings_catalog_filter_idx
  on public.marketplace_listings(
    pillar, condition_code, preparation_days, published_at desc, id desc
  )
  where status = 'published';

-- Privileged maintenance jobs can predate the current composer validation.
-- These total functions keep catalogue reads safe when legacy JSON contains a
-- malformed availability value: invalid values fall back to preparation_days.
create or replace function public.marketplace_safe_date_v1(p_value text)
returns date
language plpgsql
immutable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_value is null or p_value !~ '^\d{4}-\d{2}-\d{2}$' then
    return null;
  end if;
  return p_value::date;
exception when others then
  return null;
end;
$$;

create or replace function public.marketplace_safe_timestamptz_v1(p_value text)
returns timestamptz
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_timestamp timestamptz;
begin
  if p_value is null
     or p_value !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$' then
    return null;
  end if;
  v_timestamp := p_value::timestamptz;
  if not isfinite(v_timestamp) then
    return null;
  end if;
  return v_timestamp;
exception when others then
  return null;
end;
$$;

create or replace function public.set_my_marketplace_seller_kind_v1(
  p_seller_kind text
)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_seller_kind text := lower(trim(coalesce(p_seller_kind, '')));
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if v_seller_kind not in ('artist', 'studio', 'store') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_seller_kind';
  end if;

  insert into public.marketplace_seller_profiles(profile_id, seller_kind)
  values (v_user_id, v_seller_kind)
  on conflict (profile_id) do update
    set seller_kind = excluded.seller_kind;

  return v_seller_kind;
end;
$$;

create or replace function public.get_my_marketplace_seller_kind_v1()
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_seller_kind text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  select seller.seller_kind
    into v_seller_kind
  from public.marketplace_seller_profiles seller
  where seller.profile_id = v_user_id;
  return coalesce(v_seller_kind, 'artist');
end;
$$;

create or replace function public.create_marketplace_listing_draft_v2(
  p_payload jsonb,
  p_idempotency_key text,
  p_seller_kind text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.set_my_marketplace_seller_kind_v1(p_seller_kind);
  return public.create_marketplace_listing_draft_v1(
    p_payload,
    p_idempotency_key
  );
end;
$$;

create or replace function public.update_marketplace_listing_draft_v2(
  p_listing_id uuid,
  p_expected_version bigint,
  p_payload jsonb,
  p_idempotency_key text,
  p_seller_kind text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.set_my_marketplace_seller_kind_v1(p_seller_kind);
  return public.update_marketplace_listing_draft_v1(
    p_listing_id,
    p_expected_version,
    p_payload,
    p_idempotency_key
  );
end;
$$;

create or replace function public.get_marketplace_catalog_capabilities_v1()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'catalog_version', 2,
    'cursor_version', 1,
    'maximum_page_size', 100,
    'filters', jsonb_build_object(
      'multiple_categories', true,
      'multiple_conditions', true,
      'fulfillment_any_match', true,
      'favorites_requires_authentication', true,
      'availability', jsonb_build_object(
        'source',
          'rental_terms.available_from | service_terms.event_date | marketplace_listings.preparation_days',
        'contract', 'canonical availability date, falling back to preparation lead time',
        'values', jsonb_build_array('any', 'now', '7-days', '30-days')
      )
    ),
    'sorts', jsonb_build_object(
      'recommended', jsonb_build_object(
        'supported', true,
        'source', 'published_at'
      ),
      'price-asc', jsonb_build_object(
        'supported', true,
        'source', 'marketplace_listing_prices.primary.amount_minor'
      ),
      'price-desc', jsonb_build_object(
        'supported', true,
        'source', 'marketplace_listing_prices.primary.amount_minor'
      ),
      'rating', jsonb_build_object(
        'supported', true,
        'source', 'marketplace_seller_profiles.rating_basis_points'
      ),
      'popular', jsonb_build_object(
        'supported', true,
        'source', 'marketplace_seller_profiles.completed_orders_count'
      ),
      'distance', jsonb_build_object(
        'supported', false,
        'reason', 'No public, consented seller coordinates are part of the Marketplace catalogue contract.'
      )
    )
  );
$$;

create or replace function public.list_marketplace_catalog_v2(
  p_cursor jsonb default null,
  p_limit integer default 48,
  p_filters jsonb default '{}'::jsonb,
  p_listing_ids uuid[] default null
)
returns table (
  listing_id uuid,
  seller_profile_id uuid,
  seller_display_name text,
  seller_username text,
  seller_avatar_url text,
  seller_grade_level smallint,
  seller_verified boolean,
  seller_rating_basis_points integer,
  seller_rating_count integer,
  seller_completed_orders_count integer,
  seller_response_time_bucket text,
  slug text,
  pillar text,
  category_code text,
  title text,
  short_description text,
  description text,
  brand text,
  model text,
  condition_code text,
  condition_label text,
  cover_url text,
  cover_storage_bucket text,
  cover_storage_path text,
  cover_alt text,
  badge_label text,
  city_label text,
  area_label text,
  pickup_enabled boolean,
  shipping_enabled boolean,
  shipping_amount_minor bigint,
  currency_code text,
  unit_amount_minor bigint,
  compare_at_amount_minor bigint,
  price_unit text,
  max_quantity integer,
  preparation_days integer,
  new_terms jsonb,
  used_terms jsonb,
  rental_terms jsonb,
  service_terms jsonb,
  collective_terms jsonb,
  published_at timestamptz,
  next_cursor_published_at timestamptz,
  next_cursor_listing_id uuid,
  seller_kind text,
  remote_enabled boolean,
  viewer_favorite boolean,
  availability_bucket text,
  sort_applied text,
  distance_supported boolean,
  distance_km double precision,
  next_cursor jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_filters jsonb := coalesce(p_filters, '{}'::jsonb);
  v_limit integer := coalesce(p_limit, 48);
  v_pillar text;
  v_categories text[];
  v_price_min bigint;
  v_price_max bigint;
  v_conditions text[];
  v_fulfillment text[];
  v_availability text;
  v_seller_kinds text[];
  v_verified_only boolean;
  v_minimum_grade smallint;
  v_sort text;
  v_favorites_only boolean;
  v_search text;
  v_viewer_id uuid := auth.uid();
  v_listing_ids uuid[];
  v_cursor_sort text;
  v_cursor_sort_value bigint;
  v_cursor_published_at timestamptz;
  v_cursor_listing_id uuid;
  v_known_categories constant text[] := array[
    'synthetiseurs', 'synths', 'synthesizers',
    'interfaces_audio', 'audio_interfaces', 'microphones',
    'casques', 'headphones', 'guitares', 'guitars',
    'batteries_electroniques', 'electronic_drums',
    'dj_vinyle', 'dj_et_vinyle', 'dj_and_vinyl',
    'controleurs_midi', 'midi_controllers', 'monitoring',
    'enregistreurs', 'recorders', 'mix_mastering',
    'mix_et_mastering', 'cours_coaching', 'cours_et_coaching',
    'courses_coaching', 'billetterie', 'ticketing',
    'rooms_studios', 'rooms_et_studios', 'rooms_and_studios',
    'autres', 'other'
  ];
begin
  if jsonb_typeof(v_filters) is distinct from 'object'
     or octet_length(v_filters::text) > 16384
     or exists (
       select 1
       from jsonb_object_keys(v_filters) supplied(key)
       where supplied.key <> all(array[
         'pillar', 'categories', 'priceMinMinor', 'priceMaxMinor',
         'conditions', 'fulfillment', 'availability', 'sellerKinds',
         'verifiedOnly', 'minimumGrade', 'sort', 'favoritesOnly', 'search'
       ]::text[])
     ) then
    raise exception using errcode = '22023', message = 'invalid_marketplace_filters';
  end if;

  if (v_filters ? 'pillar')
     and jsonb_typeof(v_filters -> 'pillar') not in ('string', 'null') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_pillar';
  end if;
  v_pillar := nullif(trim(coalesce(v_filters ->> 'pillar', 'all')), '');
  if v_pillar is null or v_pillar = 'all' then
    v_pillar := null;
  elsif v_pillar not in ('new', 'used', 'rental', 'services', 'collective') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_pillar';
  end if;

  if v_filters ? 'categories' then
    if jsonb_typeof(v_filters -> 'categories') <> 'array'
       or jsonb_array_length(v_filters -> 'categories') > 50
       or exists (
         select 1
         from jsonb_array_elements(v_filters -> 'categories') item(value)
         where jsonb_typeof(item.value) <> 'string'
           or char_length(trim(item.value #>> '{}')) not between 1 and 80
       ) then
      raise exception using errcode = '22023', message = 'invalid_marketplace_categories';
    end if;
    select array_agg(
      distinct lower(replace(trim(item.value), '-', '_'))
      order by lower(replace(trim(item.value), '-', '_'))
    )
      into v_categories
    from jsonb_array_elements_text(v_filters -> 'categories') item(value);
  end if;

  v_price_min := public.marketplace_jsonb_integer_v1(
    v_filters, 'priceMinMinor', 0, 1000000000000, false
  );
  v_price_max := public.marketplace_jsonb_integer_v1(
    v_filters, 'priceMaxMinor', 0, 1000000000000, false
  );
  if v_price_min is not null and v_price_max is not null
     and v_price_min > v_price_max then
    raise exception using errcode = '22023', message = 'invalid_marketplace_price_range';
  end if;

  if v_filters ? 'conditions' then
    if jsonb_typeof(v_filters -> 'conditions') <> 'array'
       or jsonb_array_length(v_filters -> 'conditions') > 20
       or exists (
         select 1
         from jsonb_array_elements(v_filters -> 'conditions') item(value)
         where jsonb_typeof(item.value) <> 'string'
           or char_length(trim(item.value #>> '{}')) not between 1 and 80
       ) then
      raise exception using errcode = '22023', message = 'invalid_marketplace_conditions';
    end if;
    select array_agg(
      distinct lower(replace(trim(item.value), '_', '-'))
      order by lower(replace(trim(item.value), '_', '-'))
    )
      into v_conditions
    from jsonb_array_elements_text(v_filters -> 'conditions') item(value);
  end if;

  if v_filters ? 'fulfillment' then
    if jsonb_typeof(v_filters -> 'fulfillment') <> 'array'
       or jsonb_array_length(v_filters -> 'fulfillment') > 3
       or exists (
         select 1
         from jsonb_array_elements(v_filters -> 'fulfillment') item(value)
         where jsonb_typeof(item.value) <> 'string'
           or (item.value #>> '{}') not in ('shipping', 'pickup', 'remote')
       ) then
      raise exception using errcode = '22023', message = 'invalid_marketplace_fulfillment';
    end if;
    select array_agg(distinct item.value order by item.value)
      into v_fulfillment
    from jsonb_array_elements_text(v_filters -> 'fulfillment') item(value);
  end if;

  if (v_filters ? 'availability')
     and jsonb_typeof(v_filters -> 'availability') not in ('string', 'null') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_availability';
  end if;
  v_availability := coalesce(v_filters ->> 'availability', 'any');
  if v_availability not in ('any', 'now', '7-days', '30-days') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_availability';
  end if;

  if v_filters ? 'sellerKinds' then
    if jsonb_typeof(v_filters -> 'sellerKinds') <> 'array'
       or jsonb_array_length(v_filters -> 'sellerKinds') > 3
       or exists (
         select 1
         from jsonb_array_elements(v_filters -> 'sellerKinds') item(value)
         where jsonb_typeof(item.value) <> 'string'
           or (item.value #>> '{}') not in ('store', 'studio', 'artist')
       ) then
      raise exception using errcode = '22023', message = 'invalid_marketplace_seller_kinds';
    end if;
    select array_agg(distinct item.value order by item.value)
      into v_seller_kinds
    from jsonb_array_elements_text(v_filters -> 'sellerKinds') item(value);
  end if;

  if (v_filters ? 'verifiedOnly')
     and jsonb_typeof(v_filters -> 'verifiedOnly') not in ('boolean', 'null') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_verified_filter';
  end if;
  v_verified_only := coalesce((v_filters ->> 'verifiedOnly')::boolean, false);

  if v_filters ? 'minimumGrade' then
    v_minimum_grade := public.marketplace_jsonb_integer_v1(
      v_filters, 'minimumGrade', 1, 6, false
    )::smallint;
  end if;

  if (v_filters ? 'sort')
     and jsonb_typeof(v_filters -> 'sort') not in ('string', 'null') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_sort';
  end if;
  v_sort := coalesce(v_filters ->> 'sort', 'recommended');
  if v_sort = 'distance' then
    raise exception using
      errcode = '0A000',
      message = 'marketplace_distance_sort_unavailable',
      detail = 'The catalogue has no public, consented seller coordinates.',
      hint = 'Use get_marketplace_catalog_capabilities_v1() before offering this sort.';
  elsif v_sort not in (
    'recommended', 'price-asc', 'price-desc', 'rating', 'popular'
  ) then
    raise exception using errcode = '22023', message = 'invalid_marketplace_sort';
  end if;

  if (v_filters ? 'favoritesOnly')
     and jsonb_typeof(v_filters -> 'favoritesOnly') not in ('boolean', 'null') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_favorites_filter';
  end if;
  v_favorites_only := coalesce((v_filters ->> 'favoritesOnly')::boolean, false);
  if v_favorites_only then
    v_viewer_id := public.marketplace_require_profile_v1();
  end if;

  if (v_filters ? 'search')
     and jsonb_typeof(v_filters -> 'search') not in ('string', 'null') then
    raise exception using errcode = '22023', message = 'invalid_marketplace_search';
  end if;
  v_search := nullif(trim(coalesce(v_filters ->> 'search', '')), '');
  if v_search is not null and char_length(v_search) > 120 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_search';
  end if;

  if p_listing_ids is not null then
    if cardinality(p_listing_ids) not between 1 and 100
       or array_position(p_listing_ids, null) is not null then
      raise exception using errcode = '22023', message = 'invalid_marketplace_listing_ids';
    end if;
    select array_agg(distinct requested.listing_id order by requested.listing_id)
      into v_listing_ids
    from unnest(p_listing_ids) requested(listing_id);

    if p_cursor is not null or v_filters <> '{}'::jsonb then
      raise exception using
        errcode = '22023', message = 'invalid_marketplace_listing_ids_mode';
    end if;
    -- Exact hydration is an all-or-nothing lookup. Match v1 by ignoring the
    -- discovery page size and returning every distinct requested listing.
    v_limit := cardinality(v_listing_ids);
  end if;

  if v_limit not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid_marketplace_limit';
  end if;

  if p_cursor is not null then
    if jsonb_typeof(p_cursor) <> 'object'
       or octet_length(p_cursor::text) > 2048
       or exists (
         select 1
         from jsonb_object_keys(p_cursor) supplied(key)
         where supplied.key <> all(array[
           'version', 'sort', 'sortValue', 'publishedAt', 'listingId'
         ]::text[])
       )
       or jsonb_typeof(p_cursor -> 'version') <> 'number'
       or jsonb_typeof(p_cursor -> 'sort') <> 'string'
       or jsonb_typeof(p_cursor -> 'publishedAt') <> 'string'
       or jsonb_typeof(p_cursor -> 'listingId') <> 'string'
       or not (p_cursor ?& array[
         'version', 'sort', 'sortValue', 'publishedAt', 'listingId'
       ])
       or coalesce(p_cursor ->> 'version', '') <> '1'
       or p_cursor ->> 'sort' is distinct from v_sort
       or nullif(p_cursor ->> 'publishedAt', '') is null
       or nullif(p_cursor ->> 'listingId', '') is null then
      raise exception using errcode = '22023', message = 'invalid_marketplace_cursor';
    end if;
    begin
      v_cursor_sort := p_cursor ->> 'sort';
      v_cursor_published_at := public.marketplace_safe_timestamptz_v1(
        p_cursor ->> 'publishedAt'
      );
      if v_cursor_published_at is null then
        raise exception using errcode = '22023', message = 'invalid_marketplace_cursor';
      end if;
      v_cursor_listing_id := (p_cursor ->> 'listingId')::uuid;
      if v_sort <> 'recommended' then
        v_cursor_sort_value := public.marketplace_jsonb_integer_v1(
          p_cursor, 'sortValue', 0, 1000000000000, true
        );
      elsif jsonb_typeof(p_cursor -> 'sortValue') <> 'null' then
        raise exception using errcode = '22023', message = 'invalid_marketplace_cursor';
      end if;
    exception
      when others then
        raise exception using errcode = '22023', message = 'invalid_marketplace_cursor';
    end;
  end if;

  return query
  with eligible as (
    select
      listing.id,
      listing.published_at,
      listing.remote_enabled,
      listing.preparation_days,
      case
        when listing.pillar = 'rental' then coalesce(
          public.marketplace_safe_date_v1(listing.terms ->> 'available_from'),
          current_date + listing.preparation_days
        )
        when listing.pillar = 'services' then coalesce(
          public.marketplace_safe_timestamptz_v1(
            listing.terms ->> 'event_date'
          )::date,
          current_date + listing.preparation_days
        )
        else current_date + listing.preparation_days
      end as available_on,
      seller.seller_kind,
      primary_price.amount_minor,
      case
        when v_sort in ('price-asc', 'price-desc') then primary_price.amount_minor
        when v_sort = 'rating' then seller.rating_basis_points::bigint
        when v_sort = 'popular' then seller.completed_orders_count::bigint
        else null::bigint
      end as sort_value,
      case
        when v_viewer_id is null then false
        else exists (
          select 1
          from public.marketplace_favorites favorite
          where favorite.profile_id = v_viewer_id
            and favorite.listing_id = listing.id
        )
      end as viewer_favorite
    from public.marketplace_listings listing
    join public.marketplace_seller_profiles seller
      on seller.profile_id = listing.seller_profile_id
     and seller.seller_status = 'active'
    join public.profiles profile
      on profile.id = listing.seller_profile_id
    left join public.profile_grade_state grade_state
      on grade_state.profile_id = listing.seller_profile_id
    join public.marketplace_listing_prices primary_price
      on primary_price.listing_id = listing.id
     and primary_price.price_kind = 'primary'
    where listing.status = 'published'
      and listing.published_at is not null
      and coalesce(profile.show_on_public_profile, false)
      and not coalesce(profile.is_ghost_mode, true)
      and (v_listing_ids is null or listing.id = any(v_listing_ids))
      and (v_pillar is null or listing.pillar = v_pillar)
      and (
        v_categories is null
        or lower(replace(trim(listing.category_code), '-', '_')) = any(v_categories)
        or (
          ('autres' = any(v_categories) or 'other' = any(v_categories))
          and (
            lower(replace(trim(listing.category_code), '-', '_'))
              = any(array['autres', 'other']::text[])
            or lower(replace(trim(listing.category_code), '-', '_'))
              <> all(v_known_categories)
          )
        )
      )
      and (v_price_min is null or primary_price.amount_minor >= v_price_min)
      and (v_price_max is null or primary_price.amount_minor <= v_price_max)
      and (
        v_conditions is null
        or case
          when listing.pillar = 'new' then 'new'
          when listing.condition_code is null then
            case when listing.pillar = 'used' then 'excellent' else 'new' end
          when lower(replace(trim(listing.condition_code), '_', '-'))
            in ('new', 'neuf') then 'new'
          when lower(replace(trim(listing.condition_code), '_', '-'))
            in ('mint', 'comme-neuf') then 'mint'
          when lower(replace(trim(listing.condition_code), '_', '-'))
            = 'excellent' then 'excellent'
          when lower(replace(trim(listing.condition_code), '_', '-'))
            in ('very-good', 'tres-bon') then 'very-good'
          when listing.pillar = 'used' then 'very-good'
          else 'new'
        end = any(v_conditions)
      )
      and (
        v_fulfillment is null
        or ('shipping' = any(v_fulfillment) and listing.shipping_enabled)
        or ('pickup' = any(v_fulfillment) and listing.pickup_enabled)
        or ('remote' = any(v_fulfillment) and listing.remote_enabled)
      )
      and (
        v_availability = 'any'
        or (
          v_availability = 'now'
          and case
            when listing.pillar = 'rental' then coalesce(
              public.marketplace_safe_date_v1(listing.terms ->> 'available_from'),
              current_date + listing.preparation_days
            )
            when listing.pillar = 'services' then coalesce(
              public.marketplace_safe_timestamptz_v1(
                listing.terms ->> 'event_date'
              )::date,
              current_date + listing.preparation_days
            )
            else current_date + listing.preparation_days
          end <= current_date
        )
        or (
          v_availability = '7-days'
          and case
            when listing.pillar = 'rental' then coalesce(
              public.marketplace_safe_date_v1(listing.terms ->> 'available_from'),
              current_date + listing.preparation_days
            )
            when listing.pillar = 'services' then coalesce(
              public.marketplace_safe_timestamptz_v1(
                listing.terms ->> 'event_date'
              )::date,
              current_date + listing.preparation_days
            )
            else current_date + listing.preparation_days
          end <= current_date + 7
        )
        or (
          v_availability = '30-days'
          and case
            when listing.pillar = 'rental' then coalesce(
              public.marketplace_safe_date_v1(listing.terms ->> 'available_from'),
              current_date + listing.preparation_days
            )
            when listing.pillar = 'services' then coalesce(
              public.marketplace_safe_timestamptz_v1(
                listing.terms ->> 'event_date'
              )::date,
              current_date + listing.preparation_days
            )
            else current_date + listing.preparation_days
          end <= current_date + 30
        )
      )
      and (v_seller_kinds is null or seller.seller_kind = any(v_seller_kinds))
      and (not v_verified_only or coalesce(profile.is_verified, false))
      and (
        v_minimum_grade is null
        or (
          coalesce(profile.public_profile_preferences ->> 'show_grade', 'true') <> 'false'
          and grade_state.level >= v_minimum_grade
        )
      )
      and (
        not v_favorites_only
        or exists (
          select 1
          from public.marketplace_favorites favorite
          where favorite.profile_id = v_viewer_id
            and favorite.listing_id = listing.id
        )
      )
      and (
        v_search is null
        or strpos(
          lower(concat_ws(' ', listing.title, listing.short_description,
            listing.brand, listing.model, listing.category_code,
            listing.city_label, listing.area_label,
            profile.display_name, profile.full_name, profile.username)),
          lower(v_search)
        ) > 0
      )
  ),
  after_cursor as (
    select eligible.*
    from eligible
    where p_cursor is null
      or (
        v_sort = 'recommended'
        and (eligible.published_at, eligible.id)
          < (v_cursor_published_at, v_cursor_listing_id)
      )
      or (
        v_sort = 'price-asc'
        and (
          eligible.sort_value > v_cursor_sort_value
          or (
            eligible.sort_value = v_cursor_sort_value
            and (eligible.published_at, eligible.id)
              < (v_cursor_published_at, v_cursor_listing_id)
          )
        )
      )
      or (
        v_sort in ('price-desc', 'rating', 'popular')
        and (
          eligible.sort_value < v_cursor_sort_value
          or (
            eligible.sort_value = v_cursor_sort_value
            and (eligible.published_at, eligible.id)
              < (v_cursor_published_at, v_cursor_listing_id)
          )
        )
      )
  ),
  ranked as (
    select
      after_cursor.*,
      row_number() over (
        order by
          case when v_sort = 'price-asc' then after_cursor.sort_value end asc,
          case when v_sort in ('price-desc', 'rating', 'popular')
            then after_cursor.sort_value end desc,
          after_cursor.published_at desc,
          after_cursor.id desc
      ) as ordinal
    from after_cursor
  ),
  page as (
    select ranked.*
    from ranked
    where ranked.ordinal <= v_limit + 1
  ),
  page_meta as (
    select exists(select 1 from page where page.ordinal = v_limit + 1) as has_more
  ),
  selected_ids as (
    select array_agg(page.id order by page.ordinal) as ids
    from page
    where page.ordinal <= v_limit
  )
  select
    catalog.listing_id,
    catalog.seller_profile_id,
    catalog.seller_display_name,
    catalog.seller_username,
    catalog.seller_avatar_url,
    catalog.seller_grade_level,
    catalog.seller_verified,
    catalog.seller_rating_basis_points,
    catalog.seller_rating_count,
    catalog.seller_completed_orders_count,
    catalog.seller_response_time_bucket,
    catalog.slug,
    catalog.pillar,
    catalog.category_code,
    catalog.title,
    catalog.short_description,
    catalog.description,
    catalog.brand,
    catalog.model,
    catalog.condition_code,
    catalog.condition_label,
    catalog.cover_url,
    catalog.cover_storage_bucket,
    catalog.cover_storage_path,
    catalog.cover_alt,
    catalog.badge_label,
    catalog.city_label,
    catalog.area_label,
    catalog.pickup_enabled,
    catalog.shipping_enabled,
    catalog.shipping_amount_minor,
    catalog.currency_code,
    catalog.unit_amount_minor,
    catalog.compare_at_amount_minor,
    catalog.price_unit,
    catalog.max_quantity,
    catalog.preparation_days,
    catalog.new_terms,
    catalog.used_terms,
    case
      when catalog.rental_terms is not null then jsonb_set(
        catalog.rental_terms,
        '{available_from}',
        to_jsonb(page.available_on::text),
        true
      )
      else null
    end,
    case
      when catalog.service_terms is not null then jsonb_set(
        catalog.service_terms,
        '{event_date}',
        coalesce(
          to_jsonb(public.marketplace_safe_timestamptz_v1(
            catalog.service_terms ->> 'event_date'
          )),
          'null'::jsonb
        ),
        true
      )
      else null
    end,
    catalog.collective_terms,
    catalog.published_at,
    case
      when page.ordinal = v_limit and page_meta.has_more then page.published_at
      else null
    end,
    case
      when page.ordinal = v_limit and page_meta.has_more then page.id
      else null
    end,
    page.seller_kind,
    page.remote_enabled,
    page.viewer_favorite,
    case
      when page.available_on <= current_date then 'now'
      when page.available_on <= current_date + 7 then '7-days'
      when page.available_on <= current_date + 30 then '30-days'
      else 'later'
    end,
    v_sort,
    false,
    null::double precision,
    case
      when page.ordinal = v_limit and page_meta.has_more then
        jsonb_build_object(
          'version', 1,
          'sort', v_sort,
          'sortValue', case when v_sort = 'recommended' then null else page.sort_value end,
          'publishedAt', page.published_at,
          'listingId', page.id
        )
      else null
    end
  from selected_ids
  cross join page_meta
  cross join lateral public.list_marketplace_catalog_v1(
    null, null, cardinality(selected_ids.ids), null, null, null, selected_ids.ids
  ) catalog
  join page on page.id = catalog.listing_id and page.ordinal <= v_limit
  where selected_ids.ids is not null
  order by
    case when v_sort = 'price-asc' then page.sort_value end asc,
    case when v_sort in ('price-desc', 'rating', 'popular')
      then page.sort_value end desc,
    page.published_at desc,
    page.id desc;
end;
$$;

revoke execute on function public.get_marketplace_catalog_capabilities_v1()
  from public;
revoke execute on function public.marketplace_safe_date_v1(text)
  from public, anon, authenticated;
revoke execute on function public.marketplace_safe_timestamptz_v1(text)
  from public, anon, authenticated;
revoke execute on function public.set_my_marketplace_seller_kind_v1(text)
  from public, anon;
revoke execute on function public.get_my_marketplace_seller_kind_v1()
  from public, anon;
revoke execute on function public.create_marketplace_listing_draft_v2(jsonb, text, text)
  from public, anon;
revoke execute on function public.update_marketplace_listing_draft_v2(uuid, bigint, jsonb, text, text)
  from public, anon;
revoke execute on function public.list_marketplace_catalog_v2(jsonb, integer, jsonb, uuid[])
  from public;

grant execute on function public.get_marketplace_catalog_capabilities_v1()
  to anon, authenticated, service_role;
grant execute on function public.set_my_marketplace_seller_kind_v1(text)
  to authenticated, service_role;
grant execute on function public.get_my_marketplace_seller_kind_v1()
  to authenticated, service_role;
grant execute on function public.create_marketplace_listing_draft_v2(jsonb, text, text)
  to authenticated, service_role;
grant execute on function public.update_marketplace_listing_draft_v2(uuid, bigint, jsonb, text, text)
  to authenticated, service_role;
grant execute on function public.list_marketplace_catalog_v2(jsonb, integer, jsonb, uuid[])
  to anon, authenticated, service_role;

commit;
begin;

create extension if not exists pgtap with schema extensions;

-- Phase A is tested only through the browser-visible RPC surface while a
-- client role is active. Internal rows are inspected after reset role.
select plan(107);

-- ---------------------------------------------------------------------------
-- Contract, privilege boundary and deliberate Phase-A scope.
-- ---------------------------------------------------------------------------

select has_table('public', 'marketplace_seller_profiles', 'seller state exists');
select has_table('public', 'marketplace_listings', 'listing catalogue exists');
select has_table('public', 'marketplace_listing_prices', 'server prices exist');
select has_table('public', 'marketplace_listing_media', 'listing media references exist');
select has_table('public', 'marketplace_favorites', 'favorites exist');
select has_table('public', 'marketplace_cart_items', 'cart items exist');
select has_table('public', 'marketplace_intents', 'non-financial intents exist');
select has_table('public', 'marketplace_idempotency', 'idempotency ledger exists');

select ok(
  not exists (
    select 1
    from unnest(array[
      'public.list_marketplace_catalog_v1(timestamp with time zone,uuid,integer,text,text,text,uuid[])',
      'public.get_my_marketplace_state_v1()',
      'public.set_marketplace_favorite_v1(uuid,boolean,text)',
      'public.set_marketplace_cart_item_v1(uuid,integer,text)',
      'public.create_marketplace_listing_draft_v1(jsonb,text)',
      'public.list_my_marketplace_listing_drafts_v1(integer)',
      'public.update_marketplace_listing_draft_v1(uuid,bigint,jsonb,text)',
      'public.create_marketplace_rental_request_v1(uuid,date,date,text,text)',
      'public.create_marketplace_service_booking_v1(uuid,timestamp with time zone,text,text)',
      'public.join_marketplace_collective_v1(uuid,integer,text)',
      'public.list_my_marketplace_intents_v1(text,text,integer)',
      'public.update_marketplace_intent_status_v1(uuid,text,text)',
      'public.cancel_marketplace_intent_v1(uuid,text)'
    ]) expected(signature)
    where to_regprocedure(expected.signature) is null
  ),
  'all stable Marketplace v1 RPC signatures exist'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.marketplace_seller_profiles',
      'public.marketplace_listings',
      'public.marketplace_listing_prices',
      'public.marketplace_listing_media',
      'public.marketplace_favorites',
      'public.marketplace_cart_items',
      'public.marketplace_intents',
      'public.marketplace_idempotency'
    ]) private_table(name)
    cross join unnest(array['select', 'insert', 'update', 'delete']) privilege(name)
    where has_table_privilege('authenticated', private_table.name, privilege.name)
  ),
  'authenticated clients have no raw Marketplace table privilege'
);
select ok(
  (
    select bool_and(class.relrowsecurity and class.relforcerowsecurity)
    from pg_class class
    where class.oid in (
      'public.marketplace_seller_profiles'::regclass,
      'public.marketplace_listings'::regclass,
      'public.marketplace_listing_prices'::regclass,
      'public.marketplace_listing_media'::regclass,
      'public.marketplace_favorites'::regclass,
      'public.marketplace_cart_items'::regclass,
      'public.marketplace_intents'::regclass,
      'public.marketplace_idempotency'::regclass
    )
  ),
  'all raw Marketplace tables force RLS'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.get_my_marketplace_state_v1()',
      'public.set_marketplace_favorite_v1(uuid,boolean,text)',
      'public.set_marketplace_cart_item_v1(uuid,integer,text)',
      'public.create_marketplace_listing_draft_v1(jsonb,text)',
      'public.list_my_marketplace_listing_drafts_v1(integer)',
      'public.update_marketplace_listing_draft_v1(uuid,bigint,jsonb,text)',
      'public.create_marketplace_rental_request_v1(uuid,date,date,text,text)',
      'public.create_marketplace_service_booking_v1(uuid,timestamp with time zone,text,text)',
      'public.join_marketplace_collective_v1(uuid,integer,text)',
      'public.list_my_marketplace_intents_v1(text,text,integer)',
      'public.update_marketplace_intent_status_v1(uuid,text,text)',
      'public.cancel_marketplace_intent_v1(uuid,text)'
    ]) expected(signature)
    where has_function_privilege('anon', expected.signature, 'execute')
  ),
  'anonymous clients cannot invoke personal or mutation RPCs'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.marketplace_touch_updated_at_v1()',
      'public.marketplace_validate_listing_media_v1()',
      'public.marketplace_require_profile_v1()',
      'public.marketplace_idempotency_replay_v1(uuid,text,text,text)',
      'public.marketplace_store_idempotency_v1(uuid,text,text,text,uuid,jsonb)',
      'public.marketplace_jsonb_integer_v1(jsonb,text,bigint,bigint,boolean)',
      'public.marketplace_create_intent_v1(uuid,text,integer,date,date,timestamp with time zone,text,text)'
    ]) internal(signature)
    cross join unnest(array['anon', 'authenticated']) client_role(name)
    where has_function_privilege(client_role.name, internal.signature, 'execute')
  ),
  'internal Marketplace helpers are not executable by browser roles'
);
select ok(
  has_function_privilege(
    'anon',
    'public.list_marketplace_catalog_v1(timestamp with time zone,uuid,integer,text,text,text,uuid[])',
    'execute'
  ),
  'anonymous clients can read the safe catalogue projection'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.get_my_marketplace_state_v1()',
      'public.set_marketplace_favorite_v1(uuid,boolean,text)',
      'public.set_marketplace_cart_item_v1(uuid,integer,text)',
      'public.create_marketplace_listing_draft_v1(jsonb,text)',
      'public.list_my_marketplace_listing_drafts_v1(integer)',
      'public.update_marketplace_listing_draft_v1(uuid,bigint,jsonb,text)',
      'public.create_marketplace_rental_request_v1(uuid,date,date,text,text)',
      'public.create_marketplace_service_booking_v1(uuid,timestamp with time zone,text,text)',
      'public.join_marketplace_collective_v1(uuid,integer,text)',
      'public.list_my_marketplace_intents_v1(text,text,integer)',
      'public.update_marketplace_intent_status_v1(uuid,text,text)',
      'public.cancel_marketplace_intent_v1(uuid,text)'
    ]) expected(signature)
    where not has_function_privilege('authenticated', expected.signature, 'execute')
  ),
  'authenticated clients can invoke every intended Marketplace mutation RPC'
);
select ok(
  (
    select bool_and(procedure.prosecdef)
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname like '%marketplace%v1'
  ),
  'Marketplace functions execute behind the server authority boundary'
);
select ok(
  (
    select bool_and(procedure.proconfig @> array['search_path=public, pg_temp'])
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname like '%marketplace%v1'
  ),
  'every Marketplace function fixes its search_path'
);
select ok(
  to_regclass('public.marketplace_orders') is null
    and to_regclass('public.marketplace_payments') is null
    and to_regclass('public.marketplace_payouts') is null
    and to_regclass('public.marketplace_ledger') is null,
  'Phase A creates no order, payment, payout or financial ledger'
);

-- ---------------------------------------------------------------------------
-- Three independent profiles and deterministic catalogue fixtures.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '81000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'market-seller-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Market Seller A"}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '82000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'market-buyer@example.test', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Market Buyer"}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '83000000-0000-4000-8000-000000000003',
    'authenticated', 'authenticated', 'market-seller-c@example.test', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Market Seller C"}'::jsonb, now(), now()
  );

create temporary table marketplace_test_context (
  draft_id uuid,
  rental_intent_id uuid,
  second_rental_intent_id uuid,
  service_intent_id uuid,
  collective_intent_id uuid,
  ticket_intent_id uuid
);
insert into marketplace_test_context default values;
grant select, insert, update, delete on marketplace_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(
  $$select public.complete_onboarding_v1(
    'market_seller_a', 'Market Seller A', 'avatar_7', 'producer', 'Paris', 'FR',
    48.8566, 2.3522, false, true
  )$$,
  'seller A completes onboarding'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(
  $$select public.complete_onboarding_v1(
    'market_buyer', 'Market Buyer', 'avatar_8', 'dj', 'Paris', 'FR',
    48.8570, 2.3530, false, true
  )$$,
  'buyer completes onboarding'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '83000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(
  $$select public.complete_onboarding_v1(
    'market_seller_c', 'Market Seller C', 'avatar_9', 'instrumentalist', 'Paris', 'FR',
    48.8580, 2.3540, false, true
  )$$,
  'seller C completes onboarding'
);

reset role;
insert into public.marketplace_seller_profiles (
  profile_id, rating_basis_points, rating_count, completed_orders_count,
  response_time_bucket
)
values
  ('81000000-0000-4000-8000-000000000001', 48750, 42, 18, 'under_4h'),
  ('83000000-0000-4000-8000-000000000003', 46000, 12, 4, 'same_day');

insert into public.media_files (
  id, user_id, type, name, file_url, is_public, status, visibility,
  published_at, source_pillar, mime_type
)
values
  (
    '84000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001', 'image', 'Market cover',
    'https://assets.example.test/market-cover.webp', true, 'published', 'public',
    now(), 'marketplace', 'image/webp'
  ),
  (
    '84000000-0000-4000-8000-000000000002',
    '82000000-0000-4000-8000-000000000002', 'image', 'Buyer draft',
    'https://assets.example.test/buyer-draft.webp', false, 'ready', 'private',
    null, 'marketplace', 'image/webp'
  ),
  (
    '84000000-0000-4000-8000-000000000003',
    '82000000-0000-4000-8000-000000000002', 'video', 'Buyer video',
    'https://assets.example.test/buyer-video.mp4', false, 'draft', 'private',
    null, 'marketplace', 'video/mp4'
  ),
  (
    '84000000-0000-4000-8000-000000000004',
    '82000000-0000-4000-8000-000000000002', 'image', 'Profile image',
    'https://assets.example.test/profile-image.webp', false, 'ready', 'private',
    null, 'profile', 'image/webp'
  ),
  (
    '84000000-0000-4000-8000-000000000005',
    '82000000-0000-4000-8000-000000000002', 'image', 'Archived market image',
    'https://assets.example.test/archived-market-image.webp', false, 'archived', 'private',
    null, 'marketplace', 'image/webp'
  );

update public.media_files
set file_size = 1024, size_bytes = 1024
where id in (
  '84000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000002',
  '84000000-0000-4000-8000-000000000003',
  '84000000-0000-4000-8000-000000000004',
  '84000000-0000-4000-8000-000000000005'
);

insert into public.media_files (
  id, user_id, type, name, file_url, file_size, size_bytes,
  is_public, status, visibility, published_at, source_pillar, mime_type
)
values (
  '84000000-0000-4000-8000-000000000006',
  '82000000-0000-4000-8000-000000000002', 'image', 'Oversized market image',
  'https://assets.example.test/oversized-market-image.webp',
  12582913, 12582913, false, 'ready', 'private', null,
  'marketplace', 'image/webp'
);

insert into public.media_files (
  id, user_id, type, name, file_url,
  is_public, status, visibility, published_at, source_pillar, mime_type
)
values (
  '84000000-0000-4000-8000-000000000007',
  '82000000-0000-4000-8000-000000000002', 'image', 'Unknown-size market image',
  'https://assets.example.test/unknown-size-market-image.webp',
  false, 'ready', 'private', null, 'marketplace', 'image/webp'
);

insert into public.marketplace_listings (
  id, seller_profile_id, slug, pillar, category_code, title,
  short_description, description, brand, condition_code, condition_label,
  status, city_label, pickup_enabled, shipping_enabled, remote_enabled,
  max_quantity, terms, published_at
)
values
  (
    '85000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000001', 'synth-neuf-test', 'new',
    'synthesizers', 'Synthé neuf', 'Un synthé prêt pour la scène.',
    'Description complète du synthé neuf.', 'Meewav', 'new', 'Neuf',
    'published', 'Paris', true, true, false, 3,
    '{"stock":3,"warranty_months":24}'::jsonb, now() - interval '1 hour'
  ),
  (
    '85000000-0000-4000-8000-000000000002',
    '81000000-0000-4000-8000-000000000001', 'micro-occasion-test', 'used',
    'microphones', 'Micro occasion', 'Un micro de studio révisé.',
    'Description complète du micro occasion.', 'Meewav', 'excellent', 'Excellent',
    'published', 'Paris', true, false, false, 1,
    '{"purchase_year":2024,"negotiable":true,"condition_notes":"Révisé en atelier."}'::jsonb,
    now() - interval '2 hours'
  ),
  (
    '85000000-0000-4000-8000-000000000003',
    '81000000-0000-4000-8000-000000000001', 'location-console-test', 'rental',
    'mixers', 'Console en location', 'Console disponible à la journée.',
    'Description complète de la console en location.', 'Meewav', null, null,
    'published', 'Paris', true, false, false, 1,
    jsonb_build_object(
      'daily_amount_minor', 12000, 'deposit_amount_minor', 50000,
      'minimum_days', 2, 'available_from', current_date::text,
      'instant_book', false
    ), now() - interval '3 hours'
  ),
  (
    '85000000-0000-4000-8000-000000000004',
    '81000000-0000-4000-8000-000000000001', 'coaching-test', 'services',
    'coaching', 'Coaching production', 'Une session de coaching personnalisée.',
    'Description complète du coaching production.', null, null, null,
    'published', 'Paris', false, false, true, 1,
    jsonb_build_object(
      'service_kind', 'coaching', 'service_format', 'distance',
      'duration_label', '60 min', 'delivery_label', 'Plan personnalisé',
      'next_availability', 'Cette semaine',
      'event_date', (now() + interval '4 days')::timestamptz,
      'capacity', 12, 'venue_name', 'Studio Meewav',
      'included_equipment', 'Console et microphones'
    ),
    now() - interval '4 hours'
  ),
  (
    '85000000-0000-4000-8000-000000000005',
    '81000000-0000-4000-8000-000000000001', 'achat-collectif-test', 'collective',
    'studio', 'Achat collectif studio', 'Un pack studio financé ensemble.',
    'Description complète de cet achat collectif.', 'Meewav', null, null,
    'published', 'Paris', true, false, false, 2,
    '{"target_participants":2,"campaign_days":30}'::jsonb,
    now() - interval '5 hours'
  ),
  (
    '85000000-0000-4000-8000-000000000006',
    '81000000-0000-4000-8000-000000000001', 'brouillon-invisible-test', 'used',
    'other', 'Brouillon invisible', 'Ce brouillon ne doit jamais sortir.',
    'Description privée de ce brouillon.', null, null, null,
    'draft', 'Paris', true, false, false, 1, '{}'::jsonb, null
  ),
  (
    '85000000-0000-4000-8000-000000000007',
    '83000000-0000-4000-8000-000000000003', 'casque-autre-vendeur-test', 'new',
    'headphones', 'Casque autre vendeur', 'Un casque vendu par un autre artiste.',
    'Description complète du casque autre vendeur.', 'Meewav', 'new', 'Neuf',
    'published', 'Paris', true, true, false, 2,
    '{"stock":2,"warranty_months":12}'::jsonb, now() - interval '6 hours'
  );

update public.marketplace_listings
set preparation_days = case
  when id = '85000000-0000-4000-8000-000000000001' then 3
  when id = '85000000-0000-4000-8000-000000000002' then 1
  when id = '85000000-0000-4000-8000-000000000004' then 2
  else preparation_days
end
where id in (
  '85000000-0000-4000-8000-000000000001',
  '85000000-0000-4000-8000-000000000002',
  '85000000-0000-4000-8000-000000000004'
);

insert into public.marketplace_listing_prices (
  listing_id, price_kind, currency_code, amount_minor, price_unit
)
values
  ('85000000-0000-4000-8000-000000000001', 'primary', 'EUR', 99000, 'item'),
  ('85000000-0000-4000-8000-000000000001', 'compare_at', 'EUR', 109000, 'item'),
  ('85000000-0000-4000-8000-000000000002', 'primary', 'EUR', 24000, 'item'),
  ('85000000-0000-4000-8000-000000000003', 'primary', 'EUR', 12000, 'day'),
  ('85000000-0000-4000-8000-000000000003', 'deposit', 'EUR', 50000, 'item'),
  ('85000000-0000-4000-8000-000000000004', 'primary', 'EUR', 6500, 'session'),
  ('85000000-0000-4000-8000-000000000005', 'primary', 'EUR', 30000, 'participant'),
  ('85000000-0000-4000-8000-000000000005', 'collective_retail', 'EUR', 45000, 'participant'),
  ('85000000-0000-4000-8000-000000000005', 'collective_unlocked', 'EUR', 30000, 'participant'),
  ('85000000-0000-4000-8000-000000000006', 'primary', 'EUR', 1000, 'item'),
  ('85000000-0000-4000-8000-000000000007', 'primary', 'EUR', 18000, 'item');

insert into public.marketplace_listing_media (
  listing_id, media_file_id, media_role, position, alt_text
)
values (
  '85000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000001', 'cover', 0, 'Synthé neuf'
);

-- ---------------------------------------------------------------------------
-- Public catalogue: privacy, filters and stable composite cursor.
-- ---------------------------------------------------------------------------

set local role anon;
select is(
  (
    select count(*)::integer
    from public.list_marketplace_catalog_v1(null, null, 48, null, null, null)
  ),
  6,
  'public catalogue returns only six published listings'
);
select is(
  (
    select cover_url
    from public.list_marketplace_catalog_v1(null, null, 48, 'new', 'synthesizers', null)
    where listing_id = '85000000-0000-4000-8000-000000000001'
  ),
  'https://assets.example.test/market-cover.webp',
  'public catalogue exposes only the published cover URL'
);
select ok(
  (
    select not (to_jsonb(catalogue_row) ? 'email')
      and not (to_jsonb(catalogue_row) ? 'phone')
      and not (to_jsonb(catalogue_row) ? 'latitude')
      and not (to_jsonb(catalogue_row) ? 'longitude')
    from public.list_marketplace_catalog_v1(null, null, 1, null, null, null) catalogue_row
    limit 1
  ),
  'catalogue projection contains no private profile coordinates or contact data'
);
select is(
  (
    select count(*)::integer
    from public.list_marketplace_catalog_v1(null, null, 48, 'rental', null, null)
  ),
  1,
  'pillar filter isolates rental listings'
);
select is(
  (
    select count(*)::integer
    from public.list_marketplace_catalog_v1(null, null, 48, null, null, 'coaching')
  ),
  1,
  'catalogue search matches safe listing text'
);
select is(
  (
    select count(*)::integer
    from public.list_marketplace_catalog_v1(null, null, 48, null, null, 'market_seller_a')
  ),
  5,
  'catalogue search matches the safe public seller identity'
);
select is(
  (
    select count(*)::integer
    from public.list_marketplace_catalog_v1(
      null, null, 48, null, null, null,
      array[
        '85000000-0000-4000-8000-000000000001'::uuid,
        '85000000-0000-4000-8000-000000000004'::uuid
      ]
    )
  ),
  2,
  'exact listing-ID mode hydrates every visible requested listing'
);
select throws_ok(
  $$select * from public.list_marketplace_catalog_v1(
    null, null, 48, 'new', null, null,
    array['85000000-0000-4000-8000-000000000001'::uuid]
  )$$,
  '22023', 'invalid_marketplace_listing_ids',
  'exact listing-ID mode cannot be mixed with discovery filters'
);
select ok(
  (
    select (collective_terms ->> 'joined')::integer = 0
      and (collective_terms ->> 'target_participants')::integer = 2
      and (collective_terms ->> 'progress_percent')::integer = 0
      and (collective_terms ->> 'days_remaining')::integer between 29 and 30
      and (collective_terms ->> 'retail_unit_amount_minor')::bigint = 45000
      and (collective_terms ->> 'unlocked_unit_amount_minor')::bigint = 30000
      and (collective_terms ->> 'savings_percent')::integer = 33
    from public.list_marketplace_catalog_v1(null, null, 48, 'collective', null, null)
  ),
  'collective catalogue terms contain authoritative computed progress and prices'
);
select ok(
  (
    select shipping_amount_minor = 0
      and to_jsonb(catalogue_row) ? 'cover_storage_bucket'
      and to_jsonb(catalogue_row) ? 'cover_storage_path'
    from public.list_marketplace_catalog_v1(null, null, 48, 'new', 'synthesizers', null) catalogue_row
    limit 1
  ),
  'catalogue exposes canonical shipping and private cover storage coordinates'
);
select ok(
  (
    select preparation_days = 3
      and (new_terms ->> 'stock')::integer = 3
      and (new_terms ->> 'warranty_months')::integer = 24
    from public.list_marketplace_catalog_v1(
      null, null, 48, 'new', 'synthesizers', null
    )
    where listing_id = '85000000-0000-4000-8000-000000000001'
  ),
  'new listing projection preserves preparation, stock and warranty'
);
select ok(
  (
    select preparation_days = 1
      and (used_terms ->> 'purchase_year')::integer = 2024
      and (used_terms ->> 'negotiable')::boolean
      and used_terms ->> 'condition_notes' = 'Révisé en atelier.'
    from public.list_marketplace_catalog_v1(
      null, null, 48, 'used', 'microphones', null
    )
    where listing_id = '85000000-0000-4000-8000-000000000002'
  ),
  'used listing projection preserves year, negotiation and condition notes'
);
select ok(
  (
    select preparation_days = 2
      and service_terms ->> 'event_date' is not null
      and (service_terms ->> 'capacity')::integer = 12
      and service_terms ->> 'venue_name' = 'Studio Meewav'
      and service_terms ->> 'included_equipment' = 'Console et microphones'
    from public.list_marketplace_catalog_v1(
      null, null, 48, 'services', 'coaching', null
    )
    where listing_id = '85000000-0000-4000-8000-000000000004'
  ),
  'service projection preserves event, capacity, venue and equipment'
);
select ok(
  (
    select next_cursor_published_at is not null
      and next_cursor_listing_id is not null
    from public.list_marketplace_catalog_v1(null, null, 2, null, null, null)
    order by published_at asc, listing_id asc
    limit 1
  ),
  'last row of a partial page carries a composite next cursor'
);
select is(
  (
    with first_page as (
      select *
      from public.list_marketplace_catalog_v1(null, null, 2, null, null, null)
    ), cursor_row as (
      select next_cursor_published_at, next_cursor_listing_id
      from first_page
      where next_cursor_listing_id is not null
    )
    select count(*)::integer
    from cursor_row,
      lateral public.list_marketplace_catalog_v1(
        cursor_row.next_cursor_published_at,
        cursor_row.next_cursor_listing_id,
        2, null, null, null
      ) next_page
    where not exists (
      select 1 from first_page
      where first_page.listing_id = next_page.listing_id
    )
  ),
  2,
  'composite cursor returns the next two non-duplicated listings'
);
select throws_ok(
  $$select * from public.list_marketplace_catalog_v1(
    now(), null, 20, null, null, null
  )$$,
  '22023', 'invalid_marketplace_cursor',
  'half a composite cursor is rejected'
);

-- ---------------------------------------------------------------------------
-- Personal state, favorites and mono-seller cart.
-- ---------------------------------------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is(
  public.get_my_marketplace_state_v1(),
  '{"cart_items":[],"favorite_listing_ids":[],"joined_collective_listing_ids":[]}'::jsonb,
  'new buyer starts with empty Marketplace state'
);
select is(
  (public.set_marketplace_favorite_v1(
    '85000000-0000-4000-8000-000000000001', true, 'favorite-add-0001'
  ) ->> 'favorite')::boolean,
  true,
  'buyer can favorite a published listing'
);
select is(
  (public.set_marketplace_favorite_v1(
    '85000000-0000-4000-8000-000000000001', true, 'favorite-add-0001'
  ) ->> 'idempotent')::boolean,
  true,
  'favorite retry is idempotent'
);
select throws_ok(
  $$select public.set_marketplace_favorite_v1(
    '85000000-0000-4000-8000-000000000001', false, 'favorite-add-0001'
  )$$,
  '23505', 'idempotency_conflict',
  'favorite key cannot be replayed with another intent'
);
select is(
  (public.set_marketplace_cart_item_v1(
    '85000000-0000-4000-8000-000000000001', 2, 'cart-new-0001'
  ) ->> 'quantity')::integer,
  2,
  'buyer adds two available items to the cart'
);
select lives_ok(
  $$select public.set_marketplace_cart_item_v1(
    '85000000-0000-4000-8000-000000000002', 1, 'cart-used-0001'
  )$$,
  'same seller and currency can share the cart'
);
select throws_ok(
  $$select public.set_marketplace_cart_item_v1(
    '85000000-0000-4000-8000-000000000007', 1, 'cart-conflict-0001'
  )$$,
  '22023', 'marketplace_cart_scope_conflict',
  'another seller cannot be mixed into the cart'
);
select is(
  (
    select sum((item ->> 'quantity')::integer)::integer
    from jsonb_array_elements(
      public.get_my_marketplace_state_v1() -> 'cart_items'
    ) item
  ),
  3,
  'viewer state returns both persisted cart quantities'
);
select is(
  (public.set_marketplace_cart_item_v1(
    '85000000-0000-4000-8000-000000000001', 0, 'cart-remove-0001'
  ) ->> 'quantity')::integer,
  0,
  'quantity zero removes a cart item'
);
select is(
  (public.set_marketplace_favorite_v1(
    '85000000-0000-4000-8000-000000000001', false, 'favorite-remove-0001'
  ) ->> 'favorite')::boolean,
  false,
  'buyer removes an existing favorite'
);
reset role;
select is(
  (
    select count(*)::integer
    from public.marketplace_idempotency ledger
    where ledger.actor_profile_id = '82000000-0000-4000-8000-000000000002'
      and (
        (ledger.operation = 'favorite' and ledger.idempotency_key = 'favorite-remove-0001')
        or (ledger.operation = 'cart_item' and ledger.idempotency_key = 'cart-remove-0001')
      )
      and ledger.listing_id is null
  ),
  2,
  'remove operations retain idempotency independently from listing lifetime'
);
delete from public.marketplace_listings
where id = '85000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select ok(
  (public.set_marketplace_favorite_v1(
    '85000000-0000-4000-8000-000000000001', false, 'favorite-remove-0001'
  ) ->> 'idempotent')::boolean
  and (public.set_marketplace_cart_item_v1(
    '85000000-0000-4000-8000-000000000001', 0, 'cart-remove-0001'
  ) ->> 'idempotent')::boolean,
  'favorite and cart removals replay after their listing is deleted'
);
select is(
  (public.set_marketplace_favorite_v1(
    '85000000-0000-4000-8000-000000000099', false, 'favorite-stale-remove-0001'
  ) ->> 'favorite')::boolean,
  false,
  'removing a stale favorite remains idempotent after its listing disappeared'
);
select is(
  (public.set_marketplace_cart_item_v1(
    '85000000-0000-4000-8000-000000000099', 0, 'cart-stale-remove-0001'
  ) ->> 'quantity')::integer,
  0,
  'removing a stale cart item remains idempotent after its listing disappeared'
);
select throws_ok(
  $$select count(*) from public.marketplace_listings$$,
  '42501', 'permission denied for table marketplace_listings',
  'authenticated browser cannot bypass RPCs to read raw listings'
);

-- ---------------------------------------------------------------------------
-- Five-step composer contract: normalized draft and owned media only.
-- ---------------------------------------------------------------------------

update marketplace_test_context
set draft_id = (
  public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used",
      "category_code":"interfaces",
      "title":"Interface audio révisée",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "brand":"Meewav",
      "model":"Studio Two",
      "condition_code":"excellent",
      "currency_code":"EUR",
      "unit_amount_minor":24500,
      "price_unit":"item",
      "city":"Paris",
      "area":"11e",
      "pickup":true,
      "shipping":true,
      "remote":false,
      "shipping_amount_minor":900,
      "preparation_days":2,
      "media_file_ids":["84000000-0000-4000-8000-000000000002"],
      "terms":{
        "purchase_year":2025,
        "negotiable":true,
        "condition_notes":"Révisée et testée.",
        "ignored_client_authority":"must-not-persist"
      },
      "status":"published",
      "seller_profile_id":"81000000-0000-4000-8000-000000000001"
    }'::jsonb,
    'listing-draft-0001'
  ) ->> 'listing_id'
)::uuid;
select ok(
  (select draft_id is not null from marketplace_test_context),
  'composer creates a durable draft'
);
select is(
  (
    public.create_marketplace_listing_draft_v1(
      '{
        "pillar":"used","category_code":"interfaces",
        "title":"Interface audio révisée",
        "short_description":"Une interface compacte en parfait état.",
        "description":"Description détaillée et honnête de cette interface.",
        "brand":"Meewav","model":"Studio Two","condition_code":"excellent",
        "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
        "city":"Paris","area":"11e","pickup":true,"shipping":true,"remote":false,
        "shipping_amount_minor":900,"preparation_days":2,
        "media_file_ids":["84000000-0000-4000-8000-000000000002"],
        "terms":{"purchase_year":2025,"negotiable":true,"condition_notes":"Révisée et testée.","ignored_client_authority":"must-not-persist"},
        "status":"published","seller_profile_id":"81000000-0000-4000-8000-000000000001"
      }'::jsonb,
      'listing-draft-0001'
    ) ->> 'idempotent'
  )::boolean,
  true,
  'draft retry is idempotent'
);
select is(
  (
    select count(*)::integer
    from public.list_my_marketplace_listing_drafts_v1(50)
  ),
  1,
  'seller workspace lists only the authenticated owner draft'
);
select ok(
  (
    select
      draft.payload ->> 'title' = 'Interface audio révisée'
      and (draft.payload ->> 'unit_amount_minor')::bigint = 24500
      and (draft.payload ->> 'shipping_amount_minor')::bigint = 900
      and draft.payload -> 'terms' = '{"purchase_year":2025,"negotiable":true,"condition_notes":"Révisée et testée."}'::jsonb
      and draft.payload -> 'media_file_ids' = '["84000000-0000-4000-8000-000000000002"]'::jsonb
      and jsonb_array_length(draft.media) = 1
      and draft.media -> 0 ->> 'role' = 'cover'
      and draft.media -> 0 ->> 'mime_type' = 'image/webp'
      and draft.media -> 0 ->> 'file_url' = 'https://assets.example.test/buyer-draft.webp'
    from public.list_my_marketplace_listing_drafts_v1(50) draft
    where draft.listing_id = (select draft_id from marketplace_test_context)
  ),
  'owner draft round-trip preserves canonical prices, terms and reusable media metadata'
);
select ok(
  (
    select
      result ->> 'listing_id' = (select draft_id::text from marketplace_test_context)
      and result ->> 'status' = 'draft'
      and (result ->> 'version')::bigint = 2
    from (
      select public.update_marketplace_listing_draft_v1(
        (select draft_id from marketplace_test_context),
        1,
        '{
          "pillar":"used","category_code":"interfaces",
          "title":"Interface audio reprise",
          "short_description":"Une interface compacte prête à reprendre.",
          "description":"Description mise à jour sans perdre les données métier du brouillon.",
          "brand":"Meewav","model":"Studio Two","condition_code":"excellent",
          "currency_code":"EUR","unit_amount_minor":25900,"price_unit":"item",
          "city":"Paris","area":"11e","pickup":true,"shipping":true,"remote":false,
          "shipping_amount_minor":1200,"preparation_days":3,
          "media_file_ids":["84000000-0000-4000-8000-000000000002"],
          "terms":{"purchase_year":2025,"negotiable":false,"condition_notes":"Révisée une seconde fois."}
        }'::jsonb,
        'listing-draft-update-0001'
      ) result
    ) mutation
  ),
  'owner atomically updates the same draft with optimistic versioning'
);
select is(
  (
    public.update_marketplace_listing_draft_v1(
      (select draft_id from marketplace_test_context),
      1,
      '{
        "pillar":"used","category_code":"interfaces",
        "title":"Interface audio reprise",
        "short_description":"Une interface compacte prête à reprendre.",
        "description":"Description mise à jour sans perdre les données métier du brouillon.",
        "brand":"Meewav","model":"Studio Two","condition_code":"excellent",
        "currency_code":"EUR","unit_amount_minor":25900,"price_unit":"item",
        "city":"Paris","area":"11e","pickup":true,"shipping":true,"remote":false,
        "shipping_amount_minor":1200,"preparation_days":3,
        "media_file_ids":["84000000-0000-4000-8000-000000000002"],
        "terms":{"purchase_year":2025,"negotiable":false,"condition_notes":"Révisée une seconde fois."}
      }'::jsonb,
      'listing-draft-update-0001'
    ) ->> 'idempotent'
  )::boolean,
  true,
  'draft update retry returns the original success despite the old expected version'
);
select throws_ok(
  $$select public.update_marketplace_listing_draft_v1(
    (select draft_id from marketplace_test_context),
    1,
    '{"pillar":"used","title":"Contenu divergent"}'::jsonb,
    'listing-draft-update-0001'
  )$$,
  '23505', 'idempotency_conflict',
  'draft update key cannot be reused for divergent content'
);
select ok(
  (
    select
      draft.version = 2
      and draft.payload ->> 'title' = 'Interface audio reprise'
      and (draft.payload ->> 'unit_amount_minor')::bigint = 25900
      and (draft.payload ->> 'shipping_amount_minor')::bigint = 1200
      and (draft.payload ->> 'preparation_days')::integer = 3
      and draft.payload -> 'terms' = '{"purchase_year":2025,"negotiable":false,"condition_notes":"Révisée une seconde fois."}'::jsonb
      and draft.payload -> 'media_file_ids' = '["84000000-0000-4000-8000-000000000002"]'::jsonb
    from public.list_my_marketplace_listing_drafts_v1(50) draft
    where draft.listing_id = (select draft_id from marketplace_test_context)
  ),
  'updated draft can be reopened without losing prices, terms or cover identity'
);
select throws_ok(
  $$select public.update_marketplace_listing_draft_v1(
    (select draft_id from marketplace_test_context),
    1,
    '{
      "pillar":"used","category_code":"interfaces","title":"Version périmée",
      "short_description":"Cette écriture concurrente doit être refusée.",
      "description":"Le serveur protège le brouillon le plus récent contre une ancienne fenêtre.",
      "currency_code":"EUR","unit_amount_minor":25900,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000002"],
      "terms":{"purchase_year":2025,"negotiable":false}
    }'::jsonb,
    'listing-draft-update-stale-0001'
  )$$,
  '40001', 'marketplace_draft_version_conflict',
  'stale browser cannot overwrite a newer owner draft'
);
select throws_ok(
  $$select public.update_marketplace_listing_draft_v1(
    (select draft_id from marketplace_test_context),
    2,
    '{
      "pillar":"used","category_code":"interfaces","title":"Média trop lourd",
      "short_description":"Cette mise à jour doit rester sans effet.",
      "description":"La reprise applique les mêmes invariants média que la création initiale.",
      "currency_code":"EUR","unit_amount_minor":25900,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000006"],
      "terms":{"purchase_year":2025,"negotiable":false}
    }'::jsonb,
    'listing-draft-update-media-0001'
  )$$,
  '22023', 'marketplace_media_too_large',
  'draft resume keeps the canonical 12 MiB media invariant'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '83000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is(
  (select count(*)::integer from public.list_my_marketplace_listing_drafts_v1(50)),
  0,
  'another seller cannot see owner drafts'
);
select throws_ok(
  $$select public.update_marketplace_listing_draft_v1(
    (select draft_id from marketplace_test_context),
    2,
    '{"pillar":"used"}'::jsonb,
    'listing-draft-update-foreign-0001'
  )$$,
  'P0002', 'marketplace_draft_not_found',
  'another seller cannot update an owner draft'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Titre divergent",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,"media_file_ids":[],
      "terms":{"negotiable":true}
    }'::jsonb,
    'listing-draft-0001'
  )$$,
  '23505', 'idempotency_conflict',
  'draft key cannot be replayed with divergent content'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Média interdit",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000001"],
      "terms":{"negotiable":true}
    }'::jsonb,
    'listing-media-0001'
  )$$,
  '42501', 'marketplace_media_not_owned_or_unavailable',
  'composer cannot attach another profile media file'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Média dupliqué",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":[
        "84000000-0000-4000-8000-000000000002",
        "84000000-0000-4000-8000-000000000002"
      ],
      "terms":{"negotiable":true}
    }'::jsonb,
    'listing-media-duplicate-0001'
  )$$,
  '22023', 'marketplace_duplicate_media',
  'composer rejects duplicate media references before insertion'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Couverture vidéo",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":[
        "84000000-0000-4000-8000-000000000003",
        "84000000-0000-4000-8000-000000000002"
      ],
      "terms":{"negotiable":true}
    }'::jsonb,
    'listing-media-video-cover-0001'
  )$$,
  '22023', 'marketplace_cover_must_be_image',
  'composer requires the first media reference to be an image cover'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Média hors Market",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000004"],
      "terms":{"negotiable":true}
    }'::jsonb,
    'listing-media-source-0001'
  )$$,
  '42501', 'marketplace_media_not_owned_or_unavailable',
  'composer rejects owner media that was not uploaded for the marketplace'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Média archivé",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000005"],
      "terms":{"negotiable":true}
    }'::jsonb,
    'listing-media-status-0001'
  )$$,
  '42501', 'marketplace_media_not_owned_or_unavailable',
  'composer rejects an archived marketplace media reference'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Média trop lourd",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000006"],
      "terms":{"negotiable":true}
    }'::jsonb,
    'listing-media-size-0001'
  )$$,
  '22023', 'marketplace_media_too_large',
  'composer rejects Marketplace media larger than 12 MiB'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Taille inconnue",
      "short_description":"Une interface compacte en parfait état.",
      "description":"Description détaillée et honnête de cette interface.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000007"],
      "terms":{"negotiable":true}
    }'::jsonb,
    'listing-media-size-0002'
  )$$,
  '22023', 'marketplace_media_size_required',
  'composer requires authoritative media size metadata'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"used","category_code":"interfaces","title":"Négociation absente",
      "short_description":"Une interface proposée avec une modalité incomplète.",
      "description":"Description détaillée de cette interface avec un booléen volontairement omis.",
      "currency_code":"EUR","unit_amount_minor":24500,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000002"],
      "terms":{"condition_notes":"Très bon état"}
    }'::jsonb,
    'listing-bool-used-0001'
  )$$,
  '22023', 'invalid_marketplace_payload',
  'used drafts require an explicit negotiable boolean'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"rental","category_code":"mixers","title":"Réservation incomplète",
      "short_description":"Une console proposée avec une modalité incomplète.",
      "description":"Description détaillée de cette console avec un booléen volontairement omis.",
      "currency_code":"EUR","unit_amount_minor":12000,"price_unit":"day",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000002"],
      "terms":{"daily_amount_minor":12000,"deposit_amount_minor":50000,"minimum_days":1,"available_from":"2026-07-20"}
    }'::jsonb,
    'listing-bool-rental-0001'
  )$$,
  '22023', 'invalid_marketplace_payload',
  'rental drafts require an explicit instant-book boolean'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"rental","category_code":"mixers","title":"Date de location impossible",
      "short_description":"Une console proposée avec une date invalide.",
      "description":"Description détaillée de cette console avec une date civile volontairement impossible.",
      "currency_code":"EUR","unit_amount_minor":12000,"price_unit":"day",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000002"],
      "terms":{"daily_amount_minor":12000,"deposit_amount_minor":50000,"minimum_days":1,"available_from":"2026-02-30","instant_book":false}
    }'::jsonb,
    'listing-date-rental-0001'
  )$$,
  '22023', 'invalid_marketplace_payload',
  'rental draft rejects an impossible calendar date with the stable contract error'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"services","category_code":"coaching","title":"Événement à date impossible",
      "short_description":"Une session proposée avec une date invalide.",
      "description":"Description détaillée de cette session avec une date civile volontairement impossible.",
      "currency_code":"EUR","unit_amount_minor":6500,"price_unit":"session",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000002"],
      "terms":{"service_kind":"coaching","service_format":"Sur place","duration_label":"60 min","next_availability":"Cette semaine","event_date":"2026-02-30T10:00:00Z","capacity":1}
    }'::jsonb,
    'listing-date-service-0001'
  )$$,
  '22023', 'invalid_marketplace_payload',
  'service draft rejects an impossible event timestamp with the stable contract error'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"services","category_code":"coaching","title":"Événement au fuseau impossible",
      "short_description":"Une session proposée avec un fuseau invalide.",
      "description":"Description détaillée de cette session avec un décalage de fuseau volontairement impossible.",
      "currency_code":"EUR","unit_amount_minor":6500,"price_unit":"session",
      "pickup":true,"shipping":false,"remote":false,
      "media_file_ids":["84000000-0000-4000-8000-000000000002"],
      "terms":{"service_kind":"coaching","service_format":"Sur place","duration_label":"60 min","next_availability":"Cette semaine","event_date":"2026-07-20T10:00:00+99:99","capacity":1}
    }'::jsonb,
    'listing-timezone-service-0001'
  )$$,
  '22023', 'invalid_marketplace_payload',
  'service draft rejects an impossible timezone offset with the stable contract error'
);
select throws_ok(
  $$select public.create_marketplace_listing_draft_v1(
    '{
      "pillar":"rental","category_code":"mixers","title":"Mauvaise unité",
      "short_description":"Une console proposée en location.",
      "description":"Description détaillée de cette console en location.",
      "currency_code":"EUR","unit_amount_minor":12000,"price_unit":"item",
      "pickup":true,"shipping":false,"remote":false,"media_file_ids":[],
      "terms":{"daily_amount_minor":12000,"deposit_amount_minor":50000,"minimum_days":1,"available_from":"2026-07-20","instant_book":false}
    }'::jsonb,
    'listing-unit-0001'
  )$$,
  '22023', 'invalid_marketplace_price_unit',
  'pillar and price unit cannot diverge'
);

reset role;
select is(
  (
    select listing.status
    from public.marketplace_listings listing
    where listing.id = (select draft_id from marketplace_test_context)
  ),
  'draft',
  'client cannot self-publish a listing through extra payload keys'
);
select is(
  (
    select listing.seller_profile_id
    from public.marketplace_listings listing
    where listing.id = (select draft_id from marketplace_test_context)
  ),
  '82000000-0000-4000-8000-000000000002'::uuid,
  'draft seller identity always comes from auth.uid'
);
select ok(
  (
    select not (listing.terms ? 'ignored_client_authority')
      and listing.preparation_days = 3
      and listing.terms = '{"purchase_year":2025,"negotiable":false,"condition_notes":"Révisée une seconde fois."}'::jsonb
    from public.marketplace_listings listing
    where listing.id = (select draft_id from marketplace_test_context)
  ),
  'only normalized pillar terms are persisted'
);
select is(
  (
    select listing.condition_label
    from public.marketplace_listings listing
    where listing.id = (select draft_id from marketplace_test_context)
  ),
  'Excellent',
  'condition code is exposed through the canonical French public label'
);
select is(
  (
    select count(*)::integer
    from public.marketplace_listing_media listing_media
    where listing_media.listing_id = (select draft_id from marketplace_test_context)
      and listing_media.media_file_id = '84000000-0000-4000-8000-000000000002'
      and listing_media.media_role = 'cover'
  ),
  1,
  'owned composer media is attached as the cover'
);
select throws_ok(
  $$insert into public.marketplace_listing_media (
    listing_id, media_file_id, media_role, position, alt_text
  ) values (
    '85000000-0000-4000-8000-000000000002',
    '84000000-0000-4000-8000-000000000002',
    'gallery', 0, 'Média d’un autre propriétaire'
  )$$,
  '42501', 'marketplace_media_not_owned_or_unavailable',
  'database invariant rejects media owned by another profile'
);
select throws_ok(
  $$insert into public.marketplace_listing_media (
    listing_id, media_file_id, media_role, position, alt_text
  ) values (
    (select draft_id from marketplace_test_context),
    '84000000-0000-4000-8000-000000000004',
    'gallery', 1, 'Média hors Marketplace'
  )$$,
  '42501', 'marketplace_media_not_owned_or_unavailable',
  'database invariant rejects media from another source pillar'
);
select throws_ok(
  $$insert into public.marketplace_listing_media (
    listing_id, media_file_id, media_role, position, alt_text
  ) values (
    (select draft_id from marketplace_test_context),
    '84000000-0000-4000-8000-000000000003',
    'cover', 1, 'Vidéo utilisée comme couverture'
  )$$,
  '22023', 'marketplace_cover_must_be_image',
  'database invariant requires an image cover even for privileged writes'
);
select throws_ok(
  $$insert into public.marketplace_listing_media (
    listing_id, media_file_id, media_role, position, alt_text
  ) values (
    (select draft_id from marketplace_test_context),
    '84000000-0000-4000-8000-000000000006',
    'gallery', 1, 'Média dépassant 12 MiB'
  )$$,
  '22023', 'marketplace_media_too_large',
  'database invariant rejects oversized media on privileged writes'
);

-- ---------------------------------------------------------------------------
-- Dedicated rental, service and collective intents with server price snapshot.
-- ---------------------------------------------------------------------------

reset role;
insert into public.marketplace_listings (
  id, seller_profile_id, slug, pillar, category_code, title,
  short_description, description, status, city_label, pickup_enabled,
  shipping_enabled, remote_enabled, preparation_days, max_quantity, terms,
  published_at
)
values (
  '85000000-0000-4000-8000-000000000008',
  '81000000-0000-4000-8000-000000000001',
  'ticket-capacite-test', 'services', 'ticketing', 'Live capacité limitée',
  'Une place pour un live Meewav.',
  'Une place nominative pour tester la capacité serveur du live.',
  'published', 'Paris', false, false, true, 1, 1,
  jsonb_build_object(
    'service_kind', 'ticket', 'service_format', 'Sur place',
    'duration_label', '3 heures', 'delivery_label', 'Accès nominatif',
    'next_availability', 'La semaine prochaine',
    'event_date', (now() + interval '7 days')::timestamptz,
    'capacity', 1, 'venue_name', 'Room Meewav',
    'included_equipment', 'Scène et système de diffusion'
  ),
  now() - interval '30 minutes'
);
insert into public.marketplace_listing_prices (
  listing_id, price_kind, currency_code, amount_minor, price_unit
)
values (
  '85000000-0000-4000-8000-000000000008',
  'primary', 'EUR', 2500, 'ticket'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$select public.create_marketplace_rental_request_v1(
    '85000000-0000-4000-8000-000000000003',
    current_date - 4, current_date - 2, 'Dates entièrement passées',
    'rental-past-0001'
  )$$,
  '22023', 'invalid_marketplace_rental_dates',
  'rental requests cannot target dates entirely in the past'
);
update marketplace_test_context
set rental_intent_id = (
  public.create_marketplace_rental_request_v1(
    '85000000-0000-4000-8000-000000000003',
    current_date + 2, current_date + 5, 'Session de trois jours',
    'rental-request-0001'
  ) ->> 'intent_id'
)::uuid;
select ok(
  (select rental_intent_id is not null from marketplace_test_context),
  'buyer creates a rental request with valid dates'
);
select is(
  (
    public.create_marketplace_rental_request_v1(
      '85000000-0000-4000-8000-000000000003',
      current_date + 2, current_date + 5, 'Session de trois jours',
      'rental-request-0001'
    ) ->> 'idempotent'
  )::boolean,
  true,
  'rental request retry is idempotent'
);
update marketplace_test_context
set service_intent_id = (
  public.create_marketplace_service_booking_v1(
    '85000000-0000-4000-8000-000000000004',
    null, 'Coaching pour mon prochain live',
    'service-booking-0001'
  ) ->> 'intent_id'
)::uuid;
select ok(
  (select service_intent_id is not null from marketplace_test_context),
  'buyer creates a service booking request'
);
reset role;
update public.marketplace_listings
set published_at = now() - interval '31 days'
where id = '85000000-0000-4000-8000-000000000005';
set local role authenticated;
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$select public.join_marketplace_collective_v1(
    '85000000-0000-4000-8000-000000000005', null,
    'collective-null-quantity-0001'
  )$$,
  '22023', 'invalid_marketplace_request',
  'collective join rejects a missing quantity with a stable contract error'
);
select throws_ok(
  $$select public.join_marketplace_collective_v1(
    '85000000-0000-4000-8000-000000000005', 1,
    'collective-expired-0001'
  )$$,
  '22023', 'marketplace_collective_closed',
  'an expired collective campaign cannot accept new participants'
);
reset role;
update public.marketplace_listings
set published_at = now() - interval '30 minutes'
where id = '85000000-0000-4000-8000-000000000005';
set local role authenticated;
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
update marketplace_test_context
set collective_intent_id = (
  public.join_marketplace_collective_v1(
    '85000000-0000-4000-8000-000000000005', 2,
    'collective-join-0001'
  ) ->> 'intent_id'
)::uuid;
select ok(
  (select collective_intent_id is not null from marketplace_test_context),
  'buyer joins an open collective allocation'
);
select is(
  jsonb_array_length(
    public.get_my_marketplace_state_v1() -> 'joined_collective_listing_ids'
  ),
  1,
  'viewer state exposes the joined collective listing once'
);
select throws_ok(
  $$select public.create_marketplace_rental_request_v1(
    '85000000-0000-4000-8000-000000000004',
    current_date + 1, current_date + 3, null, 'wrong-pillar-0001'
  )$$,
  '22023', 'invalid_marketplace_rental_request',
  'dedicated intent RPC rejects the wrong listing pillar'
);

update marketplace_test_context
set ticket_intent_id = (
  public.create_marketplace_service_booking_v1(
    '85000000-0000-4000-8000-000000000008',
    null, 'Une place pour le live', 'ticket-booking-0001'
  ) ->> 'intent_id'
)::uuid;
select ok(
  (
    select requested_for is not null
    from public.list_my_marketplace_intents_v1('buyer', 'pending', 50)
    where intent_id = (select ticket_intent_id from marketplace_test_context)
  ),
  'fixed-date ticket intent stores the canonical event slot even when omitted by the client'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '83000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$select public.create_marketplace_service_booking_v1(
    '85000000-0000-4000-8000-000000000008',
    null, null, 'ticket-capacity-0002'
  )$$,
  '22023', 'marketplace_service_capacity_full',
  'active ticket intents cannot exceed the server-owned capacity'
);
update marketplace_test_context
set second_rental_intent_id = (
  public.create_marketplace_rental_request_v1(
    '85000000-0000-4000-8000-000000000003',
    current_date + 3, current_date + 6, 'Demande concurrente',
    'rental-request-0002'
  ) ->> 'intent_id'
)::uuid;
select ok(
  (select second_rental_intent_id is not null from marketplace_test_context),
  'another buyer may submit a competing rental request for seller review'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is(
  (
    select count(*)::integer
    from public.list_my_marketplace_intents_v1('seller', 'pending', 50)
  ),
  5,
  'seller workspace lists every pending request for owned listings'
);
select is(
  public.update_marketplace_intent_status_v1(
    (select rental_intent_id from marketplace_test_context),
    'accepted', 'rental-owner-status-0001'
  ) ->> 'status',
  'accepted',
  'seller can accept the first rental request for a time slot'
);
select throws_ok(
  $$select public.update_marketplace_intent_status_v1(
    (select second_rental_intent_id from marketplace_test_context),
    'accepted', 'rental-owner-status-0002'
  )$$,
  '22023', 'marketplace_rental_slot_unavailable',
  'overlapping rental requests cannot both be accepted'
);
select is(
  public.update_marketplace_intent_status_v1(
    (select service_intent_id from marketplace_test_context),
    'accepted', 'intent-owner-status-0001'
  ) ->> 'status',
  'accepted',
  'seller can accept a pending intent through the dedicated transition RPC'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '82000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select ok(
  public.cancel_marketplace_intent_v1(
    (select service_intent_id from marketplace_test_context),
    'intent-buyer-cancel-0001'
  ) ->> 'status' = 'cancelled'
  and exists (
    select 1
    from public.list_my_marketplace_intents_v1('buyer', 'cancelled', 50)
    where intent_id = (select service_intent_id from marketplace_test_context)
  ),
  'buyer can cancel an accepted request and immediately observe its final status'
);

reset role;
select is(
  (
    select (intent.pricing_snapshot -> 'primary' ->> 'amount_minor')::bigint
    from public.marketplace_intents intent
    where intent.id = (select rental_intent_id from marketplace_test_context)
  ),
  12000::bigint,
  'rental intent snapshots the canonical server price'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$select public.create_marketplace_rental_request_v1(
    '85000000-0000-4000-8000-000000000003',
    current_date + 2, current_date + 5, null, 'own-rental-0001'
  )$$,
  '22023', 'cannot_request_own_listing',
  'seller cannot create an intent against their own listing'
);

reset role;
update public.profiles
set is_ghost_mode = true
where id = '83000000-0000-4000-8000-000000000003';
set local role anon;
select is(
  (
    select count(*)::integer
    from public.list_marketplace_catalog_v1(null, null, 48, null, null, null)
  ),
  5,
  'ghost seller and all of their listings disappear from public catalogue'
);

select * from finish();
rollback;

