import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFeatureActivityMonitor } from '../app/src/main/shared-ui/feature-activity.mjs';

function fixture() {
  const attributes = new Set(), events = new Map();
  const observers = [];
  const doc = { hidden: false, documentElement: { hasAttribute: key => attributes.has(key) },
    addEventListener: (key, listener) => events.set(key, listener),
    removeEventListener: (key, listener) => { if (events.get(key) === listener) events.delete(key); } };
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe(target, options) { assert.equal(target, doc.documentElement); assert.deepEqual(options.attributeFilter, ['data-profile-inactive']); }
    disconnect() { this.disconnected = true; }
  }
  return { doc, observers, events, monitor: createFeatureActivityMonitor({ document: doc, MutationObserver: Observer }),
    native: active => { if (active) attributes.delete('data-profile-inactive'); else attributes.add('data-profile-inactive'); observers.filter(o => !o.disconnected).forEach(o => o.callback()); },
    visible: visible => { doc.hidden = !visible; events.get('visibilitychange')?.(); } };
}

test('native inactivity wins over a visible WebView document', () => {
  const f = fixture(), values = []; const stop = f.monitor.subscribe(value => values.push(value));
  f.native(false); f.visible(true); f.visible(false); f.visible(true);
  assert.deepEqual(values, [true, false]);
  f.native(true); assert.deepEqual(values, [true, false, true]); stop();
});
test('a hidden document wins over resumed native activity', () => {
  const f = fixture(), values = []; f.visible(false); const stop = f.monitor.subscribe(value => values.push(value));
  f.native(false); f.native(true); assert.deepEqual(values, [false]);
  f.visible(true); assert.deepEqual(values, [false, true]); stop();
});
test('duplicate state reports do not restart presentation timers', () => {
  const f = fixture(), values = []; const stop = f.monitor.subscribe(value => values.push(value));
  f.native(true); f.visible(true); f.native(false); f.native(false);
  assert.deepEqual(values, [true, false]); stop();
});
test('many components share one observer and cleanup waits for the last', () => {
  const f = fixture(), values = []; const stopA = f.monitor.subscribe(value => values.push(['a', value]));
  const stopB = f.monitor.subscribe(value => values.push(['b', value]));
  assert.equal(f.observers.length, 1); stopA(); f.native(false);
  assert.deepEqual(values, [['a', true], ['b', true], ['b', false]]);
  assert.equal(f.observers[0].disconnected, false); stopB();
  assert.equal(f.observers[0].disconnected, true); assert.equal(f.events.size, 0);
});
test('late observer notifications cannot call disposed subscribers', () => {
  const f = fixture(), values = []; const stop = f.monitor.subscribe(value => values.push(value));
  stop(); f.visible(false); f.native(false); f.observers[0].callback(); assert.deepEqual(values, [true]);
});
test('subscribing after cleanup reads current state and reattaches', () => {
  const f = fixture(); const stop = f.monitor.subscribe(() => {}); stop(); f.native(false);
  const values = []; const stopAgain = f.monitor.subscribe(value => values.push(value));
  assert.deepEqual(values, [false]); assert.equal(f.observers.length, 2);
  f.native(true); assert.deepEqual(values, [false, true]); stopAgain();
});
