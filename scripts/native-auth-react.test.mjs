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
const output=resolve(root,'app/build/shared-recipe/native-runtime-test.mjs');
await build({entryPoints:[resolve(root,'app/src/main/messaging-source/runtime.ts')],outfile:output,bundle:true,platform:'node',format:'esm',plugins:[{name:'isolate-session',setup(b){
 b.onResolve({filter:/^react$/},()=>({path:pathToFileURL(require.resolve('react')).href,external:true}));
 b.onResolve({filter:/^@supabase\/supabase-js$/},()=>({path:'backend',namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const createClient=()=>({realtime:{setAuth:async()=>{}},removeAllChannels:async()=>{}});'}));
}}]});
const {useAuth,configure,updateToken}=await import(pathToFileURL(output));
test('native identity stays stable during UI rerenders/token refresh and clears on logout',async()=>{
 const native={preview:false,url:'https://example.supabase.co',key:'public',token:'token-one',userId:'owner-a'};
 configure(native);
 let loads=0,lastUser;
 function View({n}){const {user}=useAuth();lastUser=user;React.useEffect(()=>{if(user)loads++},[user]);return React.createElement('span',null,`${n}:${user?.id??'anonymous'}`);}
 const view=createRoot(document.getElementById('app'));
 await React.act(async()=>view.render(React.createElement(View,{n:1})));
 const firstUser=lastUser;
 await React.act(async()=>view.render(React.createElement(View,{n:2})));
 await React.act(async()=>updateToken('token-two'));
 assert.equal(loads,1);assert.equal(lastUser,firstUser);
 await React.act(async()=>updateToken(null));assert.equal(lastUser,null);
 await React.act(async()=>configure({...native,userId:'owner-b',token:'token-three'}));
 assert.equal(lastUser.id,'owner-b');assert.equal(loads,2);
 await React.act(async()=>view.unmount());dom.window.close();
});
