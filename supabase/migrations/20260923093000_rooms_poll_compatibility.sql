begin;
alter table public.room_polls_v2 add column if not exists show_results boolean not null default true;
-- Web already sends this fifth argument; retain the iOS four-argument contract.
create or replace function public.rooms_create_poll_v2(
 p_room_id uuid,p_question text,p_options jsonb,p_duration_seconds integer,p_show_results boolean
) returns public.room_polls_v2 language plpgsql security definer set search_path='' as $$
declare result public.room_polls_v2%rowtype;
begin
 if p_show_results is null then raise exception using errcode='22023',message='Results visibility required';end if;
 select * into result from public.rooms_create_poll_v2(p_room_id,p_question,p_options,p_duration_seconds);
 update public.room_polls_v2 set show_results=p_show_results where id=result.id returning * into result;
 return result;
end;
$$;
revoke all on function public.rooms_create_poll_v2(uuid,text,jsonb,integer,boolean) from public,anon;
grant execute on function public.rooms_create_poll_v2(uuid,text,jsonb,integer,boolean) to authenticated;
commit;
