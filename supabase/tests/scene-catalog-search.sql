create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','83000000-0000-0000-0000-000000000001','authenticated','authenticated','scene-search@example.test','',now(),'{}','{}',now(),now());

insert into public.media_files(id,user_id,type,name,status,visibility,is_public,metadata)
values
 ('83010000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000001','video','Session jazz nocturne','published','public',true,'{"scene_content_type":"Session","scene_city":"Paris"}'::jsonb),
 ('83010000-0000-0000-0000-000000000002','83000000-0000-0000-0000-000000000001','video','Caméra secondaire jazz','published','public',true,'{"scene_publication":{"secondaryOf":"83010000-0000-0000-0000-000000000001"}}'::jsonb),
 ('83010000-0000-0000-0000-000000000003','83000000-0000-0000-0000-000000000001','video','Session jazz privée','ready','private',false,'{}'::jsonb);

select is((select count(*)::integer from public.scene_search_catalog_v1('jazz')),1,'only the public primary is searchable');
select is((select count(*)::integer from public.scene_search_catalog_v1('Paris')),1,'published city metadata is searchable');
select is((select count(*)::integer from public.scene_search_catalog_v1('jazz',1,1)),0,'search offset paginates public results');
select * from finish();
