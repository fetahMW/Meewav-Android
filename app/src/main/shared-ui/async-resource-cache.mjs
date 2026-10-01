/** Shared work is cancelled only after its last consumer leaves. Running decoders
 * keep their concurrency slot until they finish, even if they cannot be aborted. */
export function createAsyncResourceCache(load, { maxConcurrent = 2, maxEntries = 32 } = {}) {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1 || !Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new RangeError('Resource cache limits must be positive integers');
  }
  const entries = new Map();
  const queue = [];
  let running = 0;
  const abortError = () => new DOMException('Resource no longer needed', 'AbortError');
  const remove = entry => { if (entries.get(entry.key) === entry) entries.delete(entry.key); };
  const trim = () => {
    for (const entry of entries.values()) {
      if (entries.size <= maxEntries) break;
      if (entry.state === 'ready' && entry.consumers === 0) remove(entry);
    }
  };
  const pump = () => {
    while (running < maxConcurrent && queue.length) {
      const entry = queue.shift();
      if (entry.state !== 'queued') continue;
      entry.state = 'running';
      running++;
      void Promise.resolve().then(() => {
        if (entry.controller.signal.aborted) throw abortError();
        return load(entry.key, { signal: entry.controller.signal });
      }).then(value => {
        if (entry.controller.signal.aborted) throw abortError();
        entry.state = 'ready';
        entry.resolve(value);
        trim();
      }).catch(error => {
        entry.state = 'failed';
        remove(entry);
        entry.reject(error);
      }).finally(() => { running--; pump(); });
    }
  };
  const acquire = key => {
    let entry = entries.get(key);
    if (!entry) {
      entry = { key, consumers: 0, state: 'queued', controller: new AbortController() };
      entry.promise = new Promise((resolve, reject) => { entry.resolve = resolve; entry.reject = reject; });
      // A consumer can leave before installing its promise handler.
      void entry.promise.catch(() => {});
      entries.set(key, entry);
      queue.push(entry);
    } else {
      entries.delete(key); entries.set(key, entry);
    }
    entry.consumers++;
    pump();
    let released = false;
    return {
      promise: entry.promise,
      release() {
        if (released) return;
        released = true;
        entry.consumers--;
        if (entry.consumers === 0 && (entry.state === 'queued' || entry.state === 'running')) {
          entry.controller.abort();
          remove(entry);
          if (entry.state === 'queued') {
            entry.state = 'cancelled';
            queue.splice(queue.indexOf(entry), 1);
            entry.reject(abortError());
          }
        }
        trim();
      },
    };
  };
  return { acquire };
}
