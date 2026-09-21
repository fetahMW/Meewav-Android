import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../Meewav-Web/vendor/globe-vinyle/package.json',import.meta.url));
const {transform}=require('esbuild');
let source=await readFile(new URL('../app/src/main/scene-source/vendor/src/features/scene/comments/sceneCommentsLive.ts',import.meta.url),'utf8');
source=source.replace(/import \{ supabase \} from [^;]+;/,'const supabase=globalThis.__sceneTestClient;');
async function setup(pages){
 const calls=[];globalThis.__sceneTestClient={rpc(name,args){calls.push({name,args});const promise=Promise.resolve(pages.shift());promise.abortSignal=()=>promise;return promise;}};
 const {code}=await transform(source,{loader:'ts',format:'esm'});
 const module=await import('data:text/javascript;base64,'+Buffer.from(code+'\n//'+crypto.randomUUID()).toString('base64'));
 return {...module,calls};
}
test('loads subsequent pages with exact cursor and deduplicates records',async()=>{
 const a={id:'a'},b={id:'b'},c={id:'c'};
 const api=await setup([{data:{items:[a,b],next:{time:'2026-09-21',id:'b'}},error:null},{data:{items:[b,c],next:null},error:null}]);
 assert.deepEqual(await api.listSceneComments('media'),[a,b,c]);
 assert.equal(api.calls[1].args.p_after_id,'b');assert.equal(api.calls[1].args.p_after_time,'2026-09-21');
});
test('failed later page never returns an incomplete successful list',async()=>{
 const api=await setup([{data:{items:[{id:'a'}],next:{time:'date',id:'a'}},error:null},{data:null,error:Error('denied')}]);
 await assert.rejects(api.listSceneComments('media'),/denied/);
});
test('bad repeated cursor cannot cause endless requests',async()=>{
 const page={data:{items:[{id:'a'}],next:{time:'date',id:'a'}},error:null};const api=await setup([page,page]);
 await assert.rejects(api.listSceneComments('media'),/invalid_comments_cursor/);assert.equal(api.calls.length,2);
});
test('cancelled screen starts no further request',async()=>{
 const api=await setup([]);const controller=new AbortController();controller.abort();
 await assert.rejects(api.listSceneComments('media',controller.signal),{name:'AbortError'});assert.equal(api.calls.length,0);
});
