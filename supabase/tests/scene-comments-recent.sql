create extension if not exists pgtap with schema extensions;
select plan(5);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','82040000-0000-4000-8000-000000000001',
  'authenticated','authenticated','recent-comments@example.test','',now(),'{}','{}',now(),now());
insert into public.media_files(id,user_id,type,name,status,visibility,is_public)
values('82050000-0000-4000-8000-000000000001','82040000-0000-4000-8000-000000000001','video','recent','published','public',true);
insert into public.scene_comments_v1(id,media_id,author_id,body,created_at)
select ('82060000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
  '82050000-0000-4000-8000-000000000001','82040000-0000-4000-8000-000000000001',
  'Commentaire '||n,now()-make_interval(secs=>1006-n)
from generate_series(1,1005)n;
select ok(not has_function_privilege('anon','public.scene_comments_recent_page_v2(uuid,timestamptz,uuid,integer)','execute'),
  'anonymous denied');
select set_config('request.jwt.claim.sub','82040000-0000-4000-8000-000000000001',true);
set local role authenticated;
create temporary table recent_pages as
with recursive pages(n,data) as (
  select 1,public.scene_comments_recent_page_v2('82050000-0000-4000-8000-000000000001')
  union all
  select n+1,public.scene_comments_recent_page_v2('82050000-0000-4000-8000-000000000001',
    (data->'next'->>'time')::timestamptz,(data->'next'->>'id')::uuid)
  from pages where data->'next'<>'null'::jsonb and n<10
) select * from pages;
select is((select data->'items'->0->>'body' from recent_pages where n=1),'Commentaire 1005',
  'newest comment appears in first page');
select is((select sum(jsonb_array_length(data->'items'))::integer from recent_pages),1005,
  'all comments streamed beyond 1000');
select is((select count(distinct item->>'id')::integer from recent_pages,jsonb_array_elements(data->'items')item),1005,
  'cursor never repeats a comment');
select throws_ok($$select public.scene_comments_recent_page_v2('82050000-0000-4000-8000-000000000001',now(),null)$$,
  '22023','invalid_cursor','partial cursor rejected');
reset role;
select * from finish();
