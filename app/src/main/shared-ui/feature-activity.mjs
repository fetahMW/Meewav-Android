/** Native inactivity has priority even when Android WebView reports a visible document. */
export function createFeatureActivityMonitor({ document: doc = globalThis.document, MutationObserver: Observer = globalThis.MutationObserver } = {}) {
  const listeners = new Set();
  let observer = null;
  let previous;
  const isActive = () => !doc || (!doc.hidden && !doc.documentElement.hasAttribute('data-profile-inactive'));
  const update = () => {
    const active = isActive();
    if (previous === active) return;
    previous = active;
    for (const { listener } of [...listeners]) listener(active);
  };
  const subscribe = listener => {
    if (!listeners.size) {
      previous = isActive();
      doc?.addEventListener('visibilitychange', update);
      if (doc && Observer) {
        observer = new Observer(update);
        observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['data-profile-inactive'] });
      }
    }
    const subscription = { listener };
    listeners.add(subscription);
    listener(isActive());
    return () => {
      listeners.delete(subscription);
      if (!listeners.size) {
        observer?.disconnect(); observer = null;
        doc?.removeEventListener('visibilitychange', update);
      }
    };
  };
  return { isActive, subscribe };
}

let shared;
const monitor = () => shared ??= createFeatureActivityMonitor();
export const isFeatureActive = () => monitor().isActive();
export const watchFeatureActivity = listener => monitor().subscribe(listener);
