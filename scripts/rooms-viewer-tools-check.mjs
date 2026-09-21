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

const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:2358,height:822},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:5187/rooms/index.html');
const rooms=[['place','La Place'],['wave','La Wave'],['classe','La Classe'],['scene','La Scène'],['loge','La Loge'],['cage','La Cage']];
await page.setContent('<html><body style="margin:0;display:flex;background:#16171c;color:#ddd;font:14px sans-serif">'+rooms.map(([id,label])=>`<section style="width:393px;flex:none"><div style="height:32px;text-align:center;line-height:32px">${label}</div><iframe name="${id}" src="http://127.0.0.1:5187/rooms/index.html" style="border:0;width:393px;height:790px"></iframe></section>`).join('')+'</body></html>');
for(const [id,label] of rooms){
 const frame=page.frame({name:id});await frame.waitForFunction(()=>window.meewavMessaging);
 await frame.evaluate(()=>window.meewavMessaging.configure({preview:true,url:'',key:'',token:null,userId:null,route:'/rooms'}));
 await frame.getByRole('button',{name:new RegExp('Ouvrir .*'+label+'.*spectateurs')}).first().click();
 await frame.locator('[data-surface="tools"]').click();
 await frame.waitForTimeout(300);
 if(id==='cage')await frame.evaluate(()=>window.dispatchEvent(new Event('cage-viewer-simulation-ready')));
 const metrics=await frame.locator('.place-studio-panel__surface:not([hidden])').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,scrolls:[el,...el.querySelectorAll('*')].filter(p=>['auto','scroll'].includes(getComputedStyle(p).overflowY)&&p.scrollHeight>p.clientHeight+1).map(p=>{p.scrollTop=100000;const r={cls:p.className,scroll:p.scrollTop,max:p.scrollHeight-p.clientHeight};p.scrollTop=0;return r})}));
 assert.equal(metrics.bg,'rgba(0, 0, 0, 0)');
 for(const scroll of metrics.scrolls)assert.ok(scroll.scroll>0);
 console.log(label,metrics);
}

await browser.close();server.close();
