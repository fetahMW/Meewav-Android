import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(new URL('../../Meewav-Web/vendor/globe-vinyle/package.json',import.meta.url));
const {transform}=require('esbuild');
const source=await readFile(new URL('../app/src/main/rooms-source/viewer-web/src/features/rooms/tools/classroom/classroomIosAdapter.ts',import.meta.url),'utf8');
const {code}=await transform(source,{loader:'ts',format:'esm'});
const {projectClasse,executeClasse}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const snapshot={state_revision:2,room:{hands_open:true,questions_open:true},self_participation:{status:'backstage'},self_floor_request:{id:'request',status:'requested',requested_at:'2026-09-21'},onstage:[],questions:[]};
function client(data=snapshot){const calls=[];return {calls,auth:{getUser:async()=>({data:{user:{id:'student'}}})},rpc:async(name,args)=>{calls.push({name,args});return {data:name==='rooms_classe_profile_projection_v1'?{user_id:'student',username:'Élève'}:data,error:null};}};}
test('canonical admitted student occupies one seat with their raised hand; no demo data',async()=>{const c=client();const result=await projectClasse(c,'room');assert.equal(result.classe.people.length,1);assert.equal(result.classe.seats.length,24);assert.equal(result.classe.seats[0].status,'hand-raised');assert.equal(result.audience.eligible,true);assert.deepEqual(result.gifts.stock,[]);});
test('pending invitation does not grant participation',async()=>{const result=await projectClasse(client({...snapshot,self_participation:{status:'invited'},self_floor_request:null}),'room');assert.equal(result.audience.eligible,false);assert.equal(result.classe.people.length,0);});
test('question uses canonical command and stable submission identifier',async()=>{const c=client();await executeClasse(c,'room',{type:'classe.question.add',question:{id:'attempt',text:'Question'}},false);assert.deepEqual(c.calls.find(c=>c.name==='rooms_classe_submit_question_v1').args,{p_room_id:'room',p_body:'Question',p_client_request_id:'attempt'});});
test('server denial does not fabricate an updated projection',async()=>{const c=client();const rpc=c.rpc;c.rpc=async(name,args)=>name==='rooms_classe_submit_question_v1'?{data:null,error:Error('denied')}:rpc(name,args);await assert.rejects(executeClasse(c,'room',{type:'classe.question.add',question:{id:'attempt',text:'Question'}},false),/denied/);});
test('private reply targets teacher even when first roster member is the student',async()=>{const result=await projectClasse(client({...snapshot,room:{...snapshot.room,host_id:'teacher'}}),'room');assert.equal(result.classe.teacherId,'teacher');assert.notEqual(result.classe.teacherId,result.classe.people[0].id);});
test('already supported question stays supported after refreshing',async()=>{const result=await projectClasse(client({...snapshot,questions:[{id:'q',user:{user_id:'other'},body:'Question',like_count:1,current_user_has_liked:true}]}),'room');assert.deepEqual(result.classe.questions[0].supporterIds,['student']);});

