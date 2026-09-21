-- pg_cron supports seconds intervals, but an hourly task needs cron notation.
-- The old nested block rolled back BOTH jobs when parsing "1 hour" failed.
select cron.schedule('rooms-gift-draws-v1', '5 seconds',
  'select public.rooms_advance_due_gift_draws_v1(100);');
select cron.schedule('rooms-gift-draw-snapshots-purge-v1', '0 * * * *',
  'select public.rooms_purge_gift_draw_snapshots_v1(200);');
update public.room_gift_draw_scheduler_health_v1
set scheduler_status='pg_cron_5_seconds',
    scheduler_detail='Gift worker every 5 seconds; snapshot cleanup hourly.',
    checked_at=now()
where singleton;
