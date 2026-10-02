import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavigationDockMode } from '../../app/src/main/shared-ui/navigation-dock-mode.mjs';

function fixture(initial = 'app') {
  let receive, now = 0, timerId = 0, nativeMode = initial, nativeAvailable = true;
  const timers = new Map(), commands = [];
  const environment = {
    initialMode: () => initial,
    navigate: url => commands.push(new URL(url)),
    subscribe: callback => { receive = callback; return () => { receive = null; }; },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
  };
  const store = createNavigationDockMode(environment);
  const advance = duration => {
    now += duration;
    for (;;) {
      const ready = [...timers].find(([, timer]) => timer.at <= now);
      if (!ready) break;
      timers.delete(ready[0]); ready[1].callback();
    }
  };
  const acknowledge = (index = commands.length - 1) => {
    const command = commands[index];
    if (command.searchParams.has('value')) nativeMode = command.searchParams.get('value');
    if (command.searchParams.has('dock')) nativeAvailable = command.searchParams.get('dock') === '1';
    receive({ mode: nativeMode, request: Number(command.searchParams.get('request')) });
  };
  return { store, commands, advance, acknowledge, receive: detail => receive(detail), environment,
    native: () => ({ mode: nativeMode, available: nativeAvailable }), timers };
}

test('native bootstrap applies a saved Samsung choice before mount', () => {
  const f = fixture('system');
  assert.deepEqual(f.store.getSnapshot(), { mode: 'system', pending: false });
  assert.equal(f.commands.length, 0);
  f.store.dispose();
});

test('a normal website never sends Android bridge commands', () => {
  const f = fixture(undefined);
  // Explicit null models the absence of a native bootstrap (default fixture is app).
  const web = createNavigationDockMode({ ...f.environment, initialMode: () => null });
  assert.equal(web.getSnapshot().mode, null);
  const release = web.retainDock();
  assert.equal(web.toggle(), false); release(); f.advance(2000);
  assert.equal(f.commands.length, 0);
  web.dispose(); f.store.dispose();
});

test('the chevron exchanges app/system and awaits the native acknowledgement', () => {
  const f = fixture();
  const release = f.store.retainDock(); f.advance(0); f.acknowledge();
  assert.equal(f.store.toggle(), true);
  assert.deepEqual(f.store.getSnapshot(), { mode: 'system', pending: true });
  const command = f.commands.at(-1);
  assert.equal(command.origin, 'https://appassets.androidplatform.net');
  assert.equal(command.pathname, '/native/navigation-mode');
  assert.equal(command.searchParams.get('dock'), '1');
  f.acknowledge();
  assert.deepEqual(f.native(), { mode: 'system', available: true });
  assert.deepEqual(f.store.getSnapshot(), { mode: 'system', pending: false });
  f.store.toggle(); f.acknowledge();
  assert.equal(f.store.getSnapshot().mode, 'app');
  release(); f.store.dispose();
});

test('rapid taps cannot issue conflicting mode requests', () => {
  const f = fixture();
  f.store.toggle();
  assert.equal(f.store.toggle(), false);
  assert.equal(f.commands.length, 1);
  f.acknowledge();
  assert.equal(f.store.toggle(), true);
  assert.equal(f.commands.length, 2);
  f.store.dispose();
});

test('availability handshake is serialized ahead of an early chevron tap without visual bounce', () => {
  const f = fixture();
  f.store.retainDock(); f.advance(0);
  f.store.toggle();
  assert.equal(f.commands.length, 1);
  f.acknowledge(0);
  assert.deepEqual(f.store.getSnapshot(), { mode: 'system', pending: true });
  assert.equal(f.commands.length, 2);
  f.acknowledge(1);
  assert.deepEqual(f.store.getSnapshot(), { mode: 'system', pending: false });
  f.store.dispose();
});

test('temporary pages without a dock never overwrite the preferred owner', () => {
  const f = fixture('system');
  const release = f.store.retainDock(); f.advance(0); f.acknowledge();
  release(); f.advance(0);
  const absent = f.commands.at(-1);
  assert.equal(absent.searchParams.get('dock'), '0');
  assert.equal(absent.searchParams.has('value'), false);
  f.acknowledge();
  assert.deepEqual(f.native(), { mode: 'system', available: false });
  f.store.retainDock(); f.advance(0); f.acknowledge();
  assert.deepEqual(f.native(), { mode: 'system', available: true });
  f.store.dispose();
});

test('replacement of a dock during local route navigation does not flash Samsung bars', () => {
  const f = fixture();
  const release = f.store.retainDock(); f.advance(0); f.acknowledge();
  release(); const next = f.store.retainDock(); f.advance(0);
  assert.equal(f.commands.length, 1);
  next(); f.store.dispose();
});

test('keyboard or modal suspension exposes native navigation without losing the app preference', () => {
  const f = fixture('app');
  const suspend = f.store.retainDock(); f.advance(0); f.acknowledge();
  suspend(); f.advance(0); f.acknowledge();
  assert.deepEqual(f.native(), { mode: 'app', available: false });
  assert.deepEqual(f.store.getSnapshot(), { mode: 'app', pending: false });
  f.store.retainDock(); f.advance(0); f.acknowledge();
  assert.deepEqual(f.native(), { mode: 'app', available: true });
  f.store.dispose();
});

test('multiple mounted consumers keep the dock available until the last release', () => {
  const f = fixture();
  const first = f.store.retainDock(), second = f.store.retainDock();
  f.advance(0); f.acknowledge();
  first(); first(); f.advance(0);
  assert.equal(f.commands.length, 1);
  second(); f.advance(0);
  assert.equal(f.commands.length, 2);
  assert.equal(f.commands[1].searchParams.get('dock'), '0');
  f.store.dispose();
});

test('a stale acknowledgement cannot revert the latest mode or end its pending state', () => {
  const f = fixture();
  f.store.toggle(); f.acknowledge(); f.store.toggle();
  f.receive({ mode: 'system', request: 1 });
  assert.deepEqual(f.store.getSnapshot(), { mode: 'app', pending: true });
  f.acknowledge();
  assert.deepEqual(f.store.getSnapshot(), { mode: 'app', pending: false });
  f.store.dispose();
});

test('activity resume sync preserves a still pending user choice', () => {
  const f = fixture();
  f.store.toggle(); f.receive({ mode: 'app', request: 0 });
  assert.deepEqual(f.store.getSnapshot(), { mode: 'system', pending: true });
  f.acknowledge();
  f.receive({ mode: 'app', request: 0 });
  assert.deepEqual(f.store.getSnapshot(), { mode: 'app', pending: false });
  f.store.dispose();
});

test('bridge timeout restores the last confirmed state and permits another attempt', () => {
  const f = fixture();
  f.store.toggle(); f.advance(1500);
  assert.deepEqual(f.store.getSnapshot(), { mode: 'app', pending: false });
  assert.equal(f.store.toggle(), true);
  assert.equal(f.commands.length, 2);
  f.store.dispose();
});

test('a blocked URL navigation restores the confirmed state immediately', () => {
  const f = fixture();
  f.environment.navigate = () => { throw new Error('navigation blocked'); };
  assert.equal(f.store.toggle(), true);
  assert.deepEqual(f.store.getSnapshot(), { mode: 'app', pending: false });
  assert.equal(f.timers.size, 0);
  f.store.dispose();
});

test('invalid native messages cannot enable Android mode or alter a preference', () => {
  const f = fixture();
  const original = f.store.getSnapshot();
  f.receive({ mode: 'purple', request: 0 }); f.receive(null);
  assert.equal(f.store.getSnapshot(), original);
  f.store.dispose();
});

test('disposing a page removes timers and native subscriptions', () => {
  const f = fixture();
  f.store.retainDock(); f.advance(0); f.store.toggle(); f.store.dispose();
  f.advance(2000);
  assert.equal(f.timers.size, 0);
  assert.equal(f.commands.length, 1);
});
