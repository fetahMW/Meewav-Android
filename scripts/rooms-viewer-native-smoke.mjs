import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=process.cwd(),assets=path.join(root,'app/src/main/assets/rooms');
const require=createRequire(path.resolve(root,'../Meewav-Web/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:393,height:790},isMobile:true,hasTouch:true});
 const controls=[],replies=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://appassets.androidplatform.net/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.startsWith('/native/')) {
   const data=JSON.parse(url.searchParams.get('data')||'{}');
   (url.pathname.endsWith('viewer-controls')?controls:replies).push(data);
   await route.fulfill({status:204,body:''});return;
  }
  const file=path.resolve(assets,url.pathname.replace(/^\/rooms\//,''));
  if(!file.startsWith(assets+path.sep)||!fs.existsSync(file)){await route.abort();return;}
  const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'}[path.extname(file)];
  await route.fulfill({path:file,...(type?{contentType:type}:{})});
 });
 await page.goto('https://appassets.androidplatform.net/rooms/index.html');
 await page.waitForFunction(()=>window.meewavMessaging);
 await page.evaluate(()=>window.meewavMessaging.configure({preview:true,url:'',key:'',token:null,userId:null,route:'/rooms'}));
 for(const room of ['La Cage','La Wave','La Classe','La Scène','La Loge','La Place']) {
  await page.getByRole('button',{name:new RegExp('Ouvrir .*'+room+'.*spectateurs')}).first().click();
  await page.locator('.place-studio-panel__tabs').waitFor();
  await page.locator('[data-surface="chat"]').click();
  await page.waitForTimeout(250);
  assert.equal(controls.at(-1).mode,'composer');
  assert.ok(controls.at(-1).height>=50);
  const id='test-'+room,text='Native '+room+' [[mw:coeur-casque]]';
  await page.evaluate(({id,text})=>window.dispatchEvent(new CustomEvent('meewav:native-viewer-action',{detail:{action:'chat',data:{id,text}}})),{id,text});
  await page.waitForTimeout(250);
  assert.ok(replies.some(reply=>reply.id===id&&reply.ok),room+' chat acknowledgment');
  await page.getByText('Native '+room,{exact:false}).first().waitFor();
  await page.locator('[data-surface="mixer"]').click();await page.waitForTimeout(250);
  assert.equal(controls.at(-1).mode,'mixer');
  assert.ok(controls.at(-1).height>200);
  await page.locator('[data-surface="tools"]').click();await page.waitForTimeout(250);
  assert.equal(controls.at(-1).mode,'none');
  await page.getByRole('button',{name:'Retour aux rooms',exact:true}).click();await page.waitForTimeout(100);
  assert.equal(controls.at(-1).room,'');
  console.log(room+' native bridge OK');
 }
 assert.deepEqual(errors,[]);
} finally {await browser.close();}
