select case when exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'get_or_create_direct_conversation_v1'
    and p.oid::regprocedure::text = 'get_or_create_direct_conversation_v1(uuid,text)'
    and 'search_path=public, extensions, pg_temp' = any(p.proconfig)
) then 'ok 1 - direct RPC resolves pgcrypto from extensions'
  else 'not ok 1 - direct RPC search path is wrong' end;
select '1..1';
