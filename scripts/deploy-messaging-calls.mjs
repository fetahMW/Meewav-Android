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
  const {rows}=await client.query(`select to_regclass('public.messaging_direct_conversations_v1')::text as direct_pairs,
    to_regclass('realtime.messages')::text as private_broadcast,
    to_regclass('public.messaging_video_calls_v1')::text as video_calls`);
  console.log(rows[0]);
  if (process.argv.includes('--apply')) {
    if (!rows[0].direct_pairs || !rows[0].private_broadcast) throw Error('Messaging foundation must be deployed first');
    if (rows[0].video_calls) throw Error('Call migration already present; do not replay it');
    await client.query(await readFile(resolve(root,'supabase/migrations/20260915193000_messaging_video_calls_v1.sql'),'utf8'));
    console.log('Messaging call migration applied.');
  }
} catch(error) { console.error('Database operation failed:',error.code || error.message?.replace(/postgres(?:ql)?:\/\/\S+/g,'[connection]')); process.exitCode=1; }
finally { await client.end(); }
