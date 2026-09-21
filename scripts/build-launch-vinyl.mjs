import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {featureLoadingHtml} from './feature-loading.mjs';
const require=createRequire(path.resolve('../Meewav-Web/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:288,height:288},deviceScaleFactor:3});
 await page.setContent(featureLoadingHtml('')+`<style>
 html,body{margin:0;background:transparent}
 .meewav-feature-loading{background:transparent;padding:0;gap:0}
 .meewav-feature-loading__artwork{width:184px}
 .meewav-feature-loading__text{display:none}
 .meewav-feature-loading .vinyl-rotor{animation:none}
 </style>`);
 await page.evaluate(()=>document.fonts.ready);
 fs.mkdirSync('app/src/main/res/drawable-xxhdpi',{recursive:true});
 // Render the existing code-native loader artwork for Android's system launch window.
 await page.screenshot({path:'app/src/main/res/drawable-xxhdpi/launch_vinyl.png',omitBackground:true});
} finally {await browser.close();}
