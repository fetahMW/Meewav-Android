// Read-only WebView runtime snapshot through an ADB-forwarded DevTools socket.
// No cookies, tokens, request headers, or arbitrary DOM text leave the device.
const port = Number(process.argv[2] ?? '9223');
const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
const rooms = targets.filter(t => t.type === 'page' && t.url?.includes('/rooms/index.html'));
const result = { roomsWebViews: rooms.length, pages: [] };
for (const target of rooms) {
  const page = await new Promise((resolve, reject) => {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    const timeout = setTimeout(() => { ws.close(); reject(new Error('CDP timeout')); }, 5000);
    ws.addEventListener('open', () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
      expression: `JSON.stringify({route:location.pathname+location.search,visibility:document.visibilityState,inactive:document.documentElement.hasAttribute('data-profile-inactive'),visibleFixture:!!document.querySelector('[aria-label*="Finale des nouveaux flows"]'),roomCardCount:document.querySelectorAll('[aria-label^="Ouvrir "]').length,roomsBackendRequests:performance.getEntriesByType('resource').filter(x=>x.name.includes('/rest/v1/rooms_v2')).length})`,
      returnByValue: true,
    } })));
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timeout); ws.close();
      try { resolve(JSON.parse(message.result.result.value)); }
      catch { reject(new Error('CDP evaluation failed')); }
    });
    ws.addEventListener('error', error => { clearTimeout(timeout); reject(error); });
  });
  result.pages.push(page);
}
await new Promise(resolve => process.stdout.write(JSON.stringify(result, null, 2) + '\n', resolve));
process.exit(0);
