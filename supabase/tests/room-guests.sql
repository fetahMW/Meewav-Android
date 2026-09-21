create extension if not exists pgtap with schema extensions;
select plan(9);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('7f000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','guest-recipe-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,5)n;
insert into public.rooms_v2(id,host_id,type,title,status,livekit_room_name) values('7f100000-0000-0000-0000-000000000001','7f000000-0000-0000-0000-000000000001','wave','Guest test','live','guest-test');
insert into public.room_invitations_v2(room_id,host_id,guest_id,status)
select '7f100000-0000-0000-0000-000000000001','7f000000-0000-0000-0000-000000000001',('7f000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,case when n=5 then 'pending' else 'backstage' end from generate_series(2,5)n;
select set_config('request.jwt.claim.sub','7f000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.rooms_set_queue_open_v3('7f100000-0000-0000-0000-000000000001',false)$$,'host can close queue');
select is((select queue_open from public.rooms_v2 where id='7f100000-0000-0000-0000-000000000001'),false,'queue state persisted');
select lives_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000002','7f000000-0000-0000-0000-000000000003']::uuid[],'stage')$$,'duo promoted atomically');
select lives_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000002','7f000000-0000-0000-0000-000000000003']::uuid[],'stage')$$,'promotion retry is safe');
select throws_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000004','7f000000-0000-0000-0000-000000000005']::uuid[],'stage')$$,'P0001','Seules les coulisses peuvent monter sur scene','pending invitation cannot bypass preparation');
select is((select status from public.room_invitations_v2 where guest_id='7f000000-0000-0000-0000-000000000004'),'backstage','failed batch leaves first participant untouched');
select lives_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000002']::uuid[],'backstage')$$,'participant can return to backstage');
select set_config('request.jwt.claim.sub','7f000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.rooms_set_queue_open_v3('7f100000-0000-0000-0000-000000000001',true)$$,'P0001','Action reservee au host','viewer cannot change admission');
select throws_ok($$select public.rooms_guest_command_v1('7f100000-0000-0000-0000-000000000001',array['7f000000-0000-0000-0000-000000000004']::uuid[],'stage')$$,'P0001','Action reservee au host','viewer cannot promote');
reset role;
select * from finish();
