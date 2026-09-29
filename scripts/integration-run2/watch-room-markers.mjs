// Read-only CDP observer: record the first visible UI state and subsequent changes.
// Usage: node watch-room-markers.mjs PORT OUT_JSONL DURATION_MS ROOM_TITLE MARKER_1 MARKER_2
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const [port, output, durationRaw, title, ...markers] = process.argv.slice(2);
const durationMs = Number(durationRaw);
if (!/^\d{3,5}$/.test(port ?? '') || !output || !Number.isInteger(durationMs)
  || durationMs < 5000 || durationMs > 300000 || !title?.startsWith('QA_INT_')
  || markers.length < 1 || markers.some(marker => !/^RUN2_[A-Z0-9_]+$/.test(marker))) {
  throw new Error('Expected port, output, duration, QA title and RUN2_ markers');
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, '');
const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = pages.find(item => item.type === 'page' && /Rooms/i.test(item.title)
  && item.url?.includes('/rooms/'));
if (!page) throw new Error('Rooms WebView not found');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const task = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) task.reject(new Error(message.error.message));
  else task.resolve(message.result ?? {});
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
const evaluate = expression => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: {
    expression, returnByValue: true, awaitPromise: false,
  } }));
});
const expression = `(() => { const text = document.body?.innerText || ''; return {
  url: location.href, titleVisible: text.includes(${JSON.stringify(title)}),
  markers: ${JSON.stringify(markers)}.map(m => text.includes(m)),
  readyState: document.readyState
}; })()`;
const record = item => appendFile(output, `${JSON.stringify({ at: new Date().toISOString(), ...item })}\n`);
const stopAt = Date.now() + durationMs;
let previous = '';
let samples = 0;
try {
  while (Date.now() < stopAt) {
    const result = (await evaluate(expression)).result?.value;
    const state = JSON.stringify(result);
    if (state !== previous) { await record({ kind: 'state', sample: samples, state: result }); previous = state; }
    samples += 1;
    if (result?.titleVisible && result.markers?.every(Boolean)) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  await record({ kind: 'completed', samples });
} catch (error) {
  await record({ kind: 'observerError', message: String(error.message).slice(0, 300), samples });
  throw error;
} finally { ws.close(); }
