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




for(const [label,nav,labels] of [['La Loge','.loge-viewer__tabs',['VIP','Questions','Invitations']],['La Place','.place-tools-console__switch',['Tour de parole','Clash','Défis']],['La Classe','.classe-student-dock',[]]]) {
 await page.getByRole('button',{name:new RegExp('Ouvrir .*'+label+'.*spectateurs')}).first().click();
 await page.locator('[data-surface="tools"]').click();
 await page.locator(nav).waitFor();
 for(const text of labels){await page.locator(nav).getByRole(label==='La Place'?'tab':'button',{name:text,exact:true}).click();}
 if(label==='La Classe'){for(const name of ['Questions','Classe'])await page.locator(nav).getByRole('button',{name,exact:true}).click();}
 if(label==='La Loge'){
  assert.equal(await page.getByRole('region',{name:'Les listes de la Loge'}).isVisible(),true);
  assert.equal(await page.locator('.loge-viewer__content').getByText('Pour moi',{exact:true}).count(),0);
 }
 console.log(label,'navigation OK');
 await page.getByRole('button',{name:'Retour aux rooms',exact:true}).click();
}
assert.deepEqual(errors,[]);await browser.close();server.close();
