begin;
create or replace function public.edit_artist_group_session_v1(p_group_id uuid,p_item_id uuid,p_expected jsonb,p_title text,p_starts_at timestamptz,p_place text)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); item public.artist_group_tools_v1; lifecycle text;
begin
 select lifecycle_status into lifecycle from public.artist_groups where id=p_group_id for update;
 if actor is null or not public.artist_group_is_active_member_v1(p_group_id,actor) then raise exception using errcode='42501',message='group_access_denied'; end if;
 if lifecycle<>'active' then raise exception using errcode='55000',message='group_not_active'; end if;
 select * into item from public.artist_group_tools_v1 where id=p_item_id and group_id=p_group_id for update;
 if not found or (item.created_by is distinct from actor and coalesce(public.artist_group_authority_v1(p_group_id,actor),'member') not in ('owner','admin')) then
 raise exception using errcode='42501',message='tool_manage_denied'; end if;
 if item.kind<>'session' or item.status<>'open' or item.starts_at<=now() then raise exception using errcode='55000',message='session_not_editable'; end if;
 if p_title is null or length(btrim(p_title)) not between 2 and 160 or p_starts_at is null or p_starts_at<=now() or p_starts_at>now()+interval '5 years'
 or length(coalesce(p_place,''))>240 then raise exception using errcode='22023',message='invalid_session'; end if;
 -- Exact retry is harmless; an obsolete editor cannot overwrite another organizer.
 if item.title=btrim(p_title) and item.starts_at=p_starts_at and item.place is not distinct from nullif(btrim(p_place),'') then return; end if;
 if p_expected is null or item.title is distinct from p_expected->>'title'
 or item.starts_at is distinct from (p_expected->>'startsAt')::timestamptz
 or item.place is distinct from nullif(p_expected->>'place','') then raise exception using errcode='40001',message='session_changed'; end if;
 if item.starts_at<>p_starts_at or item.place is distinct from nullif(btrim(p_place),'') then
  delete from public.artist_group_tool_responses_v1 where item_id=p_item_id;
 end if;
 update public.artist_group_tools_v1 set title=btrim(p_title),starts_at=p_starts_at,place=nullif(btrim(p_place),'') where id=p_item_id;
end $$;
revoke all on function public.edit_artist_group_session_v1(uuid,uuid,jsonb,text,timestamptz,text) from public,anon;
grant execute on function public.edit_artist_group_session_v1(uuid,uuid,jsonb,text,timestamptz,text) to authenticated;
commit;
