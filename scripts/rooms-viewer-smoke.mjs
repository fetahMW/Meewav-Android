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
for(const [id,label] of [['cage','La Cage'],['wave','La Wave'],['classe','La Classe'],['scene','La Scène'],['loge','La Loge'],['place','La Place']]) {
 await page.getByRole('button',{name:new RegExp('Ouvrir .*'+label+'.*spectateurs')}).first().click();
 await page.locator('.place-studio-panel__tabs').waitFor();await page.waitForTimeout(600);
 await page.locator('.place-stage').dispatchEvent('pointermove',{pointerType:'touch'});
 const videoBar=page.locator('.place-stage__controls');
 assert.equal(Math.round((await videoBar.boundingBox()).height),52,'Host-sized video toolbar');
 assert.equal(await page.locator('.place-stage').evaluate(el=>getComputedStyle(el).borderTopLeftRadius),'0px','Video has no rounded outer corners');
 assert.equal(await page.locator('.place-stage-layout__tile').first().evaluate(el=>getComputedStyle(el).borderTopLeftRadius),'0px','Video tiles have no rounded corners');
 const likes=await videoBar.locator('.shorts-reaction--like .shorts-reaction__count').textContent();
 assert.match(likes,/^\d+(?:,\d+)?K$/,'Likes use compact uppercase K');
 await page.screenshot({path:path.join(process.env.TEMP,`viewer-${id}-video-controls.png`)});
 await page.waitForTimeout(3400);
 assert.equal(await videoBar.evaluate(el=>getComputedStyle(el).opacity),'0','Video toolbar hides after inactivity');
 if(id==='wave') {
  const stage=page.locator('.place-stage');
  await stage.dispatchEvent('pointerdown',{pointerType:'touch',buttons:1});
  await videoBar.locator('button').first().focus();
  await videoBar.locator('button').first().evaluate(el=>el.blur());
  assert.ok(await stage.evaluate(el=>el.classList.contains('is-controls-visible')),'Blur during a touch must never hide the bar');
  await page.waitForTimeout(3200);
  assert.equal(await videoBar.evaluate(el=>getComputedStyle(el).opacity),'1','Toolbar stays visible while touching');
  await stage.dispatchEvent('pointerup',{pointerType:'touch',buttons:0});
  await stage.dispatchEvent('pointerleave',{pointerType:'touch',buttons:0});
  await page.waitForTimeout(500);
  assert.equal(await videoBar.evaluate(el=>getComputedStyle(el).opacity),'1','Touch release must not hide the toolbar');
  await page.waitForTimeout(2900);
  assert.equal(await videoBar.evaluate(el=>getComputedStyle(el).opacity),'0','Release restarts the three-second deadline');
  assert.equal(await page.getByRole('button',{name:'Revenir à la réalisation',exact:true}).count(),0);
 }

 if(await page.locator('.place-stage').getByRole('button',{name:/Voir le profil de/}).count()) {
 await page.locator('.place-stage').dispatchEvent('pointermove',{pointerType:'touch'});
 await page.locator('.place-stage').getByRole('button',{name:/Voir le profil de/}).first().click();
 await page.getByRole('dialog',{name:/Pré-profil/}).waitFor();
 await page.getByRole('button',{name:'Fermer le pré-profil',exact:true}).click();
 await page.getByRole('dialog',{name:/Pré-profil/}).waitFor({state:'detached'});
 }
 await page.locator('.place-studio-panel__tabs button[data-surface="tools"]').click();await page.waitForTimeout(700);
 const tools=page.locator('.place-studio-panel__surface:not([hidden])');
 assert.equal(await page.getByRole('button',{name:'Terminer le live',exact:true}).count(),0,'No host end-live control');
 if(id==='cage') {
  await page.evaluate(()=>window.dispatchEvent(new Event('cage-viewer-simulation-ready')));
  const vote=page.getByRole('button',{name:'Je valide',exact:true}).first();
  await vote.waitFor({timeout:20000});
  await vote.click();
  assert.equal(await page.getByRole('button',{name:'Votre choix',exact:true}).isDisabled(),true,'One ballot only');
  await page.locator('.cb-photo').first().click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({path:'C:/Users/linkw/AppData/Local/Temp/viewer-preprofile.png'});
  await page.evaluate(()=>window.meewavMessaging.back());
  await page.getByRole('dialog').waitFor({state:'detached'});
  await page.locator('.place-stage').evaluate(el=>el.requestFullscreen());
  await page.waitForTimeout(200);
  const halves=await page.locator('.cage-stage-program__duel-grid > .cage-stage-feed').evaluateAll(es=>es.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}));
  assert.equal(halves.length,2);
  assert.ok(Math.abs(halves[0].x-halves[1].x)<2 && halves[1].y>halves[0].y,'Fullscreen opponents vertically stacked');
  await page.screenshot({path:'C:/Users/linkw/AppData/Local/Temp/viewer-fullscreen.png'});
  await page.evaluate(()=>document.exitFullscreen());
 }
 if(id==='wave') {
  await page.getByRole('button',{name:'Préparer et soumettre ma boucle',exact:true}).click();
  await page.getByRole('button',{name:/Importer ma boucle/}).waitFor();
  const audioPath=path.join(assets,'audio/rooms/wave-test-pack/House_124BPM_A_minor/Loops_8bars/House_Bass_A_124BPM_8bars.wav');
  await page.locator('.wave-viewer-workshop input[type=file]').setInputFiles(audioPath);
  await page.getByLabel('Titre',{exact:true}).waitFor();
  await page.getByLabel('Titre',{exact:true}).fill('Boucle test Android');
  await page.getByRole('checkbox',{name:/Je possède les droits/}).check();
  // Use the room's advertised tempo, not a sample from a different host grid.
  const bpm=Number((await page.locator('.wave-viewer-rules-line').innerText()).match(/([\d.]+) BPM/)[1]);
  const rate=22050, samples=Math.round(60/bpm*4*4*rate), wav=Buffer.alloc(44+samples*2);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
  for(let i=0;i<samples;i++)wav.writeInt16LE(Math.round(Math.sin(i/rate*2*Math.PI*220)*1000),44+i*2);
  await page.locator('.wave-viewer-workshop input[type=file]').setInputFiles({name:'boucle-4-mesures.wav',mimeType:'audio/wav',buffer:wav});
  await page.getByLabel('Titre',{exact:true}).fill('Boucle test Android');
  await page.getByRole('checkbox',{name:/Je possède les droits/}).check();
  await page.getByRole('button',{name:'Soumettre ma boucle',exact:true}).click();
  await page.getByRole('button',{name:'Proposition transmise',exact:true}).waitFor();
 }
 if(id==='classe') {
  await page.getByRole('button',{name:'Lever la main',exact:true}).click();
  await page.getByRole('button',{name:'Baisser ma main',exact:true}).waitFor();
  await page.getByRole('button',{name:'Baisser ma main',exact:true}).click();
  await page.getByRole('button',{name:'Questions',exact:true}).click();
  await page.locator('#classe-viewer-question').fill('Comment régler le gain de ma voix ?');
  await page.locator('.room-audience-question button[type=submit]').click();
  await page.getByText('Question envoyée · elle apparaît en premier ci-dessous.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Ressources',exact:true}).click();
 }
 if(id==='scene') {
  await page.getByRole('button',{name:'Voir Lumière noire, Naya Oris',exact:true}).click();
  await page.getByRole('dialog',{name:'Détails du passage'}).waitFor();
  await page.getByRole('button',{name:'Fermer la fenêtre',exact:true}).click();
 }
 if(id==='loge') {
  await page.locator('.loge-viewer__tabs').getByRole('button',{name:'Questions',exact:true}).click();
  await page.locator('.loge-viewer__tabs').getByRole('button',{name:/Pour moi/}).click();
  await page.locator('.loge-viewer__question-cta').first().click();
 }
 if(id==='place') {
  await page.getByRole('button',{name:'Demander la parole',exact:true}).click();
  await page.getByRole('button',{name:'Retirer ma demande',exact:true}).waitFor();
  await page.getByRole('button',{name:'Retirer ma demande',exact:true}).click();
 }
 console.log(id,'tools OK');
 await page.screenshot({path:'C:/Users/linkw/AppData/Local/Temp/viewer-'+id+'.png'});
 await page.locator('.place-studio-panel__tabs button[data-surface="chat"]').click();
 const input=page.getByRole('textbox',{name:'Écrire un message',exact:true});
 await input.fill('Bravo pour ce live '+id);
 await page.getByRole('button',{name:'Envoyer',exact:true}).click();
 await page.getByText('Bravo pour ce live '+id,{exact:true}).waitFor();
 assert.ok(await page.locator('.place-chat__portrait img').evaluateAll(es=>es.every(e=>e.clientWidth<=40)),'Compact chat portraits');
 await page.locator('button.place-chat__portrait').last().click();
 await page.getByRole('dialog',{name:/Pré-profil/}).waitFor();
 await page.getByRole('button',{name:'Fermer le pré-profil',exact:true}).click();
 await page.getByRole('dialog',{name:/Pré-profil/}).waitFor({state:'detached'});
 await page.screenshot({path:'C:/Users/linkw/AppData/Local/Temp/viewer-'+id+'-chat.png'});
 await page.locator('.place-studio-panel__tabs button[data-surface="mixer"]').click();
 await page.screenshot({path:'C:/Users/linkw/AppData/Local/Temp/viewer-'+id+'-mixer.png'});
 await page.evaluate(()=>window.meewavMessaging.back());
 await page.locator('.android-room-viewer').waitFor({state:'detached'});
}
await page.getByRole('button',{name:/Ouvrir .*La Cage.*spectateurs/}).first().click();
await page.locator('.place-studio-panel__tabs button[data-surface="tools"]').click();
await page.evaluate(()=>window.dispatchEvent(new Event('cage-viewer-simulation-ready')));
await page.locator('.cb-photo').first().click();
await page.getByRole('dialog').waitFor();
  const profileRequest=page.waitForRequest(r=>r.url().startsWith('https://appassets.androidplatform.net/native/profile?'));
  await page.getByRole('dialog').getByRole('button',{name:'Voir profil',exact:true}).click();
  assert.ok(new URL((await profileRequest).url()).searchParams.get('route').startsWith('/profile/view/'),'Profile button reaches artist route');
const profilePage=await browser.newPage({viewport:{width:393,height:790}});
profilePage.on('pageerror',e=>errors.push(e.message));
profilePage.on('response',r=>{if(r.status()===404)missing.add(new URL(r.url()).pathname)});
await profilePage.goto('http://127.0.0.1:5187/profile/index.html');
await profilePage.waitForFunction(()=>window.meewavMessaging);
await profilePage.evaluate(()=>window.meewavMessaging.configure({preview:true,url:'',key:'',token:null,userId:null,route:'/profile/view/demo-artist'}));
await profilePage.locator('.profile-viewer-page').waitFor();
console.log('Artist profile route OK');
assert.deepEqual(errors,[]);assert.deepEqual([...missing],[]);console.log('errors',errors);console.log('missing',[...missing].slice(0,50));
await browser.close();server.close();
