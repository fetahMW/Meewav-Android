import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'..');
const {build}=createRequire(resolve(root,'../Meewav-Web/vendor/globe-vinyle/package.json'))('esbuild');
const output=resolve(root,'app/build/shared-recipe/voice-contract-test.mjs');
let uploads=0, calls=0, fail=true;
const ids=[];
globalThis.voiceBackend={
 storage:{from:()=>({upload:async()=>{uploads++;return {error:null};}})},
 rpc:async(name,args)=>{calls++;ids.push(args.p_client_message_id);return fail?{error:Error('response lost')}:{data:[],error:null};},
};
await build({entryPoints:[resolve(root,'app/src/main/messaging-source/iosDirectMessaging.ts')],outfile:output,bundle:true,platform:'node',format:'esm',plugins:[{name:'backend-only-stub',setup(b){
 b.onResolve({filter:/\/runtime$|^\.\/runtime$/},()=>({path:'runtime',namespace:'stub'}));
 b.onResolve({filter:/messaging\.service$/},()=>({path:'repository',namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path==='runtime'?'export const supabase=globalThis.voiceBackend;':'export const messagingRepository={};'}));
}}]});
const {sendIosVoice}=await import(pathToFileURL(output));
test('voice rejects out-of-contract drafts before network and safely reuses uncertain sends',async()=>{
 const file=new File(['aac-data'],'voice.m4a',{type:'audio/mp4'});
 for(const duration of [0,599,900001,NaN])await assert.rejects(sendIosVoice('conversation','owner',file,duration),/invalid_voice/);
 const tooLarge=new File([new Uint8Array(10*1024*1024+1)],'large.m4a',{type:'audio/mp4'});
 await assert.rejects(sendIosVoice('conversation','owner',tooLarge,1000),/invalid_voice/);
 assert.equal(uploads,0);assert.equal(calls,0);
 await assert.rejects(sendIosVoice('conversation','owner',file,1000),/response lost/);
 fail=false;
 await Promise.all([sendIosVoice('conversation','owner',file,1000),sendIosVoice('conversation','owner',file,1000)]);
 assert.equal(uploads,1);assert.equal(calls,2);assert.equal(ids[0],ids[1]);
 await assert.rejects(sendIosVoice('conversation','other-owner',file,1000),/owner_or_conversation_changed/);
 await sendIosVoice('conversation','owner',file,1000);assert.equal(calls,2);
});
