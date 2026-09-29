// Read-only RUN 1 CDP trace. Run before the single final Maestro tap.
// Usage: node capture-room-create-cdp.mjs PORT OUTPUT_JSONL DURATION_MS
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const [port, output, durationRaw] = process.argv.slice(2);
const durationMs = Number(durationRaw);
if (!/^\d{3,5}$/.test(port ?? '') || !output || !Number.isInteger(durationMs)
  || durationMs < 10_000 || durationMs > 600_000) {
  throw new Error('Expected CDP port, output JSONL and duration 10000..600000 ms');
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, '');
const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = pages.find(item => item.type === 'page' && /Rooms/i.test(item.title)
  && item.url?.includes('/rooms/'));
if (!page) throw new Error('Rooms WebView CDP page not found');

const redact = value => String(value ?? '').replace(/Bearer\s+\S+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted]');
const safeUrl = raw => {
  try {
    const url = new URL(raw);
    for (const key of ['apikey', 'access_token', 'refresh_token', 'token']) url.searchParams.delete(key);
    return url.toString();
  } catch { return redact(raw).slice(0, 500); }
};
const relevant = raw => /\/(rooms_v2|room_participants_v2|rooms_create_classe_v1|room-session|auth\/v1\/user)(?:\?|$|\/)/.test(raw ?? '');
const record = async (kind, data = {}) => appendFile(output,
  `${JSON.stringify({ at: new Date().toISOString(), kind, ...data })}\n`);

const ws = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const methods = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const task = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) task.reject(new Error(redact(message.error.message)));
    else task.resolve(message.result ?? {});
    return;
  }
  const p = message.params ?? {};
  let item;
  switch (message.method) {
    case 'Network.requestWillBeSent': {
      if (!relevant(p.request?.url)) break;
      methods.set(p.requestId, { url: p.request.url, method: p.request.method });
      item = { requestId: p.requestId, method: p.request.method, url: safeUrl(p.request.url),
        postData: p.request.method === 'POST' ? redact(p.request.postData).slice(0, 3000) : undefined,
        timestamp: p.timestamp };
      break;
    }
    case 'Network.responseReceived': {
      if (!relevant(p.response?.url)) break;
      item = { requestId: p.requestId, status: p.response.status,
        url: safeUrl(p.response.url), mimeType: p.response.mimeType, timestamp: p.timestamp };
      break;
    }
    case 'Network.loadingFailed': {
      if (!methods.has(p.requestId)) break;
      item = { requestId: p.requestId, errorText: redact(p.errorText), canceled: p.canceled,
        timestamp: p.timestamp };
      break;
    }
    case 'Network.loadingFinished': {
      const meta = methods.get(p.requestId);
      if (!meta || meta.method !== 'POST') break;
      void send('Network.getResponseBody', { requestId: p.requestId }).then(body =>
        record('Network.responseBody', { requestId: p.requestId, body: redact(body.body).slice(0, 3000),
          base64Encoded: body.base64Encoded })).catch(error =>
        record('Network.responseBodyUnavailable', { requestId: p.requestId, error: redact(error.message) }));
      break;
    }
    case 'Runtime.consoleAPICalled': {
      const args = (p.args ?? []).map(arg => arg.value ?? arg.description ?? '').map(redact);
      if (args[0] !== '[ROOMS_CREATE_UI_DIAG]' && p.type !== 'error' && p.type !== 'warning') break;
      item = { type: p.type, args, timestamp: p.timestamp };
      break;
    }
    case 'Runtime.exceptionThrown':
      item = { description: redact(p.exceptionDetails?.exception?.description
        ?? p.exceptionDetails?.text).slice(0, 3000), timestamp: p.timestamp };
      break;
    case 'Log.entryAdded':
      if (p.entry?.level !== 'error' && p.entry?.level !== 'warning') break;
      item = { level: p.entry.level, text: redact(p.entry.text).slice(0, 3000),
        timestamp: p.entry.timestamp };
      break;
    case 'Page.frameNavigated':
      item = { url: safeUrl(p.frame?.url), frameId: p.frame?.id };
      break;
    default: break;
  }
  if (item) void record(message.method, item);
};
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
for (const method of ['Network.enable', 'Runtime.enable', 'Log.enable', 'Page.enable']) await send(method);
const flag = await send('Runtime.evaluate', { expression: 'window.__ROOMS_CREATE_UI_DIAG = true',
  returnByValue: true });
await record('capture.started', { page: safeUrl(page.url), port: Number(port),
  durationMs, diagnosticFlagSet: flag.result?.value === true });
await new Promise(resolve => setTimeout(resolve, durationMs));
await record('capture.completed');
ws.close();
