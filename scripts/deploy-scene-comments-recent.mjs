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
  const sql = await readFile(resolve(root, 'supabase/migrations/20260923160000_scene_comments_recent_page.sql'), 'utf8');
  await client.query(sql.replace(/commit;\s*$/i, 'rollback;'));
  console.log('Scene recent comments validated in rolled-back transaction.');
  if (process.argv.includes('--apply')) {
    await client.query(sql);
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('Scene recent comments deployed.');
  }
} catch (error) {
  console.error(error.code || 'migration_failed', error.position, error.message?.replace(/postgres(?:ql)?:\/\/\S+/g, '[redacted]'));
  process.exitCode = 1;
} finally {
  await client.end();
}
