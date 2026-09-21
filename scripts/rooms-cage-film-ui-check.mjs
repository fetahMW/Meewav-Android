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


await page.getByRole('button',{name:/Ouvrir .*La Cage.*spectateurs/}).first().click();
await page.getByRole('region',{name:'Le host vous accueille'}).waitFor();
await page.locator('.cage-host-return video').waitFor();
await page.evaluate(()=>window.__hostVideo=document.querySelector('.cage-host-return video')); 
await page.locator('[data-surface="tools"]').click();
await page.getByRole('dialog',{name:'Le tournoi commence'}).waitFor({timeout:10000});
assert.equal(await page.locator('.cvm-bracket section').count(),3,'8 artists start in quarter finals');
const menuGap=await page.evaluate(()=>document.querySelector('.cvm-tabs').getBoundingClientRect().top-document.querySelector('.place-studio-panel__bar').getBoundingClientRect().bottom);
console.log('Host submenu gap',menuGap);
assert.ok(Math.abs(menuGap-2)<1,'host submenu gap is 2px');
await page.getByRole('button',{name:'Suivre le premier battle'}).click();
const pip=page.locator('.cage-host-pip');const initial=await pip.boundingBox();
await page.mouse.move(initial.x+initial.width/2,initial.y+initial.height/2);await page.mouse.down();await page.mouse.move(initial.x+initial.width/2-65,initial.y+initial.height/2-20,{steps:5});await page.mouse.up();
const moved=await pip.boundingBox();assert.ok(moved.x<initial.x-40,'host inset drags horizontally');
console.log('Host inset drag OK');

await page.waitForFunction(()=>{const v=[...document.querySelectorAll('.cage-program-with-host .cage-stage-feed video')];return v.length===2&&v.every(el=>el.readyState>=2&&!el.paused)&&v.some(el=>!el.muted&&el.volume>0);},{timeout:3000});
await page.waitForFunction(()=>{const a=document.querySelector('.cage-program-with-host .cage-stage-feed.is-a video'),b=document.querySelector('.cage-program-with-host .cage-stage-feed.is-b video');return a&&b&&a.muted&&!b.muted&&!b.paused&&b.volume>0;},{timeout:3500});
const frame=await page.locator('.cage-stage-feed.is-b').evaluate(el=>getComputedStyle(el,'::after').borderTopColor);
assert.equal(frame,'rgb(185, 154, 223)');
console.log('Automatic audio: A then B, violet active frame OK');
await page.evaluate(async()=>{await document.querySelector('.place-stage').requestFullscreen();});
await page.getByRole('dialog',{name:'Le public vote'}).waitFor({timeout:7000});
assert.equal(await page.getByRole('dialog',{name:'Le public vote'}).evaluate(el=>document.fullscreenElement.contains(el)),true,'vote belongs to fullscreen surface');
assert.equal(await page.locator('.cage-stage-program__duel-axis').count(),0);
assert.equal(await page.locator('.cage-stage-feed .is-camera-off').count(),0,'both demo cameras enabled');
assert.equal(await page.locator('.cage-program-with-host .cage-stage-feed video').count(),2,'both participants have video');
assert.equal(await page.locator('.cage-viewer-modal').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
assert.ok(await page.locator('.cage-program-with-host video').evaluateAll(videos=>videos.every(v=>v.getBoundingClientRect().height>100)),'duel videos have visible height');
assert.equal(await page.locator('.cage-host-return video').evaluate(v=>v.paused),false,'host keeps playing');
const feeds=await page.locator('.cage-program-with-host .cage-stage-feed video').evaluateAll(nodes=>nodes.map(v=>({ready:v.readyState,error:v.error?.code,src:v.currentSrc,paused:v.paused})));
assert.ok(feeds.every(v=>v.ready>=2&&!v.error&&!v.paused&&v.src.startsWith('blob:')),JSON.stringify(feeds));
await page.getByRole('dialog',{name:'Le public vote'}).getByRole('button',{name:'Je valide'}).first().click();
assert.equal(await page.getByRole('button',{name:'Votre choix'}).isDisabled(),true);
await page.getByRole('dialog',{name:'Résultat du battle'}).waitFor({timeout:6000});
assert.equal(await page.locator('.cage-host-persistent-main.is-pair .cage-host-return video').count(),1);
assert.equal(await page.locator('.cage-host-layout.is-pair .cage-winner-return video').count(),1);
assert.equal(await page.locator('.cage-host-pip').count(),0);
assert.equal(await page.evaluate(()=>window.__hostVideo===document.querySelector('.cage-host-return video')),true,'host decoder remains mounted');
console.log('Host arrival and winner intermission OK');
await page.getByRole('dialog').getByRole('button',{name:'Fermer la fenêtre'}).click();
await page.evaluate(()=>document.exitFullscreen());
const tabStyle=await page.locator('.cvm-tabs button').first().evaluate(el=>({background:getComputedStyle(el).backgroundImage,border:getComputedStyle(el).borderTopWidth}));
assert.deepEqual(tabStyle,{background:'none',border:'0px'});
for(const label of ['Open Mic','Open Mic Battle','Championnat','Tournoi']) {
 await page.getByRole('button',{name:'Simuler La Cage',exact:true}).click();
 const chooser=page.getByRole('dialog',{name:'Simuler La Cage'});await chooser.waitFor();
 await chooser.getByRole('button').filter({has:page.getByText(label,{exact:true})}).click();
 const intro=page.getByRole('dialog',{name:'Le tournoi commence'});await intro.waitFor();
 assert.ok((await intro.innerText()).includes('8 artistes'));
 await intro.getByRole('button',{name:'Fermer la fenêtre'}).click();
 console.log(label,'picker and intro OK');
}
assert.deepEqual(errors,[]);await browser.close();server.close();

