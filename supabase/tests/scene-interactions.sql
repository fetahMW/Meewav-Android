create extension if not exists pgtap with schema extensions;
select plan(12);
select ok(not has_function_privilege('anon','public.scene_interaction_v1(text,uuid,uuid,text,uuid)','execute'),'anonymous RPC denied');
select ok(not has_table_privilege('authenticated','public.scene_comments_v1','INSERT'),'direct inserts denied');
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('73000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','scene-test-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,3)n;
insert into public.media_files(id,user_id,type,name,status,visibility,is_public) values
('74000000-0000-0000-0000-000000000001','73000000-0000-0000-0000-000000000001','video','fixture','published','public',true),
('74000000-0000-0000-0000-000000000002','73000000-0000-0000-0000-000000000001','video','private','ready','private',false);
select set_config('request.jwt.claim.sub','73000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select throws_ok($$select public.scene_interaction_v1('list','74000000-0000-0000-0000-000000000002')$$,'42501','media_not_accessible','private media inaccessible');
select lives_ok($$select public.scene_interaction_v1('add','74000000-0000-0000-0000-000000000001',null,'Bonjour')$$,'viewer comments on public media');
select is(jsonb_array_length(public.scene_interaction_v1('list','74000000-0000-0000-0000-000000000001')),1,'one persisted comment');
select throws_ok($$select public.scene_interaction_v1('add','74000000-0000-0000-0000-000000000001',null,'Trop vite')$$,'P0001','COMMENT_RATE_LIMITED','rate limit');
select lives_ok($$select public.scene_interaction_v1('report','74000000-0000-0000-0000-000000000001',null,'spam')$$,'report persists');
select set_config('request.jwt.claim.sub','73000000-0000-0000-0000-000000000003',true);
select throws_ok($$select public.scene_interaction_v1('edit','74000000-0000-0000-0000-000000000001',(public.scene_interaction_v1('list','74000000-0000-0000-0000-000000000001')->0->>'id')::uuid,'hijack')$$,'42501','action_forbidden','cannot edit someone else comment');
select lives_ok($$select public.scene_interaction_v1('like','74000000-0000-0000-0000-000000000001',(public.scene_interaction_v1('list','74000000-0000-0000-0000-000000000001')->0->>'id')::uuid)$$,'like persists');
select is((public.scene_interaction_v1('list','74000000-0000-0000-0000-000000000001')->0->>'likeCount')::int,1,'real like count');
select set_config('request.jwt.claim.sub','73000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.scene_interaction_v1('delete','74000000-0000-0000-0000-000000000001',(public.scene_interaction_v1('list','74000000-0000-0000-0000-000000000001')->0->>'id')::uuid)$$,'owner can moderate');
select is(jsonb_array_length(public.scene_interaction_v1('list','74000000-0000-0000-0000-000000000001')),0,'comment removed');
reset role;
select * from finish();
