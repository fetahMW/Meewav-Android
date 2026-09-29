// Atomic deployment of the missing Rooms and cross-client call dependencies.
// Dry-run by default; no session data or authentication settings are changed.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { configuration, Report, root } from './core.mjs';

const apply = process.argv.includes('--apply');
const config = await configuration();
const report = new Report(config, apply ? 'rooms-deploy' : 'rooms-deploy-dry-run');
const { loadEnv } = await import(pathToFileURL(resolve(config.windowsRepo, 'node_modules/vite/dist/node/index.js')).href);
const env = loadEnv('development', config.windowsRepo, '');
const ref = new URL(config.supabaseUrl).hostname.split('.')[0];
const db = new URL(env.SUPABASE_DB_URL);
if (ref !== 'dqabekaqpznjsagoxzwc' || env.SUPABASE_PROJECT_REF !== ref || !(db.hostname === `db.${ref}.supabase.co`
  || (db.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(db.username).split('.').at(-1) === ref))) {
  throw new Error('Le projet PostgreSQL ne correspond pas au projet QA attendu.');
}
const files = [
  '20260822220000_wave_production_core_v3.sql',
  '20260822224500_wave_asset_pipeline_v4.sql',
  '20260822233000_wave_production_runtime_v5.sql',
  '20260926122000_rooms_atomic_desktop_launch.sql',
  '20260926130000_messaging_calls_cross_client.sql',
  '20260926131000_rooms_live_catalog.sql',
];
const require = createRequire(resolve(root, 'tools/messaging-media/package.json'));
const { Client } = require('pg');
const client = new Client({ host: db.hostname, port: Number(db.port || 5432), user: decodeURIComponent(db.username),
  password: decodeURIComponent(db.password), database: decodeURIComponent(db.pathname.slice(1)),
  ssl: { ca: await readFile(resolve(root, 'tools/messaging-media/supabase-ca.crt'), 'utf8'), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000, application_name: 'meewav-rooms-deployment' });
const result = { project: ref, mode: apply ? 'apply' : 'rollback', committed: false, migrations: [] };
let transaction = false;
try {
  await client.connect();
  await client.query("begin; set local lock_timeout='3s'; set local statement_timeout='45s'");
  transaction = true;
  await client.query("select pg_advisory_xact_lock(hashtextextended('meewav:rooms-schema-deployment',0))");
  for (const file of files) {
    const version = file.slice(0, 14);
    const name = file.slice(15, -4);
    const original = await readFile(resolve(config.windowsRepo, 'supabase/migrations', file), 'utf8');
    const entry = { version, name, sha256: createHash('sha256').update(original).digest('hex'), status: 'pending' };
    result.migrations.push(entry);
    const existing = await client.query('select version from supabase_migrations.schema_migrations where version=$1', [version]);
    if (existing.rowCount) { entry.status = 'already-recorded'; continue; }
    // These two files own outer transactions; keep them inside our shared one.
    const ownsTransaction = ['20260926122000_rooms_atomic_desktop_launch.sql', '20260926130000_messaging_calls_cross_client.sql'].includes(file);
    const sql = ownsTransaction
      ? original.replace(/^begin;\s*$/im, '').replace(/^commit;\s*$/im, '') : original;
    if (/^\s*(?:begin|commit|rollback)\s*;/im.test(sql)) throw new Error(`Transaction interne inattendue : ${file}`);
    try {
      await client.query(sql);
      await client.query('insert into supabase_migrations.schema_migrations(version,name,statements) values($1,$2,$3)', [version, name, [original]]);
      entry.status = 'validated';
    } catch (error) {
      entry.status = 'failed';
      entry.error = { code: error.code ?? null, message: error.message };
      throw new Error(`Migration ${version}: ${error.code ?? 'échec'} — ${error.message}`);
    }
  }
  for (const signature of ['rooms_live_catalog_v1()', 'rooms_create_desktop_v1(jsonb,uuid)',
    'rooms_complete_desktop_wave_v1(uuid,uuid)', 'rooms_launch_wave_production_v5(uuid,text,text)']) {
    const found = await client.query('select to_regprocedure($1) is not null as present', [`public.${signature}`]);
    if (!found.rows[0].present) throw new Error(`Fonction absente après validation : ${signature}`);
  }
  if (apply) {
    await client.query("select pg_notify('pgrst','reload schema')");
    await client.query('commit');
    transaction = false;
    result.committed = true;
  }
} catch (error) {
  result.error = error.message;
  process.exitCode = 1;
} finally {
  if (transaction) await client.query('rollback').catch(() => {});
  await client.end().catch(() => {});
  await mkdir(report.directory, { recursive: true });
  await writeFile(resolve(report.directory, 'deployment.json'), JSON.stringify(result, null, 2));
}
console.log(JSON.stringify(result));
console.log(`Rapport : ${report.directory}`);
