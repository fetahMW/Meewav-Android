// Real Auth/PostgREST recipe accounts only; credentials stay in ignored app/build.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const props = await readFile(resolve(root, 'meewav.local.properties'), 'utf8');
const host = props.match(/^SUPABASE_URL=(.+)$/m)[1].trim().replaceAll('\\:', ':');
const key = props.match(/^SUPABASE_PUBLISHABLE_KEY=(.+)$/m)[1].trim();
assert.equal(new URL(host).hostname, 'dqabekaqpznjsagoxzwc.supabase.co');
const dir = resolve(root, 'app/build/shared-recipe');
await mkdir(dir, { recursive: true });
async function request(path, { token, body, method = body ? 'POST' : 'GET', prefer } = {}) {
  const response = await fetch(host + path, { method, headers: {
    apikey: key, ...(token ? { Authorization: 'Bearer ' + token } : {}),
    'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}
const accounts=JSON.parse(await readFile(resolve(dir,'accounts.json'),'utf8'));assert.equal(accounts.length,2);
const sessions=[];for(const a of accounts){const r=await request('/auth/v1/token?grant_type=password',{body:{email:a.email,password:a.password}});assert.equal(r.ok,true);sessions.push(r.data);}
const rpc=async(index,name,body={})=>{const r=await request('/rest/v1/rpc/'+name,{token:sessions[index].access_token,body});assert.equal(r.ok,true,name+' HTTP '+r.status);return r.data;};
const conversation=(await rpc(0,'messaging_resolve_direct_conversation_v1',{p_peer_username:accounts[1].username}))[0];
const shared=await rpc(1,'get_or_create_direct_conversation_v1',{p_other_profile_id:accounts[0].id,p_idempotency_key:crypto.randomUUID()});assert.equal(shared.conversation_id,conversation.id);
const firstId=crypto.randomUUID(), secondId=crypto.randomUUID();
const [legacy,canonical]=await Promise.all([
 rpc(0,'messaging_send_text_message_v1',{p_conversation_id:conversation.id,p_client_message_id:firstId,p_body:'Recette technique : Android vers Web'}),
 rpc(1,'send_message_v1',{p_conversation_id:conversation.id,p_client_message_id:secondId,p_kind:'text',p_body:'Recette technique : Web vers Android'})
]);
const repeated=await rpc(0,'messaging_send_text_message_v1',{p_conversation_id:conversation.id,p_client_message_id:firstId,p_body:'Recette technique : Android vers Web'});assert.equal(repeated[0].id,legacy[0].id);
const rows=await rpc(1,'get_conversation_messages_v1',{p_conversation_id:conversation.id});assert.ok(rows.some(r=>r.id===legacy[0].id));assert.ok(rows.some(r=>r.id===canonical.message_id));
const old=await request('/rest/v1/messaging_messages_v1?select=id,body&conversation_id=eq.'+conversation.id,{token:sessions[0].access_token});assert.ok(old.data.some(r=>r.id===canonical.message_id));
const proof={at:new Date().toISOString(),assertions:['same private recipe conversation ID across contracts','concurrent opposite-direction messages committed','retry retains message ID','canonical read contains both messages','legacy read contains canonical message'],uiTested:false};await writeFile(resolve(dir,'messaging-proof.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
