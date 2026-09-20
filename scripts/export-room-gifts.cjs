// Export the canonical web component unchanged, including its SVG/CSS materials.
// Usage: node scripts/export-room-gifts.cjs C:/path/to/Meewav-Web
const fs=require('fs'),path=require('path'),{createRequire}=require('module');
const web=path.resolve(process.argv[2]);
const req=createRequire(path.join(web,'package.json'));
const ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
const {chromium}=req('playwright');
const source=fs.readFileSync(path.join(web,'src/features/profile/gifts/profileGiftCatalog.tsx'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const moduleResult={exports:{}};new Function('require','module','exports',compiled)(req,moduleResult,moduleResult.exports);
const {ROOM_STANDARD_GIFT_CATALOG,ProfileGiftObject}=moduleResult.exports;
const css=fs.readFileSync(path.join(web,'src/features/profile/profile.css'),'utf8').split(/\r?\n/).filter(l=>l.startsWith('.profile-gift-object')).join('\n');
const dest=path.resolve(__dirname,'../app/src/main/res/drawable-nodpi');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page=await browser.newPage({viewport:{width:108,height:104},deviceScaleFactor:4});
  for(let i=0;i<ROOM_STANDARD_GIFT_CATALOG.length;i++){
   const item=ROOM_STANDARD_GIFT_CATALOG[i];
   const html=renderToStaticMarkup(React.createElement(ProfileGiftObject,{item}));
   await page.setContent(`<style>*{box-sizing:border-box}html,body{margin:0;background:transparent}#asset{width:108px;height:104px;display:grid;place-items:center}${css}</style><div id="asset">${html}</div>`);
   await page.screenshot({path:path.join(dest,`room_gift_web_${i}.png`),omitBackground:true});
   process.stdout.write(item.name+'\n');
  }
 } finally {await browser.close()}
})().catch(e=>{process.stderr.write(String(e));process.exitCode=1});
