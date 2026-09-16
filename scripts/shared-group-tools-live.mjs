import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),dir=resolve(root,'app/build/shared-recipe');
const props=await readFile(resolve(root,'meewav.local.properties'),'utf8');
const host=props.match(/^SUPABASE_URL=(.+)$/m)[1].trim().replaceAll('\\:',':'),key=props.match(/^SUPABASE_PUBLISHABLE_KEY=(.+)$/m)[1].trim();
assert.equal(new URL(host).hostname,'dqabekaqpznjsagoxzwc.supabase.co');
const accounts=JSON.parse(await readFile(resolve(dir,'accounts.json'),'utf8')),sessions=[];
for(const account of accounts){const r=await fetch(host+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password:account.password})});assert.equal(r.ok,true);sessions.push(await r.json())}
async function rpc(index,name,body,expected=true){const r=await fetch(host+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+sessions[index].access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(r.ok!==expected)console.error(JSON.stringify({rpc:name,code:data.code,message:data.message}));assert.equal(r.ok,expected,name+' HTTP '+r.status);return data}
const group=await rpc(0,'create_artist_group_v1',{p_name:'Recette coordination Web Android',p_description:'Groupe privé de recette Supabase',p_visibility:'private',p_artistic_role:null,p_idempotency_key:'wiring-group-tools-20260916'});
const groupId=group.group_id;
// These two recipe profiles intentionally remain private. Seed only their test
// invitation; do not weaken public discovery or claim to exercise its creation UI.
const require=createRequire(resolve(root,'tools/messaging-media/package.json'));
const {Client}=require('pg');
const env=Object.fromEntries((await readFile(resolve(root,'../Meewav-Web/.env.local'),'utf8')).split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const dbUrl=new URL(env.SUPABASE_DB_URL);dbUrl.searchParams.delete('sslmode');
const db=new Client({connectionString:dbUrl.href,ssl:{rejectUnauthorized:true,ca:await readFile(resolve(root,'tools/messaging-media/supabase-ca.crt'),'utf8')}});
let invited;
try {
 await db.connect();await db.query('BEGIN');
 const fixture=await db.query(`select p.id,p.username from public.profiles p where p.id=any($1::uuid[]) order by p.username`,[accounts.map(a=>a.id)]);
 assert.deepEqual(fixture.rows.map(p=>p.username),['recette_af679d18','recette_eee3c08a']);
 const owned=await db.query(`select id from public.artist_groups where id=$1 and created_by_profile_id=$2 and visibility='private' and name='Recette coordination Web Android'`,[groupId,accounts[0].id]);
 assert.equal(owned.rowCount,1);
 const invitation=await db.query(`insert into public.artist_group_invitations(group_id,invitee_profile_id,invited_by_profile_id,idempotency_key)
 values($1,$2,$3,'wiring-group-tools-invite-fixture-20260916')
 on conflict(invited_by_profile_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id`,[groupId,accounts[1].id,accounts[0].id]);
 invited={invitation_id:invitation.rows[0].id};
 await db.query('COMMIT');
}catch(error){await db.query('ROLLBACK').catch(()=>{});throw error}finally{await db.end()}
await rpc(1,'respond_to_artist_group_invitation_v1',{p_invitation_id:invited.invitation_id,p_decision:'accept',p_idempotency_key:'wiring-group-tools-accept-20260916'});
const decision=crypto.randomUUID(),session=crypto.randomUUID();
const mutate=(who,id,action,payload={})=>rpc(who,'mutate_artist_group_tool_v1',{p_group_id:groupId,p_item_id:id,p_action:action,p_payload:payload});
const list=(who,kind)=>rpc(who,'list_artist_group_tools_v1',{p_group_id:groupId,p_kind:kind,p_before:null});
const payload={kind:'decision',title:'Cover de recette',options:['Bleue','Noire']};
await mutate(0,decision,'create',payload);assert.equal((await mutate(0,decision,'create',payload)).idempotent,true);
assert.ok((await list(1,'decision')).some(item=>item.id===decision));
await mutate(1,decision,'respond',{choice:0});await mutate(1,decision,'respond',{choice:1});
const observed=(await list(0,'decision')).find(item=>item.id===decision);
assert.equal(observed.responseCount,1);assert.equal(observed.counts['1'],1);
await mutate(0,decision,'close');
assert.equal((await list(1,'decision')).find(item=>item.id===decision).status,'closed');
await mutate(0,session,'create',{kind:'session',title:'Session de recette interclients',startsAt:new Date(Date.now()+86400000).toISOString(),place:'Studio de recette'});
await mutate(1,session,'respond',{attending:true});await mutate(1,session,'respond',{attending:true});
const attendance=(await list(0,'session')).find(item=>item.id===session);assert.equal(attendance.confirmedCount,1);assert.equal(attendance.responseCount,1);
const proof={at:new Date().toISOString(),groupId,fixture:'Private recipe invitation seeded by SQL; invitation creation/discovery UI not validated',assertions:['private group and invitation accepted through API','create retry no duplicate','peer reads persisted decision','changed vote counted once','closed decision persists','peer attendance counted once']};
await writeFile(resolve(dir,'group-tools-proof.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
