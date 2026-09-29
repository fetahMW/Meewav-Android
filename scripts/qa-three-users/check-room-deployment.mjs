// Read-only inventory of the exact deployment dependencies used by the clients.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { configuration, Report, root } from './core.mjs';

const config = await configuration();
const report = new Report(config, 'rooms-deployment');
const { loadEnv } = await import(pathToFileURL(resolve(config.windowsRepo, 'node_modules/vite/dist/node/index.js')).href);
const env = loadEnv('development', config.windowsRepo, '');
const ref = new URL(config.supabaseUrl).hostname.split('.')[0];
const db = new URL(env.SUPABASE_DB_URL);
if (env.SUPABASE_PROJECT_REF !== ref || !(db.hostname === `db.${ref}.supabase.co`
  || (db.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(db.username).split('.').at(-1) === ref))) {
  throw new Error('Projet PostgreSQL différent du projet QA.');
}
const require = createRequire(resolve(root, 'tools/messaging-media/package.json'));
const { Client } = require('pg');
const client = new Client({ host: db.hostname, port: Number(db.port || 5432), user: decodeURIComponent(db.username),
  password: decodeURIComponent(db.password), database: decodeURIComponent(db.pathname.slice(1)),
  ssl: { ca: await readFile(resolve(root, 'tools/messaging-media/supabase-ca.crt'), 'utf8'), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000, application_name: 'meewav-qa-readonly' });
const functions = ['rooms_live_catalog_v1()', 'rooms_create_desktop_v1(jsonb,uuid)', 'rooms_complete_desktop_wave_v1(uuid,uuid)',
  'rooms_get_experience_v1(uuid)', 'rooms_switch_experience_v1(uuid,bigint,uuid,text,jsonb)',
  'rooms_switch_experience_before_roster_v1(uuid,bigint,uuid,text,jsonb)', 'rooms_launch_wave_production_v5(uuid,text,text)',
  'messaging_video_call_v1(text,uuid,uuid)', 'messaging_call_peer_v2(uuid,uuid,boolean)'];
const versions = ['20260822220000', '20260822224500', '20260822233000', '20260926122000', '20260926130000', '20260926131000'];
const inventory = { functions: {}, tables: {}, migrations: {}, launchStatus: false };
let connected = false;
try {
  await report.step('ROOMS-DEPLOY Schéma déployé', [], 'Dépendances des clients réellement présentes', async () => {
    try {
      await client.connect(); connected = true;
      await client.query("begin read only; set local statement_timeout='10s'");
      for (const name of functions) inventory.functions[name] = (await client.query('select to_regprocedure($1) is not null as present', [`public.${name}`])).rows[0].present;
      for (const name of ['rooms_v2', 'room_participants_v2', 'wave_sessions_v3']) inventory.tables[name] = (await client.query('select to_regclass($1) is not null as present', [`public.${name}`])).rows[0].present;
      for (const version of versions) inventory.migrations[version] = (await client.query('select exists(select 1 from supabase_migrations.schema_migrations where version=$1) as present', [version])).rows[0].present;
      inventory.launchStatus = (await client.query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='rooms_v2' and column_name='launch_status') as present")).rows[0].present;
    } catch (error) {
      throw new Error(`Inventaire PostgreSQL impossible${/^[A-Z0-9]{5}$/.test(error.code || '') ? ` (${error.code})` : ''}. Aucun changement effectué.`);
    }
    const missing = [...Object.entries(inventory.functions), ...Object.entries(inventory.tables)].filter(([, present]) => !present).map(([name]) => name);
    if (!inventory.launchStatus) missing.push('rooms_v2.launch_status');
    if (missing.length) throw new Error(`Déploiement incomplet : ${missing.join(', ')}. Aucun changement effectué.`);
  });
} finally {
  if (connected) await client.query('rollback').catch(() => {});
  await client.end().catch(() => {});
  report.data.finishedAt = new Date().toISOString();
  await report.save();
  await writeFile(resolve(report.directory, 'deployment.json'), JSON.stringify(inventory, null, 2));
}
console.log(`Rapport : ${report.directory}`);
if (report.data.results.some(r => r.status === 'FAIL')) process.exitCode = 1;
