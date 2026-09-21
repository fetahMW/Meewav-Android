create extension if not exists pgtap with schema extensions;
select plan(9);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','82000000-0000-0000-0000-000000000001','authenticated','authenticated','comment-pages@example.test','',now(),'{}','{}',now(),now());
insert into public.media_files(id,user_id,type,name,status,visibility,is_public)
values('82010000-0000-0000-0000-000000000001','82000000-0000-0000-0000-000000000001','video','pagination','published','public',true);
insert into public.scene_comments_v1(id,media_id,author_id,body,created_at)
select ('82020000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'82010000-0000-0000-0000-000000000001','82000000-0000-0000-0000-000000000001','Commentaire '||n,now() from generate_series(1,1005)n;
select set_config('request.jwt.claim.sub','82000000-0000-0000-0000-000000000001',true);
set local role authenticated;
create temporary table recipe_pages as
with recursive pages(n,data) as (
 select 1,public.scene_comments_page_v1('82010000-0000-0000-0000-000000000001')
 union all
 select n+1,public.scene_comments_page_v1('82010000-0000-0000-0000-000000000001',(data->'next'->>'time')::timestamptz,(data->'next'->>'id')::uuid)
 from pages where data->'next'<>'null'::jsonb and n<10
) select * from pages;
select is((select sum(jsonb_array_length(data->'items'))::integer from recipe_pages),1005,'all comments beyond former 1000 limit');
select is((select count(distinct item->>'id')::integer from recipe_pages,jsonb_array_elements(data->'items')item),1005,'timestamp ties neither duplicate nor skip comments');
select is((select count(*)::integer from recipe_pages),6,'bounded pages');
select throws_ok($$select public.scene_comments_page_v1('82010000-0000-0000-0000-000000000001',now(),null)$$,'22023','invalid_cursor','partial cursor rejected');
select ok(not has_function_privilege('anon','public.scene_comments_page_v1(uuid,timestamptz,uuid,integer)','execute'),'anonymous denied');
reset role;
update public.scene_comments_v1 set created_at=now()-interval '1 minute' where media_id='82010000-0000-0000-0000-000000000001';
set local role authenticated;
select lives_ok($$select public.scene_submit_comment_v1('82010000-0000-0000-0000-000000000001','Nouveau',null,'82030000-0000-0000-0000-000000000001')$$,'idempotent submit');
select lives_ok($$select public.scene_submit_comment_v1('82010000-0000-0000-0000-000000000001','Nouveau',null,'82030000-0000-0000-0000-000000000001')$$,'retry returns original despite rate limit');
select throws_ok($$select public.scene_submit_comment_v1('82010000-0000-0000-0000-000000000001','Autre',null,'82030000-0000-0000-0000-000000000001')$$,'23505','comment_request_conflict','changed request rejected');
reset role;
select is((select count(*)::integer from public.scene_comments_v1 where media_id='82010000-0000-0000-0000-000000000001'),1006,'retry does not duplicate comment');
select * from finish();
