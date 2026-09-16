// Only private, dedicated recipe accounts. No credentials or message content in output.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),dir=resolve(root,'app/build/shared-recipe');
const {createClient}=createRequire(resolve(root,'../Meewav-Web/package.json'))('@supabase/supabase-js');
const props=await readFile(resolve(root,'meewav.local.properties'),'utf8');
const url=props.match(/^SUPABASE_URL=(.+)$/m)[1].trim().replaceAll('\\:',':');
const key=props.match(/^SUPABASE_PUBLISHABLE_KEY=(.+)$/m)[1].trim();
assert.equal(new URL(url).hostname,'dqabekaqpznjsagoxzwc.supabase.co');
const accounts=JSON.parse(await readFile(resolve(dir,'accounts.json'),'utf8'));
const sessions=[];
for(const account of accounts){
 const r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password:account.password})});
 assert.equal(r.ok,true,'Recipe authentication');sessions.push(await r.json());
}
const clients=sessions.map(s=>createClient(url,key,{accessToken:async()=>s.access_token,auth:{persistSession:false,autoRefreshToken:false}}));
function subscribed(channel){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Private channel timeout')),15000);channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);resolve(status)}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timer);reject(Error(status))}})})}
try {
 const {data:conversation,error}=await clients[0].rpc('get_or_create_direct_conversation_v1',{p_other_profile_id:accounts[1].id,p_idempotency_key:crypto.randomUUID()});assert.equal(error,null);
 const received=[];
 const own=clients[0].channel('messaging:user:'+accounts[0].id,{config:{private:true}}).on('broadcast',{event:'messaging_change'},e=>received.push(e.payload));
 await clients[0].realtime.setAuth();await subscribed(own);
 const foreign=clients[1].channel('messaging:user:'+accounts[0].id,{config:{private:true}});
 await clients[1].realtime.setAuth();
 await assert.rejects(subscribed(foreign),/CHANNEL_ERROR/,'Another owner private topic must be refused');
 await clients[1].removeChannel(foreign);
 const start=Date.now();
 const sent=await clients[1].rpc('send_message_v1',{p_conversation_id:conversation.conversation_id,p_client_message_id:crypto.randomUUID(),p_kind:'text',p_body:'Recette temps réel entre comptes dédiés'});assert.equal(sent.error,null);
 while(!received.some(p=>p.entity_id===conversation.conversation_id&&p.source_table==='messaging_messages')&&Date.now()-start<10000)await new Promise(r=>setTimeout(r,100));
 const event=received.find(p=>p.entity_id===conversation.conversation_id&&p.source_table==='messaging_messages');assert.ok(event,'Broadcast received after committed message');
 // Supabase adds its own event identifier to the application payload.
 assert.deepEqual(Object.keys(event).sort(),['domain','entity_id','id','occurred_at','operation','source_table','version']);
 const proof={at:new Date().toISOString(),assertions:['native accessToken client private subscription','foreign private topic denied','recipient notified of committed message','broadcast contains identifiers only'],latencyMs:Date.now()-start};
 await writeFile(resolve(dir,'realtime-proof.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{for(const c of clients)await c.removeAllChannels()}
process.exit(0);
