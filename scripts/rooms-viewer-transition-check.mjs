import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=process.cwd();const assets=path.join(root,'app/src/main/assets/rooms');
const manifest=JSON.parse(fs.readFileSync(path.join(assets,'asset-manifest.json')));
const require=createRequire(path.resolve(root,'../Meewav-Web/package.json'));
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const base=(url.pathname.startsWith('/profile/') || (req.headers.referer||'').includes('/profile/'))?path.join(root,'app/src/main/assets/profile'):assets;let name=decodeURIComponent(url.pathname).replace(/^\/(rooms|profile)\//,'').replace(/^\//,'');if(name===''||name==='rooms')name='index.html';const p=path.resolve(base,name);if(!p.startsWith(base+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',manifest[name]?.mime||({'html':'text/html','css':'text/css','js':'application/javascript'}[name.split('.').pop()]||'application/octet-stream'));fs.createReadStream(p).pipe(res);});
await new Promise(r=>server.listen(5187,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:393,height:790},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[];const missing=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.add(new URL(r.url()).pathname)});
await page.route('https://appassets.androidplatform.net/native/**',route=>route.abort());
await page.goto('http://127.0.0.1:5187/rooms/index.html');await page.waitForFunction(()=>window.meewavMessaging);await page.evaluate(()=>window.meewavMessaging.configure({preview:true,url:'',key:'',token:null,userId:null,route:'/rooms'}));

await page.getByRole('button',{name:/Ouvrir .*spectateurs/}).first().waitFor();

await page.getByRole('button',{name:/Ouvrir .*La Scène.*spectateurs/}).first().click();
await page.locator('.scene-program-heading').waitFor();
await page.evaluate(()=>{window.__viewTransitions=0; const original=document.startViewTransition?.bind(document);document.startViewTransition=(...args)=>{window.__viewTransitions++;return original(...args)};});
const tile=page.locator('.place-stage-layout__tile').first();
const box=await tile.boundingBox();
const before=await page.locator('.place-stage').getAttribute('data-composition');
await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
await page.waitForTimeout(600);
assert.equal(await page.evaluate(()=>window.__viewTransitions),0,'Touch must not start a document transition');
assert.equal(await page.locator('.place-stage').getAttribute('data-composition'),before,'Touch preserves composition');
assert.equal(await page.locator('.place-stage').evaluate(el=>el.classList.contains('is-controls-visible')),true);
await page.getByRole('button',{name:'Régie vidéo',exact:true}).click();
await page.getByRole('menu').getByRole('menuitemradio',{name:'Solo',exact:true}).click();
assert.equal(await page.evaluate(()=>window.__viewTransitions),0,'Director must not animate the document overlay');
assert.equal(errors.length,0);
console.log('Viewer touch and director: no document transition, controls visible, no runtime errors');
await browser.close();server.close();

