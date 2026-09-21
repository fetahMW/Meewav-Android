create extension if not exists pgtap with schema extensions;
select plan(2);
select is((select scheduler_status from public.room_gift_draw_scheduler_health_v1 where singleton), 'pg_cron_5_seconds', 'durable gift scheduler is configured');
select ok(exists(select 1 from cron.job where active and command like '%rooms_advance_due_gift_draws_v1%'), 'gift worker is active');
select * from finish();
