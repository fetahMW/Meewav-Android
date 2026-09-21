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
