import test from 'node:test';
import assert from 'node:assert/strict';
import { createAsyncResourceCache } from '../app/src/main/shared-ui/async-resource-cache.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test('deduplicates concurrent consumers and retains completed results', async () => {
  let calls = 0;
  const cache = createAsyncResourceCache(async () => { calls++; return { peaks: [1] }; });
  const a = cache.acquire('stem'), b = cache.acquire('stem');
  assert.equal(a.promise, b.promise);
  const value = await a.promise;
  a.release(); b.release();
  const c = cache.acquire('stem');
  assert.equal(await c.promise, value);
  assert.equal(calls, 1);
  c.release();
});

test('bounds simultaneous loads including their decoder work', async () => {
  const pending = new Map();
  let running = 0, peak = 0;
  const cache = createAsyncResourceCache(async key => {
    running++; peak = Math.max(peak, running);
    const task = deferred(); pending.set(key, task);
    try { return await task.promise; } finally { running--; }
  }, { maxConcurrent: 2 });
  const leases = ['a', 'b', 'c', 'd'].map(key => cache.acquire(key));
  await tick(); assert.deepEqual([...pending.keys()], ['a', 'b']);
  pending.get('a').resolve('A'); await tick();
  assert.deepEqual([...pending.keys()], ['a', 'b', 'c']);
  pending.get('b').resolve('B'); pending.get('c').resolve('C'); await tick();
  pending.get('d').resolve('D');
  assert.deepEqual(await Promise.all(leases.map(x => x.promise)), ['A', 'B', 'C', 'D']);
  assert.equal(peak, 2);
  leases.forEach(x => x.release());
});

test('does not abort shared work while another consumer needs it', async () => {
  const work = deferred(); let signal;
  const cache = createAsyncResourceCache((key, options) => { signal = options.signal; return work.promise; });
  const a = cache.acquire('a'), b = cache.acquire('a');
  await tick(); a.release(); a.release();
  assert.equal(signal.aborted, false);
  work.resolve(42); assert.equal(await b.promise, 42); b.release();
});

test('cancels queued work without fetching it', async () => {
  const work = deferred(), calls = [];
  const cache = createAsyncResourceCache(key => { calls.push(key); return work.promise; }, { maxConcurrent: 1 });
  const a = cache.acquire('a'), b = cache.acquire('b');
  b.release();
  await assert.rejects(b.promise, { name: 'AbortError' });
  work.resolve(1); await a.promise; await tick();
  assert.deepEqual(calls, ['a']); a.release();
});

test('aborts the last active fetch and allows a fresh acquisition', async () => {
  let calls = 0;
  const cache = createAsyncResourceCache((key, { signal }) => {
    calls++;
    if (calls > 1) return Promise.resolve('retry');
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('cancel', 'AbortError')), { once: true }));
  });
  const first = cache.acquire('a'); await tick(); first.release();
  await assert.rejects(first.promise, { name: 'AbortError' });
  const second = cache.acquire('a'); assert.equal(await second.promise, 'retry');
  assert.equal(calls, 2); second.release();
});

test('an unabortable decoder retains its slot and its abandoned result is discarded', async () => {
  const work = deferred(), calls = [];
  const cache = createAsyncResourceCache(key => { calls.push(key); return calls.length === 1 ? work.promise : Promise.resolve(key); }, { maxConcurrent: 1 });
  const first = cache.acquire('a'); await tick(); first.release();
  const next = cache.acquire('b'); await tick(); assert.deepEqual(calls, ['a']);
  work.resolve('abandoned PCM'); await assert.rejects(first.promise, { name: 'AbortError' });
  assert.equal(await next.promise, 'b'); next.release();
  const retry = cache.acquire('a'); assert.equal(await retry.promise, 'a'); retry.release();
  assert.deepEqual(calls, ['a', 'b', 'a']);
});

test('failed loads can be retried', async () => {
  let calls = 0;
  const cache = createAsyncResourceCache(async () => { if (++calls === 1) throw new Error('network'); return 'ok'; });
  const first = cache.acquire('a'); await assert.rejects(first.promise, /network/); first.release();
  const second = cache.acquire('a'); assert.equal(await second.promise, 'ok'); second.release();
});

test('evicts least recently used completed results', async () => {
  const calls = [];
  const cache = createAsyncResourceCache(async key => { calls.push(key); return key; }, { maxEntries: 2 });
  for (const key of ['a', 'b', 'a', 'c', 'b']) { const lease = cache.acquire(key); await lease.promise; lease.release(); }
  assert.deepEqual(calls, ['a', 'b', 'c', 'b']);
});

test('never evicts a result still held by a consumer', async () => {
  const calls = [];
  const cache = createAsyncResourceCache(async key => { calls.push(key); return key; }, { maxEntries: 1 });
  const a = cache.acquire('a'); await a.promise;
  const b = cache.acquire('b'); await b.promise; b.release();
  const again = cache.acquire('a'); assert.equal(await again.promise, 'a'); again.release(); a.release();
  assert.deepEqual(calls, ['a', 'b']);
});

test('cancelling before the load microtask never starts a fetch', async () => {
  let calls = 0;
  const cache = createAsyncResourceCache(async () => { calls++; });
  const lease = cache.acquire('a'); lease.release();
  await assert.rejects(lease.promise, { name: 'AbortError' });
  assert.equal(calls, 0);
});

test('rejects unusable concurrency and cache limits', () => {
  assert.throws(() => createAsyncResourceCache(() => {}, { maxConcurrent: 0 }), RangeError);
  assert.throws(() => createAsyncResourceCache(() => {}, { maxEntries: -1 }), RangeError);
});
