import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../Meewav-Web/vendor/globe-vinyle/package.json',import.meta.url));
const {build}=require('esbuild');
const source=fileURLToPath(new URL('../app/src/main/rooms-source/viewer-web/src/features/rooms/place/place.service.ts',import.meta.url));
const result=await build({entryPoints:[source],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'backend-stub',setup(b){
 b.onResolve({filter:/supabaseClient$/},()=>({path:'supabase',namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const supabase={};'}));
}}]});
const {createPlaceRepository}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
function client(type='place',status='live',error=null){
 const calls=[];
 return {calls,from:()=>({select:()=>({eq:()=>({single:async()=>({data:{type,status,host_id:'ios-host'},error:null})})})}),rpc:async(name,args)=>{calls.push({name,args});return {error}}};
}
test('iOS room admission uses the server role and exact selected room',async()=>{
 const c=client();await createPlaceRepository(c).enterRoom('ios-room');
 assert.deepEqual(c.calls,[{name:'rooms_enter_room_v2',args:{p_room_id:'ios-room'}}]);
});
test('banned viewer is rejected without local fallback',async()=>{
 const failure={message:'banned'};const c=client('place','live',failure);
 await assert.rejects(createPlaceRepository(c).enterRoom('ios-room'),e=>e===failure);
});
test('ended room cannot be entered',async()=>{
 const c=client('place','ended');await assert.rejects(createPlaceRepository(c).enterRoom('ios-room'),/room_ended/);assert.equal(c.calls.length,0);
});
test('class admission keeps its dedicated access contract',async()=>{
 const c=client('classe');await createPlaceRepository(c).enterRoom('class-room');assert.equal(c.calls[0].name,'rooms_join_classe_v1');
});
test('leave uses server cleanup instead of bypassing lifecycle',async()=>{
 const c=client();await createPlaceRepository(c).leaveRoom('ios-room');assert.deepEqual(c.calls,[{name:'rooms_leave_room_v2',args:{p_room_id:'ios-room'}}]);
});
