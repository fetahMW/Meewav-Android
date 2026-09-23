import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'tools/messaging-media/package.json'));
const { Client } = require('pg');
const env = Object.fromEntries((await readFile(resolve(root, '../Meewav-Web/.env.local'), 'utf8'))
  .split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line)).map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, '')];
  }));
const database = new URL(env.SUPABASE_DB_URL);
if (!`${database.hostname}/${database.username}`.includes('dqabekaqpznjsagoxzwc')) throw Error('Unexpected deployment target');
database.searchParams.delete('sslmode');
const client = new Client({ connectionString: database.href,
  ssl: { rejectUnauthorized: true, ca: await readFile(resolve(root, 'tools/messaging-media/supabase-ca.crt'), 'utf8') },
  connectionTimeoutMillis: 15000 });
try {
  await client.connect();
  const sql = await readFile(resolve(root, 'supabase/migrations/20260923170000_globe_public_markers_v1.sql'), 'utf8');
  await client.query(sql.replace(/commit;\s*$/i, 'rollback;'));
  console.log('Globe marker projection validated in rolled-back transaction.');
  if (process.argv.includes('--apply')) {
    await client.query(sql);
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('Globe marker projection deployed.');
  }
  if (process.argv.includes('--verify')) {
    const check = await client.query(`select count(*)::int as total,
      count(*) filter (where marker.is_visible is not true or profile.show_on_public_profile is not true
        or profile.is_ghost_mode is true)::int as forbidden
      from public.globe_public_markers_v1 globe
      join public.profile_public_markers marker on marker.profile_id = globe.profile_id
      join public.profiles profile on profile.id = globe.profile_id`);
    if (check.rows[0].forbidden !== 0) throw Error('Hidden profile leaked into Globe projection');
    console.log(`Globe public projection verified (${check.rows[0].total} visible markers, 0 forbidden).`);
    // A privileged migration connection can read through grants and RLS even
    // when an Android account cannot. Verify the actual PostgREST role too.
    await client.query('begin');
    try {
      await client.query('set local role authenticated');
      const authenticated = await client.query('select count(*)::int as total from public.globe_public_markers_v1');
      if (authenticated.rows[0].total !== check.rows[0].total) {
        throw Error('Authenticated Globe marker count differs from the public projection');
      }
      console.log(`Authenticated Globe access verified (${authenticated.rows[0].total} markers).`);
    } finally { await client.query('rollback'); }
  }
} catch (error) {
  console.error(error.code || 'migration_failed', error.position, error.message?.replace(/postgres(?:ql)?:\/\/\S+/g, '[redacted]'));
  process.exitCode = 1;
} finally {
  await client.end();
}
