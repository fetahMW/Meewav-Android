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





await page.getByRole('button',{name:/Ouvrir .*La Loge.*spectateurs/}).first().click();
await page.locator('[data-surface="tools"]').click();
for(const width of [320,393,430]) {
 await page.setViewportSize({width,height:790});
 for(const tab of ['VIP','Questions','Invitations']) {
  await page.locator('.loge-viewer__tabs').getByRole('button',{name:tab,exact:true}).click();
  const overflow=await page.locator('.loge-viewer').evaluate(root=>{
   const bound=root.getBoundingClientRect();
   return [...root.querySelectorAll('article,section,textarea,button,p,blockquote')].filter(el=>el.getClientRects().length).filter(el=>{const r=el.getBoundingClientRect();return r.right>bound.right+1||r.left<bound.left-1||el.scrollWidth>el.clientWidth+2;}).map(el=>({cls:el.className,text:el.textContent.slice(0,60),width:el.clientWidth,scroll:el.scrollWidth}));
  });
  assert.deepEqual(overflow,[],`${width} ${tab}: no clipped content`);
  const inset=await page.locator('.loge-viewer__history article').evaluateAll(nodes=>nodes.map(el=>parseFloat(getComputedStyle(el).paddingLeft)));
  assert.ok(inset.every(value=>value>=14));
  console.log(width,tab,'bounds and padding OK');
 }
}
assert.deepEqual(errors,[]);await browser.close();server.close();
