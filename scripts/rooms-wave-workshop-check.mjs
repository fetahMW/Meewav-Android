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



await page.getByRole('button',{name:/Ouvrir .*La Wave.*spectateurs/}).first().click();
await page.locator('[data-surface="tools"]').click();
await page.getByRole('button',{name:'Préparer et soumettre ma boucle'}).click();
await page.getByRole('region',{name:'Séquenceur de 16 mesures'}).waitFor();
assert.equal(await page.locator('.wave-test-grid span').count(),16);
await page.waitForTimeout(2000);
console.log('deck',await page.locator('.wave-test-deck').innerText());
console.log('errors',errors);
assert.equal(await page.getByRole('button',{name:'Télécharger la boucle de base',exact:true}).count()>0,true);
const bpm=Number((await page.locator('.wave-test-deck header small').innerText()).match(/[0-9]+/)[0]);
const rate=8000,frames=Math.round(60/bpm*4*4*rate);const wav=Buffer.alloc(44+frames*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(frames*2,40);
for(let i=0;i<frames;i++)wav.writeInt16LE(Math.round(Math.sin(i*440*2*Math.PI/rate)*1000),44+i*2);
await page.locator('.wave-viewer-workshop input[type=file]').setInputFiles({name:'essai.wav',mimeType:'audio/wav',buffer:wav});
await page.getByRole('button',{name:'Mute',exact:true}).waitFor();
await page.getByRole('button',{name:'Solo',exact:true}).click();
assert.equal(await page.getByRole('button',{name:'Solo',exact:true}).getAttribute('aria-pressed'),'true');
await page.getByRole('button',{name:'Mute',exact:true}).click();
assert.equal(await page.getByRole('button',{name:'Solo',exact:true}).getAttribute('aria-pressed'),'false');
await page.waitForTimeout(1200);
assert.equal(await page.locator('.wave-test-deck [role=alert]').count(),0);
assert.ok(Number(await page.locator('.wave-test-grid i').evaluate(el=>parseFloat(el.style.left)))>0,'playhead follows audio clock');
await page.getByRole('button',{name:'Ma participation',exact:true}).click();
assert.equal(await page.locator('.wave-test-deck').isVisible(),false);
assert.equal(await page.getByRole('heading',{name:'Mon passage sur scène'}).isVisible(),true);
const leave=page.getByRole('button',{name:'Quitter la file scène',exact:true});
if(await leave.count()) { await leave.click(); await page.getByRole('button',{name:'Rejoindre la file d’attente',exact:true}).waitFor(); }
assert.deepEqual(errors,[]);
console.log('16 bars, base playback, upload, mute/solo OK');
await browser.close();server.close();
