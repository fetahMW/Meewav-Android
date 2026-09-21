import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../Meewav-Web/vendor/globe-vinyle/package.json',import.meta.url));
const {build}=require('esbuild');
const source=fileURLToPath(new URL('../app/src/main/rooms-source/viewer-web/src/features/rooms/tools/roomTools.supabase.ts',import.meta.url));
const result=await build({entryPoints:[source],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'test-dependencies',setup(b){
  b.onResolve({filter:/supabaseClient|roomTools\.service|waveTools\.domain/},args=>({path:args.path,namespace:'stub'}));
  b.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:args.path.includes('supabaseClient')?'export const supabase={};':args.path.includes('roomTools.service')?'export const commandAllowed=()=>true; export const reduceCommand=()=>{};':'export const normalizeWaveState=()=>{};'}));
}}]});
const {SupabaseRoomToolsRepository}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
function client(response){const calls=[];return{calls,rpc:async(name,args)=>{calls.push({name,args});return response;}};}
test('missing live contract never returns investor projection',async()=>{
  const c=client({data:null,error:{code:'PGRST202',message:'missing'}});
  await assert.rejects(new SupabaseRoomToolsRepository(c).load('scene','real-room'),/contract_unavailable/);
  assert.deepEqual(c.calls.map(x=>x.name),['rooms_get_specialized_state_v1']);
});
test('missing host configuration never uploads a demo state',async()=>{
  const c=client({data:null,error:null});
  await assert.rejects(new SupabaseRoomToolsRepository(c).projectionForRole('scene','real-room','host','owner'),/configuration_missing/);
  assert.equal(c.calls.some(x=>/initialize|commit/.test(x.name)),false);
});
test('failed viewer mutation never reports a local success',async()=>{
  const c=client({data:null,error:{code:'42883',message:'missing'}});
  await assert.rejects(new SupabaseRoomToolsRepository(c).execute('place','real-room','viewer',{type:'place.queue.join'},'viewer'),/contract_unavailable/);
});
test('permission denial is preserved rather than replaced by demo data',async()=>{
  const c=client({data:null,error:{code:'42501',message:'Access denied'}});
  await assert.rejects(new SupabaseRoomToolsRepository(c).load('loge','real-room'),/Access denied/);
});
