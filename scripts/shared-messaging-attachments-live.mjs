// Exercise the actual shared repository, private recipe accounts and Storage API.
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),web=resolve(root,'../Meewav-Web-supabase-wiring'),dir=resolve(root,'app/build/shared-recipe');
const {createClient}=createRequire(resolve(root,'../Meewav-Web/package.json'))('@supabase/supabase-js');
const {build}=createRequire(resolve(root,'../Meewav-Web/vendor/globe-vinyle/package.json'))('esbuild');
await build({entryPoints:[resolve(web,'src/features/messaging/messaging.attachments.service.ts')],outfile:resolve(dir,'messaging-attachments.mjs'),bundle:true,platform:'node',format:'esm',plugins:[{name:'injected-client',setup(b){b.onResolve({filter:/lib\/supabaseClient$/},()=>({path:'injected',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const supabase=null;'}));}}]});
const {createMessagingAttachmentsRepository}=await import(pathToFileURL(resolve(dir,'messaging-attachments.mjs')));
const props=await readFile(resolve(root,'meewav.local.properties'),'utf8');
const url=props.match(/^SUPABASE_URL=(.+)$/m)[1].trim().replaceAll('\\:',':'),key=props.match(/^SUPABASE_PUBLISHABLE_KEY=(.+)$/m)[1].trim();
assert.equal(new URL(url).hostname,'dqabekaqpznjsagoxzwc.supabase.co');
const accounts=JSON.parse(await readFile(resolve(dir,'accounts.json'),'utf8')),clients=[];
for(const account of accounts){const c=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});assert.equal((await c.auth.signInWithPassword({email:account.email,password:account.password})).error,null);clients.push(c)}
const [a,b]=clients,repo=createMessagingAttachmentsRepository(a),peer=createMessagingAttachmentsRepository(b);
const {data:conv,error}=await a.rpc('get_or_create_direct_conversation_v1',{p_other_profile_id:accounts[1].id,p_idempotency_key:crypto.randomUUID()});assert.equal(error,null);
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
const input={clientUploadId:crypto.randomUUID(),conversationId:conv.conversation_id,purpose:'image',displayName:'Recette privée.png',mimeType:'image/png',sizeBytes:bytes.length};
const prepared=await repo.prepareUpload(input);assert.equal((await repo.prepareUpload(input)).uploadId,prepared.uploadId);
await repo.uploadPrepared(prepared,bytes,'image/png');
assert.ok((await b.storage.from(prepared.bucket).createSignedUrl(prepared.path,60)).error,'Peer cannot read unsent draft');
await repo.finalizeUpload({uploadId:prepared.uploadId});
const send={conversationId:conv.conversation_id,clientMessageId:crypto.randomUUID(),kind:'image',body:'Image privée de recette',attachments:[{uploadId:prepared.uploadId}]};
const sent=await repo.sendMessage(send);assert.equal((await repo.sendMessage(send)).messageId,sent.messageId);
const message=(await peer.listMessages({conversationId:conv.conversation_id})).find(m=>m.id===sent.messageId);assert.equal(message.attachments.length,1);
const signed=await peer.createSignedAttachmentUrl(message.attachments[0],60);assert.equal((await fetch(signed)).status,200);
const anon=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});assert.ok((await anon.storage.from(prepared.bucket).createSignedUrl(prepared.path,60)).error,'Anonymous access denied');
// Delete only this recipe message. Its blob remains for the configured retention worker.
assert.equal((await a.rpc('delete_message_v1',{p_message_id:sent.messageId})).error,null);
assert.ok((await b.storage.from(prepared.bucket).createSignedUrl(prepared.path,60)).error,'Deleted message denies fresh signed URLs');
const draft=await repo.prepareUpload({...input,clientUploadId:crypto.randomUUID()});await repo.uploadPrepared(draft,bytes,'image/png');
await repo.discardUpload(draft.uploadId);
assert.ok((await a.storage.from(draft.bucket).createSignedUrl(draft.path,60)).error,'Discarded draft object removed by Storage API');
const proof={at:new Date().toISOString(),assertions:['actual shared repository reservation and upload','reservation and send retries retain IDs','recipient cannot read unsent draft','recipient attached signed download 200','anonymous denied','soft deleted attachment denies fresh grant','discard removes draft using Storage API'],retainedRecipeMessage:sent.messageId,retentionWorkerVerified:false};
await writeFile(resolve(dir,'messaging-attachments-proof.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
for(const c of clients)await c.removeAllChannels();process.exit(0);
