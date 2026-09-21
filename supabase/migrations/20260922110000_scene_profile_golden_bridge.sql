begin;
-- Preserve the deployed iOS ledger, trigger and rolling 24-hour allowance.
create or replace function public.profile_public_golden_count_v1(p_profile_id uuid)
returns bigint language sql stable security definer set search_path=pg_catalog,public as $$
 select count(*) from public.daily_golden_likes g where g.recipient_id=p_profile_id
 and exists(select 1 from public.profiles p where p.id=p_profile_id and p.show_on_public_profile and not p.is_ghost_mode);
$$;
revoke all on function public.profile_public_golden_count_v1(uuid) from public;
grant execute on function public.profile_public_golden_count_v1(uuid) to anon,authenticated,service_role;
create or replace view public.public_profiles with(security_invoker=true,security_barrier=true) as
 select c.*,public.profile_public_golden_count_v1(c.id) as golden_likes_count from public.public_profile_cards c;
grant select on public.public_profiles to anon,authenticated;
create or replace function public.get_golden_like_state(p_artist_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare uid uuid:=auth.uid(); last_like public.daily_golden_likes; available_at timestamptz; used boolean;
begin
 if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles where id=p_artist_id and show_on_public_profile and not is_ghost_mode) then return jsonb_build_object('ok',false,'reason','artist_not_found'); end if;
 select * into last_like from public.daily_golden_likes where giver_id=uid order by given_at desc limit 1;
 available_at:=coalesce(last_like.given_at+interval '24 hours',now());used:=available_at>now();
 return jsonb_build_object('ok',true,'artistId',p_artist_id,'goldenLikesCount',public.profile_public_golden_count_v1(p_artist_id),
 'usedToday',used,'availableToday',not used,'givenToThisArtistToday',used and last_like.recipient_id=p_artist_id,
 'dayKey',(now() at time zone 'Europe/Paris')::date,'availableAt',available_at,
 'cooldownSeconds',greatest(0,ceil(extract(epoch from available_at-now()))::integer));
end $$;
create or replace function public.give_golden_like(p_artist_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=auth.uid(); state jsonb; new_id uuid;
begin
 if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
 if uid=p_artist_id then return jsonb_build_object('ok',false,'reason','cannot_golden_like_self'); end if;
 -- Same lock key as the existing iOS cooldown trigger: serialize across clients.
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 state:=public.get_golden_like_state(p_artist_id);
 if not (state->>'ok')::boolean then return state; end if;
 if (state->>'usedToday')::boolean then
  return state||jsonb_build_object('ok',coalesce((state->>'givenToThisArtistToday')::boolean,false),
   'reason',case when (state->>'givenToThisArtistToday')::boolean then 'golden_like_already_sent' else 'already_used_today' end,
   'idempotentReplay',coalesce((state->>'givenToThisArtistToday')::boolean,false));
 end if;
 insert into public.daily_golden_likes(giver_id,recipient_id,given_at) values(uid,p_artist_id,clock_timestamp()) returning id into new_id;
 return public.get_golden_like_state(p_artist_id)||jsonb_build_object('ok',true,'reason','golden_like_sent','goldenLikeId',new_id,'idempotentReplay',false);
end $$;
revoke all on function public.get_golden_like_state(uuid),public.give_golden_like(uuid) from public,anon;
grant execute on function public.get_golden_like_state(uuid),public.give_golden_like(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
