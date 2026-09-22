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
create extension if not exists pgtap with schema extensions;
select plan(4);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','7e000000-0000-0000-0000-000000000001','authenticated','authenticated','poll-recipe@example.test','',now(),'{}','{}',now(),now());
insert into public.rooms_v2(id,host_id,type,title,status,livekit_room_name) values('7e000000-0000-0000-0000-000000000002','7e000000-0000-0000-0000-000000000001','wave','Poll test','live','poll-test');
select set_config('request.jwt.claim.sub','7e000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.rooms_create_poll_v2('7e000000-0000-0000-0000-000000000002','Question','[{"label":"Oui"},{"label":"Non"}]',30)$$,'iOS four-argument contract retained');
select lives_ok($$select public.rooms_create_poll_v2('7e000000-0000-0000-0000-000000000002','Question Web','[{"label":"Oui"},{"label":"Non"}]',60,false)$$,'Web five-argument contract accepted');
select is((select show_results from public.room_polls_v2 where room_id='7e000000-0000-0000-0000-000000000002' and is_active),false,'visibility saved');
select is((select count(*)::integer from public.room_polls_v2 where room_id='7e000000-0000-0000-0000-000000000002' and is_active),1,'one active poll');
reset role;
select * from finish();
