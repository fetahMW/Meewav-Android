import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'tools/messaging-media/package.json'));
const {Client}=require('pg');
const env=Object.fromEntries((await readFile(resolve(root,'../Meewav-Web/.env.local'),'utf8')).split(/\r?\n/)
  .filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')];}));
const database=new URL(env.SUPABASE_DB_URL);
if (!`${database.hostname}/${database.username}`.includes('dqabekaqpznjsagoxzwc')) throw Error('Unexpected deployment target');
// Keep the credential entirely in process memory; never put it in CLI arguments.
database.searchParams.delete('sslmode');
const client=new Client({connectionString:database.href,ssl:{rejectUnauthorized:true,
  ca:await readFile(resolve(root,'tools/messaging-media/supabase-ca.crt'),'utf8')},connectionTimeoutMillis:15000});
try {
  await client.connect();
  const {rows}=await client.query(`select pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('rooms_classe_accept_applications_v1','rooms_classe_reject_applications_v1','rooms_classe_invite_v1','rooms_classe_update_course_v1','rooms_classe_course_projection_v1','rooms_classe_reserve_course_asset_v1')`);
  const {writeFile}=await import('node:fs/promises'); await writeFile(resolve(root,'tools/classe-course-contract.sql'),rows.map(x=>x.definition).join('\n'));
  const {rows:checks}=await client.query("select conname,pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.rooms_v2'::regclass and contype='c'"); console.log(checks);

} catch(e) { console.error(e.code || 'schema_read_failed'); process.exitCode=1; } finally {await client.end();}
