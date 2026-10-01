/** Device orientation remains stable when the on-screen keyboard reduces the
 * WebView height. Only layout changes; the renderer and camera stay mounted. */
const orientationEvent = 'meewav:globe-orientation';

export function getGlobeOrientation(): 'portrait' | 'landscape' {
  return document.documentElement.dataset.globeOrientation === 'landscape' ? 'landscape' : 'portrait';
}

export function subscribeGlobeOrientation(update: () => void) {
  window.addEventListener(orientationEvent, update);
  return () => window.removeEventListener(orientationEvent, update);
}

export function installGlobeLayout() {
  const orientation = window.screen.orientation;
  const update = () => {
    const type = orientation?.type;
    const next = type?.startsWith('portrait') ? 'portrait'
      : type?.startsWith('landscape') ? 'landscape'
      : window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    if (document.documentElement.dataset.globeOrientation === next) return;
    document.documentElement.dataset.globeOrientation = next;
    window.dispatchEvent(new Event(orientationEvent));
  };
  update();
  orientation?.addEventListener('change', update);
  window.addEventListener('resize', update, { passive: true });
  const dispose = () => {
    orientation?.removeEventListener('change', update);
    window.removeEventListener('resize', update);
    window.removeEventListener('pagehide', dispose);
  };
  window.addEventListener('pagehide', dispose);
  return dispose;
}
