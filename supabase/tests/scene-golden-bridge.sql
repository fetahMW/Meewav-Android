create extension if not exists pgtap with schema extensions;
select plan(7);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000',('75000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','golden-test-'||n||'@example.test','',now(),'{}','{}',now(),now() from generate_series(1,3)n;
update public.profiles set show_on_public_profile=true,is_ghost_mode=false where id in ('75000000-0000-0000-0000-000000000001','75000000-0000-0000-0000-000000000002','75000000-0000-0000-0000-000000000003');
select ok(not has_function_privilege('anon','public.give_golden_like(uuid)','execute'),'anonymous cannot give');
select set_config('request.jwt.claim.sub','75000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select is((public.give_golden_like('75000000-0000-0000-0000-000000000001')->>'reason'),'cannot_golden_like_self','self denied');
select is((public.give_golden_like('75000000-0000-0000-0000-000000000002')->>'ok')::boolean,true,'first give persisted');
select is((public.get_golden_like_state('75000000-0000-0000-0000-000000000002')->>'goldenLikesCount')::int,1,'canonical count');
select is((public.give_golden_like('75000000-0000-0000-0000-000000000002')->>'idempotentReplay')::boolean,true,'replay no duplicate');
select is((public.give_golden_like('75000000-0000-0000-0000-000000000003')->>'reason'),'already_used_today','rolling cooldown denies second artist');
select is((select golden_likes_count from public.public_profiles where id='75000000-0000-0000-0000-000000000002'),1::bigint,'public projection accepts expected column');
reset role;
select * from finish();
