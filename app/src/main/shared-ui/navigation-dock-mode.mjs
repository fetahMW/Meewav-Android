const validMode = value => value === 'app' || value === 'system';

/** One owner choice per native application, hydrated before the React mount.
 * Availability is separate: a page without a dock must keep Android back/home.
 * Local URL commands are serialized and acknowledged by the native host. */
export function createNavigationDockMode(environment) {
  let snapshot = Object.freeze({ mode: null, pending: false });
  let authoritative = null;
  let flight = null, queued = null, sequence = 0, leases = 0, presenceTimer = null;
  let lastPresence = null;
  const listeners = new Set();
  const update = (mode, pending) => {
    if (snapshot.mode === mode && snapshot.pending === pending) return;
    snapshot = Object.freeze({ mode, pending });
    for (const listener of listeners) listener();
  };
  const hydrate = () => {
    if (snapshot.mode !== null) return;
    const value = environment.initialMode();
    if (validMode(value)) { authoritative = value; update(value, false); }
  };
  const sendNext = () => {
    if (flight || !queued || snapshot.mode === null) return;
    const intent = queued;
    queued = null;
    const id = ++sequence;
    const url = new URL('https://appassets.androidplatform.net/native/navigation-mode');
    url.searchParams.set('request', String(id));
    if (intent.mode) url.searchParams.set('value', intent.mode);
    if (typeof intent.available === 'boolean') url.searchParams.set('dock', intent.available ? '1' : '0');
    const timer = environment.setTimeout(() => {
      if (flight?.id !== id) return;
      flight = null;
      // A failed bridge cannot leave a misleading collapsed dock forever.
      queued = null;
      lastPresence = null;
      update(authoritative, false);
    }, 1500);
    flight = { id, timer, mode: intent.mode };
    try { environment.navigate(url.href); }
    catch { environment.clearTimeout(timer); flight = null; queued = null; update(authoritative, false); }
  };
  const request = intent => {
    hydrate();
    if (snapshot.mode === null) return;
    queued = { ...queued, ...intent };
    if (intent.mode) update(intent.mode, true);
    sendNext();
  };
  const receive = detail => {
    if (!validMode(detail?.mode)) return;
    hydrate();
    // An old URL acknowledgement cannot clear a newer in-flight command.
    if (detail.request && detail.request !== flight?.id) return;
    authoritative = detail.mode;
    if (detail.request && flight) {
      environment.clearTimeout(flight.timer);
      flight = null;
    }
    const intended = queued?.mode || flight?.mode;
    update(intended || authoritative, Boolean(intended));
    sendNext();
  };
  const stopReceiving = environment.subscribe(receive);
  return {
    getSnapshot() { hydrate(); return snapshot; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    toggle() {
      hydrate();
      if (snapshot.mode === null || snapshot.pending) return false;
      request({ mode: snapshot.mode === 'app' ? 'system' : 'app', available: leases > 0 });
      return true;
    },
    retainDock() {
      hydrate();
      if (snapshot.mode === null) return () => {};
      leases++;
      if (presenceTimer !== null) environment.clearTimeout(presenceTimer);
      presenceTimer = environment.setTimeout(() => {
        presenceTimer = null;
        if (lastPresence !== true && leases > 0) { lastPresence = true; request({ available: true }); }
      }, 0);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        leases--;
        if (leases !== 0) return;
        if (presenceTimer !== null) environment.clearTimeout(presenceTimer);
        presenceTimer = environment.setTimeout(() => {
          presenceTimer = null;
          // React replacing one dock with another must not flash system bars.
          if (leases === 0 && lastPresence !== false) { lastPresence = false; request({ available: false }); }
        }, 0);
      };
    },
    dispose() {
      stopReceiving();
      if (flight) environment.clearTimeout(flight.timer);
      if (presenceTimer !== null) environment.clearTimeout(presenceTimer);
      flight = null; queued = null; listeners.clear();
    },
  };
}

const browser = typeof window === 'undefined' ? null : window;
const unavailableSnapshot = Object.freeze({ mode: null, pending: false });
export const navigationDockMode = browser ? createNavigationDockMode({
  initialMode: () => browser.__meewavNavigationMode
    ?? document.querySelector('meta[name="meewav-navigation-mode"]')?.getAttribute('content'),
  navigate: url => browser.location.assign(url),
  subscribe: receive => {
    const changed = event => receive(event.detail);
    browser.addEventListener('meewav:navigation-mode', changed);
    return () => browser.removeEventListener('meewav:navigation-mode', changed);
  },
  setTimeout: (callback, delay) => browser.setTimeout(callback, delay),
  clearTimeout: timer => browser.clearTimeout(timer),
}) : { getSnapshot: () => unavailableSnapshot, subscribe: () => () => {}, retainDock: () => () => {}, toggle: () => false };
