// Read-only Android/CDP sampler for the five-cycle Maestro dock test.
// Writes only Activity names, counts, and a fixture/backend mode signal.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { appendFile, access } from 'node:fs/promises';

const exec = promisify(execFile);
const [device, output, stopFile] = process.argv.slice(2);
if (!device || !output || !stopFile) throw new Error('device, output, stopFile required');
const adb = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;
const port = 9224;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const shell = async (...args) => (await exec(adb, ['-s', device, ...args], { maxBuffer: 8_000_000 })).stdout;
let forwardedPid = '';
let previous = '';
let step = 0;

async function webViews() {
  const pid = (await shell('shell', 'pidof', 'com.meewav.android.debug')).trim();
  if (!pid) return { count: 0, mode: 'app-process-absent' };
  if (pid !== forwardedPid) {
    if (forwardedPid) await shell('forward', '--remove', `tcp:${port}`).catch(() => undefined);
    await shell('forward', `tcp:${port}`, `localabstract:webview_devtools_remote_${pid}`);
    forwardedPid = pid;
  }
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  const rooms = targets.filter(t => t.type === 'page' && t.url?.includes('/rooms/index.html'));
  let mode = 'feature-mode-inherited';
  for (const target of rooms) {
    if (!target.webSocketDebuggerUrl) continue;
    const state = await new Promise((resolve, reject) => {
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      const timeout = setTimeout(() => { ws.close(); reject(new Error('CDP timeout')); }, 1500);
      ws.addEventListener('open', () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
        expression: `JSON.stringify({visibility:document.visibilityState,fixture:!!document.querySelector('[aria-label*="Finale des nouveaux flows"]'),backend:performance.getEntriesByType('resource').filter(x=>x.name.includes('/rest/v1/rooms_v2')).length})`,
        returnByValue: true,
      } })));
      ws.addEventListener('message', event => {
        const response = JSON.parse(event.data);
        if (response.id !== 1) return;
        clearTimeout(timeout);
        ws.close();
        try { resolve(JSON.parse(response.result.result.value)); } catch { reject(new Error('CDP state unavailable')); }
      });
      ws.addEventListener('error', reject);
    });
    if (state.visibility === 'visible') mode = state.fixture ? 'DEMO-fixture' : state.backend > 0 ? 'LIVE-backend' : 'undetermined';
  }
  return { count: rooms.length, mode };
}

while (true) {
  try { await access(stopFile); break; } catch { /* keep sampling */ }
  try {
    const dump = await shell('shell', 'dumpsys', 'activity', 'activities');
    const top = dump.match(/topResumedActivity=ActivityRecord\{[^}]*?com\.meewav\.android\.debug\/([\w.$]+)/s)?.[1] ?? 'outside-app';
    const roomsActivities = [...dump.matchAll(/\* Hist\s+#\d+: ActivityRecord\{[^}]{0,220}com\.meewav\.android\.debug\/com\.meewav\.android\.features\.rooms\.RoomsActivity/gs)].length;
    const current = await webViews().catch(error => ({ count: -1, mode: `cdp-error:${error.message}` }));
    const signature = `${top}|${roomsActivities}|${current.count}|${current.mode}`;
    if (signature !== previous) {
      previous = signature;
      await appendFile(output, JSON.stringify({ step: ++step, at: new Date().toISOString(), top,
        roomsActivities, roomsWebViews: current.count, mode: current.mode }) + '\n');
    }
  } catch (error) {
    await appendFile(output, JSON.stringify({ step: ++step, at: new Date().toISOString(), error: error.message }) + '\n');
  }
  await pause(800);
}
if (forwardedPid) await shell('forward', '--remove', `tcp:${port}`).catch(() => undefined);
