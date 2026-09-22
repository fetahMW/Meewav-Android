create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('81000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','group-recipe-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,3)n;
insert into public.messaging_conversations(id,kind,created_by_profile_id,creation_idempotency_key,title,metadata)
values('81010000-0000-0000-0000-000000000001','group','81000000-0000-0000-0000-000000000001','recipe-group-tools','Test','{}');
insert into public.artist_groups(id,name,created_by_profile_id,conversation_id)
values('81020000-0000-0000-0000-000000000001','Test','81000000-0000-0000-0000-000000000001','81010000-0000-0000-0000-000000000001');
insert into public.artist_group_members(group_id,profile_id,authority_role) values
('81020000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','owner'),
('81020000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000002','member');
insert into public.creative_projects(id,owner_profile_id,name) values('81040000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','Projet privé');
insert into public.creative_project_members(project_id,profile_id,authority_role) values('81040000-0000-0000-0000-000000000001','81000000-0000-0000-0000-000000000001','owner');
insert into public.creative_projects(id,owner_profile_id,name) values('81040000-0000-0000-0000-000000000002','81000000-0000-0000-0000-000000000003','Autre projet');
insert into public.creative_project_members(project_id,profile_id,authority_role) values('81040000-0000-0000-0000-000000000002','81000000-0000-0000-0000-000000000003','owner');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select throws_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','link','81040000-0000-0000-0000-000000000002')$$,'42501','project_manage_denied','group ownership grants no authority on another project');
select is(jsonb_array_length(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')->'candidates'),1,'candidates contain only administrable projects');
select lives_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','link','81040000-0000-0000-0000-000000000001')$$,'owner links project');
select lives_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','link','81040000-0000-0000-0000-000000000001')$$,'link retry is safe');
select is(jsonb_array_length(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')->'projects'),1,'one persisted link');
select is(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','theme',null,'blue')->>'theme','blue','theme persisted');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000002',true);
select is(jsonb_array_length(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')->'projects'),0,'private project not disclosed to group-only member');
select throws_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','theme',null,'emerald')$$,'42501','group_manage_denied','member cannot change shared theme');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000003',true);
select throws_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')$$,'42501','group_access_denied','outsider cannot read');
select set_config('request.jwt.claim.sub','81000000-0000-0000-0000-000000000001',true);
select lives_ok($$select public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001','unlink','81040000-0000-0000-0000-000000000001')$$,'unlink persisted');
select is(jsonb_array_length(public.artist_group_connections_v1('81020000-0000-0000-0000-000000000001')->'projects'),0,'link removed');
reset role;
select is((select count(*)::integer from public.creative_project_members where project_id='81040000-0000-0000-0000-000000000001'),1,'link did not grant project access');
select * from finish();
