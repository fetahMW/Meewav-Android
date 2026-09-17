// CDP helper: evaluate an expression in a page and/or capture a clipped screenshot.
// Usage: node scripts/cdp-shot.mjs <port> <titleMatch> <expr|-> [clipJson] [outFile]
import fs from 'node:fs';

const [port = '9223', titleMatch, expr = '-', clipJson, outFile = `${process.env.TEMP}/cdp-shot.png`] = process.argv.slice(2);
const list = await (await fetch(`http://localhost:${port}/json`)).json();
const page = list.find(p => p.type === 'page' && (p.title + ' ' + p.url).includes(titleMatch));
if (!page) { console.error('no page', titleMatch, list.map(p => p.title)); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
const send = (m, p = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m); pend.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Runtime.enable'); await send('Page.enable');
if (expr !== '-') {
  const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  console.log(JSON.stringify(res.result?.value ?? res.result ?? res, null, 1));
}
if (clipJson) {
  await new Promise(r => setTimeout(r, 600));
  const clip = JSON.parse(clipJson);
  const shot = await send('Page.captureScreenshot', { clip, scale: clip.scale ?? 2 });
  fs.writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
  console.log('saved', outFile);
}
process.exit(0);
