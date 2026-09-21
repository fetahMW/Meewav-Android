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
 const sql='begin;\n'+(await Promise.all(['20260814113000_rooms_gift_draws_v1.sql', '20260815133000_rooms_end_gift_draw_cleanup_v1.sql', '20260815142000_profile_certif_endorsements_v1.sql', '20260815160000_profile_gift_inventory_v1.sql','20260922200000_activate_shared_gift_inventory.sql','20260922210000_fix_gift_scheduler.sql'].map(file=>readFile(resolve(root,'supabase/migrations',file),'utf8')))).map(s=>s.replace(/^\s*(begin|commit);\s*$/gmi,'')).join('\n')+'\ncommit;';
 await client.query(sql.replace(/commit;\s*$/, 'rollback;'));
 console.log('Gift inventory migration validated in rolled-back transaction.');
 if(process.argv.includes('--apply')) { await client.query(sql);await client.query("NOTIFY pgrst, 'reload schema'"); console.log('Gift inventory shared contract deployed.'); }

} catch(e) {console.error(e.code || 'migration_failed',e.position,e.message?.replace(/postgres(?:ql)?:\/\/\S+/g,'[redacted]'));process.exitCode=1;} finally {await client.end();}

