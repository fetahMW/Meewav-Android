import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=process.cwd();const assets=path.join(root,'app/src/main/assets/rooms');
const manifest=JSON.parse(fs.readFileSync(path.join(assets,'asset-manifest.json')));
const require=createRequire(path.resolve(root,'../Meewav-Web/package.json'));
const {chromium}=require('playwright');
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const base=url.pathname.startsWith('/globe-vinyle/')?path.join(root,'app/src/main/assets/globe-vinyle'):(url.pathname.startsWith('/profile/') || (req.headers.referer||'').includes('/profile/'))?path.join(root,'app/src/main/assets/profile'):assets;let name=decodeURIComponent(url.pathname).replace(/^\/(rooms|profile|globe-vinyle)\//,'').replace(/^\//,'');if(name===''||name==='rooms')name='index.html';const p=path.resolve(base,name);if(!p.startsWith(base+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',manifest[name]?.mime||({'html':'text/html','css':'text/css','js':'application/javascript'}[name.split('.').pop()]||'application/octet-stream'));fs.createReadStream(p).pipe(res);});
await new Promise(r=>server.listen(5187,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:393,height:790},deviceScaleFactor:1,isMobile:true,hasTouch:true});
page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});const errors=[];const missing=new Set();page.on('pageerror',e=>(errors.push(e.message),console.log('PAGE ERROR',e.message)));page.on('response',r=>{if(r.status()===404)missing.add(new URL(r.url()).pathname)});
await page.route('https://appassets.androidplatform.net/native/**',route=>route.abort());
await page.goto('http://127.0.0.1:5187/rooms/index.html');await page.waitForFunction(()=>window.meewavMessaging);await page.evaluate(()=>window.meewavMessaging.configure({preview:true,url:'',key:'',token:null,userId:null,route:'/rooms'}));

await page.getByRole('button',{name:/Ouvrir .*spectateurs/}).first().waitFor();





await page.getByRole('button',{name:/Ouvrir .*La Classe.*spectateurs/}).first().click();
await page.locator('[data-surface="tools"]').click();
await page.locator('.classroom-seats').waitFor();
const grid=await page.locator('.classroom-seats').evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,count:el.children.length,height:el.getBoundingClientRect().height,scroll:el.scrollHeight}));
assert.equal(grid.columns,4);assert.equal(grid.count,24);assert.equal(await page.locator('.classe-student-heading').count(),0);
await page.locator('.classroom-seat__person').first().click();
await page.locator('.guest-offer').waitFor();
assert.equal(await page.locator('.class-student-pre-profile').count(),1);
await page.locator('.cage-profile-content .ring-artist-preprofile').waitFor();
await page.waitForTimeout(250);
const footer=await page.locator('.class-student-pre-profile .mw-preprofile__footer').boundingBox();
assert.ok(footer && footer.y+footer.height<=790,'Cage profile footer must fit the sheet');
console.log('Approved Cage card reused');
await page.locator('.class-student-pre-profile__close').click();
await page.locator('.class-student-pre-profile').waitFor({state:'detached'});
await page.locator('.classroom-seat__person').first().click();
await page.locator('.guest-offer').click();
await page.locator('.viewer-gift-sheet').waitFor();
assert.match(await page.locator('.viewer-gift-sheet').innerText(),/Sofia/);
console.log('Gift wall opened for selected artist');
console.log('Classe',grid);
assert.deepEqual(errors,[]);await browser.close();server.close();

