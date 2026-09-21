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





await page.getByRole('button',{name:/Ouvrir .*La Classe.*spectateurs/}).first().click();
await page.locator('[data-surface="tools"]').click();
await page.locator('.classroom-seats').waitFor();
const grid=await page.locator('.classroom-seats').evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,count:el.children.length,height:el.getBoundingClientRect().height,scroll:el.scrollHeight}));
assert.equal(grid.columns,4);assert.equal(grid.count,24);assert.equal(await page.locator('.classe-student-heading').count(),0);
const layout=await page.locator('.classe-student-workspace').evaluate(el=>{
 const rect=e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,height:e.getBoundingClientRect().height});
 return {workspace:rect(el),content:rect(el.querySelector('.classe-student-content')),panel:rect(el.querySelector('.is-classroom')),roster:rect(el.querySelector('.classroom-roster')),last:rect(el.querySelector('.classroom-seat:last-child')),navbar:rect(el.querySelector('.classe-student-navbar'))};
});
console.log('Layout',layout);
assert.ok(layout.last.bottom<=layout.roster.bottom+1,'last row clipped by roster');
assert.ok(layout.last.bottom<=layout.content.bottom+1,'last row clipped by content');
assert.ok(layout.last.bottom<=layout.navbar.top,'last row obscured by navbar');
console.log('Classe',grid);assert.deepEqual(errors,[]);await browser.close();server.close();
