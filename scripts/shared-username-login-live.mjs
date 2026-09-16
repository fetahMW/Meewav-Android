// Dedicated recipe accounts only. No password/token/e-mail is emitted.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),dir=resolve(root,'app/build/shared-recipe');
const props=await readFile(resolve(root,'meewav.local.properties'),'utf8');
const host=props.match(/^SUPABASE_URL=(.+)$/m)[1].trim().replaceAll('\\:',':'),key=props.match(/^SUPABASE_PUBLISHABLE_KEY=(.+)$/m)[1].trim();
assert.equal(new URL(host).hostname,'dqabekaqpznjsagoxzwc.supabase.co');
const accounts=JSON.parse(await readFile(resolve(dir,'accounts.json'),'utf8'));
async function login(identifier,password){
 const r=await fetch(host+'/functions/v1/username-sign-in',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({identifier,password})});
 return {status:r.status,body:await r.json()};
}
const unknown=await login('recipe_unknown_'+Date.now().toString().slice(-4),'wrong-password');
const wrong=await login(accounts[0].username,'wrong-password');
assert.equal(unknown.status,401);assert.equal(wrong.status,401);assert.deepEqual(unknown.body,wrong.body);
for(const account of accounts){
 const result=await login(' '+account.username.toUpperCase()+' ',account.password);
 assert.equal(result.status,200,'Known credentials must sign in');assert.equal(result.body.user.id,account.id);
 const user=await fetch(host+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+result.body.access_token}});
 assert.equal(user.ok,true);assert.equal((await user.json()).id,account.id);
 const forbidden=await fetch(host+'/rest/v1/rpc/get_username_login_email_service_v1',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+result.body.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_username:accounts[0].username})});
 assert.equal(forbidden.ok,false,'New resolver must be service-only');
}
const legacy=await fetch(host+'/rest/v1/rpc/resolve_profile_email_for_username',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({p_username:accounts[0].username})});
const legacyBody=await legacy.json();
const proof={at:new Date().toISOString(),passed:['unknown/wrong responses identical','case-insensitive username login for both peers','sessions accepted by Auth','authenticated clients denied service resolver'],legacyAnonymousEmailResolverStillExposed:legacy.ok&&JSON.stringify(legacyBody).includes(accounts[0].email)};
await writeFile(resolve(dir,'username-login-proof.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
