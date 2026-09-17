// Minimal CDP helper: node scripts/cdp-eval.mjs <port> <pageTitleContains> <jsFile|inlineJs> [--shot out.png] [--wait ms]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const port = process.argv[2] || '9223';
const titleMatch = process.argv[3] || 'Tremplin';
let expr = process.argv[4] || '1+1';
const shotIdx = process.argv.indexOf('--shot');
const shotPath = shotIdx > -1 ? process.argv[shotIdx + 1] : null;
const waitIdx = process.argv.indexOf('--wait');
const waitMs = waitIdx > -1 ? Number(process.argv[waitIdx + 1]) : 0;

if (existsSync(expr)) expr = readFileSync(expr, 'utf8');

const list = await (await fetch(`http://localhost:${port}/json`)).json();
const page = list.find((p) => p.type === 'page' && p.title.includes(titleMatch));
if (!page) { console.error('page not found', list.map((p) => p.title)); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res) => {
  const mid = ++id;
  pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params }));
});
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result ?? msg); pending.delete(msg.id); }
};
await new Promise((r) => { ws.onopen = r; });

const result = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
console.log(JSON.stringify(result?.result?.value ?? result, null, 2));

if (waitMs) await new Promise((r) => setTimeout(r, waitMs));

if (shotPath) {
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  console.log('saved', shotPath);
}
ws.close();
process.exit(0);
