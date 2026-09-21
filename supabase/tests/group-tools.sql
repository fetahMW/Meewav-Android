create extension if not exists pgtap with schema extensions;
select plan(14);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('81000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','group-recipe-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,3)n;
insert into public.messaging_conversations(id,kind,created_by_profile_id,creation_idempotency_key,title,metadata)
values('81010000-0000-0000-0000-000000000001','group','81000000-0000-0000-0000-000000000001','recipe-group-tools','Test','{}');
insert into public.artist_groups(id,name,created_by_profile_id,conversation_id)
values('81020000-0000-0000-0000-000000000001','Test','81000000-0000-0000-0000-000000000001','81010000-0000-0000-0000-000000000001');
insert into public.artist_group_members(group_id,profile_id,authority_role) values
('81020000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','owner'),
('81020000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000002','member');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000001','create',jsonb_build_object('kind','session','title','Session','startsAt',now()+interval '1 day','place','Paris'))$$,'session created');
select lives_ok($$select public.edit_artist_group_session_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000001',jsonb_build_object('title','Session','startsAt',now()+interval '1 day','place','Paris'),'Session modifiée',now()+interval '2 days','Lyon')$$,'session edited');
select lives_ok($$select public.edit_artist_group_session_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000001',jsonb_build_object('title','Session','startsAt',now()+interval '1 day','place','Paris'),'Session modifiée',now()+interval '2 days','Lyon')$$,'edit retry is idempotent');
select throws_ok($$select public.edit_artist_group_session_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000001',jsonb_build_object('title','Session','startsAt',now()+interval '1 day','place','Paris'),'Ecrasement',now()+interval '3 days','Paris')$$,'40001','session_changed','stale editor rejected');
select lives_ok($$select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000002','create','{"kind":"decision","title":"Choix","options":["Oui","Non"]}'::jsonb)$$,'decision created');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000002',true);
select lives_ok($$select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000001','respond','{"attending":true}')$$,'member confirms attendance');
select throws_ok($$select public.edit_artist_group_session_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000001','{}','Modification interdite',now()+interval '4 days','Paris')$$,'42501','tool_manage_denied','member cannot edit others session');
select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000002','respond','{"choice":0}');
select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000002','respond','{"choice":1}');
reset role;
select is((select count(*)::integer from public.artist_group_tool_responses_v1 where item_id='81030000-0000-0000-0000-000000000002'),1,'changed vote counted once');
set local role authenticated;
select throws_ok($$select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000002','close')$$,'42501','tool_manage_denied','member cannot close others decision');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.edit_artist_group_session_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000001',jsonb_build_object('title','Session modifiée','startsAt',now()+interval '2 days','place','Lyon'),'Session déplacée',now()+interval '3 days','Lyon')$$,'owner reschedules session');
reset role;
select is((select count(*)::integer from public.artist_group_tool_responses_v1 where item_id='81030000-0000-0000-0000-000000000001'),0,'new date requires fresh attendance confirmation');
set local role authenticated;
select lives_ok($$select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000002','close')$$,'owner closes decision');
select throws_ok($$select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000002','respond','{"choice":0}')$$,'55000','tool_closed','vote after closure denied');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000003',true);
select throws_ok($$select public.mutate_artist_group_tool_v1('81020000-0000-0000-0000-000000000001','81030000-0000-0000-0000-000000000002','respond','{"choice":0}')$$,'42501','group_access_denied','outsider denied');
reset role;
select * from finish();
