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
  const {rows}=await client.query("select p.proname as name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'");
  const {rows:tables}=await client.query("select table_name as name from information_schema.tables where table_schema='public'");
  const {writeFile}=await import('node:fs/promises');
  await writeFile(resolve(root,'tools/feature-server-contracts.json'),JSON.stringify({functions:rows.map(x=>x.name),tables:tables.map(x=>x.name)}));
  console.log('Server contract inventory saved (names only).');
} catch(e) { console.error(e.code || 'schema_read_failed'); process.exitCode=1; } finally {await client.end();}
