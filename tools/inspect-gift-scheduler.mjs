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
  console.log((await client.query("select scheduler_status,scheduler_detail from public.room_gift_draw_scheduler_health_v1")).rows); console.log((await client.query("select extversion from pg_extension where extname='pg_cron'")).rows);console.log((await client.query("select d.status,d.return_message from cron.job_run_details d join cron.job j on j.jobid=d.jobid where j.jobname='rooms-gift-draws-v1' order by d.start_time desc limit 1")).rows); } catch(e) { console.error(e.code || 'schema_read_failed'); process.exitCode=1; } finally {await client.end();}
