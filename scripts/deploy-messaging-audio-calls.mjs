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
  const {rows}=await client.query("select pg_get_functiondef('public.messaging_video_call_v1(text,uuid,uuid)'::regprocedure) as definition");
  const definition=rows[0].definition;
  if(definition.includes("'kind',c.media_kind")) console.log('Audio call contract already deployed.');
  else {
    if(createHash('sha256').update(definition).digest('hex') !== 'b8a398b79ec3e499770f695cf810133930cdad801f9d5ad5a44bcfc9fc14a27c') throw Error('Call contract changed; review before applying');
    console.log('Existing call contract verified; additive audio migration ready.');
    if(process.argv.includes('--apply')) {
      await client.query(await readFile(resolve(root,'supabase/migrations/20260921210000_messaging_audio_calls.sql'),'utf8'));
      console.log('Audio call mode deployed; existing video entry point preserved.');
    }
  }
  const {rows:columns}=await client.query("select column_default, is_nullable from information_schema.columns where table_schema='public' and table_name='messaging_video_calls_v1' and column_name='media_kind'");
  console.log('Audio schema:',JSON.stringify(columns));
} catch(error) {console.error('Audio migration failed:',error.code || error.message);process.exitCode=1;}
finally {await client.end();}
