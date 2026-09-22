-- Room gifts: private entrant snapshots, public draw projection and durable awards.
-- The winner is selected atomically when a draw starts, but their identity is
-- copied to the public row only after reveal_at.

create table if not exists public.room_gift_draws_v1 (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms_v2(id) on delete cascade,
  gift_code text not null check (char_length(gift_code) between 1 and 80),
  gift_label text not null check (char_length(gift_label) between 1 and 120),
  pool_mode text not null check (pool_mode in ('manual', 'queue', 'room', 'selected')),
  status text not null default 'ready'
    check (status in ('ready', 'scheduled', 'spinning', 'revealed', 'cancelled')),
  -- Product cap: oversized queue/Room/manual pools are uniformly sampled on
  -- the server instead of making the draw fail.
  eligible_count integer not null default 0 check (eligible_count between 0 and 5000),
  animation_duration_seconds integer not null default 7
    check (animation_duration_seconds between 3 and 20),
  scheduled_at timestamptz,
  started_at timestamptz,
  reveal_at timestamptz,
  winner_profile_id uuid references auth.users(id) on delete set null,
  winner_display_name text,
  winner_avatar_url text,
  winner_source text check (winner_source is null or winner_source in ('stage', 'backstage', 'queue', 'manual', 'room')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  revealed_at timestamptz,
  check (
    winner_display_name is null
    or (
      char_length(winner_display_name) between 1 and 120
      and octet_length(winner_display_name) <= 480
    )
  ),
  check (
    winner_avatar_url is null
    or (
      octet_length(winner_avatar_url) <= 2048
      and winner_avatar_url ~ '^https://[^[:space:]]+$'
    )
  ),
  check (reveal_at is null or started_at is not null),
  check (status <> 'revealed' or (winner_display_name is not null and revealed_at is not null))
);

create table if not exists public.room_gift_draw_entries_v1 (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.room_gift_draws_v1(id) on delete cascade,
  profile_id uuid references auth.users(id) on delete set null,
  candidate_key text not null check (
    char_length(candidate_key) between 1 and 180
    and octet_length(candidate_key) <= 512
  ),
  display_name_snapshot text not null check (
    char_length(display_name_snapshot) between 1 and 120
    and octet_length(display_name_snapshot) <= 480
  ),
  avatar_url_snapshot text,
  source text not null check (source in ('stage', 'backstage', 'queue', 'manual', 'room')),
  created_at timestamptz not null default now(),
  unique (draw_id, candidate_key),
  check (
    avatar_url_snapshot is null
    or (
      octet_length(avatar_url_snapshot) <= 2048
      and avatar_url_snapshot ~ '^https://[^[:space:]]+$'
    )
  )
);

create unique index if not exists room_gift_draw_entries_v1_profile_unique
  on public.room_gift_draw_entries_v1(draw_id, profile_id)
  where profile_id is not null;

-- The chosen entry and idempotency token are never placed on the public draw
-- row. This table has no browser grants or RLS policy, including for the Host.
create table if not exists public.room_gift_draw_private_v1 (
  draw_id uuid primary key references public.room_gift_draws_v1(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  selected_entry_id uuid references public.room_gift_draw_entries_v1(id) on delete set null,
  idempotency_key text,
  request_hash text not null,
  created_at timestamptz not null default now(),
  check (
    idempotency_key is null
    or (
      char_length(idempotency_key) between 8 and 128
      and octet_length(idempotency_key) <= 128
    )
  ),
  check (request_hash ~ '^[0-9a-f]{64}$')
);

create table if not exists public.room_gift_awards_v1 (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid unique references public.room_gift_draws_v1(id) on delete set null,
  draw_id_snapshot uuid not null unique,
  room_id uuid references public.rooms_v2(id) on delete set null,
  room_id_snapshot uuid not null,
  gift_code text not null check (char_length(gift_code) between 1 and 80 and octet_length(gift_code) <= 80),
  gift_label text not null check (char_length(gift_label) between 1 and 120 and octet_length(gift_label) <= 480),
  recipient_profile_id uuid references auth.users(id) on delete set null,
  recipient_display_name_snapshot text not null check (
    char_length(recipient_display_name_snapshot) between 1 and 120
    and octet_length(recipient_display_name_snapshot) <= 480
  ),
  recipient_avatar_url_snapshot text,
  awarded_by uuid references auth.users(id) on delete set null,
  awarded_by_snapshot uuid not null,
  created_at timestamptz not null default now(),
  check (
    recipient_avatar_url_snapshot is null
    or (
      octet_length(recipient_avatar_url_snapshot) <= 2048
      and recipient_avatar_url_snapshot ~ '^https://[^[:space:]]+$'
    )
  )
);

-- Durable direct gifts. Public rows contain only delivery/audit data visible
-- to the sender and recipient; request hashes and idempotency keys stay in the
-- private companion table below.
create table if not exists public.room_gift_deliveries_v1 (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms_v2(id) on delete set null,
  room_id_snapshot uuid not null,
  room_title_snapshot text not null check (
    char_length(room_title_snapshot) between 1 and 160
    and octet_length(room_title_snapshot) <= 640
  ),
  gift_code text not null check (char_length(gift_code) between 1 and 80 and octet_length(gift_code) <= 80),
  gift_label text not null check (char_length(gift_label) between 1 and 120 and octet_length(gift_label) <= 480),
  action text not null check (action in ('send_now', 'schedule', 'round')),
  status text not null check (status in ('sent', 'scheduled', 'ready')),
  round_label text,
  sender_profile_id uuid references auth.users(id) on delete set null,
  sender_profile_id_snapshot uuid not null,
  sender_display_name_snapshot text not null check (
    char_length(sender_display_name_snapshot) between 1 and 120
    and octet_length(sender_display_name_snapshot) <= 480
  ),
  sender_avatar_url_snapshot text,
  recipient_profile_id uuid references auth.users(id) on delete set null,
  recipient_profile_id_snapshot uuid not null,
  recipient_display_name_snapshot text not null check (
    char_length(recipient_display_name_snapshot) between 1 and 120
    and octet_length(recipient_display_name_snapshot) <= 480
  ),
  recipient_avatar_url_snapshot text,
  recipient_source text not null
    check (recipient_source in ('stage', 'backstage', 'queue', 'messaging')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    sender_avatar_url_snapshot is null
    or (
      octet_length(sender_avatar_url_snapshot) <= 2048
      and sender_avatar_url_snapshot ~ '^https://[^[:space:]]+$'
    )
  ),
  check (
    recipient_avatar_url_snapshot is null
    or (
      octet_length(recipient_avatar_url_snapshot) <= 2048
      and recipient_avatar_url_snapshot ~ '^https://[^[:space:]]+$'
    )
  ),
  check (
    round_label is null
    or (
      char_length(round_label) between 1 and 80
      and octet_length(round_label) <= 320
      and round_label !~ '[[:cntrl:]]'
    )
  ),
  check (scheduled_at is null or scheduled_at <= created_at + interval '30 days'),
  check (room_id is null or room_id = room_id_snapshot),
  check (sender_profile_id is null or sender_profile_id = sender_profile_id_snapshot),
  check (recipient_profile_id is null or recipient_profile_id = recipient_profile_id_snapshot),
  check (recipient_profile_id_snapshot <> sender_profile_id_snapshot),
  check (sent_at is null or sent_at >= created_at),
  check (status <> 'scheduled' or scheduled_at > created_at),
  check (
    (action = 'send_now' and status = 'sent' and scheduled_at is null and sent_at is not null and round_label is null)
    or (
      action = 'schedule'
      and scheduled_at is not null
      and round_label is null
      and (
        (status = 'scheduled' and sent_at is null)
        or (status = 'sent' and sent_at is not null)
      )
    )
    or (action = 'round' and status = 'ready' and scheduled_at is null and sent_at is null and round_label is not null)
  )
);

create table if not exists public.room_gift_delivery_private_v1 (
  delivery_id uuid primary key references public.room_gift_deliveries_v1(id) on delete cascade,
  sender_profile_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null check (
    char_length(idempotency_key) between 8 and 128
    and octet_length(idempotency_key) <= 128
  ),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (sender_profile_id, idempotency_key)
);

-- Machine-readable deployment state. When pg_cron is absent or too old for
-- interval schedules, the migration records an explicit degraded state so an
-- external service scheduler can be configured rather than silently claiming
-- second-level durability.
create table if not exists public.room_gift_draw_scheduler_health_v1 (
  singleton boolean primary key default true check (singleton),
  scheduler_status text not null
    check (scheduler_status in ('pending', 'pg_cron_5_seconds', 'degraded_external_scheduler_required')),
  scheduler_detail text not null check (octet_length(scheduler_detail) <= 1000),
  checked_at timestamptz not null default now()
);

create unique index if not exists room_gift_draws_v1_active_room_unique
  on public.room_gift_draws_v1(room_id)
  where status in ('ready', 'scheduled', 'spinning');

create unique index if not exists room_gift_draw_private_v1_idempotency_unique
  on public.room_gift_draw_private_v1(host_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists room_gift_draws_v1_room_created_idx
  on public.room_gift_draws_v1(room_id, created_at desc);
create index if not exists room_gift_draws_v1_due_scheduled_idx
  on public.room_gift_draws_v1(scheduled_at)
  where status = 'scheduled';
create index if not exists room_gift_draws_v1_due_reveal_idx
  on public.room_gift_draws_v1(reveal_at)
  where status = 'spinning';
create index if not exists room_gift_draws_v1_terminal_cleanup_idx
  on public.room_gift_draws_v1(status, updated_at)
  where status in ('revealed', 'cancelled');
create index if not exists room_gift_draw_private_v1_host_created_idx
  on public.room_gift_draw_private_v1(host_id, created_at desc);
create index if not exists room_gift_awards_v1_recipient_created_idx
  on public.room_gift_awards_v1(recipient_profile_id, created_at desc);
create index if not exists room_gift_awards_v1_awarded_by_created_idx
  on public.room_gift_awards_v1(awarded_by, created_at desc);
create index if not exists room_gift_deliveries_v1_sender_created_idx
  on public.room_gift_deliveries_v1(sender_profile_id, created_at desc);
create index if not exists room_gift_deliveries_v1_recipient_created_idx
  on public.room_gift_deliveries_v1(recipient_profile_id, created_at desc);
create index if not exists room_gift_deliveries_v1_room_created_idx
  on public.room_gift_deliveries_v1(room_id_snapshot, created_at desc);
create index if not exists room_gift_deliveries_v1_due_idx
  on public.room_gift_deliveries_v1(scheduled_at)
  where status = 'scheduled';
create index if not exists room_gift_delivery_private_v1_sender_created_idx
  on public.room_gift_delivery_private_v1(sender_profile_id, created_at desc);

alter table public.room_gift_draws_v1 enable row level security;
alter table public.room_gift_draw_entries_v1 enable row level security;
alter table public.room_gift_draw_private_v1 enable row level security;
alter table public.room_gift_awards_v1 enable row level security;
alter table public.room_gift_deliveries_v1 enable row level security;
alter table public.room_gift_delivery_private_v1 enable row level security;
alter table public.room_gift_draw_scheduler_health_v1 enable row level security;

drop policy if exists room_gift_draws_v1_public_read on public.room_gift_draws_v1;
create policy room_gift_draws_v1_public_read
on public.room_gift_draws_v1 for select
using (
  exists (
    select 1 from public.rooms_v2 room
    where room.id = room_gift_draws_v1.room_id
      and room.status = 'live'
  )
  and (
    room_gift_draws_v1.status in ('ready', 'scheduled', 'spinning')
    or (
      room_gift_draws_v1.status = 'revealed'
      and room_gift_draws_v1.revealed_at is not null
      and room_gift_draws_v1.revealed_at <= now()
      and room_gift_draws_v1.revealed_at > now() - interval '2 minutes'
    )
  )
);

drop policy if exists room_gift_awards_v1_owner_read on public.room_gift_awards_v1;
create policy room_gift_awards_v1_owner_read
on public.room_gift_awards_v1 for select to authenticated
using (awarded_by = auth.uid() or recipient_profile_id = auth.uid());

drop policy if exists room_gift_deliveries_v1_participant_read on public.room_gift_deliveries_v1;
create policy room_gift_deliveries_v1_participant_read
on public.room_gift_deliveries_v1 for select to authenticated
using (
  sender_profile_id = auth.uid()
  or (recipient_profile_id = auth.uid() and status = 'sent')
);

revoke all on table public.room_gift_draws_v1 from public, anon, authenticated;
revoke all on table public.room_gift_draw_entries_v1 from public, anon, authenticated;
revoke all on table public.room_gift_draw_private_v1 from public, anon, authenticated;
revoke all on table public.room_gift_awards_v1 from public, anon, authenticated;
revoke all on table public.room_gift_deliveries_v1 from public, anon, authenticated;
revoke all on table public.room_gift_delivery_private_v1 from public, anon, authenticated;
revoke all on table public.room_gift_draw_scheduler_health_v1 from public, anon, authenticated;
grant select on table public.room_gift_draws_v1 to anon, authenticated;
grant select on table public.room_gift_awards_v1 to authenticated;
grant select on table public.room_gift_deliveries_v1 to authenticated;
grant all on table public.room_gift_draws_v1, public.room_gift_draw_entries_v1, public.room_gift_draw_private_v1, public.room_gift_awards_v1 to service_role;
grant all on table public.room_gift_deliveries_v1, public.room_gift_delivery_private_v1 to service_role;
grant select, insert, update on table public.room_gift_draw_scheduler_health_v1 to service_role;

create or replace function public.rooms_create_gift_draw_v1(
  p_room_id uuid,
  p_gift_code text,
  p_gift_label text,
  p_pool_mode text,
  p_candidates jsonb default '[]'::jsonb,
  p_scheduled_at timestamptz default null,
  p_animation_duration_seconds integer default 7,
  p_idempotency_key text default null
)
returns setof public.room_gift_draws_v1
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_host_id uuid := auth.uid();
  v_draw public.room_gift_draws_v1%rowtype;
  v_secret public.room_gift_draw_private_v1%rowtype;
  v_draw_id uuid;
  v_candidate_count integer;
  v_candidates jsonb := coalesce(p_candidates, '[]'::jsonb);
  v_pool_mode text := lower(btrim(coalesce(p_pool_mode, '')));
  v_gift_code text := btrim(coalesce(p_gift_code, ''));
  v_gift_label text;
  v_idempotency_key text := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_animation_duration integer := greatest(3, least(20, coalesce(p_animation_duration_seconds, 7)));
  v_effective_scheduled_at timestamptz;
  v_request_hash text;
begin
  if v_host_id is null then
    raise exception using errcode = '42501', message = 'rooms_gift_draw_authentication_required';
  end if;
  if p_room_id is null then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_room_required';
  end if;
  if v_pool_mode not in ('manual', 'queue', 'room', 'selected') then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_pool_mode_invalid';
  end if;
  v_gift_label := case v_gift_code
    when 'force-card' then 'Carte de Force'
    when 'vip-pass' then 'Pass VIP'
    when 'private-access' then 'Accès privé'
    when 'golden-like' then 'Golden Like'
    when 'supporter-bonus' then 'Bonus supporter'
    when 'la-certif' then 'La Certif'
    else null
  end;
  if v_gift_label is null then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_gift_not_allowed';
  end if;
  if p_gift_label is not null and octet_length(p_gift_label) > 480 then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_gift_label_too_large';
  end if;
  if btrim(coalesce(p_gift_label, '')) <> v_gift_label then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_gift_label_mismatch';
  end if;
  if p_scheduled_at is not null and p_scheduled_at > now() + interval '30 days' then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_schedule_beyond_30_days';
  end if;
  if p_idempotency_key is not null and (
    v_idempotency_key is null
    or char_length(v_idempotency_key) not between 8 and 128
    or octet_length(v_idempotency_key) > 128
  ) then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_idempotency_key_invalid';
  end if;
  if jsonb_typeof(v_candidates) <> 'array' then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_candidates_must_be_array';
  end if;

  -- Reject unauthorised callers before measuring, traversing or hashing a
  -- potentially large candidate payload.
  if not exists (
    select 1 from public.rooms_v2 room
    where room.id = p_room_id
      and room.host_id = v_host_id
      and room.status = 'live'
  ) then
    raise exception using errcode = '42501', message = 'rooms_gift_draw_live_host_required';
  end if;

  if octet_length(v_candidates::text) > 1048576 then
    raise exception using errcode = '54000', message = 'rooms_gift_draw_candidates_payload_exceeds_1_mib';
  end if;
  if jsonb_array_length(v_candidates) > 10000 then
    raise exception using errcode = '54000', message = 'rooms_gift_draw_candidate_input_cap_10000';
  end if;
  if v_pool_mode in ('queue', 'room') and jsonb_array_length(v_candidates) <> 0 then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_server_pool_rejects_client_candidates';
  end if;
  if v_pool_mode in ('manual', 'selected') and jsonb_array_length(v_candidates) = 0 then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_candidates_required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_candidates) candidate(value)
    where jsonb_typeof(candidate.value) <> 'object'
      or (
        candidate.value ? 'profile_id'
        and candidate.value -> 'profile_id' <> 'null'::jsonb
        and (
          jsonb_typeof(candidate.value -> 'profile_id') <> 'string'
          or coalesce(candidate.value ->> 'profile_id', '')
            !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        )
      )
      or (
        candidate.value ? 'display_name'
        and candidate.value -> 'display_name' <> 'null'::jsonb
        and (
          jsonb_typeof(candidate.value -> 'display_name') <> 'string'
          or char_length(btrim(coalesce(candidate.value ->> 'display_name', ''))) > 120
          or octet_length(btrim(coalesce(candidate.value ->> 'display_name', ''))) > 480
        )
      )
      or (
        candidate.value ? 'avatar_url'
        and candidate.value -> 'avatar_url' <> 'null'::jsonb
        and (
          jsonb_typeof(candidate.value -> 'avatar_url') <> 'string'
          or octet_length(btrim(coalesce(candidate.value ->> 'avatar_url', ''))) > 2048
          or btrim(coalesce(candidate.value ->> 'avatar_url', '')) !~ '^https://[^[:space:]]+$'
        )
      )
      or (
        candidate.value ? 'key'
        and candidate.value -> 'key' <> 'null'::jsonb
        and (
          jsonb_typeof(candidate.value -> 'key') <> 'string'
          or octet_length(btrim(coalesce(candidate.value ->> 'key', ''))) > 512
        )
      )
      or (
        candidate.value ? 'source'
        and candidate.value -> 'source' <> 'null'::jsonb
        and (
          jsonb_typeof(candidate.value -> 'source') <> 'string'
          or coalesce(candidate.value ->> 'source', '') not in ('stage', 'backstage', 'queue', 'manual', 'room')
        )
      )
      or (
        v_pool_mode = 'manual'
        and (
          nullif(candidate.value ->> 'profile_id', '') is not null
          or char_length(btrim(coalesce(candidate.value ->> 'display_name', ''))) not between 1 and 120
          or (
            candidate.value ? 'avatar_url'
            and candidate.value -> 'avatar_url' <> 'null'::jsonb
          )
        )
      )
      or (
        v_pool_mode = 'selected'
        and nullif(candidate.value ->> 'profile_id', '') is null
      )
  ) then
    raise exception using errcode = '22023', message = 'rooms_gift_draw_candidate_shape_invalid';
  end if;

  v_effective_scheduled_at := case
    when p_scheduled_at is not null and p_scheduled_at > now() then p_scheduled_at
    else null
  end;
  v_request_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'room_id', p_room_id,
    'gift_code', v_gift_code,
    'gift_label', v_gift_label,
    'pool_mode', v_pool_mode,
    'candidates', v_candidates,
    'scheduled_at_epoch', case when p_scheduled_at is null then null else extract(epoch from p_scheduled_at)::text end,
    'animation_duration_seconds', v_animation_duration
  )::text, 'UTF8'), 'sha256'), 'hex');

  -- Host and Room locks make the rate limits exact under concurrent requests.
  perform pg_advisory_xact_lock(hashtextextended(
    'rooms-gift-draw-host:' || v_host_id::text,
    0
  ));
  perform pg_advisory_xact_lock(hashtextextended(
    'rooms-gift-draw-room:' || p_room_id::text,
    0
  ));

  if v_idempotency_key is not null then
    perform pg_advisory_xact_lock(hashtextextended(
      'rooms-gift-draw-key:' || v_host_id::text || ':' || v_idempotency_key,
      0
    ));
    select * into v_secret
    from public.room_gift_draw_private_v1 secret
    where secret.host_id = v_host_id
      and secret.idempotency_key = v_idempotency_key;
    if v_secret.draw_id is not null then
      select * into v_draw
      from public.room_gift_draws_v1 draw
      where draw.id = v_secret.draw_id;
      if v_draw.id is null
         or v_draw.room_id is distinct from p_room_id
         or v_secret.request_hash <> v_request_hash then
        raise exception using errcode = '23505', message = 'rooms_gift_draw_idempotency_conflict';
      end if;
      return next v_draw;
      return;
    end if;
  end if;

  if (
    select count(*)
    from public.room_gift_draw_private_v1 secret
    where secret.host_id = v_host_id
      and secret.created_at >= now() - interval '1 hour'
  ) >= 30 then
    raise exception using errcode = '54000', message = 'rooms_gift_draw_host_hourly_rate_limit';
  end if;
  if (
    select count(*)
    from public.room_gift_draw_private_v1 secret
    where secret.host_id = v_host_id
      and secret.created_at >= now() - interval '24 hours'
  ) >= 200 then
    raise exception using errcode = '54000', message = 'rooms_gift_draw_host_daily_quota';
  end if;
  if (
    select count(*)
    from public.room_gift_draws_v1 draw
    where draw.room_id = p_room_id
      and draw.created_at >= now() - interval '1 hour'
  ) >= 12 then
    raise exception using errcode = '54000', message = 'rooms_gift_draw_room_hourly_rate_limit';
  end if;
  if (
    select count(*)
    from public.room_gift_draws_v1 draw
    where draw.room_id = p_room_id
      and draw.created_at >= now() - interval '24 hours'
  ) >= 50 then
    raise exception using errcode = '54000', message = 'rooms_gift_draw_room_daily_quota';
  end if;
  if v_effective_scheduled_at is not null and (
    select count(*)
    from public.room_gift_draw_private_v1 secret
    join public.room_gift_draws_v1 draw on draw.id = secret.draw_id
    where secret.host_id = v_host_id
      and draw.status = 'scheduled'
  ) >= 20 then
    raise exception using errcode = '54000', message = 'rooms_gift_draw_host_scheduled_quota';
  end if;

  if exists (
    select 1 from public.room_gift_draws_v1 draw
    where draw.room_id = p_room_id
      and draw.status in ('ready', 'scheduled', 'spinning')
  ) then
    raise exception using errcode = '55000', message = 'rooms_gift_draw_room_already_active';
  end if;

  insert into public.room_gift_draws_v1 (
    room_id, gift_code, gift_label, pool_mode, status,
    scheduled_at, animation_duration_seconds
  ) values (
    p_room_id,
    v_gift_code,
    v_gift_label,
    v_pool_mode,
    case when v_effective_scheduled_at is not null then 'scheduled' else 'ready' end,
    v_effective_scheduled_at,
    v_animation_duration
  ) returning id into v_draw_id;

  insert into public.room_gift_draw_private_v1 (draw_id, host_id, idempotency_key, request_hash)
  values (v_draw_id, v_host_id, v_idempotency_key, v_request_hash);

  if v_pool_mode = 'queue' then
    insert into public.room_gift_draw_entries_v1 (
      draw_id, profile_id, candidate_key, display_name_snapshot, avatar_url_snapshot, source
    )
    with eligible as materialized (
      select distinct queued.user_id
      from public.room_queue_v2 queued
      where queued.room_id = p_room_id
        and queued.removed_at is null
        and queued.user_id <> v_host_id
    ), sampled as materialized (
      select eligible.user_id
      from eligible
      order by gen_random_uuid()
      limit 5000
    )
    select
      v_draw_id,
      sampled.user_id,
      'profile:' || sampled.user_id::text,
      left(coalesce(nullif(trim(profile.display_name), ''), nullif(trim(profile.username), ''), 'Participant MeeWav'), 120),
      case
        when octet_length(coalesce(profile.profile_image_url, '')) <= 2048
          and profile.profile_image_url ~ '^https://[^[:space:]]+$' then profile.profile_image_url
        when octet_length(coalesce(profile.avatar_url, '')) <= 2048
          and profile.avatar_url ~ '^https://[^[:space:]]+$' then profile.avatar_url
        else null
      end,
      'queue'
    from sampled
    left join public.public_profiles profile on profile.id = sampled.user_id
    on conflict do nothing;
  elsif v_pool_mode = 'room' then
    insert into public.room_gift_draw_entries_v1 (
      draw_id, profile_id, candidate_key, display_name_snapshot, avatar_url_snapshot, source
    )
    with eligible as materialized (
      select distinct participant.user_id
      from public.room_participants_v2 participant
      where participant.room_id = p_room_id
        and participant.left_at is null
        and participant.user_id <> v_host_id
    ), sampled as materialized (
      select eligible.user_id
      from eligible
      order by gen_random_uuid()
      limit 5000
    )
    select
      v_draw_id,
      sampled.user_id,
      'profile:' || sampled.user_id::text,
      left(coalesce(nullif(trim(profile.display_name), ''), nullif(trim(profile.username), ''), 'Participant MeeWav'), 120),
      case
        when octet_length(coalesce(profile.profile_image_url, '')) <= 2048
          and profile.profile_image_url ~ '^https://[^[:space:]]+$' then profile.profile_image_url
        when octet_length(coalesce(profile.avatar_url, '')) <= 2048
          and profile.avatar_url ~ '^https://[^[:space:]]+$' then profile.avatar_url
        else null
      end,
      'room'
    from sampled
    left join public.public_profiles profile on profile.id = sampled.user_id
    on conflict do nothing;
  else
    with supplied as (
      select
        candidate.value,
        candidate.ordinality,
        case
          when nullif(candidate.value ->> 'profile_id', '') is not null
          then (candidate.value ->> 'profile_id')::uuid
          else null
        end as profile_id
      from jsonb_array_elements(v_candidates) with ordinality candidate(value, ordinality)
    ), eligible as (
      select supplied.*
      from supplied
      where (v_pool_mode = 'manual' and supplied.profile_id is null)
        or (
          v_pool_mode = 'selected'
          and supplied.profile_id is not null
          and supplied.profile_id <> v_host_id
          and (
            exists (
              select 1 from public.room_participants_v2 participant
              where participant.room_id = p_room_id
                and participant.user_id = supplied.profile_id
                and participant.left_at is null
            )
            or exists (
              select 1 from public.room_queue_v2 queued
              where queued.room_id = p_room_id
                and queued.user_id = supplied.profile_id
                and queued.removed_at is null
            )
          )
        )
    ), deduplicated as (
      select eligible.*,
        row_number() over (
          partition by coalesce(
            eligible.profile_id::text,
            'manual:' || lower(btrim(eligible.value ->> 'display_name'))
          )
          order by eligible.ordinality
        ) as duplicate_rank
      from eligible
    ), sampled as materialized (
      select deduplicated.*
      from deduplicated
      where deduplicated.duplicate_rank = 1
      order by gen_random_uuid()
      limit 5000
    )
    insert into public.room_gift_draw_entries_v1 (
      draw_id, profile_id, candidate_key, display_name_snapshot, avatar_url_snapshot, source
    )
    select
      v_draw_id,
      sampled.profile_id,
      case
        when sampled.profile_id is not null then 'profile:' || sampled.profile_id::text
        else 'manual:' || encode(extensions.digest(
          convert_to(lower(btrim(sampled.value ->> 'display_name')), 'UTF8'),
          'sha256'
        ), 'hex')
      end,
      left(coalesce(nullif(trim(profile.display_name), ''), nullif(trim(sampled.value ->> 'display_name'), ''), 'Participant MeeWav'), 120),
      case
        -- Candidate avatars are never trusted: manual entries stay anonymous and
        -- selected profiles can only use the server-owned public projection.
        when sampled.profile_id is null then null
        when octet_length(coalesce(profile.profile_image_url, '')) <= 2048
          and profile.profile_image_url ~ '^https://[^[:space:]]+$' then profile.profile_image_url
        when octet_length(coalesce(profile.avatar_url, '')) <= 2048
          and profile.avatar_url ~ '^https://[^[:space:]]+$' then profile.avatar_url
        else null
      end,
      case
        when sampled.profile_id is null then 'manual'
        when sampled.value ->> 'source' in ('stage', 'backstage', 'queue', 'room')
          then sampled.value ->> 'source'
        else 'room'
      end
    from sampled
    left join public.public_profiles profile on profile.id = sampled.profile_id
    on conflict do nothing;
  end if;

  select count(*)::integer into v_candidate_count
  from public.room_gift_draw_entries_v1 entry
  where entry.draw_id = v_draw_id;

  if v_candidate_count < 1 then
    delete from public.room_gift_draws_v1 where id = v_draw_id;
    raise exception using errcode = '22023', message = 'rooms_gift_draw_no_eligible_candidate';
  end if;

  update public.room_gift_draws_v1
  set eligible_count = v_candidate_count, updated_at = now()
  where id = v_draw_id
  returning * into v_draw;
  return next v_draw;
end;
$$;

create or replace function public.rooms_start_gift_draw_v1(p_draw_id uuid)
returns setof public.room_gift_draws_v1
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_draw public.room_gift_draws_v1%rowtype;
  v_private public.room_gift_draw_private_v1%rowtype;
  v_entry_id uuid;
begin
  select * into v_draw
  from public.room_gift_draws_v1 draw
  where draw.id = p_draw_id
  for update;
  if v_draw.id is null then raise exception 'Tirage introuvable'; end if;
  select * into v_private
  from public.room_gift_draw_private_v1 private
  where private.draw_id = v_draw.id;
  if v_private.draw_id is null or v_private.host_id <> v_user_id then raise exception 'Seul le Host peut lancer le tirage'; end if;
  if v_draw.status in ('revealed', 'cancelled') then
    return next v_draw;
    return;
  end if;
  if not exists (
    select 1 from public.rooms_v2 room
    where room.id = v_draw.room_id and room.status = 'live'
  ) then
    update public.room_gift_draws_v1
    set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = v_draw.id
    returning * into v_draw;
    return next v_draw;
    return;
  end if;
  if v_draw.status = 'spinning' then
    return next v_draw;
    return;
  end if;
  if v_draw.status = 'scheduled' and v_draw.scheduled_at > now() then
    raise exception 'Le tirage est programmé pour plus tard';
  end if;

  select entry.id into v_entry_id
  from public.room_gift_draw_entries_v1 entry
  where entry.draw_id = v_draw.id
  order by gen_random_uuid()
  limit 1;
  if v_entry_id is null then raise exception 'Aucune personne éligible'; end if;

  update public.room_gift_draw_private_v1
  set selected_entry_id = v_entry_id
  where draw_id = v_draw.id;

  update public.room_gift_draws_v1
  set status = 'spinning',
      started_at = now(), reveal_at = now() + make_interval(secs => animation_duration_seconds),
      updated_at = now()
  where id = v_draw.id
  returning * into v_draw;
  return next v_draw;
end;
$$;

create or replace function public.rooms_reveal_gift_draw_v1(p_draw_id uuid)
returns setof public.room_gift_draws_v1
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_draw public.room_gift_draws_v1%rowtype;
  v_private public.room_gift_draw_private_v1%rowtype;
  v_entry public.room_gift_draw_entries_v1%rowtype;
begin
  if v_user_id is null then raise exception 'Authentification requise'; end if;
  select * into v_draw
  from public.room_gift_draws_v1 draw
  where draw.id = p_draw_id
  for update;
  if v_draw.id is null then raise exception 'Tirage introuvable'; end if;
  if v_draw.status in ('revealed', 'cancelled') then
    return next v_draw;
    return;
  end if;
  if v_draw.status <> 'spinning' or v_draw.reveal_at > now() then
    raise exception 'La révélation n’est pas encore disponible';
  end if;
  select * into v_private
  from public.room_gift_draw_private_v1 private
  where private.draw_id = v_draw.id;
  if v_private.draw_id is null or v_private.host_id <> v_user_id then
    raise exception 'Seul le Host peut révéler le tirage';
  end if;
  if not exists (
    select 1 from public.rooms_v2 room
    where room.id = v_draw.room_id and room.status = 'live'
  ) then
    update public.room_gift_draws_v1
    set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = v_draw.id
    returning * into v_draw;
    return next v_draw;
    return;
  end if;

  select * into v_entry
  from public.room_gift_draw_entries_v1 entry
  where entry.id = v_private.selected_entry_id;
  if v_entry.id is null then raise exception 'Résultat du tirage introuvable'; end if;

  update public.room_gift_draws_v1
  set status = 'revealed',
      winner_profile_id = v_entry.profile_id,
      winner_display_name = v_entry.display_name_snapshot,
      winner_avatar_url = v_entry.avatar_url_snapshot,
      winner_source = v_entry.source,
      revealed_at = now(), updated_at = now()
  where id = v_draw.id
  returning * into v_draw;

  insert into public.room_gift_awards_v1 (
    draw_id, draw_id_snapshot, room_id, room_id_snapshot,
    gift_code, gift_label, recipient_profile_id,
    recipient_display_name_snapshot, recipient_avatar_url_snapshot,
    awarded_by, awarded_by_snapshot
  ) values (
    v_draw.id, v_draw.id, v_draw.room_id, v_draw.room_id,
    v_draw.gift_code, v_draw.gift_label, v_entry.profile_id,
    v_entry.display_name_snapshot, v_entry.avatar_url_snapshot,
    v_private.host_id, v_private.host_id
  ) on conflict (draw_id_snapshot) do nothing;

  return next v_draw;
end;
$$;

create or replace function public.rooms_cancel_gift_draw_v1(p_draw_id uuid)
returns setof public.room_gift_draws_v1
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_draw public.room_gift_draws_v1%rowtype;
  v_private public.room_gift_draw_private_v1%rowtype;
begin
  select * into v_draw
  from public.room_gift_draws_v1 draw
  where draw.id = p_draw_id
  for update;
  if v_draw.id is null then raise exception 'Tirage introuvable'; end if;
  select * into v_private
  from public.room_gift_draw_private_v1 private
  where private.draw_id = v_draw.id;
  if v_private.draw_id is null or v_private.host_id <> v_user_id then raise exception 'Seul le Host peut annuler le tirage'; end if;
  if v_draw.status in ('cancelled', 'revealed') then
    return next v_draw;
    return;
  end if;
  update public.room_gift_draws_v1
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = v_draw.id
  returning * into v_draw;
  return next v_draw;
end;
$$;

create or replace function public.rooms_submit_gift_v1(
  p_room_id uuid,
  p_gift_code text,
  p_gift_label text,
  p_recipient_profile_id uuid,
  p_action text default 'send_now',
  p_scheduled_at timestamptz default null,
  p_round_label text default null,
  p_idempotency_key text default null
)
returns setof public.room_gift_deliveries_v1
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_host_id uuid := auth.uid();
  v_room public.rooms_v2%rowtype;
  v_sender public.profiles%rowtype;
  v_recipient public.profiles%rowtype;
  v_delivery public.room_gift_deliveries_v1%rowtype;
  v_secret public.room_gift_delivery_private_v1%rowtype;
  v_gift_code text := btrim(coalesce(p_gift_code, ''));
  v_gift_label text;
  v_action text := lower(btrim(coalesce(p_action, '')));
  v_round_label text := nullif(btrim(coalesce(p_round_label, '')), '');
  v_idempotency_key text := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_recipient_source text;
  v_request_hash text;
  v_sender_name text;
  v_sender_avatar text;
  v_recipient_name text;
  v_recipient_avatar text;
begin
  if v_host_id is null then
    raise exception using errcode = '42501', message = 'rooms_gift_delivery_authentication_required';
  end if;
  if p_room_id is null then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_room_required';
  end if;
  if p_recipient_profile_id is null or p_recipient_profile_id = v_host_id then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_recipient_invalid';
  end if;

  v_gift_label := case v_gift_code
    when 'force-card' then 'Carte de Force'
    when 'vip-pass' then 'Pass VIP'
    when 'private-access' then 'Accès privé'
    when 'golden-like' then 'Golden Like'
    when 'supporter-bonus' then 'Bonus supporter'
    when 'la-certif' then 'La Certif'
    else null
  end;
  if v_gift_label is null then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_gift_not_allowed';
  end if;
  if octet_length(coalesce(p_gift_label, '')) > 480
     or btrim(coalesce(p_gift_label, '')) <> v_gift_label then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_gift_label_mismatch';
  end if;
  if v_action not in ('send_now', 'schedule', 'round') then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_action_invalid';
  end if;
  if v_idempotency_key is null
     or char_length(v_idempotency_key) not between 8 and 128
     or octet_length(v_idempotency_key) > 128 then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_idempotency_key_invalid';
  end if;

  if v_action = 'schedule' then
    if p_scheduled_at is null
       or p_scheduled_at > now() + interval '30 days' then
      raise exception using errcode = '22023', message = 'rooms_gift_delivery_schedule_invalid';
    end if;
  elsif p_scheduled_at is not null then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_schedule_action_mismatch';
  end if;

  if v_action = 'round' then
    if v_round_label is null
       or char_length(v_round_label) > 80
       or octet_length(v_round_label) > 320
       or v_round_label ~ '[[:cntrl:]]' then
      raise exception using errcode = '22023', message = 'rooms_gift_delivery_round_label_invalid';
    end if;
  elsif v_round_label is not null then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_round_label_action_mismatch';
  end if;

  select * into v_room
  from public.rooms_v2 room
  where room.id = p_room_id
    and room.host_id = v_host_id;
  if v_room.id is null then
    raise exception using errcode = '42501', message = 'rooms_gift_delivery_live_host_required';
  end if;

  v_request_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'room_id', p_room_id,
    'gift_code', v_gift_code,
    'gift_label', v_gift_label,
    'recipient_profile_id', p_recipient_profile_id,
    'action', v_action,
    'scheduled_at_epoch', case when p_scheduled_at is null then null else extract(epoch from p_scheduled_at)::text end,
    'round_label', v_round_label
  )::text, 'UTF8'), 'sha256'), 'hex');

  -- Shared gift locks keep Host/Room quotas exact under concurrent draw and
  -- direct-delivery requests.
  perform pg_advisory_xact_lock(hashtextextended('rooms-gift-draw-host:' || v_host_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('rooms-gift-draw-room:' || p_room_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(
    'rooms-gift-delivery-key:' || v_host_id::text || ':' || v_idempotency_key,
    0
  ));

  select * into v_secret
  from public.room_gift_delivery_private_v1 secret
  where secret.sender_profile_id = v_host_id
    and secret.idempotency_key = v_idempotency_key;
  if v_secret.delivery_id is not null then
    select * into v_delivery
    from public.room_gift_deliveries_v1 delivery
    where delivery.id = v_secret.delivery_id;
    if v_delivery.id is null
       or v_delivery.room_id_snapshot is distinct from p_room_id
       or v_secret.request_hash <> v_request_hash then
      raise exception using errcode = '23505', message = 'rooms_gift_delivery_idempotency_conflict';
    end if;
    return next v_delivery;
    return;
  end if;

  if v_room.status <> 'live' then
    raise exception using errcode = '42501', message = 'rooms_gift_delivery_live_host_required';
  end if;
  if v_action = 'schedule' and p_scheduled_at <= now() then
    raise exception using errcode = '22023', message = 'rooms_gift_delivery_schedule_invalid';
  end if;

  select * into v_sender from public.profiles profile where profile.id = v_host_id;
  select * into v_recipient from public.profiles profile where profile.id = p_recipient_profile_id;
  if v_sender.id is null or v_recipient.id is null then
    raise exception using errcode = '23503', message = 'rooms_gift_delivery_profile_not_found';
  end if;

  v_recipient_source := case
    when exists (
      select 1 from public.room_invitations_v2 invitation
      where invitation.room_id = p_room_id
        and invitation.guest_id = p_recipient_profile_id
        and invitation.status = 'onstage'
    ) then 'stage'
    when exists (
      select 1 from public.room_invitations_v2 invitation
      where invitation.room_id = p_room_id
        and invitation.guest_id = p_recipient_profile_id
        and invitation.status = 'backstage'
    ) then 'backstage'
    when exists (
      select 1 from public.room_queue_v2 queued
      where queued.room_id = p_room_id
        and queued.user_id = p_recipient_profile_id
        and queued.removed_at is null
    ) then 'queue'
    when exists (
      select 1
      from public.messaging_conversations conversation
      join public.messaging_direct_pairs pair on pair.conversation_id = conversation.id
      join public.messaging_conversation_members sender_member
        on sender_member.conversation_id = conversation.id
       and sender_member.profile_id = v_host_id
       and sender_member.membership_status = 'active'
       and sender_member.left_at is null
      join public.messaging_conversation_members recipient_member
        on recipient_member.conversation_id = conversation.id
       and recipient_member.profile_id = p_recipient_profile_id
       and recipient_member.membership_status = 'active'
       and recipient_member.left_at is null
      where conversation.kind = 'direct'
        and conversation.deleted_at is null
        and (
          (pair.profile_low_id = v_host_id and pair.profile_high_id = p_recipient_profile_id)
          or (pair.profile_high_id = v_host_id and pair.profile_low_id = p_recipient_profile_id)
        )
        and not public.messaging_profiles_blocked_v1(v_host_id, p_recipient_profile_id)
    ) then 'messaging'
    else null
  end;
  if v_recipient_source is null then
    raise exception using errcode = '42501', message = 'rooms_gift_delivery_recipient_not_eligible';
  end if;

  v_sender_name := left(coalesce(
    nullif(btrim(v_sender.display_name), ''),
    nullif(btrim(v_sender.username), ''),
    nullif(btrim(v_sender.avatar_name), ''),
    'Host MeeWav'
  ), 120);
  v_recipient_name := left(coalesce(
    nullif(btrim(v_recipient.display_name), ''),
    nullif(btrim(v_recipient.username), ''),
    nullif(btrim(v_recipient.avatar_name), ''),
    'Membre MeeWav'
  ), 120);
  v_sender_avatar := case
    when octet_length(coalesce(v_sender.profile_image_url, '')) <= 2048
      and v_sender.profile_image_url ~ '^https://[^[:space:]]+$' then v_sender.profile_image_url
    when octet_length(coalesce(v_sender.avatar_url, '')) <= 2048
      and v_sender.avatar_url ~ '^https://[^[:space:]]+$' then v_sender.avatar_url
    else null
  end;
  v_recipient_avatar := case
    when octet_length(coalesce(v_recipient.profile_image_url, '')) <= 2048
      and v_recipient.profile_image_url ~ '^https://[^[:space:]]+$' then v_recipient.profile_image_url
    when octet_length(coalesce(v_recipient.avatar_url, '')) <= 2048
      and v_recipient.avatar_url ~ '^https://[^[:space:]]+$' then v_recipient.avatar_url
    else null
  end;

  if (
    select count(*) from public.room_gift_delivery_private_v1 secret
    where secret.sender_profile_id = v_host_id
      and secret.created_at >= now() - interval '1 hour'
  ) >= 30 then
    raise exception using errcode = '54000', message = 'rooms_gift_delivery_host_hourly_rate_limit';
  end if;
  if (
    select count(*) from public.room_gift_delivery_private_v1 secret
    where secret.sender_profile_id = v_host_id
      and secret.created_at >= now() - interval '24 hours'
  ) >= 200 then
    raise exception using errcode = '54000', message = 'rooms_gift_delivery_host_daily_quota';
  end if;
  if (
    select count(*) from public.room_gift_deliveries_v1 delivery
    where delivery.room_id_snapshot = p_room_id
      and delivery.created_at >= now() - interval '1 hour'
  ) >= 12 then
    raise exception using errcode = '54000', message = 'rooms_gift_delivery_room_hourly_rate_limit';
  end if;
  if (
    select count(*) from public.room_gift_deliveries_v1 delivery
    where delivery.room_id_snapshot = p_room_id
      and delivery.created_at >= now() - interval '24 hours'
  ) >= 50 then
    raise exception using errcode = '54000', message = 'rooms_gift_delivery_room_daily_quota';
  end if;
  if v_action = 'schedule' and (
    select count(*) from public.room_gift_delivery_private_v1 secret
    join public.room_gift_deliveries_v1 delivery on delivery.id = secret.delivery_id
    where secret.sender_profile_id = v_host_id
      and delivery.status = 'scheduled'
  ) >= 20 then
    raise exception using errcode = '54000', message = 'rooms_gift_delivery_host_scheduled_quota';
  end if;

  insert into public.room_gift_deliveries_v1 (
    room_id, room_id_snapshot, room_title_snapshot,
    gift_code, gift_label, action, status, round_label,
    sender_profile_id, sender_profile_id_snapshot,
    sender_display_name_snapshot, sender_avatar_url_snapshot,
    recipient_profile_id, recipient_profile_id_snapshot,
    recipient_display_name_snapshot, recipient_avatar_url_snapshot,
    recipient_source, scheduled_at, sent_at
  ) values (
    v_room.id, v_room.id,
    left(coalesce(nullif(btrim(v_room.title), ''), 'Room MeeWav'), 160),
    v_gift_code, v_gift_label, v_action,
    case v_action when 'send_now' then 'sent' when 'schedule' then 'scheduled' else 'ready' end,
    v_round_label,
    v_host_id, v_host_id, v_sender_name, v_sender_avatar,
    p_recipient_profile_id, p_recipient_profile_id,
    v_recipient_name, v_recipient_avatar, v_recipient_source,
    case when v_action = 'schedule' then p_scheduled_at else null end,
    case when v_action = 'send_now' then now() else null end
  ) returning * into v_delivery;

  insert into public.room_gift_delivery_private_v1 (
    delivery_id, sender_profile_id, idempotency_key, request_hash
  ) values (
    v_delivery.id, v_host_id, v_idempotency_key, v_request_hash
  );

  return next v_delivery;
end;
$$;

-- Private entrant snapshots have a deliberately shorter lifetime than the
-- public draw projection and immutable award ledger. This function is invoked
-- by a trusted scheduler and remains safe to retry.
create or replace function public.rooms_purge_gift_draw_snapshots_v1(p_limit integer default 500)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_batch_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000));
  v_deleted_entries integer := 0;
  v_deleted_private integer := 0;
  v_deleted_delivery_private integer := 0;
  v_deleted_draws integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception using errcode = '42501', message = 'rooms_gift_draw_service_role_required';
  end if;

  -- Entrants are no longer needed after a terminal draw. Cancelled pools are
  -- retained 48 hours for support; revealed pools seven days for audit.
  with targets as materialized (
    select draw.id
    from public.room_gift_draws_v1 draw
    where (
      draw.status = 'cancelled'
      and coalesce(draw.cancelled_at, draw.updated_at) < now() - interval '48 hours'
    ) or (
      draw.status = 'revealed'
      and coalesce(draw.revealed_at, draw.updated_at) < now() - interval '7 days'
    )
    order by coalesce(draw.cancelled_at, draw.revealed_at, draw.updated_at)
    limit v_batch_limit
    for update skip locked
  )
  delete from public.room_gift_draw_entries_v1 entry
  using targets
  where entry.draw_id = targets.id;
  get diagnostics v_deleted_entries = row_count;

  -- Keep the lightweight idempotency/Host record for 35 days even after the
  -- entrant snapshot is gone, so late retries still reject payload reuse.
  with targets as materialized (
    select draw.id
    from public.room_gift_draws_v1 draw
    where draw.status in ('cancelled', 'revealed')
      and coalesce(draw.cancelled_at, draw.revealed_at, draw.updated_at)
        < now() - interval '35 days'
    order by coalesce(draw.cancelled_at, draw.revealed_at, draw.updated_at)
    limit v_batch_limit
    for update skip locked
  )
  delete from public.room_gift_draw_private_v1 secret
  using targets
  where secret.draw_id = targets.id;
  get diagnostics v_deleted_private = row_count;

  -- The participant-visible direct-delivery ledger is durable, while its
  -- payload hash/idempotency secret follows the same 35-day retention window.
  with targets as materialized (
    select secret.delivery_id
    from public.room_gift_delivery_private_v1 secret
    where secret.created_at < now() - interval '35 days'
    order by secret.created_at
    limit v_batch_limit
    for update skip locked
  )
  delete from public.room_gift_delivery_private_v1 secret
  using targets
  where secret.delivery_id = targets.delivery_id;
  get diagnostics v_deleted_delivery_private = row_count;

  -- Cancelled projections expire after 90 days; revealed projections after
  -- 180 days. Award snapshot columns survive because their FKs use SET NULL.
  with targets as materialized (
    select draw.id
    from public.room_gift_draws_v1 draw
    where (
      draw.status = 'cancelled'
      and coalesce(draw.cancelled_at, draw.updated_at) < now() - interval '90 days'
    ) or (
      draw.status = 'revealed'
      and coalesce(draw.revealed_at, draw.updated_at) < now() - interval '180 days'
    )
    order by coalesce(draw.cancelled_at, draw.revealed_at, draw.updated_at)
    limit v_batch_limit
    for update skip locked
  )
  delete from public.room_gift_draws_v1 draw
  using targets
  where draw.id = targets.id;
  get diagnostics v_deleted_draws = row_count;

  return v_deleted_entries + v_deleted_private + v_deleted_delivery_private + v_deleted_draws;
end;
$$;

-- Durable scheduler entry point. A five-second pg_cron interval is installed
-- below when supported; otherwise deployment health is explicitly degraded.
create or replace function public.rooms_advance_due_gift_draws_v1(p_limit integer default 20)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_draw public.room_gift_draws_v1%rowtype;
  v_private public.room_gift_draw_private_v1%rowtype;
  v_entry public.room_gift_draw_entries_v1%rowtype;
  v_advanced integer := 0;
  v_cancelled integer := 0;
  v_delivered integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Service role requise';
  end if;

  -- A prepared-but-never-started draw must not block a Room forever.
  with stale_ready as materialized (
    select draw.id
    from public.room_gift_draws_v1 draw
    where draw.status = 'ready'
      and draw.created_at < now() - interval '2 hours'
    order by draw.created_at
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    for update skip locked
  )
  update public.room_gift_draws_v1 draw
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  from stale_ready
  where draw.id = stale_ready.id;
  get diagnostics v_cancelled = row_count;
  v_advanced := v_advanced + v_cancelled;

  -- Direct scheduled gifts share the same durable five-second worker.
  -- Eligibility is intentionally frozen when the Host submits the gift: a
  -- scheduled attribution is firm and is not re-evaluated when it becomes due.
  with due_deliveries as materialized (
    select delivery.id
    from public.room_gift_deliveries_v1 delivery
    where delivery.status = 'scheduled'
      and delivery.scheduled_at <= now()
    order by delivery.scheduled_at
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    for update skip locked
  )
  update public.room_gift_deliveries_v1 delivery
  set status = 'sent', sent_at = now(), updated_at = now()
  from due_deliveries
  where delivery.id = due_deliveries.id;
  get diagnostics v_delivered = row_count;
  v_advanced := v_advanced + v_delivered;

  for v_draw in
    select * from public.room_gift_draws_v1 draw
    where draw.status = 'scheduled' and draw.scheduled_at <= now()
    order by draw.scheduled_at
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    for update skip locked
  loop
    if not exists (
      select 1 from public.rooms_v2 room
      where room.id = v_draw.room_id and room.status = 'live'
    ) then
      update public.room_gift_draws_v1
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where id = v_draw.id;
      v_advanced := v_advanced + 1;
      continue;
    end if;
    select * into v_private
    from public.room_gift_draw_private_v1 private
    where private.draw_id = v_draw.id;
    if v_private.draw_id is null then
      update public.room_gift_draws_v1
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where id = v_draw.id;
      v_advanced := v_advanced + 1;
      continue;
    end if;
    select * into v_entry
    from public.room_gift_draw_entries_v1 entry
    where entry.draw_id = v_draw.id
    order by gen_random_uuid()
    limit 1;
    if v_entry.id is not null then
      update public.room_gift_draw_private_v1
      set selected_entry_id = v_entry.id
      where draw_id = v_draw.id;
      update public.room_gift_draws_v1
      set status = 'spinning',
          started_at = now(), reveal_at = now() + make_interval(secs => animation_duration_seconds),
          updated_at = now()
      where id = v_draw.id;
      v_advanced := v_advanced + 1;
    else
      update public.room_gift_draws_v1
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where id = v_draw.id;
      v_advanced := v_advanced + 1;
    end if;
  end loop;

  for v_draw in
    select * from public.room_gift_draws_v1 draw
    where draw.status = 'spinning' and draw.reveal_at <= now()
    order by draw.reveal_at
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    for update skip locked
  loop
    if not exists (
      select 1 from public.rooms_v2 room
      where room.id = v_draw.room_id and room.status = 'live'
    ) then
      update public.room_gift_draws_v1
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where id = v_draw.id;
      v_advanced := v_advanced + 1;
      continue;
    end if;
    select * into v_private
    from public.room_gift_draw_private_v1 private
    where private.draw_id = v_draw.id;
    if v_private.draw_id is null then
      update public.room_gift_draws_v1
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where id = v_draw.id;
      v_advanced := v_advanced + 1;
      continue;
    end if;
    select * into v_entry
    from public.room_gift_draw_entries_v1 entry
    where entry.id = v_private.selected_entry_id;
    if v_entry.id is not null then
      update public.room_gift_draws_v1
      set status = 'revealed', winner_profile_id = v_entry.profile_id,
          winner_display_name = v_entry.display_name_snapshot,
          winner_avatar_url = v_entry.avatar_url_snapshot,
          winner_source = v_entry.source, revealed_at = now(), updated_at = now()
      where id = v_draw.id;
      insert into public.room_gift_awards_v1 (
        draw_id, draw_id_snapshot, room_id, room_id_snapshot,
        gift_code, gift_label, recipient_profile_id,
        recipient_display_name_snapshot, recipient_avatar_url_snapshot,
        awarded_by, awarded_by_snapshot
      ) values (
        v_draw.id, v_draw.id, v_draw.room_id, v_draw.room_id,
        v_draw.gift_code, v_draw.gift_label, v_entry.profile_id,
        v_entry.display_name_snapshot, v_entry.avatar_url_snapshot,
        v_private.host_id, v_private.host_id
      ) on conflict (draw_id_snapshot) do nothing;
      v_advanced := v_advanced + 1;
    else
      update public.room_gift_draws_v1
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where id = v_draw.id;
      v_advanced := v_advanced + 1;
    end if;
  end loop;
  return v_advanced;
end;
$$;

revoke all on function public.rooms_create_gift_draw_v1(uuid, text, text, text, jsonb, timestamptz, integer, text) from public, anon;
revoke all on function public.rooms_start_gift_draw_v1(uuid) from public, anon;
revoke all on function public.rooms_reveal_gift_draw_v1(uuid) from public, anon;
revoke all on function public.rooms_cancel_gift_draw_v1(uuid) from public, anon;
revoke all on function public.rooms_submit_gift_v1(uuid, text, text, uuid, text, timestamptz, text, text) from public, anon;
revoke all on function public.rooms_purge_gift_draw_snapshots_v1(integer) from public, anon, authenticated;
revoke all on function public.rooms_advance_due_gift_draws_v1(integer) from public, anon, authenticated;
grant execute on function public.rooms_create_gift_draw_v1(uuid, text, text, text, jsonb, timestamptz, integer, text) to authenticated;
grant execute on function public.rooms_start_gift_draw_v1(uuid) to authenticated;
grant execute on function public.rooms_reveal_gift_draw_v1(uuid) to authenticated;
grant execute on function public.rooms_cancel_gift_draw_v1(uuid) to authenticated;
grant execute on function public.rooms_submit_gift_v1(uuid, text, text, uuid, text, timestamptz, text, text) to authenticated;
grant execute on function public.rooms_purge_gift_draw_snapshots_v1(integer) to service_role;
grant execute on function public.rooms_advance_due_gift_draws_v1(integer) to service_role;

-- pg_cron 1.6+ accepts interval schedules down to one second. The Room draw
-- contract requires a five-second cadence. Older/missing pg_cron installations
-- are recorded as degraded and MUST invoke both service RPCs from an external
-- trusted scheduler; there is no silent minute-level fallback.
do $schedule$
declare
  v_detail text;
begin
  insert into public.room_gift_draw_scheduler_health_v1 (
    singleton, scheduler_status, scheduler_detail, checked_at
  ) values (
    true, 'pending', 'Gift draw scheduler installation is being checked.', now()
  )
  on conflict (singleton) do update
  set scheduler_status = excluded.scheduler_status,
      scheduler_detail = excluded.scheduler_detail,
      checked_at = excluded.checked_at;

  if to_regprocedure('cron.schedule(text,text,text)') is not null then
    begin
      execute 'select cron.schedule($1, $2, $3)'
        using 'rooms-gift-draws-v1', '5 seconds',
          'select public.rooms_advance_due_gift_draws_v1(100);';
      execute 'select cron.schedule($1, $2, $3)'
        using 'rooms-gift-draw-snapshots-purge-v1', '1 hour',
          'select public.rooms_purge_gift_draw_snapshots_v1(200);';

      update public.room_gift_draw_scheduler_health_v1
      set scheduler_status = 'pg_cron_5_seconds',
          scheduler_detail = 'pg_cron advances draws and scheduled direct gifts every 5 seconds, with hourly snapshot purge.',
          checked_at = now()
      where singleton;
    exception
      when others then
        v_detail := left(
          'pg_cron interval scheduling failed; configure an external trusted scheduler: ' || sqlerrm,
          1000
        );
        update public.room_gift_draw_scheduler_health_v1
        set scheduler_status = 'degraded_external_scheduler_required',
            scheduler_detail = v_detail,
            checked_at = now()
        where singleton;
        raise warning 'rooms_gift_draw_scheduler_degraded: %', v_detail;
    end;
  else
    v_detail := 'pg_cron is unavailable; configure an external trusted scheduler every 5 seconds plus hourly purge.';
    update public.room_gift_draw_scheduler_health_v1
    set scheduler_status = 'degraded_external_scheduler_required',
        scheduler_detail = v_detail,
        checked_at = now()
    where singleton;
    raise warning 'rooms_gift_draw_scheduler_degraded: %', v_detail;
  end if;
end;
$schedule$;

do $$
begin
  alter publication supabase_realtime add table public.room_gift_draws_v1;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.room_gift_deliveries_v1;
exception
  when duplicate_object then null;
end;
$$;

comment on table public.room_gift_draws_v1 is
  'Public Room gift draw projection. Entrants and the pre-reveal winner stay in room_gift_draw_entries_v1.';
comment on table public.room_gift_draw_entries_v1 is
  'Server-only snapshot of eligible identities. No browser role, including the Host, can read it.';
comment on table public.room_gift_draw_private_v1 is
  'Server-only draw secret: Host authorization, payload-bound idempotency token and pre-reveal selected entry.';
comment on table public.room_gift_awards_v1 is
  'Immutable award ledger created idempotently when a gift draw is revealed.';
comment on table public.room_gift_deliveries_v1 is
  'Durable direct Room gift ledger: all states are visible to sender, while recipients see only sent gifts.';
comment on table public.room_gift_delivery_private_v1 is
  'Server-only payload hash and idempotency token for direct Room gifts.';
comment on table public.room_gift_draw_scheduler_health_v1 is
  'Machine-readable scheduler installation state. A degraded row requires a trusted external five-second runner.';

-- End-of-Room cleanup for the gift draw workflow introduced after
-- rooms_end_place_v3. The trigger also covers legacy clients that still end a
-- Room by updating rooms_v2 directly instead of calling the canonical RPC.

create or replace function public.rooms_cancel_gift_draws_after_end_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cancelled_at timestamptz := pg_catalog.clock_timestamp();
begin
  update public.room_gift_draws_v1 draw
  set
    status = 'cancelled',
    cancelled_at = coalesce(draw.cancelled_at, v_cancelled_at),
    updated_at = v_cancelled_at
  where draw.room_id = new.id
    and draw.status in ('ready', 'scheduled', 'spinning');

  return new;
end;
$$;

drop trigger if exists rooms_cancel_gift_draws_after_end_v1
  on public.rooms_v2;
create trigger rooms_cancel_gift_draws_after_end_v1
after update of status on public.rooms_v2
for each row
when (
  old.status is distinct from new.status
  and new.status = 'ended'
)
execute function public.rooms_cancel_gift_draws_after_end_v1();

revoke all on function public.rooms_cancel_gift_draws_after_end_v1()
  from public, anon, authenticated, service_role;

comment on function public.rooms_cancel_gift_draws_after_end_v1() is
  'Cancels unrevealed Room gift draws atomically when any supported client ends the Room; scheduled direct gift deliveries remain untouched.';

-- La Certif is a signed community endorsement, never an official MeeWav
-- verification, grade, entitlement or financial signal. This additive ledger
-- is derived only from durable Room gifts that already passed the canonical
-- gift RPCs. Existing iOS/Web gift contracts remain unchanged.

create table if not exists public.profile_certif_endorsements_v1 (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null check (source_kind in ('direct', 'draw')),
  source_delivery_id uuid references public.room_gift_deliveries_v1(id) on delete set null,
  source_award_id uuid references public.room_gift_awards_v1(id) on delete set null,
  source_id_snapshot uuid not null,
  room_id_snapshot uuid not null,
  sender_profile_id uuid references auth.users(id) on delete set null,
  sender_profile_id_snapshot uuid not null,
  recipient_profile_id uuid references auth.users(id) on delete set null,
  recipient_profile_id_snapshot uuid not null,
  sender_display_name_snapshot text not null check (
    char_length(sender_display_name_snapshot) between 1 and 120
    and octet_length(sender_display_name_snapshot) <= 480
  ),
  sender_avatar_url_snapshot text,
  recipient_display_name_snapshot text not null check (
    char_length(recipient_display_name_snapshot) between 1 and 120
    and octet_length(recipient_display_name_snapshot) <= 480
  ),
  recipient_avatar_url_snapshot text,
  sender_grade_level_snapshot smallint not null check (sender_grade_level_snapshot between 1 and 6),
  sender_followers_count_snapshot bigint not null default 0 check (sender_followers_count_snapshot >= 0),
  sender_verified_snapshot boolean not null default false,
  signal_context_version text not null default 'profile-signals-v1' check (
    signal_context_version = 'profile-signals-v1'
  ),
  snapshot_quality text not null default 'source_time' check (
    snapshot_quality in ('source_time', 'backfill_current')
  ),
  state text not null default 'active' check (
    state in ('active', 'withdrawn', 'hidden_by_recipient', 'moderated')
  ),
  ended_at timestamptz,
  ended_by uuid references auth.users(id) on delete set null,
  endorsed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_kind, source_id_snapshot),
  -- The nullable foreign key is only a convenience link to the durable gift
  -- source. Retention may purge that row later; source_id_snapshot remains the
  -- immutable/idempotent proof and the endorsement must survive the purge.
  check (
    (source_kind = 'direct' and source_award_id is null)
    or (source_kind = 'draw' and source_delivery_id is null)
  ),
  check (sender_profile_id_snapshot <> recipient_profile_id_snapshot),
  check (
    sender_avatar_url_snapshot is null
    or (
      octet_length(sender_avatar_url_snapshot) <= 2048
      and sender_avatar_url_snapshot ~ '^https://[^[:space:]]+$'
    )
  ),
  check (
    recipient_avatar_url_snapshot is null
    or (
      octet_length(recipient_avatar_url_snapshot) <= 2048
      and recipient_avatar_url_snapshot ~ '^https://[^[:space:]]+$'
    )
  ),
  check (
    (state = 'active' and ended_at is null and ended_by is null)
    or (state <> 'active' and ended_at is not null)
  )
);

create index if not exists profile_certif_endorsements_v1_recipient_time_idx
  on public.profile_certif_endorsements_v1(recipient_profile_id_snapshot, endorsed_at desc);
create index if not exists profile_certif_endorsements_v1_sender_time_idx
  on public.profile_certif_endorsements_v1(sender_profile_id_snapshot, endorsed_at desc);
create index if not exists profile_certif_endorsements_v1_public_projection_idx
  on public.profile_certif_endorsements_v1(
    recipient_profile_id_snapshot, sender_profile_id_snapshot, endorsed_at desc, created_at desc
  );

alter table public.profile_certif_endorsements_v1 enable row level security;

drop policy if exists profile_certif_endorsements_v1_participant_read
  on public.profile_certif_endorsements_v1;
create policy profile_certif_endorsements_v1_participant_read
on public.profile_certif_endorsements_v1 for select to authenticated
using (
  sender_profile_id_snapshot = auth.uid()
  or recipient_profile_id_snapshot = auth.uid()
);

revoke all on table public.profile_certif_endorsements_v1 from public, anon, authenticated;
grant select on table public.profile_certif_endorsements_v1 to authenticated;
grant all on table public.profile_certif_endorsements_v1 to service_role;

-- Internal capture primitive. It validates the durable source again so a
-- forged trigger invocation can never mint an endorsement.
create or replace function public.profile_capture_certif_endorsement_v1(
  p_source_kind text,
  p_source_id uuid,
  p_room_id uuid,
  p_sender_profile_id uuid,
  p_recipient_profile_id uuid,
  p_sender_display_name text,
  p_sender_avatar_url text,
  p_recipient_display_name text,
  p_recipient_avatar_url text,
  p_endorsed_at timestamptz,
  p_snapshot_quality text default 'source_time'
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_sender public.profiles%rowtype;
  v_recipient public.profiles%rowtype;
  v_grade smallint;
  v_sender_name text;
  v_sender_avatar text;
  v_recipient_name text;
  v_recipient_avatar text;
begin
  if p_source_kind not in ('direct', 'draw')
     or p_source_id is null
     or p_room_id is null
     or p_sender_profile_id is null
     or p_recipient_profile_id is null then
    raise exception using errcode = '22023', message = 'profile_certif_source_invalid';
  end if;
  if p_sender_profile_id = p_recipient_profile_id then
    -- Do not block a legacy draw/delivery transaction, but never project a
    -- self-awarded Certif as community recognition.
    return;
  end if;
  if p_snapshot_quality not in ('source_time', 'backfill_current') then
    raise exception using errcode = '22023', message = 'profile_certif_snapshot_quality_invalid';
  end if;

  if p_source_kind = 'direct' and not exists (
    select 1
    from public.room_gift_deliveries_v1 delivery
    where delivery.id = p_source_id
      and delivery.room_id_snapshot = p_room_id
      and delivery.gift_code = 'la-certif'
      and delivery.status = 'sent'
      and delivery.sender_profile_id_snapshot = p_sender_profile_id
      and delivery.recipient_profile_id_snapshot = p_recipient_profile_id
  ) then
    raise exception using errcode = '22023', message = 'profile_certif_direct_source_invalid';
  end if;
  if p_source_kind = 'draw' and not exists (
    select 1
    from public.room_gift_awards_v1 award
    where award.id = p_source_id
      and award.room_id_snapshot = p_room_id
      and award.gift_code = 'la-certif'
      and award.awarded_by_snapshot = p_sender_profile_id
      and award.recipient_profile_id = p_recipient_profile_id
  ) then
    raise exception using errcode = '22023', message = 'profile_certif_draw_source_invalid';
  end if;

  select * into v_sender
  from public.profiles profile
  where profile.id = p_sender_profile_id;
  if v_sender.id is null then
    -- A scheduled legacy gift may become due after its sender deleted their
    -- profile. Delivery must keep advancing, but there is no Profile on which
    -- an endorsement could safely be projected.
    return;
  end if;
  select * into v_recipient
  from public.profiles profile
  where profile.id = p_recipient_profile_id;
  if v_recipient.id is null then
    return;
  end if;

  select coalesce(state.level, v_sender.grade, 1)::smallint into v_grade
  from (select 1) seed
  left join public.profile_grade_state state on state.profile_id = p_sender_profile_id;
  v_grade := greatest(1, least(6, coalesce(v_grade, 1)))::smallint;
  v_sender_name := left(coalesce(
    nullif(btrim(p_sender_display_name), ''),
    nullif(btrim(v_sender.display_name), ''),
    nullif(btrim(v_sender.username), ''),
    'Membre MeeWav'
  ), 120);
  v_sender_avatar := case
    when octet_length(coalesce(p_sender_avatar_url, '')) <= 2048
      and p_sender_avatar_url ~ '^https://[^[:space:]]+$' then p_sender_avatar_url
    when octet_length(coalesce(v_sender.profile_image_url, '')) <= 2048
      and v_sender.profile_image_url ~ '^https://[^[:space:]]+$' then v_sender.profile_image_url
    when octet_length(coalesce(v_sender.avatar_url, '')) <= 2048
      and v_sender.avatar_url ~ '^https://[^[:space:]]+$' then v_sender.avatar_url
    else null
  end;
  v_recipient_name := left(coalesce(
    nullif(btrim(p_recipient_display_name), ''),
    nullif(btrim(v_recipient.display_name), ''),
    nullif(btrim(v_recipient.username), ''),
    'Membre MeeWav'
  ), 120);
  v_recipient_avatar := case
    when octet_length(coalesce(p_recipient_avatar_url, '')) <= 2048
      and p_recipient_avatar_url ~ '^https://[^[:space:]]+$' then p_recipient_avatar_url
    when octet_length(coalesce(v_recipient.profile_image_url, '')) <= 2048
      and v_recipient.profile_image_url ~ '^https://[^[:space:]]+$' then v_recipient.profile_image_url
    when octet_length(coalesce(v_recipient.avatar_url, '')) <= 2048
      and v_recipient.avatar_url ~ '^https://[^[:space:]]+$' then v_recipient.avatar_url
    else null
  end;

  insert into public.profile_certif_endorsements_v1 (
    source_kind, source_delivery_id, source_award_id, source_id_snapshot,
    room_id_snapshot, sender_profile_id, sender_profile_id_snapshot,
    recipient_profile_id, recipient_profile_id_snapshot,
    sender_display_name_snapshot, sender_avatar_url_snapshot,
    recipient_display_name_snapshot, recipient_avatar_url_snapshot,
    sender_grade_level_snapshot, sender_followers_count_snapshot,
    sender_verified_snapshot, snapshot_quality, endorsed_at
  ) values (
    p_source_kind,
    case when p_source_kind = 'direct' then p_source_id else null end,
    case when p_source_kind = 'draw' then p_source_id else null end,
    p_source_id, p_room_id, p_sender_profile_id, p_sender_profile_id,
    p_recipient_profile_id, p_recipient_profile_id,
    v_sender_name, v_sender_avatar, v_recipient_name, v_recipient_avatar, v_grade,
    greatest(0, coalesce(v_sender.followers_count, 0))::bigint,
    coalesce(v_sender.is_verified, false), p_snapshot_quality,
    coalesce(p_endorsed_at, now())
  )
  on conflict (source_kind, source_id_snapshot) do nothing;
end;
$$;

create or replace function public.profile_capture_direct_certif_trigger_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_should_capture boolean := false;
begin
  if new.gift_code = 'la-certif' and new.status = 'sent' then
    if tg_op = 'INSERT' then
      v_should_capture := true;
    elsif tg_op = 'UPDATE' then
      v_should_capture := old.status is distinct from 'sent';
    end if;
  end if;
  if v_should_capture then
    perform public.profile_capture_certif_endorsement_v1(
      'direct', new.id, new.room_id_snapshot,
      new.sender_profile_id_snapshot, new.recipient_profile_id_snapshot,
      new.sender_display_name_snapshot, new.sender_avatar_url_snapshot,
      new.recipient_display_name_snapshot, new.recipient_avatar_url_snapshot,
      coalesce(new.sent_at, new.created_at), 'source_time'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists room_gift_delivery_capture_certif_v1
  on public.room_gift_deliveries_v1;
create trigger room_gift_delivery_capture_certif_v1
after insert or update of status on public.room_gift_deliveries_v1
for each row execute function public.profile_capture_direct_certif_trigger_v1();

create or replace function public.profile_capture_draw_certif_trigger_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_sender public.profiles%rowtype;
begin
  if new.gift_code = 'la-certif' and new.recipient_profile_id is not null then
    select * into v_sender
    from public.profiles profile
    where profile.id = new.awarded_by_snapshot;
    perform public.profile_capture_certif_endorsement_v1(
      'draw', new.id, new.room_id_snapshot,
      new.awarded_by_snapshot, new.recipient_profile_id,
      coalesce(v_sender.display_name, v_sender.username, 'Membre MeeWav'),
      coalesce(v_sender.profile_image_url, v_sender.avatar_url),
      new.recipient_display_name_snapshot, new.recipient_avatar_url_snapshot,
      new.created_at, 'source_time'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists room_gift_award_capture_certif_v1
  on public.room_gift_awards_v1;
create trigger room_gift_award_capture_certif_v1
after insert on public.room_gift_awards_v1
for each row execute function public.profile_capture_draw_certif_trigger_v1();

-- Backfill already delivered Certifs. Raw sender context necessarily reflects
-- migration time and is explicitly labelled so it is never mistaken for a
-- historical official metric.
select public.profile_capture_certif_endorsement_v1(
  'direct', delivery.id, delivery.room_id_snapshot,
  delivery.sender_profile_id_snapshot, delivery.recipient_profile_id_snapshot,
  delivery.sender_display_name_snapshot, delivery.sender_avatar_url_snapshot,
  delivery.recipient_display_name_snapshot, delivery.recipient_avatar_url_snapshot,
  coalesce(delivery.sent_at, delivery.created_at), 'backfill_current'
)
from public.room_gift_deliveries_v1 delivery
where delivery.gift_code = 'la-certif'
  and delivery.status = 'sent';

select public.profile_capture_certif_endorsement_v1(
  'draw', award.id, award.room_id_snapshot,
  award.awarded_by_snapshot, award.recipient_profile_id,
  coalesce(profile.display_name, profile.username, 'Membre MeeWav'),
  coalesce(profile.profile_image_url, profile.avatar_url),
  award.recipient_display_name_snapshot, award.recipient_avatar_url_snapshot,
  award.created_at, 'backfill_current'
)
from public.room_gift_awards_v1 award
left join public.profiles profile on profile.id = award.awarded_by_snapshot
where award.gift_code = 'la-certif'
  and award.recipient_profile_id is not null;

-- A withdrawal is final for that event. A recipient-only hide can be restored.
-- The immutable source gift remains intact for support/audit.
create or replace function public.profile_set_my_certif_state_v1(
  p_endorsement_id uuid,
  p_action text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_action text := lower(btrim(coalesce(p_action, '')));
  v_endorsement public.profile_certif_endorsements_v1%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'profile_certif_authentication_required';
  end if;
  select * into v_endorsement
  from public.profile_certif_endorsements_v1 endorsement
  where endorsement.id = p_endorsement_id
    and (
      endorsement.sender_profile_id_snapshot = v_user_id
      or endorsement.recipient_profile_id_snapshot = v_user_id
    )
  for update;
  if v_endorsement.id is null then
    raise exception using errcode = 'P0002', message = 'profile_certif_endorsement_not_found';
  end if;

  if v_action = 'withdraw' then
    if v_endorsement.sender_profile_id_snapshot <> v_user_id then
      raise exception using errcode = '42501', message = 'profile_certif_sender_required';
    end if;
    if v_endorsement.state = 'withdrawn' then
      return jsonb_build_object('id', v_endorsement.id, 'state', v_endorsement.state);
    end if;
    if v_endorsement.state not in ('active', 'hidden_by_recipient') then
      raise exception using errcode = '55000', message = 'profile_certif_state_conflict';
    end if;
    update public.profile_certif_endorsements_v1
    set state = 'withdrawn', ended_at = now(), ended_by = v_user_id, updated_at = now()
    where id = v_endorsement.id
    returning * into v_endorsement;
  elsif v_action = 'hide' then
    if v_endorsement.recipient_profile_id_snapshot <> v_user_id then
      raise exception using errcode = '42501', message = 'profile_certif_recipient_required';
    end if;
    if v_endorsement.state = 'hidden_by_recipient' then
      return jsonb_build_object('id', v_endorsement.id, 'state', v_endorsement.state);
    end if;
    if v_endorsement.state <> 'active' then
      raise exception using errcode = '55000', message = 'profile_certif_state_conflict';
    end if;
    update public.profile_certif_endorsements_v1
    set state = 'hidden_by_recipient', ended_at = now(), ended_by = v_user_id, updated_at = now()
    where id = v_endorsement.id
    returning * into v_endorsement;
  elsif v_action = 'restore_visibility' then
    if v_endorsement.recipient_profile_id_snapshot <> v_user_id then
      raise exception using errcode = '42501', message = 'profile_certif_recipient_required';
    end if;
    if v_endorsement.state = 'active' then
      return jsonb_build_object('id', v_endorsement.id, 'state', v_endorsement.state);
    end if;
    if v_endorsement.state <> 'hidden_by_recipient' then
      raise exception using errcode = '55000', message = 'profile_certif_state_conflict';
    end if;
    update public.profile_certif_endorsements_v1
    set state = 'active', ended_at = null, ended_by = null, updated_at = now()
    where id = v_endorsement.id
    returning * into v_endorsement;
  else
    raise exception using errcode = '22023', message = 'profile_certif_action_invalid';
  end if;

  return jsonb_build_object('id', v_endorsement.id, 'state', v_endorsement.state);
end;
$$;

create or replace function public.profile_moderate_certif_v1(p_endorsement_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception using errcode = '42501', message = 'profile_certif_service_role_required';
  end if;
  update public.profile_certif_endorsements_v1
  set state = 'moderated', ended_at = coalesce(ended_at, now()), ended_by = null, updated_at = now()
  where id = p_endorsement_id
    and state <> 'moderated';
end;
$$;

-- Safe Profile projection. Every sender contributes at most once: the latest
-- event wins, including a withdrawal/hide, so an older Certif cannot reappear.
-- Sender identity is included only while that sender has a public non-ghost
-- profile. Raw follower snapshots never become an official influence score.
create or replace function public.get_profile_certif_summary_v1(p_profile_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_allowed boolean := false;
  v_unique_endorsers integer := 0;
  v_high_grade_endorsers integer := 0;
  v_verified_endorsers integer := 0;
  v_recent jsonb := '[]'::jsonb;
begin
  if p_profile_id is null then return null; end if;
  select (
    profile.id = auth.uid()
    or (
      coalesce(profile.show_on_public_profile, false)
      and not coalesce(profile.is_ghost_mode, true)
    )
  ) into v_allowed
  from public.profiles profile
  where profile.id = p_profile_id;
  if not coalesce(v_allowed, false) then return null; end if;

  with ranked as (
    select endorsement.*,
      row_number() over (
        partition by endorsement.sender_profile_id_snapshot
        order by endorsement.endorsed_at desc, endorsement.created_at desc, endorsement.id desc
      ) as sender_rank
    from public.profile_certif_endorsements_v1 endorsement
    where endorsement.recipient_profile_id_snapshot = p_profile_id
  ), active_latest as (
    select * from ranked where sender_rank = 1 and state = 'active'
  )
  select count(*)::integer,
    count(*) filter (where sender_grade_level_snapshot >= 4)::integer,
    count(*) filter (where sender_verified_snapshot)::integer
  into v_unique_endorsers, v_high_grade_endorsers, v_verified_endorsers
  from active_latest;

  with ranked as (
    select endorsement.*,
      row_number() over (
        partition by endorsement.sender_profile_id_snapshot
        order by endorsement.endorsed_at desc, endorsement.created_at desc, endorsement.id desc
      ) as sender_rank
    from public.profile_certif_endorsements_v1 endorsement
    where endorsement.recipient_profile_id_snapshot = p_profile_id
  ), visible_recent as (
    select endorsement.*
    from ranked endorsement
    join public.profiles sender on sender.id = endorsement.sender_profile_id_snapshot
    where endorsement.sender_rank = 1
      and endorsement.state = 'active'
      and coalesce(sender.show_on_public_profile, false)
      and not coalesce(sender.is_ghost_mode, true)
    order by endorsement.endorsed_at desc, endorsement.id desc
    limit 12
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'display_name', sender_display_name_snapshot,
    'avatar_url', sender_avatar_url_snapshot,
    'grade_level_at_endorsement', sender_grade_level_snapshot,
    'followers_at_endorsement', sender_followers_count_snapshot,
    'was_verified_at_endorsement', sender_verified_snapshot,
    'endorsed_at', endorsed_at,
    'snapshot_quality', snapshot_quality
  ) order by endorsed_at desc), '[]'::jsonb)
  into v_recent
  from visible_recent;

  return jsonb_build_object(
    'profile_id', p_profile_id,
    'kind', 'signed_community_endorsements',
    'display_label', 'Validations reçues',
    'official_meewav_verification', false,
    'unique_endorsers', v_unique_endorsers,
    'high_grade_endorsers', v_high_grade_endorsers,
    'verified_endorsers', v_verified_endorsers,
    'signal_context_version', 'profile-signals-v1',
    'recent_public_endorsers', v_recent,
    'disclaimer', 'Éloges signées par des membres ; ne constituent pas une vérification officielle MeeWav.'
  );
end;
$$;

revoke all on function public.profile_capture_certif_endorsement_v1(
  text, uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, text
) from public, anon, authenticated, service_role;
revoke all on function public.profile_capture_direct_certif_trigger_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.profile_capture_draw_certif_trigger_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.profile_set_my_certif_state_v1(uuid, text)
  from public, anon, authenticated;
grant execute on function public.profile_set_my_certif_state_v1(uuid, text)
  to authenticated;
revoke all on function public.profile_moderate_certif_v1(uuid)
  from public, anon, authenticated;
grant execute on function public.profile_moderate_certif_v1(uuid)
  to service_role;
revoke all on function public.get_profile_certif_summary_v1(uuid)
  from public, anon, authenticated;
grant execute on function public.get_profile_certif_summary_v1(uuid)
  to anon, authenticated;

comment on table public.profile_certif_endorsements_v1 is
  'Signed community endorsements derived from La Certif gifts. Not an official MeeWav verification, grade, entitlement or financial signal.';
comment on column public.profile_certif_endorsements_v1.sender_grade_level_snapshot is
  'Canonical sender grade at capture time; immutable context only and never a grade mutation.';
comment on column public.profile_certif_endorsements_v1.sender_followers_count_snapshot is
  'Raw reach context at capture time; deliberately not converted into an official influence score.';
comment on function public.get_profile_certif_summary_v1(uuid) is
  'Safe public/owner Profile projection. Deduplicates by sender and exposes no official certification claim.';

-- Durable, transferable Profile gift inventory.
--
-- This migration is deliberately additive: the existing Room draw/delivery
-- ledgers remain the source of truth for their original actions and their RPC
-- signatures are unchanged. Inventory enforcement is attached transactionally
-- through server-side triggers, so an insufficient balance rolls the original
-- Room operation back without exposing write access to browser roles.

create table if not exists public.profile_gift_inventory_v1 (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  gift_code text not null check (
    gift_code in (
      'force-card', 'vip-pass', 'private-access',
      'golden-like', 'supporter-bonus', 'la-certif'
    )
  ),
  available_quantity integer not null default 0
    check (available_quantity between 0 and 1000000),
  reserved_quantity integer not null default 0
    check (reserved_quantity between 0 and 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, gift_code),
  check (available_quantity + reserved_quantity <= 1000000)
);

-- Every balance mutation has one immutable, payload-bound movement. The
-- resulting balances make support reconciliation possible without replaying
-- the entire ledger for ordinary reads.
create table if not exists public.profile_gift_inventory_movements_v1 (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  gift_code text not null check (
    gift_code in (
      'force-card', 'vip-pass', 'private-access',
      'golden-like', 'supporter-bonus', 'la-certif'
    )
  ),
  movement_kind text not null
    check (movement_kind in ('grant', 'reserve', 'consume', 'release')),
  available_delta integer not null,
  reserved_delta integer not null,
  available_after integer not null check (available_after between 0 and 1000000),
  reserved_after integer not null check (reserved_after between 0 and 1000000),
  source_kind text not null check (
    char_length(source_kind) between 2 and 64
    and source_kind ~ '^[a-z0-9][a-z0-9_-]+$'
  ),
  source_id text not null check (
    char_length(source_id) between 1 and 180
    and octet_length(source_id) <= 512
    and source_id !~ '[[:cntrl:]]'
  ),
  idempotency_key text not null check (
    char_length(idempotency_key) between 8 and 320
    and octet_length(idempotency_key) <= 320
  ),
  created_at timestamptz not null default now(),
  unique (profile_id, idempotency_key),
  check (available_delta <> 0 or reserved_delta <> 0),
  check (available_after + reserved_after <= 1000000),
  check (
    (movement_kind = 'grant' and available_delta > 0 and reserved_delta = 0)
    or (
      movement_kind = 'reserve'
      and available_delta < 0
      and reserved_delta > 0
      and available_delta + reserved_delta = 0
    )
    or (movement_kind = 'consume' and available_delta = 0 and reserved_delta < 0)
    or (
      movement_kind = 'release'
      and available_delta > 0
      and reserved_delta < 0
      and available_delta + reserved_delta = 0
    )
  )
);

-- A reservation binds one inventory unit to one durable Room operation. It is
-- private implementation state: clients can neither inspect nor mutate it.
create table if not exists public.profile_gift_inventory_reservations_v1 (
  id uuid primary key default gen_random_uuid(),
  -- The nullable live FK is deliberately SET NULL instead of CASCADE. A
  -- scheduled Room operation may outlive an account deletion; keeping its
  -- reservation lets workers terminalize that one operation without rolling
  -- back an entire due batch. The immutable snapshot remains for audit.
  profile_id uuid references public.profiles(id) on delete set null,
  owner_profile_id_snapshot uuid not null,
  owner_deleted_at timestamptz,
  gift_code text not null check (
    gift_code in (
      'force-card', 'vip-pass', 'private-access',
      'golden-like', 'supporter-bonus', 'la-certif'
    )
  ),
  quantity integer not null check (quantity between 1 and 1000),
  consumer_kind text not null check (consumer_kind in ('room_draw', 'room_delivery')),
  consumer_id uuid not null,
  status text not null default 'reserved'
    check (status in ('reserved', 'consumed', 'released')),
  finalization_reason text check (
    finalization_reason is null
    or finalization_reason in (
      'delivered', 'cancelled', 'source_deleted',
      'owner_deleted_committed', 'owner_deleted_cancelled',
      'recipient_deleted'
    )
  ),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  unique (consumer_kind, consumer_id),
  check ((profile_id is not null and owner_deleted_at is null) or owner_deleted_at is not null),
  check (
    (status = 'reserved' and finalized_at is null and finalization_reason is null)
    or (status <> 'reserved' and finalized_at is not null and finalization_reason is not null)
  )
);

-- Deploy observe-only. Enforcement is an explicit, service-role cutover that
-- seeds stock and flips this singleton in one transaction. This prevents
-- already-shipped Web/iOS clients from suddenly failing with zero balances.
create table if not exists public.profile_gift_inventory_runtime_v1 (
  singleton boolean primary key default true check (singleton),
  enforcement_mode text not null default 'observe'
    check (enforcement_mode in ('observe', 'enforce')),
  installed_at timestamptz not null default clock_timestamp(),
  enforcement_started_at timestamptz,
  activation_key text,
  activation_seed_hash text,
  check (singleton = true),
  check (
    (
      enforcement_mode = 'observe'
      and enforcement_started_at is null
      and activation_key is null
      and activation_seed_hash is null
    )
    or (
      enforcement_mode = 'enforce'
      and enforcement_started_at is not null
      and activation_key is not null
      and char_length(activation_key) between 8 and 80
      and activation_seed_hash is not null
      and activation_seed_hash ~ '^[0-9a-f]{64}$'
    )
  )
);

-- Durable classification independent of transaction-level now()/created_at.
-- In particular, a `round/ready` INSERT crosses cutover without reserving yet,
-- so its later expediable UPDATE needs this marker to know it is not legacy.
create table if not exists public.profile_gift_inventory_enforced_sources_v1 (
  consumer_kind text not null check (consumer_kind in ('room_draw', 'room_delivery')),
  consumer_id uuid not null,
  enforcement_started_at timestamptz not null,
  marked_at timestamptz not null default clock_timestamp(),
  primary key (consumer_kind, consumer_id)
);

create index if not exists profile_gift_inventory_movements_profile_created_idx
  on public.profile_gift_inventory_movements_v1(profile_id, created_at desc);
create index if not exists profile_gift_inventory_reservations_profile_status_idx
  on public.profile_gift_inventory_reservations_v1(profile_id, status, created_at desc);

alter table public.profile_gift_inventory_v1 enable row level security;
alter table public.profile_gift_inventory_movements_v1 enable row level security;
alter table public.profile_gift_inventory_reservations_v1 enable row level security;
alter table public.profile_gift_inventory_runtime_v1 enable row level security;
alter table public.profile_gift_inventory_enforced_sources_v1 enable row level security;

drop policy if exists profile_gift_inventory_v1_owner_read
  on public.profile_gift_inventory_v1;
create policy profile_gift_inventory_v1_owner_read
on public.profile_gift_inventory_v1 for select to authenticated
using (profile_id = auth.uid());

revoke all on table public.profile_gift_inventory_v1 from public, anon, authenticated;
revoke all on table public.profile_gift_inventory_movements_v1 from public, anon, authenticated;
revoke all on table public.profile_gift_inventory_reservations_v1 from public, anon, authenticated;
revoke all on table public.profile_gift_inventory_runtime_v1 from public, anon, authenticated;
revoke all on table public.profile_gift_inventory_enforced_sources_v1 from public, anon, authenticated;
grant select on table public.profile_gift_inventory_v1 to service_role;
grant select on table public.profile_gift_inventory_movements_v1 to service_role;
grant select on table public.profile_gift_inventory_reservations_v1 to service_role;
grant select on table public.profile_gift_inventory_runtime_v1 to service_role;
grant select on table public.profile_gift_inventory_enforced_sources_v1 to service_role;

create or replace function public.profile_apply_gift_inventory_movement_v1(
  p_profile_id uuid,
  p_gift_code text,
  p_movement_kind text,
  p_available_delta integer,
  p_reserved_delta integer,
  p_source_kind text,
  p_source_id text,
  p_idempotency_key text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_gift_code text := lower(btrim(coalesce(p_gift_code, '')));
  v_movement_kind text := lower(btrim(coalesce(p_movement_kind, '')));
  v_source_kind text := lower(btrim(coalesce(p_source_kind, '')));
  v_source_id text := btrim(coalesce(p_source_id, ''));
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_inventory public.profile_gift_inventory_v1%rowtype;
  v_existing public.profile_gift_inventory_movements_v1%rowtype;
  v_available_after integer;
  v_reserved_after integer;
begin
  if p_profile_id is null then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_profile_required';
  end if;
  if v_gift_code not in (
    'force-card', 'vip-pass', 'private-access',
    'golden-like', 'supporter-bonus', 'la-certif'
  ) then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_gift_invalid';
  end if;
  if v_movement_kind not in ('grant', 'reserve', 'consume', 'release') then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_movement_invalid';
  end if;
  if p_available_delta is null or p_reserved_delta is null then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_delta_required';
  end if;
  if not (
    (v_movement_kind = 'grant' and p_available_delta > 0 and p_reserved_delta = 0)
    or (
      v_movement_kind = 'reserve'
      and p_available_delta < 0
      and p_reserved_delta > 0
      and p_available_delta + p_reserved_delta = 0
    )
    or (v_movement_kind = 'consume' and p_available_delta = 0 and p_reserved_delta < 0)
    or (
      v_movement_kind = 'release'
      and p_available_delta > 0
      and p_reserved_delta < 0
      and p_available_delta + p_reserved_delta = 0
    )
  ) then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_delta_invalid';
  end if;
  if char_length(v_source_kind) not between 2 and 64
     or v_source_kind !~ '^[a-z0-9][a-z0-9_-]+$'
     or char_length(v_source_id) not between 1 and 180
     or octet_length(v_source_id) > 512
     or v_source_id ~ '[[:cntrl:]]'
     or char_length(v_idempotency_key) not between 8 and 320
     or octet_length(v_idempotency_key) > 320 then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_source_invalid';
  end if;

  -- Parent-first locking avoids a profile-deletion cycle (Profile → FK child)
  -- against an inventory mutation (inventory → Profile FK check).
  perform 1 from public.profiles profile
  where profile.id = p_profile_id
  for key share;
  if not found then
    raise exception using errcode = '23503', message = 'profile_gift_inventory_profile_not_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'profile-gift-inventory:' || p_profile_id::text || ':' || v_gift_code,
    0
  ));

  select * into v_existing
  from public.profile_gift_inventory_movements_v1 movement
  where movement.profile_id = p_profile_id
    and movement.idempotency_key = v_idempotency_key;
  if v_existing.id is not null then
    if v_existing.gift_code is distinct from v_gift_code
       or v_existing.movement_kind is distinct from v_movement_kind
       or v_existing.available_delta is distinct from p_available_delta
       or v_existing.reserved_delta is distinct from p_reserved_delta
       or v_existing.source_kind is distinct from v_source_kind
       or v_existing.source_id is distinct from v_source_id then
      raise exception using errcode = '23505', message = 'profile_gift_inventory_idempotency_conflict';
    end if;
    return;
  end if;

  insert into public.profile_gift_inventory_v1 (
    profile_id, gift_code, available_quantity, reserved_quantity
  ) values (
    p_profile_id, v_gift_code, 0, 0
  ) on conflict (profile_id, gift_code) do nothing;

  select * into v_inventory
  from public.profile_gift_inventory_v1 inventory
  where inventory.profile_id = p_profile_id
    and inventory.gift_code = v_gift_code
  for update;

  v_available_after := v_inventory.available_quantity + p_available_delta;
  v_reserved_after := v_inventory.reserved_quantity + p_reserved_delta;
  if v_available_after < 0 then
    raise exception using errcode = '22003', message = 'profile_gift_inventory_insufficient_available';
  end if;
  if v_reserved_after < 0 then
    raise exception using errcode = '22003', message = 'profile_gift_inventory_insufficient_reserved';
  end if;
  if v_available_after + v_reserved_after > 1000000 then
    raise exception using errcode = '22003', message = 'profile_gift_inventory_balance_limit';
  end if;

  update public.profile_gift_inventory_v1
  set available_quantity = v_available_after,
      reserved_quantity = v_reserved_after,
      updated_at = now()
  where profile_id = p_profile_id and gift_code = v_gift_code;

  insert into public.profile_gift_inventory_movements_v1 (
    profile_id, gift_code, movement_kind,
    available_delta, reserved_delta, available_after, reserved_after,
    source_kind, source_id, idempotency_key
  ) values (
    p_profile_id, v_gift_code, v_movement_kind,
    p_available_delta, p_reserved_delta, v_available_after, v_reserved_after,
    v_source_kind, v_source_id, v_idempotency_key
  );
end;
$$;

-- Worker-safe variant: lock both live Profiles in canonical UUID order, but
-- return false when privacy deletion won the race. Callers can then release or
-- terminalize the preserved reservation instead of aborting a whole batch.
create or replace function public.profile_try_lock_gift_inventory_pair_v1(
  p_first_profile_id uuid,
  p_second_profile_id uuid,
  p_gift_code text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_gift_code text := lower(btrim(coalesce(p_gift_code, '')));
  v_low_profile_id uuid;
  v_high_profile_id uuid;
begin
  if p_first_profile_id is null or p_second_profile_id is null then return false; end if;
  if p_first_profile_id::text <= p_second_profile_id::text then
    v_low_profile_id := p_first_profile_id;
    v_high_profile_id := p_second_profile_id;
  else
    v_low_profile_id := p_second_profile_id;
    v_high_profile_id := p_first_profile_id;
  end if;
  perform 1 from public.profiles profile
  where profile.id = v_low_profile_id
  for key share;
  if not found then return false; end if;
  if v_high_profile_id <> v_low_profile_id then
    perform 1 from public.profiles profile
    where profile.id = v_high_profile_id
    for key share;
    if not found then return false; end if;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'profile-gift-inventory:' || v_low_profile_id::text || ':' || v_gift_code,
    0
  ));
  if v_high_profile_id <> v_low_profile_id then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
      'profile-gift-inventory:' || v_high_profile_id::text || ':' || v_gift_code,
      0
    ));
  end if;
  return true;
end;
$$;

-- Strict command variant used for newly submitted operations. Missing live
-- Profiles are a validation failure rather than a worker tombstone.
create or replace function public.profile_lock_gift_inventory_pair_v1(
  p_first_profile_id uuid,
  p_second_profile_id uuid,
  p_gift_code text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.profile_try_lock_gift_inventory_pair_v1(
    p_first_profile_id, p_second_profile_id, p_gift_code
  ) then
    raise exception using errcode = '23503', message = 'profile_gift_inventory_profile_not_found';
  end if;
end;
$$;

create or replace function public.profile_reserve_gift_inventory_v1(
  p_profile_id uuid,
  p_gift_code text,
  p_quantity integer,
  p_consumer_kind text,
  p_consumer_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_consumer_kind text := lower(btrim(coalesce(p_consumer_kind, '')));
  v_gift_code text := lower(btrim(coalesce(p_gift_code, '')));
  v_existing public.profile_gift_inventory_reservations_v1%rowtype;
  v_reservation_id uuid := extensions.gen_random_uuid();
begin
  if p_profile_id is null
     or p_consumer_id is null
     or p_quantity is null
     or p_quantity not between 1 and 1000
     or v_consumer_kind not in ('room_draw', 'room_delivery') then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_reservation_invalid';
  end if;

  perform 1 from public.profiles profile
  where profile.id = p_profile_id
  for key share;
  if not found then
    raise exception using errcode = '23503', message = 'profile_gift_inventory_profile_not_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'profile-gift-reservation:' || v_consumer_kind || ':' || p_consumer_id::text,
    0
  ));
  select * into v_existing
  from public.profile_gift_inventory_reservations_v1 reservation
  where reservation.consumer_kind = v_consumer_kind
    and reservation.consumer_id = p_consumer_id
  for update;
  if v_existing.id is not null then
    if v_existing.owner_profile_id_snapshot is distinct from p_profile_id
       or v_existing.gift_code is distinct from v_gift_code
       or v_existing.quantity is distinct from p_quantity then
      raise exception using errcode = '23505', message = 'profile_gift_inventory_reservation_conflict';
    end if;
    return v_existing.id;
  end if;

  perform public.profile_apply_gift_inventory_movement_v1(
    p_profile_id, v_gift_code, 'reserve', -p_quantity, p_quantity,
    v_consumer_kind, p_consumer_id::text,
    'reserve:' || v_consumer_kind || ':' || p_consumer_id::text
  );
  insert into public.profile_gift_inventory_reservations_v1 (
    id, profile_id, owner_profile_id_snapshot,
    gift_code, quantity, consumer_kind, consumer_id
  ) values (
    v_reservation_id, p_profile_id, p_profile_id, v_gift_code, p_quantity,
    v_consumer_kind, p_consumer_id
  );
  return v_reservation_id;
end;
$$;

create or replace function public.profile_finalize_gift_inventory_reservation_v1(
  p_consumer_kind text,
  p_consumer_id uuid,
  p_outcome text,
  p_reason text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_consumer_kind text := lower(btrim(coalesce(p_consumer_kind, '')));
  v_outcome text := lower(btrim(coalesce(p_outcome, '')));
  v_reason text := lower(btrim(coalesce(p_reason, '')));
  v_reservation public.profile_gift_inventory_reservations_v1%rowtype;
  v_profile_hint uuid;
  v_runtime_mode text;
  v_enforcement_started_at timestamptz;
  v_consumer_created_at timestamptz;
  v_consumer_action text;
  v_source_marked boolean := false;
begin
  if p_consumer_id is null
     or v_consumer_kind not in ('room_draw', 'room_delivery')
     or v_outcome not in ('consumed', 'released') then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_finalization_invalid';
  end if;
  if v_reason = '' then
    v_reason := case when v_outcome = 'consumed' then 'delivered' else 'cancelled' end;
  end if;
  if v_reason not in ('delivered', 'cancelled', 'source_deleted', 'recipient_deleted') then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_finalization_reason_invalid';
  end if;

  select reservation.profile_id into v_profile_hint
  from public.profile_gift_inventory_reservations_v1 reservation
  where reservation.consumer_kind = v_consumer_kind
    and reservation.consumer_id = p_consumer_id;
  if v_profile_hint is not null then
    perform 1 from public.profiles profile
    where profile.id = v_profile_hint
    for key share;
    -- A concurrent privacy deletion owns the parent lock first. Once it
    -- completes, reload the preserved reservation below and terminalize its
    -- audit without touching the deleted balance.
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'profile-gift-reservation:' || v_consumer_kind || ':' || p_consumer_id::text,
    0
  ));
  select * into v_reservation
  from public.profile_gift_inventory_reservations_v1 reservation
  where reservation.consumer_kind = v_consumer_kind
    and reservation.consumer_id = p_consumer_id
  for update;

  if v_reservation.id is null then
    select runtime.enforcement_mode, runtime.enforcement_started_at
      into v_runtime_mode, v_enforcement_started_at
    from public.profile_gift_inventory_runtime_v1 runtime
    where runtime.singleton;
    if v_consumer_kind = 'room_draw' then
      select draw.created_at into v_consumer_created_at
      from public.room_gift_draws_v1 draw where draw.id = p_consumer_id;
    else
      select delivery.created_at, delivery.action
        into v_consumer_created_at, v_consumer_action
      from public.room_gift_deliveries_v1 delivery where delivery.id = p_consumer_id;
    end if;
    select exists (
      select 1
      from public.profile_gift_inventory_enforced_sources_v1 source
      where source.consumer_kind = v_consumer_kind
        and source.consumer_id = p_consumer_id
    ) into v_source_marked;
    -- Observe-mode and pre-cutover ledgers are intentionally unreserved.
    -- Deleted ledgers have no recipient-credit side effect left to protect.
    if v_source_marked and v_consumer_action = 'round' then
      return false;
    end if;
    if not v_source_marked and (
      v_runtime_mode is distinct from 'enforce'
      or v_enforcement_started_at is null
      or v_consumer_created_at is null
      or v_consumer_action = 'round'
      or v_consumer_created_at < v_enforcement_started_at
    ) then return false; end if;
    raise exception using errcode = '55000', message = 'profile_gift_inventory_reservation_missing';
  end if;
  -- Terminal ledgers can later be purged without trying to reverse an already
  -- consumed prize. Replays and cleanup are therefore harmless no-ops.
  if v_reservation.status <> 'reserved' then return false; end if;

  if v_reservation.profile_id is not null then
    perform 1 from public.profiles profile
    where profile.id = v_reservation.profile_id
    for key share;
    if not found then
      raise exception using errcode = '55000', message = 'profile_gift_inventory_reservation_owner_state_invalid';
    end if;
  elsif v_reservation.owner_deleted_at is null then
    raise exception using errcode = '55000', message = 'profile_gift_inventory_reservation_owner_state_invalid';
  end if;

  if v_reservation.profile_id is not null and v_outcome = 'consumed' then
    perform public.profile_apply_gift_inventory_movement_v1(
      v_reservation.profile_id, v_reservation.gift_code,
      'consume', 0, -v_reservation.quantity,
      v_consumer_kind, p_consumer_id::text,
      'consume:' || v_consumer_kind || ':' || p_consumer_id::text
    );
  elsif v_reservation.profile_id is not null then
    perform public.profile_apply_gift_inventory_movement_v1(
      v_reservation.profile_id, v_reservation.gift_code,
      'release', v_reservation.quantity, -v_reservation.quantity,
      v_consumer_kind, p_consumer_id::text,
      'release:' || v_consumer_kind || ':' || p_consumer_id::text
    );
  end if;

  if v_reservation.profile_id is null then
    v_reason := case
      when v_outcome = 'consumed' then 'owner_deleted_committed'
      when v_reason = 'recipient_deleted' then 'recipient_deleted'
      else 'owner_deleted_cancelled'
    end;
  end if;

  update public.profile_gift_inventory_reservations_v1
  set status = v_outcome,
      finalization_reason = v_reason,
      finalized_at = now()
  where id = v_reservation.id;
  return true;
end;
$$;

create or replace function public.profile_grant_gift_inventory_unit_v1(
  p_profile_id uuid,
  p_gift_code text,
  p_quantity integer,
  p_source_kind text,
  p_source_id text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_quantity is null or p_quantity not between 1 and 1000 then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_grant_quantity_invalid';
  end if;
  perform public.profile_apply_gift_inventory_movement_v1(
    p_profile_id, p_gift_code, 'grant', p_quantity, 0,
    p_source_kind, p_source_id,
    'grant:' || lower(btrim(p_source_kind)) || ':' || btrim(p_source_id)
  );
end;
$$;

-- Owner-only read projection. Returning every canonical code keeps the UI
-- deterministic while still distinguishing an actual zero balance from a
-- missing client-side catalogue entry.
create or replace function public.profile_list_my_gift_inventory_v1()
returns table (
  gift_code text,
  available_quantity integer,
  reserved_quantity integer,
  total_quantity integer,
  updated_at timestamptz,
  enforcement_active boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then
    raise exception using errcode = '42501', message = 'profile_gift_inventory_authentication_required';
  end if;
  return query
  with canonical(gift_code, ordinal) as (
    values
      ('force-card'::text, 1),
      ('vip-pass'::text, 2),
      ('private-access'::text, 3),
      ('golden-like'::text, 4),
      ('supporter-bonus'::text, 5),
      ('la-certif'::text, 6)
  )
  select
    canonical.gift_code,
    coalesce(inventory.available_quantity, 0)::integer,
    coalesce(inventory.reserved_quantity, 0)::integer,
    (coalesce(inventory.available_quantity, 0) + coalesce(inventory.reserved_quantity, 0))::integer,
    inventory.updated_at,
    coalesce((
      select runtime.enforcement_mode = 'enforce'
      from public.profile_gift_inventory_runtime_v1 runtime
      where runtime.singleton
    ), false)
  from canonical
  left join public.profile_gift_inventory_v1 inventory
    on inventory.profile_id = v_profile_id
   and inventory.gift_code = canonical.gift_code
  order by canonical.ordinal;
end;
$$;

-- Trusted campaign/admin grant hook. Browser roles never receive EXECUTE.
create or replace function public.profile_grant_gift_inventory_v1(
  p_profile_id uuid,
  p_gift_code text,
  p_quantity integer,
  p_source_kind text,
  p_source_id text,
  p_idempotency_key text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception using errcode = '42501', message = 'profile_gift_inventory_service_role_required';
  end if;
  if p_quantity is null or p_quantity not between 1 and 1000 then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_grant_quantity_invalid';
  end if;
  if char_length(btrim(coalesce(p_idempotency_key, ''))) not between 8 and 240
     or octet_length(btrim(coalesce(p_idempotency_key, ''))) > 240 then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_grant_idempotency_invalid';
  end if;
  perform public.profile_apply_gift_inventory_movement_v1(
    p_profile_id, p_gift_code, 'grant', p_quantity, 0,
    p_source_kind, p_source_id,
    'external:' || btrim(coalesce(p_idempotency_key, ''))
  );
end;
$$;

create or replace function public.profile_should_enforce_gift_inventory_v1(
  p_source_created_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select runtime.enforcement_mode = 'enforce'
      and runtime.enforcement_started_at is not null
      and p_source_created_at >= runtime.enforcement_started_at
    from public.profile_gift_inventory_runtime_v1 runtime
    where runtime.singleton
  ), false);
$$;

create or replace function public.profile_gift_inventory_is_active_v1()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select runtime.enforcement_mode = 'enforce'
    from public.profile_gift_inventory_runtime_v1 runtime
    where runtime.singleton
  ), false);
$$;

create or replace function public.profile_require_gift_inventory_read_committed_v1()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception using
      errcode = '0A000',
      message = 'profile_gift_inventory_read_committed_required';
  end if;
end;
$$;

create or replace function public.profile_mark_gift_inventory_source_enforced_v1(
  p_consumer_kind text,
  p_consumer_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_consumer_kind text := lower(btrim(coalesce(p_consumer_kind, '')));
  v_enforcement_started_at timestamptz;
begin
  if p_consumer_id is null or v_consumer_kind not in ('room_draw', 'room_delivery') then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_source_marker_invalid';
  end if;
  select runtime.enforcement_started_at into v_enforcement_started_at
  from public.profile_gift_inventory_runtime_v1 runtime
  where runtime.singleton and runtime.enforcement_mode = 'enforce';
  if v_enforcement_started_at is null then
    raise exception using errcode = '55000', message = 'profile_gift_inventory_runtime_not_active';
  end if;
  insert into public.profile_gift_inventory_enforced_sources_v1 (
    consumer_kind, consumer_id, enforcement_started_at
  ) values (
    v_consumer_kind, p_consumer_id, v_enforcement_started_at
  ) on conflict (consumer_kind, consumer_id) do nothing;
end;
$$;

-- Explicit cutover: a trusted operator supplies the initial stock and flips
-- enforcement in the same transaction. The source-table locks drain all
-- in-flight Room writes before the cutoff, leaving no observe/enforce gap.
create or replace function public.profile_activate_gift_inventory_v1(
  p_activation_key text,
  p_seed jsonb default '[]'::jsonb
)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_activation_key text := btrim(coalesce(p_activation_key, ''));
  v_seed jsonb := coalesce(p_seed, 'null'::jsonb);
  v_seed_hash text;
  v_runtime public.profile_gift_inventory_runtime_v1%rowtype;
  v_item jsonb;
  v_profile_id_text text;
  v_profile_id uuid;
  v_gift_code text;
  v_quantity_text text;
  v_quantity integer;
  v_started_at timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    raise exception using errcode = '42501', message = 'profile_gift_inventory_service_role_required';
  end if;
  perform public.profile_require_gift_inventory_read_committed_v1();
  if char_length(v_activation_key) not between 8 and 80
     or octet_length(v_activation_key) > 80
     or v_activation_key ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_activation_key_invalid';
  end if;
  if jsonb_typeof(v_seed) <> 'array' then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_activation_seed_invalid';
  end if;
  if jsonb_array_length(v_seed) > 10000 then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_activation_seed_invalid';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_seed) as seed(seed_item)
    group by
      lower(btrim(coalesce(seed.seed_item ->> 'profile_id', ''))),
      lower(btrim(coalesce(seed.seed_item ->> 'gift_code', '')))
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'profile_gift_inventory_activation_seed_duplicate';
  end if;
  v_seed_hash := encode(extensions.digest(convert_to(v_seed::text, 'UTF8'), 'sha256'), 'hex');

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'profile-gift-inventory:activation', 0
  ));
  lock table public.room_gift_draws_v1 in share row exclusive mode;
  lock table public.room_gift_awards_v1 in share row exclusive mode;
  lock table public.room_gift_deliveries_v1 in share row exclusive mode;

  select * into v_runtime
  from public.profile_gift_inventory_runtime_v1 runtime
  where runtime.singleton
  for update;
  if v_runtime.singleton is null then
    raise exception using errcode = '55000', message = 'profile_gift_inventory_runtime_missing';
  end if;
  if v_runtime.enforcement_mode = 'enforce' then
    if v_runtime.activation_key is distinct from v_activation_key
       or v_runtime.activation_seed_hash is distinct from v_seed_hash then
      raise exception using errcode = '23505', message = 'profile_gift_inventory_activation_conflict';
    end if;
    return v_runtime.enforcement_started_at;
  end if;

  -- Observe-mode sends are intentionally not auto-credited: otherwise a
  -- fail-open legacy client could farm unlimited future stock. The reviewed
  -- seed is the single explicit source for any approved observe-window awards.
  for v_item in select value from jsonb_array_elements(v_seed)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception using errcode = '22023', message = 'profile_gift_inventory_activation_seed_invalid';
    end if;
    v_profile_id_text := btrim(coalesce(v_item ->> 'profile_id', ''));
    v_gift_code := lower(btrim(coalesce(v_item ->> 'gift_code', '')));
    v_quantity_text := btrim(coalesce(v_item ->> 'quantity', ''));
    if v_profile_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or v_gift_code not in (
         'force-card', 'vip-pass', 'private-access',
         'golden-like', 'supporter-bonus', 'la-certif'
       )
       or v_quantity_text !~ '^[1-9][0-9]{0,3}$' then
      raise exception using errcode = '22023', message = 'profile_gift_inventory_activation_seed_invalid';
    end if;
    v_profile_id := v_profile_id_text::uuid;
    v_quantity := v_quantity_text::integer;
    if v_quantity > 1000 then
      raise exception using errcode = '22023', message = 'profile_gift_inventory_activation_seed_invalid';
    end if;
    perform public.profile_grant_gift_inventory_unit_v1(
      v_profile_id, v_gift_code, v_quantity,
      'cutover_seed',
      v_activation_key || ':' || v_profile_id::text || ':' || v_gift_code
    );
  end loop;

  v_started_at := clock_timestamp();
  update public.profile_gift_inventory_runtime_v1
  set enforcement_mode = 'enforce',
      enforcement_started_at = v_started_at,
      activation_key = v_activation_key,
      activation_seed_hash = v_seed_hash
  where singleton;
  return v_started_at;
end;
$$;

create or replace function public.profile_reject_gift_inventory_movement_mutation_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  -- Preserve privacy deletion: a cascading cleanup caused by deleting the
  -- owning Profile may remove its now-unlinkable ledger. Ordinary direct
  -- movement mutation remains forbidden, including to service_role.
  if tg_op = 'DELETE' and not exists (
    select 1 from public.profiles profile where profile.id = old.profile_id
  ) then
    return old;
  end if;
  raise exception using errcode = '55000', message = 'profile_gift_inventory_movements_are_append_only';
end;
$$;

drop trigger if exists profile_gift_inventory_movements_immutable_v1
  on public.profile_gift_inventory_movements_v1;
create trigger profile_gift_inventory_movements_immutable_v1
before update or delete on public.profile_gift_inventory_movements_v1
for each row execute function public.profile_reject_gift_inventory_movement_mutation_v1();

-- Preserve enough non-public audit state before the live Profile FK is SET
-- NULL. Workers can then consume a committed scheduled gift or release a
-- cancelled draw without resurrecting the deleted owner's balance.
create or replace function public.profile_mark_gift_inventory_owner_deleted_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.profile_gift_inventory_reservations_v1 reservation
  set owner_deleted_at = coalesce(reservation.owner_deleted_at, clock_timestamp())
  where reservation.profile_id = old.id;
  return old;
end;
$$;

drop trigger if exists profile_mark_gift_inventory_owner_deleted_v1
  on public.profiles;
create trigger profile_mark_gift_inventory_owner_deleted_v1
before delete on public.profiles
for each row execute function public.profile_mark_gift_inventory_owner_deleted_v1();

-- Credits from the existing immutable Room ledgers.
create or replace function public.profile_credit_room_gift_award_inventory_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reservation public.profile_gift_inventory_reservations_v1%rowtype;
  v_recipient_exists boolean;
  v_source_enforced boolean;
begin
  if not public.profile_gift_inventory_is_active_v1() then
    return new;
  end if;
  if new.recipient_profile_id is not null then
    select * into v_reservation
    from public.profile_gift_inventory_reservations_v1 reservation
    where reservation.consumer_kind = 'room_draw'
      and reservation.consumer_id = new.draw_id_snapshot;
    select exists (
      select 1 from public.profiles profile where profile.id = new.recipient_profile_id
    ) into v_recipient_exists;
    -- Credits require a consumed reservation, not a timestamp heuristic. This
    -- covers INSERTs released after cutover locks while rejecting observe-era
    -- draws that never reserved stock.
    v_source_enforced := v_reservation.id is not null
      and v_reservation.status = 'consumed';
    if not v_source_enforced then
      return new;
    end if;
    if not v_recipient_exists then
      if v_reservation.id is null and v_source_enforced then
        raise exception using errcode = '55000', message = 'profile_gift_inventory_award_reservation_missing';
      end if;
      return new;
    end if;
    if public.profile_try_lock_gift_inventory_pair_v1(
      new.awarded_by_snapshot, new.recipient_profile_id, new.gift_code
    ) then
      null;
    elsif v_reservation.id is not null
       and v_reservation.owner_profile_id_snapshot = new.awarded_by_snapshot
       and v_reservation.owner_deleted_at is not null
       and v_reservation.status = 'consumed' then
      if not public.profile_try_lock_gift_inventory_pair_v1(
        new.recipient_profile_id, new.recipient_profile_id, new.gift_code
      ) then
        return new;
      end if;
    else
      raise exception using errcode = '55000', message = 'profile_gift_inventory_award_owner_state_invalid';
    end if;
    perform public.profile_grant_gift_inventory_unit_v1(
      new.recipient_profile_id, new.gift_code, 1,
      'room_draw_award', new.id::text
    );
  end if;
  return new;
end;
$$;

create or replace function public.profile_credit_room_gift_delivery_inventory_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reservation public.profile_gift_inventory_reservations_v1%rowtype;
  v_recipient_exists boolean;
  v_source_enforced boolean;
begin
  if new.status <> 'sent' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.status is not distinct from 'sent' then
      return new;
    end if;
  end if;
  if not public.profile_gift_inventory_is_active_v1() then
    return new;
  end if;
  if new.status = 'sent' then
    select * into v_reservation
    from public.profile_gift_inventory_reservations_v1 reservation
    where reservation.consumer_kind = 'room_delivery'
      and reservation.consumer_id = new.id;
    select exists (
      select 1 from public.profiles profile
      where profile.id = new.recipient_profile_id_snapshot
    ) into v_recipient_exists;
    v_source_enforced := v_reservation.id is not null
      and v_reservation.status = 'consumed';
    if not v_source_enforced then
      return new;
    end if;
    if v_reservation.id is null and new.action = 'round' then
      return new;
    end if;
    if not v_recipient_exists then
      if v_reservation.status = 'released'
         and v_reservation.finalization_reason = 'recipient_deleted' then
        return new;
      end if;
      if v_source_enforced then
        raise exception using errcode = '23503', message = 'profile_gift_inventory_delivery_recipient_missing';
      end if;
      return new;
    end if;
    if public.profile_try_lock_gift_inventory_pair_v1(
      new.sender_profile_id_snapshot, new.recipient_profile_id_snapshot, new.gift_code
    ) then
      null;
    elsif v_reservation.id is not null
       and v_reservation.owner_profile_id_snapshot = new.sender_profile_id_snapshot
       and v_reservation.owner_deleted_at is not null
       and v_reservation.status = 'consumed' then
      if not public.profile_try_lock_gift_inventory_pair_v1(
        new.recipient_profile_id_snapshot, new.recipient_profile_id_snapshot, new.gift_code
      ) then
        return new;
      end if;
    else
      raise exception using errcode = '55000', message = 'profile_gift_inventory_delivery_owner_state_invalid';
    end if;
    perform public.profile_grant_gift_inventory_unit_v1(
      new.recipient_profile_id_snapshot, new.gift_code, 1,
      'room_direct_delivery', new.id::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profile_credit_room_gift_award_inventory_v1
  on public.room_gift_awards_v1;
create trigger profile_credit_room_gift_award_inventory_v1
after insert on public.room_gift_awards_v1
for each row execute function public.profile_credit_room_gift_award_inventory_v1();

drop trigger if exists profile_credit_room_gift_delivery_inventory_v1
  on public.room_gift_deliveries_v1;
create trigger profile_credit_room_gift_delivery_inventory_v1
after insert or update of status on public.room_gift_deliveries_v1
for each row execute function public.profile_credit_room_gift_delivery_inventory_v1();

-- Transactional enforcement for new Room operations. These triggers preserve
-- every existing RPC signature and run inside the same transaction as its
-- original ledger write.
create or replace function public.profile_reserve_room_gift_draw_inventory_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_host_id uuid;
begin
  perform public.profile_require_gift_inventory_read_committed_v1();
  -- INSERT is classified from the runtime visible after the table-level
  -- cutover lock, never from now()/created_at (which may be transaction-old).
  if not public.profile_gift_inventory_is_active_v1() then
    return new;
  end if;
  perform public.profile_mark_gift_inventory_source_enforced_v1(
    'room_draw', new.id
  );
  select room.host_id into v_host_id
  from public.rooms_v2 room
  where room.id = new.room_id;
  if v_host_id is null then
    raise exception using errcode = '23503', message = 'profile_gift_inventory_room_host_missing';
  end if;
  perform public.profile_reserve_gift_inventory_v1(
    v_host_id, new.gift_code, 1, 'room_draw', new.id
  );
  return new;
end;
$$;

create or replace function public.profile_finalize_room_gift_draw_inventory_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reservation public.profile_gift_inventory_reservations_v1%rowtype;
  v_recipient_exists boolean;
begin
  if tg_op = 'DELETE' then
    perform public.profile_finalize_gift_inventory_reservation_v1(
      'room_draw', old.id, 'released', 'source_deleted'
    );
    return old;
  end if;
  if new.status = 'revealed' and old.status is distinct from 'revealed' then
    select * into v_reservation
    from public.profile_gift_inventory_reservations_v1 reservation
    where reservation.consumer_kind = 'room_draw'
      and reservation.consumer_id = new.id;
    select exists (
      select 1 from public.profiles profile where profile.id = new.winner_profile_id
    ) into v_recipient_exists;
    if not v_recipient_exists then
      perform public.profile_finalize_gift_inventory_reservation_v1(
        'room_draw', new.id, 'released', 'recipient_deleted'
      );
    else
      if v_reservation.profile_id is not null then
        if not public.profile_try_lock_gift_inventory_pair_v1(
          v_reservation.profile_id, new.winner_profile_id, new.gift_code
        ) then
          select * into v_reservation
          from public.profile_gift_inventory_reservations_v1 reservation
          where reservation.consumer_kind = 'room_draw'
            and reservation.consumer_id = new.id;
          if v_reservation.profile_id is null and v_reservation.owner_deleted_at is not null then
            if not public.profile_try_lock_gift_inventory_pair_v1(
              new.winner_profile_id, new.winner_profile_id, new.gift_code
            ) then
              perform public.profile_finalize_gift_inventory_reservation_v1(
                'room_draw', new.id, 'released', 'recipient_deleted'
              );
              return new;
            end if;
          else
            perform public.profile_finalize_gift_inventory_reservation_v1(
              'room_draw', new.id, 'released', 'recipient_deleted'
            );
            return new;
          end if;
        end if;
      elsif v_reservation.owner_deleted_at is not null then
        if not public.profile_try_lock_gift_inventory_pair_v1(
          new.winner_profile_id, new.winner_profile_id, new.gift_code
        ) then
          perform public.profile_finalize_gift_inventory_reservation_v1(
            'room_draw', new.id, 'released', 'recipient_deleted'
          );
          return new;
        end if;
      end if;
      perform public.profile_finalize_gift_inventory_reservation_v1(
        'room_draw', new.id, 'consumed'
      );
    end if;
  elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    perform public.profile_finalize_gift_inventory_reservation_v1(
      'room_draw', new.id, 'released'
    );
  end if;
  return new;
end;
$$;

create or replace function public.profile_reserve_room_gift_delivery_inventory_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_host_id uuid;
  v_reservation public.profile_gift_inventory_reservations_v1%rowtype;
  v_recipient_exists boolean;
  v_source_marked boolean := false;
begin
  -- Observe-mode and rows created before the explicit cutover retain their
  -- legacy behaviour. `round`/`ready` is not expediable in the current Room
  -- contract, so it must never hold stock indefinitely.
  if tg_op = 'INSERT' then
    perform public.profile_require_gift_inventory_read_committed_v1();
    -- An INSERT whose transaction began before activation can only reach this
    -- trigger after the activation lock commits. Runtime state is authoritative.
    if not public.profile_gift_inventory_is_active_v1() then
      return new;
    end if;
    perform public.profile_mark_gift_inventory_source_enforced_v1(
      'room_delivery', new.id
    );
  else
    select * into v_reservation
    from public.profile_gift_inventory_reservations_v1 reservation
    where reservation.consumer_kind = 'room_delivery'
      and reservation.consumer_id = new.id;
    select exists (
      select 1
      from public.profile_gift_inventory_enforced_sources_v1 source
      where source.consumer_kind = 'room_delivery'
        and source.consumer_id = new.id
    ) into v_source_marked;
    if v_reservation.id is null
       and not v_source_marked
       and not public.profile_should_enforce_gift_inventory_v1(new.created_at) then
      -- UPDATE keeps the creation cutoff only for genuinely historical,
      -- unreserved rows. A reservation proves the INSERT crossed cutover even
      -- when transaction-level now()/created_at is older than the cutoff.
      return new;
    end if;
  end if;
  if new.status = 'ready' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.status is not distinct from new.status then
      return new;
    end if;
  end if;

  if v_reservation.id is null then
    select * into v_reservation
    from public.profile_gift_inventory_reservations_v1 reservation
    where reservation.consumer_kind = 'room_delivery'
      and reservation.consumer_id = new.id;
  end if;
  if v_reservation.id is not null then
    if v_reservation.owner_profile_id_snapshot is distinct from new.sender_profile_id_snapshot
       or v_reservation.gift_code is distinct from new.gift_code then
      raise exception using errcode = '23505', message = 'profile_gift_inventory_reservation_conflict';
    end if;
    v_host_id := v_reservation.owner_profile_id_snapshot;
  else
    select room.host_id into v_host_id
    from public.rooms_v2 room
    where room.id = new.room_id_snapshot;
    if v_host_id is null or v_host_id <> new.sender_profile_id_snapshot then
      if new.action = 'round' then
        return new;
      end if;
      raise exception using errcode = '23503', message = 'profile_gift_inventory_delivery_host_mismatch';
    end if;
  end if;
  select exists (
    select 1 from public.profiles profile
    where profile.id = new.recipient_profile_id_snapshot
  ) into v_recipient_exists;

  if not v_recipient_exists then
    if v_reservation.id is null then
      if new.action = 'round' then
        return new;
      end if;
      perform public.profile_reserve_gift_inventory_v1(
        v_host_id, new.gift_code, 1, 'room_delivery', new.id
      );
    end if;
    perform public.profile_finalize_gift_inventory_reservation_v1(
      'room_delivery', new.id, 'released', 'recipient_deleted'
    );
    return new;
  end if;

  if v_reservation.id is null then
    if new.action = 'round' then
      if not public.profile_try_lock_gift_inventory_pair_v1(
        v_host_id, new.recipient_profile_id_snapshot, new.gift_code
      ) then
        return new;
      end if;
    else
      perform public.profile_lock_gift_inventory_pair_v1(
        v_host_id, new.recipient_profile_id_snapshot, new.gift_code
      );
    end if;
    perform public.profile_reserve_gift_inventory_v1(
      v_host_id, new.gift_code, 1, 'room_delivery', new.id
    );
  elsif v_reservation.profile_id is not null then
    if not public.profile_try_lock_gift_inventory_pair_v1(
      v_reservation.profile_id, new.recipient_profile_id_snapshot, new.gift_code
    ) then
      select * into v_reservation
      from public.profile_gift_inventory_reservations_v1 reservation
      where reservation.consumer_kind = 'room_delivery'
        and reservation.consumer_id = new.id;
      if v_reservation.profile_id is null and v_reservation.owner_deleted_at is not null then
        if not public.profile_try_lock_gift_inventory_pair_v1(
          new.recipient_profile_id_snapshot, new.recipient_profile_id_snapshot, new.gift_code
        ) then
          perform public.profile_finalize_gift_inventory_reservation_v1(
            'room_delivery', new.id, 'released', 'recipient_deleted'
          );
          return new;
        end if;
      else
        perform public.profile_finalize_gift_inventory_reservation_v1(
          'room_delivery', new.id, 'released', 'recipient_deleted'
        );
        return new;
      end if;
    end if;
  else
    if not public.profile_try_lock_gift_inventory_pair_v1(
      new.recipient_profile_id_snapshot, new.recipient_profile_id_snapshot, new.gift_code
    ) then
      perform public.profile_finalize_gift_inventory_reservation_v1(
        'room_delivery', new.id, 'released', 'recipient_deleted'
      );
      return new;
    end if;
  end if;
  if new.status = 'sent' then
    perform public.profile_finalize_gift_inventory_reservation_v1(
      'room_delivery', new.id, 'consumed'
    );
  end if;
  return new;
end;
$$;

create or replace function public.profile_finalize_room_gift_delivery_inventory_v1()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.profile_finalize_gift_inventory_reservation_v1(
      'room_delivery', old.id, 'released', 'source_deleted'
    );
    return old;
  end if;
  if new.status = 'sent' and old.status is distinct from 'sent' then
    perform public.profile_finalize_gift_inventory_reservation_v1(
      'room_delivery', new.id, 'consumed'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profile_reserve_room_gift_draw_inventory_v1
  on public.room_gift_draws_v1;
create trigger profile_reserve_room_gift_draw_inventory_v1
after insert on public.room_gift_draws_v1
for each row execute function public.profile_reserve_room_gift_draw_inventory_v1();

drop trigger if exists profile_finalize_room_gift_draw_inventory_v1
  on public.room_gift_draws_v1;
create trigger profile_finalize_room_gift_draw_inventory_v1
after update of status or delete on public.room_gift_draws_v1
for each row execute function public.profile_finalize_room_gift_draw_inventory_v1();

drop trigger if exists profile_reserve_room_gift_delivery_inventory_v1
  on public.room_gift_deliveries_v1;
create trigger profile_reserve_room_gift_delivery_inventory_v1
before insert or update of status on public.room_gift_deliveries_v1
for each row execute function public.profile_reserve_room_gift_delivery_inventory_v1();

drop trigger if exists profile_finalize_room_gift_delivery_inventory_v1
  on public.room_gift_deliveries_v1;
create trigger profile_finalize_room_gift_delivery_inventory_v1
after update of status or delete on public.room_gift_deliveries_v1
for each row execute function public.profile_finalize_room_gift_delivery_inventory_v1();

-- Deployment is deliberately fail-open/observe-only. Credits and backfill are
-- recorded immediately, but outgoing legacy Web/iOS commands are not charged
-- until `profile_activate_gift_inventory_v1` atomically seeds and activates.
insert into public.profile_gift_inventory_runtime_v1 (singleton, enforcement_mode)
values (true, 'observe')
on conflict (singleton) do nothing;

-- Idempotent historical credit. Existing sender operations are intentionally
-- grandfathered; only gifts already won/received become available stock.
do $backfill$
declare
  v_row record;
begin
  for v_row in
    select award.id, award.recipient_profile_id as profile_id, award.gift_code
    from public.room_gift_awards_v1 award
    join public.profiles profile on profile.id = award.recipient_profile_id
    where award.recipient_profile_id is not null
  loop
    perform public.profile_grant_gift_inventory_unit_v1(
      v_row.profile_id, v_row.gift_code, 1,
      'room_draw_award', v_row.id::text
    );
  end loop;

  for v_row in
    select delivery.id, delivery.recipient_profile_id as profile_id, delivery.gift_code
    from public.room_gift_deliveries_v1 delivery
    join public.profiles profile on profile.id = delivery.recipient_profile_id
    where delivery.recipient_profile_id is not null
      and delivery.status = 'sent'
  loop
    perform public.profile_grant_gift_inventory_unit_v1(
      v_row.profile_id, v_row.gift_code, 1,
      'room_direct_delivery', v_row.id::text
    );
  end loop;
end;
$backfill$;

revoke all on function public.profile_apply_gift_inventory_movement_v1(uuid, text, text, integer, integer, text, text, text)
  from public, anon, authenticated;
revoke all on function public.profile_try_lock_gift_inventory_pair_v1(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.profile_lock_gift_inventory_pair_v1(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.profile_reserve_gift_inventory_v1(uuid, text, integer, text, uuid)
  from public, anon, authenticated;
revoke all on function public.profile_finalize_gift_inventory_reservation_v1(text, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.profile_grant_gift_inventory_unit_v1(uuid, text, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.profile_grant_gift_inventory_v1(uuid, text, integer, text, text, text)
  from public, anon, authenticated;
revoke all on function public.profile_should_enforce_gift_inventory_v1(timestamptz)
  from public, anon, authenticated;
revoke all on function public.profile_gift_inventory_is_active_v1()
  from public, anon, authenticated;
revoke all on function public.profile_require_gift_inventory_read_committed_v1()
  from public, anon, authenticated;
revoke all on function public.profile_mark_gift_inventory_source_enforced_v1(text, uuid)
  from public, anon, authenticated;
revoke all on function public.profile_activate_gift_inventory_v1(text, jsonb)
  from public, anon, authenticated;
revoke all on function public.profile_reject_gift_inventory_movement_mutation_v1()
  from public, anon, authenticated;
revoke all on function public.profile_mark_gift_inventory_owner_deleted_v1()
  from public, anon, authenticated;
revoke all on function public.profile_credit_room_gift_award_inventory_v1()
  from public, anon, authenticated;
revoke all on function public.profile_credit_room_gift_delivery_inventory_v1()
  from public, anon, authenticated;
revoke all on function public.profile_reserve_room_gift_draw_inventory_v1()
  from public, anon, authenticated;
revoke all on function public.profile_finalize_room_gift_draw_inventory_v1()
  from public, anon, authenticated;
revoke all on function public.profile_reserve_room_gift_delivery_inventory_v1()
  from public, anon, authenticated;
revoke all on function public.profile_finalize_room_gift_delivery_inventory_v1()
  from public, anon, authenticated;
revoke all on function public.profile_list_my_gift_inventory_v1()
  from public, anon;

grant execute on function public.profile_list_my_gift_inventory_v1() to authenticated;
grant execute on function public.profile_grant_gift_inventory_v1(uuid, text, integer, text, text, text)
  to service_role;
grant execute on function public.profile_activate_gift_inventory_v1(text, jsonb)
  to service_role;

comment on table public.profile_gift_inventory_v1 is
  'Owner gift balances. Browser writes are forbidden; Room/campaign mutations are transactional server operations.';
comment on table public.profile_gift_inventory_movements_v1 is
  'Append-only, idempotent audit ledger for every gift balance mutation.';
comment on table public.profile_gift_inventory_reservations_v1 is
  'Private reservation and tombstone ledger binding owned gifts to Room operations without poisoning workers after Profile deletion.';
comment on table public.profile_gift_inventory_enforced_sources_v1 is
  'Private durable cutover classification for Room sources, independent of transaction-old created_at timestamps.';
comment on function public.profile_list_my_gift_inventory_v1() is
  'Returns the authenticated Profile owner inventory for all six canonical Room gifts.';
comment on function public.profile_activate_gift_inventory_v1(text, jsonb) is
  'Service-role-only atomic seed and irreversible observe-to-enforce cutover for gift inventory.';

create extension if not exists pgtap with schema extensions;
select plan(9);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('79000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','gift-integration-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,2)n;
select public.profile_activate_gift_inventory_v1('android-shared-inventory-20260921','[]');
select public.profile_grant_gift_inventory_v1('79000000-0000-0000-0000-000000000001','force-card',1,'test','fixture-one','fixture-grant-one');
insert into public.rooms_v2(id,host_id,type,title,status,livekit_room_name) values('7a000000-0000-0000-0000-000000000001','79000000-0000-0000-0000-000000000001','loge','Test cadeaux','live','gift-test');
insert into public.room_participants_v2(room_id,user_id,role) values('7a000000-0000-0000-0000-000000000001','79000000-0000-0000-0000-000000000002','viewer');
insert into public.room_queue_v2(room_id,user_id) values('7a000000-0000-0000-0000-000000000001','79000000-0000-0000-0000-000000000002');
select set_config('request.jwt.claim.sub','79000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select ok(not has_function_privilege('authenticated','public.profile_grant_gift_inventory_v1(uuid,text,integer,text,text,text)','execute'),'client cannot mint stock');
select is((select available_quantity from public.profile_list_my_gift_inventory_v1() where gift_code='force-card'),1,'stock read');
select lives_ok($$select public.rooms_submit_gift_v1('7a000000-0000-0000-0000-000000000001','force-card','Carte de Force','79000000-0000-0000-0000-000000000002','send_now',null,null,'gift-test-delivery-1')$$,'send succeeds');
select is((select available_quantity from public.profile_list_my_gift_inventory_v1() where gift_code='force-card'),0,'stock consumed');
select lives_ok($$select public.rooms_submit_gift_v1('7a000000-0000-0000-0000-000000000001','force-card','Carte de Force','79000000-0000-0000-0000-000000000002','send_now',null,null,'gift-test-delivery-1')$$,'retry idempotent');
select throws_ok($$select public.rooms_submit_gift_v1('7a000000-0000-0000-0000-000000000001','force-card','Carte de Force','79000000-0000-0000-0000-000000000002','send_now',null,null,'gift-test-delivery-2')$$,'22003','profile_gift_inventory_insufficient_available','empty stock blocks delivery');
select set_config('request.jwt.claim.sub','79000000-0000-0000-0000-000000000002',true);
select is((select available_quantity from public.profile_list_my_gift_inventory_v1() where gift_code='force-card'),1,'recipient credited once');
select lives_ok($$select public.get_profile_certif_summary_v1('79000000-0000-0000-0000-000000000002')$$,'certif summary available');
select ok(not has_table_privilege('authenticated','public.profile_gift_inventory_movements_v1','UPDATE'),'ledger immutable for client');
reset role;
select * from finish();
