// Read-only cross-check after Maestro: the UI transition alone is insufficient.
// Usage: node backend-check.mjs QA_EDGE_...  [expected-count]
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const edge = dirname(fileURLToPath(import.meta.url));
const root = resolve(edge, '../../..');
const title = process.argv[2];
const expected = Number(process.argv[3] ?? '1');
if (!/^QA_[A-Za-z0-9_-]{6,150}$/.test(title ?? '')) throw new Error('QA_ title required');
if (expected !== 1) throw new Error('This first-run checker expects exactly one room');
const require = createRequire(resolve(root, 'tools/messaging-media/package.json'));
const { Client } = require('pg');
const envText = await readFile(resolve(root, '../Meewav-Web/.env.local'), 'utf8');
const dbLine = envText.split(/\r?\n/).find(line => line.startsWith('SUPABASE_DB_URL='));
if (!dbLine) throw new Error('SUPABASE_DB_URL unavailable');
const url = new URL(dbLine.slice('SUPABASE_DB_URL='.length).replace(/^['"]|['"]$/g, ''));
// Prevent accidental checks against an unrelated deployment.
if (!`${url.hostname}/${url.username}`.includes('dqabekaqpznjsagoxzwc')) throw new Error('Unexpected deployment target');
url.searchParams.delete('sslmode');
const client = new Client({
  connectionString: url.href,
  ssl: { rejectUnauthorized: true, ca: await readFile(resolve(root, 'tools/messaging-media/supabase-ca.crt'), 'utf8') },
  connectionTimeoutMillis: 15000,
});
await client.connect();
try {
  const { rows } = await client.query(
    `select r.id, r.title, r.type, r.status, r.host_id,
       count(p.*) filter (where p.role = 'host' and p.left_at is null)::int as active_hosts
     from public.rooms_v2 r
     left join public.room_participants_v2 p on p.room_id = r.id
     where r.title = $1
     group by r.id, r.title, r.type, r.status, r.host_id`, [title]);
  const result = { title, count: rows.length, rooms: rows };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (rows.length !== 1 || rows[0].status !== 'live' || rows[0].active_hosts !== 1 || rows[0].type !== 'wave') process.exitCode = 1;
} finally { await client.end(); }
