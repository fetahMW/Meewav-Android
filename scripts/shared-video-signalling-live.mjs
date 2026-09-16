// Dedicated recipe peers only. Tokens are asserted in memory, never logged.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),dir=resolve(root,'app/build/shared-recipe');
const props=await readFile(resolve(root,'meewav.local.properties'),'utf8');
const host=props.match(/^SUPABASE_URL=(.+)$/m)[1].trim().replaceAll('\\:',':'),key=props.match(/^SUPABASE_PUBLISHABLE_KEY=(.+)$/m)[1].trim();
assert.equal(new URL(host).hostname,'dqabekaqpznjsagoxzwc.supabase.co');
const accounts=JSON.parse(await readFile(resolve(dir,'accounts.json'),'utf8')),sessions=[];
for(const account of accounts){const r=await fetch(host+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password:account.password})});assert.equal(r.ok,true);sessions.push(await r.json())}
async function call(index,name,body){const r=await fetch(host+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+sessions[index].access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.ok,true,name+' status '+r.status);return r.json()}
const conversation=await call(0,'get_or_create_direct_conversation_v1',{p_other_profile_id:accounts[1].id,p_idempotency_key:crypto.randomUUID()});
let started;
try{
 started=await call(0,'messaging_video_call_v1',{p_action:'start',p_conversation_id:conversation.conversation_id});assert.equal(started.status,'ringing');
 const incoming=await call(1,'messaging_video_call_v1',{p_action:'sync'});assert.equal(incoming.id,started.id);assert.equal(incoming.incoming,true);
 assert.equal((await call(1,'messaging_video_call_v1',{p_action:'accept',p_call_id:started.id})).status,'accepted');
 const media=[];
 for(let i=0;i<2;i++){
  const r=await fetch(host+'/functions/v1/messaging-call-token',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+sessions[i].access_token,'Content-Type':'application/json',Origin:'https://appassets.androidplatform.net'},body:JSON.stringify({callId:started.id})});const data=await r.json();
  assert.equal(r.ok,true,'Edge token HTTP '+r.status+' '+(data.error||''));assert.ok(data.token);assert.ok(data.appId);assert.equal(data.identity,accounts[i].id);assert.equal(data.peerId,accounts[1-i].id);
  media.push({roomId:data.roomId,cors:r.headers.get('access-control-allow-origin')});
 }
 assert.equal(media[0].roomId,media[1].roomId);
 const proof={at:new Date().toISOString(),assertions:['caller ringing','recipient incoming','accepted state shared','deployed Edge function issues both authorized RTC credentials','same RTC room and opposite identities'],cors:media[0].cors,rtcMediaExchangeTested:false};
 await writeFile(resolve(dir,'video-signalling-proof.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{if(started)await call(0,'messaging_video_call_v1',{p_action:'end',p_call_id:started.id})}
