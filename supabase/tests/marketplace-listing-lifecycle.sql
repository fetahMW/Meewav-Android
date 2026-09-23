create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('77010000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
  'authenticated','authenticated','market-lifecycle-'||n||'@example.test','',now(),'{}','{}',now(),now()
from generate_series(1,2)n;
update public.profiles set show_on_public_profile=true,is_ghost_mode=false
where id='77010000-0000-4000-8000-000000000001';
insert into public.marketplace_seller_profiles(profile_id)
values('77010000-0000-4000-8000-000000000001');
insert into public.media_files(id,user_id,type,name,file_url,file_size,size_bytes,is_public,status,visibility,source_pillar,mime_type)
values('77020000-0000-4000-8000-000000000001','77010000-0000-4000-8000-000000000001',
  'image','Cover','https://assets.example.test/cover.webp',1024,1024,false,'ready','private','marketplace','image/webp');
insert into public.marketplace_listings(id,seller_profile_id,slug,pillar,category_code,title,short_description,description,pickup_enabled,max_quantity)
values('77030000-0000-4000-8000-000000000001','77010000-0000-4000-8000-000000000001',
  'lifecycle-test','used','synthesizers','Synthé de test','Synthé prêt à jouer','Synthé prêt à jouer',true,1);
insert into public.marketplace_listing_prices(listing_id,price_kind,currency_code,amount_minor,price_unit)
values('77030000-0000-4000-8000-000000000001','primary','EUR',23900,'item');
insert into public.marketplace_listing_media(listing_id,media_file_id,media_role,position)
values('77030000-0000-4000-8000-000000000001','77020000-0000-4000-8000-000000000001','cover',0);

select ok(not has_function_privilege('anon','public.marketplace_set_listing_status_v1(uuid,bigint,text,text)','execute'),'anonymous mutation denied');
select ok(not has_function_privilege('anon','public.list_my_marketplace_listings_v1(integer)','execute'),'anonymous owner list denied');
select set_config('request.jwt.claim.sub','77010000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$select public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',1,'published','other-owner-test')$$,
  'P0002','marketplace_listing_not_found','another user cannot publish');
select is(jsonb_array_length(public.list_my_marketplace_listings_v1()),0,'owner list isolated');
reset role;

select set_config('request.jwt.claim.sub','77010000-0000-4000-8000-000000000001',true);
set local role authenticated;
select throws_ok($$select public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',1,'paused','pause-draft-test')$$,
  '22023','marketplace_listing_transition_invalid','draft cannot be paused as public listing');
select throws_ok($$select public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',1,'published','short')$$,
  '22023','invalid_marketplace_status_request','short idempotency key rejected');
select is(public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',1,'published','publish-test-001')->>'status',
  'published','draft published');
select is((select count(*)::integer from public.list_marketplace_catalog_v1(p_listing_ids=>array['77030000-0000-4000-8000-000000000001']::uuid[])),1,'published listing enters public catalog');
select is(public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',1,'published','publish-test-001')->>'idempotent',
  'true','publication retry idempotent');
select throws_ok($$select public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',1,'paused','publish-test-001')$$,
  '23505','idempotency_conflict','changed retry rejected');
select throws_ok($$select public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',1,'paused','pause-old-version')$$,
  '40001','marketplace_listing_version_conflict','stale version rejected');
select is(jsonb_array_length(public.list_my_marketplace_listings_v1()),1,'published listing visible to owner');
select is(public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',2,'paused','pause-test-001')->>'status',
  'paused','published listing paused');
select is((select count(*)::integer from public.list_marketplace_catalog_v1(p_listing_ids=>array['77030000-0000-4000-8000-000000000001']::uuid[])),0,'paused listing leaves public catalog');
select is(public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',3,'published','resume-test-001')->>'status',
  'published','paused listing resumed');
select is(public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',4,'archived','archive-test-001')->>'status',
  'archived','listing archived');
select is(jsonb_array_length(public.list_my_marketplace_listings_v1()),0,'archived listing leaves owner active list');
select throws_ok($$select public.marketplace_set_listing_status_v1('77030000-0000-4000-8000-000000000001',5,'published','unarchive-test')$$,
  '22023','marketplace_listing_transition_invalid','archived listing cannot reappear');
select throws_ok($$select public.list_my_marketplace_listings_v1(101)$$,
  '22023','invalid_marketplace_limit','owner list bounded');
reset role;
select * from finish();
