// Dedicated private recipe only. No service credential or Vault secret is logged.
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),dir=resolve(root,'app/build/shared-recipe');
const {Client}=createRequire(resolve(root,'tools/messaging-media/package.json'))('pg');
const {createClient}=createRequire(resolve(root,'../Meewav-Web-supabase-wiring/package.json'))('@supabase/supabase-js');
const {createMessagingAttachmentsRepository}=await import(pathToFileURL(resolve(dir,'messaging-attachments.mjs')));
const readEnv=async p=>Object.fromEntries((await readFile(p,'utf8')).split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const env=await readEnv(resolve(root,'../Meewav-Web/.env.local'));
const props=await readEnv(resolve(root,'meewav.local.properties'));
const url=props.SUPABASE_URL.replaceAll('\\:',':'),key=props.SUPABASE_PUBLISHABLE_KEY;
assert.equal(new URL(url).hostname,'dqabekaqpznjsagoxzwc.supabase.co');
const secret=(await readEnv(resolve(dir,'cleanup-worker.env'))).MESSAGING_CLEANUP_WORKER_SECRET;
assert.equal(secret.length,64);
const endpoint=url+'/functions/v1/messaging-attachment-cleanup';
const dbUrl=new URL(env.SUPABASE_DB_URL);dbUrl.searchParams.delete('sslmode');
const db=new Client({connectionString:dbUrl.href,ssl:{rejectUnauthorized:true,ca:await readFile(resolve(root,'tools/messaging-media/supabase-ca.crt'),'utf8')}});
const account=JSON.parse(await readFile(resolve(dir,'accounts.json'),'utf8'))[0];
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),repo=createMessagingAttachmentsRepository(client);
try {
 assert.equal((await client.auth.signInWithPassword({email:account.email,password:account.password})).error,null);
 await db.connect();
 const person=await db.query('select username from public.profiles where id=$1',[account.id]);assert.equal(person.rows[0].username,'recette_eee3c08a');
 // First verify the worker independently before enabling its periodic dispatch.
 assert.equal((await fetch(endpoint,{method:'POST'})).status,401);
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const prepared=await repo.prepareUpload({clientUploadId:crypto.randomUUID(),conversationId:'fc290333-b588-4cd5-ad9d-6ef09f7dec89',purpose:'image',displayName:'Recette nettoyage abandonné.png',mimeType:'image/png',sizeBytes:bytes.length});
 await repo.uploadPrepared(prepared,bytes,'image/png');
 const exists=async()=>Number((await db.query('select count(*) from storage.objects where bucket_id=$1 and name=$2',[prepared.bucket,prepared.path])).rows[0].count);
 assert.equal(await exists(),1);
 // Deliberately omit the client's best-effort Storage removal to simulate a lost connection.
 assert.equal((await client.rpc('discard_messaging_upload_v1',{p_upload_id:prepared.uploadId})).error,null);
 assert.equal(await exists(),1);
 const response=await fetch(endpoint,{method:'POST',headers:{'x-meewav-cleanup-secret':secret}});
 assert.equal(response.status,200);const worker=await response.json();assert.ok(worker.completed>=1);
 assert.equal(await exists(),0);
 assert.equal((await db.query('select status from public.messaging_attachment_cleanup_jobs where upload_id=$1',[prepared.uploadId])).rows[0].status,'completed');
 assert.equal((await fetch(endpoint,{method:'POST',headers:{'x-meewav-cleanup-secret':secret}})).status,200);
 await db.query('BEGIN');
 for(const [name,value] of [['meewav_messaging_cleanup_url',endpoint],['meewav_messaging_cleanup_secret',secret]]){
  const existing=await db.query('select id from vault.secrets where name=$1',[name]);
  if(existing.rowCount)await db.query('select vault.update_secret($1,$2)',[existing.rows[0].id,value]);
  else await db.query('select vault.create_secret($1,$2)',[value,name]);
 }
 await db.query('COMMIT');
 const requestId=(await db.query('select public.dispatch_messaging_attachment_cleanup_v1() as id')).rows[0].id;
 const proof={at:new Date().toISOString(),anonymousRejected:true,abandonedRecipeObjectRemovedByWorker:true,jobCompleted:true,retrySucceeded:true,schedulerDispatchRequest:requestId,scope:'Only terminal unattached drafts; attached deleted-message retention is not purged'};
 await writeFile(resolve(dir,'attachment-cleanup-proof.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{await db.end();await client.removeAllChannels()}
process.exit(0);
