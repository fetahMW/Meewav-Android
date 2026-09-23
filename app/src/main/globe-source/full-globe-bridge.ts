import type { Root } from 'react-dom/client';

let status: 'loading' | 'ready' | 'error' = 'loading';
let active = true;
let disposed = false;
let root: Root | undefined;
const engine = () => (window as any).__meewavEngine;

function updateActivity() {
  document.dispatchEvent(new CustomEvent('globelab-lifecycle', {
    detail: { active: active && !document.hidden && !disposed },
  }));
}

// Build-time substitution for the iframe host bridge, leaving the imported
// Web sources untouched. No credentials or JavaScript-to-Android interface.
export function notifyHost(next: typeof status) {
  if (disposed) return;
  status = next;
  if (next === 'ready') updateActivity();
}

export function attachRoot(value: Root) { root = value; }

function dispose() {
  if (disposed) return;
  disposed = true;
  updateActivity();
  root?.unmount(); // App cleanup destroys the engine, workers and GPU resources.
  root = undefined;
  delete (window as any).__meewavEngine;
  window.removeEventListener('pagehide', dispose);
}

window.addEventListener('pagehide', dispose);
window.addEventListener('meewav:navigate', (event: Event) => {
  const path = (event as CustomEvent).detail?.path;
  if (typeof path !== 'string' || !/^\/(?:messages|profile|tremplin|market|scene|shorts|rooms)(?:[/?]|$)/.test(path)) return;
  event.preventDefault();
  const destination = path.split('/')[1].split('?')[0] === 'shorts' ? 'scene' : path.split('/')[1].split('?')[0];
  location.assign(`https://appassets.androidplatform.net/native/${destination}?route=${encodeURIComponent(path)}`);
});
(window as any).meewavFullGlobe = Object.freeze({
  get status() { return status; },
  setActive(value: boolean) { active = value === true; updateActivity(); },
  setInteractive() { /* The full scene always uses the Web gesture handlers. */ },
  zoomIn() { engine()?.zoom(0.55); },
  zoomOut() { engine()?.zoom(1.8); },
  rotateLeft() {
    const current = engine();
    if (current) current.flyTo({ ...current.getPreviewSnapshot().view,
      lon: current.getPreviewSnapshot().view.lon - 15 }, 350);
  },
  rotateRight() {
    const current = engine();
    if (current) current.flyTo({ ...current.getPreviewSnapshot().view,
      lon: current.getPreviewSnapshot().view.lon + 15 }, 350);
  },
  resetView() {
    const current = engine();
    if (current) current.flyTo(current.getOverviewTarget('globe'), 500);
  },
  dispose,
});
