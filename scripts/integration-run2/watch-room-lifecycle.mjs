// Read-only CDP observer for Room transitions. Use only with a forwarded QA emulator WebView.
// Usage: node watch-room-lifecycle.mjs PORT OUT_JSONL DURATION_MS ROOM_TITLE MARKER
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

const [port, output, durationRaw, title, marker] = process.argv.slice(2);
const durationMs = Number(durationRaw);
if (!/^\d{3,5}$/.test(port ?? '') || !output || !Number.isInteger(durationMs)
  || durationMs < 5000 || durationMs > 300000 || !title?.startsWith('QA_INT_')
  || !/^RUN2_[A-Z0-9_]+$/.test(marker ?? '')) {
  throw new Error('Expected port, output, duration, QA title and RUN2_ marker');
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
  const task = pending.get(message.id);
  if (!task) return;
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
const expression = `(() => {
  const body = document.body?.innerText || '';
  const stableBody = body.replace(/\\b\\d{2}:\\d{2}:\\d{2}\\b/g, '<timer>');
  const experience = document.querySelector('.place-room-experience');
  return { url: location.href, titleCount: body.split(${JSON.stringify(title)}).length - 1,
    markerCount: body.split(${JSON.stringify(marker)}).length - 1,
    experienceClass: experience?.className || null,
    endText: /room terminée|live terminé|live est terminé|room est terminée/i.test(body),
    body: stableBody.slice(0, 3000) };
})()`;
const record = item => appendFile(output, `${JSON.stringify({ at: new Date().toISOString(), ...item })}\n`);
let previous = '';
let samples = 0;
const stopAt = Date.now() + durationMs;
try {
  while (Date.now() < stopAt) {
    const state = (await evaluate(expression)).result?.value;
    const hash = createHash('sha256').update(JSON.stringify(state)).digest('hex');
    if (hash !== previous) {
      await record({ kind: 'state', sample: samples, hash, state });
      previous = hash;
    }
    samples += 1;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  await record({ kind: 'completed', samples });
} catch (error) {
  await record({ kind: 'observerError', message: String(error.message).slice(0, 300), samples });
  throw error;
} finally { ws.close(); }
