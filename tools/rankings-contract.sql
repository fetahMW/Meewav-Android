CREATE OR REPLACE FUNCTION public.get_my_profile_rankings_v1(p_period text DEFAULT '30d'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_profile_id uuid := auth.uid();
  v_interval interval;
  v_period_start timestamptz;
  v_entries jsonb := '[]'::jsonb;
  v_current_points bigint := 0;
  v_points_gained bigint := 0;
  v_measured_at timestamptz;
begin
  if v_profile_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  v_interval := case p_period
    when '7d' then interval '7 days'
    when '30d' then interval '30 days'
    when '12m' then interval '12 months'
    else null
  end;
  if v_interval is null then
    raise exception using errcode = '22023', message = 'invalid_ranking_period';
  end if;
  v_period_start := now() - v_interval;

  select state.total_points
  into v_current_points
  from public.profile_grade_state state
  where state.profile_id = v_profile_id;
  v_current_points := coalesce(v_current_points, 0);

  select coalesce(sum(event.points_delta), 0)
  into v_points_gained
  from public.profile_grade_events event
  where event.profile_id = v_profile_id
    and event.occurred_at >= v_period_start;

  select max(current_rank.calculated_at)
  into v_measured_at
  from public.profile_rankings_current current_rank
  where current_rank.profile_id = v_profile_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'scope', current_rank.scope,
      'label', current_rank.scope_label,
      'rank', current_rank.rank_position,
      'total', current_rank.eligible_count,
      'movement', case
        when previous_rank.rank_position is null then null
        else previous_rank.rank_position - current_rank.rank_position
      end
    ) order by case current_rank.scope
      when 'country' then 1
      when 'region' then 2
      when 'city' then 3
      when 'district' then 4
      else 5
    end
  ), '[]'::jsonb)
  into v_entries
  from public.profile_rankings_current current_rank
  left join lateral (
    select history.rank_position
    from public.profile_rankings_history history
    where history.profile_id = current_rank.profile_id
      and history.scope = current_rank.scope
      and history.scope_key = current_rank.scope_key
      and history.calculated_at <= v_period_start
    order by history.calculated_at desc
    limit 1
  ) previous_rank on true
  where current_rank.profile_id = v_profile_id;

  return jsonb_build_object(
    'contract_version', 1,
    'algorithm_version', 'grade-points-v1',
    'period', p_period,
    'basis', 'grade_points',
    'current_points', v_current_points,
    'points_gained', v_points_gained,
    'measured_at', v_measured_at,
    'entries', v_entries
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.refresh_profile_rankings_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_run_id uuid;
  v_now timestamptz := clock_timestamp();
  v_eligible_count integer := 0;
  v_generated_rows integer := 0;
  v_algorithm_version constant text := 'grade-points-v1';
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception using errcode = '42501', message = 'service_role_required';
  end if;

  -- A refresh replaces the complete current projection. Serialize jobs so two
  -- workers can never interleave their delete/insert phases.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('profile-rankings-v1', 0)
  );

  insert into public.profile_ranking_runs(algorithm_version, status, started_at)
  values (v_algorithm_version, 'running', v_now)
  returning id into v_run_id;

  -- History is the durable staging area for this run. This avoids trusting a
  -- caller-controlled pg_temp object inside a SECURITY DEFINER function and
  -- also makes repeated calls in one transaction safe.
  with normalized as (
    select
      profile.id as profile_id,
      state.total_points as score,
      case
        when region.region_code is not null
          or upper(btrim(coalesce(profile.country_code, ''))) in ('FR', 'FRA')
          or lower(btrim(coalesce(profile.country, ''))) in ('fr', 'france')
          then 'FR'
        else coalesce(
          nullif(upper(btrim(profile.country_code)), ''),
          nullif(lower(btrim(profile.country)), '')
        )
      end as country_key,
      case
        when region.region_code is not null
          or upper(btrim(coalesce(profile.country_code, ''))) in ('FR', 'FRA')
          or lower(btrim(coalesce(profile.country, ''))) in ('fr', 'france')
          then 'France'
        else coalesce(
          nullif(btrim(profile.country), ''),
          nullif(upper(btrim(profile.country_code)), '')
        )
      end as country_label,
      region.region_code,
      region.region_name,
      coalesce(
        nullif(
          regexp_replace(
            upper(coalesce(profile.commune_code, '')),
            '[^0-9A-Z]',
            '',
            'g'
          ),
          ''
        ),
        nullif(lower(btrim(profile.city)), '')
      ) as local_city_key,
      nullif(btrim(profile.city), '') as city_label,
      coalesce(
        nullif(lower(btrim(profile.zone_id)), ''),
        nullif(lower(btrim(profile.district_id)), '')
      ) as local_district_key,
      coalesce(
        nullif(btrim(profile.district_name), ''),
        nullif(btrim(profile.scene_name), '')
      ) as district_label
    from public.profiles profile
    join public.profile_grade_state state on state.profile_id = profile.id
    left join lateral public.meewav_france_region_v1(profile.commune_code) region on true
    where coalesce(profile.show_on_public_profile, false)
      and not coalesce(profile.is_ghost_mode, true)
      and coalesce(profile.public_profile_preferences ->> 'show_grade', 'true') <> 'false'
  ), eligible as (
    select
      profile_id,
      score,
      country_key,
      country_label,
      case
        when country_key is not null and region_code is not null
          then concat_ws(':', country_key, region_code)
        else null
      end as region_key,
      region_name,
      case
        when country_key is not null
          and local_city_key is not null
          and city_label is not null
          then concat_ws(':', country_key, local_city_key)
        else null
      end as city_key,
      city_label,
      case
        when country_key is not null
          and local_city_key is not null
          and district_label is not null
          then concat_ws(
            ':',
            country_key,
            local_city_key,
            coalesce(local_district_key, lower(district_label))
          )
        else null
      end as district_key,
      district_label
    from normalized
  ), scoped as (
    select profile_id, score, 'country'::text as scope, country_key as scope_key, country_label as scope_label
    from eligible where country_key is not null and country_label is not null
    union all
    select profile_id, score, 'region', region_key, region_name
    from eligible where region_key is not null and region_name is not null
    union all
    select profile_id, score, 'city', city_key, city_label
    from eligible where city_key is not null and city_label is not null
    union all
    select profile_id, score, 'district', district_key, district_label
    from eligible where district_key is not null and district_label is not null
  ), ranked as (
    select
      profile_id,
      scope,
      scope_key,
      scope_label,
      dense_rank() over (
        partition by scope, scope_key
        order by score desc
      )::bigint as rank_position,
      count(*) over (partition by scope, scope_key)::bigint as eligible_count,
      score
    from scoped
  )
  insert into public.profile_rankings_history (
    run_id, profile_id, scope, scope_key, scope_label, rank_position,
    eligible_count, score, algorithm_version, calculated_at
  )
  select
    v_run_id::uuid as run_id,
    profile_id,
    scope,
    scope_key,
    scope_label,
    rank_position,
    eligible_count,
    score,
    v_algorithm_version::text as algorithm_version,
    v_now::timestamptz as calculated_at
  from ranked;

  get diagnostics v_generated_rows = row_count;

  select count(distinct history.profile_id)::integer
  into v_eligible_count
  from public.profile_rankings_history history
  where history.run_id = v_run_id;

  delete from public.profile_rankings_current;
  insert into public.profile_rankings_current (
    profile_id, scope, scope_key, scope_label, rank_position,
    eligible_count, score, algorithm_version, run_id, calculated_at
  )
  select
    history.profile_id, history.scope, history.scope_key, history.scope_label,
    history.rank_position, history.eligible_count, history.score,
    history.algorithm_version, history.run_id, history.calculated_at
  from public.profile_rankings_history history
  where history.run_id = v_run_id;

  update public.profile_ranking_runs
  set status = 'completed',
      eligible_profiles = v_eligible_count,
      generated_rows = v_generated_rows,
      completed_at = clock_timestamp(),
      metadata = jsonb_build_object(
        'basis', 'grade_points',
        'tie_strategy', 'dense_rank',
        'scopes', jsonb_build_array('country', 'region', 'city', 'district')
      )
  where id = v_run_id;

  return jsonb_build_object(
    'ok', true,
    'run_id', v_run_id,
    'algorithm_version', v_algorithm_version,
    'eligible_profiles', v_eligible_count,
    'generated_rows', v_generated_rows,
    'calculated_at', v_now
  );
end;
$function$
