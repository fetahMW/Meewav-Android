import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(root,'../Meewav-Web/package.json'));
const { build }=createRequire(resolve(root,'../Meewav-Web/vendor/globe-vinyle/package.json'))('esbuild');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<div id="app"></div>');
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react');const {createRoot}=require('react-dom/client');
const output=resolve(root,'app/build/shared-recipe/native-identity-profile-test.mjs');
await build({entryPoints:[resolve(root,'app/src/main/messaging-source/runtime.ts')],outfile:output,bundle:true,platform:'node',format:'esm',plugins:[{name:'isolate-session',setup(b){
 b.onResolve({filter:/^react$/},()=>({path:pathToFileURL(require.resolve('react')).href,external:true}));
 b.onResolve({filter:/^@supabase\/supabase-js$/},()=>({path:'backend',namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const createClient=()=>({realtime:{setAuth:async()=>{}},removeAllChannels:async()=>{},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:globalThis.profileFixture,error:null})})})})});'}));
}}]});
let requests=0;
globalThis.profileFixture={display_name:'Naya',full_name:'Naya Dupont',profile_image_url:'https://example.test/naya.jpg',primary_role_key:'vocalist'};
globalThis.fetch=async()=>{requests++;return {ok:true,json:async()=>({id:'owner-a',email:'naya@example.test',user_metadata:{display_name:'Old OAuth name',first_name:'Naya',last_name:'Dupont'}})};};
const {useAuth,configure,updateToken,refreshIdentity}=await import(pathToFileURL(output));
test('canonical profile enriches all native surfaces without mixing demo or retaining logged-out identity',async()=>{
 let current;
 function View(){current=useAuth().user;return React.createElement('span',null,current?.id);}
 const view=createRoot(document.getElementById('app'));
 configure({preview:true,url:'',key:'',token:null,userId:null});
 await React.act(async()=>view.render(React.createElement(View)));
 assert.equal(requests,0);assert.equal(current,null);
 await React.act(async()=>{configure({preview:false,url:'https://example.test',key:'public',token:'session',userId:'owner-a'});await refreshIdentity();});
 assert.equal(current.user_metadata.display_name,'Naya');assert.equal(current.user_metadata.first_name,'Naya');
 assert.equal(current.user_metadata.profile_image_url,'https://example.test/naya.jpg');
 const original=current;
 await React.act(async()=>{await refreshIdentity();});assert.equal(current,original);
 await React.act(async()=>updateToken(null));assert.equal(current,null);
 await React.act(async()=>view.unmount());dom.window.close();
});
