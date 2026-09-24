import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const require = createRequire(resolve(root, 'tools/messaging-media/package.json'));
const { Client } = require('pg');
const envText = await readFile(resolve(root, '../Meewav-Web/.env.local'), 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line)).map((line) => {
  const separator = line.indexOf('=');
  return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, '')];
}));
const dbUrl = new URL(env.SUPABASE_DB_URL);
if (!`${dbUrl.hostname}/${dbUrl.username}`.includes('dqabekaqpznjsagoxzwc')) {
  throw new Error('Unexpected deployment target');
}
dbUrl.searchParams.delete('sslmode');
const client = new Client({
  connectionString: dbUrl.href,
  ssl: { rejectUnauthorized: true, ca: await readFile(resolve(root, 'tools/messaging-media/supabase-ca.crt'), 'utf8') },
  connectionTimeoutMillis: 15000,
});
try {
  await client.connect();
  const functions = await client.query(`
    select p.oid::regprocedure::text as signature,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('get_or_create_direct_conversation_v1', 'messaging_profiles_blocked_v1')
    order by p.proname, signature
  `);
  const migrations = await client.query(`
    select version from supabase_migrations.schema_migrations
    where version in ('20260718191000', '20260718192000')
    order by version
  `);
  const tables = await client.query(`
    select name, to_regclass('public.' || name) is not null as present
    from (values ('messaging_idempotency_keys'), ('messaging_conversations'),
      ('messaging_direct_pairs'), ('messaging_conversation_members'), ('profiles')) v(name)
  `);
  const digest = await client.query(`
    select n.nspname as schema, p.oid::regprocedure::text as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where p.proname='digest' and p.proargtypes::text='25 25'
  `);
  const functionBodies = await client.query(`
    select p.oid::regprocedure::text as signature, p.proconfig,
      pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prokind='f'
      and pg_get_functiondef(p.oid) ilike '%digest(%'
  `);
  const digestPathGaps = functionBodies.rows
    .filter((row) => /(?<!\.)\bdigest\s*\(/i.test(row.definition)
      && !(row.proconfig ?? []).some((setting) => /^search_path\s*=.*\bextensions\b/i.test(setting)))
    .map(({ signature, proconfig }) => ({ signature, proconfig }));
  console.log(JSON.stringify({
    functions: functions.rows,
    migrations: migrations.rows.map((row) => row.version),
    tables: tables.rows,
    digest: digest.rows,
    digestPathGaps,
  }, null, 2));
} finally {
  await client.end();
}
